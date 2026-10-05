// Dor por região (mapa corporal): regras para derivar os campos antigos
// (localizacoes, intensidade_nrs, duracao) que o painel integrado, os alertas e
// o relatório já leem.

import type { Anamnese } from "./types";

export type PorRegiao = Anamnese["dor"]["por_regiao"];

export function textoIntensidade(n: number): string {
  if (n === 0) return "sem dor";
  if (n <= 3) return "leve";
  if (n <= 6) return "moderada";
  if (n <= 9) return "forte";
  return "pior dor imaginável";
}

// Cor da escala (verde -> vermelho), usada no mapa e nos botões da escala.
export function corIntensidade(n: number): string {
  return `hsl(${Math.round(130 - 13 * n)} 72% 58%)`;
}

// Regiões efetivas: se a ficha é antiga (só localizações + uma intensidade
// única), mostra cada região com esses valores sem alterar o dado salvo.
export function regioesEfetivas(dor: Anamnese["dor"]): PorRegiao {
  const por = dor.por_regiao ?? {};
  if (Object.keys(por).length > 0 || dor.localizacoes.length === 0) return por;
  const legado: PorRegiao = {};
  for (const r of dor.localizacoes) legado[r] = { intensidade: dor.intensidade_nrs, duracao: dor.duracao };
  return legado;
}

// Campos derivados a gravar sempre que o mapa muda.
export function derivadosDaDor(por: PorRegiao): Pick<Anamnese["dor"], "por_regiao" | "localizacoes" | "intensidade_nrs" | "duracao"> {
  const regioes = Object.keys(por);
  const intensidades = regioes.map((r) => por[r].intensidade).filter((v): v is number => v !== null);
  const duracoes = regioes.map((r) => ({ regiao: r, duracao: por[r].duracao })).filter((x) => x.duracao);
  const unicas = new Set(duracoes.map((x) => x.duracao));
  const duracao = duracoes.length === 0 ? "" : unicas.size === 1 ? duracoes[0].duracao : duracoes.map((x) => `${x.regiao}: ${x.duracao}`).join("; ");
  return {
    por_regiao: por,
    localizacoes: regioes,
    intensidade_nrs: intensidades.length > 0 ? Math.max(...intensidades) : null,
    duracao,
  };
}

// Linhas legíveis para o avaliador e o relatório.
export function linhasDorPorRegiao(dor: Anamnese["dor"]): string[] {
  const por = regioesEfetivas(dor);
  return Object.entries(por).map(([regiao, v]) => {
    const partes = [v.intensidade !== null ? `${v.intensidade}/10 (${textoIntensidade(v.intensidade)})` : "intensidade não informada", v.duracao || null].filter(Boolean);
    return `${regiao}: ${partes.join(" · ")}`;
  });
}
