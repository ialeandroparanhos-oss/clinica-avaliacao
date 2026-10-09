// Agente 3 — Marco: composição corporal.
//
// Fórmulas de dobras cutâneas (Jackson & Pollock) e a tabela de faixa
// saudável de %G por idade/sexo (Gallagher et al., 2000) são as versões
// amplamente publicadas em livros-texto de fisiologia do exercício -
// confirme a versão validada oficial antes do uso clínico formal, mesmo
// padrão de nota usado para os instrumentos psicométricos deste projeto
// (ver lib/anamnese/questionnaires.ts).

import { paraNumero } from "@/lib/numeros";

export type SexoComp = "masculino" | "feminino" | "desconhecido";

// ---------------------------------------------------------------------------
// Classificações simples para exibição (IMC pela OMS, RCQ pelo corte da OMS)
// ---------------------------------------------------------------------------
export type ClasseIMC = "baixo_peso" | "eutrofia" | "sobrepeso" | "obesidade_1" | "obesidade_2" | "obesidade_3";

export function classificarIMC(imc: number): { chave: ClasseIMC; rotulo: string } {
  if (imc < 18.5) return { chave: "baixo_peso", rotulo: "Baixo peso" };
  if (imc < 25) return { chave: "eutrofia", rotulo: "Eutrofia (peso adequado)" };
  if (imc < 30) return { chave: "sobrepeso", rotulo: "Sobrepeso" };
  if (imc < 35) return { chave: "obesidade_1", rotulo: "Obesidade grau I" };
  if (imc < 40) return { chave: "obesidade_2", rotulo: "Obesidade grau II" };
  return { chave: "obesidade_3", rotulo: "Obesidade grau III" };
}

// Corte da OMS para risco cardiometabólico aumentado: RCQ >= 0,90 (homens)
// e >= 0,85 (mulheres). Duas faixas apenas - uma tabela estratificada por
// idade só entra com a fonte de referência confirmada.
export function classificarRCQ(rcq: number, sexo: SexoComp): "adequado" | "aumentado" | null {
  if (sexo === "desconhecido") return null;
  const corte = sexo === "masculino" ? 0.9 : 0.85;
  return rcq >= corte ? "aumentado" : "adequado";
}

// Relação cintura/estatura (RCEst): corte 0,5 adotado pelo NICE (0,4-0,49
// saudável; >= 0,5 risco aumentado). Em adultos é equivalente ou ligeiramente
// melhor que a circunferência da cintura e superior ao IMC para risco
// cardiometabólico. Ressalva: um corte único penaliza pessoas mais baixas.
export const CORTE_RCEST = 0.5;

export function relacaoCinturaEstatura(cinturaCm: number | null, alturaCm: number | null): number | null {
  if (cinturaCm === null || alturaCm === null || cinturaCm <= 0 || alturaCm <= 0) return null;
  return cinturaCm / alturaCm;
}

export function classificarRCEst(rcest: number): "adequado" | "aumentado" {
  return rcest >= CORTE_RCEST ? "aumentado" : "adequado";
}

// O IMC sozinho não confirma excesso de gordura (a Comissão da Lancet Diabetes
// & Endocrinology, 2025, propõe confirmar a adiposidade por medida direta ou
// por critérios antropométricos além do IMC). Quando o IMC aponta excesso
// (>= 25), olha as medidas disponíveis de adiposidade central: cintura (corte
// da OMS por sexo), RCQ e RCEst.
export type ConfirmacaoAdiposidade =
  | { estado: "confirmada"; criterios: string[] }
  | { estado: "nao_confirmada"; avaliados: string[] }
  | { estado: "sem_medidas" };

