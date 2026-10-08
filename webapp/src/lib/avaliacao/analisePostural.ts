// Agente 4 — Análise postural por foto.
//
// Recebe os pontos do corpo que o modelo de pose (MediaPipe, rodando no próprio
// navegador - a foto não sai do computador) encontrou em cada vista e calcula
// medidas ANGULARES e de ALINHAMENTO em 2D, e redige um parecer DESCRITIVO.
//
// Regras de linguagem do Agente 4 (03-Agente4-Postural-e-Biomecanica.md):
// achado postural é "aparente à inspeção da foto" - nunca causa, nunca
// diagnóstico (nada de "escoliose", "hiperlordose" etc.), e a relação entre
// postura estática e dor é fraca/inconclusiva na literatura.
//
// Limites da foto 2D: a medida depende do enquadramento, da inclinação da
// câmera, da distância e da lente (perspectiva); os pontos do modelo são
// aproximações (o "quadril" é o centro da articulação, não a EIAS); escápulas,
// curvaturas da coluna e anteversão/retroversão pélvica NÃO são mensuráveis
// por este método e dependem da observação do avaliador.

import type { EstiloParecer } from "./pareceres";
import { linhasBaseCientifica, nomeComTitulo } from "@/lib/agentes";

export type Vista = "anterior" | "posterior" | "lateral_d" | "lateral_e";

export const ROTULO_VISTA: Record<Vista, string> = {
  anterior: "Vista anterior",
  posterior: "Vista posterior",
  lateral_d: "Vista lateral direita",
  lateral_e: "Vista lateral esquerda",
};

// Pontos usados (índices do modelo de pose do MediaPipe, 33 pontos). "_e" e "_d"
// são o lado ANATÔMICO do paciente (esquerdo/direito), como o modelo os rotula.
export const INDICE_PONTO = {
  nariz: 0,
  olho_e: 2,
  olho_d: 5,
  orelha_e: 7,
  orelha_d: 8,
  ombro_e: 11,
  ombro_d: 12,
  cotovelo_e: 13,
  cotovelo_d: 14,
  punho_e: 15,
  punho_d: 16,
  quadril_e: 23,
  quadril_d: 24,
  joelho_e: 25,
  joelho_d: 26,
  tornozelo_e: 27,
  tornozelo_d: 28,
  calcanhar_e: 29,
  calcanhar_d: 30,
  pe_e: 31,
  pe_d: 32,
} as const;

export type NomePonto = keyof typeof INDICE_PONTO;

// x e y em PIXELS da imagem analisada (y cresce para baixo); v = visibilidade (0-1).
export type Ponto = { x: number; y: number; v: number };
export type Pontos = Partial<Record<NomePonto, Ponto>>;

// Referências PRÁTICAS do sistema (não existem cortes validados para medidas em
// foto 2D): abaixo de 3° a diferença não é interpretada (margem de erro da marcação
// e do enquadramento); 6° ou mais é "evidente".
export const LIMITE_DISCRETA_GRAUS = 3;
export const LIMITE_EVIDENTE_GRAUS = 6;
export const LIMITE_JOELHO_GRAUS = 4;
export const LIMITE_TRONCO_PERFIL_GRAUS = 5;
export const LIMITE_CABECA_PERFIL_GRAUS = 10;
const VISIBILIDADE_MINIMA = 0.5;

export type Destaque = "ok" | "discreta" | "evidente" | "info";

export type Medida = {
  id: string;
  rotulo: string; // título da etiqueta (ex.: "Ombros")
  valor: number; // módulo da medida
  unidade: "°" | "%";
  texto: string; // frase descritiva
  curto: string; // subtítulo da etiqueta no desenho
  destaque: Destaque;
  ancora: { x: number; y: number }; // ponto da foto a que a etiqueta se liga (pixels)
};

export type ResultadoVista = {
  vista: Vista;
  medidas: Medida[];
  avisos: string[]; // qualidade da foto/marcação
  linhaPrumoX: number | null; // x (px) da linha de prumo desenhada
};

const rad2deg = (r: number) => (r * 180) / Math.PI;
const media = (a: Ponto, b: Ponto): Ponto => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(a.v, b.v) });
const visivel = (p?: Ponto): p is Ponto => !!p && p.v >= VISIBILIDADE_MINIMA;

