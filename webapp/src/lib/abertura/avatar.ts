// Animação da tela de abertura: uma figura holográfica que "evolui" (mais massa muscular, menos gordura) enquanto os
// percentuais andam. É só uma ILUSTRAÇÃO de exemplo, não representa resultado de nenhuma pessoa nem promete resultado.
// Aqui ficam as contas (tempo, interpolação e desenho do contorno), sem acesso à tela, para poderem ser testadas.

export const CICLO_MS = 9000;
const ATRASO_MS = 600; // parado no começo
const SOBE_MS = 4500; // do "antes" ao "depois"
const SEGURA_MS = 2500; // parado no "depois"
// o resto do ciclo (1400 ms) é a volta suave ao "antes"

const suavizar = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2); // easeInOutCubic

// Progresso da evolução (0 = antes, 1 = depois) no instante t (ms), em ciclo.
export function progressoNoCiclo(t: number): number {
  const c = ((t % CICLO_MS) + CICLO_MS) % CICLO_MS;
  if (c < ATRASO_MS) return 0;
  if (c < ATRASO_MS + SOBE_MS) return suavizar((c - ATRASO_MS) / SOBE_MS);
  if (c < ATRASO_MS + SOBE_MS + SEGURA_MS) return 1;
  return 1 - suavizar((c - ATRASO_MS - SOBE_MS - SEGURA_MS) / (CICLO_MS - ATRASO_MS - SOBE_MS - SEGURA_MS));
}

export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const mistura = (antes: number[], depois: number[], p: number): number[] => antes.map((a, i) => lerp(a, depois[i], p));

type Ponto = [number, number];
const f = (n: number) => n.toFixed(1);

// Curva fechada e suave (Catmull-Rom convertida em Bézier) por uma lista de pontos.
export function caminhoSuave(pts: Ponto[]): string {
  const n = pts.length;
  if (n < 3) return "";
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Ponto = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Ponto = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + "Z";
}

// Faixa (tronco, braço ou perna): em cada altura y, um centro x e uma meia-largura. Sobe pela esquerda e desce pela direita.
export function caminhoFaixa(centros: number[], ys: number[], meiasLarguras: number[]): string {
  const esq: Ponto[] = ys.map((y, i) => [centros[i] - meiasLarguras[i], y]);
  const dir: Ponto[] = ys.map((y, i) => [centros[i] + meiasLarguras[i], y]).reverse() as Ponto[];
  return caminhoSuave([...esq, ...dir]);
}

// Valores de exemplo dos medidores (antes e depois). Ilustrativos.
export const MEDIDORES = [
  { chave: "musculo", rotulo: "Massa muscular", unidade: "%", antes: 31, depois: 42, max: 60 },
  { chave: "gordura", rotulo: "Gordura corporal", unidade: "%", antes: 32, depois: 21, max: 60 },
  { chave: "condicionamento", rotulo: "Condicionamento", unidade: "", antes: 40, depois: 78, max: 100 },
] as const;

export function valorDoMedidor(m: { antes: number; depois: number }, p: number): number {
  return lerp(m.antes, m.depois, p);
}
