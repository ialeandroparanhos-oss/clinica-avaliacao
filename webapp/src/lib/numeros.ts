// Brasileiro digita decimal com vírgula ("18,5"), mas Number("18,5") dá NaN.
// Todo número digitado pelo avaliador passa por aqui antes de virar conta.

export function paraNumero(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/,/g, ".");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function normalizarDecimal(texto: string): string {
  return texto.replace(/,/g, ".");
}
