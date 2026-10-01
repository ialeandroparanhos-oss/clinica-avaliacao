// Agente 3 — Marco: composição corporal.
//
// Fórmulas de dobras cutâneas (Jackson & Pollock) e a tabela de faixa
// saudável de %G por idade/sexo (Gallagher et al., 2000) são as versões
// amplamente publicadas em livros-texto de fisiologia do exercício -
// confirme a versão validada oficial antes do uso clínico formal, mesmo
// padrão de nota usado para os instrumentos psicométricos deste projeto
// (ver lib/anamnese/questionnaires.ts).

export type SexoComp = "masculino" | "feminino" | "desconhecido";

export function sexoNormalizado(sexo?: string | null): SexoComp {
  const s = (sexo || "").trim().toLowerCase();
  if (s.startsWith("m")) return "masculino";
  if (s.startsWith("f")) return "feminino";
  return "desconhecido";
}

// ---------------------------------------------------------------------------
// Protocolos de dobras cutâneas
// ---------------------------------------------------------------------------
export type ProtocoloDobras = "jp3" | "jp7" | "faulkner4" | "outro";

export const SITIOS_JP3: Record<"masculino" | "feminino", { chave: string; rotulo: string }[]> = {
  masculino: [
    { chave: "dc_peitoral", rotulo: "Peitoral" },
    { chave: "dc_abdominal", rotulo: "Abdominal" },
    { chave: "dc_coxa", rotulo: "Coxa" },
  ],
  feminino: [
    { chave: "dc_triceps", rotulo: "Tríceps" },
    { chave: "dc_suprailiaca", rotulo: "Suprailíaca" },
    { chave: "dc_coxa", rotulo: "Coxa" },
  ],
};

export const SITIOS_JP7: { chave: string; rotulo: string }[] = [
  { chave: "dc_peitoral", rotulo: "Peitoral" },
  { chave: "dc_axilar_media", rotulo: "Axilar média" },
  { chave: "dc_triceps", rotulo: "Tríceps" },
  { chave: "dc_subescapular", rotulo: "Subescapular" },
  { chave: "dc_abdominal", rotulo: "Abdominal" },
  { chave: "dc_suprailiaca", rotulo: "Suprailíaca" },
  { chave: "dc_coxa", rotulo: "Coxa" },
];

// Faulkner (1968) - 4 dobras, equação unissex, não usa idade. Amplamente
// citado em livros-texto - mesma nota de confirmação no topo do arquivo.
export const SITIOS_FAULKNER: { chave: string; rotulo: string }[] = [
  { chave: "dc_triceps", rotulo: "Tríceps" },
  { chave: "dc_subescapular", rotulo: "Subescapular" },
  { chave: "dc_suprailiaca", rotulo: "Suprailíaca" },
  { chave: "dc_abdominal", rotulo: "Abdominal" },
];

// Todos os sítios de dobra cutânea coletáveis no formulário - superconjunto
// dos usados pelos protocolos acima, para permitir outros protocolos
// manuais (Guedes, Faulkner, Petroski etc.) sem recálculo automático.
export const TODOS_SITIOS_DOBRA: { chave: string; rotulo: string }[] = [
  { chave: "dc_triceps", rotulo: "Tríceps" },
  { chave: "dc_biceps", rotulo: "Bíceps" },
  { chave: "dc_subescapular", rotulo: "Subescapular" },
  { chave: "dc_suprailiaca", rotulo: "Suprailíaca" },
  { chave: "dc_abdominal", rotulo: "Abdominal" },
  { chave: "dc_peitoral", rotulo: "Peitoral (torácica)" },
  { chave: "dc_axilar_media", rotulo: "Axilar média" },
  { chave: "dc_coxa", rotulo: "Coxa" },
  { chave: "dc_panturrilha", rotulo: "Panturrilha medial" },
];

// Sugestão de protocolo por idade/sexo: idosos (pele mais frágil, sessão
// mais curta) -> 3 dobras; demais adultos -> 7 dobras (mais preciso).
// É uma heurística prática, não uma regra clínica fechada - o avaliador
// decide.
export function sugerirProtocoloDobras(idade: number | null): { protocolo: ProtocoloDobras; motivo: string } {
  if (idade !== null && idade >= 60) {
    return { protocolo: "jp3", motivo: "Idade ≥ 60 anos - protocolo de 3 dobras (mais rápido, menos manuseio de pele)." };
  }
  return { protocolo: "jp7", motivo: "Protocolo de 7 dobras - mais preciso para a maior parte dos adultos." };
}

function numeroValido(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

function somaValida(valores: (string | undefined)[]): number | null {
  const nums = valores.map((v) => Number(v));
  if (nums.some((n) => !numeroValido(n))) return null;
  return nums.reduce((a, b) => a + b, 0);
}

// Retorna %G (equação de Siri a partir da densidade corporal de Jackson &
// Pollock) ou null se faltar alguma dobra do protocolo ou a idade/sexo.
export function calcularPercentualGorduraDobras(
  protocolo: ProtocoloDobras,
  dados: Record<string, string>,
  idade: number | null,
  sexo: SexoComp
): number | null {
  if (protocolo === "outro") return null;

  if (protocolo === "faulkner4") {
    const soma = somaValida(SITIOS_FAULKNER.map((s) => dados[s.chave]));
    if (soma === null) return null;
    return 0.153 * soma + 5.783;
  }

  if (sexo === "desconhecido" || idade === null) return null;

  if (protocolo === "jp3") {
    const sitios = SITIOS_JP3[sexo];
    const soma = somaValida(sitios.map((s) => dados[s.chave]));
    if (soma === null) return null;
    const bd =
      sexo === "masculino"
        ? 1.10938 - 0.0008267 * soma + 0.0000016 * soma * soma - 0.0002574 * idade
        : 1.0994921 - 0.0009929 * soma + 0.0000023 * soma * soma - 0.0001392 * idade;
    return 495 / bd - 450;
  }

  if (protocolo === "jp7") {
    const soma = somaValida(SITIOS_JP7.map((s) => dados[s.chave]));
    if (soma === null) return null;
    const bd =
      sexo === "masculino"
        ? 1.112 - 0.00043499 * soma + 0.00000055 * soma * soma - 0.00028826 * idade
        : 1.097 - 0.00046971 * soma + 0.00000056 * soma * soma - 0.00012828 * idade;
    return 495 / bd - 450;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Faixa saudável de %G por idade/sexo (Gallagher et al., 2000)
// ---------------------------------------------------------------------------
const FAIXAS_GORDURA_SAUDAVEL: { idadeMin: number; idadeMax: number; masculino: [number, number]; feminino: [number, number] }[] = [
  { idadeMin: 0, idadeMax: 39, masculino: [8, 19], feminino: [21, 32] },
  { idadeMin: 40, idadeMax: 59, masculino: [11, 21], feminino: [23, 33] },
  { idadeMin: 60, idadeMax: 200, masculino: [13, 24], feminino: [24, 35] },
];

export function faixaGorduraSugerida(idade: number | null, sexo: SexoComp): [number, number] | null {
  if (idade === null || sexo === "desconhecido") return null;
  const faixa = FAIXAS_GORDURA_SAUDAVEL.find((f) => idade >= f.idadeMin && idade <= f.idadeMax);
  if (!faixa) return null;
  return faixa[sexo];
}

export function percentualGorduraIdealSugerido(idade: number | null, sexo: SexoComp): number | null {
  const faixa = faixaGorduraSugerida(idade, sexo);
  if (!faixa) return null;
  return (faixa[0] + faixa[1]) / 2;
}
