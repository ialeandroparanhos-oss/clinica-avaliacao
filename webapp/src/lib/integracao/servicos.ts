// Agente 7 — Dr. Theo: serviços da clínica sugeridos a partir da avaliação e da anamnese.
//
// Serviços: fisioterapia, musculação, Pilates, RPG, medicina tradicional chinesa (acupuntura),
// massoterapia e psicologia. Para cada um o sistema diz:
//  - POR QUÊ (os achados do paciente que motivaram a sugestão);
//  - QUANDO incluir (30, 60, 90 dias ou anual, com a sequência entre os serviços);
//  - se é INDICADO ou OPCIONAL (preferência do paciente);
//  - o que a literatura diz, com o nível de evidência e as divergências.
//
// INTEGRIDADE: isto é apoio à decisão do profissional, não uma tabela de vendas. O sistema só
// sugere serviço com um achado que o justifique, nunca "enche o pacote", marca como opcional o que
// tem evidência fraca ou divergente e deixa o profissional concordar, discordar ou editar cada um.
// Nada é oferecido ao paciente sem a sua aprovação, e o paciente decide se quer.
// Exemplo-guia (do profissional): dor no joelho com inflamação -> fisioterapia nas primeiras
// semanas; 2º mês acrescentar Pilates e reavaliar a continuidade da fisioterapia; musculação a
// partir de ~3 meses; acupuntura opcional.

