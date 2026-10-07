// Agente 7 — Plano de Intervenção
// Transforma o Perfil Integrado (Agente 6) em uma trajetória de 30/60/90 dias e
// anual (365), CONFRONTADA COM A LITERATURA: cada sugestão traz a dose, o
// resultado do paciente que a motivou, a evidência (com fonte) e o indicador
// para saber se funcionou. O avaliador revisa tudo: concorda, discorda (com o
// motivo), edita ou acrescenta - nada entra no plano sem a sua decisão.
// Ver 06-Agente7-Plano-de-Intervencao.md e planoCiencia.ts (as regras).
//
// Regra fixa: todo item nasce com uma "origem" rastreável no Perfil Integrado.
// As sugestões são apoio à decisão, nunca prescrição automática.

import type { PacienteRow } from "@/lib/anamnese/types";
import type { DomainKey, PerfilIntegrado } from "./perfil";
import { sugerirItensComCiencia } from "./planoCiencia";

// "180" existe só para planos salvos antes desta versão.
export type Horizonte = "30" | "60" | "90" | "180" | "365";

export const HORIZONTES: { chave: Horizonte; titulo: string; curto: string }[] = [
  { chave: "30", titulo: "30 dias — Segurança, adaptação e primeiras mudanças", curto: "30 dias" },
  { chave: "60", titulo: "60 dias — Progressão inicial", curto: "60 dias" },
  { chave: "90", titulo: "90 dias — Consolidação e reavaliação completa", curto: "90 dias" },
  { chave: "365", titulo: "Anual (365 dias) — Manutenção, autonomia e performance", curto: "Anual" },
];

export const HORIZONTE_LEGADO = { chave: "180" as Horizonte, titulo: "180 dias — plano anterior (mova para outro horizonte)", curto: "180 dias" };

export type Categoria = "intervencao" | "reavaliacao" | "seguranca" | "encaminhamento" | "orientacao";

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  intervencao: "Intervenção",
  reavaliacao: "Reavaliação",
  seguranca: "Segurança",
  encaminhamento: "Encaminhamento",
  orientacao: "Orientação",
};

// Decisão do avaliador sobre cada sugestão.
export type StatusItem = "sugerido" | "concordo" | "discordo" | "editado" | "manual";

export const ROTULO_STATUS: Record<StatusItem, string> = {
  sugerido: "A revisar",
  concordo: "Concordo",
  discordo: "Discordo",
  editado: "Editado",
  manual: "Adicionado por você",
};

export type Referencia = { rotulo: string; url?: string };

export type Evidencia = {
  resumo: string;
  // Que tipo de evidência sustenta (ex.: "ensaios clínicos e diretriz da OMS").
  certeza?: string;
  // Limites de uso (população, extrapolação) que o avaliador deve ter em mente.
  ressalva?: string;
  referencias: Referencia[];
};

export type ItemPlano = {
  id: string;
  horizonte: Horizonte;
  descricao: string;
  origem: string;
  // --- campos da versão com ciência (opcionais: planos antigos não os têm) ---
  categoria?: Categoria;
  dominio?: DomainKey;
  regra?: string; // identificador estável da regra (evita duplicar ao gerar de novo)
  resultado?: string; // achado do paciente que motivou a sugestão
  evidencia?: Evidencia;
  indicador?: string; // como saber que funcionou / meta
  objetivoPaciente?: string; // frase do paciente ligada à prioridade
  status?: StatusItem;
  comentario?: string; // motivo de discordar ou de editar
  descricaoOriginal?: string; // texto sugerido, guardado quando o avaliador edita
};

export type Encaminhamento = {
  id: string;
  especialidade: string;
  motivo: string;
  regra?: string;
  evidencia?: Evidencia;
  status?: StatusItem;
  comentario?: string;
};

export type Plano = {
  itens: ItemPlano[];
  encaminhamentos: Encaminhamento[];
  metas?: Record<string, string>;
  avaliador?: string | null;
  atualizado_em?: string;
  versao?: number;
};

// Plano salvo antes da decisão item a item: o que já estava salvo foi
// confirmado pelo avaliador, então conta como "concordo".
export function statusDe(i: { status?: StatusItem }): StatusItem {
  return i.status ?? "concordo";
}

// Itens que valem para o plano (entram no relatório): tudo menos "a revisar" e "discordo".
export function itemAprovado(i: { status?: StatusItem }): boolean {
  const s = statusDe(i);
  return s === "concordo" || s === "editado" || s === "manual";
}

export function gerarId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export type SugestaoPlano = Pick<Plano, "itens" | "encaminhamentos">;

// Gera as sugestões a partir do Perfil Integrado e dos dados do paciente.
// Cada item novo nasce "a revisar".
export function sugerirPlano(perfil: PerfilIntegrado, paciente: PacienteRow): SugestaoPlano {
  return sugerirItensComCiencia(perfil, paciente);
}

// Junta sugestões novas ao plano atual sem duplicar o que já existe (pela
// regra) e sem tocar no que o avaliador já decidiu ou editou.
export function mesclarSugestoes(atual: Pick<Plano, "itens" | "encaminhamentos">, sugestao: SugestaoPlano): Pick<Plano, "itens" | "encaminhamentos"> {
  const regrasItens = new Set(atual.itens.map((i) => i.regra).filter(Boolean));
  const descricoes = new Set(atual.itens.map((i) => i.descricao));
  const regrasEnc = new Set(atual.encaminhamentos.map((e) => e.regra).filter(Boolean));
  const textosEnc = new Set(atual.encaminhamentos.map((e) => e.especialidade + e.motivo));
  return {
    itens: [...atual.itens, ...sugestao.itens.filter((i) => !(i.regra && regrasItens.has(i.regra)) && !descricoes.has(i.descricao))],
    encaminhamentos: [...atual.encaminhamentos, ...sugestao.encaminhamentos.filter((e) => !(e.regra && regrasEnc.has(e.regra)) && !textosEnc.has(e.especialidade + e.motivo))],
  };
}
