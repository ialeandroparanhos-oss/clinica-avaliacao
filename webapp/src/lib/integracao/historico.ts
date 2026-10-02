// Etapa 11 — Reavaliação
// Extrai séries temporais dos indicadores objetivos a partir da tabela
// avaliacoes_historico, para comparação ANTES -> ATUAL -> META.

import { vo2maxBruceFoster, vo2maxCooper, metDeVo2 } from "@/lib/avaliacao/cardiorrespiratoria";
import { CAMPOS_CIRCUNFERENCIA, REGIOES_MASSA_MAGRA, expansibilidadeToracica, massaMagraRelativaDaRegiao } from "@/lib/avaliacao/medidasRegionais";
import { paraNumero } from "@/lib/numeros";

function vo2maxDeRegistro(d: Record<string, any>): number | null {
  const manual = paraNumero(d.vo2max_manual);
  if (manual !== null) return manual;
  const tempo = paraNumero(d.bruce_tempo_total_min);
  if (d.protocolo === "bruce" && tempo !== null) return vo2maxBruceFoster(tempo);
  const distancia = paraNumero(d.cooper_distancia_m);
  if (d.protocolo === "cooper" && distancia !== null) return vo2maxCooper(distancia);
  return null;
}

export type LinhaHistorico = {
  id: string;
  tipo: "fisica" | "postural" | "funcional" | "cardio";
  dados: Record<string, any>;
  avaliador: string | null;
  criado_em: string;
};

export type IndicadorDef = {
  chave: string;
  titulo: string;
  unidade: string;
  tipo: "fisica" | "funcional" | "cardio";
  // Indicadores derivados (ex.: IMC) calculam o valor a partir de "dados"
  // em vez de ler um campo direto.
  derivado?: (dados: Record<string, any>) => number | null;
};

export const INDICADORES: IndicadorDef[] = [
  { chave: "peso_kg", titulo: "Peso", unidade: "kg", tipo: "fisica" },
  {
    chave: "imc",
    titulo: "IMC",
    unidade: "",
    tipo: "fisica",
    derivado: (d) => {
      const peso = paraNumero(d.peso_kg);
      const altura = paraNumero(d.altura_cm);
      if (!peso || !altura) return null;
      return peso / Math.pow(altura / 100, 2);
    },
  },
  { chave: "pa_sistolica", titulo: "PA sistólica", unidade: "mmHg", tipo: "fisica" },
  { chave: "pa_diastolica", titulo: "PA diastólica", unidade: "mmHg", tipo: "fisica" },
  { chave: "fc_repouso", titulo: "FC de repouso", unidade: "bpm", tipo: "fisica" },
  { chave: "percentual_gordura", titulo: "% de gordura", unidade: "%", tipo: "fisica" },
  {
    chave: "massa_magra_kg",
    titulo: "Massa magra",
    unidade: "kg",
    tipo: "fisica",
    derivado: (d) => {
      const peso = paraNumero(d.peso_kg);
      const pg = paraNumero(d.percentual_gordura);
      if (!peso || !pg) return null;
      return peso - (peso * pg) / 100;
    },
  },
  ...CAMPOS_CIRCUNFERENCIA.map(
    (campo): IndicadorDef => ({ chave: campo.chave, titulo: `Circunferência - ${campo.rotulo}`, unidade: "cm", tipo: "fisica" })
  ),
  {
    chave: "expansibilidade_toracica",
    titulo: "Expansibilidade torácica (insp. máx - mín)",
    unidade: "cm",
    tipo: "fisica",
    derivado: expansibilidadeToracica,
  },
  ...REGIOES_MASSA_MAGRA.map(
    (regiao): IndicadorDef => ({
      chave: `massa_magra_rel_${regiao.id}`,
      titulo: `Massa magra relativa - ${regiao.rotulo}`,
      unidade: "cm",
      tipo: "fisica",
      derivado: (d) => massaMagraRelativaDaRegiao(d, regiao).corrigida,
    })
  ),
  { chave: "chair_stand_reps", titulo: "30s Chair Stand", unidade: "reps", tipo: "funcional" },
  { chave: "tug_seg", titulo: "TUG", unidade: "s", tipo: "funcional" },
  { chave: "velocidade_marcha_ms", titulo: "Velocidade de marcha", unidade: "m/s", tipo: "funcional" },
  { chave: "tc6_metros", titulo: "TC6", unidade: "m", tipo: "funcional" },
  { chave: "dinamometria_d_kg", titulo: "Dinamometria D", unidade: "kgf", tipo: "funcional" },
  { chave: "dinamometria_e_kg", titulo: "Dinamometria E", unidade: "kgf", tipo: "funcional" },
  { chave: "apoio_unipodal_d_seg", titulo: "Apoio unipodal D", unidade: "s", tipo: "funcional" },
  { chave: "apoio_unipodal_e_seg", titulo: "Apoio unipodal E", unidade: "s", tipo: "funcional" },
  { chave: "vo2max", titulo: "VO2máx estimado", unidade: "ml/kg/min", tipo: "cardio", derivado: vo2maxDeRegistro },
  {
    chave: "met",
    titulo: "MET",
    unidade: "",
    tipo: "cardio",
    derivado: (d) => {
      const vo2max = vo2maxDeRegistro(d);
      return vo2max !== null ? metDeVo2(vo2max) : null;
    },
  },
  { chave: "rampa_velocidade_final_kmh", titulo: "vVO2máx (rampa)", unidade: "km/h", tipo: "cardio" },
  { chave: "fc_maxima_atingida", titulo: "FC máxima atingida", unidade: "bpm", tipo: "cardio" },
];

export type PontoHistorico = {
  valor: number;
  data: string;
  avaliador: string | null;
};

export function extrairSerie(historico: LinhaHistorico[], indicador: IndicadorDef): PontoHistorico[] {
  return historico
    .filter((h) => h.tipo === indicador.tipo)
    .map((h) => {
      const valor = indicador.derivado ? indicador.derivado(h.dados) : paraNumero(h.dados[indicador.chave]);
      if (valor === null || valor === undefined || !Number.isFinite(valor)) return null;
      return { valor, data: h.criado_em, avaliador: h.avaliador };
    })
    .filter((p): p is PontoHistorico => p !== null)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}

