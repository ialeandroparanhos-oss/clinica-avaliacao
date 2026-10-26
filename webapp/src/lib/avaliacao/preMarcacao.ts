// Pré-marcações automáticas para o modo simples da postura: o sistema SUGERE e o avaliador dá o ok.
//
// 1) Achados sugeridos a partir dos graus medidos na foto (análise automática). Só viram marcação depois de aceitos.
//    Os cortes de "discreta" (3°) e "evidente" (6°) são referências práticas do sistema, sem validação publicada;
//    por isso a sugestão sempre diz de que medida veio e nunca é gravada sozinha.
// 2) Pontos do ângulo na foto do movimento (ponto máximo): o modelo de pose acha os pontos e o avaliador só confirma
//    ou ajusta, em vez de clicar os três pontos à mão. Nada é gravado como medida enquanto não for confirmado.
//
// São medidas 2D: dependem do enquadramento e da inclinação da câmera, e não são diagnóstico.

import type { AnaliseVistaSalva, Medida, NomePonto, Pontos, Ponto, Vista } from "./analisePostural";
import { anguloDe, type MedidaAngulo, type VistaMov } from "./movimento";
import type { VistaGuiada } from "./posturaSimples";

export type Sugestao = { chave: string; detalhe: string };
export type SugestoesPorVista = Partial<Record<VistaGuiada, Sugestao[]>>;

const destacada = (m: Medida | undefined): m is Medida => !!m && (m.destaque === "discreta" || m.destaque === "evidente");

// Mapa: vista da foto -> vista da lista curta. A lateral esquerda não entra no modo simples.
const VISTA_GUIADA: Partial<Record<Vista, VistaGuiada>> = { anterior: "anterior", posterior: "posterior", lateral_d: "lateral" };

export function sugerirAchados(vistas: Partial<Record<Vista, AnaliseVistaSalva>> | undefined): SugestoesPorVista {
  const saida: SugestoesPorVista = {};
  if (!vistas) return saida;
  const add = (v: VistaGuiada, chave: string, m: Medida) => {
    const lista = (saida[v] ??= []);
    if (!lista.some((s) => s.chave === chave)) lista.push({ chave, detalhe: m.texto });
  };
  for (const [vistaFoto, guiada] of Object.entries(VISTA_GUIADA) as [Vista, VistaGuiada][]) {
    const medidas = vistas[vistaFoto]?.medidas ?? [];
    const por = (id: string) => medidas.find((m) => m.id === id);
    if (guiada === "anterior" || guiada === "posterior") {
      if (destacada(por("ombros"))) add(guiada, "ombros_desnivelados", por("ombros")!);
      if (destacada(por("quadris"))) add(guiada, "pelve_desnivelada", por("quadris")!);
      if (guiada === "anterior" && destacada(por("cabeca"))) add(guiada, "cabeca_inclinada", por("cabeca")!);
      if (guiada === "posterior" && destacada(por("tronco"))) add(guiada, "coluna_desvio", por("tronco")!);
      if (guiada === "anterior") {
        for (const id of ["joelho_d", "joelho_e"]) {
          const m = por(id);
          if (!destacada(m)) continue;
          if (m.curto.includes("valgo")) add(guiada, "joelhos_dentro", m);
          else if (m.curto.includes("varo")) add(guiada, "joelhos_fora", m);
        }
      }
    } else {
      const cab = por("cabeca_ombro");
      if (destacada(cab) && cab.curto.includes("à frente")) add("lateral", "cabeca_frente", cab);
      const joe = por("joelho_perfil");
      if (destacada(joe) && joe.curto.includes("recurvato")) add("lateral", "joelhos_travados", joe);
    }
  }
  return saida;
}

export function totalSugestoes(s: SugestoesPorVista, jaMarcadas: Partial<Record<VistaGuiada, string[]>> | undefined): number {
  return (["anterior", "posterior", "lateral"] as VistaGuiada[]).reduce((n, v) => n + (s[v] ?? []).filter((x) => !(jaMarcadas?.[v] ?? []).includes(x.chave)).length, 0);
}

// ---------------------------------------------------------------------------
// Ângulo pré-marcado na foto do movimento
// ---------------------------------------------------------------------------
const VIS_MIN = 0.5;
const vis = (p?: Ponto): p is Ponto => !!p && p.v >= VIS_MIN;
const meio = (a: Ponto, b: Ponto): Ponto => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(a.v, b.v) });