function destaquePorAngulo(graus: number, discreta = LIMITE_DISCRETA_GRAUS, evidente = LIMITE_EVIDENTE_GRAUS): Destaque {
  return graus >= evidente ? "evidente" : graus >= discreta ? "discreta" : "ok";
}

const nivelTexto = (d: Destaque) => (d === "evidente" ? "evidente" : d === "discreta" ? "discreta" : "sem diferença perceptível");

export const formatarGraus = (n: number) => `${n.toFixed(1).replace(".", ",")}°`;
export const formatarPct = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;

// Inclinação do segmento entre o lado direito e o esquerdo em relação à horizontal.
// Retorna o módulo e qual lado ficou mais baixo na foto.
export function inclinacaoEntreLados(direito: Ponto, esquerdo: Ponto): { graus: number; maisBaixo: "direito" | "esquerdo" | "nenhum" } {
  const dx = Math.abs(esquerdo.x - direito.x) || 1e-9;
  const dy = esquerdo.y - direito.y; // > 0: o esquerdo está mais baixo (y maior)
  const graus = rad2deg(Math.atan(Math.abs(dy) / dx));
  return { graus, maisBaixo: Math.abs(dy) < 1e-6 ? "nenhum" : dy > 0 ? "esquerdo" : "direito" };
}

// Ângulo entre dois vetores (graus, 0-180).
function anguloEntre(v1: { x: number; y: number }, v2: { x: number; y: number }): number {
  const dot = v1.x * v2.x + v1.y * v2.y;
  const n = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (n === 0) return 0;
  return rad2deg(Math.acos(Math.max(-1, Math.min(1, dot / n))));
}

// Qual lado do PACIENTE aparece à direita da imagem (depende de a foto ser de
// frente ou de costas).
function ladoNaDireitaDaImagem(p: Pontos): "esquerdo" | "direito" | null {
  if (!p.ombro_d || !p.ombro_e) return null;
  return p.ombro_e.x > p.ombro_d.x ? "esquerdo" : "direito";
}

