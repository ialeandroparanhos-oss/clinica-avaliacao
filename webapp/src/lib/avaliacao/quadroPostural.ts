// Foto postural a partir de um vídeo curto: o aluno fica parado alguns segundos e o sistema escolhe, entre os quadros,
// o que tem o corpo inteiro visível e menos movimento em volta. O quadro escolhido vira a foto da vista e segue a mesma
// análise automática da foto enviada. Funções puras, sem acesso a vídeo ou câmera, para poderem ser testadas.

import type { NomePonto, Ponto, Pontos } from "./analisePostural";

export type QuadroPose = { t: number; pontos: Pontos };

const CHAVES: NomePonto[] = ["ombro_e", "ombro_d", "quadril_e", "quadril_d", "joelho_e", "joelho_d", "tornozelo_e", "tornozelo_d"];

export const VISIBILIDADE_MINIMA = 0.6; // média da visibilidade dos 8 pontos do corpo; abaixo disso o quadro não serve
export const QUADROS_POR_VIDEO_POSTURAL = 12;

export function visibilidadeMedia(p: Pontos): number {
  return CHAVES.reduce((s, n) => s + (p[n]?.v ?? 0), 0) / CHAVES.length;
}

const media = (a: Ponto, b: Ponto) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Centro do tronco (meio dos ombros e dos quadris) e o comprimento do tronco, para medir o quanto a pessoa se mexeu.
function centroETronco(p: Pontos): { x: number; y: number; tronco: number } | null {
  const { ombro_e, ombro_d, quadril_e, quadril_d } = p;
  if (!ombro_e || !ombro_d || !quadril_e || !quadril_d) return null;
  const o = media(ombro_e, ombro_d);
  const q = media(quadril_e, quadril_d);
  return { x: (o.x + q.x) / 2, y: (o.y + q.y) / 2, tronco: Math.hypot(o.x - q.x, o.y - q.y) };
}

// Índice do melhor quadro (corpo inteiro visível e o mais parado), ou null se em nenhum a pessoa aparece inteira.
export function escolherQuadroParado(quadros: QuadroPose[]): number | null {
  let melhor: number | null = null;
  let melhorNota = -Infinity;
  for (let i = 0; i < quadros.length; i++) {
    const vis = visibilidadeMedia(quadros[i].pontos);
    if (vis < VISIBILIDADE_MINIMA) continue;
    const c = centroETronco(quadros[i].pontos);
    if (!c || c.tronco <= 0) continue;
    const deslocs: number[] = [];
    for (const j of [i - 1, i + 1]) {
      const v = quadros[j] ? centroETronco(quadros[j].pontos) : null;
      if (v) deslocs.push(Math.hypot(c.x - v.x, c.y - v.y) / c.tronco);
    }
    const mov = deslocs.length > 0 ? deslocs.reduce((a, b) => a + b, 0) / deslocs.length : 0.5; // sem vizinho para comparar: não é o mais seguro
    const nota = vis - Math.min(1, mov * 2);
    if (nota > melhorNota) {
      melhorNota = nota;
      melhor = i;
    }
  }
  return melhor;
}
