// Catálogo de condições de saúde para a aba "Condições de saúde": explicação breve, em tópicos, do que cada
// condição relatada na anamnese significa para a avaliação e para o exercício.
//
// INTEGRIDADE: este é um TEXTO EDUCATIVO DO SISTEMA (escrito por assistente de IA), um apoio para o
// avaliador tirar dúvidas. Não faz diagnóstico, não prescreve e não substitui o médico do paciente. Só
// entra em "fontes" referência conferida no PubMed (ver lib/agentes.ts). Sem fonte, o texto é conhecimento
// geral de saúde e a tela diz isso. Evitei números e cortes que não tenham fonte conferida.

export type GrupoCondicao = "Cardiovascular" | "Metabólica e endócrina" | "Respiratória" | "Musculoesquelética e dor" | "Neurológica" | "Saúde mental e sono" | "Outras";

export type Condicao = {
  id: string;
  nome: string;
  grupo: GrupoCondicao;
  // Termos que o avaliador ou o paciente costuma escrever (sem acento, minúsculos). "xyz*" casa o começo da
  // palavra; sem asterisco casa a palavra inteira ou a expressão.
  aliases: string[];
  oQueE: string;
  importaParaExercicio: string;
  cuidados: string[];
  sinaisDeAlerta: string[];
  encaminhar: string;
  noApp?: string;
  fontes?: string[]; // ids em lib/agentes.ts (referenciaPorId)
};