// ---------------------------------------------------------------------------
// Vistas anterior e posterior
// ---------------------------------------------------------------------------
function analisarFrontal(vista: "anterior" | "posterior", p: Pontos): { medidas: Medida[]; avisos: string[]; linhaPrumoX: number | null } {
  const medidas: Medida[] = [];
  const avisos: string[] = [];
  const naDireita = ladoNaDireitaDaImagem(p);

  // Ombros
  if (visivel(p.ombro_d) && visivel(p.ombro_e)) {
    const r = inclinacaoEntreLados(p.ombro_d, p.ombro_e);
    const d = destaquePorAngulo(r.graus);
    medidas.push({
      id: "ombros",
      rotulo: "Ombros",
      valor: r.graus,
      unidade: "°",
      destaque: d,
      curto: d === "ok" ? "sem diferença perceptível" : `ombro ${r.maisBaixo} mais baixo`,
      texto: d === "ok" ? "ombros aparentemente nivelados" : `ombro ${r.maisBaixo} aparentemente mais baixo (${nivelTexto(d)}, ${formatarGraus(r.graus)})`,
      ancora: media(p.ombro_d, p.ombro_e),
    });
  } else avisos.push("Ombros não visíveis o bastante para medir o nivelamento.");

  // Quadris (articulação do quadril - aproxima, mas não é a EIAS/EIPS)
  if (visivel(p.quadril_d) && visivel(p.quadril_e)) {
    const r = inclinacaoEntreLados(p.quadril_d, p.quadril_e);
    const d = destaquePorAngulo(r.graus);
    medidas.push({
      id: "quadris",
      rotulo: "Quadris",
      valor: r.graus,
      unidade: "°",
      destaque: d,
      curto: d === "ok" ? "sem diferença perceptível" : `quadril ${r.maisBaixo} mais baixo`,
      texto: d === "ok" ? "linha dos quadris aparentemente nivelada" : `quadril ${r.maisBaixo} aparentemente mais baixo (${nivelTexto(d)}, ${formatarGraus(r.graus)})`,
      ancora: media(p.quadril_d, p.quadril_e),
    });
  } else avisos.push("Quadris não visíveis o bastante para medir o nivelamento.");

  // Cabeça (linha das orelhas; senão a dos olhos)
  const cab = visivel(p.orelha_d) && visivel(p.orelha_e) ? [p.orelha_d, p.orelha_e] : visivel(p.olho_d) && visivel(p.olho_e) ? [p.olho_d, p.olho_e] : null;
  if (cab) {
    const r = inclinacaoEntreLados(cab[0], cab[1]);
    const d = destaquePorAngulo(r.graus);
    medidas.push({
      id: "cabeca",
      rotulo: "Cabeça",
      valor: r.graus,
      unidade: "°",
      destaque: d,
      curto: d === "ok" ? "sem diferença perceptível" : `inclinada p/ o lado ${r.maisBaixo}`,
      texto: d === "ok" ? "cabeça aparentemente alinhada na horizontal" : `cabeça aparentemente inclinada para o lado ${r.maisBaixo} (${nivelTexto(d)}, ${formatarGraus(r.graus)})`,
      ancora: media(cab[0], cab[1]),
    });
  }

  // Linha de prumo: vertical que sai do ponto médio dos tornozelos.
  let linhaPrumoX: number | null = null;
  const tornozelos = visivel(p.tornozelo_d) && visivel(p.tornozelo_e) ? media(p.tornozelo_d, p.tornozelo_e) : null;
  const ombrosMed = visivel(p.ombro_d) && visivel(p.ombro_e) ? media(p.ombro_d, p.ombro_e) : null;
  const quadrisMed = visivel(p.quadril_d) && visivel(p.quadril_e) ? media(p.quadril_d, p.quadril_e) : null;
  if (tornozelos) linhaPrumoX = tornozelos.x;

  // Inclinação lateral do tronco (ponto médio dos quadris -> ponto médio dos ombros).
  if (ombrosMed && quadrisMed) {
    const dx = ombrosMed.x - quadrisMed.x;
    const dy = quadrisMed.y - ombrosMed.y || 1e-9;
    const graus = rad2deg(Math.atan(Math.abs(dx) / Math.abs(dy)));
    const d = destaquePorAngulo(graus);
    // Para qual lado do paciente o tronco está inclinado.
    let lado = "";
    if (naDireita) lado = dx > 0 ? naDireita : naDireita === "esquerdo" ? "direito" : "esquerdo";
    medidas.push({
      id: "tronco",
      rotulo: "Tronco",
      valor: graus,
      unidade: "°",
      destaque: d,
      curto: d === "ok" ? "sem diferença perceptível" : `inclinado p/ o lado ${lado || "—"}`,
      texto: d === "ok" ? "tronco aparentemente alinhado à vertical" : `tronco aparentemente inclinado para o lado ${lado || "—"} (${nivelTexto(d)}, ${formatarGraus(graus)})`,
      ancora: media(ombrosMed, quadrisMed),
    });
  }

  // Joelhos: desvio em relação ao eixo quadril-tornozelo (valgo/varo aparente).
  for (const lado of ["d", "e"] as const) {
    const quadril = p[`quadril_${lado}` as const];
    const joelho = p[`joelho_${lado}` as const];
    const tornozelo = p[`tornozelo_${lado}` as const];
    if (!(visivel(quadril) && visivel(joelho) && visivel(tornozelo))) continue;
    const graus = anguloEntre({ x: joelho.x - quadril.x, y: joelho.y - quadril.y }, { x: tornozelo.x - joelho.x, y: tornozelo.y - joelho.y });
    // Posição do joelho em relação à reta quadril-tornozelo, na altura do joelho.
    const t = (joelho.y - quadril.y) / (tornozelo.y - quadril.y || 1e-9);
    const xReta = quadril.x + (tornozelo.x - quadril.x) * t;
    const desvio = joelho.x - xReta;
    // "Medial" = em direção à linha média do corpo (centro dos quadris).
    const centro = quadrisMed ? quadrisMed.x : quadril.x;
    const medial = Math.sign(centro - quadril.x) * Math.sign(desvio) > 0;
    const nomeLado = lado === "d" ? "direito" : "esquerdo";
    const destaque: Destaque = graus >= LIMITE_JOELHO_GRAUS * 2 ? "evidente" : graus >= LIMITE_JOELHO_GRAUS ? "discreta" : "ok";
    medidas.push({
      id: `joelho_${lado}`,
      rotulo: `Joelho ${nomeLado}`,
      valor: graus,
      unidade: "°",
      destaque,
      curto: destaque === "ok" ? "alinhado ao eixo" : `${medial ? "valgo" : "varo"} aparente`,
      texto: destaque === "ok" ? `joelho ${nomeLado} aparentemente alinhado ao eixo quadril-tornozelo` : `joelho ${nomeLado} com ${medial ? "valgo" : "varo"} aparente (${nivelTexto(destaque)}, ${formatarGraus(graus)})`,
      ancora: joelho,
    });
  }

  // Deslocamento de cabeça, ombros e quadris em relação ao prumo (% da altura nariz-tornozelo).
  const alturaCorpo = tornozelos && visivel(p.nariz) ? Math.abs(tornozelos.y - p.nariz.y) : null;
  if (tornozelos && alturaCorpo && alturaCorpo > 0) {
    const desloc = (ponto: Ponto | null, nome: string, id: string) => {
      if (!ponto) return;
      const pct = ((ponto.x - tornozelos.x) / alturaCorpo) * 100;
      medidas.push({
        id,
        rotulo: `${nome} x prumo`,
        valor: Math.abs(pct),
        unidade: "%",
        destaque: "info",
        curto: "desvio do prumo",
        texto: `${nome.toLowerCase()} a ${formatarPct(Math.abs(pct))} da altura (nariz-tornozelo) da linha de prumo${
          Math.abs(pct) < 0.5 ? "" : ` (para ${naDireita ? (pct > 0 ? naDireita : naDireita === "esquerdo" ? "o lado direito" : "o lado esquerdo") : "um dos lados"})`
        }`,
        ancora: ponto,
      });
    };
    desloc(visivel(p.nariz) ? p.nariz : null, "Cabeça", "prumo_cabeca");
    desloc(quadrisMed, "Quadris", "prumo_quadris");
  }

  if (vista === "posterior") avisos.push("Na vista posterior não são medidos: nivelamento das escápulas e alinhamento do calcâneo (o modelo não os localiza com precisão) - registre pela observação.");
  return { medidas, avisos, linhaPrumoX };
}

