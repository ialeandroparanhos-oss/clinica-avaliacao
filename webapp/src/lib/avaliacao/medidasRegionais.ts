// Agente 3 — Marco: circunferências e massa magra relativa por região.
//
// Massa magra relativa de um segmento = circunferência corrigida pela
// gordura subcutânea: circ(cm) - π x dobra(mm / 10). É a mesma lógica da
// circunferência muscular do braço (CMB = CB - π x DCT) estendida a outras
// regiões, usando a dobra cutânea correspondente já coletada na seção de
// dobras. Serve para acompanhar, região por região, se a circunferência
// mudou por perda de gordura ou por ganho de massa magra.

import { paraNumero } from "@/lib/numeros";

export type CampoCirc = { chave: string; rotulo: string };

export const CIRC_TRONCO: CampoCirc[] = [
  { chave: "circ_ombro", rotulo: "Ombro" },
  { chave: "circ_peitoral", rotulo: "Peitoral" },
  { chave: "circ_torax_insp_max", rotulo: "Tórax - inspiração máxima" },
  { chave: "circ_torax_insp_min", rotulo: "Tórax - inspiração mínima" },
  { chave: "circ_cintura", rotulo: "Cintura" },
  { chave: "circ_abdomen", rotulo: "Abdômen" },
  { chave: "circ_quadril", rotulo: "Quadril" },
];

// Segmentos bilaterais: chaves circ_<id>_d e circ_<id>_e.
export const CIRC_MEMBROS: { id: string; rotulo: string; feminino?: boolean }[] = [
  { id: "braco", rotulo: "Braço" },
  { id: "antebraco", rotulo: "Antebraço" },
  { id: "coxa", rotulo: "Coxa", feminino: true },
  { id: "panturrilha", rotulo: "Panturrilha", feminino: true },
];

// A coxa pode ser medida em até três níveis (proximal, médio, distal), todos ou
// só um; o avaliador escolhe quantos usar. Chaves: circ_coxa_<nivel>_d / _e.
export const NIVEIS_COXA: { value: string; label: string }[] = [
  { value: "proximal", label: "Proximal" },
  { value: "medio", label: "Médio" },
  { value: "distal", label: "Distal" },
];

export const CAMPOS_COXA_NIVEIS: CampoCirc[] = NIVEIS_COXA.flatMap((n) => [
  { chave: `circ_coxa_${n.value}_d`, rotulo: `Coxa ${n.label.toLowerCase()} D` },
  { chave: `circ_coxa_${n.value}_e`, rotulo: `Coxa ${n.label.toLowerCase()} E` },
]);

export const CAMPOS_CIRCUNFERENCIA: CampoCirc[] = [
  ...CIRC_TRONCO,
  ...CIRC_MEMBROS.flatMap((m) => [
    { chave: `circ_${m.id}_d`, rotulo: `${m.rotulo} D` },
    { chave: `circ_${m.id}_e`, rotulo: `${m.rotulo} E` },
  ]),
  ...CAMPOS_COXA_NIVEIS,
];

// Circunferência de coxa "principal" de um lado, usada na massa magra relativa,
// no avatar e no histórico: nível médio (onde fica a dobra de coxa), senão
// proximal, senão distal, senão o valor único antigo (circ_coxa_d/e).
export function circunferenciaCoxaPrincipal(dados: Record<string, any>, lado: "d" | "e"): { valor: number | null; nivel: string | null } {
  for (const nivel of ["medio", "proximal", "distal"]) {
    const v = paraNumero(dados[`circ_coxa_${nivel}_${lado}`]);
    if (v !== null) return { valor: v, nivel };
  }
  return { valor: paraNumero(dados[`circ_coxa_${lado}`]), nivel: null };
}

// Diferença entre os lados de um segmento bilateral (direito x esquerdo).
export type Assimetria = { difCm: number; pct: number; maior: "D" | "E" | "igual" };

export function assimetriaLados(direito: number | null, esquerdo: number | null): Assimetria | null {
  if (direito === null || esquerdo === null || direito <= 0 || esquerdo <= 0) return null;
  const dif = direito - esquerdo;
  const maior = Math.max(direito, esquerdo);
  return { difCm: Math.abs(dif), pct: (Math.abs(dif) / maior) * 100, maior: dif > 0.0001 ? "D" : dif < -0.0001 ? "E" : "igual" };
}