export function confirmarAdiposidade(entrada: {
  imc: number | null;
  cinturaCm: number | null;
  rcq: number | null;
  rcest: number | null;
  sexo: SexoComp;
}): ConfirmacaoAdiposidade | null {
  const { imc, cinturaCm, rcq, rcest, sexo } = entrada;
  if (imc === null || imc < 25) return null;

  const criterios: string[] = [];
  const avaliados: string[] = [];

  if (cinturaCm !== null && sexo !== "desconhecido") {
    const corte = sexo === "masculino" ? 94 : 80;
    (cinturaCm >= corte ? criterios : avaliados).push(`cintura ${cinturaCm} cm (corte OMS ${corte} cm)`);
  }
  if (rcq !== null && sexo !== "desconhecido") {
    const aumentado = classificarRCQ(rcq, sexo) === "aumentado";
    (aumentado ? criterios : avaliados).push(`RCQ ${rcq.toFixed(2).replace(".", ",")}`);
  }
  if (rcest !== null) {
    (rcest >= CORTE_RCEST ? criterios : avaliados).push(`RCEst ${rcest.toFixed(2).replace(".", ",")} (corte ${String(CORTE_RCEST).replace(".", ",")})`);
  }

  if (criterios.length > 0) return { estado: "confirmada", criterios };
  if (avaliados.length > 0) return { estado: "nao_confirmada", avaliados };
  return { estado: "sem_medidas" };
}

// Circunferência da cintura/abdominal - cortes da OMS (também adotados pelas
// diretrizes brasileiras de obesidade): risco AUMENTADO >= 94 cm (homens) e
// >= 80 cm (mulheres); risco MUITO AUMENTADO >= 102 cm (homens) e >= 88 cm
// (mulheres). Os cortes foram definidos para a cintura (ponto médio entre a
// última costela e a crista ilíaca); a medida na altura do umbigo costuma sair
// maior, então é uma aproximação.
export type ClasseCircAbdominal = "adequado" | "aumentado" | "muito_aumentado";

export const CORTES_CIRC_ABDOMINAL: Record<"masculino" | "feminino", { aumentado: number; muitoAumentado: number }> = {
  masculino: { aumentado: 94, muitoAumentado: 102 },
  feminino: { aumentado: 80, muitoAumentado: 88 },
};

export function classificarCircAbdominal(cm: number, sexo: SexoComp): ClasseCircAbdominal | null {
  if (sexo === "desconhecido" || !Number.isFinite(cm) || cm <= 0) return null;
  const c = CORTES_CIRC_ABDOMINAL[sexo];
  return cm >= c.muitoAumentado ? "muito_aumentado" : cm >= c.aumentado ? "aumentado" : "adequado";
}

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

function somaValida(valores: (string | undefined)[]): number | null {
  const nums = valores.map((v) => paraNumero(v));
  if (nums.some((n) => n === null || n <= 0)) return null;
  return (nums as number[]).reduce((a, b) => a + b, 0);
}

// Soma das dobras (mm) do protocolo escolhido, ou null se faltar algum sítio.
export function somaDobrasProtocolo(protocolo: ProtocoloDobras, dados: Record<string, string>, sexo: SexoComp): number | null {
  if (protocolo === "faulkner4") return somaValida(SITIOS_FAULKNER.map((s) => dados[s.chave]));
  if (protocolo === "jp7") return somaValida(SITIOS_JP7.map((s) => dados[s.chave]));
  if (protocolo === "jp3") return sexo === "desconhecido" ? null : somaValida(SITIOS_JP3[sexo].map((s) => dados[s.chave]));
  return null;
}

// Acima deste valor, tratar o %G por dobras com mais cautela. Referência: um estudo de comparação com
// o modelo de 4 compartimentos citado em fonte secundária (não encontrado no PubMed na conferência de
// 08/10/2026): [confirmar]. Por isso o aviso na tela diz que o corte não está conferido.
export const SOMA_DOBRAS_CAUTELA_MM = 120;

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

// ---------------------------------------------------------------------------
// Leitura integrada da composição corporal (Dr. Marco)
//
// O IMC não separa gordura de massa magra e está em debate como critério isolado (Comissão da
// Lancet Diabetes & Endocrinology, 2025: usar o IMC só como triagem e confirmar a adiposidade por
// medida direta ou por outro critério antropométrico). Por isso a leitura combina, em ordem de peso:
//   1. %G contra a faixa saudável por idade e sexo (Gallagher 2000: faixas provisórias obtidas ligando
//      os limites de IMC à gordura medida por 4 compartimentos/DXA);
//   2. massa magra: índice de massa livre de gordura (kg/m²) abaixo de 17 (homens) ou 15 (mulheres),
//      corte usado como critério de massa reduzida nos critérios GLIM (Cederholm 2019; valores
//      conforme Sobestiansky 2021). Esses cortes foram pensados para DXA/bioimpedância: a massa magra
//      vinda de dobras ou da bioimpedância comum é estimativa, com erro maior;
//   3. cintura, RCQ e RCEst (adiposidade central);
//   4. IMC, por último, como triagem.
// Gordura alta + massa magra baixa é o padrão de maior atenção (compatível com obesidade sarcopênica
// quando há função muscular reduzida: ESPEN/EASO 2022).
// ---------------------------------------------------------------------------
export const CORTE_FFMI: Record<"masculino" | "feminino", number> = { masculino: 17, feminino: 15 };

