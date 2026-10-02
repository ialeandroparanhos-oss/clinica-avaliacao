// Triagem rápida de risco cardiovascular - baseada na lógica de
// estratificação de fatores de risco do ACSM (American College of Sports
// Medicine), amplamente usada para decidir se uma liberação médica é
// recomendada antes de testes de esforço. É uma triagem, não um
// diagnóstico, e nunca substitui avaliação médica quando indicada.

import type { PacienteRow } from "./types";
import { paraNumero } from "@/lib/numeros";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";

export type FatorRisco = { chave: string; rotulo: string };

export type ResultadoRiscoCV = {
  fatores: FatorRisco[];
  fatorProtetor: boolean;
  contagem: number; // após descontar o fator protetor, nunca negativa
  classificacao: "baixo" | "moderado" | "alto";
  justificativa: string;
};

const num = paraNumero;

export function calcularRiscoCardiovascular(paciente: PacienteRow): ResultadoRiscoCV | null {
  const a = paciente.anamnese;
  if (!a) return null;

  const idade = idadeEfetiva(paciente);
  const sexo = sexoEfetivo(paciente);
  const peso = num(paciente.fisica?.peso_kg);
  const altura = num(paciente.fisica?.altura_cm);
  const imc = peso && altura ? peso / Math.pow(altura / 100, 2) : null;
  const circCintura = num(paciente.fisica?.circ_cintura);
  const paSist = num(paciente.fisica?.pa_sistolica);
  const paDiast = num(paciente.fisica?.pa_diastolica);

  const fatores: FatorRisco[] = [];

  if (idade !== null) {
    if ((sexo === "masculino" && idade >= 45) || (sexo === "feminino" && idade >= 55)) {
      fatores.push({ chave: "idade", rotulo: `Idade (${idade} anos)` });
    }
  }

  if (a.historico_familiar?.doenca_cardiovascular === true || a.historico_familiar?.morte_cardio_precoce === true) {
    fatores.push({ chave: "historico_familiar", rotulo: "Histórico familiar de doença cardiovascular precoce" });
  }

  if (a.estilo_vida?.tabagismo === "Fumo ocasionalmente" || a.estilo_vida?.tabagismo === "Fumo diariamente") {
    fatores.push({ chave: "tabagismo", rotulo: "Tabagismo atual" });
  }

  if (a.atividade_fisica?.pratica_atual === false) {
    fatores.push({ chave: "sedentarismo", rotulo: "Sedentarismo" });
  }

  const obesidadeImc = imc !== null && imc >= 30;
  const obesidadeCintura =
    circCintura !== null && ((sexo === "masculino" && circCintura >= 102) || (sexo === "feminino" && circCintura >= 88));
  if (obesidadeImc || obesidadeCintura) {
    fatores.push({ chave: "obesidade", rotulo: "Obesidade (IMC e/ou circunferência de cintura)" });
  }

  // Hipertensão própria não tem pergunta dedicada neste capítulo - vem do
  // PAR-Q+ (heart_condition cobre "condição cardíaca ou pressão alta",
  // bp_or_heart_med cobre uso de medicação) para não repetir a mesma
  // pergunta em dois lugares da anamnese.
  const hipertensaoMedida = paSist !== null && paDiast !== null && (paSist >= 140 || paDiast >= 90);
  const hipertensaoAutorrelatada = a.prontidao?.parq?.heart_condition === true || a.prontidao?.parq?.bp_or_heart_med === true;
  if (hipertensaoAutorrelatada || hipertensaoMedida) {
    fatores.push({ chave: "hipertensao", rotulo: "Hipertensão" });
  }

  if (a.risco_cardiovascular?.colesterol_alto_ou_usa_estatina === true) {
    fatores.push({ chave: "dislipidemia", rotulo: "Colesterol alto / uso de estatina" });
  }

  if (a.risco_cardiovascular?.glicemia_alterada_ou_diabetes === true) {
    fatores.push({ chave: "glicemia", rotulo: "Glicemia alterada ou diabetes" });
  }

  const fatorProtetor = a.risco_cardiovascular?.hdl_alto_conhecido === true;
  const contagem = Math.max(0, fatores.length - (fatorProtetor ? 1 : 0));

  const doencaConhecidaOuSintomas = a.prontidao?.parq?.heart_condition === true || a.prontidao?.parq?.chest_pain === true;

  let classificacao: ResultadoRiscoCV["classificacao"];
  let justificativa: string;
  if (doencaConhecidaOuSintomas) {
    classificacao = "alto";
    justificativa = "Condição cardíaca conhecida ou dor torácica relatada no PAR-Q+ - risco alto independente da contagem de fatores.";
  } else if (contagem >= 2) {
    classificacao = "moderado";
    justificativa = `${contagem} fator(es) de risco presentes (critério ACSM) - considerar liberação médica antes de testes de esforço mais intensos.`;
  } else {
    classificacao = "baixo";
    justificativa = `${contagem} fator(es) de risco presentes - triagem não indica necessidade de liberação médica adicional para a maioria das atividades.`;
  }

  return { fatores, fatorProtetor, contagem, classificacao, justificativa };
}
