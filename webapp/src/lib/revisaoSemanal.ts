// Revisão semanal dos agentes (coordenada pela Dra. Nina): protocolo em 11-Revisao-Semanal.md.
// Este arquivo guarda o RESULTADO da última rodada e é lido pela página Estudos (/avaliador/estudos).
// Cada rodada reescreve este arquivo. As sugestões são PROPOSTAS: nada muda no sistema sem a decisão do
// profissional. Os estudos listados em "candidatos" tiveram a existência conferida no PubMed e o resumo lido,
// mas só entram na base dos agentes se o profissional aprovar.

import type { AgenteId } from "@/lib/agentes";

export type StatusSugestao = "aguardando_decisao" | "aprovada" | "recusada" | "feita";

export type SugestaoSemanal = {
  id: string;
  titulo: string;
  porque: string;
  risco: string;
  evidencia: string; // de onde vem (dado do uso, pendência registrada, estudo)
  status: StatusSugestao;
};

export type RevisaoDoAgente = {
  id: AgenteId;
  situacao: "sem_mudanca" | "atencao";
  achados: string[];
  sugestoes: SugestaoSemanal[];
};

export type CandidatoReferencia = {
  pmid: string;
  citacao: string;
  titulo: string;
  agente: AgenteId;
  oQueDiz: string; // só o que o resumo afirma
  limite: string;
};

export type RevisaoSemanal = {
  data: string; // AAAA-MM-DD
  proxima: string;
  resumo: string[];
  verificacoes: { rotulo: string; resultado: string; ok: boolean }[];
  uso: string[]; // só números agregados, nunca nomes nem dados de paciente
  agentes: RevisaoDoAgente[];
  candidatos: CandidatoReferencia[];
};

export const INTERVALO_REVISAO_DIAS = 7;

export function diasDesdeRevisaoSemanal(r: RevisaoSemanal = ULTIMA_REVISAO_SEMANAL, hoje: Date = new Date()): number {
  const t = new Date(`${r.data}T00:00:00`).getTime();
  return Math.floor((hoje.getTime() - t) / 86400000);
}

export function revisaoSemanalAtrasada(r: RevisaoSemanal = ULTIMA_REVISAO_SEMANAL, hoje: Date = new Date()): boolean {
  return diasDesdeRevisaoSemanal(r, hoje) > INTERVALO_REVISAO_DIAS + 1;
}

