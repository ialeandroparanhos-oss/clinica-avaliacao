// Agente 7 — Dr. Theo: serviços da clínica sugeridos a partir da avaliação e da anamnese.
//
// Serviços da clínica (decisão do profissional, 30/10/2026): psicologia, medicina tradicional chinesa (acupuntura),
// fisioterapia e suas áreas (ortopédica, coluna e postura com RPG, geriátrica e prevenção de quedas, neurofuncional,
// cardiorrespiratória e pélvica), musculação e Pilates. RPG e massoterapia deixaram de ser serviços à parte (o RPG é
// uma técnica da fisioterapia; a massoterapia não é oferecida), mas planos antigos que os tenham continuam abrindo.
// O sistema NÃO prescreve exercício (tipo, carga, frequência): isso é do profissional de cada serviço; ele indica
// QUAIS serviços combinam com o quadro atual e por onde começar. Para cada um o sistema diz:
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

export const ORDEM_SERVICOS: ServicoId[] = ["fisioterapia", "psicologia", "musculacao", "pilates", "mtc", "rpg", "massoterapia"];

export const NOME_SERVICO: Record<ServicoId, string> = {
  fisioterapia: "Fisioterapia",
  musculacao: "Musculação consciente",
  pilates: "Pilates",
  rpg: "RPG (Reeducação Postural Global)",
  mtc: "Medicina Tradicional Chinesa (acupuntura)",
  massoterapia: "Massoterapia",
  psicologia: "Psicologia",
};

// Texto simples para o paciente (sem preço, sem pressão).
export const TEXTO_SERVICO_PACIENTE: Record<ServicoId, string> = {
  fisioterapia: "cuidar da dor e recuperar o movimento, com exercícios terapêuticos acompanhados",
  musculacao: "ganhar força e disposição com treino acompanhado, no ritmo que o seu corpo permitir",
  pilates: "melhorar controle do corpo, postura e mobilidade com exercícios de solo ou aparelhos",
  rpg: "trabalhar postura e alongamento global, em sessões individuais",
  mtc: "acupuntura como apoio ao alívio da dor, se você quiser",
  massoterapia: "alívio da tensão muscular e relaxamento, junto com o exercício",
  psicologia: "um espaço de apoio para estresse, ansiedade, humor ou para lidar melhor com a dor",
};

export type PrioridadeServico = "indicado" | "opcional";
export const ROTULO_PRIORIDADE_SERVICO: Record<PrioridadeServico, string> = { indicado: "Indicado", opcional: "Opcional" };

export type EtapaServico = { horizonte: Horizonte; texto: string; semInicio?: boolean }; // semInicio: a etapa é só um aviso e não começa o serviço

// Área da fisioterapia indicada para o quadro (a fisioterapia tem várias áreas, cada uma com um foco).
export type AreaFisio = { chave: string; nome: string; atuacao: string; motivos: string[] };

