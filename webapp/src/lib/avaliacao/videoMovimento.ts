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
  compTronco: number | null; // comprimento do tronco (ombros a quadris) em pixels
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
  const vazio: MetricasQuadro = { tronco: null, lateral: null, quadril: null, joelho: null, punhoAcima: null, largOmbros: null, compTronco: null };
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
  return { tronco, lateral, quadril, joelho, punhoAcima, largOmbros, compTronco: comprimento };
}

// ---------------------------------------------------------------------------
// Adequação do vídeo para leitura: o vídeo serve para esta leitura automática 2D? Cada critério diz o que foi
// medido e por quê. Os limites são REFERÊNCIAS PRÁTICAS do sistema, sem validação publicada: dizem se a
// leitura automática é confiável, não se o movimento do paciente está bom ou ruim.
// ---------------------------------------------------------------------------
export type EstadoCriterio = "ok" | "atencao" | "falha";
export type CriterioVideo = { chave: string; rotulo: string; estado: EstadoCriterio; detalhe: string };
export type AdequacaoVideo = {
  veredito: "adequado" | "com_ressalvas" | "inadequado";
  resumo: string;
  criterios: CriterioVideo[];
};

// Informações do arquivo e das imagens analisadas (o que a leitura de quadros do navegador mede além dos pontos).
export type InfoVideo = {
  largura: number; // largura do quadro analisado, em px (mesma escala dos pontos)
  altura: number;
  videoLargura?: number; // resolução original do vídeo
  videoAltura?: number;
  luminancia?: { media: number; desvio: number }[]; // por quadro amostrado, escala 0 a 255
};

export const ROTULO_VEREDITO: Record<AdequacaoVideo["veredito"], string> = {
  adequado: "Vídeo adequado para leitura",
  com_ressalvas: "Vídeo adequado com ressalvas",
  inadequado: "Vídeo NÃO adequado para leitura",
};

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
  adequacao?: AdequacaoVideo; // ausente em análises gravadas antes de 17/10/2026
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

