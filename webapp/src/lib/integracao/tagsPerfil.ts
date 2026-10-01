// Agente 1 — Coordenação (Nina): Tags de perfil do paciente.
//
// Produz rótulos descritivos derivados de critérios explícitos já presentes
// na anamnese/avaliações, para que outros agentes (hoje: Rita, Agente 5)
// possam priorizar quais testes aplicar primeiro. Isto é apenas uma
// sugestão de ênfase/ordem - nunca restringe o que o avaliador pode
// aplicar, e nunca produz diagnóstico (mesma regra do Agente 6 em perfil.ts).

import type { PacienteRow } from "@/lib/anamnese/types";

export type TagPerfilChave =
  | "idoso"
  | "risco_queda"
  | "sedentario"
  | "alta_demanda_fisica_trabalho"
  | "dor_atual"
  | "pratica_treino_resistido"
  | "restricao_cardiovascular_parq"
  | "limitacao_osteoarticular_parq";

export type TagPerfil = {
  chave: TagPerfilChave;
  rotulo: string;
  motivo: string;
};

function idadeAnos(p: PacienteRow): number | null {
  const n = Number(p.anamnese?.contexto?.idade);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function calcularTagsPerfil(paciente: PacienteRow): TagPerfil[] {
  const tags: TagPerfil[] = [];
  const a = paciente.anamnese;
  const idade = idadeAnos(paciente);

  if (idade !== null && idade >= 60) {
    tags.push({ chave: "idoso", rotulo: "Idoso (60+)", motivo: `Idade ${idade} anos.` });
  }

  if (a?.historico_saude?.quedas_12m === true) {
    tags.push({ chave: "risco_queda", rotulo: "Risco de queda", motivo: "Queda relatada nos últimos 12 meses." });
  } else if (idade !== null && idade >= 65) {
    tags.push({ chave: "risco_queda", rotulo: "Risco de queda", motivo: "Idade ≥ 65 anos." });
  }

  if (a?.atividade_fisica?.pratica_atual === false) {
    tags.push({ chave: "sedentario", rotulo: "Sedentário(a)", motivo: "Não pratica atividade física atualmente, segundo a anamnese." });
  }

  if (a?.contexto?.exige_esforco_fisico === true) {
    tags.push({
      chave: "alta_demanda_fisica_trabalho",
      rotulo: "Alta demanda física no trabalho",
      motivo: "Relata esforço físico exigido pelo trabalho.",
    });
  }

  if (a?.dor?.tem_dor === true) {
    tags.push({ chave: "dor_atual", rotulo: "Dor atual", motivo: "Relata dor atual na anamnese." });
  }

  const modalidades = (a?.atividade_fisica?.modalidades || "").toLowerCase();
  if (a?.atividade_fisica?.pratica_atual === true && /muscula|peso|resistid|academia|cross/.test(modalidades)) {
    tags.push({
      chave: "pratica_treino_resistido",
      rotulo: "Já treina com carga",
      motivo: `Modalidade relatada: "${a.atividade_fisica.modalidades}".`,
    });
  }

  const parq = a?.prontidao?.parq;
  if (parq?.heart_condition === true || parq?.chest_pain === true || parq?.bp_or_heart_med === true || parq?.dizziness === true) {
    tags.push({
      chave: "restricao_cardiovascular_parq",
      rotulo: "Alerta cardiovascular (PAR-Q)",
      motivo: "Resposta positiva no PAR-Q relacionada a coração, pressão ou tontura.",
    });
  }

  if (parq?.bone_joint === true) {
    tags.push({
      chave: "limitacao_osteoarticular_parq",
      rotulo: "Alerta osteoarticular (PAR-Q)",
      motivo: "PAR-Q positivo para problema ósseo/articular que pode piorar com esforço.",
    });
  }

  return tags;
}

// ---------------------------------------------------------------------------
// Seleção adaptativa de testes (Agente 5 — Rita)
// ---------------------------------------------------------------------------
export type GrupoTesteFuncional =
  | "chair_stand_5sts"
  | "tug"
  | "apoio_unipodal"
  | "velocidade_marcha"
  | "dinamometria"
  | "rm_submaximo"
  | "falha_carga_fixa"
  | "goniometria"
  | "agachamento_livre"
  | "core_estabilidade";

const GATILHOS: Record<GrupoTesteFuncional, TagPerfilChave[]> = {
  chair_stand_5sts: ["idoso", "risco_queda", "sedentario"],
  tug: ["idoso", "risco_queda"],
  apoio_unipodal: ["idoso", "risco_queda"],
  velocidade_marcha: ["idoso", "risco_queda", "sedentario"],
  dinamometria: ["idoso", "risco_queda"],
  rm_submaximo: ["pratica_treino_resistido"],
  falha_carga_fixa: ["pratica_treino_resistido"],
  goniometria: ["dor_atual", "limitacao_osteoarticular_parq"],
  agachamento_livre: ["alta_demanda_fisica_trabalho", "limitacao_osteoarticular_parq", "dor_atual"],
  core_estabilidade: ["dor_atual", "alta_demanda_fisica_trabalho"],
};

export const ROTULOS_GRUPO: Record<GrupoTesteFuncional, string> = {
  chair_stand_5sts: "Chair Stand / 5x Sit-to-Stand",
  tug: "TUG",
  apoio_unipodal: "Apoio unipodal",
  velocidade_marcha: "Velocidade de marcha",
  dinamometria: "Dinamometria",
  rm_submaximo: "RM submáximo",
  falha_carga_fixa: "Repetições até a falha (carga fixa)",
  goniometria: "Amplitude articular (goniometria)",
  agachamento_livre: "Agachamento livre",
  core_estabilidade: "Estabilidade do core",
};

// Para cada grupo de teste com ao menos um gatilho ativo no perfil, retorna
// os rótulos das tags que o recomendaram - vazio quando nada recomenda
// aquele grupo especificamente (o avaliador decide com base no caso).
export function gruposRecomendados(tags: TagPerfil[]): Partial<Record<GrupoTesteFuncional, string[]>> {
  const resultado: Partial<Record<GrupoTesteFuncional, string[]>> = {};
  for (const grupo of Object.keys(GATILHOS) as GrupoTesteFuncional[]) {
    const motivos = tags.filter((t) => GATILHOS[grupo].includes(t.chave)).map((t) => t.rotulo);
    if (motivos.length > 0) resultado[grupo] = motivos;
  }
  return resultado;
}