// ---------------------------------------------------------------------------
// Vistas laterais
// ---------------------------------------------------------------------------
function analisarLateral(vista: "lateral_d" | "lateral_e", p: Pontos): { medidas: Medida[]; avisos: string[]; linhaPrumoX: number | null } {
  const medidas: Medida[] = [];
  const avisos: string[] = [];
  const s = vista === "lateral_d" ? "d" : "e";
  const orelha = p[`orelha_${s}` as const];
  const ombro = p[`ombro_${s}` as const];
  const quadril = p[`quadril_${s}` as const];
  const joelho = p[`joelho_${s}` as const];
  const tornozelo = p[`tornozelo_${s}` as const];
  const pe = p[`pe_${s}` as const];
  const calcanhar = p[`calcanhar_${s}` as const];

  // Para onde o paciente olha na imagem: +1 = direita da imagem, -1 = esquerda.
  let frente = 0;
  if (visivel(p.nariz) && visivel(orelha)) frente = Math.sign(p.nariz.x - orelha.x);
  if (frente === 0 && visivel(pe) && visivel(calcanhar)) frente = Math.sign(pe.x - calcanhar.x);
  if (frente === 0) {
    avisos.push("Não foi possível determinar para que lado o paciente está voltado; as medidas sagitais não foram calculadas.");
    return { medidas, avisos, linhaPrumoX: tornozelo ? tornozelo.x : null };
  }

  const alturaCorpo = visivel(p.nariz) && visivel(tornozelo) ? Math.abs(tornozelo.y - p.nariz.y) : null;
  const linhaPrumoX = visivel(tornozelo) ? tornozelo.x : null;

  // Cabeça à frente do ombro: ângulo da reta ombro-orelha em relação à vertical.
  if (visivel(orelha) && visivel(ombro)) {
    const dx = (orelha.x - ombro.x) * frente;
    const dy = ombro.y - orelha.y || 1e-9;
    const graus = rad2deg(Math.atan(dx / Math.abs(dy)));
    const modulo = Math.abs(graus);
    const destaque: Destaque = modulo >= LIMITE_CABECA_PERFIL_GRAUS * 1.6 ? "evidente" : modulo >= LIMITE_CABECA_PERFIL_GRAUS ? "discreta" : "ok";
    medidas.push({
      id: "cabeca_ombro",
      rotulo: "Cabeça x ombro",
      valor: modulo,
      unidade: "°",
      destaque,
      curto: destaque === "ok" ? "próxima da vertical" : graus > 0 ? "à frente do ombro" : "atrás do ombro",
      texto:
        destaque === "ok"
          ? `orelha aparentemente próxima da vertical do ombro (${formatarGraus(modulo)})`
          : `orelha aparentemente ${graus > 0 ? "à frente" : "atrás"} da vertical do ombro (${formatarGraus(modulo)})`,
      ancora: media(orelha, ombro),
    });
  } else avisos.push("Orelha ou ombro não visíveis o bastante para medir a posição da cabeça.");

  // Inclinação do tronco (quadril -> ombro) em relação à vertical.
  if (visivel(ombro) && visivel(quadril)) {
    const dx = (ombro.x - quadril.x) * frente;
    const dy = quadril.y - ombro.y || 1e-9;
    const graus = rad2deg(Math.atan(dx / Math.abs(dy)));
    const modulo = Math.abs(graus);
    const destaque: Destaque = modulo >= LIMITE_TRONCO_PERFIL_GRAUS * 2 ? "evidente" : modulo >= LIMITE_TRONCO_PERFIL_GRAUS ? "discreta" : "ok";
    medidas.push({
      id: "tronco_perfil",
      rotulo: "Tronco",
      valor: modulo,
      unidade: "°",
      destaque,
      curto: destaque === "ok" ? "próximo da vertical" : graus > 0 ? "inclinado p/ a frente" : "inclinado p/ trás",
      texto: destaque === "ok" ? `tronco aparentemente próximo da vertical (${formatarGraus(modulo)})` : `tronco aparentemente inclinado ${graus > 0 ? "para a frente" : "para trás"} (${formatarGraus(modulo)})`,
      ancora: media(ombro, quadril),
    });
  }

  // Joelho: flexão ou recurvato aparente (desvio da reta quadril-tornozelo).
  if (visivel(quadril) && visivel(joelho) && visivel(tornozelo)) {
    const graus = anguloEntre({ x: joelho.x - quadril.x, y: joelho.y - quadril.y }, { x: tornozelo.x - joelho.x, y: tornozelo.y - joelho.y });
    const t = (joelho.y - quadril.y) / (tornozelo.y - quadril.y || 1e-9);
    const xReta = quadril.x + (tornozelo.x - quadril.x) * t;
    const aFrente = (joelho.x - xReta) * frente > 0; // joelho à frente da reta = flexão
    const destaque: Destaque = graus >= LIMITE_JOELHO_GRAUS * 2 ? "evidente" : graus >= LIMITE_JOELHO_GRAUS ? "discreta" : "ok";
    medidas.push({
      id: "joelho_perfil",
      rotulo: "Joelho",
      valor: graus,
      unidade: "°",
      destaque,
      curto: destaque === "ok" ? "estendido e alinhado" : aFrente ? "flexão aparente" : "recurvato aparente",
      texto: destaque === "ok" ? `joelho aparentemente estendido e alinhado (${formatarGraus(graus)})` : `joelho com ${aFrente ? "flexão" : "extensão além do alinhamento (recurvato aparente)"} de ${formatarGraus(graus)}`,
      ancora: joelho,
    });
  }

  // Alinhamento vertical: deslocamento de orelha, ombro, quadril e joelho em relação ao prumo do tornozelo.
  if (visivel(tornozelo) && alturaCorpo && alturaCorpo > 0) {
    const itens: [Ponto | undefined, string, string][] = [
      [orelha, "Orelha", "prumo_orelha"],
      [ombro, "Ombro", "prumo_ombro"],
      [quadril, "Quadril", "prumo_quadril"],
      [joelho, "Joelho", "prumo_joelho"],
    ];
    for (const [ponto, nome, id] of itens) {
      if (!visivel(ponto)) continue;
      const pct = (((ponto.x - tornozelo.x) * frente) / alturaCorpo) * 100;
      medidas.push({
        id,
        rotulo: `${nome} x prumo`,
        valor: Math.abs(pct),
        unidade: "%",
        destaque: "info",
        curto: pct >= 0 ? "à frente do prumo" : "atrás do prumo",
        texto: `${nome.toLowerCase()} a ${formatarPct(Math.abs(pct))} da altura (nariz-tornozelo) ${pct >= 0 ? "à frente" : "atrás"} da linha de prumo do tornozelo`,
        ancora: ponto,
      });
    }
  }

  avisos.push("De perfil não são medidos: curvaturas da coluna (cifose/lordose aparentes) e posição da pelve (anteversão/retroversão aparente) - registre pela observação.");
  return { medidas, avisos, linhaPrumoX };
}