import type { PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { escoreTSK11, somaSemNulos } from "@/lib/anamnese/alerts";
import { regioesEfetivas } from "@/lib/anamnese/dorPorRegiao";
import { idadeEfetiva } from "@/lib/avaliacao/identificacao";
import { liberacaoPara } from "@/lib/avaliacao/liberacaoTeste";
import type { DomainKey, PerfilIntegrado } from "./perfil";
import { gerarId, type Evidencia, type Horizonte, type StatusItem } from "./plano";
import { triarSarcopeniaDinapenia } from "./sarcopenia";

export type ServicoId = "fisioterapia" | "musculacao" | "pilates" | "rpg" | "mtc" | "massoterapia" | "psicologia";

export const ORDEM_SERVICOS: ServicoId[] = ["fisioterapia", "psicologia", "musculacao", "pilates", "rpg", "mtc", "massoterapia"];

export const NOME_SERVICO: Record<ServicoId, string> = {
  fisioterapia: "Fisioterapia",
  musculacao: "Musculação",
  pilates: "Pilates",
  rpg: "RPG (Reeducação Postural Global)",
  mtc: "Medicina Tradicional Chinesa (acupuntura)",
  massoterapia: "Massoterapia",
  psicologia: "Psicologia",
};

// Texto simples para o paciente (sem preço, sem pressão).
export const TEXTO_SERVICO_PACIENTE: Record<ServicoId, string> = {
  fisioterapia: "cuidar da dor e recuperar o movimento, com exercícios terapêuticos acompanhados",
  musculacao: "ganhar força com treino acompanhado, aumentando a carga aos poucos",
  pilates: "melhorar controle do corpo, postura e mobilidade com exercícios de solo ou aparelhos",
  rpg: "trabalhar postura e alongamento global, em sessões individuais",
  mtc: "acupuntura como apoio ao alívio da dor, se você quiser",
  massoterapia: "alívio da tensão muscular e relaxamento, junto com o exercício",
  psicologia: "um espaço de apoio para estresse, ansiedade, humor ou para lidar melhor com a dor",
};

export type PrioridadeServico = "indicado" | "opcional";
export const ROTULO_PRIORIDADE_SERVICO: Record<PrioridadeServico, string> = { indicado: "Indicado", opcional: "Opcional" };

export type EtapaServico = { horizonte: Horizonte; texto: string };

export type ServicoPlano = {
  id: string;
  servico: ServicoId;
  prioridade: PrioridadeServico;
  motivos: string[];
  etapas: EtapaServico[];
  evidencia?: Evidencia;
  ressalva?: string;
  regra: string;
  status?: StatusItem;
  comentario?: string;
};

const PUBMED = (pmid: string) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;

const REF = {
  OMS_2020: { rotulo: "Bull et al., Br J Sports Med 2020 (diretrizes da OMS)", url: PUBMED("33239350") },
  FRANSEN_2015: { rotulo: "Fransen et al., Cochrane 2015 - exercício para artrose de joelho", url: PUBMED("25569281") },
  NICE_NG59: { rotulo: "NICE NG59 - dor lombar e ciática", url: "https://www.nice.org.uk/guidance/ng59" },
  YAMATO_2015: { rotulo: "Yamato et al., Cochrane 2015 - Pilates para dor lombar", url: PUBMED("26133923") },
  GONZALEZ_2021: { rotulo: "Gonzalez-Medina et al., J Clin Med 2021 - RPG na dor lombar crônica", url: PUBMED("34830609") },
  HEMPEN_2025: { rotulo: "Hempen & Hummelsberger, Complement Ther Med 2025 - revisão de revisões sobre acupuntura", url: PUBMED("40021024") },
  FURLAN_2015: { rotulo: "Furlan et al., Cochrane 2015 - massagem para dor lombar", url: PUBMED("26329399") },
  WILLIAMS_2020: { rotulo: "Williams et al., Cochrane 2020 - terapias psicológicas para dor crônica", url: PUBMED("32794606") },
  GOMEZ_2024: { rotulo: "Gómez-Redondo et al., Sports Med 2024 - exercício supervisionado x não supervisionado (60+)", url: PUBMED("38647999") },
};

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Sinais = ReturnType<typeof extrairSinais>;

function extrairSinais(perfil: PerfilIntegrado, paciente: PacienteRow) {
  const a = mesclarComPadrao(paciente.anamnese);
  const idade = idadeEfetiva(paciente);
  const por = regioesEfetivas(a.dor);
  const regioes = Object.keys(por);
  const intensidades = Object.values(por).map((v) => v.intensidade).filter((v): v is number => v !== null && v !== undefined);
  const maxNrs = intensidades.length > 0 ? Math.max(...intensidades) : a.dor.intensidade_nrs ?? null;
  const temDor = a.dor.tem_dor === true;
  const dorCronica = Object.values(por).some((v) => ["3 a 6 meses", "6 meses a 1 ano", "Mais de 1 ano"].includes(v.duracao));
  const reg = (re: RegExp) => regioes.filter((r) => re.test(normalizar(r)));
  const lombar = reg(/lombar|coluna|costas/);
  const cervical = reg(/pesco|cervical|nuca/);
  const joelho = reg(/joelho/);
  const articulacoesMsk = reg(/joelho|quadril|ombro|tornozelo|cotovelo|punho|mao|pe\b/);
  const mskQualquer = regioes.length > 0;
  const textoLivre = normalizar(
    [a.motivo.queixa_principal, a.motivo.motivo_procura, a.historico_saude.doencas, a.historico_saude.outras_condicoes, a.historico_saude.lesoes_fraturas, a.dor.agravantes, a.dor.tratamentos_anteriores].filter(Boolean).join(" ")
  );
  const inflamacao = /inflama|incha|edema|tendinite|bursite|artrite|sinovite/.test(textoLivre);
  const bandeiras = (a.dor.bandeiras_vermelhas ?? []).length > 0;
  const tsk = escoreTSK11(a.dor.tsk11);
  const pseq = somaSemNulos(a.dor.pseq);
  const psicossocialDor = (tsk !== null && tsk >= 26) || (pseq !== null && pseq < 40);
  const estresse = a.estilo_vida.estresse_percebido;
  const ideacao = (a.saude_mental.phq9?.[8] ?? 0) > 0;
  const dom = (k: DomainKey) => perfil.dominios.find((d) => d.chave === k);
  const precisa = (k: DomainKey) => dom(k)?.classificacao === "atencao" || dom(k)?.classificacao === "prioridade";
  const core: string[] = Array.isArray(paciente.funcional?.core_achados) ? paciente.funcional.core_achados : [];
  const coreAlterado = core.some((c) => c !== "Mantém o alinhamento");
  const caracteristicas: string[] = a.dor.caracteristicas ?? [];
  const liberacao = liberacaoPara(paciente, "vigorosa_maxima");
  return {
    a,
    idade,
    regioes,
    maxNrs,
    temDor,
    dorCronica,
    lombar,
    cervical,
    joelho,
    articulacoesMsk,
    mskQualquer,
    inflamacao,
    bandeiras,
    psicossocialDor,
    estresse,
    ideacao,
    dom,
    precisa,
    coreAlterado,
    caracteristicas,
    osteoParq: a.prontidao.parq.bone_joint === true,
    lesoes: a.historico_saude.tem_lesoes === true || a.historico_saude.tem_cirurgias === true,
    sedentario: a.atividade_fisica.pratica_atual === false,
    quedas: a.historico_saude.quedas_12m === true,
    sarcopenia: triarSarcopeniaDinapenia(paciente),
    precisaLiberacaoMedica: liberacao.nivel === "liberacao_necessaria" || liberacao.nivel === "liberacao_recomendada",
    liberacao,
  };
}

const lista = (r: string[]) => r.map((x) => x.toLowerCase()).join(", ");

export function sugerirServicos(perfil: PerfilIntegrado, paciente: PacienteRow): ServicoPlano[] {
  const s: Sinais = extrairSinais(perfil, paciente);
  const saida: ServicoPlano[] = [];
  const add = (servico: ServicoId, prioridade: PrioridadeServico, motivos: string[], etapas: EtapaServico[], extra: { evidencia?: Evidencia; ressalva?: string } = {}) =>
    saida.push({ id: gerarId(), servico, prioridade, motivos, etapas, evidencia: extra.evidencia, ressalva: extra.ressalva, regra: `servico|${servico}`, status: "sugerido" });

  // Fase inicial "delicada": dor forte, inflamação ou sinal de alerta -> a musculação começa depois da fisioterapia.
  const faseInicial = s.temDor && ((s.maxNrs ?? 0) >= 7 || s.inflamacao || s.bandeiras);
  const aguardarMedico = s.bandeiras || s.liberacao.nivel === "liberacao_necessaria";
  const avisoMedico = aguardarMedico ? "Há sinal de alerta: inicie os serviços com exercício só depois da avaliação e liberação médica." : undefined;
  const prefixo = (t: string) => (aguardarMedico ? `Após liberação médica: ${t}` : t);

  // 1) Fisioterapia
  const motFisio: string[] = [];
  if (s.temDor && ((s.maxNrs ?? 0) >= 4 || !s.dorCronica || s.inflamacao)) motFisio.push(`dor ${s.regioes.length > 0 ? `em ${lista(s.regioes)}` : "relatada"}${s.maxNrs !== null ? ` (até ${s.maxNrs}/10)` : ""}`);
  if (s.inflamacao) motFisio.push("relato de inflamação ou inchaço na anamnese (o sistema só identifica o que está escrito: confirme na avaliação)");
  if (s.lesoes) motFisio.push("histórico de lesão ou cirurgia");
  if (s.osteoParq) motFisio.push("problema ósseo ou articular que pode piorar com o esforço (PAR-Q+)");
  if (s.dom("mobilidade")?.classificacao === "atencao") motFisio.push("mobilidade com assimetria ou restrição nos testes");
  if (s.dom("equilibrio")?.classificacao === "prioridade") motFisio.push("risco de queda");
  if (motFisio.length > 0) {
    const indicado = (s.temDor && ((s.maxNrs ?? 0) >= 4 || s.inflamacao)) || s.dom("equilibrio")?.classificacao === "prioridade" || s.lesoes;
    add(
      "fisioterapia",
      indicado ? "indicado" : "opcional",
      motFisio,
      [
        { horizonte: "30", texto: prefixo("Iniciar nas primeiras semanas: avaliação, controle da dor e da inflamação, e exercícios terapêuticos (frequência definida pelo fisioterapeuta).") },
        { horizonte: "60", texto: "Reavaliar a continuidade: manter, espaçar as sessões ou dar alta, conforme a evolução da dor e da função." },
        { horizonte: "90", texto: "Alta ou manutenção, com transição para o treino de força e o Pilates." },
      ],
      {
        evidencia: {
          resumo: s.joelho.length > 0
            ? "Na artrose de joelho, o exercício terapêutico reduz a dor (evidência de alta qualidade) e melhora a função (qualidade moderada); programas individuais tendem a render mais que os em grupo ou em casa. Para dor lombar, a diretriz NICE NG59 recomenda educação e exercício como base."
            : "Exercício terapêutico acompanhado é a base do cuidado de dor musculoesquelética persistente (diretriz NICE NG59 para dor lombar; na artrose de joelho, revisão Cochrane com evidência de alta qualidade para dor).",
          certeza: "Alta para exercício na dor de joelho (Cochrane); diretriz para dor lombar.",
          ressalva: "A evidência é do exercício terapêutico: recursos passivos isolados têm menos suporte. O sistema não identifica o diagnóstico: o fisioterapeuta define a conduta.",
          referencias: s.joelho.length > 0 ? [REF.FRANSEN_2015, REF.NICE_NG59] : [REF.NICE_NG59, REF.FRANSEN_2015],
        },
        ressalva: avisoMedico,
      }
    );
  }

  // 2) Psicologia
  const motPsi: string[] = [];
  let prioridadePsi: PrioridadeServico = "opcional";
  if (s.ideacao) {
    motPsi.push("item de ideação de autolesão positivo no PHQ-9: encaminhamento prioritário, com avaliação médica/psiquiátrica");
    prioridadePsi = "indicado";
  }
  const bem = s.dom("bem_estar")?.classificacao;
  if (bem === "prioridade") {
    motPsi.push("triagem de humor/ansiedade em faixa sugestiva de quadro importante (triagem, não diagnóstico)");
    prioridadePsi = "indicado";
  } else if (bem === "atencao") {
    motPsi.push("triagem de bem-estar emocional com atenção (oferecer e acolher)");
  }
  if (s.psicossocialDor) {
    motPsi.push("fatores psicossociais da dor (medo de movimento ou baixa autoeficácia)");
    if (s.dorCronica) prioridadePsi = "indicado";
  }
  if (typeof s.estresse === "number" && s.estresse >= 8) {
    motPsi.push(`estresse percebido muito alto (${s.estresse}/10)`);
    prioridadePsi = "indicado";
  } else if (typeof s.estresse === "number" && s.estresse >= 5) {
    motPsi.push(`estresse percebido moderado a alto (${s.estresse}/10)`);
  }
  if (s.dom("sono")?.classificacao === "prioridade") motPsi.push("sono de má qualidade importante");
  if (motPsi.length > 0) {
    add(
      "psicologia",
      prioridadePsi,
      motPsi,
      [
        { horizonte: "30", texto: "Primeira consulta: acolhimento, escuta e combinado da frequência (a decisão de começar é do paciente)." },
        { horizonte: "60", texto: "Reavaliar o acompanhamento com o paciente: manter, espaçar ou encerrar." },
        { horizonte: "90", texto: "Reavaliação conjunta com a equipe, junto da reavaliação completa." },
      ],
      {
        evidencia: s.dorCronica || s.psicossocialDor
          ? {
              resumo: "Na dor crônica, a terapia cognitivo-comportamental teve benefício pequeno ou muito pequeno sobre dor, incapacidade e sofrimento (revisão Cochrane de 75 estudos); o efeito é maior frente ao cuidado habitual do que frente a outro tratamento ativo.",
              certeza: "Moderada para a terapia cognitivo-comportamental.",
              ressalva: "O benefício é modesto; a indicação aqui também se apoia no sofrimento emocional do paciente, que vale por si. Sinais de risco pedem encaminhamento médico, nunca só psicologia.",
              referencias: [REF.WILLIAMS_2020],
            }
          : undefined,
        ressalva: s.ideacao ? "Sinal de risco: acione o fluxo de encaminhamento prioritário (Nina) antes de qualquer oferta de serviço." : "Respeite a vontade do paciente: é opcional e confidencial.",
      }
    );
  }

  // 3) Musculação (treino de força supervisionado)
  const motMusc: string[] = [];
  const forca = s.dom("forca")?.classificacao;
  if (forca === "prioridade" || forca === "atencao") motMusc.push("força abaixo da referência nos testes");
  if (s.sarcopenia.classificacao === "sarcopenia_provavel" || s.sarcopenia.classificacao === "dinapenia_provavel") motMusc.push("triagem sugere perda de força ou de massa muscular");
  if (s.precisa("composicao_corporal")) motMusc.push("composição corporal com atenção (preservar massa magra)");
  if (s.sedentario) motMusc.push("sedentarismo (a OMS recomenda força em 2 ou mais dias por semana)");
  const idoso = s.idade !== null && s.idade >= 60;
  if (motMusc.length > 0 || idoso) {
    if (motMusc.length === 0) motMusc.push("base de todo plano: força em 2 ou mais dias por semana (OMS)");
    const indicado = forca === "prioridade" || forca === "atencao" || s.sarcopenia.classificacao !== "sem_sinais" && s.sarcopenia.classificacao !== "dados_insuficientes";
    const etapas: EtapaServico[] = faseInicial
      ? [
          { horizonte: "30", texto: "Neste início, o fortalecimento acontece dentro da fisioterapia (exercícios terapêuticos); a musculação ainda não." },
          { horizonte: "90", texto: prefixo("Iniciar a musculação supervisionada (2x/semana, técnica e cargas leves), com a liberação do fisioterapeuta e a dor sob controle.") },
          { horizonte: "365", texto: "Manter o treino de força em 2 ou mais dias por semana e reavaliar a força a cada 90 dias." },
        ]
      : [
          { horizonte: "30", texto: prefixo("Iniciar musculação supervisionada, 2x/semana, para aprender os movimentos (carga leve a moderada).") },
          { horizonte: "60", texto: "Progredir séries e carga conforme a técnica e a resposta." },
          { horizonte: "90", texto: "Reavaliar a força e renovar o treino." },
          { horizonte: "365", texto: "Manter o treino de força em 2 ou mais dias por semana." },
        ];
    add("musculacao", indicado ? "indicado" : "opcional", motMusc, etapas, {
      evidencia: {
        resumo: "A OMS recomenda atividade de fortalecimento dos grandes grupos musculares em 2 ou mais dias por semana. Em pessoas com 60 anos ou mais, exercício com ou sem supervisão foi seguro; a supervisão pôde somar um ganho extra, principalmente na força do joelho (34 ensaios).",
        certeza: "Diretriz (OMS 2020); meta-análise de ensaios (supervisão).",
        ressalva: "A vantagem da supervisão vem de estudo em maiores de 60 anos e é pequena e não robusta em todos os desfechos.",
        referencias: [REF.OMS_2020, REF.GOMEZ_2024],
      },
      ressalva: avisoMedico,
    });
  }

  // 4) Pilates
  const motPil: string[] = [];
  if (s.lombar.length > 0) motPil.push(`dor lombar ou nas costas (${lista(s.lombar)})`);
  if (s.cervical.length > 0) motPil.push(`dor cervical (${lista(s.cervical)})`);
  if (s.dom("mobilidade")?.classificacao === "atencao") motPil.push("mobilidade com assimetria ou restrição");
  if (s.coreAlterado) motPil.push("alteração observada na estabilidade do core");
  if (s.dom("equilibrio")?.classificacao === "atencao") motPil.push("equilíbrio com atenção");
  // Dor musculoesquelética em reabilitação: o Pilates entra como etapa seguinte à fisioterapia
  // (prática do profissional; a evidência conferida é só para dor lombar, e isso fica dito).
  if (s.temDor && motFisio.length > 0 && s.lombar.length === 0 && s.cervical.length === 0) motPil.push("dor musculoesquelética em reabilitação: etapa seguinte à fisioterapia, para manter o controle motor e a mobilidade");
  if (motPil.length > 0) {
    add(
      "pilates",
      "opcional",
      motPil,
      faseInicial || motFisio.length > 0
        ? [
            { horizonte: "60", texto: prefixo("Acrescentar o Pilates (em geral 2x/semana) junto da reavaliação da continuidade da fisioterapia.") },
            { horizonte: "90", texto: "Avaliar a continuidade: o Pilates pode seguir como manutenção do controle motor e da mobilidade." },
          ]
        : [
            { horizonte: "30", texto: prefixo("Iniciar o Pilates (em geral 2x/semana), com foco em controle do tronco e mobilidade.") },
            { horizonte: "90", texto: "Reavaliar a mobilidade e o controle motor; manter ou ajustar." },
          ],
      {
        evidencia: {
          resumo: "Na dor lombar inespecífica, o Pilates reduziu a dor e a incapacidade em relação a nenhuma intervenção mínima (evidência de qualidade baixa a moderada). Não foi superior a outros exercícios: a escolha pode ser pela preferência do paciente e pelo custo.",
          certeza: "Baixa a moderada.",
          ressalva: "Evidência é para dor lombar; para outras queixas não há dado conferido pelo sistema. Por isso é sugerido como opcional.",
          referencias: [REF.YAMATO_2015],
        },
        ressalva: avisoMedico,
      }
    );
  }

  // 5) RPG
  const motRpg: string[] = [];
  if ((s.lombar.length > 0 || s.cervical.length > 0) && s.dorCronica) motRpg.push(`dor crônica na coluna (${lista([...s.lombar, ...s.cervical])})`);
  if (motRpg.length > 0 && (s.dom("mobilidade")?.classificacao === "atencao" || s.coreAlterado || s.dorCronica)) {
    if (s.dom("mobilidade")?.classificacao === "atencao") motRpg.push("restrição ou assimetria de mobilidade");
    add(
      "rpg",
      "opcional",
      motRpg,
      [
        { horizonte: "30", texto: prefixo("Ciclo inicial de sessões individuais (frequência definida pelo terapeuta).") },
        { horizonte: "60", texto: "Reavaliar a resposta (dor 0 a 10 e mobilidade) e decidir manter ou encerrar." },
      ],
      {
        evidencia: {
          resumo: "Em dor lombar crônica, uma meta-análise de 7 ensaios (334 pacientes) encontrou menos dor e melhor função com a Reeducação Postural Global em comparação com outros programas de exercício.",
          certeza: "Baixa a moderada (poucos ensaios e amostras pequenas; os autores a descrevem como forte, mas o número de estudos é pequeno).",
          ressalva: "Evidência para dor lombar crônica; para dor cervical e para postura em geral o sistema não tem dado conferido. Sem superioridade comprovada sobre outro exercício bem conduzido: oferecer como opção.",
          referencias: [REF.GONZALEZ_2021],
        },
        ressalva: avisoMedico,
      }
    );
  }

  // 6) Medicina Tradicional Chinesa (acupuntura)
  if (s.temDor && s.dorCronica && s.mskQualquer) {
    add(
      "mtc",
      "opcional",
      [`dor crônica musculoesquelética (${lista(s.regioes)})`],
      [
        { horizonte: "30", texto: prefixo("Ciclo inicial de acupuntura como apoio ao alívio da dor, se o paciente quiser (número de sessões definido pelo profissional).") },
        { horizonte: "60", texto: "Avaliar a resposta (dor 0 a 10 por região) e decidir se continua: manter só se houver benefício que o paciente perceba." },
      ],
      {
        evidencia: {
          resumo:
            "Uma revisão de revisões sistemáticas de 2017 a 2022 classificou a acupuntura como de efeito positivo para dor crônica, dor lombar e artrose de joelho. As diretrizes divergem: por exemplo, a NICE (NG59, 2016) não recomenda acupuntura para dor lombar.",
          certeza: "Divergente: revisão de revisões positiva, com qualidade variável dos ensaios; diretriz NICE contrária para dor lombar.",
          ressalva:
            "Os autores da revisão são ligados a uma sociedade de medicina chinesa e apontam falta de ensaios de alta qualidade em vários casos. É um apoio opcional, nunca substitui o exercício, e a decisão é do paciente.",
          referencias: [REF.HEMPEN_2025, REF.NICE_NG59],
        },
        ressalva: avisoMedico,
      }
    );
  }

  // 7) Massoterapia
  const motMassa: string[] = [];
  if (s.temDor && s.caracteristicas.some((c) => ["Peso", "Aperto"].includes(c))) motMassa.push("dor descrita como peso ou aperto (possível tensão muscular)");
  if (typeof s.estresse === "number" && s.estresse >= 5) motMassa.push(`estresse percebido ${s.estresse}/10`);
  if (s.a.contexto.exige_esforco_fisico === true) motMassa.push("trabalho com demanda física");
  if (motMassa.length > 0) {
    add(
      "massoterapia",
      "opcional",
      motMassa,
      [
        { horizonte: "30", texto: prefixo("Sessões pontuais para alívio da tensão e relaxamento, sempre junto do exercício (não o substitui).") },
        { horizonte: "60", texto: "Reavaliar a necessidade: manter só se aliviar de forma perceptível." },
      ],
      {
        evidencia: {
          resumo: "Na dor lombar, a massagem melhorou a dor e a função apenas a curto prazo, com evidência de qualidade baixa a muito baixa; os efeitos adversos foram leves (piora temporária da dor).",
          certeza: "Baixa a muito baixa, só curto prazo.",
          ressalva: "Evidência é de dor lombar; serve como apoio de conforto, não como tratamento principal.",
          referencias: [REF.FURLAN_2015],
        },
        ressalva: avisoMedico,
      }
    );
  }

  const ordem = (x: ServicoPlano) => ORDEM_SERVICOS.indexOf(x.servico) + (x.prioridade === "indicado" ? 0 : 100);
  return saida.sort((a, b) => ordem(a) - ordem(b));
}
