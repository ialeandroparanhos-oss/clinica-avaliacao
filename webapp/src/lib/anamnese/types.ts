// Estrutura da Anamnese, espelhando os capítulos 7.1-7.8, Dor, Saúde Mental
// e Prontidão definidos em 01-Agente2-Anamnese-e-Questionarios.md

export type Medicamento = {
  nome: string;
  dose: string;
  frequencia: string;
  motivo: string;
  tempo_uso: string;
};

export type Anamnese = {
  contexto: {
    idade: string;
    profissao: string;
    rotina: string;
    jornada_horas: string;
    exige_esforco_fisico: boolean | null;
    demanda_fisica_trabalho: string;
    tempo_sentado_horas: string;
    atividades_diarias: string;
  };
  motivo: {
    motivo_procura: string;
    queixa_principal: string;
    deseja_melhorar: string;
    atividades_perdidas: string;
    objetivos: string;
    expectativas: string;
  };
  historico_saude: {
    tem_doencas: boolean | null;
    doencas: string;
    tem_cirurgias: boolean | null;
    cirurgias: string;
    tem_hospitalizacoes: boolean | null;
    hospitalizacoes: string;
    tem_lesoes: boolean | null;
    lesoes_fraturas: string;
    quedas_12m: boolean | null;
    quedas_detalhe: string;
    fez_tratamentos_anteriores: boolean | null;
    tratamentos_anteriores: string;
    tem_acompanhamento_medico: boolean | null;
    acompanhamento_medico: string;
    fisioterapia_previa: string;
    tem_outras_condicoes: boolean | null;
    outras_condicoes: string;
  };
  medicamentos: {
    usa_medicamentos: boolean | null;
    lista: Medicamento[];
  };
  historico_familiar: {
    hipertensao: boolean;
    diabetes: boolean;
    doenca_cardiovascular: boolean;
    avc: boolean;
    morte_cardio_precoce: boolean;
    obesidade: boolean;
    doenca_metabolica: boolean;
    outras: boolean;
    detalhe: string;
  };
  atividade_fisica: {
    pratica_atual: boolean | null;
    modalidades: string;
    tempo_treinamento: string;
    interrupcoes: string;
    ipaq: {
      dias_vigorosa: string;
      min_vigorosa_dia: string;
      dias_moderada: string;
      min_moderada_dia: string;
      dias_caminhada: string;
      min_caminhada_dia: string;
      horas_sentado_dia: string;
    };
  };
  sono: {
    horas_sono: string;
    qualidade_percebida: number | null; // 1-5
    dificuldade_iniciar: boolean | null;
    despertares_noturnos: boolean | null;
    sonolencia_diurna: number | null; // 0-3
    sensacao_ao_acordar: number | null; // 1-5
  };
  // PSQI (Pittsburgh Sleep Quality Index) completo - Buysse et al. 1989.
  // Os 7 componentes abaixo seguem o algoritmo de pontuação original
  // (cada um 0-3, escore global 0-21); ver cálculo em lib/anamnese/psqi.ts.
  psqi: {
    qualidade_subjetiva: number | null; // 0 (muito boa) - 3 (muito ruim)
    hora_deitar: string; // "HH:MM"
    minutos_para_adormecer: string;
    hora_acordar: string; // "HH:MM"
    horas_dormidas_noite: string;
    freq_demora_adormecer: number | null; // 0-3
    freq_acorda_meio_noite: number | null; // 0-3
    freq_banheiro: number | null; // 0-3
    freq_respirar_mal: number | null; // 0-3
    freq_tosse_ronco: number | null; // 0-3
    freq_frio: number | null; // 0-3
    freq_calor: number | null; // 0-3
    freq_pesadelos: number | null; // 0-3
    freq_dor: number | null; // 0-3
    freq_outro_motivo: number | null; // 0-3
    outro_motivo_texto: string;
    freq_medicamento_para_dormir: number | null; // 0-3
    freq_sonolencia_atividades: number | null; // 0-3
    freq_falta_entusiasmo: number | null; // 0-3
  };
  estilo_vida: {
    alimentacao_avaliacao: number | null; // 1-5
    alimentacao_geral: string;
    hidratacao_litros_dia: string;
    alcool_frequencia: string;
    tabagismo: string;
    lazer_opcoes: string[];
    lazer: string;
    estresse_percebido: number | null; // 0-10
    barreiras_exercicio: string[];
    disponibilidade_tempo: string;
    conta_com_apoio: boolean | null;
    rede_apoio: string;
  };
  dor: {
    tem_dor: boolean | null;
    localizacoes: string[];
    intensidade_nrs: number | null;
    duracao: string;
    frequencia: string;
    caracteristicas: string[];
    inicio: string;
    agravantes: string;
    atenuantes: string;
    dor_repouso: boolean | null;
    dor_movimento: boolean | null;
    dor_noturna: boolean | null;
    impacto_sono: number | null;
    impacto_trabalho: number | null;
    impacto_treino: number | null;
    impacto_avds: number | null;
    tratamentos_anteriores: string;
    bandeiras_vermelhas: string[];
    // Questionários condicionais, só fazem sentido quando há dor relatada.
    tsk11: (number | null)[]; // 11 itens, 1-4 (baseado na Tampa Scale of Kinesiophobia)
    pseq: (number | null)[]; // 10 itens, 0-6 (Pain Self-Efficacy Questionnaire)
  };
  saude_mental: {
    percepcao_saude: number | null; // 1-5
    pss10: (number | null)[]; // 10 itens, 0-4
    gad7: (number | null)[]; // 7 itens, 0-3
    phq9: (number | null)[]; // 9 itens, 0-3 (item[8] = ideação, alerta crítico)
  };
  prontidao: {
    parq: {
      heart_condition: boolean | null;
      chest_pain: boolean | null;
      dizziness: boolean | null;
      bone_joint: boolean | null;
      bp_or_heart_med: boolean | null;
      other_reason: boolean | null;
    };
    other_reason_detalhe: string;
  };
};

export type Alerta = {
  nivel: 1 | 2 | 3 | 4;
  descricao: string;
  origem: string;
  data: string;
};

export type PacienteIdentificacao = {
  id: string;
  nome: string;
  data_nascimento: string;
  sexo?: string | null;
  telefone?: string | null;
};

export type PacienteRow = PacienteIdentificacao & {
  anamnese: Anamnese;
  anamnese_status: "nao_iniciada" | "em_andamento" | "concluida";
  alertas: Alerta[];
  fisica: Record<string, any>;
  postural: Record<string, any>;
  funcional: Record<string, any>;
  plano: Record<string, any>;
  criado_em: string;
  atualizado_em: string;
};
