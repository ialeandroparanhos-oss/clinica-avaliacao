// Força - ponto de corte único para o painel integrado, com ou sem dinamômetro.
//
// Regra (a mesma lógica do consenso EWGSOP2, em que QUALQUER indicador
// abaixo do corte basta para "força reduzida"):
//
//   PRIORIDADE (força reduzida) se QUALQUER um destes:
//     - dinamometria (melhor mão) abaixo do corte por sexo/idade
//     - 5x Sit-to-Stand > 15 s (EWGSOP2)
//     - Chair Stand E Arm Curl (60+) ambos abaixo da faixa normal de Rikli & Jones
//   ATENÇÃO se: um só teste de Rikli & Jones (60+) abaixo da faixa normal, ou
//     5x Sit-to-Stand pior que a média da faixa etária (60+, abaixo de 15 s),
//     ou dado coletado sem corte aplicável.
//   ADEQUADO se há ao menos um indicador com corte aplicável e nenhum sinalizado.
//
// Dinamometria: referência brasileira (60+). Homens 25,3 kgf e mulheres
// 16 kgf (triagem de sarcopenia em idosos da comunidade no Brasil, PeerJ
// 2021 - CONFIRMAR idade mínima e critério de derivação no artigo). Abaixo
// de 60 anos e para sexo não informado o app não tem referência brasileira
// própria: usa o corte do EWGSOP2 (27/16 kgf).
//
// Rikli & Jones: limite inferior da faixa normal (percentis 25-75) do Senior
// Fitness Test (manual, 2ª ed., 2013; n = 7.183 adultos de 60-94 anos da
// comunidade, EUA). Chair Stand e Arm Curl conferidos contra duas tabelas
// secundárias independentes (fitnessnorms.com e topendsports.com/Jones & Rikli
// 2002): os 14 limites de Arm Curl por sexo/faixa etária coincidem. Pesos do
// Arm Curl: 2,3 kg (5 lb) mulheres e 3,6 kg (8 lb) homens. Os padrões
// criteriais de independência funcional (Rikli & Jones, Gerontologist 2013,
// https://doi.org/10.1093/geront/gns071) existem, mas os valores não foram
// obtidos. O Arm Curl mede resistência de flexores do cotovelo (correlação
// apenas moderada com a preensão manual), por isso pesa menos que a
// dinamometria e o 5xSTS na regra.

import type { SexoComp } from "./composicaoCorporal";

export const CORTE_5STS_SEG = 15;

export type CorteDinamometria = { kgf: number; fonte: string };

export function corteDinamometriaKgf(idade: number | null, sexo: SexoComp): CorteDinamometria | null {
  if (sexo === "desconhecido") return null;
  if (sexo === "feminino") {
    return { kgf: 16, fonte: idade !== null && idade >= 60 ? "referência brasileira, 60+" : "EWGSOP2" };
  }
  if (idade !== null && idade >= 60) return { kgf: 25.3, fonte: "referência brasileira, 60+" };
  return { kgf: 27, fonte: "EWGSOP2" };
}

// 5x Sit-to-Stand: tempo acima do qual o desempenho é pior que a média da
// faixa etária (meta-análise descritiva de Bohannon: 11,4 s aos 60-69, 12,6 s
// aos 70-79 e 14,8 s aos 80-89 anos - CONFIRMAR na fonte). Fica abaixo do
// corte de força reduzida do EWGSOP2 (15 s) e só gera "atenção".
export function limite5stsPorIdade(idade: number | null): { seg: number; faixa: string } | null {
  if (idade === null || idade < 60) return null;
  if (idade < 70) return { seg: 11.4, faixa: "60-69" };
  if (idade < 80) return { seg: 12.6, faixa: "70-79" };
  return { seg: 14.8, faixa: "80+" };
}

type FaixaRikli = { ate: number; chair: number; curl: number };

const RIKLI_MULHERES: FaixaRikli[] = [
  { ate: 64, chair: 12, curl: 13 },
  { ate: 69, chair: 11, curl: 12 },
  { ate: 74, chair: 10, curl: 12 },
  { ate: 79, chair: 10, curl: 11 },
  { ate: 84, chair: 9, curl: 10 },
  { ate: 89, chair: 8, curl: 10 },
  { ate: 200, chair: 4, curl: 8 },
];
const RIKLI_HOMENS: FaixaRikli[] = [
  { ate: 64, chair: 14, curl: 16 },
  { ate: 69, chair: 12, curl: 15 },
  { ate: 74, chair: 12, curl: 14 },
  { ate: 79, chair: 11, curl: 13 },
  { ate: 84, chair: 10, curl: 13 },
  { ate: 89, chair: 8, curl: 11 },
  { ate: 200, chair: 7, curl: 10 },
];

export function limitesRikli(idade: number | null, sexo: SexoComp): { chair: number; curl: number } | null {
  if (idade === null || idade < 60 || sexo === "desconhecido") return null;
  const tabela = sexo === "feminino" ? RIKLI_MULHERES : RIKLI_HOMENS;
  const faixa = tabela.find((f) => idade <= f.ate);
  return faixa ? { chair: faixa.chair, curl: faixa.curl } : null;
}

