"use client";

// Figura holográfica da tela de abertura: ao longo de um ciclo de 9 s o corpo "evolui" (mais massa muscular, cintura
// mais fina) e os percentuais andam. É uma ILUSTRAÇÃO de exemplo, não representa resultado de ninguém. O esqueleto de
// pontos dourados lembra a leitura de postura do próprio aplicativo. Tudo roda no aparelho, sem imagem nem vídeo.

import { useEffect, useRef } from "react";
import { MEDIDORES, caminhoFaixa, lerp, mistura, progressoNoCiclo, valorDoMedidor } from "@/lib/abertura/avatar";

const CIANO = "#7DD3FC";

const YS_TRONCO = [58, 68, 90, 115, 140, 166];
const TRONCO_ANTES = [8, 26, 25, 24, 27, 27];
const TRONCO_DEPOIS = [9, 35, 31, 25, 21, 24];
const YS_PERNA = [164, 190, 230, 275, 318];
const PERNA_DX_ANTES = [14, 14, 13, 12, 11];
const PERNA_DX_DEPOIS = [15, 15, 13, 12, 11];
const PERNA_HW_ANTES = [14, 12, 9, 7, 6];
const PERNA_HW_DEPOIS = [16, 15, 10, 8, 6.5];
const YS_BRACO = [70, 92, 118, 148, 176];
const BRACO_DX_ANTES = [32, 35, 38, 40, 41];
const BRACO_DX_DEPOIS = [43, 47, 50, 52, 53];
const BRACO_HW_ANTES = [6, 5.5, 4.5, 4, 3.5];
const BRACO_HW_DEPOIS = [10, 9, 6.5, 5, 4];

// Segmentos do esqueleto, por índice dos pontos (ver pontosDoEsqueleto).
const OSSOS: [number, number][] = [[0, 1], [2, 3], [2, 4], [4, 6], [3, 5], [5, 7], [8, 9], [2, 8], [3, 9], [8, 10], [10, 12], [9, 11], [11, 13]];

function pontosDoEsqueleto(p: number): [number, number][] {
  const tr = mistura(TRONCO_ANTES, TRONCO_DEPOIS, p);
  const bx = mistura(BRACO_DX_ANTES, BRACO_DX_DEPOIS, p);
  const px = mistura(PERNA_DX_ANTES, PERNA_DX_DEPOIS, p);
  const ombro = tr[1] * 0.85;
  const quadril = px[0] * 0.8;
  return [
    [100, 32], [100, 62],
    [100 - ombro, 70], [100 + ombro, 70],
    [100 - bx[2], YS_BRACO[2]], [100 + bx[2], YS_BRACO[2]],
    [100 - bx[4], YS_BRACO[4]], [100 + bx[4], YS_BRACO[4]],
    [100 - quadril, 166], [100 + quadril, 166],
    [100 - px[2], YS_PERNA[2]], [100 + px[2], YS_PERNA[2]],
    [100 - px[4], YS_PERNA[4]], [100 + px[4], YS_PERNA[4]],
  ];
}