function ladoMaisVisivel(p: Pontos): "e" | "d" {
  const nota = (s: "e" | "d") => {
    const v = (["ombro", "quadril", "joelho", "tornozelo"] as const).map((n) => p[`${n}_${s}` as NomePonto]?.v ?? 0);
    return v.reduce((a, b) => a + b, 0) / v.length;
  };
  return nota("e") >= nota("d") ? "e" : "d";
}

export type PreMarcacao = { angulo: MedidaAngulo & { pre: true; descricao: string } };

// Que ângulo faz sentido marcar em cada movimento e vista. Nos que não têm uma medida clara na foto (por exemplo, flexão
// de tronco de costas), não se pré-marca: a observação do avaliador vale mais que um número sem sentido.
export function preMarcarAngulo(movimentoId: string, vista: VistaMov, p: Pontos, largura: number, altura: number): PreMarcacao | null {
  const pt = (n: string, s: "e" | "d") => p[`${n}_${s}` as NomePonto];
  const resultado = (tipo: MedidaAngulo["tipo"], pts: Ponto[], descricao: string): PreMarcacao => ({
    angulo: { tipo, pts: pts.map(({ x, y }) => ({ x, y })), largura, altura, pre: true, descricao },
  });

  if (vista === "sagital") {
    const s = ladoMaisVisivel(p);
    const ombro = pt("ombro", s), quadril = pt("quadril", s), joelho = pt("joelho", s), tornozelo = pt("tornozelo", s), punho = pt("punho", s);
    if (movimentoId === "agachamento" && vis(quadril) && vis(joelho) && vis(tornozelo)) {
      return resultado("tres_pontos", [quadril, joelho, tornozelo], "ângulo do joelho (quadril, joelho e tornozelo; 180° é joelho estendido)");
    }
    if ((movimentoId === "flexao_tronco" || movimentoId === "extensao_tronco") && vis(quadril) && vis(ombro)) {
      return resultado("vertical", [quadril, ombro], "inclinação do tronco em relação à vertical (do quadril ao ombro)");
    }
    if (movimentoId === "elevacao_bracos" && vis(quadril) && vis(ombro) && vis(punho)) {
      return resultado("tres_pontos", [quadril, ombro, punho], "ângulo do braço em relação ao tronco (quadril, ombro e punho)");
    }
    return null;
  }

  // frontal (de frente ou de costas): desvio lateral do tronco, onde isso tem sentido
  if (["agachamento", "inclinacao_lateral", "extensao_tronco"].includes(movimentoId)) {
    const ombros = vis(p.ombro_e) && vis(p.ombro_d) ? meio(p.ombro_e!, p.ombro_d!) : null;
    const quadris = vis(p.quadril_e) && vis(p.quadril_d) ? meio(p.quadril_e!, p.quadril_d!) : null;
    if (ombros && quadris) return resultado("vertical", [quadris, ombros], "desvio lateral do tronco em relação à vertical (do centro dos quadris ao centro dos ombros)");
  }
  return null;
}

// Escala os pontos do ângulo para outra dimensão de imagem (a foto exibida pode ter tamanho diferente da analisada).
export function pontosNaEscala(a: Pick<MedidaAngulo, "pts" | "largura">, larguraAlvo: number): { x: number; y: number }[] {
  const k = a.largura > 0 ? larguraAlvo / a.largura : 1;
  return a.pts.map((q) => ({ x: q.x * k, y: q.y * k }));
}

// ---------------------------------------------------------------------------
// Observações sugeridas nos movimentos (a partir dos pontos do corpo no quadro do ponto máximo)
// ---------------------------------------------------------------------------
// Cortes PRÁTICOS do sistema, sem validação publicada: servem só para o sistema sugerir e o avaliador decidir.
export const CORTE_AGACHAMENTO_RASO_GRAUS = 120; // joelho (quadril-joelho-tornozelo) acima disso no ponto mais baixo: desceu pouco
export const CORTE_JOELHO_FLETE_GRAUS = 160; // na flexão de tronco, joelho abaixo disso: flexionou mais de ~20°
export const CORTE_ELEVACAO_BRACO_GRAUS = 150; // quadril-ombro-punho abaixo disso: não chegou a elevar por completo
export const CORTE_JOELHO_DENTRO_PCT = 6; // desvio do joelho para dentro, em % do comprimento da perna
export const CORTE_DESVIO_TRONCO_GRAUS = 6;
export const CORTE_BRACOS_ASSIM_PCT = 8; // diferença de altura dos punhos, em % do comprimento do tronco

const ang3 = (a: Ponto, v: Ponto, b: Ponto): number | null =>
  anguloDe({ tipo: "tres_pontos", pts: [a, v, b].map(({ x, y }) => ({ x, y })), largura: 0, altura: 0 });
