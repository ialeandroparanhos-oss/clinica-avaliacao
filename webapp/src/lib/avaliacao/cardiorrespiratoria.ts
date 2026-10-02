// Agente 9 — Caio: Avaliação Cardiorrespiratória e VO2.
//
// Protocolos e equações aqui são as versões amplamente publicadas em
// fisiologia do exercício (Bruce/Foster, Cooper, Karvonen, Tanaka,
// constante metabólica do ACSM) - confirme a versão validada oficial
// antes do uso clínico formal, mesmo padrão das demais fórmulas deste
// projeto (ver nota em lib/anamnese/questionnaires.ts). Nenhum destes
// testes substitui uma avaliação cardiológica (ex.: teste ergométrico
// com ECG) quando clinicamente indicada - ver a triagem de risco
// cardiovascular em lib/anamnese/riscoCardiovascular.ts antes de aplicar
// um teste máximo.

import { paraNumero } from "@/lib/numeros";
import type { SexoComp } from "./composicaoCorporal";

export type EstagioBruce = { estagio: number; velocidadeKmh: number; inclinacaoPct: number; duracaoAcumuladaMin: number };

// Protocolo de Bruce (padrão) - velocidades convertidas de mph para km/h.
export const ESTAGIOS_BRUCE: EstagioBruce[] = [
  { estagio: 1, velocidadeKmh: 2.7, inclinacaoPct: 10, duracaoAcumuladaMin: 3 },
  { estagio: 2, velocidadeKmh: 4.0, inclinacaoPct: 12, duracaoAcumuladaMin: 6 },
  { estagio: 3, velocidadeKmh: 5.5, inclinacaoPct: 14, duracaoAcumuladaMin: 9 },
  { estagio: 4, velocidadeKmh: 6.8, inclinacaoPct: 16, duracaoAcumuladaMin: 12 },
  { estagio: 5, velocidadeKmh: 8.0, inclinacaoPct: 18, duracaoAcumuladaMin: 15 },
  { estagio: 6, velocidadeKmh: 8.9, inclinacaoPct: 20, duracaoAcumuladaMin: 18 },
  { estagio: 7, velocidadeKmh: 9.7, inclinacaoPct: 22, duracaoAcumuladaMin: 21 },
];

// Estimativa de VO2max a partir do tempo total no protocolo de Bruce
// (Foster et al., 1984) - tempo em minutos decimais (ex.: 9min30s = 9.5).
export function vo2maxBruceFoster(tempoTotalMin: number): number {
  const t = tempoTotalMin;
  return 14.8 - 1.379 * t + 0.451 * t * t - 0.012 * t * t * t;
}

// Teste de Cooper (12 minutos, sem inclinação) - Cooper, 1968.
export function vo2maxCooper(distanciaMetros: number): number {
  return (distanciaMetros - 504.9) / 44.73;
}

// ---------------------------------------------------------------------------
// Frequência cardíaca
// ---------------------------------------------------------------------------
export function fcMaxTanaka(idade: number): number {
  return 208 - 0.7 * idade;
}
export function fcMaxFox(idade: number): number {
  return 220 - idade;
}

// Fórmula de Karvonen (FC de reserva) - Karvonen et al., 1957.
export function fcAlvoKarvonen(fcRepouso: number, fcMax: number, percentual: number): number {
  const fcReserva = fcMax - fcRepouso;
  return fcRepouso + fcReserva * (percentual / 100);
}

export const ZONAS_KARVONEN_PADRAO = [50, 60, 70, 80, 90];

// ---------------------------------------------------------------------------
// MET e gasto calórico
// ---------------------------------------------------------------------------
export function metDeVo2(vo2MlKgMin: number): number {
  return vo2MlKgMin / 3.5;
}

// ~5 kcal por litro de O2 consumido - constante padrão do ACSM para
// cálculos metabólicos de campo (varia um pouco com o quociente
// respiratório real, 4.7-5.05, mas 5 é a aproximação de uso corrente).
export function kcalPorMinuto(vo2MlKgMin: number, pesoKg: number): number {
  const vo2LitrosMin = (vo2MlKgMin * pesoKg) / 1000;
  return vo2LitrosMin * 5;
}

// ---------------------------------------------------------------------------
// Estimativa de campo do limiar anaeróbio - deflexão da FC (Conconi et
// al., 1982). Não substitui limiar ventilatório/lactato medido em
// laboratório - aqui é só uma mudança na inclinação da curva FC x
// velocidade entre estágios, calculada a partir dos próprios dados do
// paciente (nunca um número fixo assumido).
// ---------------------------------------------------------------------------
export type PontoFcEstagio = { velocidadeKmh: number; fc: number };

export function detectarDeflexaoFc(pontos: PontoFcEstagio[]): { indice: number; velocidade: number } | null {
  if (pontos.length < 4) return null;
  const deltas: number[] = [];
  for (let i = 1; i < pontos.length; i++) {
    const dv = pontos[i].velocidadeKmh - pontos[i - 1].velocidadeKmh;
    const dfc = pontos[i].fc - pontos[i - 1].fc;
    deltas.push(dv > 0 ? dfc / dv : 0);
  }
  for (let i = 1; i < deltas.length; i++) {
    const mediaAnterior = deltas.slice(0, i).reduce((a, b) => a + b, 0) / i;
    if (mediaAnterior > 0 && deltas[i] < mediaAnterior * 0.7) {
      return { indice: i, velocidade: pontos[i].velocidadeKmh };
    }
  }
  return null;
}

