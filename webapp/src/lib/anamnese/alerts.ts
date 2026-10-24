import type { Alerta, Anamnese } from "./types";
import { indicePHQ9Ideacao, itensInvertidosPSS10, itensInvertidosTSK11 } from "./questionnaires";
import { calcularPSQI } from "./psqi";

export function somaSemNulos(itens: (number | null)[]): number | null {
  if (itens.some((v) => v === null || v === undefined)) return null;
  return itens.reduce((acc: number, v) => acc + (v as number), 0);
}

export function escorePSS10(itens: (number | null)[]): number | null {
  if (itens.some((v) => v === null || v === undefined)) return null;
  const ajustado = itens.map((v, i) => (itensInvertidosPSS10.includes(i) ? 4 - (v as number) : (v as number)));
  return ajustado.reduce((a, b) => a + b, 0);
}

// TSK-11 é pontuado em escala 1-4 (diferente do PSS-10, que é 0-4), então o
// item invertido usa (1+4) - v em vez de (0+4) - v.
export function escoreTSK11(itens: (number | null)[]): number | null {
  if (itens.some((v) => v === null || v === undefined)) return null;
  const ajustado = itens.map((v, i) => (itensInvertidosTSK11.includes(i) ? 5 - (v as number) : (v as number)));
  return ajustado.reduce((a, b) => a + b, 0);
}

// Triagem curta validada (Kroenke et al.) - GAD-2 e PHQ-2 são,
// literalmente, os 2 primeiros itens do GAD-7/PHQ-9. Corte >=3 (0-6) é o
// mesmo usado na literatura de atenção primária para decidir se vale a
// pena aplicar o instrumento completo. Isso permite manter a anamnese
// mais curta para quem tria negativo, sem perder a pontuação completa
// para quem precisa dela.
// Porta do instrumento completo: GAD-2 >= 3 (corte padrão). PHQ-2 >= 2: o corte de 3 tem
// sensibilidade de 0,72 a 0,76, e o corte de 2 sobe a sensibilidade para ~0,91 (especificidade
// cai de ~0,85 para ~0,67) - o custo de baixar é só perguntar mais itens (revisão do PHQ-2,
// documento 10-Revisao-Cientifica-por-Agente.md). Para o GAD-2 não há dado conferido para
// mudar o corte.
export const CORTE_PORTA_GAD2 = 3;
export const CORTE_PORTA_PHQ2 = 2;

export function escoreCurto(itens: (number | null)[]): number | null {
  return somaSemNulos(itens.slice(0, 2));
}

export function precisaInstrumentoCompleto(itens: (number | null)[], corte: number = CORTE_PORTA_GAD2): boolean {
  const curto = escoreCurto(itens);
  return curto !== null && curto >= corte;
}

// Nome curto de cada item do PAR-Q+ para os alertas (o texto completo da pergunta está na
// aba Anamnese, em "Prontidão e segurança").
export const ROTULO_CURTO_PARQ: Record<string, string> = {
  heart_condition: "condição cardíaca ou pressão alta (diagnosticada por médico)",
  chest_pain: "dor no peito",
  dizziness: "tontura, perda de equilíbrio ou de consciência",
  bone_joint: "problema ósseo ou articular que pode piorar com o esforço",
  bp_or_heart_med: "remédio para pressão ou para o coração",
  other_reason: "outro motivo para não fazer atividade física agora",
};

// Itens do PAR-Q+ com resposta positiva, em nome curto (com o detalhe de "outro motivo", se houver).
export function itensParqPositivos(a: Anamnese): string[] {
  const parq = a.prontidao.parq as Record<string, boolean | null>;
  return Object.keys(ROTULO_CURTO_PARQ)
    .filter((k) => parq[k] === true)
    .map((k) => {
      const detalhe = k === "other_reason" ? (a.prontidao.other_reason_detalhe || "").trim() : "";
      return detalhe ? `${ROTULO_CURTO_PARQ[k]} (“${detalhe}”)` : ROTULO_CURTO_PARQ[k];
    });
}

