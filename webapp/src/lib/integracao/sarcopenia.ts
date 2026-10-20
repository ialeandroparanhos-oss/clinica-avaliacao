// Agente 6 — Íris: triagem aproximada de sarcopenia/dinapenia.
//
// IMPORTANTE: o EWGSOP2 (Cruz-Jentoft et al., Age Ageing 2019) define sarcopenia a partir de
// força reduzida (dinamometria/chair stand) + massa muscular ESQUELÉTICA APENDICULAR reduzida,
// medida por DXA ou bioimpedância segmentar validada. Este sistema não tem DXA nem
// bioimpedância segmentar, então estima a massa muscular de duas formas aproximadas:
//   1. Circunferência da panturrilha < 31 cm, a partir dos 60 anos (preferida). Base: Sobestiansky
//      et al., Clin Nutr ESPEN 2021;45:442 (PMID 34620352): em 56 idosos internados (média de 84
//      anos), CC < 31 cm foi um proxy aceitável da massa muscular e se associou à mortalidade.
//      Amostra pequena e hospitalar: não é um corte validado para idosos da comunidade;
//   2. se não houver panturrilha (ou abaixo de 60 anos): índice de massa magra (massa magra em kg ÷ altura
//      em m²) abaixo de 17 kg/m² em homens e 15 em mulheres, o corte de massa reduzida dos critérios GLIM
//      (Cederholm et al., Clin Nutr 2019;38:1, PMID 30181091; valores conforme Sobestiansky 2021). Foi pensado
//      para DXA ou bioimpedância: com dobras ou bioimpedância comum é ESTIMATIVA. Decisão I1 do profissional
//      (19/10/2026): substitui a regra anterior ("massa magra pelo menos 10% abaixo da meta"), que dependia do
//      %G ideal e da massa magra ideal salvos e, por isso, mudava quando o %G ideal mudava.
// Também sinaliza "possível obesidade sarcopênica" (ESPEN/EASO, Donini et al., Clin Nutr 2022;41:990,
// PMID 35227529: excesso de adiposidade + baixa função/massa muscular), apenas como triagem.
// É apoio, nunca diagnóstico: a confirmação exige avaliação de massa muscular apendicular validada.

import type { PacienteRow } from "@/lib/anamnese/types";
import { calcularPerfilIntegrado } from "./perfil";
import { analisarComposicao, confirmarAdiposidade, CORTE_FFMI, relacaoCinturaEstatura } from "@/lib/avaliacao/composicaoCorporal";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { paraNumero } from "@/lib/numeros";

export const CORTE_PANTURRILHA_CM = 31;

export type ClassificacaoSarcopenia = "sarcopenia_provavel" | "dinapenia_provavel" | "sem_sinais" | "dados_insuficientes";

export type ResultadoSarcopenia = {
  forcaReduzida: boolean;
  massaMuscularReduzida: boolean | null;
  fonteMassa: "panturrilha" | "massa_magra_total" | null;
  possivelObesidadeSarcopenica: boolean;
  classificacao: ClassificacaoSarcopenia;
  justificativa: string;
};

