// Módulos complementares do questionário do paciente.
//
// O questionário base é curto (doenças, problemas, dificuldades, segurança
// para exercício). Instrumentos mais longos ou mais sensíveis - bem-estar
// emocional, sono detalhado, dor detalhada, estilo de vida - ficam em módulos
// à parte: o paciente é convidado a responder quando as respostas do base
// indicam, ou o avaliador envia o link do módulo quando quiser.

import type { Anamnese } from "./types";
import { calcularPSQI } from "./psqi";
import { CORTE_PORTA_PHQ2, precisaInstrumentoCompleto } from "./alerts";

export type ModuloId = "bem-estar" | "sono" | "dor" | "estilo-de-vida" | "capacidade-60";

export type StatusModulo = "respondido" | "em_andamento" | "sinalizado" | "nao_aplicado";

export type DefinicaoModulo = {
  id: ModuloId;
  titulo: string;
  descricaoPaciente: string;
  duracao: string;
  // Instrumentos incluídos (para o avaliador).
  instrumentos: string;
  sensivel: boolean;
};

export const MODULOS: DefinicaoModulo[] = [
  {
    id: "bem-estar",
    titulo: "Bem-estar emocional",
    descricaoPaciente: "Perguntas sobre estresse, ansiedade e humor nas últimas semanas. É opcional e só a equipe da clínica vê as respostas.",
    duracao: "cerca de 5 minutos",
    instrumentos: "Estresse percebido (0-10), PSS-10, GAD-2/GAD-7, PHQ-2/PHQ-9",
    sensivel: true,
  },
  {
    id: "sono",
    titulo: "Sono em detalhe",
    descricaoPaciente: "Perguntas detalhadas sobre como você tem dormido no último mês.",
    duracao: "cerca de 4 minutos",
    instrumentos: "PSQI (Índice de Qualidade do Sono de Pittsburgh)",
    sensivel: false,
  },
  {
    id: "dor",
    titulo: "Dor em detalhe",
    descricaoPaciente: "Perguntas sobre como é a sua dor e como ela afeta o movimento.",
    duracao: "cerca de 5 minutos",
    instrumentos: "Características da dor, TSK-11, PSEQ",
    sensivel: false,
  },
  {
    id: "estilo-de-vida",
    titulo: "Estilo de vida e atividade física",
    descricaoPaciente: "Alimentação, hábitos, lazer e quanto você se movimenta no dia a dia.",
    duracao: "cerca de 5 minutos",
    instrumentos: "IPAQ (autorrelato: costuma superestimar a atividade), alimentação, hidratação, álcool, lazer, barreiras, apoio",
    sensivel: false,
  },
  {
    id: "capacidade-60",
    titulo: "Visão, audição e memória (a partir de 60 anos)",
    descricaoPaciente: "Poucas perguntas sobre como você enxerga, escuta e lembra das coisas no dia a dia. Ajudam a deixar os exercícios mais seguros e o plano mais adequado a você.",
    duracao: "cerca de 2 minutos",
    instrumentos: "Visão, audição e memória por autorrelato (triagem, não diagnóstico); recomendado a partir de 60 anos. Testes objetivos (voz sussurrada, lembrar palavras) ficam com o avaliador.",
    sensivel: false,
  },
];

export function moduloPorId(id: string): DefinicaoModulo | undefined {
  return MODULOS.find((m) => m.id === id);
}

const preenchido = (v: number | null | undefined) => v !== null && v !== undefined;

// A partir das respostas do questionário base, o módulo é recomendado?
export function moduloSinalizado(a: Anamnese, id: ModuloId, idade?: number | null): boolean {
  switch (id) {
    case "capacidade-60":
      return idade !== null && idade !== undefined && idade >= 60;
    case "bem-estar":
      return a.saude_mental.sinalizacao === "um_pouco" || a.saude_mental.sinalizacao === "sim";
    case "sono": {
      const s = a.sono;
      return (preenchido(s.qualidade_percebida) && (s.qualidade_percebida as number) <= 2) || s.dificuldade_iniciar === true || s.despertares_noturnos === true;
    }
    case "dor":
      return a.dor.tem_dor === true;
    case "estilo-de-vida":
      return false;
  }
}

function algumaResposta(a: Anamnese, id: ModuloId): boolean {
  switch (id) {
    case "capacidade-60":
      return Object.values(a.capacidade).some((v) => v !== null);
    case "bem-estar": {
      const sm = a.saude_mental;
      return [...sm.pss10, ...sm.gad7, ...sm.phq9].some(preenchido) || preenchido(sm.percepcao_saude) || preenchido(a.estilo_vida.estresse_percebido);
    }
    case "sono":
      return Object.values(a.psqi).some((v) => (typeof v === "number" ? true : typeof v === "string" ? v !== "" : false));
    case "dor":
      return [...a.dor.tsk11, ...a.dor.pseq].some(preenchido) || a.dor.caracteristicas.length > 0 || a.dor.inicio !== "" || a.dor.frequencia !== "";
    case "estilo-de-vida": {
      const ev = a.estilo_vida;
      const ip = a.atividade_fisica.ipaq;
      return (
        preenchido(ev.alimentacao_avaliacao) ||
        ev.hidratacao_litros_dia !== "" ||
        ev.alcool_frequencia !== "" ||
        ev.lazer_opcoes.length > 0 ||
        ev.barreiras_exercicio.length > 0 ||
        ev.disponibilidade_tempo !== "" ||
        Object.values(ip).some((v) => v !== "")
      );
    }
  }
}

function completo(a: Anamnese, id: ModuloId): boolean {
  switch (id) {
    case "capacidade-60":
      return a.capacidade.visao_dificuldade !== null && a.capacidade.audicao_dificuldade !== null && a.capacidade.memoria_esquecimentos !== null;
    case "bem-estar": {
      const sm = a.saude_mental;
      const curto = preenchido(sm.gad7[0]) && preenchido(sm.gad7[1]) && preenchido(sm.phq9[0]) && preenchido(sm.phq9[1]) && preenchido(sm.phq9[8]);
      if (!curto) return false;
      if (precisaInstrumentoCompleto(sm.gad7) && !sm.gad7.slice(2).every(preenchido)) return false;
      if (precisaInstrumentoCompleto(sm.phq9, CORTE_PORTA_PHQ2) && !sm.phq9.slice(2, 8).every(preenchido)) return false;
      return sm.pss10.every(preenchido);
    }
    case "sono":
      return calcularPSQI(a) !== null;
    case "dor":
      return a.dor.tsk11.every(preenchido) && a.dor.pseq.every(preenchido);
    case "estilo-de-vida":
      return preenchido(a.estilo_vida.alimentacao_avaliacao) && a.atividade_fisica.ipaq.horas_sentado_dia !== "";
  }
}

export function statusModulo(a: Anamnese, id: ModuloId, idade?: number | null): StatusModulo {
  if (completo(a, id)) return "respondido";
  if (algumaResposta(a, id)) return "em_andamento";
  if (moduloSinalizado(a, id, idade)) return "sinalizado";
  return "nao_aplicado";
}

export const ROTULO_STATUS_MODULO: Record<StatusModulo, string> = {
  respondido: "Respondido",
  em_andamento: "Em andamento",
  sinalizado: "Recomendado - ainda não respondido",
  nao_aplicado: "Não aplicado",
};

// Link do módulo para enviar ao paciente. O paciente se identifica com nome e
// data de nascimento, como no questionário base.
export function linkDoModulo(origem: string, id: ModuloId): string {
  return `${origem}/paciente/modulo/${id}`;
}