export type AnaliseComposicao = {
  imc: number | null;
  pg: number | null;
  fontePg: string | null;
  faixa: [number, number] | null;
  pgStatus: "abaixo" | "na_faixa" | "acima" | null;
  massaGordaKg: number | null;
  massaMagraKg: number | null;
  ffmi: number | null;
  ffmiBaixo: boolean | null;
  massaMagraIdealKg: number | null;
  massaMagraPctDaMeta: number | null;
  cintura: number | null;
  rcq: number | null;
  rcest: number | null;
  adiposidade: ConfirmacaoAdiposidade | null;
  classeCintura: ClasseCircAbdominal | null;
  padrao: "gordura_alta_massa_baixa" | "gordura_alta" | "massa_baixa" | "imc_alto_sem_excesso_de_gordura" | "peso_normal_gordura_alta" | "adequado" | "indeterminado";
};

const ROTULO_FONTE_PG: Record<string, string> = { dobras: "dobras cutâneas", bioimpedancia: "bioimpedância", media: "média de dobras e bioimpedância", outro: "outro método" };

export function analisarComposicao(fisica: Record<string, any> | undefined, idade: number | null, sexo: SexoComp): AnaliseComposicao {
  const f = fisica ?? {};
  const peso = paraNumero(f.peso_kg);
  const altura = paraNumero(f.altura_cm);
  const imc = peso !== null && altura !== null && altura > 0 ? peso / Math.pow(altura / 100, 2) : null;

  // %G de referência: o escolhido pelo avaliador; senão a bioimpedância; senão o calculado pelas dobras.
  let pg = paraNumero(f.percentual_gordura);
  let fontePg: string | null = pg !== null ? ROTULO_FONTE_PG[String(f.protocolo_referencia_gordura ?? "")] ?? "valor registrado" : null;
  if (pg === null) {
    const bio = paraNumero(f.bio_percentual_gordura);
    if (bio !== null) {
      pg = bio;
      fontePg = "bioimpedância";
    } else if (["jp3", "jp7", "faulkner4"].includes(String(f.protocolo_dobras ?? ""))) {
      const calc = calcularPercentualGorduraDobras(f.protocolo_dobras as ProtocoloDobras, f as Record<string, string>, idade, sexo);
      if (calc !== null) {
        pg = calc;
        fontePg = "dobras cutâneas";
      }
    }
  }

  const faixa = faixaGorduraSugerida(idade, sexo);
  const pgStatus = pg !== null && faixa ? (pg > faixa[1] ? "acima" : pg < faixa[0] ? "abaixo" : "na_faixa") : null;
  const massaGordaKg = peso !== null && pg !== null ? (peso * pg) / 100 : null;
  const massaMagraRegistrada = paraNumero(f.bio_massa_magra_kg);
  const massaMagraKg = peso !== null && massaGordaKg !== null ? peso - massaGordaKg : massaMagraRegistrada;
  const ffmi = massaMagraKg !== null && altura !== null && altura > 0 ? massaMagraKg / Math.pow(altura / 100, 2) : null;
  const ffmiBaixo = ffmi !== null && sexo !== "desconhecido" ? ffmi < CORTE_FFMI[sexo] : null;

  const idealInformado = paraNumero(f.massa_magra_ideal_kg);
  const pgIdeal = paraNumero(f.percentual_gordura_ideal) ?? percentualGorduraIdealSugerido(idade, sexo);
  const massaMagraIdealKg = idealInformado ?? (peso !== null && pgIdeal !== null ? peso * (1 - pgIdeal / 100) : null);
  const massaMagraPctDaMeta = massaMagraKg !== null && massaMagraIdealKg !== null && massaMagraIdealKg > 0 ? (massaMagraKg / massaMagraIdealKg) * 100 : null;

  const cintura = paraNumero(f.circ_cintura);
  const quadril = paraNumero(f.circ_quadril);
  const rcq = cintura !== null && quadril !== null && quadril > 0 ? cintura / quadril : null;
  const rcest = relacaoCinturaEstatura(cintura, altura);
  const adiposidade = confirmarAdiposidade({ imc, cinturaCm: cintura, rcq, rcest, sexo });
  const medidaTronco = cintura ?? paraNumero(f.circ_abdomen);
  const classeCintura = medidaTronco !== null ? classificarCircAbdominal(medidaTronco, sexo) : null;

  let padrao: AnaliseComposicao["padrao"] = "indeterminado";
  if (pgStatus === "acima" && ffmiBaixo === true) padrao = "gordura_alta_massa_baixa";
  else if (pgStatus === "acima") padrao = imc !== null && imc < 25 ? "peso_normal_gordura_alta" : "gordura_alta";
  else if (ffmiBaixo === true) padrao = "massa_baixa";
  else if (imc !== null && imc >= 25 && (pgStatus === "na_faixa" || pgStatus === "abaixo")) padrao = "imc_alto_sem_excesso_de_gordura";
  else if (pgStatus === "na_faixa" || pgStatus === "abaixo" || (imc !== null && imc >= 18.5 && imc < 25 && pg === null)) padrao = pg === null ? "indeterminado" : "adequado";

  return { imc, pg, fontePg, faixa, pgStatus, massaGordaKg, massaMagraKg, ffmi, ffmiBaixo, massaMagraIdealKg, massaMagraPctDaMeta, cintura, rcq, rcest, adiposidade, classeCintura, padrao };
}