export function AvatarEvolucao() {
  const els = useRef<Record<string, SVGElement | null>>({});
  const valores = useRef<Record<string, HTMLElement | null>>({});
  const barras = useRef<Record<string, HTMLElement | null>>({});
  const reg = (k: string) => (e: SVGElement | null) => {
    els.current[k] = e;
  };

  useEffect(() => {
    const set = (k: string, atributo: string, v: string | number) => els.current[k]?.setAttribute(atributo, String(v));

    function aplicar(p: number) {
      const tr = mistura(TRONCO_ANTES, TRONCO_DEPOIS, p);
      const bx = mistura(BRACO_DX_ANTES, BRACO_DX_DEPOIS, p);
      const bh = mistura(BRACO_HW_ANTES, BRACO_HW_DEPOIS, p);
      const px = mistura(PERNA_DX_ANTES, PERNA_DX_DEPOIS, p);
      const ph = mistura(PERNA_HW_ANTES, PERNA_HW_DEPOIS, p);

      set("tronco", "d", caminhoFaixa(YS_TRONCO.map(() => 100), YS_TRONCO, tr));
      set("bracoE", "d", caminhoFaixa(bx.map((x) => 100 - x), YS_BRACO, bh));
      set("bracoD", "d", caminhoFaixa(bx.map((x) => 100 + x), YS_BRACO, bh));
      set("pernaE", "d", caminhoFaixa(px.map((x) => 100 - x), YS_PERNA, ph));
      set("pernaD", "d", caminhoFaixa(px.map((x) => 100 + x), YS_PERNA, ph));

      // Realce dourado dos músculos: aparece e cresce com a evolução.
      const op = (0.08 + 0.5 * p).toFixed(2);
      const peitoX = lerp(13, 17, p), peitoRx = lerp(7, 12, p), peitoRy = lerp(6, 10, p);
      for (const [k, sinal] of [["peitoE", -1], ["peitoD", 1]] as const) {
        set(k, "cx", 100 + sinal * peitoX); set(k, "rx", peitoRx); set(k, "ry", peitoRy); set(k, "opacity", op);
      }
      for (const [k, sinal] of [["bicepsE", -1], ["bicepsD", 1]] as const) {
        set(k, "cx", 100 + sinal * lerp(35.5, 47.5, p)); set(k, "rx", bh[1] * 0.85); set(k, "opacity", op);
      }
      for (const [k, sinal] of [["quadE", -1], ["quadD", 1]] as const) {
        set(k, "cx", 100 + sinal * px[1]); set(k, "rx", ph[1] * 0.72); set(k, "opacity", op);
      }

      const pts = pontosDoEsqueleto(p);
      set("ossos", "d", OSSOS.map(([a, b]) => `M${pts[a][0].toFixed(1)},${pts[a][1].toFixed(1)}L${pts[b][0].toFixed(1)},${pts[b][1].toFixed(1)}`).join(""));
      pts.forEach(([x, y], i) => {
        set(`ponto${i}`, "cx", x.toFixed(1));
        set(`ponto${i}`, "cy", y.toFixed(1));
      });

      for (const m of MEDIDORES) {
        const v = valorDoMedidor(m, p);
        const el = valores.current[m.chave];
        if (el) el.textContent = `${Math.round(v)}${m.unidade}`;
        const b = barras.current[m.chave];
        if (b) b.style.width = `${Math.max(0, Math.min(100, (v / m.max) * 100)).toFixed(1)}%`;
      }
    }

    const reduzido = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduzido) {
      aplicar(1);
      return;
    }
    aplicar(0);
    const inicio = performance.now();
    let id = 0;
    const quadro = (agora: number) => {
      aplicar(progressoNoCiclo(agora - inicio));
      id = requestAnimationFrame(quadro);
    };
    id = requestAnimationFrame(quadro);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="abertura-entra mt-6 w-full rounded-3xl border border-white/15 bg-white/5 p-3 sm:mt-8 sm:p-5"
      style={{ animationDelay: "600ms" }}
      role="img"
      aria-label="Ilustração animada de exemplo: uma figura que ganha massa muscular e perde gordura, com os percentuais mudando. Não representa resultado de nenhuma pessoa."
    >
      <div className="flex items-center gap-3 sm:gap-8" aria-hidden="true">
        <svg viewBox="0 0 200 340" className="h-52 w-auto shrink-0 sm:h-72" fill="none">
          <defs>
            <linearGradient id="avatar-corpo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={CIANO} stopOpacity="0.32" />
              <stop offset="1" stopColor={CIANO} stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="avatar-varredura" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={CIANO} stopOpacity="0" />
              <stop offset="0.5" stopColor={CIANO} stopOpacity="0.9" />
              <stop offset="1" stopColor={CIANO} stopOpacity="0" />
            </linearGradient>
            <pattern id="avatar-grade" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" stroke="#fff" strokeOpacity="0.07" strokeWidth="0.6" />
            </pattern>
          </defs>

          <rect x="0" y="0" width="200" height="340" rx="14" fill="url(#avatar-grade)" />

          {/* plataforma */}
          <ellipse cx="100" cy="326" rx="62" ry="9" stroke={CIANO} strokeOpacity="0.55" strokeWidth="1" />
          <ellipse cx="100" cy="326" rx="84" ry="13" stroke={CIANO} strokeOpacity="0.3" strokeWidth="0.8" className="avatar-anel" />

          {/* corpo */}
          <g stroke={CIANO} strokeWidth="1.3" strokeLinejoin="round" fill="url(#avatar-corpo)">
            <path ref={reg("pernaE")} />
            <path ref={reg("pernaD")} />
            <path ref={reg("bracoE")} />
            <path ref={reg("bracoD")} />
            <path ref={reg("tronco")} />
            <circle cx="100" cy="32" r="15" />
          </g>

          {/* realce dourado dos músculos */}
          <g className="fill-gold">
            <ellipse ref={reg("peitoE")} cy="92" />
            <ellipse ref={reg("peitoD")} cy="92" />
            <ellipse ref={reg("bicepsE")} cy="98" ry="13" />
            <ellipse ref={reg("bicepsD")} cy="98" ry="13" />
            <ellipse ref={reg("quadE")} cy="212" ry="26" />
            <ellipse ref={reg("quadD")} cy="212" ry="26" />
          </g>

          {/* esqueleto de pontos, como na leitura de postura */}
          <path ref={reg("ossos")} className="stroke-gold" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
          {Array.from({ length: 14 }, (_, i) => (
            <circle key={i} ref={reg(`ponto${i}`)} r="2.4" className="fill-gold" stroke="#fff" strokeWidth="0.8" />
          ))}

          {/* linha de varredura */}
          <rect x="6" y="0" width="188" height="3" fill="url(#avatar-varredura)" className="avatar-varredura" />
        </svg>

        <div className="min-w-0 flex-1 space-y-3.5 text-left sm:space-y-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-xs" style={{ color: CIANO }}>
            <span className="avatar-pisca mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: CIANO }} />
            Evolução · ilustração de exemplo
          </p>
          {MEDIDORES.map((m) => (
            <div key={m.chave}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-white/75 sm:text-sm">{m.rotulo}</span>
                <span ref={(e) => { valores.current[m.chave] = e; }} className="font-mono text-base font-semibold tabular-nums text-gold sm:text-xl" />
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  ref={(e) => { barras.current[m.chave] = e; }}
                  className="h-full rounded-full"
                  style={{ background: m.chave === "gordura" ? CIANO : "#C9A24D", width: "0%" }}
                />
              </div>
            </div>
          ))}
          <p className="text-[10px] leading-snug text-white/45 sm:text-xs">Os números são só um exemplo animado. Cada pessoa tem o seu caminho; a sua avaliação mostra o seu ponto de partida.</p>
        </div>
      </div>
    </div>
  );
}
