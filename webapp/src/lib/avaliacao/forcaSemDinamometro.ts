// Força sem dinamômetro - cortes de referência para quando a preensão manual
// não foi medida. O painel integrado usa estes testes (nesta ordem de peso):
//
//  1. 5x Sit-to-Stand > 15 s  -> força reduzida (EWGSOP2, 2019). É o corte
//     "ideal" do consenso para substituir a dinamometria; vale para adultos
//     em geral (não depende de idade/sexo).
//  2. 30s Chair Stand e Arm Curl (Rikli & Jones) abaixo do limite inferior
//     da faixa normal para idade/sexo (60 anos ou mais). Dois testes
//     abaixo do limite = prioridade; um só = atenção.
//
// Os valores de Rikli & Jones foram reproduzidos da tabela de "faixa normal"
// publicada no Senior Fitness Test - CONFIRMAR com a apostila/fonte oficial
// antes do uso clínico formal (mesmo padrão das demais referências do app).

import type { SexoComp } from "./composicaoCorporal";

export const CORTE_5STS_SEG = 15;

type FaixaRikli = { ate: number; chair: number; curl: number };

// Limite INFERIOR da faixa normal (abaixo disso = "abaixo da média").
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

export type ResultadoForcaSemDina = {
  classificacao: "adequado" | "atencao" | "prioridade" | "investigar";
  justificativa: string;
};

export function avaliarForcaSemDinamometro(entrada: {
  fiveStsSeg: number | null;
  chairReps: number | null;
  armCurlReps: number | null;
  idade: number | null;
  sexo: SexoComp;
}): ResultadoForcaSemDina {
  const { fiveStsSeg, chairReps, armCurlReps, idade, sexo } = entrada;
  const limites = limitesRikli(idade, sexo);

  // 1) Corte do consenso: 5xSTS > 15 s
  if (fiveStsSeg !== null) {
    if (fiveStsSeg > CORTE_5STS_SEG) {
      return {
        classificacao: "prioridade",
        justificativa: `Sem dinamometria: 5x Sit-to-Stand em ${fiveStsSeg}s, acima do corte de força reduzida do EWGSOP2 (> ${CORTE_5STS_SEG}s).`,
      };
    }
  }

  // 2) Rikli & Jones (60+)
  const abaixo: string[] = [];
  const dentro: string[] = [];
  if (limites) {
    if (chairReps !== null) {
      (chairReps < limites.chair ? abaixo : dentro).push(`Chair Stand ${chairReps} reps (mínimo da faixa normal: ${limites.chair})`);
    }
    if (armCurlReps !== null) {
      (armCurlReps < limites.curl ? abaixo : dentro).push(`Arm Curl ${armCurlReps} reps (mínimo da faixa normal: ${limites.curl})`);
    }
  }

  if (abaixo.length >= 2) {
    return { classificacao: "prioridade", justificativa: `Sem dinamometria: ${abaixo.join("; ")} - dois testes abaixo da faixa normal de Rikli & Jones para idade/sexo.` };
  }
  if (abaixo.length === 1) {
    return { classificacao: "atencao", justificativa: `Sem dinamometria: ${abaixo[0]}, abaixo da faixa normal de Rikli & Jones para idade/sexo.` };
  }

  if (fiveStsSeg !== null || dentro.length > 0) {
    const partes: string[] = [];
    if (fiveStsSeg !== null) partes.push(`5x Sit-to-Stand ${fiveStsSeg}s (corte EWGSOP2: até ${CORTE_5STS_SEG}s)`);
    partes.push(...dentro);
    return { classificacao: "adequado", justificativa: `Sem dinamometria: ${partes.join("; ")} - dentro dos cortes de referência.` };
  }

  // Há dado, mas sem corte aplicável (ex.: chair stand/arm curl em < 60 anos ou sem sexo)
  if (chairReps !== null || armCurlReps !== null) {
    const motivo = idade !== null && idade < 60 ? "os cortes de Rikli & Jones valem a partir dos 60 anos" : "faltam idade e sexo para aplicar os cortes de Rikli & Jones";
    return { classificacao: "atencao", justificativa: `Testes de força coletados sem dinamometria, mas ${motivo}. Registre o 5x Sit-to-Stand (corte EWGSOP2) para classificar.` };
  }

  return { classificacao: "investigar", justificativa: "Nenhum indicador de força coletado ainda." };
}