// Leitura das profissões: quem é o profissional, o que ele faz e em que costuma ajudar. É descrição do campo de
// atuação (não é afirmação de resultado); a evidência de cada caso vem separada, nas referências conferidas.
export const PROFISSOES: Record<ServicoId, { profissional: string; atuacao: string; beneficios: string[] }> = {
  fisioterapia: {
    profissional: "Fisioterapeuta",
    atuacao: "avalia o movimento e a função do corpo e trata dor, lesões e limitações com exercício terapêutico, terapia manual, orientação e recursos de reabilitação. Atua em várias áreas: ortopédica, coluna e postura (inclui RPG), geriátrica e prevenção de quedas, neurofuncional, cardiorrespiratória e pélvica.",
    beneficios: ["reduzir a dor e a inflamação", "recuperar movimento, força e função depois de lesão ou cirurgia", "reeducar a postura e o controle da coluna", "treinar equilíbrio e reduzir o risco de queda", "preparar o corpo para voltar ao treino com segurança"],
  },
  psicologia: {
    profissional: "Psicólogo(a)",
    atuacao: "oferece escuta e avaliação psicológica e acompanhamento (por exemplo, terapia cognitivo-comportamental) para estresse, ansiedade, humor, sono, relação com a dor e mudança de hábitos. Não prescreve medicamentos: quando necessário, trabalha junto com o médico.",
    beneficios: ["apoio emocional e estratégias para lidar com estresse, ansiedade e humor rebaixado", "lidar melhor com a dor persistente e com o medo de se mexer", "melhorar o sono e a rotina", "sustentar a motivação e a regularidade nos hábitos e no treino"],
  },
  mtc: {
    profissional: "Profissional de medicina tradicional chinesa (acupuntura)",
    atuacao: "faz a avaliação pela medicina tradicional chinesa e utiliza a acupuntura e técnicas relacionadas como apoio ao cuidado, em geral para dor, tensão, estresse e sono. É um apoio: não substitui o exercício nem o tratamento médico.",
    beneficios: ["apoio ao alívio da dor persistente", "relaxamento e redução da tensão", "apoio ao sono e ao estresse (sem referência conferida pelo sistema para este uso)"],
  },
  musculacao: {
    profissional: "Profissional de educação física (musculação)",
    atuacao: "avalia, planeja e acompanha o treino de força, ensinando a técnica e ajustando o treino ao longo do tempo. Quem define o tipo de exercício, as cargas, a frequência e a progressão é o profissional.",
    beneficios: ["ganhar força e massa muscular", "melhorar a composição corporal e a saúde dos ossos", "facilitar as tarefas do dia a dia e a autonomia", "contribuir para o humor, a disposição e o sono"],
  },
  pilates: {
    profissional: "Instrutor(a) de Pilates",
    atuacao: "conduz exercícios de controle do corpo, respiração, mobilidade e estabilidade do tronco, em solo ou em aparelhos, com ajuste individual. Quem define os exercícios e a progressão é o instrutor.",
    beneficios: ["melhorar o controle do tronco e a mobilidade", "ganhar consciência corporal e postura", "dar continuidade à reabilitação depois da fisioterapia", "apoio em dor lombar e cervical"],
  },
  rpg: { profissional: "Fisioterapeuta (RPG)", atuacao: "Reeducação Postural Global, técnica da fisioterapia (serviço antigo, hoje dentro da fisioterapia).", beneficios: ["postura e alongamento global"] },
  massoterapia: { profissional: "Massoterapeuta", atuacao: "massagem para relaxamento e alívio da tensão (serviço antigo, hoje não sugerido).", beneficios: ["relaxamento e alívio da tensão"] },
};

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
  areas?: AreaFisio[]; // só na fisioterapia: áreas indicadas para este quadro
  beneficios?: string[]; // em que este serviço ajuda no quadro desta pessoa
};

// Por onde começar: "agora" quando a primeira etapa é nas primeiras semanas (30 dias); senão entra depois.
const ORDEM_HORIZONTE: Horizonte[] = ["30", "60", "90", "180", "365"];
export function inicioDoServico(s: Pick<ServicoPlano, "etapas">): { quando: "agora" | "depois"; horizonte: Horizonte | null } {
  const e = [...s.etapas].filter((x) => x.texto.trim() !== "" && !x.semInicio).sort((a, b) => ORDEM_HORIZONTE.indexOf(a.horizonte) - ORDEM_HORIZONTE.indexOf(b.horizonte))[0];
  if (!e) return { quando: "depois", horizonte: null };
  return { quando: e.horizonte === "30" ? "agora" : "depois", horizonte: e.horizonte };
}

// Nome para relatórios e resumos: "Fisioterapia (ortopédica; coluna e postura)".
export function rotuloServico(s: Pick<ServicoPlano, "servico" | "areas">): string {
  const base = NOME_SERVICO[s.servico].split(" (")[0];
  const areas = (s.areas ?? []).map((a) => a.nome.split(" (")[0].split(":")[0].toLowerCase());
  return areas.length > 0 ? `${base} (${areas.join("; ")})` : base;
}

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
  NOETEL_2024: { rotulo: "Noetel et al., BMJ 2024 - exercício para depressão (revisão sistemática com meta-análise em rede)", url: PUBMED("38355154") },
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

