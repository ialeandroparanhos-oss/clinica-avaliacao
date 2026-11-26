// Agente 1 — Dra. Nina (coordenação, assistente de IA): avaliações fundamentais para cada paciente.
//
// A partir da anamnese, diz em cada setor (Física, Postural, Funcional, Cardio e módulos da Anamnese) o que é
// FUNDAMENTAL medir neste caso, o que é RECOMENDADO e o que convém ADIAR OU EVITAR, sempre com o motivo (a resposta
// que gerou a sugestão). É só sugestão: nada é bloqueado e todos os testes continuam disponíveis; a decisão é do
// profissional. O que falta do fundamental aparece na barra fixa do topo da ficha.
//
// Referências conferidas no PubMed (26/11/2026):
//  - EWGSOP2: Cruz-Jentoft AJ et al. Age Ageing 2019;48:16-31, PMID 30312372 (força de preensão, sentar e
//    levantar, velocidade de marcha; panturrilha como alternativa simples de massa muscular).
//  - Diretriz mundial de quedas: Montero-Odasso M et al. Age Ageing 2022;51(9):afac205, PMID 36178003 (quem caiu
//    deve ter avaliação de risco de queda, com marcha e equilíbrio).
//  - ACSM 2015: Riebe D et al. Med Sci Sports Exerc 2015;47:2473-9, PMID 26473759 (triagem pré-participação:
//    atividade atual, sinais/sintomas ou doença conhecida e intensidade pretendida).
// As demais regras (dor por região, objetivo, pressão alta e testes até a falha) são critério prático e aparecem
// assim marcadas.

import type { PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { regioesEfetivas } from "@/lib/anamnese/dorPorRegiao";
import { moduloSinalizado, statusModulo, type ModuloId } from "@/lib/anamnese/modulos";
import { idadeEfetiva } from "./identificacao";
import { liberacaoPara } from "./liberacaoTeste";

export type SetorFundamental = "anamnese" | "fisica" | "postural" | "funcional" | "cardio";
export type PrioridadeAvaliacao = "fundamental" | "recomendado" | "evitar";

export type Fonte = { curta: string; pmid?: string };

export type ItemAvaliacao = {
  id: string;
  setor: SetorFundamental;
  titulo: string;
  prioridade: PrioridadeAvaliacao;
  motivos: string[];
  feito: boolean;
  fontes: Fonte[];
};

export const ROTULO_SETOR: Record<SetorFundamental, string> = {
  anamnese: "Anamnese",
  fisica: "Física",
  postural: "Postural",
  funcional: "Funcional",
  cardio: "Cardio",
};

const EWGSOP2: Fonte = { curta: "EWGSOP2 2019", pmid: "30312372" };
const QUEDAS: Fonte = { curta: "Diretriz mundial de quedas 2022", pmid: "36178003" };
const ACSM: Fonte = { curta: "ACSM 2015", pmid: "26473759" };
const PRATICO: Fonte = { curta: "critério prático" };

const FORTE = 7; // dor 7 ou mais (0 a 10)

// ---------------------------------------------------------------------------
// O que já foi feito em cada aba
// ---------------------------------------------------------------------------
function preenchido(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "number") return Number.isFinite(v);
  if (Array.isArray(v)) return v.length > 0;
  return true;
}
const algum = (o: Record<string, any> | null | undefined, chaves: string[]) => !!o && chaves.some((k) => preenchido(o[k]));
const todos = (o: Record<string, any> | null | undefined, chaves: string[]) => !!o && chaves.every((k) => preenchido(o[k]));
const linhaFeita = (lista: any) => Array.isArray(lista) && lista.some((l: any) => preenchido(l?.carga) && preenchido(l?.reps));

function movimentoFeito(postural: Record<string, any> | null | undefined, id: string): boolean {
  const m = postural?.movimentos?.[id];
  if (!m || typeof m !== "object") return false;
  if (preenchido(m.medida)) return true;
  return Object.values(m).some((v: any) => v && typeof v === "object" && (preenchido(v.foto_path) || preenchido(v.obs) || preenchido(v.texto) || preenchido(v.video_path)));
}

