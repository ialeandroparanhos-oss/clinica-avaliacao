"use client";

// Mapa corporal da dor: o paciente toca nas regiões (frente e costas); para cada
// região aparece uma escala de dor (0-10) e "há quanto tempo", em botões.

import { useEffect, useRef, useState } from "react";
import type { Anamnese } from "@/lib/anamnese/types";
import { CheckboxGroup } from "@/components/forms";
import { opcoesDuracaoDor, regioesCorporais } from "@/lib/anamnese/questionnaires";
import { corIntensidade, derivadosDaDor, regioesEfetivas, textoIntensidade, type PorRegiao } from "@/lib/anamnese/dorPorRegiao";

type Retangulo = { x: number; y: number; w: number; h: number; rx: number };
type ZonaLateral = { chave: string; forma: Retangulo; direito: string; esquerdo: string };

// Geometria do lado ESQUERDO do desenho (de quem olha); o direito é espelhado.
const ZONAS_LATERAIS: ZonaLateral[] = [
  { chave: "ombro", forma: { x: 36, y: 66, w: 30, h: 72, rx: 14 }, direito: "Ombro direito", esquerdo: "Ombro esquerdo" },
  { chave: "cotovelo", forma: { x: 34, y: 138, w: 26, h: 66, rx: 12 }, direito: "Cotovelo/antebraço direito", esquerdo: "Cotovelo/antebraço esquerdo" },
  { chave: "mao", forma: { x: 32, y: 204, w: 26, h: 34, rx: 10 }, direito: "Punho/mão direita", esquerdo: "Punho/mão esquerda" },
  { chave: "quadril", forma: { x: 62, y: 206, w: 38, h: 80, rx: 14 }, direito: "Quadril direito", esquerdo: "Quadril esquerdo" },
  { chave: "joelho", forma: { x: 64, y: 286, w: 34, h: 58, rx: 12 }, direito: "Joelho direito", esquerdo: "Joelho esquerdo" },
  { chave: "pe", forma: { x: 62, y: 344, w: 36, h: 86, rx: 12 }, direito: "Tornozelo/pé direito", esquerdo: "Tornozelo/pé esquerdo" },
];

type Vista = "frente" | "costas";

type Zona = { regiao: string; forma: Retangulo | null; elipse?: { cx: number; cy: number; rx: number; ry: number } };

function zonasDaVista(vista: Vista): Zona[] {
  const zonas: Zona[] = [{ regiao: "Cabeça/pescoço", forma: null, elipse: { cx: 100, cy: 40, rx: 24, ry: 38 } }];
  for (const z of ZONAS_LATERAIS) {
    const esq = z.forma;
    const dirForma: Retangulo = { ...esq, x: 200 - esq.x - esq.w };
    // De frente, a esquerda de quem olha é o lado DIREITO do paciente; de costas, é o esquerdo.
    zonas.push({ regiao: vista === "frente" ? z.direito : z.esquerdo, forma: esq });
    zonas.push({ regiao: vista === "frente" ? z.esquerdo : z.direito, forma: dirForma });
  }
  if (vista === "costas") {
    zonas.push({ regiao: "Coluna torácica", forma: { x: 74, y: 72, w: 52, h: 72, rx: 12 } });
    zonas.push({ regiao: "Coluna lombar", forma: { x: 74, y: 144, w: 52, h: 62, rx: 12 } });
  }
  return zonas;
}

