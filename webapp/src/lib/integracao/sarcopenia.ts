// Agente 6 — Íris: triagem aproximada de sarcopenia/dinapenia.
//
// IMPORTANTE: o EWGSOP2 (European Working Group on Sarcopenia in Older
// People, 2) define sarcopenia a partir de força reduzida (dinamometria/
// chair stand) + massa muscular ESQUELÉTICA APENDICULAR reduzida, medida
// por DXA ou bioimpedância segmentar validada. Este sistema não tem DXA
// nem bioimpedância segmentar - usa massa magra TOTAL (de dobras
// cutâneas ou bioimpedância de corpo inteiro) comparada à meta calculada
// para o próprio paciente (ver lib/avaliacao/composicaoCorporal.ts) como
// um proxy aproximado. É uma triagem de apoio, nunca um diagnóstico de
// sarcopenia - a confirmação exige avaliação de massa muscular
// apendicular validada.

import type { PacienteRow } from "@/lib/anamnese/types";
import { calcularPerfilIntegrado } from "./perfil";
import { percentualGorduraIdealSugerido } from "@/lib/avaliacao/composicaoCorporal";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { paraNumero } from "@/lib/numeros";

export type ClassificacaoSarcopenia = "sarcopenia_provavel" | "dinapenia_provavel" | "sem_sinais" | "dados_insuficientes";

export type ResultadoSarcopenia = {
  forcaReduzida: boolean;
  massaMuscularReduzida: boolean | null;
  classificacao: ClassificacaoSarcopenia;
  justificativa: string;
};

export function triarSarcopeniaDinapenia(paciente: PacienteRow): ResultadoSarcopenia {
  const perfil = calcularPerfilIntegrado(paciente);
  const forca = perfil.dominios.find((dm) => dm.chave === "forca");
  const forcaReduzida = forca?.classificacao === "prioridade";
  const forcaAvaliavel = forca !== undefined && forca.classificacao !== "investigar";

  const pesoKg = paraNumero(paciente.fisica?.peso_kg) || null;
  const percentualGordura = paraNumero(paciente.fisica?.percentual_gordura) || null;
  const massaMagraKg = pesoKg !== null && percentualGordura !== null ? pesoKg - (pesoKg * percentualGordura) / 100 : null;

  const idade = idadeEfetiva(paciente);
  const sexo = sexoEfetivo(paciente);
  const percentualIdealInformado = paraNumero(paciente.fisica?.percentual_gordura_ideal) || null;
  const percentualIdeal = percentualIdealInformado ?? percentualGorduraIdealSugerido(idade, sexo);
  const massaMagraIdealInformada = paraNumero(paciente.fisica?.massa_magra_ideal_kg) || null;
  const massaMagraIdealKg = massaMagraIdealInformada ?? (pesoKg !== null && percentualIdeal !== null ? pesoKg * (1 - percentualIdeal / 100) : null);

  const massaMuscularReduzida =
    massaMagraKg !== null && massaMagraIdealKg !== null ? massaMagraKg < massaMagraIdealKg * 0.9 : null;

  if (!forcaAvaliavel || massaMuscularReduzida === null) {
    return {
      forcaReduzida,
      massaMuscularReduzida,
      classificacao: "dados_insuficientes",
      justificativa: "Faltam dados de força (dinamometria/chair stand) e/ou de composição corporal (peso e %G) para esta triagem.",
    };
  }

  if (forcaReduzida && massaMuscularReduzida) {
    return {
      forcaReduzida,
      massaMuscularReduzida,
      classificacao: "sarcopenia_provavel",
      justificativa: "Força reduzida (critério EWGSOP2) e massa magra pelo menos 10% abaixo da meta calculada para este paciente - padrão compatível com sarcopenia.",
    };
  }

  if (forcaReduzida && !massaMuscularReduzida) {
    return {
      forcaReduzida,
      massaMuscularReduzida,
      classificacao: "dinapenia_provavel",
      justificativa: "Força reduzida (critério EWGSOP2), mas massa magra preservada - padrão compatível com dinapenia (perda de força desproporcional à perda de massa).",
    };
  }

  return {
    forcaReduzida,
    massaMuscularReduzida,
    classificacao: "sem_sinais",
    justificativa: "Força e massa magra dentro do esperado nesta triagem.",
  };
}
