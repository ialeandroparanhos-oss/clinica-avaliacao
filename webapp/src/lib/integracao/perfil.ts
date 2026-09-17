// Agente 6 — Integração e Interpretação
// Cruza anamnese + avaliação física + postural + funcional e produz o
// Perfil Integrado de Saúde e Capacidade Funcional (Seção 7 de
// 05-Agente6-Integracao-e-Interpretacao.md).
//
// Regra fixa de todo este arquivo: nunca produzir diagnóstico. A saída é
// sempre "resultado + classificação por critério explícito", nunca uma
// afirmação clínica fechada. Dado ausente nunca vira "adequado" por
// omissão - vira "investigar".

import type { PacienteRow } from "@/lib/anamnese/types";
import { escorePSS10, somaSemNulos } from "@/lib/anamnese/alerts";

export type Classificacao = "adequado" | "atencao" | "prioridade" | "investigar";

export type DomainKey =
  | "forca"
  | "mobilidade"
  | "equilibrio"
  | "capacidade_cardiorrespiratoria"
  | "composicao_corporal"
  | "dor"
  | "estilo_de_vida"
  | "sono"
  | "bem_estar"
  | "funcionalidade";

export type DomainResult = {
  chave: DomainKey;
  titulo: string;
  classificacao: Classificacao;
  justificativa: string;
};

export type PerfilIntegrado = {
  dominios: DomainResult[];
  potencialidades: DomainResult[];
  limitacoes: DomainResult[];
  riscos: DomainResult[];
  prioridades: DomainResult[];
  confianca: "alta" | "media" | "baixa";
};

const TITULOS: Record<DomainKey, string> = {
  forca: "Força",
  mobilidade: "Mobilidade",
  equilibrio: "Equilíbrio",
  capacidade_cardiorrespiratoria: "Capacidade cardiorrespiratória",
  composicao_corporal: "Composição corporal",
  dor: "Dor",
  estilo_de_vida: "Estilo de vida",
  sono: "Sono",
  bem_estar: "Saúde mental e bem-estar",
  funcionalidade: "Funcionalidade",
};

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function sexoNormalizado(sexo?: string | null): "masculino" | "feminino" | "desconhecido" {
  const s = (sexo || "").trim().toLowerCase();
  if (s.startsWith("m")) return "masculino";
  if (s.startsWith("f")) return "feminino";
  return "desconhecido";
}

function resultado(chave: DomainKey, classificacao: Classificacao, justificativa: string): DomainResult {
  return { chave, titulo: TITULOS[chave], classificacao, justificativa };
}

// ---------------------------------------------------------------------------
// 1. Força — dinamometria (EWGSOP2) como critério principal
// ---------------------------------------------------------------------------
function avaliarForca(p: PacienteRow): DomainResult {
  const d = num(p.funcional?.dinamometria_d_kg);
  const e = num(p.funcional?.dinamometria_e_kg);
  const chair = num(p.funcional?.chair_stand_reps);
  const melhorMao = d !== null && e !== null ? Math.max(d, e) : d ?? e;

  if (melhorMao === null && chair === null) {
    return resultado("forca", "investigar", "Nenhum indicador de força coletado ainda.");
  }

  if (melhorMao !== null) {
    const sexo = sexoNormalizado(p.sexo);
    if (sexo === "masculino" && melhorMao < 27) {
      return resultado("forca", "prioridade", `Dinamometria ${melhorMao} kgf, abaixo do corte de força reduzida do EWGSOP2 para homens (27 kgf).`);
    }
    if (sexo === "feminino" && melhorMao < 16) {
      return resultado("forca", "prioridade", `Dinamometria ${melhorMao} kgf, abaixo do corte de força reduzida do EWGSOP2 para mulheres (16 kgf).`);
    }
    if (sexo === "desconhecido") {
      return resultado("forca", "atencao", `Dinamometria ${melhorMao} kgf coletada, mas o sexo não está registrado para aplicar o corte do EWGSOP2.`);
    }
    return resultado("forca", "adequado", `Dinamometria ${melhorMao} kgf, dentro da faixa esperada pelo corte do EWGSOP2.`);
  }

  return resultado("forca", "atencao", `Chair Stand = ${chair} repetições coletado, mas sem dinamometria para aplicar um corte de referência.`);
}