function testeEsforcoFeito(cardio: Record<string, any> | null | undefined): boolean {
  if (!cardio) return false;
  const testes: any[] = Array.isArray(cardio.testes) && cardio.testes.length > 0 ? cardio.testes : [cardio];
  return testes.some((t) => algum(t, ["bruce_tempo_total_min", "rampa_tempo_total_min", "cooper_distancia_m", "vo2max_manual"]));
}

type Verificador = (p: PacienteRow) => boolean;

// Catálogo: título, setor e como saber se já foi feito.
const CATALOGO: Record<string, { setor: SetorFundamental; titulo: string; feito: Verificador }> = {
  // Física
  "fisica.base": { setor: "fisica", titulo: "Peso, altura e cintura", feito: (p) => todos(p.fisica, ["peso_kg", "altura_cm"]) && algum(p.fisica, ["circ_cintura", "circ_abdomen"]) },
  "fisica.pa": { setor: "fisica", titulo: "Pressão arterial e FC de repouso", feito: (p) => todos(p.fisica, ["pa_sistolica", "pa_diastolica"]) },
  "fisica.composicao": {
    setor: "fisica",
    titulo: "Dobras cutâneas ou bioimpedância (% de gordura)",
    feito: (p) => algum(p.fisica, ["percentual_gordura", "bio_percentual_gordura"]) || Object.keys(p.fisica ?? {}).some((k) => k.startsWith("dc_") && preenchido(p.fisica[k])),
  },
  "fisica.circ_membros": {
    setor: "fisica",
    titulo: "Circunferências de braço, coxa e abdômen",
    feito: (p) => algum(p.fisica, ["circ_braco_d", "circ_braco_e"]) && Object.keys(p.fisica ?? {}).some((k) => k.startsWith("circ_coxa") && preenchido(p.fisica[k])),
  },
  "fisica.panturrilha": { setor: "fisica", titulo: "Circunferência da panturrilha", feito: (p) => algum(p.fisica, ["circ_panturrilha_d", "circ_panturrilha_e"]) },
  // Postural
  "postural.fotos": { setor: "postural", titulo: "Fotos posturais (frente, costas e lado)", feito: (p) => algum(p.postural, ["foto_anterior_path"]) && algum(p.postural, ["foto_lateral_d_path", "foto_lateral_e_path"]) },
  "postural.flexao_tronco": { setor: "postural", titulo: "Flexão de tronco (movimento observado)", feito: (p) => movimentoFeito(p.postural, "flexao_tronco") },
  // Funcional
  "funcional.tug": { setor: "funcional", titulo: "TUG (levantar e caminhar)", feito: (p) => algum(p.funcional, ["tug_seg"]) },
  "funcional.unipodal": { setor: "funcional", titulo: "Apoio unipodal (equilíbrio)", feito: (p) => algum(p.funcional, ["apoio_unipodal_d_seg", "apoio_unipodal_e_seg"]) },
  "funcional.sentar_levantar": { setor: "funcional", titulo: "Sentar e levantar (30 s ou 5 vezes)", feito: (p) => algum(p.funcional, ["chair_stand_reps", "five_sts_seg"]) },
  "funcional.marcha": { setor: "funcional", titulo: "Velocidade de marcha", feito: (p) => algum(p.funcional, ["velocidade_marcha_ms", "marcha_tempo_s"]) },
  "funcional.dinamometria": { setor: "funcional", titulo: "Força de preensão (dinamometria)", feito: (p) => algum(p.funcional, ["dinamometria_d_kg", "dinamometria_e_kg"]) },
  "funcional.tc6": { setor: "funcional", titulo: "Caminhada de 6 minutos (TC6, submáximo)", feito: (p) => algum(p.funcional, ["tc6_metros"]) },
  "funcional.agachamento": { setor: "funcional", titulo: "Agachamento livre observado", feito: (p) => algum(p.funcional, ["agachamento_achados", "agachamento_livre_obs"]) },
  "funcional.mob_quadril": {
    setor: "funcional",
    titulo: "Mobilidade do quadril (rotações e Thomas)",
    feito: (p) => algum(p.funcional, ["mob_quadril_ri_d_graus", "mob_quadril_ri_e_graus", "mob_quadril_re_d_graus", "mob_quadril_re_e_graus", "mob_thomas_d_graus", "mob_thomas_e_graus"]),
  },
  "funcional.mob_tornozelo": {
    setor: "funcional",
    titulo: "Mobilidade do tornozelo (avanço na parede)",
    feito: (p) => algum(p.funcional, ["mob_tornozelo_wblt_d_cm", "mob_tornozelo_wblt_e_cm", "mob_tornozelo_df_d_graus", "mob_tornozelo_df_e_graus"]),
  },
  "funcional.gonio_ombro": {
    setor: "funcional",
    titulo: "Amplitude do ombro (goniometria)",
    feito: (p) => Array.isArray(p.funcional?.goniometria) && p.funcional.goniometria.some((l: any) => /ombro/i.test(String(l?.articulacao ?? "")) && preenchido(l?.graus)),
  },
  "funcional.rot_cervical": { setor: "funcional", titulo: "Rotação cervical", feito: (p) => algum(p.funcional, ["mob_rot_cervical_d_graus", "mob_rot_cervical_e_graus"]) },
  "funcional.rot_toracica": { setor: "funcional", titulo: "Rotação torácica", feito: (p) => algum(p.funcional, ["mob_rot_toracica_d_graus", "mob_rot_toracica_e_graus"]) },
  "funcional.sentar_alcancar": { setor: "funcional", titulo: "Sentar e alcançar (flexibilidade)", feito: (p) => algum(p.funcional, ["sit_and_reach_cm", "chair_sit_reach_cm"]) },
  "funcional.rm": { setor: "funcional", titulo: "RM submáximo", feito: (p) => linhaFeita(p.funcional?.rm_lista) || algum(p.funcional, ["rm_carga_kg"]) },
  "funcional.falha": { setor: "funcional", titulo: "Repetições até a falha (carga fixa)", feito: (p) => linhaFeita(p.funcional?.falha_lista) || algum(p.funcional, ["falha_carga_kg"]) },
  // Cardio
  "cardio.esforco": { setor: "cardio", titulo: "Teste de esforço (Bruce, rampa ou Cooper) para o VO2máx", feito: (p) => testeEsforcoFeito(p.cardio) },
  // Módulos da anamnese (para casa)
  "anamnese.mod_dor": { setor: "anamnese", titulo: "Módulo Dor em detalhe (TSK-11 e PSEQ)", feito: (p) => modRespondido(p, "dor") },
  "anamnese.mod_sono": { setor: "anamnese", titulo: "Módulo Sono em detalhe (PSQI)", feito: (p) => modRespondido(p, "sono") },
  "anamnese.mod_bem_estar": { setor: "anamnese", titulo: "Módulo Bem-estar emocional", feito: (p) => modRespondido(p, "bem-estar") },
  "anamnese.mod_capacidade": { setor: "anamnese", titulo: "Módulo Visão, audição e memória (60+)", feito: (p) => modRespondido(p, "capacidade-60") },
  // Adiar ou evitar (só aviso; "feito" não se aplica)
  "cardio.evitar_esforco": { setor: "cardio", titulo: "Testes de esforço (Bruce, rampa, Cooper e TC6) antes da liberação médica", feito: () => false },
  "cardio.evitar_maximo": { setor: "cardio", titulo: "Teste máximo (Bruce, rampa ou Cooper) neste momento", feito: () => false },
  "cardio.evitar_corrida": { setor: "cardio", titulo: "Cooper (corrida de 12 min) com dor forte em membro inferior", feito: () => false },
  "funcional.evitar_falha": { setor: "funcional", titulo: "Repetições até a falha antes de conferir a pressão de repouso", feito: () => false },
  "funcional.evitar_prancha": { setor: "funcional", titulo: "Prancha longa com dor lombar forte", feito: () => false },
  "funcional.evitar_pushup": { setor: "funcional", titulo: "Push-up com dor forte no ombro", feito: () => false },
  "funcional.evitar_preensao": { setor: "funcional", titulo: "Dinamometria do lado com dor forte no punho ou cotovelo", feito: () => false },
};

