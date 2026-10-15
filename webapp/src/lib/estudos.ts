// Página "Estudos para atualização" (/avaliador/estudos): organiza o que o sistema já usa, mostra quando a
// revisão vence, lista o que ainda precisa de conferência e monta buscas prontas no PubMed por tema.
// INTEGRIDADE: este arquivo NÃO traz estudo novo nem resumo de estudo. As buscas só abrem o PubMed; um estudo
// só entra no sistema depois de conferido (autor, revista, ano, volume, página) e registrado em
// 10-Revisao-Cientifica-por-Agente.md.

import type { AgenteId } from "@/lib/agentes";

export type TemaBusca = { rotulo: string; consulta: string };

// Consultas em inglês (a literatura indexada no PubMed). Termos escolhidos pelo que cada agente decide.
export const TEMAS_BUSCA: Record<AgenteId, TemaBusca[]> = {
  nina: [
    { rotulo: "Triagem de saúde antes do exercício", consulta: "preparticipation health screening exercise guideline" },
    { rotulo: "Prontidão para atividade física", consulta: "PAR-Q+ validity physical activity readiness" },
  ],
  sofia: [
    { rotulo: "Triagem de depressão e ansiedade (PHQ-2, GAD-2)", consulta: "PHQ-2 GAD-2 ultra-brief screening accuracy" },
    { rotulo: "Qualidade do sono (PSQI) em brasileiros", consulta: "Pittsburgh Sleep Quality Index validation Brazilian" },
    { rotulo: "Nível de atividade física (IPAQ)", consulta: "IPAQ validity overestimation physical activity self-report" },
  ],
  marco: [
    { rotulo: "Valores de referência de %G e massa magra", consulta: "body fat percentage reference values adults age sex" },
    { rotulo: "Obesidade sarcopênica: critérios", consulta: "sarcopenic obesity diagnostic criteria consensus" },
    { rotulo: "Validade das dobras cutâneas contra DXA", consulta: "skinfold equations validity DXA adults" },
    { rotulo: "IMC e adiposidade: definição de obesidade", consulta: "clinical obesity definition BMI body fat commission" },
  ],
  paula: [
    { rotulo: "Postura e dor: revisões sistemáticas", consulta: "posture pain association systematic review" },
    { rotulo: "Avaliação da escápula", consulta: "scapular dyskinesis assessment validity reliability" },
    { rotulo: "Movimento: flexão de tronco, confiabilidade", consulta: "trunk forward flexion movement assessment reliability" },
    { rotulo: "Estimativa de pose por vídeo 2D: validade contra goniometria", consulta: "markerless pose estimation smartphone video joint angle validity" },
  ],
  rita: [
    { rotulo: "Sarcopenia: critérios e cortes de força", consulta: "sarcopenia handgrip strength cutoff consensus" },
    { rotulo: "Risco de queda: TUG e testes de equilíbrio", consulta: "Timed Up and Go cutoff falls older adults accuracy" },
    { rotulo: "Teste de caminhada de 6 minutos: referência", consulta: "six-minute walk test reference equation adults" },
    { rotulo: "Mobilidade articular: valores de referência", consulta: "joint range of motion reference values side-to-side difference" },
  ],
  iris: [
    { rotulo: "Exercício em doenças crônicas: diretrizes", consulta: "exercise recommendations chronic disease guideline" },
    { rotulo: "Multimorbidade e exercício", consulta: "multimorbidity exercise intervention" },
  ],
  theo: [
    { rotulo: "Prescrição de exercício: diretrizes atuais", consulta: "physical activity guidelines adults resistance training recommendations" },
    { rotulo: "Treino de força em idosos", consulta: "resistance training older adults meta-analysis" },
    { rotulo: "Exercício supervisionado e não supervisionado", consulta: "supervised versus unsupervised exercise meta-analysis" },
  ],
  clara: [
    { rotulo: "Comunicação de resultados ao paciente", consulta: "communicating test results to patients health literacy" },
    { rotulo: "Comunicação de risco", consulta: "risk communication patients clinical encounter" },
  ],
  caio: [
    { rotulo: "VO2máx: percentis de referência", consulta: "cardiorespiratory fitness percentiles reference VO2max" },
    { rotulo: "FC máxima: equações de predição", consulta: "maximal heart rate prediction equation" },
    { rotulo: "Aptidão cardiorrespiratória e mortalidade", consulta: "cardiorespiratory fitness mortality" },
  ],
};

