// Os agentes do sistema: nome, área de especialidade e as referências científicas
// que sustentam as regras de cada um.
//
// INTEGRIDADE (vale para todos):
// - "Dr./Dra." é o tratamento da persona de cada agente na ferramenta. Os agentes são
//   ASSISTENTES DE IA, não médicos nem profissionais registrados: por isso o sistema
//   sempre identifica "assistente de IA" nos textos que saem da ferramenta, e quem
//   assina e responde pela avaliação é o profissional (ver lib/marca.ts).
// - Só entra aqui referência cuja existência foi conferida no PubMed (PMID). Cada
//   referência diz exatamente o que apoia; nada é citado por "ouvir dizer".
// - O que a literatura não confirma fica marcado como "prática do sistema, sem
//   validação publicada" ou "[confirmar]" nos documentos.

export type AgenteId = "nina" | "sofia" | "marco" | "paula" | "rita" | "caio" | "iris" | "theo" | "clara";

export type Agente = {
  id: AgenteId;
  numero: string;
  nome: string;
  tratamento: "Dr." | "Dra.";
  especialidade: string;
  documento: string;
};

export const AGENTES_SISTEMA: Record<AgenteId, Agente> = {
  nina: { id: "nina", numero: "1", nome: "Nina", tratamento: "Dra.", especialidade: "Coordenação clínica e triagem de prontidão", documento: "00-Arquitetura-Geral-dos-Agentes.md" },
  sofia: { id: "sofia", numero: "2", nome: "Sofia", tratamento: "Dra.", especialidade: "Anamnese e entrevista clínica em saúde", documento: "01-Agente2-Anamnese-e-Questionarios.md" },
  marco: { id: "marco", numero: "3", nome: "Marco", tratamento: "Dr.", especialidade: "Avaliação física, antropometria e composição corporal", documento: "02-Agente3-Fisica-e-Antropometrica.md" },
  // Nome provisório: o Agente 4 ainda não tinha nome. Para trocar, basta mudar aqui.
  paula: { id: "paula", numero: "4", nome: "Paula", tratamento: "Dra.", especialidade: "Postura e biomecânica", documento: "03-Agente4-Postural-e-Biomecanica.md" },
  rita: { id: "rita", numero: "5", nome: "Rita", tratamento: "Dra.", especialidade: "Avaliação funcional (força, equilíbrio, marcha)", documento: "04-Agente5-Avaliacao-Funcional.md" },
  iris: { id: "iris", numero: "6", nome: "Íris", tratamento: "Dra.", especialidade: "Integração e interpretação clínica", documento: "05-Agente6-Integracao-e-Interpretacao.md" },
  theo: { id: "theo", numero: "7", nome: "Theo", tratamento: "Dr.", especialidade: "Prescrição e planejamento do exercício", documento: "06-Agente7-Plano-de-Intervencao.md" },
  clara: { id: "clara", numero: "8", nome: "Clara", tratamento: "Dra.", especialidade: "Comunicação em saúde, relatório e devolutiva", documento: "07-Agente8-Relatorio-e-Devolutiva.md" },
  caio: { id: "caio", numero: "9", nome: "Caio", tratamento: "Dr.", especialidade: "Fisiologia do exercício e aptidão cardiorrespiratória", documento: "(rodada de 07/10/2026 - ver 10-Revisao-Cientifica-por-Agente.md)" },
};

export function nomeComTitulo(id: AgenteId): string {
  const a = AGENTES_SISTEMA[id];
  return `${a.tratamento} ${a.nome}`;
}

// ---------------------------------------------------------------------------
// Referências (todas conferidas no PubMed). Citação no formato
// Autor, Revista Ano;Volume:Primeira página.
// ---------------------------------------------------------------------------
export type Referencia = { id: string; curta: string; citacao: string; pmid: string; apoia: string };