export const ULTIMA_REVISAO_SEMANAL: RevisaoSemanal = {
  data: "2026-10-19",
  proxima: "2026-10-26",
  resumo: [
    "Primeira revisão semanal. Sem erro técnico: 12 testes de lógica passaram, o repositório está sem pendências e a revisão da literatura está em dia (18 de 180 dias).",
    "Dos pacientes na base, todos concluíram a anamnese, mas só metade tem avaliação física iniciada, e todo %G registrado veio de dobras (nenhum de bioimpedância).",
    "A varredura de literatura (2025 em diante) achou 3 estudos úteis, sem nada que obrigue a mudar uma regra hoje. Há 10 propostas para você decidir.",
  ],
  verificacoes: [
    { rotulo: "Testes de lógica (12 conjuntos)", resultado: "todos passaram", ok: true },
    { rotulo: "Repositório e publicação", resultado: "sem arquivos pendentes; último envio publicado", ok: true },
    { rotulo: "Revisão da literatura por agente", resultado: "02/10/2026, 18 de 180 dias: em dia", ok: true },
    { rotulo: "Dados de teste no banco", resultado: "nenhum registro de teste encontrado", ok: true },
    { rotulo: "Itens a conferir (página Estudos)", resultado: "16 itens abertos, nenhum resolvido nesta semana", ok: false },
  ],
  uso: [
    "4 pacientes na base (6 em 15/10); 4 com anamnese concluída; 3 com algum alerta.",
    "2 pacientes com avaliação física, postural, funcional, cardiorrespiratória e plano; os outros 2 ainda sem avaliação.",
    "%G de referência registrado em 2 pacientes, os 2 por dobras; nenhuma bioimpedância registrada.",
    "Análise de movimento usada em 1 paciente; nenhum vídeo enviado ainda.",
    "Última atividade na base: 15/10/2026.",
  ],
  agentes: [
    {
      id: "nina",
      situacao: "atencao",
      achados: [
        "Metade dos pacientes com anamnese concluída ainda não teve avaliação iniciada, e a lista de pacientes não mostra isso.",
        "A busca de triagem pré-exercício (2025 em diante) só trouxe estudos de eletrocardiograma em atletas, fora do público da clínica: sem mudança na triagem.",
      ],
      sugestoes: [
        {
          id: "N1",
          titulo: "Mostrar na lista de pacientes quem concluiu a anamnese e ainda não tem avaliação",
          porque: "Hoje metade dos pacientes está nessa situação e só se percebe abrindo ficha por ficha.",
          risco: "Baixo: só acrescenta uma coluna ou etiqueta na lista, sem mudar nenhum cálculo.",
          evidencia: "Dado de uso desta semana.",
          status: "aguardando_decisao",
        },
      ],
    },
    {
      id: "sofia",
      situacao: "sem_mudanca",
      achados: [
        "4 de 4 anamneses concluídas; 3 com alertas.",
        "A busca de triagem PHQ-2 e GAD-2 só trouxe estudos de populações específicas (gestantes e síndrome do ovário policístico): sem base para mudar o ponto de corte.",
      ],
      sugestoes: [
        {
          id: "S1",
          titulo: "Versão das perguntas em terceira pessoa para a anamnese feita na clínica",
          porque: "As perguntas estão escritas para o paciente (\"você\"); na entrevista presencial o avaliador precisa adaptar na hora.",
          risco: "Baixo, mas é decisão de redação sua.",
          evidencia: "Pendência registrada em 13/10/2026.",
          status: "aguardando_decisao",
        },
      ],
    },
    {
      id: "marco",
      situacao: "atencao",
      achados: [
        "Todo %G registrado veio de dobras. A proteção de divergência entre dobras e bioimpedância nunca dispara sem bioimpedância, e o maior controle de erro das dobras (várias leituras por ponto) não existe.",
        "Um estudo populacional turco de 2026 (Int J Obes) propôs corte de IMC de 28,8 para obesidade com base em bioimpedância, reforçando que o IMC varia por população: o sistema já usa o IMC só como triagem, sem mudança.",
        "As tabelas Pollock & Wilmore e de massa magra continuam sem conferência no livro (pendência aberta).",
      ],
      sugestoes: [
        {
          id: "M1",
          titulo: "Registrar 3 leituras por dobra e usar a mediana",
          porque: "É a prática padrão para reduzir o erro de técnica das dobras e o método é o único usado até agora. Foi oferecida em 09/10 e ficou de fora; reapresento porque o uso mostra que só há dobras.",
          risco: "Baixo para o cálculo (mesmas equações, só com a mediana); aumenta o tempo de coleta e a tela de dobras.",
          evidencia: "Dado de uso desta semana e pendência de 09/10/2026.",
          status: "aguardando_decisao",
        },
        {
          id: "M2",
          titulo: "Conferir as duas tabelas no livro e confirmar a correspondência dos níveis com as classes do perfil",
          porque: "As tabelas decidem o domínio de composição corporal e não foram conferidas em fonte publicada.",
          risco: "Médio se ficarem erradas: mudam a classificação de pacientes.",
          evidencia: "Pendência registrada em 09/10/2026.",
          status: "aguardando_decisao",
        },
      ],
    },
    {
      id: "paula",
      situacao: "atencao",
      achados: [
        "Um estudo de validação de 2026 (PLoS One) com 46 pacientes comparou estimativa de pose em vídeo com captura de movimento no cotovelo: boa concordância na flexão, com erro mínimo detectável de cerca de 7°, e a avaliação visual foi melhor que o método automático na extensão.",
        "Os cortes práticos do sistema para fotos são 3° (discreta) e 6° (evidente), menores que esse erro mínimo de uma articulação diferente: para ângulos medidos por vídeo, o sistema pode estar sugerindo precisão que não tem.",
        "Nenhum vídeo foi enviado ainda: os limites de adequação do vídeo seguem sem calibração com casos reais.",
      ],
      sugestoes: [
        {
          id: "P1",
          titulo: "Aviso de margem de erro nos ângulos medidos por vídeo",
          porque: "Dizer na tela e no parecer que diferenças pequenas (da ordem de 7° ou menos) em medidas automáticas de vídeo não devem ser interpretadas, e que isso foi estudado em outra articulação e não foi validado para tronco.",
          risco: "Baixo: é texto de cautela.",
          evidencia: "Rode et al., PLoS One 2026 (PMID 42490640); abstract lido.",
          status: "aguardando_decisao",
        },
        {
          id: "P2",
          titulo: "Calibrar os limites de adequação do vídeo com os primeiros vídeos reais",
          porque: "Os limites foram definidos sem exemplos reais; podem reprovar vídeos bons ou aprovar vídeos ruins.",
          risco: "Baixo.",
          evidencia: "Pendência registrada em 17/10/2026.",
          status: "aguardando_decisao",
        },
      ],
    },
    {
      id: "rita",
      situacao: "atencao",
      achados: [
        "Uma coorte de 13.423 idosos de 65 anos ou mais em Taiwan (JAMA Netw Open 2026) associou melhor desempenho no levantar da cadeira, apoio unipodal, 8-foot up-and-go (parente do TUG) e teste do degrau de 2 minutos a menor mortalidade por todas as causas, de forma graduada (estudo observacional).",
        "A busca de sarcopenia e dinamometria só trouxe estudos em populações hospitalares e renais: sem base para mudar os cortes de força.",
      ],
      sugestoes: [
        {
          id: "R1",
          titulo: "Incluir o estudo de Taiwan (2026) como referência de apoio aos testes funcionais em idosos",
          porque: "Dá base publicada para a Rita dizer por que mede cadeira, apoio unipodal e TUG em quem tem 65 anos ou mais. Não traz cortes para adotar e não muda nenhuma regra.",
          risco: "Baixo.",
          evidencia: "Wu et al., JAMA Netw Open 2026 (PMID 42574013); abstract lido.",
          status: "aguardando_decisao",
        },
      ],
    },
    {
      id: "iris",
      situacao: "atencao",
      achados: [
        "A triagem de sarcopenia ainda usa o %G ideal antigo (Gallagher), enquanto a composição corporal usa as tabelas novas.",
        "O conteúdo das 30 condições da aba Condições de saúde foi escrito por IA e ainda não passou por revisão clínica; 10 condições seguem sem fonte conferida.",
        "A busca de diretrizes de exercício em doenças crônicas não trouxe nada que contradiga o conteúdo atual.",
      ],
      sugestoes: [
        {
          id: "I1",
          titulo: "Decidir se a triagem de sarcopenia passa a usar a tabela de massa magra",
          porque: "Hoje há dois critérios diferentes de massa magra convivendo no sistema.",
          risco: "Médio: muda quem é sinalizado na triagem.",
          evidencia: "Decisão deixada em aberto em 09/10/2026.",
          status: "aguardando_decisao",
        },
        {
          id: "I2",
          titulo: "Revisão clínica do conteúdo das condições, começando pelas 10 sem fonte",
          porque: "É conteúdo de saúde escrito por IA que o avaliador pode ler junto com o paciente.",
          risco: "Médio se não for revisado.",
          evidencia: "Pendência registrada em 09/10/2026.",
          status: "aguardando_decisao",
        },
      ],
    },
    {
      id: "theo",
      situacao: "sem_mudanca",
      achados: [
        "Dos 4 pacientes, 2 têm plano; todos os planos mantêm o treino de força em 2 ou mais dias por semana.",
        "As buscas de treino de força e de exercício em câncer trouxeram revisões sem nada que mude as regras do plano.",
      ],
      sugestoes: [],
    },
    {
      id: "clara",
      situacao: "atencao",
      achados: [
        "Os slides mostram os níveis \"Ruim\" e \"Muito ruim\" do %G com o paciente presente.",
        "A busca de comunicação de resultados ao paciente não trouxe estudo verificado utilizável nesta semana.",
      ],
      sugestoes: [
        {
          id: "C1",
          titulo: "Trocar o tom de \"Ruim\" e \"Muito ruim\" nos slides por uma linguagem mais acolhedora",
          porque: "Os rótulos da tabela são literais e podem soar como julgamento diante do paciente; a base de comunicação de risco do sistema pede equilíbrio entre informar e não gerar ansiedade.",
          risco: "Baixo, mas é decisão de redação sua.",
          evidencia: "Pendência registrada em 15/10/2026.",
          status: "aguardando_decisao",
        },
      ],
    },
    {
      id: "caio",
      situacao: "sem_mudanca",
      achados: [
        "O mesmo estudo de Taiwan (2026) inclui o teste do degrau de 2 minutos como medida de capacidade cardiorrespiratória em idosos, associada a menor mortalidade.",
        "A busca de percentis de aptidão cardiorrespiratória não trouxe tabela de referência nova: sem mudança nas faixas de VO2máx.",
      ],
      sugestoes: [],
    },
  ],
  candidatos: [
    {
      pmid: "42490640",
      citacao: "Rode D, et al. PLoS One 2026;21:e0353801",
      titulo: "Validation of markerless human pose estimation methods for clinical assessment of elbow range of motion",
      agente: "paula",
      oQueDiz: "46 pacientes com doença de ombro ou cotovelo; um método de pose monocular teve concordância de 0,92 na flexão (erro mínimo detectável de 6,74°) e superou a avaliação visual; na extensão a avaliação visual foi melhor que os dois métodos automáticos.",
      limite: "Cotovelo, não tronco; vídeo de laboratório; não valida o motor usado no sistema.",
    },
    {
      pmid: "42574013",
      citacao: "Wu MC, et al. JAMA Netw Open 2026;9:e2628227",
      titulo: "Physical Fitness and All-Cause Mortality in Older Adults",
      agente: "rita",
      oQueDiz: "13.423 idosos de 65 anos ou mais; os melhores quintis de 8-foot up-and-go, apoio unipodal, levantar da cadeira em 30 s e degrau de 2 min tiveram menor mortalidade por todas as causas (índice composto: HR ajustado de 0,39).",
      limite: "Estudo observacional em Taiwan; associação, não prova de causa; não traz cortes para adotar.",
    },
    {
      pmid: "42362716",
      citacao: "Özsaydı SZ, et al. Int J Obes (Lond) 2026;50:1988-1994",
      titulo: "Reassessing BMI thresholds for obesity: a population-based study in Turkish adults",
      agente: "marco",
      oQueDiz: "Em adultos turcos de 18 a 65 anos, com %G por bioimpedância, o melhor corte de IMC para obesidade foi de cerca de 28,8 kg/m², abaixo de 30.",
      limite: "População turca e bioimpedância; reforça que o IMC varia por população e não se aplica diretamente ao Brasil.",
    },
  ],
};
