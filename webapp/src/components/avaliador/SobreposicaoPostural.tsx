"use client";

// Desenho da análise postural sobre a foto: esqueleto, articulações, linha de
// prumo, grade, cantoneiras e etiquetas com o valor medido (no estilo dos
// aplicativos de análise postural). O SVG usa as dimensões da foto como
// sistema de coordenadas, então escala sozinho em qualquer tela.

import type { Medida, NomePonto, Pontos, Vista } from "@/lib/avaliacao/analisePostural";
import { formatarGraus, formatarPct } from "@/lib/avaliacao/analisePostural";

const COR_ESQUELETO = "#FFE600";
const COR_ARTICULACAO = "#7CFF00";
const COR_PRUMO = "#FF3B3B";
const COR_CIANO = "#22D3EE";
const COR_BORDA: Record<Medida["destaque"], string> = { ok: "#22D3EE", discreta: "#FBBF24", evidente: "#FB7185", info: "#22D3EE" };

const CONEXOES_FRONTAL: [NomePonto, NomePonto][] = [
  ["ombro_d", "ombro_e"],
  ["ombro_d", "cotovelo_d"],
  ["cotovelo_d", "punho_d"],
  ["ombro_e", "cotovelo_e"],
  ["cotovelo_e", "punho_e"],
  ["ombro_d", "quadril_d"],
  ["ombro_e", "quadril_e"],
  ["quadril_d", "quadril_e"],
  ["quadril_d", "joelho_d"],
  ["joelho_d", "tornozelo_d"],
  ["quadril_e", "joelho_e"],
  ["joelho_e", "tornozelo_e"],
];

function conexoesLateral(lado: "d" | "e"): [NomePonto, NomePonto][] {
  const n = (base: string) => `${base}_${lado}` as NomePonto;
  return [
    [n("orelha"), n("ombro")],
    [n("ombro"), n("quadril")],
    [n("quadril"), n("joelho")],
    [n("joelho"), n("tornozelo")],
    [n("tornozelo"), n("pe")],
    [n("tornozelo"), n("calcanhar")],
    [n("ombro"), n("cotovelo")],
    [n("cotovelo"), n("punho")],
  ];
}

const VISIVEL = 0.5;

type Caixa = { medida: Medida; x: number; y: number; coluna: "esq" | "dir" };