// O que cada área da fisioterapia faz e em que ajuda (campo de atuação, não promessa de resultado).
const ATUACAO_AREA: Record<string, { nome: string; atuacao: string; beneficio: string }> = {
  ortopedica: {
    nome: "Ortopédica e musculoesquelética",
    atuacao: "dor e lesões de músculos, tendões e articulações, artrose e pós-cirurgia ortopédica: avaliação do movimento, exercício terapêutico, terapia manual e orientação",
    beneficio: "reduzir a dor e a inflamação e recuperar movimento e função",
  },
  coluna_postura: {
    nome: "Coluna e postura (inclui RPG)",
    atuacao: "dor de coluna e alterações posturais: reeducação postural (por exemplo, RPG), controle do tronco, mobilidade e orientação",
    beneficio: "aliviar a dor de coluna e reeducar a postura e o controle do tronco",
  },
  quedas: {
    nome: "Geriátrica: equilíbrio, marcha e prevenção de quedas",
    atuacao: "equilíbrio, marcha, força de pernas e segurança nas tarefas do dia a dia, para reduzir o risco de queda",
    beneficio: "treinar equilíbrio e marcha e reduzir o risco de queda",
  },
  neurofuncional: {
    nome: "Neurofuncional",
    atuacao: "movimento, equilíbrio e coordenação quando há condição do sistema nervoso (por exemplo, AVC, doença de Parkinson ou neuropatia) ou tontura",
    beneficio: "recuperar controle de movimento, equilíbrio e independência",
  },
  cardiorrespiratoria: {
    nome: "Cardiorrespiratória",
    atuacao: "reabilitação e condicionamento em condições do coração ou do pulmão (por exemplo, asma, DPOC ou após evento cardíaco), com segurança e liberação médica",
    beneficio: "melhorar o fôlego e a tolerância ao esforço com acompanhamento seguro",
  },
  pelvica: {
    nome: "Pélvica (assoalho pélvico)",
    atuacao: "assoalho pélvico: perda de urina, dor pélvica, gestação e pós-parto",
    beneficio: "cuidar do assoalho pélvico e dos sintomas urinários ou de dor pélvica",
  },
};

