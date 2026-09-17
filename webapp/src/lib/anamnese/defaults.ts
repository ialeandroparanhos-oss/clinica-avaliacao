import type { Anamnese } from "./types";

export const anamneseVazia: Anamnese = {
  contexto: {
    idade: "",
    profissao: "",
    rotina: "",
    jornada_horas: "",
    demanda_fisica_trabalho: "",
    tempo_sentado_horas: "",
    atividades_diarias: "",
  },
  motivo: {
    motivo_procura: "",
    queixa_principal: "",
    deseja_melhorar: "",
    atividades_perdidas: "",
    objetivos: "",
    expectativas: "",
  },
  historico_saude: {
    doencas: "",
    cirurgias: "",
    hospitalizacoes: "",
    lesoes_fraturas: "",
    quedas_12m: null,
    quedas_detalhe: "",
    tratamentos_anteriores: "",
    acompanhamento_medico: "",
    fisioterapia_previa: "",
    outras_condicoes: "",
  },
  medicamentos: {
    usa_medicamentos: null,
    lista: [],
  },
  historico_familiar: {
    hipertensao: false,
    diabetes: false,
    doenca_cardiovascular: false,
    avc: false,
    morte_cardio_precoce: false,
    obesidade: false,
    doenca_metabolica: false,
    outras: false,
    detalhe: "",
  },
  atividade_fisica: {
    pratica_atual: null,
    modalidades: "",
    tempo_treinamento: "",
    interrupcoes: "",
    ipaq: {
      dias_vigorosa: "",
      min_vigorosa_dia: "",
      dias_moderada: "",
      min_moderada_dia: "",
      dias_caminhada: "",
      min_caminhada_dia: "",
      horas_sentado_dia: "",
    },
  },
  sono: {
    horas_sono: "",
    qualidade_percebida: null,
    dificuldade_iniciar: null,
    despertares_noturnos: null,
    sonolencia_diurna: null,
    sensacao_ao_acordar: null,
  },
  estilo_vida: {
    alimentacao_geral: "",
    hidratacao_litros_dia: "",
    alcool_frequencia: "",
    tabagismo: "",
    lazer: "",
    estresse_percebido: null,
    barreiras_exercicio: [],
    disponibilidade_tempo: "",
    rede_apoio: "",
  },
  dor: {
    tem_dor: null,
    localizacoes: [],
    intensidade_nrs: null,
    duracao: "",
    frequencia: "",
    caracteristicas: [],
    inicio: "",
    agravantes: "",
    atenuantes: "",
    dor_repouso: null,
    dor_movimento: null,
    dor_noturna: null,
    impacto_sono: null,
    impacto_trabalho: null,
    impacto_treino: null,
    impacto_avds: null,
    tratamentos_anteriores: "",
    bandeiras_vermelhas: [],
  },
  saude_mental: {
    percepcao_saude: null,
    pss10: Array(10).fill(null),
    gad7: Array(7).fill(null),
    phq9: Array(9).fill(null),
  },
  prontidao: {
    parq: {
      heart_condition: null,
      chest_pain: null,
      dizziness: null,
      bone_joint: null,
      bp_or_heart_med: null,
      other_reason: null,
    },
    other_reason_detalhe: "",
  },
};

// Faz merge raso por capítulo entre o que veio do banco (pode ter campos
// faltando, se a estrutura evoluiu) e o esqueleto vazio acima - evita que
// o formulário quebre ao carregar uma anamnese salva com uma versão antiga.
export function mesclarComPadrao(salvo: Partial<Anamnese> | null | undefined): Anamnese {
  if (!salvo) return structuredClone(anamneseVazia);
  const base = structuredClone(anamneseVazia) as any;
  const vindo = salvo as any;
  for (const capitulo of Object.keys(base)) {
    if (vindo[capitulo] && typeof vindo[capitulo] === "object" && !Array.isArray(vindo[capitulo])) {
      base[capitulo] = { ...base[capitulo], ...vindo[capitulo] };
    } else if (vindo[capitulo] !== undefined) {
      base[capitulo] = vindo[capitulo];
    }
  }
  return base as Anamnese;
}