// ---------------------------------------------------------------------------
// Proteção: dobras x bioimpedância. Quando os dois métodos estão registrados e divergem muito, o %G de
// um deles provavelmente tem erro de técnica ou de preparo; o sistema mostra os dois e pede conferência
// em vez de escolher sozinho. O limite de 5 pontos percentuais é regra prática do sistema, sem corte
// publicado (os dois métodos têm erro individual de alguns pontos).
// ---------------------------------------------------------------------------
export const LIMITE_DIVERGENCIA_PG_PP = 5;

export type DivergenciaGordura = {
  dobras: number;
  bio: number;
  diferenca: number; // dobras - bioimpedância (pontos percentuais)
  divergente: boolean;
  texto: string;
};

export function compararMetodosGordura(fisica: Record<string, any> | undefined, idade: number | null, sexo: SexoComp): DivergenciaGordura | null {
  const f = fisica ?? {};
  const protocolo = String(f.protocolo_dobras ?? "");
  if (!["jp3", "jp7", "faulkner4"].includes(protocolo)) return null;
  const dobras = calcularPercentualGorduraDobras(protocolo as ProtocoloDobras, f as Record<string, string>, idade, sexo);
  const bio = paraNumero(f.bio_percentual_gordura);
  if (dobras === null || bio === null) return null;
  const diferenca = dobras - bio;
  const divergente = Math.abs(diferenca) >= LIMITE_DIVERGENCIA_PG_PP;
  const v = (n: number) => n.toFixed(1).replace(".", ",");
  const pts = Math.abs(diferenca).toFixed(1).replace(".", ",");
  const texto = divergente
    ? `%G por dobras ${v(dobras)}% e por bioimpedância ${v(bio)}%: diferença de ${pts} pontos (dobras ${diferenca > 0 ? "mais altas" : "mais baixas"}). Confira a técnica das dobras (3 leituras por local, pontos corretos, lado direito, pinça sem pressionar demais) e o preparo da bioimpedância (jejum, bexiga vazia, hidratação normal, sem exercício antes). Enquanto isso, trate o %G como faixa e não como valor exato; use o mesmo método nas reavaliações.`
    : `%G por dobras ${v(dobras)}% e por bioimpedância ${v(bio)}%: diferença de ${pts} pontos, dentro do esperado entre métodos.`;
  return { dobras, bio, diferenca, divergente, texto };
}

export function percentualGorduraIdealSugerido(idade: number | null, sexo: SexoComp): number | null {
  const faixa = faixaGorduraSugerida(idade, sexo);
  if (!faixa) return null;
  return (faixa[0] + faixa[1]) / 2;
}