export function SobreposicaoPostural({
  urlImagem,
  largura,
  altura,
  pontos,
  medidas,
  linhaPrumoX,
  vista,
  grade = true,
}: {
  urlImagem: string;
  largura: number;
  altura: number;
  pontos: Pontos;
  medidas: Medida[];
  linhaPrumoX: number | null;
  vista: Vista;
  grade?: boolean;
}) {
  const L = largura;
  const H = altura;
  const u = L / 1000; // unidade de escala (1 = 0,1% da largura)

  const conexoes = vista === "anterior" || vista === "posterior" ? CONEXOES_FRONTAL : conexoesLateral(vista === "lateral_d" ? "d" : "e");
  const visiveis = (Object.entries(pontos) as [NomePonto, { x: number; y: number; v: number }][]).filter(([, p]) => p.v >= VISIVEL);
  const pontoVisivel = (n: NomePonto) => {
    const p = pontos[n];
    return p && p.v >= VISIVEL ? p : null;
  };

  // Caixa do corpo (para as cantoneiras e o prumo).
  const xs = visiveis.map(([, p]) => p.x);
  const ys = visiveis.map(([, p]) => p.y);
  const pad = 0.05 * L;
  const caixa =
    visiveis.length > 0
      ? { x0: Math.max(0, Math.min(...xs) - pad), x1: Math.min(L, Math.max(...xs) + pad), y0: Math.max(0, Math.min(...ys) - pad), y1: Math.min(H, Math.max(...ys) + pad) }
      : null;

  // Etiquetas: só as medidas que são "achado" (as de referência de prumo ficam na lista).
  const comEtiqueta = medidas.filter((m) => m.destaque !== "info");
  const bw = 0.33 * L;
  const bh = 0.14 * L;
  const margem = 0.02 * L;
  const caixas: Caixa[] = [];
  {
    let esq = 0;
    let dir = 0;
    for (const m of comEtiqueta) {
      // Quem está no lado esquerdo da foto vai para a coluna esquerda; no centro, equilibra.
      const coluna: "esq" | "dir" = m.ancora.x < L * 0.45 ? "esq" : m.ancora.x > L * 0.55 ? "dir" : esq <= dir ? "esq" : "dir";
      if (coluna === "esq") esq++;
      else dir++;
      caixas.push({ medida: m, x: coluna === "esq" ? margem : L - bw - margem, y: m.ancora.y - bh / 2, coluna });
    }
    // Resolve sobreposição vertical em cada coluna.
    for (const col of ["esq", "dir"] as const) {
      const grupo = caixas.filter((c) => c.coluna === col).sort((a, b) => a.y - b.y);
      let minimo = margem;
      for (const c of grupo) {
        c.y = Math.max(c.y, minimo);
        minimo = c.y + bh + 0.012 * L;
      }
      // Se passou do fim da foto, empurra o grupo para cima.
      const excesso = (grupo[grupo.length - 1]?.y ?? 0) + bh + margem - H;
      if (excesso > 0) for (const c of grupo) c.y = Math.max(margem, c.y - excesso);
    }
  }

  const rotuloValor = (m: Medida) => (m.unidade === "°" ? formatarGraus(m.valor) : formatarPct(m.valor));

  return (
    <svg viewBox={`0 0 ${L} ${H}`} className="w-full h-auto rounded-xl bg-black" role="img" aria-label="Foto com a análise postural desenhada">
      <image href={urlImagem} x={0} y={0} width={L} height={H} preserveAspectRatio="none" />
      {/* leve escurecimento para destacar o desenho */}
      <rect x={0} y={0} width={L} height={H} fill="#031326" opacity={0.18} />

      {grade && (
        <g stroke={COR_CIANO} strokeWidth={1.2 * u} opacity={0.14}>
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={((i + 1) * L) / 10} y1={0} x2={((i + 1) * L) / 10} y2={H} />
          ))}
          {Array.from({ length: Math.floor(H / (L / 10)) }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={((i + 1) * L) / 10} x2={L} y2={((i + 1) * L) / 10} />
          ))}
        </g>
      )}

      {/* cantoneiras */}
      {caixa && (
        <g stroke={COR_CIANO} strokeWidth={4 * u} fill="none" strokeLinecap="round">
          {(() => {
            const c = 0.07 * L;
            const { x0, x1, y0, y1 } = caixa;
            return (
              <>
                <path d={`M ${x0} ${y0 + c} V ${y0} H ${x0 + c}`} />
                <path d={`M ${x1 - c} ${y0} H ${x1} V ${y0 + c}`} />
                <path d={`M ${x0} ${y1 - c} V ${y1} H ${x0 + c}`} />
                <path d={`M ${x1 - c} ${y1} H ${x1} V ${y1 - c}`} />
              </>
            );
          })()}
        </g>
      )}

      {/* linha de prumo */}
      {linhaPrumoX !== null && caixa && <line x1={linhaPrumoX} y1={caixa.y0} x2={linhaPrumoX} y2={caixa.y1} stroke={COR_PRUMO} strokeWidth={3 * u} strokeDasharray={`${16 * u} ${11 * u}`} />}

      {/* esqueleto */}
      <g stroke={COR_ESQUELETO} strokeWidth={5 * u} strokeLinecap="round">
        {conexoes.map(([a, b]) => {
          const pa = pontoVisivel(a);
          const pb = pontoVisivel(b);
          return pa && pb ? <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} /> : null;
        })}
      </g>
      <g>
        {visiveis
          .filter(([nome]) => conexoes.some(([a, b]) => a === nome || b === nome))
          .map(([nome, p]) => (
            <circle key={nome} cx={p.x} cy={p.y} r={7.5 * u} fill={COR_ARTICULACAO} stroke="#0B2A00" strokeWidth={1.8 * u} />
          ))}
      </g>

      {/* etiquetas com linha de ligação */}
      {caixas.map((c) => {
        const m = c.medida;
        const bordaX = c.coluna === "esq" ? c.x + bw : c.x;
        const cor = COR_BORDA[m.destaque];
        return (
          <g key={m.id}>
            <line x1={bordaX} y1={c.y + bh / 2} x2={m.ancora.x} y2={m.ancora.y} stroke={COR_CIANO} strokeWidth={2.6 * u} opacity={0.9} />
            <circle cx={m.ancora.x} cy={m.ancora.y} r={5 * u} fill={COR_CIANO} />
            <rect x={c.x} y={c.y} width={bw} height={bh} rx={11 * u} fill="#061630" fillOpacity={0.86} stroke={cor} strokeWidth={3.2 * u} />
            <text x={c.x + 0.02 * L} y={c.y + 0.04 * L} fontSize={0.03 * L} fontWeight={600} fill="#E6F4FF">
              {m.rotulo}
            </text>
            <text x={c.x + 0.02 * L} y={c.y + 0.093 * L} fontSize={0.055 * L} fontWeight={800} fill="#FFFFFF">
              {rotuloValor(m)}
            </text>
            <text x={c.x + 0.02 * L} y={c.y + 0.125 * L} fontSize={0.022 * L} fill={m.destaque === "ok" ? "#9FB8D0" : cor}>
              {m.curto}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