const R: Referencia[] = [
  { id: "ewgsop2", curta: "EWGSOP2 2019", citacao: "Cruz-Jentoft AJ, et al. Age Ageing 2019;48:16", pmid: "30312372", apoia: "consenso de sarcopenia: força como critério central e cortes de dinamometria, 5x sentar-e-levantar e velocidade de marcha" },
  { id: "fernandes2021", curta: "Fernandes 2021", citacao: "Fernandes SGG, et al. PeerJ 2021;9:e12038", pmid: "34527442", apoia: "cortes de dinamometria de idosos brasileiros (25,3 kgf homens, 16 kgf mulheres; percentil 20 de uma amostra do Nordeste, 1.290 pessoas, média de 69 anos)" },
  { id: "rikli2013", curta: "Rikli & Jones 2013", citacao: "Rikli RE, Jones CJ. Gerontologist 2013;53:255", pmid: "22613940", apoia: "Senior Fitness Test: este artigo traz os padrões criteriais de independência, que o sistema ainda NÃO usa; os limites aplicados hoje (percentil 25 do Chair Stand e do Arm Curl) vêm das tabelas normativas do manual do teste, conferidas em fontes secundárias, sem leitura do manual original" },
  { id: "barry2014", curta: "Barry 2014", citacao: "Barry E, et al. BMC Geriatr 2014;14:14", pmid: "24484314", apoia: "o TUG (corte 13,5 s) tem sensibilidade baixa (0,31) e especificidade 0,74: confirma risco melhor do que descarta e não deve ser usado isolado" },
  { id: "podsiadlo1991", curta: "Podsiadlo 1991", citacao: "Podsiadlo D, Richardson S. J Am Geriatr Soc 1991;39:142", pmid: "1991946", apoia: "descrição original do Timed Up and Go" },
  { id: "friend2015", curta: "FRIEND 2015", citacao: "Kaminsky LA, et al. Mayo Clin Proc 2015;90:1515", pmid: "26455884", apoia: "percentis de VO2máx por idade e sexo (esteira, registro norte-americano) usados na classificação" },
  { id: "mandsager2018", curta: "Mandsager 2018", citacao: "Mandsager K, et al. JAMA Netw Open 2018;1:e183605", pmid: "30646252", apoia: "maior aptidão cardiorrespiratória associa-se a menor mortalidade a longo prazo, sem limite superior de benefício (estudo observacional)" },
  { id: "ross2016", curta: "AHA 2016", citacao: "Ross R, et al. Circulation 2016;134:e653", pmid: "27881567", apoia: "posição da AHA: aptidão cardiorrespiratória como sinal vital clínico" },
  { id: "tanaka2001", curta: "Tanaka 2001", citacao: "Tanaka H, et al. J Am Coll Cardiol 2001;37:153", pmid: "11153730", apoia: "FC máxima prevista = 208 − 0,7 × idade (erro individual de cerca de ±11 bpm)" },
  { id: "rubino2025", curta: "Lancet Commission 2025", citacao: "Rubino F, et al. Lancet Diabetes Endocrinol 2025;13:221", pmid: "39824205", apoia: "o IMC sozinho não basta: o excesso de adiposidade deve ser confirmado por medida direta ou por ao menos um critério antropométrico (cintura, cintura/quadril ou cintura/estatura)" },
  { id: "rani2023", curta: "Rani 2023", citacao: "Rani B, et al. Indian J Orthop 2023;57:371", pmid: "36825268", apoia: "dor cervical: diferença média de cerca de 3° no ângulo craniovertebral entre quem tem e quem não tem dor, e correlações de pequenas a moderadas com a dor; estudos observacionais, que não provam causa" },
  { id: "psqi", curta: "Buysse 1989", citacao: "Buysse DJ, et al. Psychiatry Res 1989;28:193", pmid: "2748771", apoia: "instrumento PSQI (índice de qualidade do sono de Pittsburgh)" },
  { id: "phq9", curta: "Kroenke 2001", citacao: "Kroenke K, et al. J Gen Intern Med 2001;16:606", pmid: "11556941", apoia: "instrumento PHQ-9 (gravidade de sintomas depressivos)" },
  { id: "gad7", curta: "Spitzer 2006", citacao: "Spitzer RL, et al. Arch Intern Med 2006;166:1092", pmid: "16717171", apoia: "instrumento GAD-7 (ansiedade generalizada)" },
  { id: "pss", curta: "Cohen 1983", citacao: "Cohen S, et al. J Health Soc Behav 1983;24:385", pmid: "6668417", apoia: "escala de estresse percebido (PSS)" },
  { id: "acsm2015", curta: "ACSM 2015", citacao: "Riebe D, et al. Med Sci Sports Exerc 2015;47:2473", pmid: "26473759", apoia: "triagem de saúde antes do exercício: nível atual de atividade, sinais/sintomas ou doença conhecida e intensidade pretendida" },
  { id: "oms2020", curta: "OMS 2020", citacao: "Bull FC, et al. Br J Sports Med 2020;54:1451", pmid: "33239350", apoia: "diretrizes da OMS: 150 a 300 min/semana de atividade moderada e fortalecimento muscular em 2 ou mais dias" },
  { id: "richter2020", curta: "Richter 2020", citacao: "Richter R, et al. PLoS One 2020;15:e0236751", pmid: "32790675", apoia: "comunicação de risco ao paciente é complexa; o equilíbrio entre informar e não gerar ansiedade (estudo qualitativo com 15 clínicos)" },
];