export function sugerirServicos(perfil: PerfilIntegrado, paciente: PacienteRow): ServicoPlano[] {
  const s: Sinais = extrairSinais(perfil, paciente);
  const saida: ServicoPlano[] = [];
  const add = (
    servico: ServicoId,
    prioridade: PrioridadeServico,
    motivos: string[],
    etapas: EtapaServico[],
    extra: { evidencia?: Evidencia; ressalva?: string; areas?: AreaFisio[]; beneficios?: string[] } = {}
  ) =>
    saida.push({ id: gerarId(), servico, prioridade, motivos, etapas, evidencia: extra.evidencia, ressalva: extra.ressalva, areas: extra.areas, beneficios: extra.beneficios, regra: `servico|${servico}`, status: "sugerido" });

  // Texto das condições e da queixa (só o que está escrito: o sistema não diagnostica; o avaliador confirma).
  const textoCond = normalizar([s.a.historico_saude.doencas, s.a.historico_saude.outras_condicoes, s.a.motivo.queixa_principal, s.a.motivo.motivo_procura].filter(Boolean).join(" "));
  const tontura = s.a.prontidao.parq.dizziness === true;
  const cardioParq = s.a.prontidao.parq.heart_condition === true;
  const humorSinalizado = s.a.saude_mental.sinalizacao === "sim";
  const bem = s.dom("bem_estar")?.classificacao;
  const humorAlterado = bem === "prioridade" || bem === "atencao" || humorSinalizado;

  // Fase inicial "delicada": dor forte, inflamação ou sinal de alerta -> a musculação começa depois da fisioterapia.
  const faseInicial = s.temDor && ((s.maxNrs ?? 0) >= 7 || s.inflamacao || s.bandeiras);
  const aguardarMedico = s.bandeiras || s.liberacao.nivel === "liberacao_necessaria";
  const avisoMedico = aguardarMedico ? "Há sinal de alerta: inicie os serviços com exercício só depois da avaliação e liberação médica." : undefined;
  const prefixo = (t: string) => (aguardarMedico ? `Após liberação médica: ${t}` : t);

  // 1) Fisioterapia e as suas áreas
  const areas: AreaFisio[] = [];
  const addArea = (chave: keyof typeof ATUACAO_AREA, nome: string | null, motivos: string[]) => {
    if (motivos.length === 0) return;
    const d = ATUACAO_AREA[chave];
    areas.push({ chave, nome: nome ?? d.nome, atuacao: d.atuacao, motivos });
  };
  const motOrt: string[] = [];
  if (s.temDor && s.mskQualquer) motOrt.push(`dor em ${lista(s.regioes)}${s.maxNrs !== null ? ` (até ${s.maxNrs}/10)` : ""}`);
  if (s.inflamacao) motOrt.push("relato de inflamação ou inchaço na anamnese (o sistema só identifica o que está escrito: confirme na avaliação)");
  if (s.lesoes) motOrt.push("histórico de lesão ou cirurgia");
  if (s.osteoParq) motOrt.push("problema ósseo ou articular que pode piorar com o esforço (PAR-Q+)");
  addArea("ortopedica", null, motOrt);
  const motCol: string[] = [];
  if ((s.lombar.length > 0 || s.cervical.length > 0) && (s.dorCronica || s.dom("mobilidade")?.classificacao === "atencao" || s.coreAlterado)) {
    motCol.push(`dor na coluna (${lista([...s.lombar, ...s.cervical])})${s.dorCronica ? ", persistente" : ""}`);
    if (s.dom("mobilidade")?.classificacao === "atencao") motCol.push("mobilidade com assimetria ou restrição nos testes");
    if (s.coreAlterado) motCol.push("alteração observada na estabilidade do core");
  }
  addArea("coluna_postura", null, motCol);
  const motQ: string[] = [];
  if (s.quedas) motQ.push("queda nos últimos 12 meses");
  if (s.dom("equilibrio")?.classificacao === "prioridade") motQ.push("equilíbrio com prioridade nos testes");
  else if (s.dom("equilibrio")?.classificacao === "atencao" && (s.idade ?? 0) >= 60) motQ.push("equilíbrio com atenção nos testes");
  addArea("quedas", (s.idade ?? 0) >= 60 ? null : "Equilíbrio e prevenção de quedas", motQ);
  const motNeuro: string[] = [];
  if (/\bavc\b|derrame|parkinson|esclerose|neuropatia|neurolog|alzheimer|paralisia|labirintite|vertigem/.test(textoCond)) motNeuro.push("condição do sistema nervoso citada na anamnese (confirme na avaliação)");
  if (tontura) motNeuro.push("tontura relatada no PAR-Q+");
  addArea("neurofuncional", null, motNeuro);
  const motCardio: string[] = [];
  if (cardioParq) motCardio.push("condição do coração relatada no PAR-Q+");
  if (/\basma\b|dpoc|bronquite|enfisema|insuficiencia cardiaca|infarto|cardiopatia|marcapasso/.test(textoCond)) motCardio.push("condição do coração ou do pulmão citada na anamnese (confirme na avaliação)");
  addArea("cardiorrespiratoria", null, motCardio);
  const motPelv: string[] = [];
  if (/incontinencia|perda de urina|escape de urina|bexiga|assoalho pelvico|prolapso|dor pelvica|gestante|gravidez|pos-parto|pos parto/.test(textoCond)) motPelv.push("queixa pélvica, urinária ou de gestação/pós-parto citada na anamnese (confirme na avaliação)");
  addArea("pelvica", null, motPelv);

  const motFisio: string[] = [];
  if (s.temDor && ((s.maxNrs ?? 0) >= 4 || !s.dorCronica || s.inflamacao)) motFisio.push(`dor ${s.regioes.length > 0 ? `em ${lista(s.regioes)}` : "relatada"}${s.maxNrs !== null ? ` (até ${s.maxNrs}/10)` : ""}`);
  if (s.inflamacao) motFisio.push("relato de inflamação ou inchaço na anamnese (o sistema só identifica o que está escrito: confirme na avaliação)");
  if (s.lesoes) motFisio.push("histórico de lesão ou cirurgia");
  if (s.osteoParq) motFisio.push("problema ósseo ou articular que pode piorar com o esforço (PAR-Q+)");
  if (s.dom("mobilidade")?.classificacao === "atencao") motFisio.push("mobilidade com assimetria ou restrição nos testes");
  if (s.dom("equilibrio")?.classificacao === "prioridade") motFisio.push("risco de queda");
  const motivosFisio = motFisio.length > 0 ? motFisio : areas.flatMap((a) => a.motivos);
  if (motFisio.length > 0 || areas.length > 0) {
    const indicado = (s.temDor && ((s.maxNrs ?? 0) >= 4 || s.inflamacao)) || s.dom("equilibrio")?.classificacao === "prioridade" || s.lesoes || s.quedas || areas.some((a) => a.chave === "neurofuncional");
    const rpgLombar = areas.some((a) => a.chave === "coluna_postura") && s.lombar.length > 0 && s.dorCronica;
    const referencias = s.joelho.length > 0 ? [REF.FRANSEN_2015, REF.NICE_NG59] : [REF.NICE_NG59, REF.FRANSEN_2015];
    if (rpgLombar) referencias.push(REF.GONZALEZ_2021);
    const quedasIdoso = areas.some((a) => a.chave === "quedas") && (s.idade ?? 0) >= 60;
    if (quedasIdoso) referencias.push(REF.OMS_2020);
    add(
      "fisioterapia",
      indicado ? "indicado" : "opcional",
      motivosFisio,
      [
        { horizonte: "30", texto: prefixo("Iniciar nas primeiras semanas: avaliação, controle da dor e da inflamação, e exercícios terapêuticos (frequência definida pelo fisioterapeuta).") },
        { horizonte: "60", texto: "Reavaliar a continuidade: manter, espaçar as sessões ou dar alta, conforme a evolução da dor e da função." },
        { horizonte: "90", texto: "Alta ou manutenção, com transição para o treino de força e o Pilates." },
      ],
      {
        evidencia: {
          resumo:
            (s.joelho.length > 0
              ? "Na artrose de joelho, o exercício terapêutico reduz a dor (evidência de alta qualidade) e melhora a função (qualidade moderada); programas individuais tendem a render mais que os em grupo ou em casa. Para dor lombar, a diretriz NICE NG59 recomenda educação e exercício como base."
              : "Exercício terapêutico acompanhado é a base do cuidado de dor musculoesquelética persistente (diretriz NICE NG59 para dor lombar; na artrose de joelho, revisão Cochrane com evidência de alta qualidade para dor).") +
            (rpgLombar ? " Na dor lombar crônica, uma meta-análise de 7 ensaios (334 pacientes) encontrou menos dor e melhor função com a Reeducação Postural Global (RPG) do que com outros programas de exercício (evidência baixa a moderada)." : "") +
            (quedasIdoso ? " Para pessoas com 60 anos ou mais, a OMS recomenda atividade física com equilíbrio e força em 3 ou mais dias por semana para prevenir quedas." : ""),
          certeza: "Alta para exercício na dor de joelho (Cochrane); diretriz para dor lombar.",
          ressalva: "A evidência é do exercício terapêutico: recursos passivos isolados têm menos suporte. O sistema não identifica o diagnóstico: o fisioterapeuta define a conduta.",
          referencias,
        },
        ressalva: avisoMedico ?? (areas.some((a) => a.chave === "cardiorrespiratoria") ? "Condição do coração ou do pulmão: a fisioterapia cardiorrespiratória começa com liberação médica." : undefined),
        areas,
        beneficios: Array.from(new Set([...areas.map((a) => ATUACAO_AREA[a.chave].beneficio), ...(areas.length === 0 ? ["reduzir a dor e recuperar movimento e função"] : [])])),
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
  if (bem === "prioridade") {
    motPsi.push("triagem de humor/ansiedade em faixa sugestiva de quadro importante (triagem, não diagnóstico)");
    prioridadePsi = "indicado";
  } else if (bem === "atencao") {
    motPsi.push("triagem de bem-estar emocional com atenção (oferecer e acolher)");
  }
  if (humorSinalizado && bem !== "prioridade" && bem !== "atencao") motPsi.push("relata que estresse, ansiedade ou humor atrapalham bastante o dia a dia");
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
    const benPsi: string[] = [];
    if (s.ideacao || bem === "prioridade" || bem === "atencao" || humorSinalizado) benPsi.push("apoio emocional e acompanhamento para humor, ansiedade e estresse");
    if (s.psicossocialDor || (s.temDor && s.dorCronica)) benPsi.push("estratégias para lidar com a dor persistente e com o medo de se mexer");
    if (s.dom("sono")?.classificacao === "prioridade" || (typeof s.estresse === "number" && s.estresse >= 5)) benPsi.push("apoio ao sono e ao manejo do estresse");
    benPsi.push("sustentar a motivação e a regularidade nos hábitos e no treino");
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
        beneficios: benPsi,
      }
    );
  }

  // 3) Musculação (treino de força supervisionado). O sistema indica o serviço; o profissional define o treino.
  const motMusc: string[] = [];
  const forca = s.dom("forca")?.classificacao;
  if (forca === "prioridade" || forca === "atencao") motMusc.push("força abaixo da referência nos testes");
  if (s.sarcopenia.classificacao === "sarcopenia_provavel" || s.sarcopenia.classificacao === "dinapenia_provavel") motMusc.push("triagem sugere perda de força ou de massa muscular");
  if (s.precisa("composicao_corporal")) motMusc.push("composição corporal com atenção (preservar massa magra)");
  if (s.sedentario) motMusc.push("sedentarismo (a OMS recomenda força em 2 ou mais dias por semana)");
  if (humorAlterado) motMusc.push("humor ou ansiedade na triagem: o treino de força é uma das formas de exercício associadas a menos sintomas depressivos, como apoio ao cuidado psicológico (não o substitui)");
  const idoso = s.idade !== null && s.idade >= 60;
  if (motMusc.length > 0 || idoso) {
    if (motMusc.length === 0) motMusc.push("base de todo plano: força em 2 ou mais dias por semana (OMS)");
    const indicado = forca === "prioridade" || forca === "atencao" || (s.sarcopenia.classificacao !== "sem_sinais" && s.sarcopenia.classificacao !== "dados_insuficientes");
    const etapas: EtapaServico[] = faseInicial
      ? [
          { horizonte: "30", texto: "Neste início, o fortalecimento acontece dentro da fisioterapia (exercícios terapêuticos); a musculação ainda não.", semInicio: true },
          { horizonte: "90", texto: prefixo("Iniciar a musculação supervisionada, com a liberação do fisioterapeuta e a dor sob controle; o profissional define o treino.") },
          { horizonte: "365", texto: "Manter o treino de força com acompanhamento e reavaliar a força a cada 90 dias." },
        ]
      : [
          { horizonte: "30", texto: prefixo("Iniciar a musculação supervisionada; o profissional define o treino, as cargas e a progressão.") },
          { horizonte: "60", texto: "Reavaliar o treino com o profissional conforme a técnica e a resposta." },
          { horizonte: "90", texto: "Reavaliar a força e renovar o treino." },
          { horizonte: "365", texto: "Manter o treino de força com acompanhamento." },
        ];
    const benMusc = ["ganhar força e massa muscular", "facilitar as tarefas do dia a dia e a autonomia"];
    if (s.precisa("composicao_corporal")) benMusc.push("melhorar a composição corporal (preservar e ganhar massa magra)");
    if (humorAlterado) benMusc.push("contribuir para o humor e a disposição, junto do acompanhamento psicológico");
    if (idoso) benMusc.push("proteger ossos e músculos com o envelhecimento");
    add("musculacao", indicado ? "indicado" : "opcional", motMusc, etapas, {
      evidencia: {
        resumo:
          "A OMS recomenda atividade de fortalecimento dos grandes grupos musculares em 2 ou mais dias por semana. Em pessoas com 60 anos ou mais, exercício com ou sem supervisão foi seguro; a supervisão pôde somar um ganho extra, principalmente na força do joelho (34 ensaios)." +
          (humorAlterado ? " Em pessoas com depressão, o treino de força foi uma das modalidades com efeito moderado sobre os sintomas depressivos (revisão com 218 estudos), mas a confiança nesse resultado é baixa ou muito baixa." : ""),
        certeza: "Diretriz (OMS 2020); meta-análise de ensaios (supervisão).",
        ressalva: "A vantagem da supervisão vem de estudo em maiores de 60 anos e é pequena e não robusta em todos os desfechos." + (humorAlterado ? " O dado sobre depressão é de pessoas com diagnóstico de depressão; aqui há só uma triagem, e o treino é apoio, não tratamento." : ""),
        referencias: humorAlterado ? [REF.OMS_2020, REF.GOMEZ_2024, REF.NOETEL_2024] : [REF.OMS_2020, REF.GOMEZ_2024],
      },
      ressalva: avisoMedico,
      beneficios: benMusc,
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
            { horizonte: "60", texto: prefixo("Acrescentar o Pilates junto da reavaliação da continuidade da fisioterapia; o instrutor define os exercícios e a frequência.") },
            { horizonte: "90", texto: "Avaliar a continuidade: o Pilates pode seguir como manutenção do controle motor e da mobilidade." },
          ]
        : [
            { horizonte: "30", texto: prefixo("Iniciar o Pilates, com foco em controle do tronco e mobilidade; o instrutor define os exercícios e a frequência.") },
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
        beneficios: ["melhorar o controle do tronco e a mobilidade", "ganhar consciência corporal e postura", ...(s.temDor && motFisio.length > 0 ? ["dar continuidade à reabilitação depois da fisioterapia"] : [])],
      }
    );
  }

  // 5) Medicina Tradicional Chinesa (acupuntura): apoio opcional para dor persistente ou intensa, tensão, estresse e sono.
  const motMtc: string[] = [];
  const dorMtc = s.temDor && s.mskQualquer && (s.dorCronica || (s.maxNrs ?? 0) >= 7);
  if (dorMtc) motMtc.push(`${s.dorCronica ? "dor crônica" : "dor intensa"} musculoesquelética (${lista(s.regioes)}${s.maxNrs !== null ? `, até ${s.maxNrs}/10` : ""})`);
  if (s.temDor && s.caracteristicas.some((c) => ["Peso", "Aperto"].includes(c))) motMtc.push("dor descrita como peso ou aperto (possível tensão muscular)");
  if (typeof s.estresse === "number" && s.estresse >= 5) motMtc.push(`estresse percebido ${s.estresse}/10`);
  if (s.dom("sono")?.classificacao === "prioridade") motMtc.push("sono de má qualidade importante");
  if (humorAlterado) motMtc.push("humor ou ansiedade na triagem (apoio ao relaxamento, junto do acompanhamento psicológico)");
  if (motMtc.length > 0) {
    const benMtc: string[] = [];
    if (dorMtc) benMtc.push("apoio ao alívio da dor persistente");
    if (motMtc.length > (dorMtc ? 1 : 0) || !dorMtc) benMtc.push("relaxamento e redução da tensão", "apoio ao sono e ao estresse");
    add(
      "mtc",
      "opcional",
      motMtc,
      [
        { horizonte: "30", texto: prefixo("Ciclo inicial de acupuntura como apoio, se o paciente quiser (número de sessões definido pelo profissional).") },
        { horizonte: "60", texto: "Avaliar a resposta (dor 0 a 10, sono e estresse) e decidir se continua: manter só se houver benefício que o paciente perceba." },
      ],
      {
        evidencia: dorMtc
          ? {
              resumo:
                "Uma revisão de revisões sistemáticas de 2017 a 2022 classificou a acupuntura como de efeito positivo para dor crônica, dor lombar e artrose de joelho. As diretrizes divergem: por exemplo, a NICE (NG59, 2016) não recomenda acupuntura para dor lombar.",
              certeza: "Divergente: revisão de revisões positiva, com qualidade variável dos ensaios; diretriz NICE contrária para dor lombar.",
              ressalva:
                "Os autores da revisão são ligados a uma sociedade de medicina chinesa e apontam falta de ensaios de alta qualidade em vários casos. É um apoio opcional, nunca substitui o exercício, e a decisão é do paciente." + (s.dorCronica ? "" : " A revisão conferida é sobre dor crônica; para dor intensa recente o sistema não tem referência conferida."),
              referencias: [REF.HEMPEN_2025, REF.NICE_NG59],
            }
          : undefined,
        ressalva: dorMtc ? avisoMedico : "O sistema não tem referência conferida para a acupuntura em estresse, sono ou humor: sugerida só como opção do paciente, nunca como tratamento principal." + (avisoMedico ? ` ${avisoMedico}` : ""),
        beneficios: benMtc,
      }
    );
  }

  // Plano provisório (poucos dados, confiança não alta): por decisão do profissional (31/10/2026), entram ao menos a
  // fisioterapia, a medicina chinesa e a musculação consciente como PONTO DE PARTIDA, sempre opcionais e ditas provisórias,
  // porque a anamnese e a dor já dão base para começar. Quando já há achado que as justifique, valem as regras acima (com a
  // evidência e a prioridade de cada uma). Psicologia, Pilates e as demais continuam só com achado. O Recovery ainda não
  // faz parte dos serviços. A supervisão da Nina continua listando o que falta coletar.
  if (perfil.confianca !== "alta") {
    const tem = (k: ServicoId) => saida.some((x) => x.servico === k);
    const dorTxt = s.temDor ? `dor ${s.regioes.length > 0 ? `em ${lista(s.regioes)}` : "relatada"}${s.maxNrs !== null ? ` (até ${s.maxNrs}/10)` : ""}` : null;
    const provisoria = "Sugestão provisória, sem achado específico além da anamnese: ao completar a avaliação o sistema pode confirmar, mudar a prioridade ou tirar esta indicação.";
    if (!tem("fisioterapia")) {
      add(
        "fisioterapia",
        "opcional",
        [dorTxt ? `${dorTxt}: ponto de partida do plano provisório` : "ponto de partida do plano provisório: ainda há poucos dados, e uma avaliação inicial ajuda a definir a conduta"],
        [
          { horizonte: "30", texto: prefixo("Avaliação inicial com o fisioterapeuta, que define se há necessidade de tratamento e em qual área.") },
          { horizonte: "60", texto: "Reavaliar com os dados completos: manter, indicar uma área específica ou dar alta." },
        ],
        {
          ressalva: [provisoria, avisoMedico].filter(Boolean).join(" "),
          areas: dorTxt && s.mskQualquer ? [{ chave: "ortopedica", nome: ATUACAO_AREA.ortopedica.nome, atuacao: ATUACAO_AREA.ortopedica.atuacao, motivos: [dorTxt] }] : [],
          beneficios: ["avaliar o movimento e a dor", "orientar se há necessidade de tratamento e em qual área da fisioterapia"],
        }
      );
    }
    if (!tem("mtc")) {
      add(
        "mtc",
        "opcional",
        [dorTxt ? `${dorTxt}: apoio opcional no plano provisório` : "ponto de partida do plano provisório: apoio opcional ao alívio de dor, tensão, estresse e sono, se o paciente quiser"],
        [
          { horizonte: "30", texto: prefixo("Avaliação inicial pela medicina tradicional chinesa, se o paciente quiser; o profissional define a conduta e o número de sessões.") },
          { horizonte: "60", texto: "Avaliar a resposta e decidir se continua: manter só se houver benefício que o paciente perceba." },
        ],
        {
          ressalva: `${provisoria} O sistema não tem referência conferida para a acupuntura sem dor crônica: é apoio opcional, nunca tratamento principal.${avisoMedico ? ` ${avisoMedico}` : ""}`,
          beneficios: ["apoio ao alívio da dor e da tensão", "relaxamento, estresse e sono (sem referência conferida pelo sistema)"],
        }
      );
    }
    if (!tem("musculacao")) {
      add(
        "musculacao",
        "opcional",
        ["ponto de partida do plano provisório: a base de todo plano é a força em 2 ou mais dias por semana (OMS); ainda há poucos dados para indicar com mais precisão"],
        [
          { horizonte: "30", texto: prefixo("Iniciar a musculação consciente supervisionada como ponto de partida; o profissional define o treino, as cargas e a progressão.") },
          { horizonte: "90", texto: "Reavaliar a força e renovar o treino; rever os serviços quando a avaliação estiver completa." },
        ],
        {
          evidencia: {
            resumo: "A OMS recomenda atividade de fortalecimento dos grandes grupos musculares em 2 ou mais dias por semana para todos os adultos.",
            certeza: "Diretriz (OMS 2020).",
            ressalva: provisoria,
            referencias: [REF.OMS_2020],
          },
          ressalva: avisoMedico,
          beneficios: ["ganhar força e massa muscular", "facilitar as tarefas do dia a dia e a autonomia"],
        }
      );
    }
  }
  // RPG e massoterapia não são mais sugeridos como serviços à parte (30/10/2026): o RPG é área da fisioterapia (coluna e
  // postura) e a massoterapia não é oferecida pela clínica.

  const rank = (x: ServicoPlano) => (x.prioridade === "indicado" ? 0 : 100) + (inicioDoServico(x).quando === "agora" ? 0 : 50) + ORDEM_SERVICOS.indexOf(x.servico);
  return saida.sort((a, b) => rank(a) - rank(b));
}