const arred = (n: number) => Math.round(n);

export function sugerirObservacoes(movimentoId: string, vista: VistaMov, p: Pontos): Sugestao[] {
  const saida: Sugestao[] = [];
  const add = (chave: string, detalhe: string) => saida.push({ chave, detalhe });

  if (vista === "sagital") {
    const s = ladoMaisVisivel(p);
    const ombro = p[`ombro_${s}` as NomePonto], quadril = p[`quadril_${s}` as NomePonto], joelho = p[`joelho_${s}` as NomePonto];
    const tornozelo = p[`tornozelo_${s}` as NomePonto], punho = p[`punho_${s}` as NomePonto];
    if (movimentoId === "agachamento" && vis(quadril) && vis(joelho) && vis(tornozelo)) {
      const a = ang3(quadril, joelho, tornozelo);
      if (a !== null && a > CORTE_AGACHAMENTO_RASO_GRAUS) add("amplitude_limitada", `joelho com ${arred(a)}° no ponto mais baixo (180° é estendido): desceu pouco`);
    }
    if (movimentoId === "flexao_tronco") {
      if (vis(quadril) && vis(joelho) && vis(tornozelo)) {
        const a = ang3(quadril, joelho, tornozelo);
        if (a !== null && a < CORTE_JOELHO_FLETE_GRAUS) add("joelhos_fletem", `joelho com ${arred(a)}° (180° é estendido): flexionou cerca de ${arred(180 - a)}°`);
      }
      if (vis(punho) && vis(joelho) && punho.y < joelho.y) add("amplitude_limitada", "as mãos não passaram da altura dos joelhos");
    }
    if (movimentoId === "elevacao_bracos" && vis(quadril) && vis(ombro) && vis(punho)) {
      const a = ang3(quadril, ombro, punho);
      if (a !== null && a < CORTE_ELEVACAO_BRACO_GRAUS) add("amplitude_limitada", `braço com ${arred(a)}° em relação ao tronco (180° é totalmente elevado)`);
    }
    return saida;
  }

  // frontal (de frente ou de costas). Direito e esquerdo são os da própria pessoa, qualquer que seja o lado da câmera.
  if (movimentoId === "agachamento") {
    const mid = vis(p.quadril_e) && vis(p.quadril_d) ? (p.quadril_e!.x + p.quadril_d!.x) / 2 : null;
    for (const s of ["d", "e"] as const) {
      const q = p[`quadril_${s}` as NomePonto], j = p[`joelho_${s}` as NomePonto], t = p[`tornozelo_${s}` as NomePonto];
      if (mid === null || !vis(q) || !vis(j) || !vis(t) || Math.abs(t.y - q.y) < 1) continue;
      const xLinha = q.x + ((t.x - q.x) * (j.y - q.y)) / (t.y - q.y);
      const paraDentro = (j.x - xLinha) * Math.sign(mid - q.x);
      const perna = Math.hypot(t.x - q.x, t.y - q.y);
      const pct = (paraDentro / perna) * 100;
      if (pct > CORTE_JOELHO_DENTRO_PCT) add(`joelho_${s}_dentro`, `joelho ${s === "d" ? "direito" : "esquerdo"} cerca de ${arred(pct)}% do comprimento da perna para dentro da linha quadril-tornozelo`);
    }
    const pre = preMarcarAngulo(movimentoId, vista, p, 1, 1);
    const a = pre ? anguloDe(pre.angulo) : null;
    if (a !== null && a >= CORTE_DESVIO_TRONCO_GRAUS) add("desvio_lateral", `tronco ${arred(a)}° fora da vertical (do centro dos quadris ao centro dos ombros)`);
  }
  if (movimentoId === "elevacao_bracos" && vis(p.punho_e) && vis(p.punho_d) && vis(p.ombro_e) && vis(p.ombro_d) && vis(p.quadril_e) && vis(p.quadril_d)) {
    const tronco = Math.hypot(
      (p.ombro_e!.x + p.ombro_d!.x) / 2 - (p.quadril_e!.x + p.quadril_d!.x) / 2,
      (p.ombro_e!.y + p.ombro_d!.y) / 2 - (p.quadril_e!.y + p.quadril_d!.y) / 2
    );
    const dif = (Math.abs(p.punho_e!.y - p.punho_d!.y) / (tronco || 1)) * 100;
    if (tronco > 0 && dif > CORTE_BRACOS_ASSIM_PCT) add("bracos_assim", `um punho ${arred(dif)}% do comprimento do tronco mais baixo que o outro`);
  }
  return saida;
}