const POR_ID = new Map(R.map((r) => [r.id, r]));

const REFS_POR_AGENTE: Record<Exclude<AgenteId, "iris">, string[]> = {
  nina: ["acsm2015"],
  sofia: ["psqi", "phq9", "gad7", "pss", "acsm2015"],
  marco: ["rubino2025"],
  paula: ["rani2023"],
  rita: ["ewgsop2", "rikli2013", "fernandes2021", "barry2014", "podsiadlo1991"],
  caio: ["friend2015", "mandsager2018", "ross2016", "tanaka2001"],
  theo: ["oms2020", "acsm2015"],
  clara: ["richter2020"],
};

// A Íris integra todas as áreas: usa as referências dos agentes que alimentam o perfil.
export function referenciasDoAgente(id: AgenteId): Referencia[] {
  const ids = id === "iris" ? Array.from(new Set(["sofia", "marco", "paula", "rita", "caio"].flatMap((a) => REFS_POR_AGENTE[a as Exclude<AgenteId, "iris">]))) : REFS_POR_AGENTE[id];
  return ids.map((i) => POR_ID.get(i)!).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Revisão da literatura
// ---------------------------------------------------------------------------
export const REVISAO_LITERATURA = {
  revisaoPorAgente: "2026-10-02", // documento 10-Revisao-Cientifica-por-Agente.md
  referenciasConferidasNoPubMed: "2026-10-08",
  validadeDias: 180, // depois disso o sistema avisa que é hora de pedir nova revisão à Nina
};

export function diasDesdeRevisao(hoje: Date = new Date()): number {
  const t = new Date(`${REVISAO_LITERATURA.revisaoPorAgente}T00:00:00`).getTime();
  return Math.floor((hoje.getTime() - t) / 86400000);
}

export function revisaoVencida(hoje: Date = new Date()): boolean {
  return diasDesdeRevisao(hoje) > REVISAO_LITERATURA.validadeDias;
}

function dataBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function textoRevisao(): string {
  return `Literatura revisada por agente em ${dataBR(REVISAO_LITERATURA.revisaoPorAgente)}; referências conferidas no PubMed em ${dataBR(REVISAO_LITERATURA.referenciasConferidasNoPubMed)}.`;
}

// Bloco "base científica" dos pareceres.
export function linhasBaseCientifica(id: AgenteId, estilo: "sucinto" | "explicativo"): string[] {
  const refs = referenciasDoAgente(id);
  if (refs.length === 0) return [];
  if (estilo === "sucinto") return [`Base científica: ${refs.map((r) => r.curta).join("; ")} (detalhes no parecer explicativo).`];
  return [
    "BASE CIENTÍFICA",
    ...refs.map((r) => `- ${r.citacao} (PMID ${r.pmid}): ${r.apoia}.`),
    `- ${textoRevisao()}`,
    "- Quando as fontes divergem ou a regra é prática do sistema, isso está dito no texto acima: confirme na fonte original antes de mudar uma conduta.",
  ];
}