// Diferença a partir da qual vale chamar atenção. Não há corte validado para
// circunferências: 10% é a referência prática usada para assimetrias de membros
// (a dominância lateral explica parte da diferença, sobretudo nos braços).
export const LIMITE_ASSIMETRIA_PCT = 10;

export type RegiaoMagra = {
  id: string;
  rotulo: string;
  circChave: string;
  dobraChave: string;
  dobraRotulo: string;
};

export const REGIOES_MASSA_MAGRA: RegiaoMagra[] = [
  { id: "braco_d_triceps", rotulo: "Braço D (tríceps)", circChave: "circ_braco_d", dobraChave: "dc_triceps", dobraRotulo: "Tríceps" },
  { id: "braco_e_triceps", rotulo: "Braço E (tríceps)", circChave: "circ_braco_e", dobraChave: "dc_triceps", dobraRotulo: "Tríceps" },
  { id: "braco_d_biceps", rotulo: "Braço D (bíceps)", circChave: "circ_braco_d", dobraChave: "dc_biceps", dobraRotulo: "Bíceps" },
  { id: "braco_e_biceps", rotulo: "Braço E (bíceps)", circChave: "circ_braco_e", dobraChave: "dc_biceps", dobraRotulo: "Bíceps" },
  { id: "peitoral", rotulo: "Peitoral", circChave: "circ_peitoral", dobraChave: "dc_peitoral", dobraRotulo: "Peitoral" },
  { id: "cintura", rotulo: "Cintura", circChave: "circ_cintura", dobraChave: "dc_suprailiaca", dobraRotulo: "Supra-ilíaca" },
  { id: "abdomen", rotulo: "Abdômen", circChave: "circ_abdomen", dobraChave: "dc_abdominal", dobraRotulo: "Abdominal" },
  { id: "coxa_d", rotulo: "Coxa D", circChave: "circ_coxa_d", dobraChave: "dc_coxa", dobraRotulo: "Coxa" },
  { id: "coxa_e", rotulo: "Coxa E", circChave: "circ_coxa_e", dobraChave: "dc_coxa", dobraRotulo: "Coxa" },
  { id: "panturrilha_d", rotulo: "Panturrilha D", circChave: "circ_panturrilha_d", dobraChave: "dc_panturrilha", dobraRotulo: "Panturrilha medial" },
  { id: "panturrilha_e", rotulo: "Panturrilha E", circChave: "circ_panturrilha_e", dobraChave: "dc_panturrilha", dobraRotulo: "Panturrilha medial" },
];

export function circunferenciaCorrigida(circCm: number, dobraMm: number): number {
  return circCm - Math.PI * (dobraMm / 10);
}

export type LinhaMassaMagraRelativa = {
  regiao: RegiaoMagra;
  circ: number | null;
  dobra: number | null;
  corrigida: number | null;
};

export function massaMagraRelativaDaRegiao(dados: Record<string, any>, regiao: RegiaoMagra): LinhaMassaMagraRelativa {
  const circ = paraNumero(dados[regiao.circChave]);
  const dobra = paraNumero(dados[regiao.dobraChave]);
  const corrigida = circ !== null && dobra !== null && circ > 0 && dobra >= 0 ? circunferenciaCorrigida(circ, dobra) : null;
  return { regiao, circ, dobra, corrigida };
}

export function calcularMassaMagraRelativa(dados: Record<string, any>): LinhaMassaMagraRelativa[] {
  return REGIOES_MASSA_MAGRA.map((r) => massaMagraRelativaDaRegiao(dados, r));
}

// Cirtometria torácica: diferença entre a circunferência na inspiração
// máxima e na inspiração mínima (expiração).
export function expansibilidadeToracica(dados: Record<string, any>): number | null {
  const max = paraNumero(dados.circ_torax_insp_max);
  const min = paraNumero(dados.circ_torax_insp_min);
  if (max === null || min === null) return null;
  return max - min;
}
