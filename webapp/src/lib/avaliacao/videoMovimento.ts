// Análise INICIAL de um vídeo de movimento (Agente 4, Dra. Paula). A detecção dos pontos do corpo quadro a
// quadro acontece no navegador (lib/avaliacao/videoPose.ts); este arquivo só faz a conta sobre os pontos, sem
// depender de navegador, para poder ser testado. É medida 2D, descritiva e de primeira triagem: depende do
// enquadramento (câmera parada, corpo inteiro, de lado ou de frente), não é diagnóstico e não substitui a
// observação do avaliador. Não há corte de normalidade.

import type { Ponto, Pontos } from "./analisePostural";

export type Quadro = { t: number; pontos: Pontos };

export type MetricasQuadro = {
  tronco: number | null; // inclinação do tronco em relação à vertical, 0° = ereto, 90° = horizontal
  lateral: number | null; // desvio do tronco em relação à vertical na imagem (com sinal: + = ombros à direita da imagem)
  quadril: number | null; // ângulo ombro-quadril-joelho do lado mais visível (180° = estendido)
  joelho: number | null; // ângulo quadril-joelho-tornozelo do lado mais visível (180° = estendido)
  punhoAcima: number | null; // altura média dos punhos acima dos ombros, em comprimentos de tronco (> 0 = acima)
  largOmbros: number | null; // distância entre os ombros em comprimentos de tronco (vista de frente é grande, de perfil é pequena)
};

const VIS = 0.5;
const vis = (p?: Ponto): p is Ponto => !!p && p.v >= VIS;
const grau = (r: number) => (r * 180) / Math.PI;

function ponto(a?: Ponto, b?: Ponto): Ponto | null {
  const va = vis(a), vb = vis(b);
  if (va && vb) return { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2, v: Math.min(a!.v, b!.v) };
  if (va) return a!;
  if (vb) return b!;
  return null;
}

function anguloInterno(a: Ponto, v: Ponto, b: Ponto): number | null {
  const ux = a.x - v.x, uy = a.y - v.y, wx = b.x - v.x, wy = b.y - v.y;
  const nu = Math.hypot(ux, uy), nw = Math.hypot(wx, wy);
  if (nu === 0 || nw === 0) return null;
  return grau(Math.acos(Math.max(-1, Math.min(1, (ux * wx + uy * wy) / (nu * nw)))));
}

