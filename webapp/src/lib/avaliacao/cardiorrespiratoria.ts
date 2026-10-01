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
