// Revisão semanal dos agentes (coordenada pela Dra. Nina): protocolo em 11-Revisao-Semanal.md.
// Este arquivo guarda o RESULTADO da última rodada e é lido pela página Estudos (/avaliador/estudos).
// Cada rodada reescreve este arquivo. As sugestões são PROPOSTAS: nada muda no sistema sem a decisão do
// profissional. Os estudos listados em "candidatos" tiveram a existência conferida no PubMed e o resumo lido,
// mas só entram na base dos agentes se o profissional aprovar.

import type { AgenteId } from "@/lib/agentes";

export type StatusSugestao = "aguardando_decisao" | "aprovada" | "recusada" | "adiada" | "feita";

export type SugestaoSemanal = {
  id: string;
  titulo: string;
  porque: string;
  risco: string;
  evidencia: string; // de onde vem (dado do uso, pendência registrada, estudo)
  opiniao: string; // OPINIÃO do agente: recomenda aprovar, recusar ou adiar, e por quê (pedido do profissional em 19/10/2026)
  status: StatusSugestao;
  decisao?: string; // o que o profissional decidiu e quando
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
  lembretes: string[]; // pendências do PROFISSIONAL que os agentes devem lembrar a cada conversa
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
  data: "2026-11-23",
  proxima: "2026-11-30",
  resumo: [
    "Rodada de 23/11/2026 (a anterior registrada era de 19/10, com ajustes até 26/10: houve um intervalo de cerca de 4 semanas sem rodada). Sem erro técnico: tsc sem erros, repositório sem pendências, último envio (55f28cb) publicado e READY na Vercel; revisão da literatura em 52 de 180 dias.",
    "Uso: a base cresceu de 4 para 18 pacientes (16 anamneses concluídas, 2 em andamento), mas só 4 têm avaliação física e 3 têm avaliação postural, funcional, cardiorrespiratória e plano: a fila de quem aguarda avaliação é grande. Há 2 pacientes com vídeo na análise de movimento e 1 registro com nome de teste na base.",
    "Literatura (outubro/novembro de 2026): 1 estudo útil (validação de pose de câmera única, joelho), que reforça o aviso de margem de erro já existente; nada obriga a mudar regra. 2 propostas novas aguardam decisão (N2 e P3). Propostas anteriores sem mudança de status.",
  ],
  verificacoes: [
    { rotulo: "Verificação de tipos (tsc --noEmit)", resultado: "sem erros (as dependências locais estavam incompletas e foram reinstaladas com npm install; nenhum arquivo versionado mudou)", ok: true },
    { rotulo: "Repositório e publicação", resultado: "sem arquivos pendentes; HEAD igual a origin/main; último deploy de produção READY (commit 55f28cb)", ok: true },
    { rotulo: "Revisão da literatura por agente", resultado: "02/10/2026, 52 de 180 dias: em dia", ok: true },
    { rotulo: "Dados de teste no banco", resultado: "1 registro com nome de teste encontrado; não foi mexido (ver proposta N2)", ok: false },
    { rotulo: "Itens a conferir (página Estudos)", resultado: "16 itens abertos, nenhum resolvido desde a rodada anterior (o mais antigo, M2, adiado há 35 dias)", ok: false },
    { rotulo: "Testes de lógica em pasta de rascunho", resultado: "não havia conjunto de testes disponível nesta sessão; só o tsc foi rodado", ok: false },
  ],
  uso: [
    "18 pacientes na base (4 em 19/10); 16 com anamnese concluída, 2 em andamento, nenhum não iniciado; 12 com algum alerta.",
    "4 pacientes com avaliação física; 3 com avaliação postural, funcional, cardiorrespiratória e plano.",
    "%G: 4 pacientes com protocolo de dobras registrado e 1 com %G por bioimpedância preenchido (2 têm campos de bioimpedância).",
    "Análise de movimento usada em 2 pacientes; 2 pacientes com vídeo (4 registros de vídeo no histórico, todos com a adequação registrada). Contagem por busca de texto, sem separar os vereditos com segurança.",
    "1 registro com nome de teste na base.",
    "Última atividade na base: 11/11/2026.",
  ],
  agentes: [
    {
      id: "nina",
      situacao: "atencao",
      achados: [
        "Metade dos pacientes com anamnese concluída ainda não teve avaliação iniciada, e a lista de pacientes não mostra isso.",
        "A busca de triagem pré-exercício (2025 em diante) só trouxe estudos de eletrocardiograma em atletas, fora do público da clínica: sem mudança na triagem.",
        "Rodada de 23/11: a base foi de 4 para 18 pacientes; 16 concluíram a anamnese, mas só 4 têm avaliação física. A coluna Avaliação (N1) já mostra essa fila. A busca nova de triagem trouxe só uma revisão sobre atletas com canalopatias genéticas (Sports Med, nov/2026): fora do público da clínica, descartada.",
        "Há 1 registro com nome de teste na base (conferido só por contagem; não foi mexido).",
      ],
      sugestoes: [
        {
          id: "N2",
          titulo: "Você conferir e retirar o registro de teste da base",
          porque: "Um registro com nome de teste entra nas contagens de uso (18 pacientes) e pode confundir as próximas rodadas e a lista de pacientes.",
          risco: "Baixo, mas é dado de paciente: só você deve apagar, depois de conferir que é mesmo de teste (não é de pessoa real).",
          evidencia: "Contagem de uso desta semana (1 registro com nome de teste).",
          opiniao: "Recomendo aprovar: confira o registro na lista de pacientes e, se for de teste, apague pela tela do avaliador. Eu não apago nem corrijo dado de paciente. Se for de uma pessoa real com nome parecido, recuse e me avise para eu ajustar o critério da contagem.",
          status: "aguardando_decisao",
        },
        {
          id: "N1",
          titulo: "Mostrar na lista de pacientes quem concluiu a anamnese e ainda não tem avaliação",
          porque: "Hoje metade dos pacientes está nessa situação e só se percebe abrindo ficha por ficha.",
          risco: "Baixo: só acrescenta uma coluna ou etiqueta na lista, sem mudar nenhum cálculo.",
          evidencia: "Dado de uso desta semana.",
          opiniao: "Recomendo aprovar. É só uma etiqueta na lista, não mexe em nenhum cálculo, e evita que alguém fique esperando avaliação sem ninguém perceber.",
          status: "feita",
          decisao: "Aprovada em 19/10/2026 e feita no mesmo dia: a lista de pacientes tem a coluna Avaliação (Sem avaliação há N dias, em andamento, completa ou aguarda anamnese).",
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
          opiniao: "Recomendo aprovar (aprovada pelo profissional).",
          status: "feita",
          decisao: "Aprovada em 19/10/2026 e feita no mesmo dia: na anamnese feita na clínica, as perguntas aparecem em terceira pessoa (\"a pessoa\", que vale para paciente e aluno). As opções de resposta e tudo o que é gravado continuam iguais.",
        },
      ],
    },
    {
      id: "marco",
      situacao: "atencao",
      achados: [
        "Todo %G registrado veio de dobras. A proteção de divergência entre dobras e bioimpedância nunca dispara sem bioimpedância, e o maior controle de erro das dobras (várias leituras por ponto) não existe.",
        "Um estudo populacional turco de 2026 (Int J Obes) propôs corte de IMC de 28,8 para obesidade com base em bioimpedância, reforçando que o IMC varia por população: o sistema já usa o IMC só como triagem, sem mudança.",
        "As tabelas Pollock & Wilmore e de massa magra continuam sem conferência no livro (pendência aberta; M2 adiada há 35 dias).",
        "Rodada de 23/11: já há 1 paciente com %G por bioimpedância preenchido, então a proteção contra divergência entre métodos (alerta de números que não fecham, 30/10) passou a ter uso real. A busca nova trouxe pontos de corte de índice de massa gorda em idosos sauditas por bioimpedância (Front Nutr 2026), população diferente: descartada, sem mudança.",
      ],
      sugestoes: [
        {
          id: "M1",
          titulo: "Registrar 3 leituras por dobra e usar a mediana",
          porque: "É a prática padrão para reduzir o erro de técnica das dobras e o método é o único usado até agora. Foi oferecida em 09/10 e ficou de fora; reapresento porque o uso mostra que só há dobras.",
          risco: "Baixo para o cálculo (mesmas equações, só com a mediana); aumenta o tempo de coleta e a tela de dobras.",
          evidencia: "Dado de uso desta semana e pendência de 09/10/2026.",
          opiniao: "A literatura e a prática padrão apoiam as 3 leituras com mediana, mas respeito a sua experiência: a técnica padronizada e o mesmo avaliador nas reavaliações já cobrem boa parte do erro. Recomendava aprovar; aceito a recusa.",
          status: "recusada",
          decisao: "Recusada pelo profissional em 19/10/2026: pela experiência dele não precisa, embora seja sugerida cientificamente. Não volta sem fato novo.",
        },
        {
          id: "M2",
          titulo: "Conferir as duas tabelas no livro e confirmar a correspondência dos níveis com as classes do perfil",
          porque: "As tabelas decidem o domínio de composição corporal e não foram conferidas em fonte publicada.",
          risco: "Médio se ficarem erradas: mudam a classificação de pacientes.",
          evidencia: "Pendência registrada em 09/10/2026.",
          opiniao: "Recomendo manter as tabelas como estão, com o aviso \"fonte não conferida\", e não tratar isso como bloqueio. Tentei conferir na web e não achei a tabela reproduzida (só citações a ela); um estudo brasileiro achado na busca (não conferido no PubMed) relata que a tabela pode não se ajustar bem a frequentadores atuais de academia, sobretudo nas faixas mais velhas. Por isso o parecer mostra a faixa de Gallagher ao lado. Quando surgir um livro que reproduza a tabela (por exemplo, texto de avaliação física de biblioteca de faculdade), conferimos célula a célula. Enquanto isso, nenhuma conduta deve depender só dessa tabela.",
          status: "adiada",
          decisao: "Adiada em 19/10/2026: o profissional ainda não tem o livro.",
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
        "Rodada de 23/11: já há 2 pacientes com vídeo na análise de movimento (4 registros de vídeo no histórico), mas só de poucos movimentos; a calibração dos limites (P2) segue aberta.",
        "Um estudo de nov/2026 (JMIR Rehabil Assist Technol) com 15 adultos saudáveis testou pose de câmera única no joelho: a concordância dependeu do movimento (agachamento razoável, levantar da cadeira menor, apoio unipodal ruim) e 15,7% das medições falharam no critério de confiança; os autores não apoiam trocar a goniometria nem decidir com precisão no seguimento.",
      ],
      sugestoes: [
        {
          id: "P3",
          titulo: "Incluir o estudo de 2026 sobre pose de câmera única (joelho) como referência de cautela para o vídeo",
          porque: "Dá base publicada para dizer que a qualidade da medida por vídeo depende do movimento e da confiança da leitura de cada gravação, o que combina com o veredito de adequação já existente.",
          risco: "Baixo: só entra na base científica da Dra. Paula; não muda nenhum limite nem cálculo.",
          evidencia: "Yue et al., JMIR Rehabil Assist Technol 2026 (PMID 42976294); resumo lido, texto completo não lido.",
          opiniao: "Recomendo aprovar como referência de apoio, só isso. Limite honesto: 15 adultos saudáveis, joelho, vista lateral, celulares e condições controladas; não valida o nosso motor nem o tronco. Não recomendo mexer nos limites de adequação por causa dele: isso depende dos seus vídeos reais (P2).",
          status: "aguardando_decisao",
        },
        {
          id: "P1",
          titulo: "Aviso de margem de erro nos ângulos medidos por vídeo",
          porque: "Dizer na tela e no parecer que diferenças pequenas (da ordem de 7° ou menos) em medidas automáticas de vídeo não devem ser interpretadas, e que isso foi estudado em outra articulação e não foi validado para tronco.",
          risco: "Baixo: é texto de cautela.",
          evidencia: "Rode et al., PLoS One 2026 (PMID 42490640); abstract lido.",
          opiniao: "Recomendo aprovar (aprovada pelo profissional).",
          status: "feita",
          decisao: "Aprovada em 19/10/2026 e feita no mesmo dia: o aviso de margem de erro aparece na tela e no parecer, e o estudo entrou na base científica da Dra. Paula.",
        },
        {
          id: "P2",
          titulo: "Calibrar os limites de adequação do vídeo com os primeiros vídeos reais",
          porque: "Os limites foram definidos sem exemplos reais; podem reprovar vídeos bons ou aprovar vídeos ruins.",
          risco: "Baixo.",
          evidencia: "Pendência registrada em 17/10/2026.",
          opiniao: "Recomendo fazer assim que possível: com 3 a 5 vídeos de movimentos diferentes (de lado e de frente), eu ajusto os limites. Sem exemplos reais, os limites podem reprovar vídeos bons ou aprovar vídeos ruins.",
          status: "aprovada",
          decisao: "O profissional vai enviar os vídeos (19/10/2026). Em 24/10/2026 pediu para fazer a P2 com o que já existe: havia 2 vídeos reais de 1 paciente (flexão de tronco, de lado e de frente). Corrigidos dois defeitos que eles mostraram (desvio lateral de 176° na flexão de frente; conselho de afastar a câmera quando os pés estavam dentro da imagem, só sem leitura). Os limites de tolerância não foram mexidos: com 2 vídeos de 1 movimento não há base. O profissional confirmou (24/10/2026) que o veredito de reprovado do vídeo de frente bateu com o que ele viu. Falta enviar vídeos de outros movimentos; o profissional pediu os desenhos de como filmar cada um, que estão no POP (etapa 9) e no arquivo Guia-de-filmagem-dos-movimentos.png.",
        },
      ],
    },
    {
      id: "rita",
      situacao: "atencao",
      achados: [
        "Uma coorte de 13.423 idosos de 65 anos ou mais em Taiwan (JAMA Netw Open 2026) associou melhor desempenho no levantar da cadeira, apoio unipodal, 8-foot up-and-go (parente do TUG) e teste do degrau de 2 minutos a menor mortalidade por todas as causas, de forma graduada (estudo observacional).",
        "A busca de sarcopenia e dinamometria só trouxe estudos em populações hospitalares e renais: sem base para mudar os cortes de força.",
        "Rodada de 23/11: a busca nova de dinamometria trouxe cortes de força de preensão em turcos de 20 a 39 anos (Ir J Med Sci 2026), população e idade fora do público da clínica: descartada, sem mudança.",
      ],
      sugestoes: [
        {
          id: "R1",
          titulo: "Incluir o estudo de Taiwan (2026) como referência de apoio aos testes funcionais em idosos",
          porque: "Dá base publicada para a Rita dizer por que mede cadeira, apoio unipodal e TUG em quem tem 65 anos ou mais. Não traz cortes para adotar e não muda nenhuma regra.",
          risco: "Baixo.",
          evidencia: "Wu et al., JAMA Netw Open 2026 (PMID 42574013); abstract lido.",
          opiniao: "Recomendo aprovar. Não muda nenhuma regra nem corte: só dá base publicada para explicar ao paciente idoso por que medimos cadeira, equilíbrio em uma perna e TUG. Limite honesto: é estudo observacional de Taiwan, mostra associação com menor mortalidade, não prova que melhorar o teste reduz a mortalidade.",
          status: "feita",
          decisao: "Aprovada em 19/10/2026 e feita no mesmo dia: o estudo entrou na base científica da Dra. Rita.",
        },
      ],
    },
    {
      id: "iris",
      situacao: "atencao",
      achados: [
        "A triagem de sarcopenia usava o %G ideal antigo e a massa magra ideal salva: nas avaliações existentes, 1 de 2 era sinalizada por isso sem falta real de massa magra. Corrigido (I1): agora usa o índice de massa magra.",
        "O conteúdo das 30 condições da aba Condições de saúde foi escrito por IA e ainda não passou por revisão clínica; 10 condições seguem sem fonte conferida.",
        "A busca de diretrizes de exercício em doenças crônicas não trouxe nada que contradiga o conteúdo atual.",
        "Rodada de 23/11: a revisão clínica das 30 condições (I2) segue com você; a busca nova trouxe só uma revisão de fragilidade em insuficiência cardíaca, que não muda o conteúdo atual.",
      ],
      sugestoes: [
        {
          id: "I1",
          titulo: "Decidir se a triagem de sarcopenia passa a usar a tabela de massa magra",
          porque: "Hoje há dois critérios diferentes de massa magra convivendo no sistema.",
          risco: "Médio: muda quem é sinalizado na triagem.",
          evidencia: "Decisão deixada em aberto em 09/10/2026.",
          opiniao: "Recomendo trocar a regra \"massa magra menos de 90% da meta\" pelo índice de massa magra em kg/m² (cortes GLIM de 17 em homens e 15 em mulheres), o mesmo que o Dr. Marco já usa. Motivos: a tabela de massa magra em % é só 100 menos o %G, então não traria informação nova; o índice considera a altura e tem fonte conferida. A panturrilha continua valendo a partir dos 60 anos. Depois de aprovado, comparo o antes e o depois nas avaliações existentes (só contagens, sem nomes) antes de publicar.",
          status: "feita",
          decisao: "Aprovada em 19/10/2026 e feita no mesmo dia, com a comparação feita antes de publicar: das 2 avaliações existentes, 1 era sinalizada por massa muscular reduzida pela regra antiga (por causa da massa magra ideal salva) e deixou de ser pelo índice de massa magra (acima do corte). O índice vale quando não há panturrilha ou a pessoa tem menos de 60 anos.",
        },
        {
          id: "I2",
          titulo: "Revisão clínica do conteúdo das condições, começando pelas 10 sem fonte",
          porque: "É conteúdo de saúde escrito por IA que o avaliador pode ler junto com o paciente.",
          risco: "Médio se não for revisado.",
          evidencia: "Pendência registrada em 09/10/2026.",
          opiniao: "Recomendo em duas partes. Já: colocar em cada condição a etiqueta \"texto escrito por IA, ainda não revisado\", que só some quando você marcar como revisado, para ninguém tomar o texto por conferido. Depois: revisar em lotes de 5 condições, começando pelas mais comuns na clínica (hipertensão, diabetes, obesidade, dor lombar, artrose) e deixando por último as que já têm fonte.",
          status: "aprovada",
          decisao: "Aprovada em 24/10/2026. A etiqueta \"Texto escrito por IA, ainda não revisado\" já está em todas as 30 condições (no item da lista e no painel), com contagem no topo da aba e na página Estudos. Ela só some quando o profissional disser quais condições revisou; aí entram autor e data. Primeiro lote sugerido: hipertensão, diabetes, obesidade, dor lombar e artrose.",
        },
      ],
    },
    {
      id: "theo",
      situacao: "sem_mudanca",
      achados: [
        "Dos 4 pacientes, 2 têm plano; todos os planos mantêm o treino de força em 2 ou mais dias por semana.",
        "As buscas de treino de força e de exercício em câncer trouxeram revisões sem nada que mude as regras do plano.",
        "Rodada de 23/11: 3 pacientes têm plano. Desde 26/10 o plano ganhou a sequência dos serviços da clínica e a estratégia inicial (30, 90 e 180 dias), com decisão do avaliador; sem proposta nova. A busca de treino de força em idosos trouxe apenas uma meta-análise de treino de equilíbrio e cognição, que não muda as regras: sem mudança sugerida.",
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
          opiniao: "Recomendo trocar só nos slides (a aba Física e o parecer mantêm os nomes da tabela): Ruim vira \"acima do desejável\" e Muito ruim vira \"bem acima do desejável\". Há ainda uma armadilha de leitura: \"Abaixo da média\" na tabela quer dizer mais gordura que o médio, mas o paciente pode entender como bom. Sugiro: Excelente = \"excelente\", Bom = \"bom\", Acima da média = \"melhor que a média\", Média = \"na média\", Abaixo da média = \"pior que a média\".",
          status: "feita",
          decisao: "Aprovada em 19/10/2026 e feita no mesmo dia, com a sugestão do agente: só nos slides; a aba Física, o parecer e o relatório técnico mantêm os nomes da tabela.",
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
  lembretes: [
    "N2 e P3 (novas, 23/11): aguardam a sua decisão. N2: conferir e apagar você mesmo o registro de teste da base.",
    "I2 (em andamento): a etiqueta já está nas 30 condições; a revisão clínica dos textos é sua. Diga quais condições você revisou (sugestão: hipertensão, diabetes, obesidade, dor lombar e artrose) e a etiqueta sai dessas, com seu nome e a data.",
    "P2 (de volta, em 26/10/2026): o vídeo voltou ao modo simples da aba Postural. Para calibrar os limites de adequação faltam vídeos reais de outros movimentos além da flexão (agachamento e, se usar, os do modo avançado), de lado e de frente, filmados como no guia de desenhos (POP, etapa 9). Também servem fotos e vídeos reais de pessoas para conferir as sugestões automáticas (graus nas fotos e observações nos movimentos), que até agora só foram testadas com pontos sintéticos. Quando enviar alguns, eu ajusto.",
  ],
  candidatos: [
    {
      pmid: "42976294",
      citacao: "Yue X, Gu Y, Yu B. JMIR Rehabil Assist Technol 2026;13:e102399",
      titulo: "Validation of Single-Camera MediaPipe BlazePose for Knee Joint Angle Measurement Across Multiple Functional Tasks",
      agente: "paula",
      oQueDiz: "15 adultos saudáveis, vista lateral com celular: a concordância com goniômetro/anotação em vídeo variou com a tarefa (ICC 0,77 no agachamento, 0,63 ao levantar da cadeira, 0,14 no apoio unipodal); 15,7% das medições falharam no critério de confiança; os autores dizem que os achados não sustentam substituir a goniometria nem decisões longitudinais precisas.",
      limite: "Joelho, adultos saudáveis, condições controladas; não valida o motor do sistema nem o tronco. Texto completo não lido.",
    },
    {
      pmid: "42490640",
      citacao: "Rode D, et al. PLoS One 2026;21:e0353801",
      titulo: "Validation of markerless human pose estimation methods for clinical assessment of elbow range of motion",
      agente: "paula",
      oQueDiz: "46 pacientes com doença de ombro ou cotovelo; um método de pose monocular teve concordância de 0,92 na flexão (erro mínimo detectável de 6,74°) e superou a avaliação visual; na extensão a avaliação visual foi melhor que os dois métodos automáticos.",
      limite: "Cotovelo, não tronco; vídeo de laboratório; não valida o motor usado no sistema.",
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
