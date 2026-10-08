// TC6: distância prevista para a população brasileira (informativo).
//
// Equação de Britto et al., Braz J Phys Ther 2013;17:556 (PMID 24271092), 617 adultos
// saudáveis de várias regiões do Brasil, modelo só com dados demográficos e antropométricos:
//   TC6 previsto (m) = 890,46 - 6,11 x idade + 0,0345 x idade^2 + 48,87 x sexo - 4,87 x IMC
// O estudo mostrou 54 m a mais nos homens; por isso o sexo entra como 1 = homem e 0 = mulher
// (a codificação não está escrita no resumo: [confirmar no artigo completo]).
//
// Limites: vale para o corredor padrão de 30 m. NÃO há corte de classificação adotado (o
// resumo do artigo não traz limite inferior da normalidade); o % do previsto serve para
// acompanhar e conversar, não para classificar.

export function tc6Previsto(idade: number | null, sexo: "masculino" | "feminino" | "desconhecido", imc: number | null): number | null {
  if (idade === null || idade < 18 || imc === null || sexo === "desconhecido") return null;
  const g = sexo === "masculino" ? 1 : 0;
  return 890.46 - 6.11 * idade + 0.0345 * idade * idade + 48.87 * g - 4.87 * imc;
}

export function percentualDoPrevisto(metros: number | null, previsto: number | null): number | null {
  if (metros === null || previsto === null || previsto <= 0) return null;
  return (metros / previsto) * 100;
}