export const CATALOGO: Condicao[] = [
  // ------------------------------------------------------------------ Cardiovascular
  {
    id: "hipertensao",
    nome: "Hipertensão arterial (pressão alta)",
    grupo: "Cardiovascular",
    aliases: ["hipertens*", "pressao alta", "has", "pressao elevada"],
    oQueE: "A pressão nas artérias fica elevada de forma persistente. Em geral não dá sintoma, por isso muita gente descobre tarde. Com o tempo, aumenta o risco de AVC, infarto, insuficiência cardíaca e doença renal. O diagnóstico exige medidas repetidas e é do médico; o valor de 140/90 mmHg no consultório é o ponto de corte clássico das diretrizes (conferir no texto da diretriz).",
    importaParaExercicio: "O exercício regular ajuda a baixar a pressão e faz parte do tratamento, mas a pressão muito elevada em repouso pede cuidado antes de esforço. Alguns remédios para pressão alteram a resposta ao exercício: betabloqueadores limitam a frequência cardíaca (use a percepção de esforço, não só a FC), e outros podem causar tontura ao levantar.",
    cuidados: [
      "Medir a pressão em repouso antes de começar a sessão e anotar.",
      "Perguntar quais remédios usa e se tomou no dia.",
      "Evitar prender a respiração durante o esforço (manobra de Valsalva), sobretudo em exercícios de força com carga alta.",
      "Aquecer e desaquecer com calma; evitar mudar de posição de forma brusca.",
      "Progredir a intensidade aos poucos e controlar por percepção de esforço.",
    ],
    sinaisDeAlerta: ["Dor ou aperto no peito", "Falta de ar desproporcional ao esforço", "Tontura forte, desmaio ou visão turva", "Dor de cabeça intensa e súbita", "Pressão em repouso muito elevada na medida do dia"],
    encaminhar: "Sem acompanhamento médico, com pressão elevada em medidas repetidas ou com qualquer sinal de alerta: orientar avaliação médica antes de esforço intenso.",
    noApp: "Pressão a partir de 140/90 mmHg gera aviso no parecer do Dr. Marco e na supervisão da Dra. Nina, para repetir a medida e considerar avaliação médica.",
    fontes: ["esceesh2018"],
  },
  {
    id: "cardiopatia",
    nome: "Cardiopatia (doença do coração, infarto, angina)",
    grupo: "Cardiovascular",
    aliases: ["cardiopat*", "coracao", "infarto", "angina", "coronari*", "marcapasso", "stent", "safena", "revasculariza*", "valvul*", "miocardi*", "problema cardiaco", "doenca cardiaca", "doenca do coracao"],
    oQueE: "\"Cardiopatia\" é um termo amplo. Pode ser doença das artérias do coração (coronárias, que causa angina e infarto), problema nas válvulas, doença do músculo cardíaco ou do ritmo. O tratamento e o que é seguro fazer dependem do tipo específico, por isso o primeiro passo é saber QUAL é o diagnóstico e o que o cardiologista liberou.",
    importaParaExercicio: "Na maioria dos casos o exercício é recomendado e traz benefício, mas com prescrição individual e liberação médica, com limites de intensidade bem definidos. Testes máximos e esforço vigoroso só com liberação.",
    cuidados: [
      "Pedir o diagnóstico específico e a liberação médica por escrito, com limites de frequência cardíaca e intensidade.",
      "Perguntar sobre cirurgias, stents, marcapasso ou desfibrilador (limitam o tipo de esforço e a FC).",
      "Aquecimento e desaquecimento longos; evitar esforço máximo e prender a respiração sem liberação.",
      "Monitorar sintomas, percepção de esforço e frequência cardíaca durante toda a sessão.",
      "Ter plano de emergência definido (quem chamar, onde está o telefone).",
    ],
    sinaisDeAlerta: ["Dor, aperto ou peso no peito, ou irradiando para braço ou mandíbula", "Falta de ar anormal", "Palpitações com tontura", "Desmaio ou quase desmaio", "Suor frio"],
    encaminhar: "Interromper o esforço diante de qualquer sinal de alerta e acionar atendimento de emergência; sem liberação médica atual, não iniciar esforço vigoroso nem teste máximo.",
    noApp: "A resposta \"problema cardíaco\" do PAR-Q+ aciona a liberação para teste máximo e esforço vigoroso pelo critério do ACSM 2015, com item de segurança no plano.",
    fontes: ["pelliccia2021", "acsm2015"],
  },
  {
    id: "insuficiencia_cardiaca",
    nome: "Insuficiência cardíaca",
    grupo: "Cardiovascular",
    aliases: ["insuficiencia cardiaca", "coracao fraco", "cardiomiopatia", "fracao de ejecao"],
    oQueE: "O coração não bombeia sangue na quantidade que o corpo precisa. Aparece como cansaço, falta de ar aos esforços (ou deitado) e inchaço nas pernas. É uma condição crônica, acompanhada pelo cardiologista, com medicamentos que mudam a resposta ao esforço.",
    importaParaExercicio: "O exercício supervisionado e adaptado costuma fazer parte do tratamento, mas só com liberação do cardiologista e intensidade baixa a moderada no início. A tolerância varia de um dia para o outro.",
    cuidados: [
      "Exigir liberação e orientação de intensidade do cardiologista.",
      "Perguntar sobre ganho rápido de peso ou inchaço nos últimos dias (descompensação).",
      "Controlar por percepção de esforço e fala (conseguir conversar), além da FC.",
      "Sessões curtas, com pausas e progressão lenta; evitar calor excessivo e esforço isométrico intenso.",
    ],
    sinaisDeAlerta: ["Falta de ar em repouso ou ao deitar", "Inchaço ou ganho de peso rápido", "Dor no peito", "Tontura, desmaio ou palpitações"],
    encaminhar: "Suspender o treino e orientar contato com o cardiologista diante de piora de falta de ar, inchaço ou ganho de peso rápido.",
    fontes: ["ponikowski2016", "pelliccia2021"],
  },
  {
    id: "arritmia",
    nome: "Arritmia (alteração do ritmo, palpitações)",
    grupo: "Cardiovascular",
    aliases: ["arritmia*", "fibrilacao*", "taquicardia", "palpitac*", "extrassistole*", "flutter", "bradicardia"],
    oQueE: "O batimento do coração fica irregular, rápido demais ou lento demais. Muitas arritmias são benignas, outras são graves; quem diferencia é o cardiologista, por exame. Quem tem fibrilação atrial costuma usar anticoagulante.",
    importaParaExercicio: "A frequência cardíaca pode não refletir bem o esforço (ritmo irregular, marcapasso, medicamentos). Anticoagulante aumenta o risco de sangramento em quedas e impactos.",
    cuidados: [
      "Saber o tipo de arritmia, os medicamentos e a liberação médica.",
      "Usar percepção de esforço e teste da fala como controle principal.",
      "Se usa anticoagulante, reduzir risco de queda e de impacto.",
      "Perguntar se as palpitações acontecem durante o esforço.",
    ],
    sinaisDeAlerta: ["Palpitações com tontura ou falta de ar", "Desmaio ou quase desmaio", "Dor no peito", "Frequência cardíaca muito alta que não normaliza no repouso"],
    encaminhar: "Palpitações novas, com tontura ou desmaio: parar e orientar avaliação cardiológica antes de voltar ao esforço.",
    fontes: ["pelliccia2021"],
  },
  {
    id: "avc",
    nome: "AVC (derrame) prévio",
    grupo: "Cardiovascular",
    aliases: ["avc", "derrame", "acidente vascular*", "isquemia cerebral", "avci", "avch"],
    oQueE: "Interrupção do fluxo de sangue em uma parte do cérebro (isquêmico) ou sangramento (hemorrágico). As sequelas variam: fraqueza de um lado do corpo, alteração de equilíbrio, de fala ou de sensibilidade. O risco de novo AVC está ligado a pressão alta, diabetes, colesterol e arritmias.",
    importaParaExercicio: "Com liberação médica, o exercício ajuda a recuperar força, equilíbrio e marcha e a controlar fatores de risco. O foco costuma ser segurança contra quedas e simetria do movimento.",
    cuidados: [
      "Liberação médica e conhecimento das sequelas (lado afetado, equilíbrio, comunicação).",
      "Pressão arterial controlada e medida antes da sessão.",
      "Prevenção de quedas: apoio por perto, piso firme, calçado adequado.",
      "Respeitar a fadiga, que é comum, e evitar prender a respiração.",
    ],
    sinaisDeAlerta: ["Fraqueza ou formigamento súbito de um lado", "Boca torta ou fala enrolada", "Perda súbita de visão", "Dor de cabeça súbita e muito forte"],
    encaminhar: "Qualquer sinal súbito acima: acionar o serviço de emergência na hora, sem esperar melhorar.",
  },
  {
    id: "dislipidemia",
    nome: "Colesterol alto (dislipidemia)",
    grupo: "Cardiovascular",
    aliases: ["colesterol", "dislipidemia", "triglicer*", "estatina*", "gordura no sangue"],
    oQueE: "Excesso de gorduras no sangue (colesterol e triglicerídeos). Não dá sintoma, mas é um fator de risco cardiovascular importante e modificável. Muitas pessoas usam estatinas.",
    importaParaExercicio: "O exercício regular, junto com a alimentação, ajuda a melhorar o perfil de gorduras. Estatinas podem causar dor muscular em algumas pessoas.",
    cuidados: [
      "Perguntar se usa estatina e se sente dor ou fraqueza muscular diferente da dor de treino.",
      "Tratar como fator de risco cardiovascular na triagem de liberação.",
      "Associar força, aeróbio e orientação nutricional.",
    ],
    sinaisDeAlerta: ["Dor muscular intensa e inexplicada, com urina escura ou fraqueza importante em uso de estatina"],
    encaminhar: "Dor muscular intensa e persistente com estatina: orientar contato com o médico que prescreveu.",
    noApp: "\"Colesterol alto ou uso de estatina\" é fator de risco cardiovascular na anamnese (triagem ACSM).",
  },
  {
    id: "trombose_varizes",
    nome: "Trombose, varizes e problemas de circulação",
    grupo: "Cardiovascular",
    aliases: ["trombose", "varize*", "embolia", "insuficiencia venosa", "tvp", "claudicacao"],
    oQueE: "Varizes são veias dilatadas e com refluxo; a trombose é a formação de coágulo em uma veia (mais comum nas pernas), que pode se soltar e ir ao pulmão (embolia). A claudicação é dor na perna ao andar por má circulação nas artérias.",
    importaParaExercicio: "Quem teve trombose recente ou tem coágulo ativo não deve exercitar a perna sem liberação. Varizes simples em geral não impedem o exercício e a atividade muscular ajuda o retorno do sangue.",
    cuidados: [
      "Perguntar se houve trombose recente, uso de anticoagulante ou cirurgia/imobilização prolongada.",
      "Em anticoagulados, reduzir risco de queda e de impacto.",
      "Na claudicação, trabalhar caminhada em intervalos, parando quando a dor aparece e retomando depois.",
    ],
    sinaisDeAlerta: ["Perna inchada, quente, vermelha e dolorida de um lado só", "Falta de ar súbita ou dor ao respirar", "Dor no peito com tosse"],
    encaminhar: "Sinais de trombose ou embolia: interromper e acionar atendimento de urgência.",
  },

  // ------------------------------------------------------------------ Metabólica e endócrina
  {
    id: "diabetes",
    nome: "Diabetes (tipo 2, tipo 1) e glicemia alterada",
    grupo: "Metabólica e endócrina",
    aliases: ["diabet*", "glicemia alta", "glicemia alterada", "insulina", "metformina", "pre-diabet*", "prediabet*", "resistencia a insulina", "acucar no sangue", "acucar alto"],
    oQueE: "A glicose no sangue fica acima do normal porque o corpo produz pouca insulina (tipo 1, autoimune, sempre com insulina) ou não responde bem a ela (tipo 2, muito ligado a peso e sedentarismo). A glicemia alterada ou pré-diabetes é a fase anterior. O controle ruim, ao longo dos anos, afeta olhos, rins, nervos dos pés e coração.",
    importaParaExercicio: "O exercício melhora o controle da glicose e a sensibilidade à insulina e é parte do tratamento. O principal risco é a hipoglicemia (glicose baixa), em quem usa insulina ou alguns comprimidos. Complicações como neuropatia nos pés e retinopatia pedem ajustes.",
    cuidados: [
      "Perguntar o tipo de diabetes, os remédios (insulina?), o horário e quando comeu.",
      "Ter carboidrato de ação rápida à mão e saber reconhecer hipoglicemia.",
      "Conferir os pés (feridas, calçado, perda de sensibilidade) e evitar impacto em neuropatia.",
      "Se há retinopatia, evitar esforço máximo, prender a respiração e posições com a cabeça abaixo do corpo, até orientação do oftalmologista.",
      "Hidratar; combinar aeróbio e força.",
    ],
    sinaisDeAlerta: ["Tremor, suor frio, fome súbita, confusão ou irritabilidade (glicose baixa)", "Sede intensa, muita urina e cansaço extremo (glicose muito alta)", "Feridas nos pés que não cicatrizam"],
    encaminhar: "Na hipoglicemia, parar, oferecer carboidrato rápido e reavaliar; se não melhorar ou houver perda de consciência, acionar emergência. Sem acompanhamento médico: orientar avaliação.",
    noApp: "\"Glicemia alterada ou diabetes\" entra como fator de risco cardiovascular na anamnese.",
    fontes: ["colberg2016"],
  },
  {
    id: "obesidade",
    nome: "Obesidade e excesso de peso",
    grupo: "Metabólica e endócrina",
    aliases: ["obes*", "sobrepeso", "excesso de peso", "gordura corporal alta"],
    oQueE: "Acúmulo de gordura que pode prejudicar a saúde. O IMC sozinho não separa gordura de massa magra e é apenas uma triagem: o excesso de gordura deve ser confirmado por %G, cintura, relação cintura/quadril ou cintura/estatura. A gordura na região do abdômen pesa mais no risco cardiometabólico.",
    importaParaExercicio: "A prioridade é perder gordura preservando massa magra: força progressiva, aeróbio de baixo impacto no início e alimentação orientada. O impacto sobre joelhos e quadril, a pressão, a glicemia e o sono (apneia) merecem atenção.",
    cuidados: [
      "Progressão gradual, com ênfase em bem-estar e adesão, sem foco só no peso na balança.",
      "Preferir início com baixo impacto (bicicleta, caminhada, água) se há dor articular.",
      "Manter treino de força para preservar a massa magra.",
      "Conferir pressão, glicemia e sintomas de apneia do sono.",
    ],
    sinaisDeAlerta: ["Dor no peito ou falta de ar desproporcional", "Dor articular que piora a cada sessão", "Ronco alto com sonolência diurna (possível apneia)"],
    encaminhar: "Orientar nutricionista e, quando houver comorbidades ou obesidade de grau elevado, avaliação médica antes de aumentar a intensidade.",
    noApp: "O Dr. Marco avalia %G, massa magra e gordura central antes do IMC; gordura alta com massa magra baixa vira prioridade.",
    fontes: ["rubino2025", "donini2022"],
  },
  {
    id: "tireoide",
    nome: "Doenças da tireoide (hipo e hipertireoidismo)",
    grupo: "Metabólica e endócrina",
    aliases: ["tireoid*", "hipotireoid*", "hipertireoid*", "hashimoto", "doenca de graves", "levotiroxina", "puran", "tiroxina"],
    oQueE: "A tireoide regula o metabolismo. No hipotireoidismo ela produz pouco hormônio (cansaço, ganho de peso, frio, lentidão, dores musculares). No hipertireoidismo produz demais (coração acelerado, tremor, perda de peso, ansiedade).",
    importaParaExercicio: "Controlada com tratamento, a pessoa em geral pode se exercitar normalmente. Fora de controle, o hipotireoidismo reduz a tolerância ao esforço e o hipertireoidismo acelera o coração e pede cautela.",
    cuidados: [
      "Perguntar se há acompanhamento e se a doença está controlada (exames recentes).",
      "No hipotireoidismo, atenção a fadiga excessiva e dor muscular; no hipertireoidismo, controlar a frequência cardíaca.",
      "Progressão gradual e atenção à resposta individual.",
    ],
    sinaisDeAlerta: ["Palpitações, tremor intenso ou frequência cardíaca muito alta em repouso", "Cansaço extremo, fraqueza importante ou dor muscular intensa"],
    encaminhar: "Doença sem acompanhamento ou com sintomas descontrolados: orientar endocrinologista antes de esforço intenso.",
  },

  // ------------------------------------------------------------------ Respiratória
  {
    id: "asma",
    nome: "Asma",
    grupo: "Respiratória",
    aliases: ["asma*", "bronquite asmatica", "broncoespasmo", "bombinha"],
    oQueE: "Inflamação crônica das vias aéreas, com crises de falta de ar, chiado e tosse, em geral desencadeadas por alérgenos, infecções, ar frio ou seco e pelo próprio exercício.",
    importaParaExercicio: "Asma controlada não impede o exercício, que é indicado. O esforço pode provocar broncoespasmo, sobretudo em ar frio, seco ou poluído.",
    cuidados: [
      "Perguntar se está controlada e se usa medicação de resgate (a bombinha) e profilática.",
      "Manter o resgate à mão durante a sessão.",
      "Aquecimento gradual e longo; evitar iniciar em intensidade alta.",
      "Atenção ao ambiente: poeira, ar muito frio ou seco.",
    ],
    sinaisDeAlerta: ["Chiado, tosse ou aperto no peito que não melhora com o resgate", "Dificuldade de falar frases completas", "Lábios arroxeados"],
    encaminhar: "Crise que não melhora em poucos minutos com o resgate: acionar atendimento de emergência.",
  },
  {
    id: "dpoc",
    nome: "DPOC (enfisema, bronquite crônica)",
    grupo: "Respiratória",
    aliases: ["dpoc", "enfisema", "bronquite cronica", "doenca pulmonar obstrutiva*"],
    oQueE: "Obstrução crônica ao fluxo de ar, geralmente relacionada ao tabagismo, com falta de ar aos esforços e tosse com secreção. Não tem cura, mas os sintomas melhoram com tratamento.",
    importaParaExercicio: "A reabilitação pulmonar, que inclui exercício, é parte central do tratamento de doença respiratória crônica. O limitante costuma ser a falta de ar, não a força.",
    cuidados: [
      "Usar escala de falta de ar e, se houver, a saturação de oxigênio (oxímetro) antes e durante o esforço.",
      "Intervalos de esforço e pausa; respiração com os lábios semicerrados ajuda a controlar a falta de ar.",
      "Verificar se usa oxigênio ou broncodilatador e tê-lo à mão.",
      "Trabalhar força de membros, que melhora a tolerância ao esforço.",
    ],
    sinaisDeAlerta: ["Falta de ar intensa que não alivia com o repouso", "Queda importante da saturação", "Confusão ou lábios arroxeados"],
    encaminhar: "Sinais acima: parar o esforço e acionar atendimento; piora recente dos sintomas, orientar o pneumologista.",
    noApp: "A saturação de oxigênio pode ser registrada na aba Física.",
    fontes: ["spruit2013"],
  },
  {
    id: "apneia",
    nome: "Apneia do sono",
    grupo: "Respiratória",
    aliases: ["apneia*", "cpap", "ronco*"],
    oQueE: "Paradas repetidas da respiração durante o sono, com ronco alto, sono não reparador e sonolência durante o dia. Está ligada à obesidade e a pressão alta, arritmias e risco cardiovascular.",
    importaParaExercicio: "O tratamento (CPAP, perda de peso) e o exercício ajudam. A sonolência e a fadiga podem reduzir o rendimento e a segurança em exercícios que exigem atenção.",
    cuidados: [
      "Perguntar sobre diagnóstico e uso de CPAP e sobre sonolência diurna.",
      "Verificar pressão arterial, que costuma estar elevada.",
      "Cuidado com exercícios de coordenação e equilíbrio em dias de muita sonolência.",
    ],
    sinaisDeAlerta: ["Sonolência intensa durante o dia", "Pausas respiratórias presenciadas por quem dorme junto", "Pressão arterial elevada"],
    encaminhar: "Sintomas sem diagnóstico: orientar avaliação do sono com médico.",
    noApp: "As perguntas do PSQI (ronco, respirar mal à noite) ajudam a levantar suspeita.",
  },

  // ------------------------------------------------------------------ Musculoesquelética e dor
  {
    id: "osteoartrite",
    nome: "Artrose (osteoartrite)",
    grupo: "Musculoesquelética e dor",
    aliases: ["artrose", "osteoartrite", "osteoartrose", "gonartrose", "coxartrose", "desgaste na cartilagem", "bico de papagaio"],
    oQueE: "Desgaste e alteração da articulação (cartilagem, osso e tecidos ao redor). Causa dor ao movimento, rigidez que passa em pouco tempo e perda de função, sobretudo em joelho, quadril, mãos e coluna.",
    importaParaExercicio: "O exercício é parte do tratamento: força e exercícios aeróbios de baixo impacto reduzem a dor e melhoram a função, em especial no joelho. Repouso prolongado piora.",
    cuidados: [
      "Trabalhar a musculatura ao redor da articulação (por exemplo, quadríceps e glúteos no joelho).",
      "Ajustar carga, amplitude e impacto pela dor: tolerável durante e que não piora no dia seguinte.",
      "Preferir bicicleta, água e caminhada à corrida e ao salto no início.",
      "Perda de peso, quando indicada, reduz a carga sobre a articulação.",
    ],
    sinaisDeAlerta: ["Articulação inchada, quente e vermelha", "Dor intensa em repouso ou à noite", "Travamento ou falseio da articulação"],
    encaminhar: "Articulação inchada e quente, dor noturna ou queda de função rápida: orientar avaliação ortopédica ou reumatológica.",
    fontes: ["fransen2015"],
  },
  {
    id: "osteoporose",
    nome: "Osteoporose e osteopenia",
    grupo: "Musculoesquelética e dor",
    aliases: ["osteopor*", "osteopenia", "ossos fracos", "fratura vertebral"],
    oQueE: "Perda de massa e de qualidade do osso, que fica frágil e aumenta o risco de fratura (punho, vértebras, quadril). A osteopenia é a fase anterior, de perda menor.",
    importaParaExercicio: "O consenso recomenda programa multicomponente com treino de força e de equilíbrio, e não apenas aeróbio. O ponto principal é fortalecer e prevenir quedas, evitando movimentos que sobrecarregam a coluna.",
    cuidados: [
      "Treino de força progressivo e de equilíbrio como base.",
      "Evitar flexão forçada do tronco (por exemplo, abdominal tradicional) e torções bruscas da coluna, sobretudo se há fratura vertebral.",
      "Evitar impacto alto e risco de queda se a osteoporose é grave.",
      "Corrigir postura e orientar técnica com cuidado.",
    ],
    sinaisDeAlerta: ["Dor súbita e intensa nas costas após esforço ou queda", "Perda de altura recente", "Qualquer queda com dor forte"],
    encaminhar: "Dor intensa e súbita na coluna, ou queda com dor persistente: interromper e orientar avaliação médica.",
    fontes: ["giangregorio2014"],
  },
  {
    id: "lombalgia",
    nome: "Dor lombar (lombalgia)",
    grupo: "Musculoesquelética e dor",
    aliases: ["lombalgia", "dor lombar", "dor nas costas", "ciatica", "ciatalgia", "lombociatalgia"],
    oQueE: "Dor na região lombar, mais comum que se conhece como \"inespecífica\" (sem uma lesão claramente identificável). É a principal causa de incapacidade no mundo. Quando passa de 12 semanas é considerada crônica.",
    importaParaExercicio: "Na dor lombar crônica inespecífica, o exercício provavelmente reduz a dor em comparação a não tratar ou ao cuidado habitual, com benefício pequeno sobre a função. Não há um tipo de exercício claramente superior; o que o paciente consegue manter importa.",
    cuidados: [
      "Mapear movimentos e posições que pioram ou aliviam.",
      "Manter-se ativo; evitar repouso prolongado.",
      "Progressão gradual de carga; dor moderada e tolerável pode ser aceitável, dor que piora o quadro, não.",
      "Considerar medo de se mover e crenças sobre a dor (TSK-11 e PSEQ na anamnese).",
    ],
    sinaisDeAlerta: ["Perda de força numa perna ou pé caído", "Dormência na região genital ou entre as pernas", "Perda de controle da urina ou das fezes", "Dor após trauma, febre, perda de peso inexplicada ou dor noturna constante"],
    encaminhar: "Qualquer sinal de alerta acima exige avaliação médica urgente (podem indicar compressão nervosa grave).",
    noApp: "Quando há dor na anamnese, o app pergunta as bandeiras vermelhas, e o TSK-11 e o PSEQ ajudam a ver medo de movimento e autoeficácia.",
    fontes: ["hayden2021"],
  },
  {
    id: "hernia_disco",
    nome: "Hérnia de disco e protrusão",
    grupo: "Musculoesquelética e dor",
    aliases: ["hernia de disco", "hernia discal", "protrus*", "discopatia", "abaulamento*", "compressao nervosa"],
    oQueE: "O disco entre as vértebras sai do lugar ou se deforma e pode comprimir uma raiz nervosa, causando dor que desce pela perna (ou pelo braço) e, às vezes, formigamento e fraqueza. Achados de imagem são comuns mesmo em quem não tem dor, por isso o quadro clínico pesa mais que a imagem.",
    importaParaExercicio: "A maioria melhora com tratamento conservador, e o exercício orientado costuma fazer parte. O ajuste é pelo comportamento da dor: se a dor desce ou piora com certo movimento, ele deve ser evitado ou adaptado.",
    cuidados: [
      "Identificar a direção de movimento que alivia e a que piora (centralização da dor).",
      "Fortalecer a musculatura de sustentação com progressão cuidadosa.",
      "Evitar cargas altas e movimentos repetidos que reproduzem a dor irradiada.",
      "Observar sinais neurológicos (força, sensibilidade) a cada sessão.",
    ],
    sinaisDeAlerta: ["Fraqueza que aumenta numa perna ou braço", "Dormência na região genital", "Perda de controle da urina ou das fezes"],
    encaminhar: "Déficit neurológico novo ou progressivo: avaliação médica urgente.",
  },
  {
    id: "fibromialgia",
    nome: "Fibromialgia",
    grupo: "Musculoesquelética e dor",
    aliases: ["fibromialgia"],
    oQueE: "Dor crônica generalizada, com cansaço, sono ruim e, muitas vezes, alterações de humor e de memória. Não há lesão visível nos exames; a dor se explica por maior sensibilidade do sistema nervoso à dor.",
    importaParaExercicio: "O exercício foi a única terapia com recomendação forte nas diretrizes europeias. Começar muito leve e progredir devagar é essencial, porque excesso de carga no início piora a dor e faz abandonar.",
    cuidados: [
      "Iniciar com intensidade baixa e volume pequeno, aumentando bem aos poucos.",
      "Priorizar aeróbio leve e força leve, com regularidade, em vez de sessões raras e intensas.",
      "Combinar orientação sobre dor, sono e estresse.",
      "Dias ruins existem: ajustar a sessão em vez de interromper o programa.",
    ],
    sinaisDeAlerta: ["Piora acentuada da dor por vários dias após a sessão (carga excessiva)", "Sintomas depressivos importantes", "Dor nova e localizada, diferente do padrão habitual"],
    encaminhar: "Dor nova e localizada ou piora importante do humor: orientar reavaliação médica e, se for o caso, apoio psicológico.",
    fontes: ["macfarlane2017"],
  },
  {
    id: "artrite",
    nome: "Artrite e doenças reumáticas (artrite reumatoide, lúpus, espondilite)",
    grupo: "Musculoesquelética e dor",
    aliases: ["artrite*", "reumatoide", "lupus", "espondilite*", "psoriatica", "reumatismo"],
    oQueE: "São doenças em que o sistema imune ataca as articulações ou outros órgãos, com períodos de crise (dor, inchaço e rigidez prolongada, sobretudo de manhã) e períodos de calma. O tratamento costuma incluir medicamentos que reduzem a imunidade.",
    importaParaExercicio: "O exercício é benéfico para dor, força e função fora das crises. Nas crises, a articulação inflamada deve ser poupada.",
    cuidados: [
      "Perguntar se está em crise e quais medicamentos usa (imunossupressores aumentam o risco de infecção, corticoide fragiliza osso e tendão).",
      "Evitar carga alta e impacto sobre a articulação inflamada.",
      "Respeitar a rigidez da manhã: aquecimento longo.",
      "Atenção à fadiga, que pode ser intensa.",
    ],
    sinaisDeAlerta: ["Articulação inchada, quente e muito dolorida", "Febre ou mal-estar geral", "Falta de ar ou dor no peito (podem indicar envolvimento de outros órgãos)"],
    encaminhar: "Crise ou sintomas novos: orientar o reumatologista antes de seguir com carga.",
  },
  {
    id: "tendinopatia",
    nome: "Tendinite, bursite e fascite plantar",
    grupo: "Musculoesquelética e dor",
    aliases: ["tendinite", "tendinopatia*", "bursite", "epicondilite", "fascite plantar", "manguito", "tenossinovite"],
    oQueE: "São irritações ou degenerações de tendões, bolsas e tecidos de apoio, em geral por sobrecarga repetida: ombro (manguito), cotovelo, joelho, calcanhar (fascite plantar), entre outros. A dor costuma piorar ao movimento ou à carga específica.",
    importaParaExercicio: "Em geral o tratamento envolve modificar a carga e fortalecer de forma progressiva, em vez de repouso total. É preciso identificar quais movimentos reproduzem a dor.",
    cuidados: [
      "Identificar e reduzir temporariamente o movimento que reproduz a dor.",
      "Fortalecimento progressivo, com dor leve e estável durante e depois, e sem piora no dia seguinte.",
      "Corrigir técnica, equipamento e volume de treino.",
      "Alongar e mobilizar sem insistir na região inflamada.",
    ],
    sinaisDeAlerta: ["Estalo súbito com dor e perda de força (possível ruptura)", "Inchaço, calor e vermelhidão importantes", "Dor que não melhora com ajuste de carga em semanas"],
    encaminhar: "Suspeita de ruptura ou dor persistente apesar do ajuste: orientar avaliação ortopédica ou fisioterapêutica.",
  },
  {
    id: "escoliose",
    nome: "Escoliose",
    grupo: "Musculoesquelética e dor",
    aliases: ["escoliose", "desvio na coluna", "desvio de coluna"],
    oQueE: "Curvatura lateral da coluna com rotação das vértebras. Muitas são leves e sem sintoma; as mais acentuadas podem causar assimetria visível e dor.",
    importaParaExercicio: "Em geral o exercício é seguro e benéfico. O ponto é respeitar a assimetria do paciente e não forçar a \"correção\" por conta própria.",
    cuidados: [
      "Observar e registrar a assimetria nas fotos posturais, sem diagnosticar o grau.",
      "Trabalhar força e mobilidade dos dois lados de forma equilibrada.",
      "Em curvas acentuadas ou dolorosas, alinhar com o médico ou fisioterapeuta.",
    ],
    sinaisDeAlerta: ["Piora rápida da curvatura", "Dor intensa ou fraqueza nas pernas"],
    encaminhar: "Curva acentuada ou com dor/déficit neurológico: orientar avaliação ortopédica.",
    noApp: "A aba Postural registra fotos e observações; o grau de escoliose exige radiografia.",
  },

  // ------------------------------------------------------------------ Neurológica
  {
    id: "enxaqueca",
    nome: "Enxaqueca (migrânea)",
    grupo: "Neurológica",
    aliases: ["enxaqueca*", "migranea", "dor de cabeca cronica"],
    oQueE: "Dor de cabeça forte, em geral de um lado, pulsátil, com sensibilidade à luz e ao som e, às vezes, náusea, que pode vir precedida de sintomas visuais (aura). Alguns desencadeantes são sono ruim, jejum, estresse e desidratação.",
    importaParaExercicio: "O exercício aeróbio regular costuma ajudar a reduzir as crises, mas esforço muito intenso, calor e jejum podem desencadear.",
    cuidados: [
      "Hidratar e não treinar em jejum prolongado.",
      "Evitar iniciar em intensidade alta; aquecer com calma.",
      "Em dia de crise, adiar a sessão.",
      "Cuidado ao prender a respiração em exercícios de força pesados.",
    ],
    sinaisDeAlerta: ["Dor de cabeça súbita, a pior da vida", "Dor de cabeça com fraqueza, fala alterada, febre ou rigidez no pescoço", "Mudança importante no padrão habitual das crises"],
    encaminhar: "Qualquer sinal acima: atendimento de urgência.",
  },
  {
    id: "neuropatia",
    nome: "Neuropatia periférica",
    grupo: "Neurológica",
    aliases: ["neuropatia*", "perda de sensibilidade nos pes", "formigamento nos pes"],
    oQueE: "Lesão dos nervos dos pés e das mãos, comum no diabetes, que causa formigamento, queimação, dormência e perda de sensibilidade, com risco de feridas sem perceber e de perda de equilíbrio.",
    importaParaExercicio: "O exercício ajuda, mas a perda de sensibilidade nos pés aumenta o risco de feridas e de queda. O equilíbrio e a proteção dos pés viram prioridade.",
    cuidados: [
      "Inspecionar os pés e orientar calçado adequado.",
      "Evitar impacto repetitivo e superfícies instáveis até haver segurança.",
      "Incluir equilíbrio e força de pernas, com apoio por perto.",
    ],
    sinaisDeAlerta: ["Ferida, bolha ou vermelhidão nos pés", "Quedas ou quase quedas", "Piora rápida da dormência ou da fraqueza"],
    encaminhar: "Feridas nos pés ou piora neurológica: orientar avaliação médica.",
  },
  {
    id: "parkinson",
    nome: "Doença de Parkinson",
    grupo: "Neurológica",
    aliases: ["parkinson*"],
    oQueE: "Doença neurológica progressiva com tremor de repouso, lentidão e rigidez dos movimentos e alteração de equilíbrio e da marcha. Os sintomas variam ao longo do dia, conforme o efeito do remédio.",
    importaParaExercicio: "O exercício é parte do tratamento e ajuda no equilíbrio, na marcha e na função. A segurança contra quedas é central.",
    cuidados: [
      "Treinar no período em que o remédio está fazendo efeito (\"fase on\").",
      "Instruções simples e demonstradas; pistas visuais e de ritmo ajudam na marcha.",
      "Supervisão de perto no equilíbrio e nas mudanças de posição.",
      "Atenção a tontura ao levantar.",
    ],
    sinaisDeAlerta: ["Quedas ou quase quedas", "Congelamento da marcha", "Tontura importante ao ficar de pé"],
    encaminhar: "Piora rápida ou quedas repetidas: orientar o neurologista.",
  },
  {
    id: "vertigem",
    nome: "Tontura, vertigem e labirintite",
    grupo: "Neurológica",
    aliases: ["vertigem", "labirintite", "vppb", "tontura*", "tonteira"],
    oQueE: "Sensação de rodar ou de instabilidade, com várias causas: ouvido interno (labirintite, VPPB), pressão baixa, medicação ou problemas do coração e do cérebro. A causa define o que é seguro.",
    importaParaExercicio: "Tontura aumenta o risco de queda e limita exercícios com mudança rápida de posição e de cabeça.",
    cuidados: [
      "Saber a causa e se está investigada.",
      "Evitar movimentos bruscos de cabeça e exercícios em altura ou em superfície instável até haver segurança.",
      "Ter apoio por perto; mudar de posição devagar.",
    ],
    sinaisDeAlerta: ["Tontura com dor no peito, falta de ar ou desmaio", "Tontura com fala alterada, fraqueza ou visão dupla"],
    encaminhar: "Tontura nova, recorrente ou com qualquer sinal acima: avaliação médica antes de seguir.",
    noApp: "A pergunta de tontura do PAR-Q+ entra na triagem de prontidão.",
  },
  {
    id: "epilepsia",
    nome: "Epilepsia e convulsões",
    grupo: "Neurológica",
    aliases: ["epilep*", "convuls*", "crise convulsiva"],
    oQueE: "Doença em que descargas elétricas anormais no cérebro causam crises, com perda de consciência ou movimentos involuntários. Muitas pessoas têm as crises controladas com remédio.",
    importaParaExercicio: "O exercício costuma ser seguro e benéfico quando as crises estão controladas. O risco principal é a crise durante a atividade, sobretudo em locais de risco (água, altura).",
    cuidados: [
      "Saber o tipo de crise, a frequência, os desencadeantes e a medicação.",
      "Evitar atividades em altura e na água sem supervisão.",
      "Equipe orientada sobre o que fazer se ocorrer uma crise.",
    ],
    sinaisDeAlerta: ["Aura ou sensação que costuma preceder a crise", "Crise com mais de alguns minutos ou que se repete"],
    encaminhar: "Durante a crise: proteger a cabeça, não conter nem colocar nada na boca; se durar mais de alguns minutos ou repetir, acionar emergência.",
  },

  // ------------------------------------------------------------------ Saúde mental e sono
  {
    id: "saude_mental",
    nome: "Ansiedade e depressão",
    grupo: "Saúde mental e sono",
    aliases: ["ansiedade", "depress*", "panico", "transtorno de ansiedade", "estresse cronico", "burnout", "tristeza"],
    oQueE: "A depressão envolve humor deprimido ou perda de interesse e prazer, com alterações de sono, energia e concentração. A ansiedade envolve preocupação excessiva, tensão e, às vezes, sintomas físicos como palpitações e falta de ar. Costumam aparecer juntas e com dor crônica.",
    importaParaExercicio: "O exercício regular ajuda no humor e na ansiedade e é uma parte do cuidado, mas não substitui o acompanhamento psicológico e médico. A motivação e a energia podem oscilar, e o ambiente acolhedor pesa na adesão.",
    cuidados: [
      "Começar com metas pequenas e alcançáveis para criar sensação de êxito.",
      "Escutar sem julgar e respeitar os dias ruins; ajustar a sessão em vez de cobrar.",
      "Atenção a medicação (sedação, tontura) e a efeitos sobre o sono.",
      "Em sintomas físicos de ansiedade (palpitações, falta de ar), tranquilizar, mas lembrar de descartar causa cardíaca em caso de dor no peito.",
    ],
    sinaisDeAlerta: ["Fala de desesperança, de não querer viver ou de se machucar", "Piora importante do humor ou do sono", "Crise de pânico com dor no peito"],
    encaminhar: "Qualquer fala sobre suicídio ou autolesão: acolher, não deixar a pessoa sozinha e acionar apoio profissional ou serviço de emergência na hora. Sintomas persistentes: orientar psicólogo ou psiquiatra.",
    noApp: "O módulo de bem-estar emocional usa PHQ-9 e GAD-7; o item 9 do PHQ-9 (ideação) gera alerta crítico. A porta de entrada é o PHQ-2 (a partir de 2 pontos).",
  },

  // ------------------------------------------------------------------ Outras
  {
    id: "renal",
    nome: "Doença renal crônica",
    grupo: "Outras",
    aliases: ["renal", "rins", "insuficiencia renal", "irc", "dialise*", "hemodialise", "nefropatia*"],
    oQueE: "Perda gradual da função dos rins, frequentemente por diabetes e pressão alta. Pode levar a acúmulo de líquidos, anemia, alteração de minerais e, em fase avançada, a diálise.",
    importaParaExercicio: "O exercício costuma ser benéfico para função física e controle de pressão e glicemia, mas exige liberação e ajuste individual. Fadiga, anemia e restrição de líquidos mudam a tolerância.",
    cuidados: [
      "Liberação do nefrologista e conhecimento da fase (diálise ou não).",
      "Em hemodiálise, treinar nos dias sem diálise e poupar o braço da fístula.",
      "Controlar pressão e percepção de esforço; atenção a hidratação conforme orientação médica.",
    ],
    sinaisDeAlerta: ["Inchaço súbito ou falta de ar", "Cãibras intensas ou fraqueza importante", "Tontura, náusea ou confusão"],
    encaminhar: "Sintomas acima ou piora do quadro: orientar o nefrologista.",
  },
  {
    id: "cancer",
    nome: "Câncer (em tratamento ou histórico)",
    grupo: "Outras",
    aliases: ["cancer", "cancro", "tumor", "quimioterapia", "radioterapia", "oncolog*", "mastectomia", "neoplasia"],
    oQueE: "Grupo de doenças com crescimento anormal de células. O que é seguro depende do tipo, da fase e do tratamento (cirurgia, quimioterapia, radioterapia, hormonioterapia), que podem causar fadiga, queda de defesas e fragilidade óssea.",
    importaParaExercicio: "Em geral o exercício é indicado e ajuda na fadiga e na função, mas deve ser adaptado ao momento do tratamento e liberado pelo oncologista.",
    cuidados: [
      "Obter liberação do oncologista, com restrições do momento (contagem de células, osso, cateter).",
      "Ajustar a intensidade ao dia: fadiga oscila bastante.",
      "Cuidado com infecção (higiene, ambiente) quando as defesas estão baixas.",
      "Após cirurgia de mama ou axila, respeitar restrições do braço e acompanhar inchaço (linfedema).",
    ],
    sinaisDeAlerta: ["Febre", "Dor óssea nova e intensa", "Falta de ar, dor no peito ou inchaço novo em um membro"],
    encaminhar: "Febre durante tratamento, dor óssea nova ou inchaço de um braço ou perna: orientar contato com a equipe oncológica.",
  },
  {
    id: "hernia_abdominal",
    nome: "Hérnia abdominal e inguinal",
    grupo: "Outras",
    aliases: ["hernia inguinal", "hernia umbilical", "hernia abdominal", "hernia incisional"],
    oQueE: "Parte do conteúdo do abdome (alça de intestino, gordura) empurra a parede abdominal e forma uma saliência, mais visível ao tossir ou fazer esforço.",
    importaParaExercicio: "Esforço com pressão alta no abdome (levantar peso, prender a respiração, abdominal forte) pode aumentar a hérnia. A orientação médica define se é necessário operar antes.",
    cuidados: [
      "Perguntar se está investigada e o que o médico orientou.",
      "Evitar esforço com Valsalva e cargas altas; respirar durante o movimento.",
      "Cuidado com abdominais de grande esforço.",
    ],
    sinaisDeAlerta: ["Hérnia dolorosa, dura e que não volta ao empurrar", "Dor abdominal com vômitos"],
    encaminhar: "Hérnia dolorosa e que não reduz, ou com vômitos: atendimento de urgência.",
  },
];