export function triarSarcopeniaDinapenia(paciente: PacienteRow): ResultadoSarcopenia {
  const perfil = calcularPerfilIntegrado(paciente);
  const forca = perfil.dominios.find((dm) => dm.chave === "forca");
  const forcaReduzida = forca?.classificacao === "prioridade";
  const forcaAvaliavel = forca !== undefined && forca.classificacao !== "investigar";

  const pesoKg = paraNumero(paciente.fisica?.peso_kg) || null;
  const alturaCm = paraNumero(paciente.fisica?.altura_cm) || null;
  const idade = idadeEfetiva(paciente);
  const sexo = sexoEfetivo(paciente);
  // Massa magra e índice: o mesmo cálculo do Dr. Marco (%G de referência, bioimpedância ou dobras).
  const comp = analisarComposicao(paciente.fisica, idade, sexo);

  // Panturrilha: usa o lado de menor medida (o mais conservador para detectar redução).
  const panturrilhas = [paraNumero(paciente.fisica?.circ_panturrilha_d), paraNumero(paciente.fisica?.circ_panturrilha_e)].filter((v): v is number => v !== null && v > 0);
  const panturrilhaCm = panturrilhas.length > 0 ? Math.min(...panturrilhas) : null;

  let massaMuscularReduzida: boolean | null = null;
  let fonteMassa: ResultadoSarcopenia["fonteMassa"] = null;
  let textoMassa = "";
  if (idade !== null && idade >= 60 && panturrilhaCm !== null) {
    massaMuscularReduzida = panturrilhaCm < CORTE_PANTURRILHA_CM;
    fonteMassa = "panturrilha";
    textoMassa = `panturrilha de ${String(panturrilhaCm).replace(".", ",")} cm (${massaMuscularReduzida ? "abaixo" : "igual ou acima"} do corte de ${CORTE_PANTURRILHA_CM} cm, proxy de massa muscular estudado em idosos internados)`;
  } else if (comp.ffmi !== null && sexo !== "desconhecido") {
    const corte = CORTE_FFMI[sexo];
    massaMuscularReduzida = comp.ffmi < corte;
    fonteMassa = "massa_magra_total";
    textoMassa = `índice de massa magra de ${comp.ffmi.toFixed(1).replace(".", ",")} kg/m² (${massaMuscularReduzida ? "abaixo" : "igual ou acima"} do corte de ${corte} kg/m² dos critérios GLIM; estimativa a partir de dobras ou bioimpedância${idade !== null && idade >= 60 ? "; meça a panturrilha para uma estimativa melhor" : ""})`;
  }

  // Possível obesidade sarcopênica: excesso de adiposidade confirmado + função/massa muscular baixa.
  const cintura = paraNumero(paciente.fisica?.circ_cintura);
  const quadril = paraNumero(paciente.fisica?.circ_quadril);
  const imc = pesoKg !== null && alturaCm !== null ? pesoKg / Math.pow(alturaCm / 100, 2) : null;
  const rcq = cintura !== null && quadril !== null && quadril > 0 ? cintura / quadril : null;
  const adiposidade = confirmarAdiposidade({ imc, cinturaCm: cintura, rcq, rcest: relacaoCinturaEstatura(cintura, alturaCm), sexo });
  const adiposidadeConfirmada = adiposidade?.estado === "confirmada";
  const possivelObesidadeSarcopenica = adiposidadeConfirmada && (forcaReduzida || massaMuscularReduzida === true);
  const notaObesidade = possivelObesidadeSarcopenica
    ? " Há excesso de adiposidade confirmado junto com força ou massa muscular baixas: possível obesidade sarcopênica (critério ESPEN/EASO 2022). Triagem: confirme por avaliação de composição corporal."
    : "";

  if (!forcaAvaliavel || massaMuscularReduzida === null) {
    return {
      forcaReduzida,
      massaMuscularReduzida,
      fonteMassa,
      possivelObesidadeSarcopenica,
      classificacao: "dados_insuficientes",
      justificativa: `Faltam dados de força (dinamometria/chair stand) e/ou de massa muscular (panturrilha a partir dos 60 anos, ou peso, altura, sexo e %G para o índice de massa magra) para esta triagem.${notaObesidade}`,
    };
  }

  if (forcaReduzida && massaMuscularReduzida) {
    return {
      forcaReduzida,
      massaMuscularReduzida,
      fonteMassa,
      possivelObesidadeSarcopenica,
      classificacao: "sarcopenia_provavel",
      justificativa: `Força reduzida (critério EWGSOP2) e ${textoMassa}: padrão compatível com sarcopenia.${notaObesidade}`,
    };
  }

  if (forcaReduzida && !massaMuscularReduzida) {
    return {
      forcaReduzida,
      massaMuscularReduzida,
      fonteMassa,
      possivelObesidadeSarcopenica,
      classificacao: "dinapenia_provavel",
      justificativa: `Força reduzida (critério EWGSOP2), mas ${textoMassa}: padrão compatível com dinapenia (perda de força desproporcional à perda de massa).${notaObesidade}`,
    };
  }

  return {
    forcaReduzida,
    massaMuscularReduzida,
    fonteMassa,
    possivelObesidadeSarcopenica,
    classificacao: "sem_sinais",
    justificativa: `Força dentro do esperado e ${textoMassa}.${notaObesidade}`,
  };
}