export function descricaoAlertaParq(a: Anamnese): string {
  const itens = itensParqPositivos(a);
  return `PAR-Q+: resposta positiva em ${itens.length} item(ns) de prontidão para exercício: ${itens.join("; ")}.`;
}

// Fichas gravadas antes desta mudança guardam o alerta do PAR-Q+ sem dizer quais itens; na exibição o
// texto é refeito com as respostas atuais da anamnese (nada é regravado no banco).
export function alertasComItensParq(alertas: Alerta[], a: Anamnese): Alerta[] {
  if (itensParqPositivos(a).length === 0) return alertas;
  return alertas.map((al) =>
    al.origem === "Prontidão e segurança" && al.descricao.startsWith("PAR-Q+: resposta positiva em")
      ? { ...al, descricao: descricaoAlertaParq(a) }
      : al
  );
}

// Gera a lista de alertas (Nível 1-4) a partir das respostas da anamnese,
// seguindo exatamente os critérios definidos em
// 00-Arquitetura-Geral-dos-Agentes.md (Seção 7) e
// 01-Agente2-Anamnese-e-Questionarios.md.
export function calcularAlertas(a: Anamnese): Alerta[] {
  const alertas: Alerta[] = [];
  const agora = new Date().toISOString();
  const add = (nivel: Alerta["nivel"], descricao: string, origem: string) =>
    alertas.push({ nivel, descricao, origem, data: agora });

  if (a.historico_saude.quedas_12m) {
    add(2, "Histórico de quedas nos últimos 12 meses.", "Histórico de saúde");
  }

  const parq = a.prontidao.parq;
  const parqPositivos = Object.entries(parq).filter(([, v]) => v === true);
  if (parqPositivos.length > 0) {
    const graves = parqPositivos.some(([k]) => k === "chest_pain" || k === "heart_condition");
    add(graves ? 3 : 2, descricaoAlertaParq(a), "Prontidão e segurança");
  }

  if (a.dor.tem_dor && a.dor.bandeiras_vermelhas.length > 0) {
    add(4, `Bandeira(s) vermelha(s) de dor relatada(s): ${a.dor.bandeiras_vermelhas.join(", ")}.`, "Dor");
  }

  if (a.saude_mental.sinalizacao === "sim") {
    add(
      2,
      "O paciente relatou que estresse, ansiedade ou humor atrapalham bastante o dia a dia (pergunta inicial). Oferecer o questionário de bem-estar emocional e acolher.",
      "Saúde mental"
    );
  }

  const phq9Item9 = a.saude_mental.phq9[indicePHQ9Ideacao];
  if (phq9Item9 !== null && phq9Item9 !== undefined && phq9Item9 > 0) {
    add(
      4,
      "PHQ-9: resposta positiva ao item sobre pensamentos de autolesão. Encaminhamento e acolhimento imediato prioritários.",
      "Saúde mental"
    );
  }

  const gad7Score = somaSemNulos(a.saude_mental.gad7);
  if (gad7Score !== null && gad7Score >= 15) {
    add(2, `GAD-7 = ${gad7Score}/21 (faixa sugestiva de ansiedade importante) - triagem, não diagnóstico.`, "Saúde mental");
  }

  const phq9Score = somaSemNulos(a.saude_mental.phq9);
  if (phq9Score !== null && phq9Score >= 15) {
    add(2, `PHQ-9 = ${phq9Score}/27 (faixa sugestiva de sintomas depressivos importantes) - triagem, não diagnóstico.`, "Saúde mental");
  }

  const psqi = calcularPSQI(a);
  if (psqi !== null && psqi.global > 5) {
    add(1, `PSQI = ${psqi.global}/21, acima do corte de 5 proposto pelos autores do instrumento para sono de má qualidade.`, "Sono");
  }

  return alertas;
}

export const rotuloNivel: Record<Alerta["nivel"], string> = {
  1: "Observação",
  2: "Atenção",
  3: "Precaução ativa",
  4: "Encaminhamento recomendado",
};

export const corNivel: Record<Alerta["nivel"], string> = {
  1: "info",
  2: "warn",
  3: "warn",
  4: "danger",
};
