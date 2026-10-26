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
import type { MedidaAngulo, VistaMov } from "./movimento";
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
