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
import { CORTE_PORTA_PHQ2, escorePSS10, somaSemNulos, escoreCurto } from "@/lib/anamnese/alerts";
import { calcularPSQI } from "@/lib/anamnese/psqi";
import { paraNumero } from "@/lib/numeros";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { avaliarForca as avaliarForcaIntegrada } from "@/lib/avaliacao/forca";
import { classificarCircAbdominal, classificarRCEst, confirmarAdiposidade, relacaoCinturaEstatura } from "@/lib/avaliacao/composicaoCorporal";
import { avaliarMobilidadeObjetiva } from "@/lib/avaliacao/mobilidade";
import { avaliarVO2max, ROTULO_CLASSE_VO2, vo2maxDeRegistro, type ClasseVO2 } from "@/lib/avaliacao/cardiorrespiratoria";

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

const num = paraNumero;

function resultado(chave: DomainKey, classificacao: Classificacao, justificativa: string): DomainResult {
  return { chave, titulo: TITULOS[chave], classificacao, justificativa };
}

// ---------------------------------------------------------------------------
// 1. Força — ponto de corte único, com ou sem dinamômetro: qualquer indicador
//    abaixo do corte (dinamometria brasileira 60+, 5x Sit-to-Stand > 15 s ou
//    dois testes de Rikli & Jones) = força reduzida (ver
//    lib/avaliacao/forca.ts)
// ---------------------------------------------------------------------------
function avaliarForca(p: PacienteRow): DomainResult {
  const d = num(p.funcional?.dinamometria_d_kg);
  const e = num(p.funcional?.dinamometria_e_kg);
  const melhorMao = d !== null && e !== null ? Math.max(d, e) : d ?? e;

  const r = avaliarForcaIntegrada({
    dinamometriaKgf: melhorMao,
    fiveStsSeg: num(p.funcional?.five_sts_seg),
    chairReps: num(p.funcional?.chair_stand_reps),
    armCurlReps: num(p.funcional?.arm_curl_reps),
    idade: idadeEfetiva(p),
    sexo: sexoEfetivo(p),
  });
  return resultado("forca", r.classificacao, r.justificativa);
}

