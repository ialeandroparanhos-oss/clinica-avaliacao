// Pareceres dos agentes (texto de apoio ao avaliador) em dois estilos:
//  - "sucinto": o essencial, uma linha por tema;
//  - "explicativo": o mesmo conteúdo com o critério usado, como ler o resultado,
//    os limites e os próximos passos.
//
// Todos os textos saem dos mesmos resultados que o painel integrado já calcula
// (lib/integracao/perfil.ts) - o parecer não inventa classificação nova. Regra
// fixa: linguagem descritiva, nunca diagnóstico; dado ausente é "a investigar".

import type { Alerta, PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { linhasDorPorRegiao } from "@/lib/anamnese/dorPorRegiao";
import { escorePSS10, rotuloNivel } from "@/lib/anamnese/alerts";
import { calcularPSQI } from "@/lib/anamnese/psqi";
import { calcularRiscoCardiovascular } from "@/lib/anamnese/riscoCardiovascular";
import { perguntasParQ } from "@/lib/anamnese/questionnaires";
import { calcularPerfilIntegrado, type Classificacao, type DomainKey, type DomainResult } from "@/lib/integracao/perfil";
import { paraNumero } from "@/lib/numeros";

export type EstiloParecer = "sucinto" | "explicativo";
export type AgenteParecer = "anamnese" | "fisica" | "funcional" | "cardio" | "perfil";

export const ROTULO_ESTILO: Record<EstiloParecer, string> = {
  sucinto: "Sucinto e objetivo",
  explicativo: "Mais explicativo",
};

const ROTULO_CLASSE: Record<Classificacao, string> = {
  adequado: "ADEQUADO",
  atencao: "ATENÇÃO",
  prioridade: "PRIORIDADE",
  investigar: "A INVESTIGAR",
};

// Como o sistema lê cada domínio (espelha as regras de lib/integracao/perfil.ts).
const EXPLICACAO: Record<DomainKey, { avalia: string; criterio: string }> = {
  forca: {
    avalia: "força muscular geral, a partir da dinamometria de preensão, do 5x Sentar-e-Levantar e dos testes de Rikli & Jones.",
    criterio:
      "ponto de corte único: qualquer indicador abaixo do corte conta como força reduzida (dinamometria: referência brasileira para 60+ e EWGSOP2 nas demais idades; 5x Sentar-e-Levantar acima de 15 s; ou dois testes de Rikli & Jones abaixo do limite).",
  },
  mobilidade: {
    avalia: "mobilidade e padrões de movimento, a partir das observações posturais e de movimento registradas pelo avaliador.",
    criterio: "o sistema só procura palavras de atenção no texto (assimetria, compensação, restrição, valgo...). É um aviso para leitura, não uma medida: leia sempre o texto completo.",
  },
  equilibrio: {
    avalia: "equilíbrio e risco de queda.",
    criterio: "queda nos últimos 12 meses tem precedência; sem queda, apoio unipodal abaixo de 10 s no lado mais fraco é lido como atenção (referência comumente citada, não um limite validado para todos).",
  },
  capacidade_cardiorrespiratoria: {
    avalia: "capacidade cardiorrespiratória (VO2máx estimado e velocidade de marcha).",
    criterio:
      "VO2máx classificado por idade e sexo pelos percentis de esteira do registro FRIEND; velocidade de marcha com cortes de 0,8 e 1,0 m/s (EWGSOP2). Quando há mais de um indicador, vale a média das notas (0 adequado, 1 atenção, 2 prioridade).",
  },
  composicao_corporal: {
    avalia: "composição corporal e distribuição de gordura.",
    criterio: "IMC (OMS), relação cintura/estatura (corte de 0,5, NICE) e circunferência de cintura (OMS, por sexo). O IMC sozinho não diferencia massa magra de gordura: a adiposidade é confirmada pelas medidas de cintura e, quando houver, pelo percentual de gordura.",
  },
  dor: {
    avalia: "dor relatada na anamnese.",
    criterio: "bandeira vermelha ou intensidade de 7/10 ou mais = prioridade; dor sem esses sinais = atenção; sem dor = adequado.",
  },
  estilo_de_vida: {
    avalia: "atividade física atual, estresse percebido e barreiras ao exercício.",
    criterio: "estresse de 8/10 ou mais = prioridade; estresse de 5/10 ou mais, sedentarismo ou três ou mais barreiras = atenção.",
  },
  sono: {
    avalia: "qualidade do sono.",
    criterio: "PSQI: acima de 5 indica sono de má qualidade e acima de 10 foi tratado como prioridade; sem PSQI completo, usam-se as perguntas curtas de triagem.",
  },
  bem_estar: {
    avalia: "saúde mental e bem-estar (triagem, não diagnóstico).",
    criterio: "GAD-7 e PHQ-9: 10 ou mais = atenção; 15 ou mais = prioridade. Item de ideação de autolesão positivo = prioridade imediata. A pergunta inicial do questionário base só decide se o questionário de bem-estar é oferecido.",
  },
  funcionalidade: {
    avalia: "funcionalidade e risco de queda, com o TUG como indicador principal.",
    criterio: "TUG de 12 s ou mais = atenção (corte de triagem do STEADI); 13,5 s ou mais = prioridade. O TUG confirma risco melhor do que o descarta: interpretar junto com os demais testes.",
  },
};

const PROXIMO_PASSO: Record<Classificacao, string> = {
  adequado: "manter e usar como ponto forte no plano; reavaliar no prazo combinado.",
  atencao: "incluir no plano com meta e indicador de reavaliação.",
  prioridade: "tratar como prioridade no plano e avaliar necessidade de encaminhamento.",
  investigar: "coletar o dado que falta antes de concluir.",
};

const AGENTES: Record<AgenteParecer, { nome: string; titulo: string; dominios: DomainKey[]; limites: string[] }> = {
  anamnese: {
    nome: "Sofia",
    titulo: "Anamnese",
    dominios: ["dor", "sono", "estilo_de_vida", "bem_estar"],
    limites: [
      "A anamnese é autorrelato: depende de como o paciente entendeu e quis responder, e deve ser confirmada na conversa.",
      "Escalas de sono, humor e ansiedade são triagem, não diagnóstico.",
    ],
  },
  fisica: {
    nome: "Marco",
    titulo: "Avaliação física e antropométrica",
    dominios: ["composicao_corporal"],
    limites: [
      "O IMC não separa massa magra de gordura; use as circunferências e, quando houver, o percentual de gordura.",
      "Medidas antropométricas variam com a técnica e o avaliador: padronize os pontos de medida nas reavaliações.",
    ],
  },
  funcional: {
    nome: "Rita",
    titulo: "Avaliação funcional",
    dominios: ["forca", "equilibrio", "funcionalidade", "mobilidade"],
    limites: [
      "Cada teste mede um aspecto: nenhum, isolado, define a capacidade funcional.",
      "Os cortes são referências populacionais; o contexto (dor, medicamentos, cansaço no dia) pode alterar o resultado.",
    ],
  },
  cardio: {
    nome: "Caio",
    titulo: "Avaliação cardiorrespiratória",
    dominios: ["capacidade_cardiorrespiratoria"],
    limites: [
      "O VO2máx dos testes de campo e de esteira submáximos é uma estimativa, com erro de alguns mL/kg/min.",
      "Só o VO2 medido em ergoespirometria é medida direta.",
    ],
  },
  perfil: {
    nome: "Íris",
    titulo: "Perfil integrado",
    dominios: [],
    limites: [
      "A integração cruza resultados de instrumentos diferentes: nenhum domínio define o paciente.",
      "O perfil não é diagnóstico; é um mapa para decidir prioridades junto com o paciente.",
    ],
  },
};

export function nomeAgente(agente: AgenteParecer): string {
  return AGENTES[agente].nome;
}

function primeiraFrase(texto: string): string {
  const partes = texto.split(/\.\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/);
  const f = partes[0].trim();
  return f.endsWith(".") ? f : f + ".";
}

function dominio(perfil: ReturnType<typeof calcularPerfilIntegrado>, chave: DomainKey): DomainResult {
  return perfil.dominios.find((d) => d.chave === chave)!;
}

function linhaDominio(d: DomainResult, estilo: EstiloParecer): string[] {
  if (estilo === "sucinto") return [`- ${d.titulo}: ${ROTULO_CLASSE[d.classificacao]}. ${primeiraFrase(d.justificativa)}`];
  const e = EXPLICACAO[d.chave];
  return [
    `${d.titulo.toUpperCase()} - ${ROTULO_CLASSE[d.classificacao]}`,
    `- Resultado: ${d.justificativa}`,
    `- O que avalia: ${e.avalia}`,
    `- Critério: ${e.criterio}`,
    `- Próximo passo: ${PROXIMO_PASSO[d.classificacao]}`,
    "",
  ];
}

function fmt(v: number | null, casas = 0, un = ""): string | null {
  return v === null ? null : `${v.toFixed(casas).replace(".", ",")}${un ? ` ${un}` : ""}`;
}

// ---------------------------------------------------------------------------
// Dados registrados em cada área (linha de apoio ao parecer)
// ---------------------------------------------------------------------------
function dadosFisica(p: PacienteRow): string[] {
  const f = p.fisica ?? {};
  const peso = paraNumero(f.peso_kg);
  const altura = paraNumero(f.altura_cm);
  const imc = peso && altura ? peso / Math.pow(altura / 100, 2) : null;
  const itens = [
    peso !== null ? `peso ${fmt(peso, 1, "kg")}` : null,
    altura !== null ? `altura ${fmt(altura, 0, "cm")}` : null,
    imc !== null ? `IMC ${fmt(imc, 1)}` : null,
    paraNumero(f.circ_cintura) !== null ? `cintura ${fmt(paraNumero(f.circ_cintura), 1, "cm")}` : null,
    paraNumero(f.circ_quadril) !== null ? `quadril ${fmt(paraNumero(f.circ_quadril), 1, "cm")}` : null,
    paraNumero(f.percentual_gordura) !== null ? `gordura ${fmt(paraNumero(f.percentual_gordura), 1, "%")}` : null,
    paraNumero(f.pa_sistolica) !== null && paraNumero(f.pa_diastolica) !== null ? `PA ${f.pa_sistolica}/${f.pa_diastolica} mmHg` : null,
    paraNumero(f.fc_repouso) !== null ? `FC de repouso ${f.fc_repouso} bpm` : null,
  ].filter(Boolean);
  return itens as string[];
}

function dadosFuncional(p: PacienteRow): string[] {
  const f = p.funcional ?? {};
  const n = (chave: string) => paraNumero(f[chave]);
  const itens = [
    n("tug_seg") !== null ? `TUG ${fmt(n("tug_seg"), 1, "s")}` : null,
    n("five_sts_seg") !== null ? `5x Sentar-e-Levantar ${fmt(n("five_sts_seg"), 1, "s")}` : null,
    n("chair_stand_reps") !== null ? `Chair Stand 30 s ${n("chair_stand_reps")} rep.` : null,
    n("arm_curl_reps") !== null ? `Arm Curl ${n("arm_curl_reps")} rep.` : null,
    n("apoio_unipodal_d_seg") !== null || n("apoio_unipodal_e_seg") !== null ? `apoio unipodal D ${n("apoio_unipodal_d_seg") ?? "-"} s / E ${n("apoio_unipodal_e_seg") ?? "-"} s` : null,
    n("dinamometria_d_kg") !== null || n("dinamometria_e_kg") !== null ? `dinamometria D ${n("dinamometria_d_kg") ?? "-"} / E ${n("dinamometria_e_kg") ?? "-"} kgf` : null,
    n("velocidade_marcha_ms") !== null ? `marcha ${fmt(n("velocidade_marcha_ms"), 2, "m/s")}` : null,
    n("tc6_metros") !== null ? `TC6 ${n("tc6_metros")} m` : null,
    n("pushup_reps") !== null ? `flexão ${n("pushup_reps")} rep.` : null,
    n("core_prancha_seg") !== null ? `prancha ${n("core_prancha_seg")} s` : null,
  ].filter(Boolean);
  return itens as string[];
}

function alertasTexto(alertas: Alerta[] | undefined): string[] {
  return (alertas ?? [])
    .slice()
    .sort((a, b) => b.nivel - a.nivel)
    .map((a) => `Nível ${a.nivel} (${rotuloNivel[a.nivel]}): ${a.descricao}`);
}

// ---------------------------------------------------------------------------
// Anamnese (Sofia) - além dos domínios, resume queixa, histórico e prontidão.
// ---------------------------------------------------------------------------
function blocoAnamnese(p: PacienteRow, estilo: EstiloParecer): string[] {
  const a = mesclarComPadrao(p.anamnese);
  const linhas: string[] = [];
  const queixa = a.motivo.queixa_principal || a.motivo.motivo_procura;
  const objetivo = a.motivo.objetivos;
  const dificuldades = a.motivo.dificuldades?.length ? a.motivo.dificuldades.join(", ") : "";

  if (estilo === "sucinto") {
    if (queixa) linhas.push(`- Queixa: ${queixa}`);
    if (objetivo) linhas.push(`- Objetivo: ${objetivo}`);
    if (dificuldades) linhas.push(`- Dificuldades no dia a dia: ${dificuldades}`);
  } else {
    linhas.push("MOTIVO DA PROCURA");
    linhas.push(`- Queixa principal: ${queixa || "não informada"}`);
    linhas.push(`- Objetivo do paciente: ${objetivo || "não informado"}`);
    if (dificuldades) linhas.push(`- Dificuldades no dia a dia: ${dificuldades}`);
    if (a.motivo.atividades_perdidas) linhas.push(`- Atividades que deixou de fazer: ${a.motivo.atividades_perdidas}`);
    linhas.push("- Por que importa: o objetivo declarado orienta quais resultados pesam mais no plano.");
    linhas.push("");
  }

  const h = a.historico_saude;
  const hist: string[] = [];
  if (h.doencas) hist.push(`doenças: ${h.doencas}`);
  if (h.cirurgias) hist.push(`cirurgias: ${h.cirurgias}`);
  if (h.lesoes_fraturas) hist.push(`lesões/fraturas: ${h.lesoes_fraturas}`);
  if (h.quedas_12m === true) hist.push("queda nos últimos 12 meses");
  if (a.medicamentos.usa_medicamentos === true) hist.push(`medicamentos: ${a.medicamentos.lista.map((m) => m.nome).filter(Boolean).join(", ") || "informou uso, sem lista"}`);
  if (estilo === "sucinto") {
    if (hist.length > 0) linhas.push(`- Histórico: ${hist.join("; ")}.`);
  } else {
    linhas.push("HISTÓRICO DE SAÚDE");
    linhas.push(hist.length > 0 ? `- ${hist.join("\n- ")}` : "- Sem doenças, cirurgias, lesões, quedas ou medicamentos informados.");
    linhas.push("");
  }

  // Dor por região
  if (a.dor.tem_dor === true) {
    const regioes = linhasDorPorRegiao(a.dor);
    if (estilo === "sucinto") {
      linhas.push(`- Regiões com dor: ${regioes.length > 0 ? regioes.join("; ") : "relatada, sem região marcada"}.`);
    } else {
      linhas.push("DOR POR REGIÃO");
      regioes.forEach((r) => linhas.push(`- ${r}`));
      if (a.dor.bandeiras_vermelhas.length > 0) linhas.push(`- Bandeiras vermelhas relatadas: ${a.dor.bandeiras_vermelhas.join(", ")}.`);
      linhas.push("- A dor é autorrelato por região; a escala de 0 a 10 não é comparável entre pessoas, só ao longo do tempo na mesma pessoa.");
      linhas.push("");
    }
  }

  // Prontidão (PAR-Q+) e risco cardiovascular
  const parq = perguntasParQ.filter((q) => (a.prontidao.parq as any)[q.chave] === true);
  const risco = calcularRiscoCardiovascular(p);
  const prontidao: string[] = [];
  if (parq.length > 0) prontidao.push(`PAR-Q+ com ${parq.length} resposta(s) positiva(s)`);
  if (risco) prontidao.push(`risco cardiovascular para exercício: ${risco.classificacao}`);
  if (estilo === "sucinto") {
    if (prontidao.length > 0) linhas.push(`- Prontidão: ${prontidao.join("; ")}.`);
  } else if (prontidao.length > 0) {
    linhas.push("PRONTIDÃO PARA O EXERCÍCIO");
    linhas.push(`- ${prontidao.join("\n- ")}`);
    if (risco) linhas.push(`- ${risco.justificativa}`);
    linhas.push("- PAR-Q+ positivo ou risco moderado/alto indicam cautela e, quando couber, liberação médica antes de esforços intensos.");
    linhas.push("");
  }

  // Escalas
  const psqi = calcularPSQI(a);
  const pss = escorePSS10(a.saude_mental.pss10);
  const escalas = [psqi !== null ? `PSQI ${psqi.global}/21` : null, pss !== null ? `PSS-10 ${pss}/40` : null].filter(Boolean);
  if (escalas.length > 0 && estilo === "sucinto") linhas.push(`- Escalas: ${escalas.join("; ")}.`);
  if (escalas.length > 0 && estilo === "explicativo") {
    linhas.push("ESCALAS APLICADAS");
    linhas.push(`- ${escalas.join("\n- ")}`);
    linhas.push("- Escalas de autorrelato: servem para acompanhar a evolução e orientar a conversa, não para diagnosticar.");
    linhas.push("");
  }
  return linhas;
}

// ---------------------------------------------------------------------------
// Parecer por agente
// ---------------------------------------------------------------------------
export function gerarParecerAgente(agente: AgenteParecer, paciente: PacienteRow, estilo: EstiloParecer): string {
  const info = AGENTES[agente];
  const perfil = calcularPerfilIntegrado(paciente);
  // Sem nenhum dado da área, não há o que redigir (a aba mostra o aviso).
  if (agente === "fisica" && dadosFisica(paciente).length === 0) return "";
  if (agente === "funcional" && dadosFuncional(paciente).length === 0) return "";
  if (agente === "anamnese" && paciente.anamnese_status === "nao_iniciada") return "";
  if (agente === "cardio") {
    const d = dominio(perfil, "capacidade_cardiorrespiratoria");
    if (d.classificacao === "investigar" && d.justificativa.startsWith("Nenhum teste")) return "";
  }
  const linhas: string[] = [];
  const cab = estilo === "sucinto" ? " (resumo)" : "";
  linhas.push(`PARECER ${info.nome.toUpperCase()} - ${info.titulo.toUpperCase()}${cab}`);
  if (estilo === "explicativo") linhas.push("Rascunho do agente para o avaliador revisar: apoio à decisão, não é diagnóstico.");
  linhas.push("");

  if (agente === "perfil") {
    const grupos: [string, DomainResult[]][] = [
      ["Prioridade", perfil.riscos],
      ["Atenção", perfil.limitacoes],
      ["Pontos fortes", perfil.potencialidades],
      ["A investigar (dado faltante)", perfil.dominios.filter((d) => d.classificacao === "investigar")],
    ];
    if (estilo === "sucinto") {
      for (const [titulo, itens] of grupos) {
        if (itens.length > 0) linhas.push(`${titulo}: ${itens.map((d) => d.titulo.toLowerCase()).join(", ")}.`);
      }
      linhas.push(`Confiança do perfil: ${perfil.confianca}.`);
      const alertas = alertasTexto(paciente.alertas);
      if (alertas.length > 0) linhas.push("", "Alertas:", ...alertas.map((x) => `- ${x}`));
    } else {
      for (const d of perfil.dominios) linhas.push(...linhaDominio(d, "explicativo"));
      linhas.push(`CONFIANÇA DO PERFIL: ${perfil.confianca}. ${perfil.confianca === "alta" ? "Quase todos os domínios têm dado." : perfil.confianca === "media" ? "Vários domínios ainda sem dado: conclusões parciais." : "Muitos domínios sem dado: use o perfil apenas como orientação inicial."}`);
      const alertas = alertasTexto(paciente.alertas);
      if (alertas.length > 0) {
        linhas.push("", "ALERTAS DA ANAMNESE");
        alertas.forEach((x) => linhas.push(`- ${x}`));
      }
      linhas.push("");
    }
  } else {
    if (agente === "anamnese") linhas.push(...blocoAnamnese(paciente, estilo));
    if (agente === "fisica" || agente === "funcional") {
      const dados = agente === "fisica" ? dadosFisica(paciente) : dadosFuncional(paciente);
      linhas.push(estilo === "sucinto" ? `Dados: ${dados.join("; ")}.` : `DADOS REGISTRADOS\n- ${dados.join("\n- ")}\n`);
    }
    if (estilo === "explicativo" && agente === "anamnese") linhas.push("INTERPRETAÇÃO DOS DOMÍNIOS");
    for (const chave of info.dominios) linhas.push(...linhaDominio(dominio(perfil, chave), estilo));
  }

  if (estilo === "sucinto") {
    linhas.push("", "Dado ausente aparece como 'a investigar', nunca como normal. Não é diagnóstico.");
  } else {
    linhas.push("LIMITES DESTE PARECER");
    info.limites.forEach((l) => linhas.push(`- ${l}`));
    linhas.push("- Dado ausente aparece como 'a investigar', nunca como normal.");
  }
  return linhas.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