// ---------------------------------------------------------------------------
// 2. Mobilidade — dado qualitativo (observações posturais); heurística de
//    palavras-chave, deixada explícita para o avaliador conferir sempre.
// ---------------------------------------------------------------------------
function avaliarMobilidade(p: PacienteRow): DomainResult {
  const textos = [
    p.postural?.obs_anterior,
    p.postural?.obs_posterior,
    p.postural?.obs_lateral_d,
    p.postural?.obs_lateral_e,
    p.postural?.obs_movimento,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!textos.trim()) {
    return resultado("mobilidade", "investigar", "Nenhuma observação postural/de movimento registrada ainda.");
  }

  const palavrasDeAtencao = ["assimetria", "compensa", "limita", "restri", "desvio", "dor", "instabilidade", "valgo"];
  const achou = palavrasDeAtencao.find((palavra) => textos.includes(palavra));

  if (achou) {
    return resultado("mobilidade", "atencao", `Observação do avaliador menciona "${achou}" — merece leitura conjunta com os demais achados (nunca causa isolada).`);
  }
  return resultado("mobilidade", "adequado", "Observações registradas sem termos de atenção identificados (revisão automática apenas por palavra-chave — leia o texto completo do avaliador).");
}

// ---------------------------------------------------------------------------
// 3. Equilíbrio — histórico de quedas tem precedência; apoio unipodal como
//    apoio adicional
// ---------------------------------------------------------------------------
function avaliarEquilibrio(p: PacienteRow): DomainResult {
  const quedas = p.anamnese?.historico_saude?.quedas_12m;
  const apoioD = num(p.funcional?.apoio_unipodal_d_seg);
  const apoioE = num(p.funcional?.apoio_unipodal_e_seg);

  if (quedas === true) {
    return resultado("equilibrio", "prioridade", "Histórico de queda nos últimos 12 meses relatado na anamnese.");
  }

  if (apoioD === null && apoioE === null) {
    return resultado("equilibrio", "investigar", "Sem teste de apoio unipodal registrado ainda.");
  }

  const pior = apoioD !== null && apoioE !== null ? Math.min(apoioD, apoioE) : apoioD ?? apoioE;
  if (pior !== null && pior < 10) {
    return resultado("equilibrio", "atencao", `Apoio unipodal de ${pior}s no lado mais fraco — abaixo de uma referência comumente citada de 10s.`);
  }
  return resultado("equilibrio", "adequado", `Apoio unipodal de ${pior}s, sem histórico de quedas relatado.`);
}

// ---------------------------------------------------------------------------
// 4. Capacidade cardiorrespiratória — velocidade de marcha como indicador
//    principal (citada na literatura com corte de fragilidade); TC6 exige
//    equação de referência que o sistema ainda não calcula
// ---------------------------------------------------------------------------
function avaliarCardio(p: PacienteRow): DomainResult {
  const vel = num(p.funcional?.velocidade_marcha_ms);
  const tc6 = num(p.funcional?.tc6_metros);

  if (vel !== null) {
    if (vel < 0.8) return resultado("capacidade_cardiorrespiratoria", "prioridade", `Velocidade de marcha ${vel} m/s, abaixo do limiar de 0,8 m/s citado na literatura como indicativo de mobilidade comprometida.`);
    if (vel < 1.0) return resultado("capacidade_cardiorrespiratoria", "atencao", `Velocidade de marcha ${vel} m/s, na faixa intermediária (0,8-1,0 m/s).`);
    return resultado("capacidade_cardiorrespiratoria", "adequado", `Velocidade de marcha ${vel} m/s, acima de 1,0 m/s.`);
  }

  if (tc6 !== null) {
    return resultado("capacidade_cardiorrespiratoria", "investigar", `TC6 = ${tc6} m coletado — comparar manualmente com a equação de valor previsto (idade/sexo/altura) antes de classificar.`);
  }

  return resultado("capacidade_cardiorrespiratoria", "investigar", "Nenhum teste de capacidade cardiorrespiratória coletado ainda.");
}