// ---------------------------------------------------------------------------
// API principal
// ---------------------------------------------------------------------------
export function analisarVista(vista: Vista, pontos: Pontos, largura: number, altura: number): ResultadoVista {
  const base = vista === "anterior" || vista === "posterior" ? analisarFrontal(vista, pontos) : analisarLateral(vista, pontos);
  const avisos = [...base.avisos];

  // Qualidade do enquadramento: corpo inteiro e tamanho na foto.
  const tornozelo = pontos.tornozelo_d && pontos.tornozelo_e ? media(pontos.tornozelo_d, pontos.tornozelo_e) : pontos.tornozelo_d ?? pontos.tornozelo_e;
  const topo = pontos.nariz ?? pontos.orelha_d ?? pontos.orelha_e;
  if (!visivel(tornozelo)) avisos.unshift("Tornozelos não visíveis: enquadre o corpo inteiro (da cabeça aos pés) para uma análise confiável.");
  if (tornozelo && topo && altura > 0) {
    const ocupacao = Math.abs(tornozelo.y - topo.y) / altura;
    if (ocupacao < 0.55) avisos.unshift("A pessoa ocupa pouco da altura da foto; aproxime a câmera (mantendo o corpo inteiro) para reduzir o erro das medidas.");
    if (tornozelo.y > altura * 0.985) avisos.unshift("Os pés parecem cortados na borda inferior da foto.");
  }
  if (largura <= 0 || altura <= 0) avisos.push("Dimensões da foto inválidas.");
  if (base.medidas.length === 0) avisos.unshift("Nenhuma medida pôde ser calculada: confira se a pessoa está inteira e bem iluminada na foto.");
  return { vista, medidas: base.medidas, avisos, linhaPrumoX: base.linhaPrumoX };
}

