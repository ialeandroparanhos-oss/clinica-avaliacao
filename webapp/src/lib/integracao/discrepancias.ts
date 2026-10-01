// Agente 6 — Íris: Detecção de discrepância.
//
// Cruza o autorrelato do paciente (anamnese, tags de perfil) com os
// achados objetivos (fotos/observações posturais, testes funcionais) para
// sinalizar pontos que merecem ser conversados na devolutiva - nunca uma
// acusação de que o paciente "mentiu", apenas um convite a investigar
// juntos a diferença entre percepção e medida objetiva.
//
// Depende de dois recursos anteriores: as fotos posturais (Léo) dão mais
// base ao texto de observação postural, e as tags de perfil (Nina/Rita, em
// tagsPerfil.ts) dão o rótulo do que o paciente relatou sobre si mesmo.

import type { PacienteRow } from "@/lib/anamnese/types";
import { calcularPerfilIntegrado } from "./perfil";
import { calcularTagsPerfil } from "./tagsPerfil";

export type Discrepancia = {
  titulo: string;
  descricao: string;
};

const PALAVRAS_ATENCAO_POSTURAL = ["assimetria", "compensa", "limita", "restri", "desvio", "instabilidade", "valgo"];

export function detectarDiscrepancias(paciente: PacienteRow): Discrepancia[] {
  const achados: Discrepancia[] = [];
  const anamnese = paciente.anamnese;
  if (!anamnese) return achados;

  const perfil = calcularPerfilIntegrado(paciente);
  const tags = calcularTagsPerfil(paciente);
  const dominio = (chave: string) => perfil.dominios.find((d) => d.chave === chave);

  // 1. Nega dor atualmente, mas a observação postural (apoiada ou não por
  //    foto) menciona termos de atenção/compensação.
  const textoPostural = [
    paciente.postural?.obs_anterior,
    paciente.postural?.obs_posterior,
    paciente.postural?.obs_lateral_d,
    paciente.postural?.obs_lateral_e,
    paciente.postural?.obs_movimento,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const temFoto = Boolean(
    paciente.postural?.foto_anterior_path ||
      paciente.postural?.foto_posterior_path ||
      paciente.postural?.foto_lateral_d_path ||
      paciente.postural?.foto_lateral_e_path
  );
  const palavraAchada = PALAVRAS_ATENCAO_POSTURAL.find((p) => textoPostural.includes(p));
  if (anamnese.dor?.tem_dor === false && palavraAchada) {
    achados.push({
      titulo: "Nega dor, mas a avaliação postural registra sinal de atenção",
      descricao: `O paciente relata não sentir dor atualmente, mas a observação postural${
        temFoto ? " (com registro fotográfico)" : ""
      } menciona "${palavraAchada}". Vale conversar sobre isso na devolutiva.`,
    });
  }

  // 2. Perfil sugere força preservada (alta demanda física no trabalho ou
  //    já treina com carga), mas o teste objetivo de força está em
  //    prioridade de intervenção.
  const forca = dominio("forca");
  const tagsForca = tags.filter((t) => t.chave === "alta_demanda_fisica_trabalho" || t.chave === "pratica_treino_resistido");
  if (tagsForca.length > 0 && forca?.classificacao === "prioridade") {
    achados.push({
      titulo: "Perfil sugeriria força preservada, mas o teste objetivo não confirma",
      descricao: `${tagsForca.map((t) => t.rotulo).join(" e ")}, mas o teste de força mostrou: ${forca.justificativa}`,
    });
  }

  // 3. Relata sedentarismo, mas força e funcionalidade estão "adequado" nos
  //    testes objetivos - vale confirmar o autorrelato.
  const funcionalidade = dominio("funcionalidade");
  if (tags.some((t) => t.chave === "sedentario") && forca?.classificacao === "adequado" && funcionalidade?.classificacao === "adequado") {
    achados.push({
      titulo: "Relata sedentarismo, mas o desempenho funcional está dentro do esperado",
      descricao:
        "Os testes objetivos de força e funcionalidade não indicam limitação relevante - vale confirmar com o paciente o que ele entende por \"não pratica atividade física\" (pode haver atividade não reconhecida como exercício, como trabalho físico).",
    });
  }

  // 4. Perfil sinaliza risco de queda (idade ou histórico), mas TUG e apoio
  //    unipodal vieram "adequado" - achado tranquilizador, mas que merece
  //    registro explícito em vez de ficar implícito.
  const equilibrio = dominio("equilibrio");
  if (tags.some((t) => t.chave === "risco_queda") && equilibrio?.classificacao === "adequado") {
    achados.push({
      titulo: "Perfil sinaliza risco de queda, mas o equilíbrio testado está adequado",
      descricao: `${tags.find((t) => t.chave === "risco_queda")?.motivo} No entanto, os testes de equilíbrio aplicados não confirmaram limitação. Achado tranquilizador - mantenha o acompanhamento mesmo assim, dado o fator de risco presente na anamnese.`,
    });
  }

  return achados;
}
