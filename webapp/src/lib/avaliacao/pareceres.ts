// Pareceres dos agentes (texto de apoio ao avaliador) em dois estilos:
//  - "sucinto": o essencial, uma linha por tema;
//  - "explicativo": o mesmo conteúdo com o critério usado, como ler o resultado,
//    os limites e os próximos passos.
//
// Todos os textos saem dos mesmos resultados que o painel integrado já calcula
// (lib/integracao/perfil.ts) - o parecer não inventa classificação nova. Regra
// fixa: linguagem descritiva, nunca diagnóstico; dado ausente é "a investigar".

import type { Alerta, PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { linhasDorPorRegiao } from "@/lib/anamnese/dorPorRegiao";
import { escorePSS10, rotuloNivel } from "@/lib/anamnese/alerts";
import { calcularPSQI } from "@/lib/anamnese/psqi";
import { calcularRiscoCardiovascular } from "@/lib/anamnese/riscoCardiovascular";
import { perguntasParQ } from "@/lib/anamnese/questionnaires";
import { calcularPerfilIntegrado, type Classificacao, type DomainKey, type DomainResult } from "@/lib/integracao/perfil";
import { paraNumero } from "@/lib/numeros";
import { linhasBaseCientifica, nomeComTitulo, type AgenteId } from "@/lib/agentes";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { analisarComposicao, compararMetodosGordura, CORTE_FFMI, percentualGorduraIdealSugerido } from "@/lib/avaliacao/composicaoCorporal";
import { assimetriaLados, CAMPOS_CIRCUNFERENCIA, LIMITE_ASSIMETRIA_PCT } from "@/lib/avaliacao/medidasRegionais";

export type EstiloParecer = "sucinto" | "explicativo";
export type AgenteParecer = "anamnese" | "fisica" | "funcional" | "cardio" | "perfil";

export const ROTULO_ESTILO: Record<EstiloParecer, string> = {
  sucinto: "Sucinto e objetivo",
  explicativo: "Mais explicativo",
};

const ROTULO_CLASSE: Record<Classificacao, string> = {
  adequado: "ADEQUADO",
  atencao: "ATENÇÃO",
  prioridade: "PRIORIDADE",
  investigar: "A INVESTIGAR",
};

// Como o sistema lê cada domínio (espelha as regras de lib/integracao/perfil.ts).
const EXPLICACAO: Record<DomainKey, { avalia: string; criterio: string }> = {
  forca: {
    avalia: "força muscular geral, a partir da dinamometria de preensão, do 5x Sentar-e-Levantar e dos testes de Rikli & Jones.",
    criterio:
      "ponto de corte único: qualquer indicador abaixo do corte conta como força reduzida (dinamometria: referência brasileira para 60+ e EWGSOP2 nas demais idades; 5x Sentar-e-Levantar acima de 15 s; ou dois testes de Rikli & Jones abaixo do limite).",
  },
  mobilidade: {
    avalia: "mobilidade articular e do agachamento, a partir de testes objetivos: medidas D/E de tornozelo (dorsiflexão) e quadril (rotações), goniometria e observação estruturada do agachamento.",
    criterio: "atenção se houver diferença entre os lados acima de 8° (maior diferença média entre lados em mulheres saudáveis: 7,5°, Macedo & Magee 2008) ou restrição observada no agachamento. Não há corte absoluto de amplitude validado: compare com o manual de goniometria que você adota. As observações posturais em texto livre não entram.",
  },
  equilibrio: {
    avalia: "equilíbrio e risco de queda.",
    criterio: "queda nos últimos 12 meses tem precedência; sem queda, apoio unipodal abaixo de 10 s no lado mais fraco é lido como atenção (referência comumente citada, não um limite validado para todos).",
  },
  capacidade_cardiorrespiratoria: {
    avalia: "capacidade cardiorrespiratória (VO2máx estimado e velocidade de marcha).",
    criterio:
      "VO2máx classificado por idade e sexo pelos percentis de esteira do registro FRIEND; velocidade de marcha com cortes de 0,8 e 1,0 m/s (EWGSOP2). Quando há mais de um indicador, vale a média das notas (0 adequado, 1 atenção, 2 prioridade).",
  },
  composicao_corporal: {
    avalia: "composição corporal: gordura, massa magra e distribuição da gordura.",
    criterio:
      "leitura combinada, nesta ordem: %G contra a faixa saudável por idade e sexo (Gallagher 2000); massa magra pelo índice de massa livre de gordura (< 17 kg/m² em homens e < 15 em mulheres, critério GLIM); cintura (OMS), RCQ e relação cintura/estatura (corte de 0,5); e, por último, o IMC, que é só triagem e está em debate como critério isolado (Lancet 2025). Gordura alta com massa magra baixa é a combinação de maior atenção. Sem %G registrado, o sistema avisa que a leitura fica limitada.",
  },  dor: {
    avalia: "dor relatada na anamnese.",
    criterio: "bandeira vermelha ou intensidade de 7/10 ou mais = prioridade; dor sem esses sinais = atenção; sem dor = adequado.",
  },
  estilo_de_vida: {
    avalia: "atividade física atual, estresse percebido e barreiras ao exercício.",
    criterio: "estresse de 8/10 ou mais = prioridade; estresse de 5/10 ou mais, sedentarismo ou três ou mais barreiras = atenção.",
  },
  sono: {
    avalia: "qualidade do sono.",
    criterio: "PSQI: acima de 5 indica sono de má qualidade e acima de 10 foi tratado como prioridade; sem PSQI completo, usam-se as perguntas curtas de triagem.",
  },
  bem_estar: {
    avalia: "saúde mental e bem-estar (triagem, não diagnóstico).",
    criterio: "GAD-7 e PHQ-9: 10 ou mais = atenção; 15 ou mais = prioridade. Item de ideação de autolesão positivo = prioridade imediata. A pergunta inicial do questionário base só decide se o questionário de bem-estar é oferecido.",
  },
  funcionalidade: {
    avalia: "funcionalidade e risco de queda, com o TUG como indicador principal.",
    criterio: "TUG de 12 s ou mais = atenção (corte de triagem do STEADI); 13,5 s ou mais = prioridade. O TUG confirma risco melhor do que o descarta: interpretar junto com os demais testes.",
  },
};

const PROXIMO_PASSO: Record<Classificacao, string> = {
  adequado: "manter e usar como ponto forte no plano; reavaliar no prazo combinado.",
  atencao: "incluir no plano com meta e indicador de reavaliação.",
  prioridade: "tratar como prioridade no plano e avaliar necessidade de encaminhamento.",
  investigar: "coletar o dado que falta antes de concluir.",
};

const AGENTES: Record<AgenteParecer, { titulo: string; dominios: DomainKey[]; limites: string[] }> = {
  anamnese: {
    titulo: "Anamnese",
    dominios: ["dor", "sono", "estilo_de_vida", "bem_estar"],
    limites: [
      "A anamnese é autorrelato: depende de como o paciente entendeu e quis responder, e deve ser confirmada na conversa.",
      "Escalas de sono, humor e ansiedade são triagem, não diagnóstico.",
    ],
  },
  fisica: {
    titulo: "Avaliação física e antropométrica",
    dominios: ["composicao_corporal"],
    limites: [
      "O IMC não separa massa magra de gordura; use as circunferências e, quando houver, o percentual de gordura.",
      "Medidas antropométricas variam com a técnica e o avaliador: padronize os pontos de medida nas reavaliações.",
    ],
  },
  funcional: {
    titulo: "Avaliação funcional",
    dominios: ["forca", "equilibrio", "funcionalidade", "mobilidade"],
    limites: [
      "Cada teste mede um aspecto: nenhum, isolado, define a capacidade funcional.",
      "Os cortes são referências populacionais; o contexto (dor, medicamentos, cansaço no dia) pode alterar o resultado.",
    ],
  },
  cardio: {
    titulo: "Avaliação cardiorrespiratória",
    dominios: ["capacidade_cardiorrespiratoria"],
    limites: [
      "O VO2máx dos testes de campo e de esteira submáximos é uma estimativa, com erro de alguns mL/kg/min.",
      "Só o VO2 medido em ergoespirometria é medida direta.",
    ],
  },
  perfil: {
    titulo: "Perfil integrado",
    dominios: [],
    limites: [
      "A integração cruza resultados de instrumentos diferentes: nenhum domínio define o paciente.",
      "O perfil não é diagnóstico; é um mapa para decidir prioridades junto com o paciente.",
    ],
  },
};

const ID_AGENTE: Record<AgenteParecer, AgenteId> = { anamnese: "sofia", fisica: "marco", funcional: "rita", cardio: "caio", perfil: "iris" };

export function nomeAgente(agente: AgenteParecer): string {
  return nomeComTitulo(ID_AGENTE[agente]);
}

function primeiraFrase(texto: string): string {
  const partes = texto.split(/\.\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/);
  const f = partes[0].trim();
  return f.endsWith(".") ? f : f + ".";
}

function dominio(perfil: ReturnType<typeof calcularPerfilIntegrado>, chave: DomainKey): DomainResult {
  return perfil.dominios.find((d) => d.chave === chave)!;
}

function linhaDominio(d: DomainResult, estilo: EstiloParecer): string[] {
  if (estilo === "sucinto") return [`- ${d.titulo}: ${ROTULO_CLASSE[d.classificacao]}. ${primeiraFrase(d.justificativa)}`];
  const e = EXPLICACAO[d.chave];
  return [
    `${d.titulo.toUpperCase()} - ${ROTULO_CLASSE[d.classificacao]}`,
    `- Resultado: ${d.justificativa}`,
    `- O que avalia: ${e.avalia}`,
    `- Critério: ${e.criterio}`,
    `- Próximo passo: ${PROXIMO_PASSO[d.classificacao]}`,
    "",
  ];
}

function fmt(v: number | null, casas = 0, un = ""): string | null {
  return v === null ? null : `${v.toFixed(casas).replace(".", ",")}${un ? ` ${un}` : ""}`;
}

// ---------------------------------------------------------------------------
// Dados registrados em cada área (linha de apoio ao parecer)
// ---------------------------------------------------------------------------
function dadosFisica(p: PacienteRow): string[] {
  const f = p.fisica ?? {};
  const c = analisarComposicao(f, idadeEfetiva(p), sexoEfetivo(p));
  const n = (k: string) => paraNumero(f[k]);
  const peso = n("peso_kg");
  const altura = n("altura_cm");
  const regionais = CAMPOS_CIRCUNFERENCIA.filter((x) => n(x.chave) !== null && !["circ_cintura", "circ_quadril", "circ_abdomen"].includes(x.chave)).length;
  const itens = [
    peso !== null ? `peso ${fmt(peso, 1, "kg")}` : null,
    altura !== null ? `altura ${fmt(altura, 0, "cm")}` : null,
    c.imc !== null ? `IMC ${fmt(c.imc, 1)} (triagem)` : null,
    c.pg !== null ? `%G ${fmt(c.pg, 1, "%")}${c.fontePg ? ` (${c.fontePg})` : ""}` : null,
    c.massaGordaKg !== null ? `massa gorda ${fmt(c.massaGordaKg, 1, "kg")}` : null,
    c.massaMagraKg !== null ? `massa magra ${fmt(c.massaMagraKg, 1, "kg")}${c.ffmi !== null ? ` (índice ${fmt(c.ffmi, 1)} kg/m²)` : ""}` : null,
    n("bio_agua_corporal_pct") !== null ? `água corporal ${fmt(n("bio_agua_corporal_pct"), 1, "%")}` : null,
    c.cintura !== null ? `cintura ${fmt(c.cintura, 1, "cm")}` : null,
    n("circ_abdomen") !== null ? `abdômen ${fmt(n("circ_abdomen"), 1, "cm")}` : null,
    n("circ_quadril") !== null ? `quadril ${fmt(n("circ_quadril"), 1, "cm")}` : null,
    c.rcq !== null ? `RCQ ${fmt(c.rcq, 2)}` : null,
    c.rcest !== null ? `relação cintura/estatura ${fmt(c.rcest, 2)}` : null,
    regionais > 0 ? `${regionais} circunferência(s) regional(is)` : null,
    n("pa_sistolica") !== null && n("pa_diastolica") !== null ? `PA ${f.pa_sistolica}/${f.pa_diastolica} mmHg` : null,
    n("fc_repouso") !== null ? `FC de repouso ${f.fc_repouso} bpm` : null,
    n("spo2") !== null ? `SpO2 ${f.spo2}%` : null,
  ].filter(Boolean);
  return itens as string[];
}

// Leitura criteriosa do Dr. Marco: usa TUDO o que foi medido, com o IMC por último.
function leituraMarco(p: PacienteRow, estilo: EstiloParecer): string[] {
  const f = p.fisica ?? {};
  const idade = idadeEfetiva(p);
  const sexo = sexoEfetivo(p);
  const c = analisarComposicao(f, idade, sexo);
  const linhas: string[] = [];
  const faixaTxt = c.faixa ? `${c.faixa[0]}-${c.faixa[1]}%` : null;
  const L: string[] = [];

  if (c.pg !== null) {
    const rel = c.pgStatus === "acima" ? "ACIMA da faixa saudável" : c.pgStatus === "abaixo" ? "abaixo da faixa saudável" : c.pgStatus === "na_faixa" ? "dentro da faixa saudável" : "sem faixa de referência (faltam idade ou sexo)";
    L.push(`Gordura corporal: ${fmt(c.pg, 1, "%")}${c.fontePg ? ` (${c.fontePg})` : ""}${faixaTxt ? `, faixa saudável para a idade e o sexo ${faixaTxt}` : ""}: ${rel}.`);
    const pgIdeal = paraNumero(f.percentual_gordura_ideal) ?? percentualGorduraIdealSugerido(idade, sexo);
    const peso = paraNumero(f.peso_kg);
    if (peso !== null && pgIdeal !== null && c.pgStatus === "acima") {
      L.push(`Gordura acima do ponto médio da faixa: cerca de ${fmt((peso * (c.pg - pgIdeal)) / 100, 1, "kg")}.`);
    }
  } else {
    L.push("Gordura corporal: NÃO registrada (dobras ou bioimpedância). Sem ela só há o IMC, que não separa gordura de massa magra: registre o %G para uma leitura confiável.");
  }
  const diverg = compararMetodosGordura(f, idade, sexo);
  if (diverg?.divergente) L.push(`ATENÇÃO, métodos divergentes: ${diverg.texto}`);
  if (c.massaMagraKg !== null) {
    const corte = sexo !== "desconhecido" ? CORTE_FFMI[sexo] : null;
    L.push(
      `Massa magra: ${fmt(c.massaMagraKg, 1, "kg")}${c.ffmi !== null ? `, índice ${fmt(c.ffmi, 1)} kg/m²` : ""}${corte !== null && c.ffmi !== null ? ` (corte de massa reduzida: ${corte} kg/m²): ${c.ffmiBaixo ? "BAIXA" : "adequada"}` : ""}${
        c.massaMagraPctDaMeta !== null ? `; equivale a ${fmt(c.massaMagraPctDaMeta, 0, "%")} da meta calculada pelo sistema (regra do sistema, sem validação publicada)` : ""
      }.`
    );
  }
  const padraoTxt: Record<string, string> = {
    gordura_alta_massa_baixa: "Padrão de MAIOR ATENÇÃO: gordura alta com massa magra baixa. Peso e IMC podem parecer aceitáveis e esconder o problema; a prioridade é ganhar massa magra (treino de força progressivo, com nutrição) e reduzir gordura sem perder músculo. Se a força também estiver reduzida, é compatível com obesidade sarcopênica (triagem; confirmar).",
    gordura_alta: "Gordura acima da faixa com massa magra preservada: foco em reduzir gordura mantendo a massa magra (força + aeróbio + orientação nutricional).",
    peso_normal_gordura_alta: "Peso normal pelo IMC, mas com excesso de gordura: o IMC subestima o risco nesta pessoa. Vale olhar a massa magra e a força.",
    massa_baixa: "Massa magra baixa com gordura dentro da faixa: foco em ganhar massa magra (força progressiva e aporte proteico adequado).",
    imc_alto_sem_excesso_de_gordura: "IMC elevado sem excesso de gordura medido: provável massa muscular. O IMC superestima a gordura aqui; não use como critério de excesso.",
    adequado: "Gordura e massa magra sem alteração nos critérios usados.",
    indeterminado: "Sem dados suficientes para concluir o padrão de composição.",
  };
  L.push(padraoTxt[c.padrao]);
  if (c.rcest !== null || c.cintura !== null) {
    const partes = [c.cintura !== null ? `cintura ${fmt(c.cintura, 1, "cm")}${c.classeCintura ? ` (${{ adequado: "dentro da faixa", aumentado: "risco aumentado", muito_aumentado: "risco muito aumentado" }[c.classeCintura]}, corte OMS)` : ""}` : null, c.rcq !== null ? `RCQ ${fmt(c.rcq, 2)}` : null, c.rcest !== null ? `relação cintura/estatura ${fmt(c.rcest, 2)} (${c.rcest >= 0.5 ? "≥ 0,5" : "< 0,5"})` : null].filter(Boolean);
    L.push(`Gordura central: ${partes.join("; ")}.`);
  }
  if (c.imc !== null) L.push(`IMC ${fmt(c.imc, 1)}: usado só como triagem (o IMC isolado está em debate: a Comissão da Lancet de 2025 recomenda confirmar o excesso de gordura por medida direta ou por outro critério).`);

  // Assimetrias de membros (referência prática de 10%).
  const assim: string[] = [];
  for (const campo of CAMPOS_CIRCUNFERENCIA) {
    if (!campo.chave.endsWith("_d")) continue;
    const e = campo.chave.slice(0, -2) + "_e";
    const a = assimetriaLados(paraNumero(f[campo.chave]), paraNumero(f[e]));
    if (a && a.pct >= LIMITE_ASSIMETRIA_PCT) assim.push(`${campo.rotulo.replace(/ D$/, "")}: diferença de ${fmt(a.difCm, 1, "cm")} (${fmt(a.pct, 0, "%")}), maior no lado ${a.maior === "D" ? "direito" : "esquerdo"}`);
  }
  if (assim.length > 0) L.push(`Assimetria entre os lados acima de ${LIMITE_ASSIMETRIA_PCT}% (referência prática; a dominância explica parte, sobretudo nos braços): ${assim.join("; ")}.`);

  // Pressão arterial.
  const sis = paraNumero(f.pa_sistolica);
  const dia = paraNumero(f.pa_diastolica);
  if (sis !== null && dia !== null && (sis >= 140 || dia >= 90)) L.push(`Pressão arterial ${sis}/${dia} mmHg, acima de 140/90 (valor usado como limite de hipertensão em diretrizes): repita a medida em outro momento e oriente avaliação médica se persistir.`);

  if (estilo === "sucinto") {
    linhas.push(...L.map((x) => `- ${x}`));
  } else {
    linhas.push("LEITURA DA COMPOSIÇÃO CORPORAL", ...L.map((x) => `- ${x}`));
    linhas.push(
      "- Como ler: a ordem é %G, massa magra, gordura central e, por último, IMC. As faixas de %G (Gallagher 2000) foram derivadas ligando limites de IMC à gordura medida por 4 compartimentos e DXA, então são provisórias; o corte de massa magra (índice < 17 kg/m² em homens e < 15 em mulheres) vem dos critérios GLIM, pensados para DXA ou bioimpedância: com dobras ou bioimpedância comum a massa magra é estimativa.",
      "- Use o mesmo método e o mesmo avaliador nas reavaliações: a tendência é mais confiável que o valor absoluto.",
      ""
    );
  }
  return linhas;
}
function dadosFuncional(p: PacienteRow): string[] {
  const f = p.funcional ?? {};
  const n = (chave: string) => paraNumero(f[chave]);
  const itens = [
    n("tug_seg") !== null ? `TUG ${fmt(n("tug_seg"), 1, "s")}` : null,
    n("five_sts_seg") !== null ? `5x Sentar-e-Levantar ${fmt(n("five_sts_seg"), 1, "s")}` : null,
    n("chair_stand_reps") !== null ? `Chair Stand 30 s ${n("chair_stand_reps")} rep.` : null,
    n("arm_curl_reps") !== null ? `Arm Curl ${n("arm_curl_reps")} rep.` : null,
    n("apoio_unipodal_d_seg") !== null || n("apoio_unipodal_e_seg") !== null ? `apoio unipodal D ${n("apoio_unipodal_d_seg") ?? "-"} s / E ${n("apoio_unipodal_e_seg") ?? "-"} s` : null,
    n("dinamometria_d_kg") !== null || n("dinamometria_e_kg") !== null ? `dinamometria D ${n("dinamometria_d_kg") ?? "-"} / E ${n("dinamometria_e_kg") ?? "-"} kgf` : null,
    n("velocidade_marcha_ms") !== null ? `marcha ${fmt(n("velocidade_marcha_ms"), 2, "m/s")}` : null,
    n("tc6_metros") !== null ? `TC6 ${n("tc6_metros")} m` : null,
    n("pushup_reps") !== null ? `flexão ${n("pushup_reps")} rep.` : null,
    n("core_prancha_seg") !== null ? `prancha ${n("core_prancha_seg")} s` : null,
  ].filter(Boolean);
  return itens as string[];
}

function alertasTexto(alertas: Alerta[] | undefined): string[] {
  return (alertas ?? [])
    .slice()
    .sort((a, b) => b.nivel - a.nivel)
    .map((a) => `Nível ${a.nivel} (${rotuloNivel[a.nivel]}): ${a.descricao}`);
}

// ---------------------------------------------------------------------------
// Anamnese (Sofia) - além dos domínios, resume queixa, histórico e prontidão.
// ---------------------------------------------------------------------------
function blocoAnamnese(p: PacienteRow, estilo: EstiloParecer): string[] {
  const a = mesclarComPadrao(p.anamnese);
  const linhas: string[] = [];
  const queixa = a.motivo.queixa_principal || a.motivo.motivo_procura;
  const objetivo = a.motivo.objetivos;
  const dificuldades = a.motivo.dificuldades?.length ? a.motivo.dificuldades.join(", ") : "";

  if (estilo === "sucinto") {
    if (queixa) linhas.push(`- Queixa: ${queixa}`);
    if (objetivo) linhas.push(`- Objetivo: ${objetivo}`);
    if (dificuldades) linhas.push(`- Dificuldades no dia a dia: ${dificuldades}`);
  } else {
    linhas.push("MOTIVO DA PROCURA");
    linhas.push(`- Queixa principal: ${queixa || "não informada"}`);
    linhas.push(`- Objetivo do paciente: ${objetivo || "não informado"}`);
    if (dificuldades) linhas.push(`- Dificuldades no dia a dia: ${dificuldades}`);
    if (a.motivo.atividades_perdidas) linhas.push(`- Atividades que deixou de fazer: ${a.motivo.atividades_perdidas}`);
    linhas.push("- Por que importa: o objetivo declarado orienta quais resultados pesam mais no plano.");
    linhas.push("");
  }

  const h = a.historico_saude;
  const hist: string[] = [];
  if (h.doencas) hist.push(`doenças: ${h.doencas}`);
  if (h.cirurgias) hist.push(`cirurgias: ${h.cirurgias}`);
  if (h.lesoes_fraturas) hist.push(`lesões/fraturas: ${h.lesoes_fraturas}`);
  if (h.quedas_12m === true) hist.push("queda nos últimos 12 meses");
  if (a.medicamentos.usa_medicamentos === true) hist.push(`medicamentos: ${a.medicamentos.lista.map((m) => m.nome).filter(Boolean).join(", ") || "informou uso, sem lista"}`);
  if (estilo === "sucinto") {
    if (hist.length > 0) linhas.push(`- Histórico: ${hist.join("; ")}.`);
  } else {
    linhas.push("HISTÓRICO DE SAÚDE");
    linhas.push(hist.length > 0 ? `- ${hist.join("\n- ")}` : "- Sem doenças, cirurgias, lesões, quedas ou medicamentos informados.");
    linhas.push("");
  }

  // Dor por região
  if (a.dor.tem_dor === true) {
    const regioes = linhasDorPorRegiao(a.dor);
    if (estilo === "sucinto") {
      linhas.push(`- Regiões com dor: ${regioes.length > 0 ? regioes.join("; ") : "relatada, sem região marcada"}.`);
    } else {
      linhas.push("DOR POR REGIÃO");
      regioes.forEach((r) => linhas.push(`- ${r}`));
      if (a.dor.bandeiras_vermelhas.length > 0) linhas.push(`- Bandeiras vermelhas relatadas: ${a.dor.bandeiras_vermelhas.join(", ")}.`);
      linhas.push("- A dor é autorrelato por região; a escala de 0 a 10 não é comparável entre pessoas, só ao longo do tempo na mesma pessoa.");
      linhas.push("");
    }
  }

  // Prontidão (PAR-Q+) e risco cardiovascular
  const parq = perguntasParQ.filter((q) => (a.prontidao.parq as any)[q.chave] === true);
  const risco = calcularRiscoCardiovascular(p);
  const prontidao: string[] = [];
  if (parq.length > 0) prontidao.push(`PAR-Q+ com ${parq.length} resposta(s) positiva(s)`);
  if (risco) prontidao.push(`risco cardiovascular para exercício: ${risco.classificacao}`);
  if (estilo === "sucinto") {
    if (prontidao.length > 0) linhas.push(`- Prontidão: ${prontidao.join("; ")}.`);
  } else if (prontidao.length > 0) {
    linhas.push("PRONTIDÃO PARA O EXERCÍCIO");
    linhas.push(`- ${prontidao.join("\n- ")}`);
    if (risco) linhas.push(`- ${risco.justificativa}`);
    linhas.push("- PAR-Q+ positivo ou risco moderado/alto indicam cautela e, quando couber, liberação médica antes de esforços intensos.");
    linhas.push("");
  }

  // Escalas
  const psqi = calcularPSQI(a);
  const pss = escorePSS10(a.saude_mental.pss10);
  const escalas = [psqi !== null ? `PSQI ${psqi.global}/21` : null, pss !== null ? `PSS-10 ${pss}/40` : null].filter(Boolean);
  if (escalas.length > 0 && estilo === "sucinto") linhas.push(`- Escalas: ${escalas.join("; ")}.`);
  if (escalas.length > 0 && estilo === "explicativo") {
    linhas.push("ESCALAS APLICADAS");
    linhas.push(`- ${escalas.join("\n- ")}`);
    linhas.push("- Escalas de autorrelato: servem para acompanhar a evolução e orientar a conversa, não para diagnosticar.");
    linhas.push("");
  }
  // Atividade física autorrelatada (IPAQ) e módulo 60+ (visão, audição, memória).
  const ip = a.atividade_fisica.ipaq;
  const temIpaq = Object.values(ip).some((v) => v !== "");
  if (temIpaq && estilo === "explicativo") {
    linhas.push("ATIVIDADE FÍSICA AUTORRELATADA");
    linhas.push("- O IPAQ é autorrelato e costuma superestimar a atividade física (em revisão sistemática, cerca de 84% a mais na versão curta): cruze com os testes funcionais e cardiorrespiratórios.");
    linhas.push("");
  }
  const cap = a.capacidade;
  const ROT_DIF: Record<string, string> = { nenhuma: "sem dificuldade", alguma: "alguma dificuldade", muita: "muita dificuldade" };
  const ROT_MEM: Record<string, string> = { nao: "sem esquecimentos que atrapalhem", as_vezes: "esquecimentos às vezes", frequentemente: "esquecimentos frequentes" };
  const capItens = [
    cap.visao_dificuldade ? `visão: ${ROT_DIF[cap.visao_dificuldade]}` : null,
    cap.audicao_dificuldade ? `audição: ${ROT_DIF[cap.audicao_dificuldade]}` : null,
    cap.memoria_esquecimentos ? `memória: ${ROT_MEM[cap.memoria_esquecimentos]}` : null,
  ].filter(Boolean);
  if (capItens.length > 0) {
    const alerta = cap.visao_dificuldade === "muita" || cap.audicao_dificuldade === "muita" || cap.memoria_esquecimentos === "frequentemente";
    if (estilo === "sucinto") {
      linhas.push(`- Visão, audição e memória (autorrelato): ${capItens.join("; ")}${alerta ? "; confirmar com testes objetivos" : ""}.`);
    } else {
      linhas.push("VISÃO, AUDIÇÃO E MEMÓRIA (módulo 60+)");
      linhas.push(`- ${capItens.join("\n- ")}`);
      linhas.push(
        alerta
          ? "- Dificuldade importante relatada: confirme com testes objetivos (voz sussurrada, lembrar palavras) e considere encaminhamento; isso muda como dar instruções e como conduzir o treino de equilíbrio."
          : "- Autorrelato sem dificuldade importante; é triagem, não diagnóstico."
      );
      linhas.push("");
    }
  }
  return linhas;
}

// ---------------------------------------------------------------------------
// Parecer por agente
// ---------------------------------------------------------------------------
export function gerarParecerAgente(agente: AgenteParecer, paciente: PacienteRow, estilo: EstiloParecer): string {
  const info = AGENTES[agente];
  const perfil = calcularPerfilIntegrado(paciente);
  // Sem nenhum dado da área, não há o que redigir (a aba mostra o aviso).
  if (agente === "fisica" && dadosFisica(paciente).length === 0) return "";
  if (agente === "funcional" && dadosFuncional(paciente).length === 0) return "";
  if (agente === "anamnese" && paciente.anamnese_status === "nao_iniciada") return "";
  if (agente === "cardio") {
    const d = dominio(perfil, "capacidade_cardiorrespiratoria");
    if (d.classificacao === "investigar" && d.justificativa.startsWith("Nenhum teste")) return "";
  }
  const linhas: string[] = [];
  const cab = estilo === "sucinto" ? " (resumo)" : "";
  linhas.push(`PARECER ${nomeComTitulo(ID_AGENTE[agente]).toUpperCase()} (assistente de IA) - ${info.titulo.toUpperCase()}${cab}`);
  if (estilo === "explicativo") linhas.push("Rascunho para o profissional revisar: apoio à decisão, não é diagnóstico nem substitui o julgamento clínico.");
  linhas.push("");

  if (agente === "perfil") {
    const grupos: [string, DomainResult[]][] = [
      ["Prioridade", perfil.riscos],
      ["Atenção", perfil.limitacoes],
      ["Pontos fortes", perfil.potencialidades],
      ["A investigar (dado faltante)", perfil.dominios.filter((d) => d.classificacao === "investigar")],
    ];
    if (estilo === "sucinto") {
      for (const [titulo, itens] of grupos) {
        if (itens.length > 0) linhas.push(`${titulo}: ${itens.map((d) => d.titulo.toLowerCase()).join(", ")}.`);
      }
      linhas.push(`Confiança do perfil: ${perfil.confianca}.`);
      const alertas = alertasTexto(paciente.alertas);
      if (alertas.length > 0) linhas.push("", "Alertas:", ...alertas.map((x) => `- ${x}`));
    } else {
      for (const d of perfil.dominios) linhas.push(...linhaDominio(d, "explicativo"));
      linhas.push(`CONFIANÇA DO PERFIL: ${perfil.confianca}. ${perfil.confianca === "alta" ? "Quase todos os domínios têm dado." : perfil.confianca === "media" ? "Vários domínios ainda sem dado: conclusões parciais." : "Muitos domínios sem dado: use o perfil apenas como orientação inicial."}`);
      const alertas = alertasTexto(paciente.alertas);
      if (alertas.length > 0) {
        linhas.push("", "ALERTAS DA ANAMNESE");
        alertas.forEach((x) => linhas.push(`- ${x}`));
      }
      linhas.push("");
    }
  } else {
    if (agente === "anamnese") linhas.push(...blocoAnamnese(paciente, estilo));
    if (agente === "fisica" || agente === "funcional") {
      const dados = agente === "fisica" ? dadosFisica(paciente) : dadosFuncional(paciente);
      linhas.push(estilo === "sucinto" ? `Dados: ${dados.join("; ")}.` : `DADOS REGISTRADOS\n- ${dados.join("\n- ")}\n`);
    }
    if (agente === "fisica") linhas.push(...leituraMarco(paciente, estilo));
    if (estilo === "explicativo" && agente === "anamnese") linhas.push("INTERPRETAÇÃO DOS DOMÍNIOS");
    for (const chave of info.dominios) {
      const d = dominio(perfil, chave);
      // No parecer sucinto do Dr. Marco os itens já foram listados acima; aqui só a classificação.
      if (agente === "fisica" && estilo === "sucinto") linhas.push(`- ${d.titulo}: ${ROTULO_CLASSE[d.classificacao]} (critérios acima).`);
      else linhas.push(...linhaDominio(d, estilo));
    }
  }

  if (estilo === "sucinto") {
    linhas.push("", "Dado ausente aparece como 'a investigar', nunca como normal. Não é diagnóstico.");
    linhas.push(...linhasBaseCientifica(ID_AGENTE[agente], "sucinto"));
  } else {
    linhas.push("LIMITES DESTE PARECER");
    info.limites.forEach((l) => linhas.push(`- ${l}`));
    linhas.push("- Dado ausente aparece como 'a investigar', nunca como normal.", "");
    linhas.push(...linhasBaseCientifica(ID_AGENTE[agente], "explicativo"));
  }
  return linhas.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
