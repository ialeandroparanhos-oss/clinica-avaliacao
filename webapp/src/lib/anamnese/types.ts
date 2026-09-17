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
    doencas: string;
    cirurgias: string;
    hospitalizacoes: string;
    lesoes_fraturas: string;
    quedas_12m: boolean | null;
    quedas_detalhe: string;
    tratamentos_anteriores: string;
    acompanhamento_medico: string;
    fisioterapia_previa: string;
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
  estilo_vida: {
    alimentacao_geral: string;
    hidratacao_litros_dia: string;
    alcool_frequencia: string;
    tabagismo: string;
    lazer: string;
    estresse_percebido: number | null; // 0-10
    barreiras_exercicio: string[];
    disponibilidade_tempo: string;
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
  criado_em: string;
  atualizado_em: string;
};