function modRespondido(p: PacienteRow, id: ModuloId): boolean {
  return statusModulo(mesclarComPadrao(p.anamnese), id, idadeEfetiva(p)) === "respondido";
}

// ---------------------------------------------------------------------------
// Regras
// ---------------------------------------------------------------------------
const PESO: Record<PrioridadeAvaliacao, number> = { fundamental: 2, recomendado: 1, evitar: 0 };

class Lista {
  itens = new Map<string, { prioridade: PrioridadeAvaliacao; motivos: string[]; fontes: Fonte[] }>();
  add(id: keyof typeof CATALOGO, prioridade: PrioridadeAvaliacao, motivo: string, fonte: Fonte = PRATICO) {
    const atual = this.itens.get(id);
    if (!atual) {
      this.itens.set(id, { prioridade, motivos: [motivo], fontes: [fonte] });
      return;
    }
    if (prioridade !== "evitar" && PESO[prioridade] > PESO[atual.prioridade]) atual.prioridade = prioridade;
    if (!atual.motivos.includes(motivo)) atual.motivos.push(motivo);
    if (!atual.fontes.some((f) => f.curta === fonte.curta)) atual.fontes.push(fonte);
  }
}

const OBJETIVO_COMPOSICAO = /emagre|perder peso|perda de peso|gordura|est[eé]tic|defini[çc]|hipertrof|ganh(ar|o) (de )?massa|massa muscular|barriga|medidas/i;

