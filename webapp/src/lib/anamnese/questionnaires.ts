// Conteúdo dos instrumentos usados na anamnese. A redação dos itens segue o
// conteúdo clínico amplamente conhecido de cada instrumento; antes do uso
// clínico formal (pontuação/decisão), a clínica deve confirmar a versão
// validada oficial em português de cada um (ver 01-Agente2-Anamnese-e-Questionarios.md).

export const escalaPSS10 = [
  "Nunca",
  "Quase nunca",
  "Às vezes",
  "Com frequência",
  "Muito frequentemente",
];

export const itensPSS10 = [
  "No último mês, com que frequência você ficou chateado(a) por algo que aconteceu inesperadamente?",
  "No último mês, com que frequência você sentiu que não conseguia controlar as coisas importantes da sua vida?",
  "No último mês, com que frequência você se sentiu nervoso(a) ou estressado(a)?",
  "No último mês, com que frequência você lidou com sucesso com pequenos problemas do dia a dia? (invertido)",
  "No último mês, com que frequência você sentiu que estava lidando bem com mudanças importantes na sua vida? (invertido)",
  "No último mês, com que frequência você se sentiu confiante na sua capacidade de resolver problemas pessoais? (invertido)",
  "No último mês, com que frequência você sentiu que as coisas estavam acontecendo do seu jeito? (invertido)",
  "No último mês, com que frequência você achou que não conseguiria lidar com todas as coisas que tinha que fazer?",
  "No último mês, com que frequência você conseguiu controlar as irritações da sua vida? (invertido)",
  "No último mês, com que frequência você sentiu que as dificuldades estavam se acumulando a ponto de não conseguir superá-las?",
];

export const itensInvertidosPSS10 = [3, 4, 5, 6, 8]; // índices (0-based) com pontuação invertida

export const escalaFrequencia4 = ["Nunca", "Vários dias", "Mais da metade dos dias", "Quase todos os dias"];

export const itensGAD7 = [
  "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)",
  "Não ser capaz de impedir ou controlar as preocupações",
  "Preocupar-se muito com diversas coisas",
  "Dificuldade para relaxar",
  "Ficar tão agitado(a) que se torna difícil permanecer parado(a)",
  "Ficar facilmente aborrecido(a) ou irritado(a)",
  "Sentir medo como se algo terrível fosse acontecer",
];

export const itensPHQ9 = [
  "Pouco interesse ou prazer em fazer as coisas",
  "Sentir-se para baixo, deprimido(a) ou sem perspectiva",
  "Dificuldade para pegar no sono, continuar dormindo ou dormir demais",
  "Sentir-se cansado(a) ou com pouca energia",
  "Falta de apetite ou comer demais",
  "Sentir-se mal consigo mesmo(a), ou que é um fracasso, ou que decepcionou sua família",
  "Dificuldade para se concentrar (ex.: ler, ver televisão)",
  "Lentidão para se movimentar ou falar, ou o oposto: agitação",
  "Pensar que estaria melhor morto(a) ou em se machucar de alguma forma",
];

// Índice do item de ideação de autolesão no PHQ-9 (0-based) - qualquer
// pontuação > 0 aqui é alerta de Nível 4, conforme
// 01-Agente2-Anamnese-e-Questionarios.md, Seção 6.
export const indicePHQ9Ideacao = 8;

export const perguntasParQ = [
  { chave: "heart_condition", texto: "Algum médico já disse que você tem uma condição cardíaca ou pressão arterial alta?" },
  { chave: "chest_pain", texto: "Você sente dor no peito em repouso, durante atividades da vida diária ou ao fazer esforço físico?" },
  { chave: "dizziness", texto: "Você perde o equilíbrio por tontura ou já perdeu a consciência nos últimos 12 meses?" },
  { chave: "bone_joint", texto: "Você tem algum problema ósseo ou articular que possa piorar com a atividade física?" },
  { chave: "bp_or_heart_med", texto: "Você toma atualmente algum medicamento prescrito para pressão arterial ou para uma condição cardíaca?" },
  { chave: "other_reason", texto: "Existe algum outro motivo, não mencionado, pelo qual você acredita que não deveria realizar atividade física agora?" },
] as const;

export const regioesCorporais = [
  "Cabeça/pescoço",
  "Ombro direito",
  "Ombro esquerdo",
  "Cotovelo/antebraço direito",
  "Cotovelo/antebraço esquerdo",
  "Punho/mão direita",
  "Punho/mão esquerda",
  "Coluna torácica",
  "Coluna lombar",
  "Quadril direito",
  "Quadril esquerdo",
  "Joelho direito",
  "Joelho esquerdo",
  "Tornozelo/pé direito",
  "Tornozelo/pé esquerdo",
];

export const caracteristicasDor = ["Queimação", "Pontada", "Peso", "Formigamento", "Latejante", "Aperto", "Outra"];

export const bandeirasVermelhasDor = [
  "Dor torácica",
  "Dor noturna que não melhora em nenhuma posição",
  "Perda de peso inexplicada",
  "Febre associada",
  "Fraqueza ou alteração de sensibilidade progressiva",
  "Alteração de controle esfincteriano",
];

export const barreirasExercicioOpcoes = [
  "Falta de tempo",
  "Falta de motivação",
  "Dor/limitação física",
  "Custo",
  "Falta de local adequado",
  "Falta de companhia",
  "Não sabe por onde começar",
  "Já tentou antes e não conseguiu manter",
];
