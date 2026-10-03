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
// Classificação do VO2máx por idade e sexo - percentis FRIEND para esteira
// (VO2máx MEDIDO por ergoespirometria em adultos dos EUA sem doença
// cardiovascular conhecida; n = 7.783; Kaminsky, Arena, Myers. Mayo Clin Proc
// 2015;90(11):1515-1523, Tabela 1 - reproduzida em Kaminsky et al., Prog
// Cardiovasc Dis 2019, https://doi.org/10.1016/j.pcad.2018.10.003).
// Colunas: percentis 5, 10, 25, 50, 75, 90 e 95 (mL/kg/min).
//
// Limites do uso: a população é norte-americana (o próprio registro mostra
// valores mais altos em noruegueses) e as nossas estimativas vêm de equação
// (Bruce/Foster, Cooper), menos precisas que o VO2 medido; a comparação é
// uma referência, não um diagnóstico.
// ---------------------------------------------------------------------------
export type ClasseVO2 = "muito_fraco" | "fraco" | "regular" | "bom" | "excelente";

const PERCENTIS_FRIEND = [5, 10, 25, 50, 75, 90, 95] as const;

const FRIEND_ESTEIRA: Record<"masculino" | "feminino", { faixa: string; ate: number; valores: number[] }[]> = {
  masculino: [
    { faixa: "20-29", ate: 29, valores: [29.0, 32.1, 40.1, 48.0, 55.2, 61.8, 66.3] },
    { faixa: "30-39", ate: 39, valores: [27.2, 30.2, 35.9, 42.4, 49.2, 56.5, 59.8] },
    { faixa: "40-49", ate: 49, valores: [24.2, 26.8, 31.9, 37.8, 45.0, 52.1, 55.6] },
    { faixa: "50-59", ate: 59, valores: [20.9, 22.8, 27.1, 32.6, 39.7, 45.6, 50.7] },
    { faixa: "60-69", ate: 69, valores: [17.4, 19.8, 23.7, 28.2, 34.5, 40.3, 43.0] },
    { faixa: "70-79", ate: 200, valores: [16.3, 17.1, 20.4, 24.4, 30.4, 36.6, 39.7] },
  ],
  feminino: [
    { faixa: "20-29", ate: 29, valores: [21.7, 23.9, 30.5, 37.6, 44.7, 51.3, 56.0] },
    { faixa: "30-39", ate: 39, valores: [19.0, 20.9, 25.3, 30.2, 36.1, 41.4, 45.8] },
    { faixa: "40-49", ate: 49, valores: [17.0, 18.8, 22.1, 26.7, 32.4, 38.4, 41.7] },
    { faixa: "50-59", ate: 59, valores: [16.0, 17.3, 19.9, 23.4, 27.6, 32.0, 35.9] },
    { faixa: "60-69", ate: 69, valores: [13.4, 14.6, 17.2, 20.0, 23.8, 27.0, 29.4] },
    { faixa: "70-79", ate: 200, valores: [13.1, 13.6, 15.6, 18.3, 20.8, 23.1, 24.1] },
  ],
};

// Classes pelas faixas de percentil (escolha deste projeto sobre os cortes
// FRIEND disponíveis): < P10 muito fraco; P10-P25 fraco; P25-P50 regular
// (abaixo da mediana); P50-P75 bom; >= P75 excelente.
export const ROTULO_CLASSE_VO2: Record<ClasseVO2, string> = {
  muito_fraco: "Muito fraco (< P10)",
  fraco: "Fraco (P10-P25)",
  regular: "Regular (P25-P50)",
  bom: "Bom (P50-P75)",
  excelente: "Excelente (≥ P75)",
};

export type AvaliacaoVO2 = {
  classe: ClasseVO2;
  // Percentil aproximado por interpolação linear entre os percentis da tabela
  // (null quando fora do intervalo P5-P95, caso em que textoPercentil traz "< P5" ou "> P95").
  percentil: number | null;
  textoPercentil: string;
  faixaEtaria: string;
  // true quando a idade está fora de 20-79 e a faixa mais próxima foi usada.
  extrapolado: boolean;
};

export function avaliarVO2max(vo2: number, idade: number | null, sexo: SexoComp): AvaliacaoVO2 | null {
  if (idade === null || sexo === "desconhecido" || !Number.isFinite(vo2)) return null;
  const faixa = FRIEND_ESTEIRA[sexo].find((f) => idade <= f.ate);
  if (!faixa) return null;
  const v = faixa.valores;

  let percentil: number | null = null;
  let textoPercentil: string;
  if (vo2 < v[0]) {
    textoPercentil = "< P5";
  } else if (vo2 > v[v.length - 1]) {
    textoPercentil = "> P95";
  } else {
    let i = 0;
    while (i < v.length - 2 && vo2 > v[i + 1]) i++;
    const fracao = v[i + 1] === v[i] ? 0 : (vo2 - v[i]) / (v[i + 1] - v[i]);
    percentil = PERCENTIS_FRIEND[i] + fracao * (PERCENTIS_FRIEND[i + 1] - PERCENTIS_FRIEND[i]);
    textoPercentil = `≈ P${Math.round(percentil)}`;
  }

  const classe: ClasseVO2 = vo2 < v[1] ? "muito_fraco" : vo2 < v[2] ? "fraco" : vo2 < v[3] ? "regular" : vo2 < v[4] ? "bom" : "excelente";
  return { classe, percentil, textoPercentil, faixaEtaria: faixa.faixa, extrapolado: idade < 20 || idade >= 80 };
}

export function classificarVO2max(vo2: number, idade: number | null, sexo: SexoComp): ClasseVO2 | null {
  return avaliarVO2max(vo2, idade, sexo)?.classe ?? null;
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