export type ResultadoForca = {
  classificacao: "adequado" | "atencao" | "prioridade" | "investigar";
  justificativa: string;
};

export function avaliarForca(entrada: {
  dinamometriaKgf: number | null;
  fiveStsSeg: number | null;
  chairReps: number | null;
  armCurlReps: number | null;
  idade: number | null;
  sexo: SexoComp;
}): ResultadoForca {
  const { dinamometriaKgf, fiveStsSeg, chairReps, armCurlReps, idade, sexo } = entrada;
  const limites = limitesRikli(idade, sexo);
  const corteDina = corteDinamometriaKgf(idade, sexo);

  const reduzida: string[] = [];
  const rikliAbaixo: string[] = [];
  const dentro: string[] = [];
  const semCorte: string[] = [];

  if (dinamometriaKgf !== null) {
    if (corteDina) {
      const texto = `dinamometria ${dinamometriaKgf} kgf (corte ${String(corteDina.kgf).replace(".", ",")} kgf, ${corteDina.fonte})`;
      (dinamometriaKgf < corteDina.kgf ? reduzida : dentro).push(texto);
    } else {
      semCorte.push(`dinamometria ${dinamometriaKgf} kgf (sexo não registrado para aplicar o corte)`);
    }
  }

  const stsAtencao: string[] = [];
  if (fiveStsSeg !== null) {
    const faixaIdade = limite5stsPorIdade(idade);
    if (fiveStsSeg > CORTE_5STS_SEG) {
      reduzida.push(`5x Sit-to-Stand ${fiveStsSeg}s (corte EWGSOP2: até ${CORTE_5STS_SEG}s)`);
    } else if (faixaIdade && fiveStsSeg > faixaIdade.seg) {
      stsAtencao.push(`5x Sit-to-Stand ${fiveStsSeg}s (acima de ${String(faixaIdade.seg).replace(".", ",")}s, pior que a média de ${faixaIdade.faixa} anos; corte EWGSOP2: ${CORTE_5STS_SEG}s)`);
    } else {
      dentro.push(`5x Sit-to-Stand ${fiveStsSeg}s (corte EWGSOP2: até ${CORTE_5STS_SEG}s)`);
    }
  }

  if (limites) {
    if (chairReps !== null) {
      (chairReps < limites.chair ? rikliAbaixo : dentro).push(`Chair Stand ${chairReps} reps (mínimo da faixa normal: ${limites.chair})`);
    }
    if (armCurlReps !== null) {
      (armCurlReps < limites.curl ? rikliAbaixo : dentro).push(`Arm Curl ${armCurlReps} reps (mínimo da faixa normal: ${limites.curl})`);
    }
  } else {
    if (chairReps !== null) semCorte.push(`Chair Stand ${chairReps} reps`);
    if (armCurlReps !== null) semCorte.push(`Arm Curl ${armCurlReps} reps`);
  }

  if (reduzida.length > 0) {
    const extras = [...rikliAbaixo.map((t) => `${t} abaixo da faixa`), ...dentro];
    const complemento = extras.length > 0 ? ` Demais: ${extras.join("; ")}.` : "";
    return {
      classificacao: "prioridade",
      justificativa: `Força reduzida: ${reduzida.join("; ")} - abaixo do corte (qualquer indicador abaixo basta, critério do EWGSOP2).${complemento}`,
    };
  }

  if (rikliAbaixo.length >= 2) {
    return { classificacao: "prioridade", justificativa: `Força reduzida: ${rikliAbaixo.join("; ")} - dois testes abaixo da faixa normal de Rikli & Jones para idade/sexo.` };
  }
  if (rikliAbaixo.length === 1 || stsAtencao.length > 0) {
    const alertas = [...rikliAbaixo.map((t) => `${t}, abaixo da faixa normal de Rikli & Jones para idade/sexo`), ...stsAtencao];
    const complemento = dentro.length > 0 ? ` Demais: ${dentro.join("; ")}.` : "";
    return { classificacao: "atencao", justificativa: `${alertas.join("; ")}.${complemento}` };
  }

  if (dentro.length > 0) {
    return { classificacao: "adequado", justificativa: `Dentro dos cortes de referência: ${dentro.join("; ")}.` };
  }

  if (semCorte.length > 0) {
    const motivo =
      idade !== null && idade < 60
        ? "os cortes de Rikli & Jones valem a partir dos 60 anos"
        : "faltam idade e/ou sexo para aplicar os cortes";
    return {
      classificacao: "atencao",
      justificativa: `Coletado: ${semCorte.join("; ")}, mas ${motivo}. Registre o 5x Sit-to-Stand (corte EWGSOP2) ou a dinamometria para classificar.`,
    };
  }

  return { classificacao: "investigar", justificativa: "Nenhum indicador de força coletado ainda." };
}
