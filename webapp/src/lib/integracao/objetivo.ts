// Agente 7 — Theo: conexão prioridade ↔ objetivo.
//
// Tenta ligar cada domínio prioritário do Perfil Integrado (Agente 6) ao
// que o próprio paciente disse querer no capítulo "Motivo da procura" da
// anamnese, por casamento de palavra-chave. É uma heurística de apoio para
// começar a devolutiva - nunca substitui o profissional lendo o relato
// completo e decidindo a conexão fina.

import type { Anamnese } from "@/lib/anamnese/types";
import type { DomainKey, DomainResult } from "./perfil";

const PALAVRAS_POR_DOMINIO: Record<DomainKey, string[]> = {
  forca: ["força", "forca", "fraqueza", "fraco", "fraca", "levantar", "carregar", "pegar peso", "musculação", "musculacao"],
  mobilidade: ["mobilidade", "flexibilidade", "alongar", "rigidez", "travado", "travada"],
  equilibrio: ["equilíbrio", "equilibrio", "queda", "cair", "tropeç"],
  capacidade_cardiorrespiratoria: ["fôlego", "folego", "cansaço", "cansaco", "respira", "caminhar longe", "correr", "subir escada", "condicionamento"],
  composicao_corporal: ["peso", "emagrecer", "gordura", "barriga", "engordar", "secar"],
  dor: ["dor", "dói", "doi", "incomod"],
  estilo_de_vida: ["hábito", "habito", "rotina", "fumar", "beber", "sedentari", "alimentação", "alimentacao"],
  sono: ["sono", "dormir", "insônia", "insonia", "acordar cansado"],
  bem_estar: ["ansiedade", "estresse", "stress", "humor", "emocional", "depress"],
  funcionalidade: ["atividade", "autonomia", "independente", "agachar", "levantar do chão", "levantar do chao", "brincar com", "trabalho", "subir escada", "jogar"],
};

// Retorna a frase original do paciente (não reescrita) onde a palavra-chave
// foi encontrada, para que o avaliador veja a conexão com as próprias
// palavras de quem respondeu - null quando nenhuma palavra-chave bate.
export function conectarObjetivo(dominio: DomainResult, motivo: Anamnese["motivo"]): string | null {
  const campos = [motivo?.objetivos, motivo?.atividades_perdidas, motivo?.queixa_principal, motivo?.motivo_procura];
  const palavras = PALAVRAS_POR_DOMINIO[dominio.chave] || [];
  for (const campo of campos) {
    if (!campo) continue;
    const texto = campo.toLowerCase();
    if (palavras.some((p) => texto.includes(p))) return campo;
  }
  return null;
}