function mediaVis(...ps: (Ponto | undefined)[]): number {
  const v = ps.map((p) => p?.v ?? 0);
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function metricasQuadro(p: Pontos): MetricasQuadro {
  const ombros = ponto(p.ombro_e, p.ombro_d);
  const quadris = ponto(p.quadril_e, p.quadril_d);
  const vazio: MetricasQuadro = { tronco: null, lateral: null, quadril: null, joelho: null, punhoAcima: null, largOmbros: null };
  if (!ombros || !quadris) return vazio;
  const dx = ombros.x - quadris.x;
  const dy = ombros.y - quadris.y;
  const comprimento = Math.hypot(dx, dy);
  if (comprimento < 1) return vazio;
  const tronco = grau(Math.atan2(Math.abs(dx), -dy));
  const lateral = grau(Math.atan2(dx, -dy));

  // Lado mais visível para os ângulos de quadril e joelho.
  const ladoE = mediaVis(p.ombro_e, p.quadril_e, p.joelho_e, p.tornozelo_e);
  const ladoD = mediaVis(p.ombro_d, p.quadril_d, p.joelho_d, p.tornozelo_d);
  const s = ladoE >= ladoD ? "e" : "d";
  const om = s === "e" ? p.ombro_e : p.ombro_d;
  const qu = s === "e" ? p.quadril_e : p.quadril_d;
  const jo = s === "e" ? p.joelho_e : p.joelho_d;
  const to = s === "e" ? p.tornozelo_e : p.tornozelo_d;
  const quadril = vis(om) && vis(qu) && vis(jo) ? anguloInterno(om, qu, jo) : null;
  const joelho = vis(qu) && vis(jo) && vis(to) ? anguloInterno(qu, jo, to) : null;

  const punhos = ponto(p.punho_e, p.punho_d);
  const punhoAcima = punhos ? (ombros.y - punhos.y) / comprimento : null;
  const largOmbros = vis(p.ombro_e) && vis(p.ombro_d) ? Math.abs(p.ombro_e!.x - p.ombro_d!.x) / comprimento : null;
  return { tronco, lateral, quadril, joelho, punhoAcima, largOmbros };
}

export type ResumoVideo = {
  gerado_em: string;
  duracao_s: number;
  quadros_total: number;
  quadros_uteis: number;
  t_max_s: number | null;
  referencia_max: string; // o que definiu o "ponto máximo"
  tronco_max: number | null;
  lateral_max: number | null; // com sinal
  quadril_min: number | null;
  joelho_min: number | null;
  punho_max: number | null;
  avisos: string[];
  linhas: string[];
};

// Descarta só os quadros com um pico isolado e absurdo (erro de detecção): um valor muito acima ou muito abaixo
// dos DOIS vizinhos. Não suaviza o resto, para não achatar o ponto máximo real do movimento.
function removerPicos(v: (number | null)[], limite: number): (number | null)[] {
  return v.map((x, i) => {
    if (x === null) return null;
    const a = v[i - 1];
    const b = v[i + 1];
    if (typeof a !== "number" || typeof b !== "number") return x;
    if (x - Math.max(a, b) > limite || Math.min(a, b) - x > limite) return null;
    return x;
  });
}

const f = (n: number, c = 0) => n.toFixed(c).replace(".", ",");

export type ResultadoVideo = { resumo: ResumoVideo; indiceMaximo: number | null };

// movimentoId e vista vêm do catálogo (lib/avaliacao/movimento.ts).
export function resumirVideo(quadros: Quadro[], movimentoId: string, vista: "sagital" | "frontal", duracaoS: number, agora = new Date()): ResultadoVideo {
  const m = quadros.map((q) => metricasQuadro(q.pontos));
  const troncoS = removerPicos(m.map((x) => x.tronco), 60);
  const lateralS = removerPicos(m.map((x) => x.lateral), 60);
  const quadrilS = removerPicos(m.map((x) => x.quadril), 60);
  const joelhoS = removerPicos(m.map((x) => x.joelho), 60);
  const punhoS = removerPicos(m.map((x) => x.punhoAcima), 1);
  const uteis = m.filter((x) => x.tronco !== null).length;

  // Ponto máximo conforme o movimento.
  let serie: (number | null)[];
  let sinal: 1 | -1 = 1;
  let referencia: string;
  if (movimentoId === "agachamento" && joelhoS.some((x) => x !== null)) {
    serie = joelhoS;
    sinal = -1;
    referencia = "menor ângulo do joelho (maior flexão)";
  } else if (movimentoId === "elevacao_bracos" && punhoS.some((x) => x !== null)) {
    serie = punhoS;
    referencia = "punhos mais altos em relação aos ombros";
  } else {
    serie = troncoS;
    referencia = "maior inclinação do tronco em relação à vertical";
  }
  let indice: number | null = null;
  let melhor = -Infinity;
  serie.forEach((x, i) => {
    if (x === null) return;
    const v = sinal * x;
    if (v > melhor) {
      melhor = v;
      indice = i;
    }
  });

  const max = (s: (number | null)[]) => {
    const v = s.filter((n): n is number => n !== null);
    return v.length ? Math.max(...v) : null;
  };
  const min = (s: (number | null)[]) => {
    const v = s.filter((n): n is number => n !== null);
    return v.length ? Math.min(...v) : null;
  };
  const maxAbsComSinal = (s: (number | null)[]) => {
    const v = s.filter((n): n is number => n !== null);
    if (!v.length) return null;
    return v.reduce((a, b) => (Math.abs(b) > Math.abs(a) ? b : a));
  };

  const avisos: string[] = [];
  if (quadros.length === 0 || uteis === 0) avisos.push("O corpo não foi detectado em nenhum quadro: confira o enquadramento (corpo inteiro visível, câmera parada, boa luz) e filme de novo.");
  else if (uteis < quadros.length * 0.6) avisos.push(`O corpo foi detectado em só ${uteis} de ${quadros.length} quadros: o resultado é pouco confiável. Confira enquadramento, luz e roupa que contraste com o fundo.`);
  const larg = m.map((x) => x.largOmbros).filter((n): n is number => n !== null);
  if (larg.length >= 3) {
    const mediaLarg = larg.reduce((a, b) => a + b, 0) / larg.length;
    if (vista === "sagital" && mediaLarg > 0.6) avisos.push("Os ombros aparecem bem separados: o vídeo parece estar de frente, e não de lado. Confira a vista escolhida.");
    if (vista === "frontal" && mediaLarg < 0.25) avisos.push("Os ombros aparecem muito próximos: o vídeo parece estar de lado, e não de frente ou de costas. Confira a vista escolhida.");
  }
  if (duracaoS > 0 && duracaoS < 2) avisos.push("Vídeo muito curto: confira se ele pega o movimento inteiro, da posição inicial ao ponto máximo e ao retorno.");

  const troncoMax = max(troncoS);
  const lateralMax = maxAbsComSinal(lateralS);
  const quadrilMin = min(quadrilS);
  const joelhoMin = min(joelhoS);
  const punhoMax = max(punhoS);
  const tMax = indice !== null ? quadros[indice].t : null;

  const linhas: string[] = [];
  if (vista === "sagital") {
    if (troncoMax !== null) linhas.push(`inclinação máxima do tronco em relação à vertical: ${f(troncoMax)}°${tMax !== null ? ` (em ${f(tMax, 1)} s)` : ""}`);
    if (quadrilMin !== null) linhas.push(`menor ângulo ombro-quadril-joelho (lado mais visível): ${f(quadrilMin)}°`);
    if (joelhoMin !== null) linhas.push(`menor ângulo do joelho (lado mais visível): ${f(joelhoMin)}°`);
    if (movimentoId === "elevacao_bracos" && punhoMax !== null) linhas.push(`punhos até ${f(punhoMax, 2)} comprimentos de tronco acima dos ombros`);
  } else {
    if (lateralMax !== null) linhas.push(`maior desvio do tronco em relação à vertical: ${f(Math.abs(lateralMax))}° para a ${lateralMax >= 0 ? "direita" : "esquerda"} da imagem${tMax !== null ? ` (ponto máximo em ${f(tMax, 1)} s)` : ""}`);
    if (movimentoId === "elevacao_bracos" && punhoMax !== null) linhas.push(`punhos até ${f(punhoMax, 2)} comprimentos de tronco acima dos ombros`);
    if (movimentoId === "agachamento" && joelhoMin !== null) linhas.push(`menor ângulo do joelho (lado mais visível): ${f(joelhoMin)}°`);
  }
  if (duracaoS > 0) linhas.push(`vídeo de ${f(duracaoS, 1)} s, pontos do corpo detectados em ${uteis} de ${quadros.length} quadros`);

  return {
    indiceMaximo: indice,
    resumo: {
      gerado_em: agora.toISOString(),
      duracao_s: Math.round(duracaoS * 10) / 10,
      quadros_total: quadros.length,
      quadros_uteis: uteis,
      t_max_s: tMax === null ? null : Math.round(tMax * 10) / 10,
      referencia_max: referencia,
      tronco_max: troncoMax === null ? null : Math.round(troncoMax * 10) / 10,
      lateral_max: lateralMax === null ? null : Math.round(lateralMax * 10) / 10,
      quadril_min: quadrilMin === null ? null : Math.round(quadrilMin * 10) / 10,
      joelho_min: joelhoMin === null ? null : Math.round(joelhoMin * 10) / 10,
      punho_max: punhoMax === null ? null : Math.round(punhoMax * 100) / 100,
      avisos,
      linhas,
    },
  };
}