// ---------------------------------------------------------------------------
// 5. Composição corporal — IMC (OMS) + circunferência de cintura (OMS)
// ---------------------------------------------------------------------------
function avaliarComposicaoCorporal(p: PacienteRow): DomainResult {
  const peso = num(p.fisica?.peso_kg);
  const altura = num(p.fisica?.altura_cm);
  const cintura = num(p.fisica?.circ_cintura);
  const sexo = sexoNormalizado(p.sexo);

  const imc = peso !== null && altura !== null ? peso / Math.pow(altura / 100, 2) : null;

  if (imc === null && cintura === null) {
    return resultado("composicao_corporal", "investigar", "Peso/altura e circunferência de cintura ainda não registrados.");
  }

  const severidade: Record<Classificacao, number> = { adequado: 0, atencao: 1, investigar: 1, prioridade: 2 };
  let pior: Classificacao = "adequado";
  const elevar = (c: Classificacao) => {
    if (severidade[c] > severidade[pior]) pior = c;
  };
  const notas: string[] = [];

  if (imc !== null) {
    if (imc >= 30) {
      elevar("prioridade");
      notas.push(`IMC ${imc.toFixed(1)} (obesidade, critério OMS)`);
    } else if (imc >= 25 || imc < 18.5) {
      elevar("atencao");
      notas.push(`IMC ${imc.toFixed(1)} (${imc >= 25 ? "sobrepeso" : "baixo peso"}, critério OMS)`);
    } else {
      notas.push(`IMC ${imc.toFixed(1)} (eutrofia)`);
    }
  }

  if (cintura !== null && sexo !== "desconhecido") {
    const muitoAumentado = sexo === "masculino" ? cintura >= 102 : cintura >= 88;
    const aumentado = sexo === "masculino" ? cintura >= 94 : cintura >= 80;
    if (muitoAumentado) {
      elevar("prioridade");
      notas.push(`circunferência de cintura ${cintura}cm (risco cardiometabólico substancialmente aumentado, critério OMS)`);
    } else if (aumentado) {
      elevar("atencao");
      notas.push(`circunferência de cintura ${cintura}cm (risco aumentado, critério OMS)`);
    } else {
      notas.push(`circunferência de cintura ${cintura}cm (dentro da faixa esperada)`);
    }
  } else if (cintura !== null) {
    notas.push(`circunferência de cintura ${cintura}cm (sexo não registrado — corte OMS não aplicado)`);
  }

  return resultado("composicao_corporal", pior, notas.join("; ") + ".");
}

// ---------------------------------------------------------------------------
// 6. Dor
// ---------------------------------------------------------------------------
function avaliarDor(p: PacienteRow): DomainResult {
  const dor = p.anamnese?.dor;
  if (!dor || dor.tem_dor === null || dor.tem_dor === undefined) {
    return resultado("dor", "investigar", "Capítulo de dor da anamnese ainda não respondido.");
  }
  if (dor.tem_dor === false) {
    return resultado("dor", "adequado", "Paciente relata não sentir dor atualmente.");
  }
  if (dor.bandeiras_vermelhas?.length > 0) {
    return resultado("dor", "prioridade", `Bandeira(s) vermelha(s) relatada(s): ${dor.bandeiras_vermelhas.join(", ")}.`);
  }
  const nrs = dor.intensidade_nrs;
  if (nrs !== null && nrs !== undefined && nrs >= 7) {
    return resultado("dor", "prioridade", `Dor de intensidade ${nrs}/10 (NRS).`);
  }
  return resultado("dor", "atencao", `Dor relatada, intensidade ${nrs ?? "não informada"}/10 (NRS) — sem bandeira vermelha.`);
}

// ---------------------------------------------------------------------------
// 7. Estilo de vida
// ---------------------------------------------------------------------------
function avaliarEstiloDeVida(p: PacienteRow): DomainResult {
  const ev = p.anamnese?.estilo_vida;
  const af = p.anamnese?.atividade_fisica;
  const estresse = ev?.estresse_percebido;
  const barreiras = ev?.barreiras_exercicio?.length ?? 0;
  const pratica = af?.pratica_atual;

  if ((estresse === null || estresse === undefined) && (pratica === null || pratica === undefined)) {
    return resultado("estilo_de_vida", "investigar", "Estresse percebido e atividade física ainda não registrados.");
  }

  if (estresse !== null && estresse !== undefined && estresse >= 8) {
    return resultado("estilo_de_vida", "prioridade", `Estresse percebido ${estresse}/10, nível muito alto.`);
  }
  if ((estresse !== null && estresse !== undefined && estresse >= 5) || pratica === false || barreiras >= 3) {
    return resultado(
      "estilo_de_vida",
      "atencao",
      `Estresse ${estresse ?? "–"}/10${pratica === false ? ", sedentário(a)" : ""}${barreiras >= 3 ? `, ${barreiras} barreiras a exercício relatadas` : ""}.`
    );
  }
  return resultado("estilo_de_vida", "adequado", `Estresse ${estresse ?? "–"}/10, pratica atividade física, poucas barreiras relatadas.`);
}

// ---------------------------------------------------------------------------
// 8. Sono
// ---------------------------------------------------------------------------
function avaliarSono(p: PacienteRow): DomainResult {
  const s = p.anamnese?.sono;
  const q = s?.qualidade_percebida;
  if (q === null || q === undefined) {
    return resultado("sono", "investigar", "Qualidade de sono ainda não registrada.");
  }
  const problema = s?.dificuldade_iniciar === true || s?.despertares_noturnos === true;
  if (q <= 2 && problema) {
    return resultado("sono", "prioridade", `Qualidade de sono ${q}/5, com dificuldade para iniciar e/ou despertares noturnos.`);
  }
  if (q === 3 || problema || (s?.sonolencia_diurna ?? 0) >= 2) {
    return resultado("sono", "atencao", `Qualidade de sono ${q}/5${problema ? ", com queixas noturnas" : ""}.`);
  }
  return resultado("sono", "adequado", `Qualidade de sono ${q}/5, sem queixas noturnas relevantes.`);
}

