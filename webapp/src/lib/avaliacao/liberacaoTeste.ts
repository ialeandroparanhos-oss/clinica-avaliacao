// Agente 1 — Nina: liberação para teste de esforço e exercício (triagem pré-participação).
//
// Segue a lógica do ACSM (Riebe et al., Med Sci Sports Exerc 2015;47:2473, PMID 26473759),
// que deixou de usar a contagem de fatores de risco como eixo e passou a considerar:
//   1. o nível atual de atividade física (pratica regularmente ou não);
//   2. a presença de sinais/sintomas ou de doença cardiovascular, metabólica ou renal conhecida;
//   3. a intensidade pretendida (leve a moderada, ou vigorosa/máxima).
// O questionário de fatores de risco continua como INFORMAÇÃO (aba Anamnese), mas não decide.
//
// Resumo do que o sistema aplica (síntese do fluxo do ACSM; a decisão final é do profissional):
//  - sinais/sintomas (dor no peito, tontura/desmaio): obter liberação médica antes de testes e de
//    exercício intenso; só atividade leve que não provoque os sintomas;
//  - doença conhecida, sem sintomas: se já pratica regularmente, leve/moderada pode seguir e
//    vigorosa/máxima pede liberação; se não pratica, liberação recomendada em qualquer intensidade;
//  - sem doença e sem sintomas: pode seguir; sedentário deve começar leve e progredir aos poucos, e
//    teste máximo pede cautela (preferir protocolo submáximo).
// Limites: "pratica regularmente" vem do autorrelato (e o IPAQ costuma superestimar a atividade
// física); "doença conhecida" vem do PAR-Q+ e da anamnese, que dependem do que o paciente informou.

import type { PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { paraNumero } from "@/lib/numeros";

export type IntensidadeTeste = "leve_moderada" | "vigorosa_maxima";
export type NivelLiberacao = "liberado" | "cautela" | "liberacao_recomendada" | "liberacao_necessaria";

export type ResultadoLiberacao = {
  nivel: NivelLiberacao;
  texto: string;
  motivos: string[];
};

export const ROTULO_NIVEL_LIBERACAO: Record<NivelLiberacao, string> = {
  liberado: "Pode seguir",
  cautela: "Seguir com cautela",
  liberacao_recomendada: "Liberação médica recomendada",
  liberacao_necessaria: "Liberação médica necessária",
};

export type SituacaoClinica = { sintomas: string[]; doencas: string[]; ativo: boolean | null; fonteAtivo: string };

export function situacaoParaLiberacao(paciente: PacienteRow): SituacaoClinica {
  const a = mesclarComPadrao(paciente.anamnese);
  const parq = a.prontidao.parq;
  const sintomas: string[] = [];
  if (parq.chest_pain === true) sintomas.push("dor no peito (PAR-Q+)");
  if (parq.dizziness === true) sintomas.push("tontura ou perda de consciência (PAR-Q+)");

  const doencas: string[] = [];
  if (parq.heart_condition === true) doencas.push("problema cardíaco informado (PAR-Q+)");
  if (parq.bp_or_heart_med === true) doencas.push("uso de remédio para pressão ou coração (PAR-Q+)");
  if (a.risco_cardiovascular.glicemia_alterada_ou_diabetes === true) doencas.push("glicemia alterada ou diabetes");
  if (parq.other_reason === true) doencas.push("outra condição de saúde informada (PAR-Q+)");

  // Atividade regular: autorrelato; sem a pergunta, usa o tempo semanal do IPAQ (>= 150 min/semana).
  const ip = a.atividade_fisica.ipaq;
  const minSemana =
    (paraNumero(ip.dias_vigorosa) ?? 0) * (paraNumero(ip.min_vigorosa_dia) ?? 0) +
    (paraNumero(ip.dias_moderada) ?? 0) * (paraNumero(ip.min_moderada_dia) ?? 0) +
    (paraNumero(ip.dias_caminhada) ?? 0) * (paraNumero(ip.min_caminhada_dia) ?? 0);
  let ativo: boolean | null = null;
  let fonteAtivo = "não informado (tratado como sedentário por segurança)";
  if (a.atividade_fisica.pratica_atual === true) {
    ativo = true;
    fonteAtivo = "pratica atividade física (autorrelato)";
  } else if (a.atividade_fisica.pratica_atual === false) {
    ativo = false;
    fonteAtivo = "não pratica atividade física (autorrelato)";
  } else if (minSemana > 0) {
    ativo = minSemana >= 150;
    fonteAtivo = `IPAQ: ${minSemana} min/semana (o IPAQ costuma superestimar a atividade)`;
  }
  return { sintomas, doencas, ativo, fonteAtivo };
}

export function decidirLiberacao(s: SituacaoClinica, intensidade: IntensidadeTeste): ResultadoLiberacao {
  const ativo = s.ativo === true;
  const motivos: string[] = [];
  if (s.sintomas.length > 0) {
    motivos.push(`sinais ou sintomas: ${s.sintomas.join("; ")}`);
    return {
      nivel: "liberacao_necessaria",
      motivos,
      texto: "Sinais ou sintomas relatados: obtenha liberação médica antes de testes de esforço e de exercício intenso. Até lá, apenas atividade leve que não provoque os sintomas.",
    };
  }
  if (s.doencas.length > 0) {
    motivos.push(`doença conhecida: ${s.doencas.join("; ")}`);
    motivos.push(s.fonteAtivo);
    if (ativo && intensidade === "leve_moderada") {
      return { nivel: "liberado", motivos, texto: "Doença conhecida, sem sintomas, e já pratica atividade regularmente: pode seguir em intensidade leve a moderada. Para esforço vigoroso ou máximo, a liberação médica é recomendada." };
    }
    return {
      nivel: "liberacao_recomendada",
      motivos,
      texto: ativo
        ? "Doença conhecida: para teste máximo ou exercício vigoroso, a liberação médica é recomendada antes de seguir."
        : "Doença conhecida e sem prática regular de atividade: a liberação médica é recomendada antes de começar, em qualquer intensidade.",
    };
  }
  motivos.push("sem sinais ou sintomas nem doença cardiovascular, metabólica ou renal informada");
  motivos.push(s.fonteAtivo);
  if (ativo) return { nivel: "liberado", motivos, texto: "Sem sintomas nem doença conhecida e já ativo: pode seguir, inclusive em intensidade vigorosa, com progressão gradual." };
  if (intensidade === "leve_moderada") return { nivel: "liberado", motivos, texto: "Sem sintomas nem doença conhecida: pode começar em intensidade leve a moderada e progredir aos poucos." };
  return { nivel: "cautela", motivos, texto: "Sedentário (ou sem informação): para teste máximo, prefira um protocolo submáximo no início e progrida aos poucos; considere liberação médica se houver dúvida." };
}

export function liberacaoPara(paciente: PacienteRow, intensidade: IntensidadeTeste): ResultadoLiberacao {
  return decidirLiberacao(situacaoParaLiberacao(paciente), intensidade);
}
