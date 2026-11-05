// Cor do avatar da aba Física e Antropometria conforme o %G (31/10/2026, pedido do profissional): quanto maior o %G,
// mais vermelho; ao diminuir, passa por laranja e âmbar até o verde. Os pontos de cor são da PRÓPRIA pessoa:
//  - de 18 a 65 anos, vêm da tabela Pollock & Wilmore (idade e sexo): vermelho no início do nível "Ruim", laranja no início
//    de "Abaixo da média", âmbar no início de "Média" e verde no início de "Bom" (e abaixo);
//  - fora dessa idade (ou sem a tabela), vêm da faixa saudável de Gallagher: vermelho 5 pontos acima do limite superior,
//    laranja no limite superior, âmbar no meio da faixa e verde no limite inferior (e abaixo).
// É um apoio visual: não é diagnóstico, e a cor não substitui o número nem a leitura do avaliador.

import { faixaDoNivelPW, faixaGorduraSugerida, type SexoComp } from "./composicaoCorporal";

export const COR_VERMELHO = "#DC2626";
export const COR_LARANJA = "#EA580C";
export const COR_AMBAR = "#CA8A04";
export const COR_VERDE = "#16A34A";

export type PontoCor = { pg: number; cor: string; rotulo: string };

export type CorGordura = {
  cor: string; // cor do contorno para este %G
  posicao: number; // 0 (verde) a 1 (vermelho), para marcar na escala
  fonte: "pollock_wilmore" | "gallagher";
  pontos: PontoCor[]; // do maior %G (vermelho) ao menor (verde)
  referencia: string; // texto curto: de onde vêm os pontos
};

export function pontosDeCor(idade: number | null, sexo: SexoComp): { fonte: CorGordura["fonte"]; pontos: PontoCor[]; referencia: string } | null {
  const ruim = faixaDoNivelPW("Ruim", idade, sexo);
  const abaixo = faixaDoNivelPW("Abaixo da média", idade, sexo);
  const media = faixaDoNivelPW("Média", idade, sexo);
  const bom = faixaDoNivelPW("Bom", idade, sexo);
  if (ruim && abaixo && media && bom) {
    return {
      fonte: "pollock_wilmore",
      referencia: `tabela Pollock & Wilmore para ${ruim.faixaEtaria}`,
      pontos: [
        { pg: ruim.faixa[0], cor: COR_VERMELHO, rotulo: `${ruim.faixa[0]}% (início de "Ruim")` },
        { pg: abaixo.faixa[0], cor: COR_LARANJA, rotulo: `${abaixo.faixa[0]}% (início de "Abaixo da média")` },
        { pg: media.faixa[0], cor: COR_AMBAR, rotulo: `${media.faixa[0]}% (início de "Média")` },
        { pg: bom.faixa[0], cor: COR_VERDE, rotulo: `${bom.faixa[0]}% (início de "Bom")` },
      ],
    };
  }
  const g = faixaGorduraSugerida(idade, sexo);
  if (!g) return null;
  const [lo, hi] = g;
  return {
    fonte: "gallagher",
    referencia: `faixa saudável de Gallagher (${lo} a ${hi}%), pois não há tabela Pollock & Wilmore para esta idade`,
    pontos: [
      { pg: hi + 5, cor: COR_VERMELHO, rotulo: `${hi + 5}% (5 pontos acima da faixa)` },
      { pg: hi, cor: COR_LARANJA, rotulo: `${hi}% (limite superior da faixa)` },
      { pg: (lo + hi) / 2, cor: COR_AMBAR, rotulo: `${(lo + hi) / 2}% (meio da faixa)` },
      { pg: lo, cor: COR_VERDE, rotulo: `${lo}% (limite inferior da faixa)` },
    ],
  };
}

const rgb = (h: string): number[] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hex = (c: number[]) => "#" + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).toUpperCase().padStart(2, "0")).join("");

// Mistura gradual entre os pontos (do maior %G ao menor). Acima do primeiro: vermelho; abaixo do último: verde.
export function misturarCor(pontos: PontoCor[], pg: number): string {
  if (pg >= pontos[0].pg) return pontos[0].cor;
  const ultimo = pontos[pontos.length - 1];
  if (pg <= ultimo.pg) return ultimo.cor;
  for (let i = 0; i < pontos.length - 1; i++) {
    const a = pontos[i], b = pontos[i + 1];
    if (pg <= a.pg && pg >= b.pg) {
      const k = a.pg === b.pg ? 1 : (a.pg - pg) / (a.pg - b.pg);
      const ca = rgb(a.cor), cb = rgb(b.cor);
      return hex(ca.map((v, j) => v + (cb[j] - v) * k));
    }
  }
  return ultimo.cor;
}

// Cor do avatar para este %G, idade e sexo; null se faltar o %G, a idade ou o sexo (o avatar fica neutro).
export function corDoAvatar(pg: number | null, idade: number | null, sexo: SexoComp): CorGordura | null {
  if (pg === null || !Number.isFinite(pg)) return null;
  const base = pontosDeCor(idade, sexo);
  if (!base) return null;
  const topo = base.pontos[0].pg, fundo = base.pontos[base.pontos.length - 1].pg;
  const posicao = topo === fundo ? 0 : Math.max(0, Math.min(1, (pg - fundo) / (topo - fundo)));
  return { cor: misturarCor(base.pontos, pg), posicao, fonte: base.fonte, pontos: base.pontos, referencia: base.referencia };
}
