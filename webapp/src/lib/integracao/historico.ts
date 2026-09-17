// Etapa 11 — Reavaliação
// Extrai séries temporais dos indicadores objetivos a partir da tabela
// avaliacoes_historico, para comparação ANTES -> ATUAL -> META.

export type LinhaHistorico = {
  id: string;
  tipo: "fisica" | "postural" | "funcional";
  dados: Record<string, any>;
  avaliador: string | null;
  criado_em: string;
};

export type IndicadorDef = {
  chave: string;
  titulo: string;
  unidade: string;
  tipo: "fisica" | "funcional";
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
      const peso = Number(d.peso_kg);
      const altura = Number(d.altura_cm);
      if (!peso || !altura) return null;
      return peso / Math.pow(altura / 100, 2);
    },
  },
  { chave: "circ_cintura", titulo: "Circunferência de cintura", unidade: "cm", tipo: "fisica" },
  { chave: "pa_sistolica", titulo: "PA sistólica", unidade: "mmHg", tipo: "fisica" },
  { chave: "pa_diastolica", titulo: "PA diastólica", unidade: "mmHg", tipo: "fisica" },
  { chave: "fc_repouso", titulo: "FC de repouso", unidade: "bpm", tipo: "fisica" },
  { chave: "percentual_gordura", titulo: "% de gordura", unidade: "%", tipo: "fisica" },
  { chave: "chair_stand_reps", titulo: "30s Chair Stand", unidade: "reps", tipo: "funcional" },
  { chave: "tug_seg", titulo: "TUG", unidade: "s", tipo: "funcional" },
  { chave: "velocidade_marcha_ms", titulo: "Velocidade de marcha", unidade: "m/s", tipo: "funcional" },
  { chave: "tc6_metros", titulo: "TC6", unidade: "m", tipo: "funcional" },
  { chave: "dinamometria_d_kg", titulo: "Dinamometria D", unidade: "kgf", tipo: "funcional" },
  { chave: "dinamometria_e_kg", titulo: "Dinamometria E", unidade: "kgf", tipo: "funcional" },
  { chave: "apoio_unipodal_d_seg", titulo: "Apoio unipodal D", unidade: "s", tipo: "funcional" },
  { chave: "apoio_unipodal_e_seg", titulo: "Apoio unipodal E", unidade: "s", tipo: "funcional" },
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
      const valor = indicador.derivado ? indicador.derivado(h.dados) : Number(h.dados[indicador.chave]);
      if (valor === null || valor === undefined || !Number.isFinite(valor)) return null;
      return { valor, data: h.criado_em, avaliador: h.avaliador };
    })
    .filter((p): p is PontoHistorico => p !== null)
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
}