// ---------------------------------------------------------------------------
// 9. Saúde mental e bem-estar — reaproveita os mesmos cortes de alerts.ts
// ---------------------------------------------------------------------------
function avaliarBemEstar(p: PacienteRow): DomainResult {
  const sm = p.anamnese?.saude_mental;
  if (!sm) return resultado("bem_estar", "investigar", "Triagem de saúde mental ainda não respondida.");

  const ideacao = sm.phq9?.[8];
  if (ideacao !== null && ideacao !== undefined && ideacao > 0) {
    return resultado("bem_estar", "prioridade", "PHQ-9: item de ideação de autolesão positivo — encaminhamento prioritário.");
  }

  const gad7 = somaSemNulos(sm.gad7);
  const phq9 = somaSemNulos(sm.phq9);

  if ((gad7 !== null && gad7 >= 15) || (phq9 !== null && phq9 >= 15)) {
    return resultado("bem_estar", "prioridade", `GAD-7 ${gad7 ?? "–"}/21, PHQ-9 ${phq9 ?? "–"}/27 (faixa sugestiva de quadro importante) — triagem, não diagnóstico.`);
  }
  if (gad7 === null && phq9 === null) {
    return resultado("bem_estar", "investigar", "GAD-7/PHQ-9 ainda não concluídos.");
  }
  if ((gad7 !== null && gad7 >= 10) || (phq9 !== null && phq9 >= 10)) {
    return resultado("bem_estar", "atencao", `GAD-7 ${gad7 ?? "–"}/21, PHQ-9 ${phq9 ?? "–"}/27 (faixa leve/moderada) — triagem, não diagnóstico.`);
  }
  return resultado("bem_estar", "adequado", `GAD-7 ${gad7 ?? "–"}/21, PHQ-9 ${phq9 ?? "–"}/27, dentro da faixa mínima.`);
}

// ---------------------------------------------------------------------------
// 10. Funcionalidade — TUG como indicador principal (corte citado na
//     literatura)
// ---------------------------------------------------------------------------
function avaliarFuncionalidade(p: PacienteRow): DomainResult {
  const tug = num(p.funcional?.tug_seg);
  const chair = num(p.funcional?.chair_stand_reps);
  const fiveSts = num(p.funcional?.five_sts_seg);

  if (tug !== null) {
    if (tug >= 12) return resultado("funcionalidade", "prioridade", `TUG = ${tug}s, no ou acima do corte de risco de queda comumente citado (≥12s).`);
    return resultado("funcionalidade", "adequado", `TUG = ${tug}s, abaixo do corte de risco de queda comumente citado.`);
  }
  if (chair !== null || fiveSts !== null) {
    return resultado("funcionalidade", "atencao", "Teste parcial coletado (Chair Stand/5xSTS), mas sem TUG para o corte de referência principal.");
  }
  return resultado("funcionalidade", "investigar", "Nenhum teste de funcionalidade coletado ainda.");
}

// ---------------------------------------------------------------------------
// Montagem final
// ---------------------------------------------------------------------------
export function calcularPerfilIntegrado(paciente: PacienteRow): PerfilIntegrado {
  const dominios: DomainResult[] = [
    avaliarForca(paciente),
    avaliarMobilidade(paciente),
    avaliarEquilibrio(paciente),
    avaliarCardio(paciente),
    avaliarComposicaoCorporal(paciente),
    avaliarDor(paciente),
    avaliarEstiloDeVida(paciente),
    avaliarSono(paciente),
    avaliarBemEstar(paciente),
    avaliarFuncionalidade(paciente),
  ];

  const potencialidades = dominios.filter((d) => d.classificacao === "adequado");
  const limitacoes = dominios.filter((d) => d.classificacao === "atencao");
  const riscos = dominios.filter((d) => d.classificacao === "prioridade");
  const investigar = dominios.filter((d) => d.classificacao === "investigar");

  // Prioridades = riscos primeiro, depois limitações (Seção 4 do Agente 6:
  // a conexão fina com o objetivo declarado do paciente fica a critério do
  // profissional na hora de montar o plano).
  const prioridades = [...riscos, ...limitacoes];

  const confianca: PerfilIntegrado["confianca"] =
    investigar.length <= 2 ? "alta" : investigar.length <= 5 ? "media" : "baixa";

  return { dominios, potencialidades, limitacoes, riscos, prioridades, confianca };
}
