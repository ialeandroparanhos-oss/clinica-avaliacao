// PSQI — Pittsburgh Sleep Quality Index (Buysse, Reynolds, Monk, Berman &
// Kupfer, 1989). Implementa o algoritmo de pontuação original dos 7
// componentes (cada um 0-3) e do escore global (0-21, soma dos 7). Escore
// global > 5 é o corte clássico sugerido pelos autores para "sono de má
// qualidade" - mantido aqui como referência de triagem, nunca diagnóstico.

import type { Anamnese } from "./types";

export type ComponentesPSQI = {
  qualidadeSubjetiva: number;
  latencia: number;
  duracao: number;
  eficiencia: number;
  disturbios: number;
  medicacao: number;
  disfuncaoDiurna: number;
};

export type ResultadoPSQI = {
  componentes: ComponentesPSQI;
  global: number; // 0-21
};

function parseHoraParaMinutos(hora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function bucket(valor: number, corte1: number, corte2: number, corte3: number): number {
  if (valor <= corte1) return 0;
  if (valor <= corte2) return 1;
  if (valor <= corte3) return 2;
  return 3;
}

// Retorna null quando faltam respostas essenciais para algum componente -
// nunca preenche lacuna com um valor "neutro".
export function calcularPSQI(a: Anamnese): ResultadoPSQI | null {
  const p = a.psqi;
  if (!p) return null;

  if (p.qualidade_subjetiva === null || p.qualidade_subjetiva === undefined) return null;
  const c1 = p.qualidade_subjetiva;

  const minutosAdormecer = Number(p.minutos_para_adormecer);
  if (!p.minutos_para_adormecer || !Number.isFinite(minutosAdormecer)) return null;
  if (p.freq_demora_adormecer === null || p.freq_demora_adormecer === undefined) return null;
  const latenciaMinutosScore = bucket(minutosAdormecer, 15, 30, 60);
  const somaLatencia = latenciaMinutosScore + p.freq_demora_adormecer;
  const c2 = somaLatencia === 0 ? 0 : somaLatencia <= 2 ? 1 : somaLatencia <= 4 ? 2 : 3;

  const horasDormidas = Number(p.horas_dormidas_noite);
  if (!p.horas_dormidas_noite || !Number.isFinite(horasDormidas)) return null;
  const c3 = horasDormidas > 7 ? 0 : horasDormidas >= 6 ? 1 : horasDormidas >= 5 ? 2 : 3;

  const deitar = parseHoraParaMinutos(p.hora_deitar);
  const acordar = parseHoraParaMinutos(p.hora_acordar);
  if (deitar === null || acordar === null) return null;
  let minutosNaCama = acordar - deitar;
  if (minutosNaCama <= 0) minutosNaCama += 24 * 60;
  const horasNaCama = minutosNaCama / 60;
  const eficiencia = horasNaCama > 0 ? (horasDormidas / horasNaCama) * 100 : 0;
  const c4 = eficiencia >= 85 ? 0 : eficiencia >= 75 ? 1 : eficiencia >= 65 ? 2 : 3;

  const subitensDisturbios = [
    p.freq_acorda_meio_noite,
    p.freq_banheiro,
    p.freq_respirar_mal,
    p.freq_tosse_ronco,
    p.freq_frio,
    p.freq_calor,
    p.freq_pesadelos,
    p.freq_dor,
    p.freq_outro_motivo,
  ];
  if (subitensDisturbios.some((v) => v === null || v === undefined)) return null;
  const somaDisturbios = subitensDisturbios.reduce((acc: number, v) => acc + (v as number), 0);
  const c5 = somaDisturbios === 0 ? 0 : somaDisturbios <= 9 ? 1 : somaDisturbios <= 18 ? 2 : 3;

  if (p.freq_medicamento_para_dormir === null || p.freq_medicamento_para_dormir === undefined) return null;
  const c6 = p.freq_medicamento_para_dormir;

  if (
    p.freq_sonolencia_atividades === null ||
    p.freq_sonolencia_atividades === undefined ||
    p.freq_falta_entusiasmo === null ||
    p.freq_falta_entusiasmo === undefined
  ) {
    return null;
  }
  const somaDisfuncao = p.freq_sonolencia_atividades + p.freq_falta_entusiasmo;
  const c7 = somaDisfuncao === 0 ? 0 : somaDisfuncao <= 2 ? 1 : somaDisfuncao <= 4 ? 2 : 3;

  const componentes: ComponentesPSQI = {
    qualidadeSubjetiva: c1,
    latencia: c2,
    duracao: c3,
    eficiencia: c4,
    disturbios: c5,
    medicacao: c6,
    disfuncaoDiurna: c7,
  };

  return { componentes, global: c1 + c2 + c3 + c4 + c5 + c6 + c7 };
}