// ---------------------------------------------------------------------------
// 2. Mobilidade — testes objetivos (assimetria D/E em graus e restrição observada
//    no agachamento; ver lib/avaliacao/mobilidade.ts). As observações posturais em
//    texto livre NÃO entram: achado postural isolado não é medida nem risco.
// ---------------------------------------------------------------------------
function avaliarMobilidade(p: PacienteRow): DomainResult {
  const r = avaliarMobilidadeObjetiva(p.funcional);
  return resultado("mobilidade", r.classificacao, r.justificativa);
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
// 4. Capacidade cardiorrespiratória — VO2máx do teste de esteira/Cooper
//    (classificado por idade e sexo) + velocidade de marcha; TC6 exige
//    equação de referência que o sistema ainda não calcula
//
//    Denominador comum: cada indicador com corte de referência vira uma nota
//    de 0 (adequado), 1 (atenção) ou 2 (prioridade); o resultado do domínio
//    é a MÉDIA das notas (< 0,5 adequado; < 1,5 atenção; >= 1,5 prioridade).
//    Indicadores sem corte (TC6) aparecem na justificativa mas não entram na
//    média. Se os indicadores divergirem, a justificativa avisa.
// ---------------------------------------------------------------------------
const CLASSE_VO2_NOTA: Record<ClasseVO2, number> = { muito_fraco: 2, fraco: 2, regular: 1, bom: 0, excelente: 0 };

function avaliarCardio(p: PacienteRow): DomainResult {
  const chave = "capacidade_cardiorrespiratoria" as const;
  const vel = num(p.funcional?.velocidade_marcha_ms);
  const tc6 = num(p.funcional?.tc6_metros);
  const vo2 = vo2maxDeRegistro(p.cardio);

  const notas: { nome: string; nota: number }[] = [];
  const extras: string[] = [];

  if (vo2 !== null) {
    // Estimativa de campo/esteira: arredondada (a precisão é de alguns
    // mL/kg/min); só o VO2 medido em ergoespirometria mantém a casa decimal.
    const medido = num(p.cardio?.vo2max_manual) !== null;
    const metTxt = vo2 / 3.5 < 5 ? `; ${(vo2 / 3.5).toFixed(1).replace(".", ",")} METs, aptidão baixa (< 5 METs)` : "";
    const texto = `${medido ? vo2.toFixed(1) : `≈ ${Math.round(vo2)}`} mL/kg/min${metTxt}`;
    const av = avaliarVO2max(vo2, idadeEfetiva(p), sexoEfetivo(p));
    if (av) {
      const ressalva = av.extrapolado ? `, faixa ${av.faixaEtaria} usada por aproximação` : "";
      notas.push({
        nome: `VO2máx ${texto} (${av.textoPercentil} para idade/sexo na referência FRIEND de esteira - ${ROTULO_CLASSE_VO2[av.classe]}${ressalva})`,
        nota: CLASSE_VO2_NOTA[av.classe],
      });
    } else {
      extras.push(`VO2máx ${texto} (faltam idade/sexo para classificar)`);
    }
  }

  if (vel !== null) {
    // EWGSOP2: velocidade de marcha <= 0,8 m/s (indicador de sarcopenia grave e
    // de pior desfecho); 0,8 exato já conta.
    const nota = vel <= 0.8 ? 2 : vel < 1.0 ? 1 : 0;
    const faixa = vel <= 0.8 ? "0,8 m/s ou menos" : vel < 1.0 ? "entre 0,8 e 1,0 m/s" : "1,0 m/s ou mais";
    notas.push({ nome: `velocidade de marcha ${vel} m/s (${faixa})`, nota });
  }

  if (tc6 !== null) extras.push(`TC6 ${tc6} m (sem corte aplicado - comparar com a equação de valor previsto)`);

  if (notas.length === 0) {
    if (extras.length > 0) return resultado(chave, "investigar", `${extras.join("; ")}. Nenhum indicador com corte de referência para classificar.`);
    return resultado(chave, "investigar", "Nenhum teste de capacidade cardiorrespiratória coletado ainda.");
  }

  const media = notas.reduce((s, n) => s + n.nota, 0) / notas.length;
  const classificacao: Classificacao = media < 0.5 ? "adequado" : media < 1.5 ? "atencao" : "prioridade";
  const partes = notas.map((n) => n.nome);
  let texto = partes.join("; ");
  if (notas.length > 1) {
    texto += ` - média das notas ${media.toFixed(1).replace(".", ",")} (0 adequado, 1 atenção, 2 prioridade)`;
    const notasDistintas = new Set(notas.map((n) => n.nota));
    if (notasDistintas.size > 1) texto += "; indicadores divergentes, interprete o conjunto";
  }
  if (extras.length > 0) texto += `. Também: ${extras.join("; ")}`;
  return resultado(chave, classificacao, texto + (texto.endsWith(".") ? "" : "."));
}

// ---------------------------------------------------------------------------
// 5. Composição corporal — IMC (OMS) + circunferência de cintura (OMS)
// ---------------------------------------------------------------------------
function avaliarComposicaoCorporal(p: PacienteRow): DomainResult {
  const peso = num(p.fisica?.peso_kg);
  const altura = num(p.fisica?.altura_cm);
  const cintura = num(p.fisica?.circ_cintura);
  const sexo = sexoEfetivo(p);

  const imc = peso !== null && altura !== null ? peso / Math.pow(altura / 100, 2) : null;

  if (imc === null && cintura === null && num(p.fisica?.circ_abdomen) === null) {
    return resultado("composicao_corporal", "investigar", "Peso/altura e circunferência de cintura/abdômen ainda não registrados.");
  }

  const severidade: Record<Classificacao, number> = { adequado: 0, atencao: 1, investigar: 1, prioridade: 2 };
  let pior: Classificacao = "adequado";
  const elevar = (c: Classificacao) => {
    if (severidade[c] > severidade[pior]) pior = c;
  };
  const notas: string[] = [];

  const quadril = num(p.fisica?.circ_quadril);
  const rcq = cintura !== null && quadril !== null && quadril > 0 ? cintura / quadril : null;
  const rcest = relacaoCinturaEstatura(cintura, altura);
  const adiposidade = confirmarAdiposidade({ imc, cinturaCm: cintura, rcq, rcest, sexo });
  const textoAdiposidade =
    adiposidade === null
      ? ""
      : adiposidade.estado === "confirmada"
        ? `; adiposidade central confirmada por ${adiposidade.criterios.join(", ")}`
        : adiposidade.estado === "nao_confirmada"
          ? `; sem sinal de excesso de adiposidade central em ${adiposidade.avaliados.join(", ")} - confirmar pelo %G`
          : "; adiposidade a confirmar (sem cintura/RCQ/RCEst)";

  if (imc !== null) {
    if (imc >= 30) {
      elevar("prioridade");
      notas.push(`IMC ${imc.toFixed(1)} (obesidade, critério OMS${textoAdiposidade})`);
    } else if (imc >= 25 || imc < 18.5) {
      elevar("atencao");
      notas.push(`IMC ${imc.toFixed(1)} (${imc >= 25 ? "sobrepeso" : "baixo peso"}, critério OMS${textoAdiposidade})`);
    } else {
      notas.push(`IMC ${imc.toFixed(1)} (eutrofia)`);
    }
  }

  if (rcest !== null) {
    const txt = rcest.toFixed(2).replace(".", ",");
    if (classificarRCEst(rcest) === "aumentado") {
      elevar("atencao");
      notas.push(`relação cintura/estatura ${txt} (≥ 0,5, risco aumentado, corte do NICE)`);
    } else {
      notas.push(`relação cintura/estatura ${txt} (< 0,5)`);
    }
  }

  // Cintura (corte da OMS); se não houve cintura, o abdômen medido no umbigo
  // entra como aproximação, com o aviso de que o corte foi definido p/ cintura.
  const abdomen = num(p.fisica?.circ_abdomen);
  const medidaTronco = cintura !== null ? cintura : abdomen;
  const nomeMedida = cintura !== null ? "cintura" : "abdômen (usado como aproximação da cintura)";
  if (medidaTronco !== null && sexo !== "desconhecido") {
    const classe = classificarCircAbdominal(medidaTronco, sexo);
    if (classe === "muito_aumentado") {
      elevar("prioridade");
      notas.push(`circunferência de ${nomeMedida} ${medidaTronco}cm (risco cardiometabólico substancialmente aumentado, critério OMS)`);
    } else if (classe === "aumentado") {
      elevar("atencao");
      notas.push(`circunferência de ${nomeMedida} ${medidaTronco}cm (risco aumentado, critério OMS)`);
    } else {
      notas.push(`circunferência de ${nomeMedida} ${medidaTronco}cm (dentro da faixa esperada)`);
    }
  } else if (medidaTronco !== null) {
    notas.push(`circunferência de ${nomeMedida} ${medidaTronco}cm (sexo não registrado — corte OMS não aplicado)`);
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
    return resultado("estilo_de_vida", "investigar", "Atividade física atual (e, se aplicado, estresse percebido) ainda não registrados.");
  }

  if (estresse !== null && estresse !== undefined && estresse >= 8) {
    return resultado("estilo_de_vida", "prioridade", `Estresse percebido ${estresse}/10, nível muito alto.`);
  }
  if ((estresse !== null && estresse !== undefined && estresse >= 5) || pratica === false || barreiras >= 3) {
    const partes = [
      estresse !== null && estresse !== undefined ? `estresse ${estresse}/10` : null,
      pratica === false ? "sedentário(a)" : null,
      barreiras >= 3 ? `${barreiras} barreiras a exercício relatadas` : null,
    ].filter(Boolean);
    return resultado("estilo_de_vida", "atencao", `${partes.join(", ")}.`.replace(/^./, (c) => c.toUpperCase()));
  }
  return resultado(
    "estilo_de_vida",
    "adequado",
    `${estresse !== null && estresse !== undefined ? `Estresse ${estresse}/10, p` : "P"}ratica atividade física, poucas barreiras relatadas.`
  );
}

// ---------------------------------------------------------------------------
// 8. Sono
// ---------------------------------------------------------------------------
function avaliarSono(p: PacienteRow): DomainResult {
  const psqi = p.anamnese ? calcularPSQI(p.anamnese) : null;
  if (psqi !== null) {
    if (psqi.global > 10) {
      return resultado("sono", "prioridade", `PSQI = ${psqi.global}/21, bem acima do corte de 5 para sono de má qualidade.`);
    }
    if (psqi.global > 5) {
      return resultado("sono", "atencao", `PSQI = ${psqi.global}/21, acima do corte de 5 para sono de má qualidade.`);
    }
    return resultado("sono", "adequado", `PSQI = ${psqi.global}/21, dentro da faixa considerada de boa qualidade pelo instrumento.`);
  }

  // PSQI incompleto - usa as perguntas simplificadas de triagem como apoio.
  const s = p.anamnese?.sono;
  const q = s?.qualidade_percebida;
  if (q === null || q === undefined) {
    return resultado("sono", "investigar", "PSQI e triagem simplificada de sono ainda não respondidos.");
  }
  const problema = s?.dificuldade_iniciar === true || s?.despertares_noturnos === true;
  if (q <= 2 && problema) {
    return resultado("sono", "prioridade", `Qualidade de sono ${q}/5, com dificuldade para iniciar e/ou despertares noturnos (PSQI incompleto).`);
  }
  if (q === 3 || problema || (s?.sonolencia_diurna ?? 0) >= 2) {
    return resultado("sono", "atencao", `Qualidade de sono ${q}/5${problema ? ", com queixas noturnas" : ""} (PSQI incompleto).`);
  }
  return resultado("sono", "adequado", `Qualidade de sono ${q}/5, sem queixas noturnas relevantes (PSQI incompleto).`);
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
    // GAD-7/PHQ-9 completos só são aplicados quando a triagem curta
    // (GAD-2/PHQ-2) indica necessidade - uma triagem curta negativa é
    // informação válida (provável ausência de quadro relevante), não
    // dado ausente. As DUAS precisam ter sido resolvidas como negativas
    // (AND, não OR) - se uma delas deu positiva e o instrumento completo
    // ficou incompleto, isso é dado faltando, não triagem negativa.
    const gad2 = escoreCurto(sm.gad7);
    const phq2 = escoreCurto(sm.phq9);
    const gad2Negativo = gad2 !== null && gad2 < 3;
    const phq2Negativo = phq2 !== null && phq2 < CORTE_PORTA_PHQ2;
    if (gad2Negativo && phq2Negativo) {
      return resultado(
        "bem_estar",
        "adequado",
        `Triagem curta negativa (GAD-2 ${gad2 ?? "–"}/6, PHQ-2 ${phq2 ?? "–"}/6) - instrumento completo não foi necessário.`
      );
    }
    // Questionário de bem-estar (módulo à parte) ainda não respondido: o que
    // existe é só a pergunta inicial do questionário base (não é escala
    // validada, apenas decide se o módulo é oferecido).
    const sinal = sm.sinalizacao;
    if (sinal === "sim") {
      return resultado("bem_estar", "atencao", "O paciente relatou que estresse, ansiedade ou humor atrapalham bastante o dia a dia; o questionário de bem-estar emocional ainda não foi respondido - oferecer e acolher.");
    }
    if (sinal === "um_pouco") {
      return resultado("bem_estar", "investigar", "O paciente relatou que estresse, ansiedade ou humor atrapalham um pouco o dia a dia; o questionário de bem-estar emocional (opcional) ainda não foi respondido.");
    }
    if (sinal === "nao") {
      return resultado("bem_estar", "investigar", "Sem queixa emocional na pergunta inicial (pergunta única, não é escala validada); questionário de bem-estar não aplicado.");
    }
    if (sinal === "prefiro_nao_responder") {
      return resultado("bem_estar", "investigar", "O paciente preferiu não responder à pergunta inicial sobre bem-estar emocional; questionário não aplicado.");
    }
    return resultado("bem_estar", "investigar", "Bem-estar emocional ainda não avaliado (pergunta inicial e questionário de bem-estar sem resposta).");
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
    // 12 s = triagem (STEADI); 13,5 s = alto risco. O TUG confirma risco melhor
    // do que o descarta (sensibilidade ~0,31, especificidade ~0,74 em
    // meta-análise): nunca deve ser usado isoladamente.
    if (tug >= 13.5) return resultado("funcionalidade", "prioridade", `TUG = ${tug}s, no ou acima de 13,5s (alto risco de queda). Interpretar junto com os demais testes e o histórico de quedas - o TUG não deve ser usado isolado.`);
    if (tug >= 12) return resultado("funcionalidade", "atencao", `TUG = ${tug}s, entre 12s (corte de triagem do STEADI) e 13,5s (alto risco). O TUG sozinho descarta mal o risco de queda - interpretar junto com os demais testes.`);
    return resultado("funcionalidade", "adequado", `TUG = ${tug}s, abaixo de 12s (corte de triagem). Um TUG normal não exclui risco de queda - considerar histórico de quedas e demais testes.`);
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
