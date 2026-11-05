// TC6: distância prevista para a população brasileira (informativo).
//
// Equação de Britto et al., Braz J Phys Ther 2013;17:556 (PMID 24271092), 617 adultos
// saudáveis de várias regiões do Brasil, modelo só com dados demográficos e antropométricos:
//   TC6 previsto (m) = 890,46 - 6,11 x idade + 0,0345 x idade^2 + 48,87 x sexo - 4,87 x IMC
// O estudo mostrou 54 m a mais nos homens; por isso o sexo entra como 1 = homem e 0 = mulher
// (a codificação não está escrita no resumo: [confirmar no artigo completo]).
//
// Limites: vale para o corredor padrão de 30 m. O artigo (resumo, PMID 24271092) não traz limite inferior
// da normalidade. Por decisão do profissional (05/11/2026), para a capacidade funcional ser lida também só com o TC6,
// o sistema usa um CORTE PRÁTICO de 80% do previsto: 80% ou mais = dentro do esperado; abaixo = atenção. É regra do
// sistema, SEM validação publicada; a leitura continua sendo do avaliador.

export function tc6Previsto(idade: number | null, sexo: "masculino" | "feminino" | "desconhecido", imc: number | null): number | null {
  if (idade === null || idade < 18 || imc === null || sexo === "desconhecido") return null;
  const g = sexo === "masculino" ? 1 : 0;
  return 890.46 - 6.11 * idade + 0.0345 * idade * idade + 48.87 * g - 4.87 * imc;
}

export function percentualDoPrevisto(metros: number | null, previsto: number | null): number | null {
  if (metros === null || previsto === null || previsto <= 0) return null;
  return (metros / previsto) * 100;
}

export const CORTE_TC6_PCT_DO_PREVISTO = 80;

export type LeituraTC6 = { metros: number; previsto: number; pct: number; leitura: "ok" | "atencao" };

// Lê o TC6 do paciente: precisa dos metros, da idade, do sexo, do IMC e do corredor padrão de 30 m (ou formato em branco).
// Sem isso devolve null (o TC6 fica só para acompanhar o próprio paciente, sem comparação).
export function lerTC6(
  funcional: Record<string, any> | undefined,
  idade: number | null,
  sexo: "masculino" | "feminino" | "desconhecido",
  imc: number | null
): LeituraTC6 | null {
  const bruto = funcional?.tc6_metros;
  const metros = typeof bruto === "number" ? bruto : parseFloat(String(bruto ?? "").replace(",", "."));
  if (!Number.isFinite(metros) || metros <= 0) return null;
  const formato = funcional?.tc6_formato;
  if (formato && formato !== "Corredor de 30 m (padrão)") return null;
  const previsto = tc6Previsto(idade, sexo, imc);
  const pct = percentualDoPrevisto(metros, previsto);
  if (previsto === null || pct === null) return null;
  return { metros, previsto, pct, leitura: pct >= CORTE_TC6_PCT_DO_PREVISTO ? "ok" : "atencao" };
}