// Anos recentes: a busca já abre ordenada pelo mais novo.
export function linkPubMed(consulta: string, anoInicial = new Date().getFullYear() - 3, anoFinal = new Date().getFullYear()): string {
  const q = encodeURIComponent(consulta);
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${q}&sort=date&filter=years.${anoInicial}-${anoFinal}`;
}

export function linkPmid(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}

// O que ainda está marcado como "a confirmar" no sistema (fonte: 10-Revisao-Cientifica-por-Agente.md).
export type Pendencia = { agente: string; item: string; situacao: string };

export const PENDENCIAS: Pendencia[] = [
  { agente: "Dr. Marco", item: "Tabela Pollock & Wilmore (%G por idade e sexo) e tabela de massa magra em % do peso", situacao: "Vêm de livro e de planilha do profissional: não conferidas no PubMed. Conferir no livro; célula 'Ruim' de homens de 26 a 35 anos foi assumida como 25 a 27%." },
  { agente: "Dr. Marco", item: "Correspondência dos níveis da tabela com as classes do perfil (muito ruim = prioridade; ruim e abaixo da média = atenção)", situacao: "Suposição do sistema, a confirmar com o profissional." },
  { agente: "Dr. Marco", item: "Coeficientes de Pollock (3 e 7 dobras) e conversão de Siri", situacao: "Versões de livro-texto (ACSM); os resumos do PubMed não reproduzem as equações. Confirmar no livro." },
  { agente: "Dr. Marco", item: "Soma de dobras acima de 120 mm como alerta de cautela", situacao: "Fonte secundária, não encontrada no PubMed." },
  { agente: "Dr. Marco", item: "Equação de Weltman (homens obesos) e 'Esportes Mulheres'", situacao: "Fonte não encontrada; equação de Weltman para mulheres obesas confirmada (Am J Clin Nutr 1988) e ainda não implementada." },
  { agente: "Dr. Marco", item: "Faixas saudáveis de %G de Gallagher 2000", situacao: "Provisórias (derivadas do IMC, amostra com IMC até 35)." },
  { agente: "Dr. Marco", item: "Meta de recomposição muscular e carência de massa magra pelo índice", situacao: "Regra do sistema; o índice está em teste desde 11/10/2026." },
  { agente: "Dra. Íris", item: "Triagem de sarcopenia: regra 'massa magra < 90% da meta' e panturrilha < 31 cm", situacao: "Regra sem validação publicada; panturrilha vem de amostra pequena e hospitalar." },
  { agente: "Dra. Rita", item: "Chair Stand e Arm Curl: limites do Senior Fitness Test", situacao: "Tabelas do manual conferidas em fonte secundária; padrões criteriais ainda não usados." },
  { agente: "Dra. Rita", item: "Teste de caminhada de 6 minutos: corte de classificação", situacao: "Não adotado (o resumo da equação brasileira não traz o limite inferior)." },
  { agente: "Dra. Rita / Dra. Paula", item: "Mobilidade: corte de assimetria de 8°", situacao: "Baseado numa amostra pequena de mulheres saudáveis; não há corte absoluto de amplitude." },
  { agente: "Dra. Paula", item: "Postura: cortes de 3° (discreta) e 6° (evidente), roteiro de observação do movimento", situacao: "Referências práticas do sistema, sem validação publicada." },
  { agente: "Dra. Paula", item: "Escápula", situacao: "Sem instrumento clínico validado (D'hondt 2020); só comparação do mesmo paciente no tempo." },
  { agente: "Dr. Caio", item: "Faixas de percentil das classes de VO2máx", situacao: "Confirmadas pelo profissional; conferir se a tabela FRIEND de esteira cobre o público da clínica." },
  { agente: "Dra. Íris", item: "Aba Condições de saúde: conteúdo clínico escrito por IA", situacao: "Aguarda revisão clínica do profissional; 10 condições seguem sem fonte conferida." },
  { agente: "Dra. Clara", item: "Tom dos níveis 'Ruim' e 'Muito ruim' nos slides", situacao: "Sugestão de revisão de linguagem para uso com o paciente presente." },
];
