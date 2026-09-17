// Agente 7 — Plano de Intervenção
// Transforma as Prioridades do Perfil Integrado (Agente 6) em uma
// trajetória de 30/90/180/365 dias. Ver 06-Agente7-Plano-de-Intervencao.md.
//
// Regra fixa: todo item nasce com uma "origem" rastreável no Perfil
// Integrado. O Agente 7 nunca decide a conduta técnica (carga, exercício
// específico) - apenas organiza a lógica de priorização temporal.

import type { PerfilIntegrado } from "./perfil";

export type Horizonte = "30" | "90" | "180" | "365";

export const HORIZONTES: { chave: Horizonte; titulo: string }[] = [
  { chave: "30", titulo: "30 dias — Adaptação e primeiras correções" },
  { chave: "90", titulo: "90 dias — Desenvolvimento inicial" },
  { chave: "180", titulo: "180 dias — Consolidação e evolução" },
  { chave: "365", titulo: "365 dias — Manutenção, autonomia e performance" },
];

export type ItemPlano = {
  id: string;
  horizonte: Horizonte;
  descricao: string;
  origem: string;
};

export type Encaminhamento = {
  id: string;
  especialidade: string;
  motivo: string;
};

export type Plano = {
  itens: ItemPlano[];
  encaminhamentos: Encaminhamento[];
  metas?: Record<string, string>;
  avaliador?: string | null;
  atualizado_em?: string;
};

function gerarId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Sugestão inicial a partir do Perfil Integrado: Riscos sempre entram em
// 30 dias (regra de precedência, Seção 3.1 do documento do Agente 7);
// Limitações entram em 90 dias por padrão, para o avaliador ajustar.
export function sugerirPlano(perfil: PerfilIntegrado): Pick<Plano, "itens" | "encaminhamentos"> {
  const itens: ItemPlano[] = [
    ...perfil.riscos.map((d) => ({
      id: gerarId(),
      horizonte: "30" as Horizonte,
      descricao: `${d.titulo}: ${d.justificativa}`,
      origem: `Risco — ${d.titulo}`,
    })),
    ...perfil.limitacoes.map((d) => ({
      id: gerarId(),
      horizonte: "90" as Horizonte,
      descricao: `${d.titulo}: ${d.justificativa}`,
      origem: `Limitação — ${d.titulo}`,
    })),
  ];

  const encaminhamentos: Encaminhamento[] = [];
  for (const risco of perfil.riscos) {
    if (risco.chave === "bem_estar") {
      encaminhamentos.push({ id: gerarId(), especialidade: "Psicologia/Psiquiatria (triagem)", motivo: risco.justificativa });
    }
    if (risco.chave === "dor") {
      encaminhamentos.push({ id: gerarId(), especialidade: "Avaliação médica", motivo: risco.justificativa });
    }
  }

  return { itens, encaminhamentos };
}
