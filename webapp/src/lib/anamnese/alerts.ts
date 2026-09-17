import type { Alerta, Anamnese } from "./types";
import { indicePHQ9Ideacao, itensInvertidosPSS10 } from "./questionnaires";

export function somaSemNulos(itens: (number | null)[]): number | null {
  if (itens.some((v) => v === null || v === undefined)) return null;
  return itens.reduce((acc: number, v) => acc + (v as number), 0);
}

export function escorePSS10(itens: (number | null)[]): number | null {
  if (itens.some((v) => v === null || v === undefined)) return null;
  const ajustado = itens.map((v, i) => (itensInvertidosPSS10.includes(i) ? 4 - (v as number) : (v as number)));
  return ajustado.reduce((a, b) => a + b, 0);
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
    add(
      graves ? 3 : 2,
      `PAR-Q+: resposta positiva em ${parqPositivos.length} item(ns) de prontidão para exercício.`,
      "Prontidão e segurança"
    );
  }

  if (a.dor.tem_dor && a.dor.bandeiras_vermelhas.length > 0) {
    add(4, `Bandeira(s) vermelha(s) de dor relatada(s): ${a.dor.bandeiras_vermelhas.join(", ")}.`, "Dor");
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