export type AnaliseVistaSalva = {
  foto_path: string;
  largura: number;
  altura: number;
  pontos: Pontos;
  medidas: Medida[];
  avisos: string[];
  linhaPrumoX: number | null;
  gerado_em: string;
};

// ---------------------------------------------------------------------------
// Parecer descritivo (texto do Agente 4)
// ---------------------------------------------------------------------------
function gerarParecerSucinto(vistas: Partial<Record<Vista, AnaliseVistaSalva>>, analisadas: Vista[]): string {
  const linhas: string[] = [`PARECER ${nomeComTitulo("paula").toUpperCase()} (assistente de IA) - POSTURA (resumo)`, ""];
  const atencao: string[] = [];
  for (const v of analisadas) {
    const a = vistas[v]!;
    const achados = a.medidas.filter((m) => m.destaque === "discreta" || m.destaque === "evidente");
    const normais = a.medidas.filter((m) => m.destaque === "ok");
    if (achados.length > 0) {
      linhas.push(`${ROTULO_VISTA[v]}: ${achados.map((m) => m.texto).join("; ")}.`);
      achados.forEach((m) => atencao.push(`${ROTULO_VISTA[v].toLowerCase()}: ${m.rotulo.toLowerCase()}`));
    } else if (normais.length > 0) {
      linhas.push(`${ROTULO_VISTA[v]}: sem diferença perceptível.`);
    } else {
      linhas.push(`${ROTULO_VISTA[v]}: sem medidas calculadas (confira o enquadramento da foto).`);
    }
    const aviso = a.avisos.find((x) => !x.startsWith("Na vista posterior não são medidos") && !x.startsWith("De perfil não são medidos"));
    if (aviso) linhas.push(`  Qualidade: ${aviso}`);
  }
  linhas.push("");
  linhas.push(atencao.length > 0 ? `A confirmar clinicamente: ${Array.from(new Set(atencao)).join("; ")}.` : "Nenhuma diferença aparente acima da margem de interpretação.");
  linhas.push("Foto 2D, achados descritivos: não são diagnóstico nem causa de dor.");
  linhas.push(...linhasBaseCientifica("paula", "sucinto"));
  return linhas.join("\n");
}