// Duplo produto (FC x PA sistólica) - índice indireto de trabalho
// miocárdico, simples e amplamente usado em avaliação cardiorrespiratória.
export function duploProduto(fc: number, paSistolica: number): number {
  return fc * paSistolica;
}

// ---------------------------------------------------------------------------
// VO2máx do registro salvo (qualquer protocolo) - fonte única usada pela
// aba, pelo painel integrado, pelo histórico e pelo relatório.
// ---------------------------------------------------------------------------
export function vo2maxDeRegistro(d: Record<string, any> | null | undefined): number | null {
  if (!d) return null;
  const manual = paraNumero(d.vo2max_manual);
  if (manual !== null) return manual;
  const tempo = paraNumero(d.bruce_tempo_total_min);
  if (d.protocolo === "bruce" && tempo !== null) return vo2maxBruceFoster(tempo);
  const distancia = paraNumero(d.cooper_distancia_m);
  if (d.protocolo === "cooper" && distancia !== null) return vo2maxCooper(distancia);
  return null;
}

// ---------------------------------------------------------------------------
// Classificação do VO2máx por idade e sexo - tabela de Cooper (a mesma
// linhagem do teste de 12 minutos), amplamente reproduzida em materiais de
// avaliação física. Cada faixa guarda os limites INFERIORES de:
// [fraco, regular, bom, excelente]; abaixo do primeiro = muito fraco.
// CONFIRMAR os valores com a fonte (apostila) antes do uso clínico formal.
// ---------------------------------------------------------------------------
export type ClasseVO2 = "muito_fraco" | "fraco" | "regular" | "bom" | "excelente";

const LIMITES_VO2: Record<"masculino" | "feminino", { ate: number; limites: [number, number, number, number] }[]> = {
  masculino: [
    { ate: 29, limites: [25, 34, 43, 53] },
    { ate: 39, limites: [23, 31, 39, 49] },
    { ate: 49, limites: [20, 27, 36, 45] },
    { ate: 59, limites: [18, 25, 34, 43] },
    { ate: 200, limites: [16, 23, 31, 41] },
  ],
  feminino: [
    { ate: 29, limites: [24, 31, 38, 49] },
    { ate: 39, limites: [20, 28, 34, 45] },
    { ate: 49, limites: [17, 24, 31, 42] },
    { ate: 59, limites: [15, 21, 28, 38] },
    { ate: 200, limites: [13, 18, 24, 35] },
  ],
};

export const ROTULO_CLASSE_VO2: Record<ClasseVO2, string> = {
  muito_fraco: "Muito fraco",
  fraco: "Fraco",
  regular: "Regular",
  bom: "Bom",
  excelente: "Excelente",
};

// Abaixo de 20 anos usa a faixa de 20-29 (a tabela não cobre menores).
export function classificarVO2max(vo2: number, idade: number | null, sexo: SexoComp): ClasseVO2 | null {
  if (idade === null || sexo === "desconhecido") return null;
  const faixa = LIMITES_VO2[sexo].find((f) => idade <= f.ate);
  if (!faixa) return null;
  const [fraco, regular, bom, excelente] = faixa.limites;
  if (vo2 < fraco) return "muito_fraco";
  if (vo2 < regular) return "fraco";
  if (vo2 < bom) return "regular";
  if (vo2 < excelente) return "bom";
  return "excelente";
}

// ---------------------------------------------------------------------------
// PSE - Escala de Borg 6-20: descrição verbal do valor informado.
// ---------------------------------------------------------------------------
const ANCORAS_BORG: [number, string][] = [
  [6, "Nenhum esforço"],
  [7, "Extremamente leve"],
  [9, "Muito leve"],
  [11, "Leve"],
  [13, "Um pouco intenso"],
  [15, "Intenso (pesado)"],
  [17, "Muito intenso"],
  [19, "Extremamente intenso"],
  [20, "Esforço máximo"],
];

export type TomPSE = "info" | "ok" | "atencao" | "alerta" | "perigo" | "critico";

export function descreverPSE(valor: number): { rotulo: string; tom: TomPSE } | null {
  if (!Number.isFinite(valor) || valor < 6 || valor > 20) return null;
  const n = Math.round(valor);
  const exata = ANCORAS_BORG.find(([v]) => v === n);
  let rotulo: string;
  if (exata) {
    rotulo = exata[1];
  } else {
    const abaixo = [...ANCORAS_BORG].reverse().find(([v]) => v < n)!;
    const acima = ANCORAS_BORG.find(([v]) => v > n)!;
    rotulo = `Entre "${abaixo[1].toLowerCase()}" e "${acima[1].toLowerCase()}"`;
  }
  const tom: TomPSE = n <= 10 ? "info" : n <= 12 ? "ok" : n <= 14 ? "atencao" : n <= 16 ? "alerta" : n <= 18 ? "perigo" : "critico";
  return { rotulo, tom };
}

// PSE >= 17 é um dos critérios práticos de esforço máximo em testes
// progressivos - abaixo disso o teste pode ter sido interrompido antes do
// máximo e o VO2máx estimado tende a ficar subestimado.
export const PSE_ESFORCO_MAXIMO = 17;