export function avaliacoesFundamentais(paciente: PacienteRow): ItemAvaliacao[] {
  if (!paciente.anamnese || paciente.anamnese_status === "nao_iniciada") return [];
  const a = mesclarComPadrao(paciente.anamnese);
  const idade = idadeEfetiva(paciente);
  const L = new Lista();

  // Base de toda avaliação.
  L.add("fisica.base", "fundamental", "base do plano e dos cálculos das outras abas");
  L.add("fisica.pa", "fundamental", "segurança antes de qualquer teste");
  L.add("postural.fotos", "recomendado", "registro inicial para comparar nas reavaliações");

  // Idade e quedas.
  const caiu = a.historico_saude.quedas_12m === true;
  if (caiu || (idade !== null && idade >= 60)) {
    const motivo = caiu ? "relatou queda nos últimos 12 meses" : `${idade} anos`;
    const fonte = caiu ? QUEDAS : EWGSOP2;
    L.add("funcional.tug", "fundamental", motivo, fonte);
    L.add("funcional.unipodal", "fundamental", motivo, fonte);
    L.add("funcional.marcha", "fundamental", motivo, caiu ? QUEDAS : EWGSOP2);
    L.add("funcional.sentar_levantar", "fundamental", motivo, EWGSOP2);
    L.add("funcional.dinamometria", "fundamental", motivo, EWGSOP2);
    L.add("fisica.panturrilha", "recomendado", motivo, EWGSOP2);
  }
  if (idade !== null && idade >= 60 && moduloSinalizado(a, "capacidade-60", idade)) L.add("anamnese.mod_capacidade", "recomendado", `${idade} anos`);

  // Segurança cardiovascular (triagem ACSM).
  const lib = liberacaoPara(paciente, "vigorosa_maxima");
  const sedentario = a.atividade_fisica.pratica_atual === false;
  if (lib.nivel === "liberacao_necessaria") {
    L.add("cardio.evitar_esforco", "evitar", lib.motivos[0] ?? "sinais ou sintomas relatados", ACSM);
    L.add("fisica.pa", "fundamental", "sinais ou sintomas no PAR-Q+", ACSM);
  } else if (lib.nivel === "liberacao_recomendada") {
    L.add("cardio.evitar_maximo", "evitar", "doença conhecida: liberação médica recomendada antes do esforço máximo", ACSM);
    L.add("funcional.tc6", "fundamental", "estimar o condicionamento sem esforço máximo", ACSM);
  } else if (lib.nivel === "cautela") {
    L.add("cardio.evitar_maximo", "evitar", "sem prática regular: prefira um teste submáximo no início", ACSM);
    L.add("funcional.tc6", "fundamental", "sem prática regular de atividade", ACSM);
  } else if (!sedentario && a.atividade_fisica.pratica_atual === true) {
    L.add("cardio.esforco", "recomendado", "já ativo e sem restrição na triagem", ACSM);
  }
  if (sedentario && lib.nivel !== "liberacao_necessaria") L.add("funcional.tc6", "fundamental", "não pratica atividade física", ACSM);

  // Pressão alta ou problema cardíaco informado.
  const parq = a.prontidao.parq;
  if (parq.bp_or_heart_med === true || parq.heart_condition === true) {
    L.add("fisica.pa", "fundamental", parq.bp_or_heart_med === true ? "usa remédio para pressão ou coração: medir duas vezes em repouso" : "problema cardíaco informado: medir duas vezes em repouso");
    L.add("funcional.evitar_falha", "evitar", "pressão alta ou problema cardíaco: prefira o RM submáximo sem chegar à falha");
  }

  // Já treina com carga.
  const modalidades = (a.atividade_fisica.modalidades || "").toLowerCase();
  if (a.atividade_fisica.pratica_atual === true && /muscula|peso|resistid|academia|cross/.test(modalidades)) {
    L.add("funcional.rm", "fundamental", "já treina com carga");
    L.add("funcional.falha", "recomendado", "já treina com carga");
  }

  // Objetivo de composição corporal.
  const textoObjetivo = [a.motivo.objetivos, a.motivo.motivo_procura, a.motivo.queixa_principal].join(" ");
  if (OBJETIVO_COMPOSICAO.test(textoObjetivo)) {
    L.add("fisica.composicao", "fundamental", "objetivo ligado a gordura, massa muscular ou medidas");
    L.add("fisica.circ_membros", "fundamental", "objetivo ligado a gordura, massa muscular ou medidas");
  }

  // Problema ósseo ou articular no PAR-Q+.
  if (parq.bone_joint === true) L.add("funcional.agachamento", "fundamental", "problema ósseo ou articular informado no PAR-Q+");

  // Dor por região.
  if (a.dor.tem_dor === true) {
    L.add("anamnese.mod_dor", "fundamental", "relatou dor");
    const por = regioesEfetivas(a.dor);
    const grupo = (re: RegExp) => {
      const regioes = Object.keys(por).filter((r) => re.test(r));
      const ints = regioes.map((r) => por[r]?.intensidade).filter((v): v is number => typeof v === "number");
      return { tem: regioes.length > 0, max: ints.length > 0 ? Math.max(...ints) : null, nomes: regioes.map((r) => r.toLowerCase()).join(" e ") };
    };
    const txt = (g: { nomes: string; max: number | null }) => `dor em ${g.nomes}${g.max !== null ? ` (${g.max}/10)` : ""}`;
    const forte = (g: { max: number | null }) => g.max !== null && g.max >= FORTE;

    const joelho = grupo(/joelho/i);
    if (joelho.tem) {
      L.add("funcional.agachamento", "fundamental", txt(joelho));
      L.add("postural.fotos", "fundamental", `${txt(joelho)}: alinhamento dos joelhos na foto de frente`);
      if (forte(joelho)) L.add("cardio.evitar_corrida", "evitar", txt(joelho));
    }
    const quadril = grupo(/quadril/i);
    if (quadril.tem) {
      L.add("funcional.mob_quadril", "fundamental", txt(quadril));
      L.add("funcional.agachamento", "recomendado", txt(quadril));
    }
    const tornozelo = grupo(/tornozelo/i);
    if (tornozelo.tem) {
      L.add("funcional.mob_tornozelo", "fundamental", txt(tornozelo));
      L.add("funcional.unipodal", "recomendado", txt(tornozelo));
      if (forte(tornozelo)) L.add("cardio.evitar_corrida", "evitar", txt(tornozelo));
    }
    if (forte(quadril)) L.add("cardio.evitar_corrida", "evitar", txt(quadril));
    const lombar = grupo(/lombar/i);
    if (lombar.tem) {
      L.add("postural.flexao_tronco", "fundamental", txt(lombar));
      L.add("funcional.sentar_alcancar", "recomendado", txt(lombar));
      if (forte(lombar)) L.add("funcional.evitar_prancha", "evitar", txt(lombar));
    }
    const ombro = grupo(/ombro/i);
    if (ombro.tem) {
      L.add("funcional.gonio_ombro", "fundamental", txt(ombro));
      L.add("postural.fotos", "recomendado", `${txt(ombro)}: escápulas na foto de costas`);
      if (forte(ombro)) L.add("funcional.evitar_pushup", "evitar", txt(ombro));
    }
    const cervical = grupo(/pesco|cabe/i);
    if (cervical.tem) {
      L.add("funcional.rot_cervical", "fundamental", txt(cervical));
      L.add("postural.fotos", "recomendado", `${txt(cervical)}: posição da cabeça na foto de lado`);
    }
    const toracica = grupo(/tor[aá]cica/i);
    if (toracica.tem) L.add("funcional.rot_toracica", "fundamental", txt(toracica));
    const punho = grupo(/punho|cotovelo/i);
    if (forte(punho)) L.add("funcional.evitar_preensao", "evitar", txt(punho));
  }

  // Sono e bem-estar: módulos para responder em casa.
  if (moduloSinalizado(a, "sono", idade)) L.add("anamnese.mod_sono", "fundamental", "sono ruim ou dificuldade para dormir no questionário base");
  if (moduloSinalizado(a, "bem-estar", idade)) L.add("anamnese.mod_bem_estar", "fundamental", "estresse, ansiedade ou humor atrapalhando o dia a dia");

  // Conflitos: com sinais ou sintomas, o TC6 só depois da liberação; sem conferir a pressão, falha fica para depois.
  if (lib.nivel === "liberacao_necessaria" && L.itens.has("funcional.tc6")) {
    const t = L.itens.get("funcional.tc6")!;
    t.prioridade = "recomendado";
    t.motivos.push("só depois da liberação médica");
  }
  if (L.itens.has("funcional.evitar_falha")) L.itens.delete("funcional.falha");

  const ordemSetor: SetorFundamental[] = ["anamnese", "fisica", "postural", "funcional", "cardio"];
  const ordemPrio: PrioridadeAvaliacao[] = ["fundamental", "recomendado", "evitar"];
  return Array.from(L.itens.entries())
    .map(([id, v]) => {
      const def = CATALOGO[id];
      return { id, setor: def.setor, titulo: def.titulo, prioridade: v.prioridade, motivos: v.motivos, fontes: v.fontes, feito: v.prioridade === "evitar" ? false : def.feito(paciente) };
    })
    .sort((x, y) => ordemPrio.indexOf(x.prioridade) - ordemPrio.indexOf(y.prioridade) || ordemSetor.indexOf(x.setor) - ordemSetor.indexOf(y.setor));
}

export function pendentesFundamentais(itens: ItemAvaliacao[]): ItemAvaliacao[] {
  return itens.filter((i) => i.prioridade === "fundamental" && !i.feito);
}