export function MapaDor({ dor, onChange }: { dor: Anamnese["dor"]; onChange: (patch: Partial<Anamnese["dor"]>) => void }) {
  const por = regioesEfetivas(dor);
  const [foco, setFoco] = useState<string | null>(null);
  const cartoes = useRef<Record<string, HTMLDivElement | null>>({});

  function gravar(novo: PorRegiao) {
    onChange(derivadosDaDor(novo));
  }

  function alternar(regiao: string) {
    if (por[regiao]) {
      const { [regiao]: _removida, ...resto } = por;
      gravar(resto);
      setFoco(null);
    } else {
      gravar({ ...por, [regiao]: { intensidade: null, duracao: "" } });
      setFoco(regiao);
    }
  }

  function atualizar(regiao: string, patch: Partial<PorRegiao[string]>) {
    gravar({ ...por, [regiao]: { ...por[regiao], ...patch } });
  }

  // Ao tocar numa região, leva o paciente até a escala daquela região.
  useEffect(() => {
    if (foco && cartoes.current[foco]) cartoes.current[foco]!.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [foco]);

  const selecionadas = Object.keys(por);

  function desenhaZona(z: Zona, chave: string, dx: number) {
    const sel = por[z.regiao];
    const intensidade = sel?.intensidade ?? null;
    const fill = sel ? (intensidade !== null ? corIntensidade(intensidade) : undefined) : undefined;
    const classe = sel
      ? `stroke-accent-dark cursor-pointer ${intensidade === null ? "fill-accent-soft" : ""}`
      : "fill-surface stroke-border cursor-pointer hover:fill-accent-soft";
    const centro = z.elipse ? { x: z.elipse.cx, y: z.elipse.cy } : { x: z.forma!.x + z.forma!.w / 2, y: z.forma!.y + z.forma!.h / 2 };
    return (
      <g
        key={chave}
        transform={`translate(${dx} 0)`}
        role="button"
        tabIndex={0}
        aria-pressed={!!sel}
        aria-label={`${z.regiao}${sel ? (intensidade !== null ? `, dor ${intensidade} de 10` : ", selecionada") : ""}`}
        onClick={() => alternar(z.regiao)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            alternar(z.regiao);
          }
        }}
        className="outline-none focus-visible:[&>*:first-child]:stroke-ink"
      >
        {z.elipse ? (
          <ellipse cx={z.elipse.cx} cy={z.elipse.cy} rx={z.elipse.rx} ry={z.elipse.ry} className={classe} style={fill ? { fill } : undefined} strokeWidth={2} />
        ) : (
          <rect x={z.forma!.x} y={z.forma!.y} width={z.forma!.w} height={z.forma!.h} rx={z.forma!.rx} className={classe} style={fill ? { fill } : undefined} strokeWidth={2} />
        )}
        <title>{z.regiao}</title>
        {sel && intensidade !== null && (
          <text x={centro.x} y={centro.y + 5} textAnchor="middle" fontSize={15} fontWeight={700} className="fill-ink pointer-events-none">
            {intensidade}
          </text>
        )}
      </g>
    );
  }

  function figura(vista: Vista, dx: number) {
    return (
      <g key={vista}>
        <g transform={`translate(${dx} 0)`}>
          <rect x={66} y={66} width={68} height={140} rx={18} className="fill-none stroke-border" strokeWidth={2} />
          <text x={100} y={462} textAnchor="middle" fontSize={13} fontWeight={600} className="fill-muted">
            {vista === "frente" ? "Frente" : "Costas"}
          </text>
          <text x={18} y={58} fontSize={12} className="fill-muted">
            {vista === "frente" ? "D" : "E"}
          </text>
          <text x={182} y={58} fontSize={12} textAnchor="end" className="fill-muted">
            {vista === "frente" ? "E" : "D"}
          </text>
        </g>
        {zonasDaVista(vista).map((z) => desenhaZona(z, `${vista}-${z.regiao}`, dx))}
      </g>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Toque no desenho, na parte do corpo onde sente dor (frente ou costas). Toque de novo para desmarcar. D = seu lado direito, E = seu lado esquerdo.</p>

      <div className="rounded-xl border border-border bg-bg p-3">
        <svg viewBox="0 0 420 472" className="w-full max-w-md mx-auto touch-manipulation" role="group" aria-label="Mapa do corpo para marcar a dor">
          {figura("frente", 0)}
          {figura("costas", 220)}
        </svg>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted hover:text-ink">Prefere marcar por uma lista?</summary>
        <div className="mt-2">
          <CheckboxGroup
            columns={2}
            options={regioesCorporais}
            values={selecionadas}
            onChange={(vals) => {
              const novo: PorRegiao = {};
              for (const r of vals) novo[r] = por[r] ?? { intensidade: null, duracao: "" };
              const adicionada = vals.find((r) => !por[r]);
              gravar(novo);
              setFoco(adicionada ?? null);
            }}
          />
        </div>
      </details>

      {selecionadas.length > 0 && (
        <div className="space-y-3">
          {selecionadas.map((regiao) => {
            const v = por[regiao];
            return (
              <div
                key={regiao}
                ref={(el) => {
                  cartoes.current[regiao] = el;
                }}
                className={`rounded-xl border p-4 space-y-3 ${foco === regiao ? "border-accent ring-2 ring-accent/30" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-ink">{regiao}</p>
                  <button type="button" onClick={() => alternar(regiao)} className="text-xs text-muted hover:text-danger shrink-0">
                    remover
                  </button>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink mb-1.5">Quanto dói aqui? (0 = sem dor · 10 = pior dor imaginável)</p>
                  <div className="grid grid-cols-11 gap-1">
                    {Array.from({ length: 11 }, (_, n) => {
                      const ativo = v.intensidade === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => atualizar(regiao, { intensidade: n })}
                          aria-pressed={ativo}
                          aria-label={`Dor ${n} de 10`}
                          style={{ backgroundColor: ativo ? corIntensidade(n) : undefined, borderColor: corIntensidade(n) }}
                          className={`rounded-md border-2 py-2 text-sm font-semibold transition ${ativo ? "text-ink scale-110 shadow" : "bg-surface text-muted hover:text-ink"}`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted mt-1.5 min-h-[1rem]">
                    {v.intensidade !== null ? `${v.intensidade}/10 - ${textoIntensidade(v.intensidade)}` : "Toque no número que melhor representa a sua dor nesta região."}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink mb-1.5">Há quanto tempo você sente essa dor?</p>
                  <div className="flex flex-wrap gap-2">
                    {opcoesDuracaoDor.map((o) => {
                      const ativo = v.duracao === o;
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() => atualizar(regiao, { duracao: ativo ? "" : o })}
                          aria-pressed={ativo}
                          className={`rounded-full border px-3 py-1.5 text-sm transition ${
                            ativo ? "bg-accent text-white border-accent" : "bg-surface text-ink border-border hover:border-accent"
                          }`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