export function gerarParecer(vistas: Partial<Record<Vista, AnaliseVistaSalva>>, estilo: EstiloParecer = "explicativo"): string {
  const ordem: Vista[] = ["anterior", "posterior", "lateral_d", "lateral_e"];
  const analisadas = ordem.filter((v) => vistas[v]);
  if (analisadas.length === 0) return "";
  if (estilo === "sucinto") return gerarParecerSucinto(vistas, analisadas);

  const linhas: string[] = [];
  linhas.push(`PARECER POSTURAL - ${nomeComTitulo("paula")} (assistente de IA; análise automática das fotos; apoio ao avaliador, não é diagnóstico)`);
  linhas.push(`Fotos analisadas: ${analisadas.map((v) => ROTULO_VISTA[v].toLowerCase()).join(", ")}.`);
  linhas.push("");

  const atencao: string[] = [];
  const semAlteracao: string[] = [];

  for (const v of analisadas) {
    const a = vistas[v]!;
    const achados = a.medidas.filter((m) => m.destaque === "discreta" || m.destaque === "evidente");
    const normais = a.medidas.filter((m) => m.destaque === "ok");
    linhas.push(`${ROTULO_VISTA[v].toUpperCase()}`);
    if (achados.length === 0 && normais.length > 0) linhas.push("- Sem diferença perceptível nas medidas calculadas nesta vista.");
    achados.forEach((m) => {
      linhas.push(`- À inspeção da foto, ${m.texto}.`);
      atencao.push(`${ROTULO_VISTA[v].toLowerCase()}: ${m.rotulo.toLowerCase()}`);
    });
    if (achados.length > 0 && normais.length > 0) linhas.push(`- Sem diferença perceptível em: ${normais.map((m) => m.rotulo.toLowerCase()).join(", ")}.`);
    normais.forEach((m) => semAlteracao.push(m.rotulo.toLowerCase()));
    const referencias = a.medidas.filter((m) => m.destaque === "info");
    if (referencias.length > 0) linhas.push(`- Alinhamento vertical (referência para reavaliação): ${referencias.map((m) => m.texto).join("; ")}.`);
    a.avisos.filter((x) => !x.startsWith("Na vista posterior não são medidos") && !x.startsWith("De perfil não são medidos")).forEach((x) => linhas.push(`- Atenção à qualidade: ${x}`));
    linhas.push("");
  }

  linhas.push("SÍNTESE");
  linhas.push(
    atencao.length > 0
      ? `Pontos com diferença aparente a confirmar clinicamente: ${Array.from(new Set(atencao)).join("; ")}.`
      : "Não houve diferença aparente acima da margem de interpretação nas medidas calculadas."
  );
  linhas.push("");
  linhas.push("COMO USAR ESTE PARECER");
  linhas.push("- São achados descritivos de uma foto 2D (dependem do enquadramento, da inclinação da câmera e da distância); não estabelecem causa nem diagnóstico.");
  linhas.push("- A literatura mostra associação pequena entre a postura estática e a dor, em estudos que não provam causa (por exemplo, numa meta-análise de 2023, a diferença média do ângulo craniovertebral entre quem tem e quem não tem dor cervical foi de cerca de 3°): use os achados para comparar com a reavaliação (mesma distância, altura e posição da câmera) e para orientar o exame, não para atribuir a dor a uma postura.");
  linhas.push("- Confirme o que for relevante por palpação e nivelamento (ombros, cristas ilíacas), goniometria/inclinômetro e testes de movimento. Escápulas, curvaturas da coluna e posição da pelve não são medidas por este método.");
  linhas.push("- Os cortes de 3° (discreta) e 6° (evidente) são referências práticas do sistema, sem validação publicada.");
  linhas.push("");
  linhas.push(...linhasBaseCientifica("paula", "explicativo"));
  return linhas.join("\n");
}