// ---------------------------------------------------------------------------
// Detecção
// ---------------------------------------------------------------------------
export function normalizar(texto: string): string {
  return (texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function regexAlias(alias: string): RegExp {
  const prefixo = alias.endsWith("*");
  const base = normalizar(alias.replace(/\*$/, "")).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${base}${prefixo ? "" : "($|[^a-z0-9])"}`);
}

const REGEX_POR_CONDICAO: { id: string; regex: RegExp[] }[] = CATALOGO.map((c) => ({ id: c.id, regex: c.aliases.map(regexAlias) }));

export function condicoesNoTexto(texto: string): string[] {
  const t = normalizar(texto);
  if (!t.trim()) return [];
  return REGEX_POR_CONDICAO.filter((c) => c.regex.some((r) => r.test(t))).map((c) => c.id);
}

export function condicaoPorId(id: string): Condicao | undefined {
  return CATALOGO.find((c) => c.id === id);
}

export function buscarCondicoes(consulta: string): Condicao[] {
  const q = normalizar(consulta).trim();
  if (!q) return CATALOGO;
  return CATALOGO.filter((c) => normalizar(c.nome).includes(q) || c.aliases.some((a) => normalizar(a.replace(/\*$/, "")).includes(q)) || normalizar(c.grupo).includes(q));
}
