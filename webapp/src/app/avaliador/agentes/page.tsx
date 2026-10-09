"use client";

// Equipe de agentes: ilustração de cada assistente de IA, com nome, área e opção de baixar a imagem.

import { useRef } from "react";
import Link from "next/link";
import AgenteAvatar from "@/components/avaliador/AgenteAvatar";
import { AGENTES_SISTEMA, type AgenteId } from "@/lib/agentes";

const ORDEM: AgenteId[] = ["nina", "sofia", "marco", "paula", "rita", "iris", "theo", "clara", "caio"];

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Cartao({ id }: { id: AgenteId }) {
  const ref = useRef<HTMLDivElement>(null);
  const a = AGENTES_SISTEMA[id];

  function svgTexto(): string | null {
    const svg = ref.current?.querySelector("svg");
    return svg ? new XMLSerializer().serializeToString(svg) : null;
  }

  function baixarSvg() {
    const t = svgTexto();
    if (t) baixar(new Blob([t], { type: "image/svg+xml" }), `agente-${a.nome.toLowerCase()}.svg`);
  }

  function baixarPng() {
    const t = svgTexto();
    if (!t) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 800;
      c.height = 800;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 800, 800);
      c.toBlob((b) => b && baixar(b, `agente-${a.nome.toLowerCase()}.png`), "image/png");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(t);
  }

  return (
    <li className="rounded-2xl border border-border bg-surface p-5 flex flex-col items-center text-center break-inside-avoid">
      <div ref={ref}>
        <AgenteAvatar id={id} tamanho={168} titulo={`Ilustração de ${a.tratamento} ${a.nome}`} />
      </div>
      <h2 className="font-display text-xl text-ink mt-3">
        {a.tratamento} {a.nome}
      </h2>
      <span className="mt-1 text-xs font-medium rounded-full bg-info-soft text-info px-2 py-0.5">assistente de IA</span>
      <p className="text-sm text-muted mt-2 leading-snug">
        Agente {a.numero}: {a.especialidade}
      </p>
      <div className="flex gap-3 mt-3 text-xs print:hidden">
        <button type="button" onClick={baixarSvg} className="font-medium text-accent hover:underline">
          Baixar SVG
        </button>
        <button type="button" onClick={baixarPng} className="font-medium text-accent hover:underline">
          Baixar PNG
        </button>
      </div>
    </li>
  );
}

export default function Equipe() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl text-ink">Equipe de assistentes de IA</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Cada agente tem uma ilustração para você identificar de quem é cada parecer. São personagens fictícios, não representam pessoas reais nem profissionais registrados:
            quem avalia, revisa e assina é o profissional.
          </p>
        </div>
        <Link href="/avaliador" className="text-sm text-muted hover:text-ink print:hidden">
          ← Pacientes
        </Link>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ORDEM.map((id) => (
          <Cartao key={id} id={id} />
        ))}
      </ul>
    </main>
  );
}