const mediana = (v: number[]) => {
  if (v.length === 0) return null;
  const s = [...v].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const mediaN = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

type EntradaAdequacao = {
  quadros: Quadro[];
  m: MetricasQuadro[];
  uteis: number;
  serie: (number | null)[];
  tipoSerie: "angulo" | "punho";
  indice: number | null;
  duracaoS: number;
  vista: "sagital" | "frontal";
  info?: InfoVideo;
};

export function avaliarAdequacao(e: EntradaAdequacao): AdequacaoVideo {
  const c: CriterioVideo[] = [];
  const add = (chave: string, rotulo: string, estado: EstadoCriterio, detalhe: string) => c.push({ chave, rotulo, estado, detalhe });
  const total = e.quadros.length;

  // 1) O corpo foi encontrado nos quadros?
  if (total === 0 || e.uteis === 0) {
    add("deteccao", "Corpo detectado", "falha", "O corpo não foi detectado em nenhum quadro. Confira se a pessoa aparece inteira, com boa luz e roupa que contraste com o fundo.");
  } else {
    const r = e.uteis / total;
    const txt = `detectado em ${e.uteis} de ${total} quadros (${f(r * 100)}%)`;
    if (r >= 0.8) add("deteccao", "Corpo detectado", "ok", txt);
    else if (r >= 0.6) add("deteccao", "Corpo detectado", "atencao", `${txt}: alguns quadros ficaram sem leitura, o que reduz a precisão do ponto máximo.`);
    else add("deteccao", "Corpo detectado", "falha", `${txt}: poucos quadros para uma leitura confiável. Melhore luz, enquadramento e contraste com o fundo.`);
  }

  // 2) Duração.
  if (e.duracaoS > 0) {
    const d = e.duracaoS;
    if (d < 2) add("duracao", "Duração", "falha", `${f(d, 1)} s é curto demais para pegar posição inicial, ponto máximo e retorno.`);
    else if (d < 3) add("duracao", "Duração", "atencao", `${f(d, 1)} s é curto: confira se o movimento inteiro está no vídeo.`);
    else if (d > 90) add("duracao", "Duração", "atencao", `${f(d, 0)} s é longo: a leitura amostra poucos quadros por segundo e pode perder o ponto máximo. Prefira de 5 a 30 s.`);
    else if (d > 40) add("duracao", "Duração", "atencao", `${f(d, 0)} s é um pouco longo; de 5 a 30 s costuma bastar.`);
    else add("duracao", "Duração", "ok", `${f(d, 1)} s, suficiente para o movimento completo.`);
  }

  const info = e.info;
  const comTronco = e.m.map((x, i) => ({ x, i })).filter((o) => o.x.tronco !== null);

  if (info && comTronco.length > 0) {
    // 3) Corpo inteiro dentro do quadro (tornozelos visíveis e dentro da imagem).
    let inteiros = 0;
    for (const o of comTronco) {
      const p = e.quadros[o.i].pontos;
      const dentro = (q?: Ponto) => !!q && q.v >= VIS && q.x >= 0 && q.x <= info.largura && q.y >= 0 && q.y <= info.altura * 0.99;
      if (dentro(p.tornozelo_e) || dentro(p.tornozelo_d)) inteiros++;
    }
    const rI = inteiros / comTronco.length;
    if (rI >= 0.8) add("corpo_inteiro", "Corpo inteiro no quadro", "ok", `tornozelos visíveis em ${f(rI * 100)}% dos quadros com corpo detectado.`);
    else if (rI >= 0.5) add("corpo_inteiro", "Corpo inteiro no quadro", "atencao", `tornozelos visíveis em só ${f(rI * 100)}% dos quadros: parte do corpo sai do enquadramento.`);
    else add("corpo_inteiro", "Corpo inteiro no quadro", "falha", `tornozelos fora do quadro ou sem leitura em ${f((1 - rI) * 100)}% dos quadros: afaste a câmera para pegar a pessoa dos pés à cabeça.`);

    // 4) Tamanho da pessoa na imagem.
    const med = mediana(comTronco.map((o) => o.x.compTronco as number));
    if (med !== null && info.altura > 0) {
      const frac = med / info.altura;
      if (frac >= 0.18) add("tamanho", "Tamanho da pessoa na imagem", "ok", `o tronco ocupa cerca de ${f(frac * 100)}% da altura do quadro.`);
      else if (frac >= 0.12) add("tamanho", "Tamanho da pessoa na imagem", "atencao", `o tronco ocupa só ${f(frac * 100)}% da altura do quadro: a pessoa está pequena e os ângulos perdem precisão.`);
      else add("tamanho", "Tamanho da pessoa na imagem", "falha", `o tronco ocupa só ${f(frac * 100)}% da altura do quadro: chegue mais perto, mantendo o corpo inteiro visível.`);
    }

    // 5) Câmera parada e pés no lugar (referência: o ponto médio dos tornozelos).
    const pos: { x: number; y: number }[] = [];
    for (const o of comTronco) {
      const p = e.quadros[o.i].pontos;
      const a = ponto(p.tornozelo_e, p.tornozelo_d);
      if (a) pos.push({ x: a.x, y: a.y });
    }
    const compMed = med;
    if (pos.length >= 5 && compMed) {
      const mx = mediaN(pos.map((q) => q.x))!;
      const my = mediaN(pos.map((q) => q.y))!;
      const desvio = Math.sqrt(mediaN(pos.map((q) => (q.x - mx) ** 2 + (q.y - my) ** 2))!) / compMed;
      if (desvio <= 0.08) add("estabilidade", "Câmera parada e pés no lugar", "ok", "os tornozelos ficaram praticamente no mesmo ponto da imagem.");
      else if (desvio <= 0.2) add("estabilidade", "Câmera parada e pés no lugar", "atencao", "os tornozelos se deslocaram um pouco na imagem: a câmera pode ter balançado ou o paciente deu passos.");
      else add("estabilidade", "Câmera parada e pés no lugar", "falha", "os tornozelos se deslocaram bastante na imagem: câmera em movimento ou paciente andando. Apoie a câmera e peça para manter os pés parados.");
    }

    // 6) Resolução.
    if (info.videoLargura && info.videoAltura) {
      const lado = Math.min(info.videoLargura, info.videoAltura);
      const txt = `${info.videoLargura} x ${info.videoAltura} px`;
      if (lado >= 480) add("resolucao", "Resolução", "ok", txt);
      else if (lado >= 360) add("resolucao", "Resolução", "atencao", `${txt}: baixa; os pontos do corpo ficam menos precisos.`);
      else add("resolucao", "Resolução", "falha", `${txt}: muito baixa para uma leitura confiável.`);
    }

    // 7) Luz e contraste.
    if (info.luminancia && info.luminancia.length > 0) {
      const mediaLuz = mediaN(info.luminancia.map((l) => l.media))!;
      const contraste = mediaN(info.luminancia.map((l) => l.desvio))!;
      if (mediaLuz < 40) add("luz", "Luz e contraste", "falha", `imagem muito escura (brilho médio ${f(mediaLuz)} de 255): filme com mais luz.`);
      else if (mediaLuz > 225) add("luz", "Luz e contraste", "falha", `imagem estourada de claridade (brilho médio ${f(mediaLuz)} de 255): evite contraluz e excesso de luz.`);
      else if (mediaLuz < 60 || mediaLuz > 200) add("luz", "Luz e contraste", "atencao", `brilho médio ${f(mediaLuz)} de 255, fora da faixa confortável; mais luz uniforme ajuda.`);
      else if (contraste < 25) add("luz", "Luz e contraste", "atencao", "contraste baixo: roupa e fundo parecidos dificultam achar o corpo. Use roupa que contraste com o fundo.");
      else add("luz", "Luz e contraste", "ok", `brilho médio ${f(mediaLuz)} de 255, com contraste suficiente.`);
    }

    // 8) Há movimento no vídeo? E ele está completo?
    const valores = e.serie.filter((x): x is number => x !== null);
    if (valores.length >= 3) {
      const amplitude = Math.max(...valores) - Math.min(...valores);
      const limites = e.tipoSerie === "punho" ? { ok: 0.4, atencao: 0.2, un: " comprimentos de tronco" } : { ok: 15, atencao: 8, un: "°" };
      const txt = `variação de ${f(amplitude, e.tipoSerie === "punho" ? 2 : 0)}${limites.un} durante o vídeo`;
      if (amplitude >= limites.ok) add("movimento", "Movimento presente", "ok", txt + ".");
      else if (amplitude >= limites.atencao) add("movimento", "Movimento presente", "atencao", `${txt}: pouco movimento; confira se o vídeo contém o movimento pedido.`);
      else add("movimento", "Movimento presente", "falha", `${txt}: quase nenhum movimento detectado. O vídeo pode não conter o movimento.`);
      if (e.indice !== null && total > 3) {
        const rel = e.indice / (total - 1);
        if (rel < 0.1 || rel > 0.9) add("completo", "Movimento completo", "atencao", `o ponto máximo está no ${rel < 0.1 ? "começo" : "fim"} do vídeo: ele pode ter começado ou terminado no meio do movimento.`);
        else add("completo", "Movimento completo", "ok", "o ponto máximo está no meio do vídeo, com subida e retorno.");
      }
    }

    // 9) Vista compatível com a escolhida.
    const larg = e.m.map((x) => x.largOmbros).filter((n): n is number => n !== null);
    if (larg.length >= 3) {
      const mediaLarg = mediaN(larg)!;
      if (e.vista === "sagital" && mediaLarg > 0.6) add("vista", "Vista", "atencao", "os ombros aparecem bem separados: o vídeo parece estar de frente, e não de lado. Confira a vista escolhida.");
      else if (e.vista === "frontal" && mediaLarg < 0.25) add("vista", "Vista", "atencao", "os ombros aparecem muito próximos: o vídeo parece estar de lado, e não de frente ou de costas. Confira a vista escolhida.");
      else add("vista", "Vista", "ok", e.vista === "sagital" ? "compatível com uma vista de lado." : "compatível com uma vista de frente ou de costas.");
    }
  }

  const falhas = c.filter((x) => x.estado === "falha");
  const atencoes = c.filter((x) => x.estado === "atencao");
  const juntar = (l: CriterioVideo[]) => l.map((x) => `${x.rotulo.toLowerCase()}: ${x.detalhe.replace(/\.$/, "")}`).join("; ");
  let veredito: AdequacaoVideo["veredito"];
  let resumo: string;
  if (falhas.length > 0) {
    veredito = "inadequado";
    resumo = `${ROTULO_VEREDITO.inadequado}. Motivo: ${juntar(falhas)}.${atencoes.length > 0 ? ` Também: ${juntar(atencoes)}.` : ""} Refaça o vídeo seguindo as orientações; os números abaixo, se houver, não são confiáveis.`;
  } else if (atencoes.length > 0) {
    veredito = "com_ressalvas";
    resumo = `${ROTULO_VEREDITO.com_ressalvas}. Ressalvas: ${juntar(atencoes)}. A leitura vale como estimativa: confira o vídeo antes de confiar nos números.`;
  } else {
    veredito = "adequado";
    resumo = `${ROTULO_VEREDITO.adequado}: ${c.length > 0 ? c.map((x) => x.rotulo.toLowerCase()).join(", ") + " dentro do esperado" : "sem problemas identificados"}.`;
  }
  return { veredito, resumo, criterios: c };
}

export type ResultadoVideo = { resumo: ResumoVideo; indiceMaximo: number | null };

// movimentoId e vista vêm do catálogo (lib/avaliacao/movimento.ts).
export function resumirVideo(quadros: Quadro[], movimentoId: string, vista: "sagital" | "frontal", duracaoS: number, info?: InfoVideo, agora = new Date()): ResultadoVideo {
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
  let tipoSerie: "angulo" | "punho" = "angulo";
  if (movimentoId === "agachamento" && joelhoS.some((x) => x !== null)) {
    serie = joelhoS;
    sinal = -1;
    referencia = "menor ângulo do joelho (maior flexão)";
  } else if (movimentoId === "elevacao_bracos" && punhoS.some((x) => x !== null)) {
    serie = punhoS;
    tipoSerie = "punho";
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

  const adequacao = avaliarAdequacao({ quadros, m, uteis, serie, tipoSerie, indice, duracaoS, vista, info });

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
      adequacao,
    },
  };
}
