"use client";

// Avaliações fundamentais para este paciente (Dra. Nina, assistente de IA), a partir da anamnese: quadro curto no
// topo de cada aba e pendências na barra fixa da ficha. Só sugere e avisa; nada é bloqueado. A decisão é do avaliador.

import { useState } from "react";
import { ROTULO_SETOR, pendentesFundamentais, type Fonte, type ItemAvaliacao, type SetorFundamental } from "@/lib/avaliacao/avaliacoesFundamentais";

const MAX_CHIPS = 5;

function textoFontes(fontes: Fonte[]): string {
  return fontes.map((f) => f.curta).join("; ");
}
function tituloFontes(fontes: Fonte[]): string {
  return fontes.map((f) => (f.pmid ? `${f.curta} (PMID ${f.pmid})` : f.curta)).join("; ");
}

function Motivo({ i }: { i: ItemAvaliacao }) {
  return (
    <span className="text-xs text-muted" title={tituloFontes(i.fontes)}>
      {" "}
      ({i.motivos.join("; ")} · {textoFontes(i.fontes)})
    </span>
  );
}

export function QuadroFundamentais({ itens, setor }: { itens: ItemAvaliacao[]; setor: SetorFundamental }) {
  const [verRecomendadas, setVerRecomendadas] = useState(false);
  const doSetor = itens.filter((i) => i.setor === setor);
  if (doSetor.length === 0) return null;
  const fundamentais = doSetor.filter((i) => i.prioridade === "fundamental");
  const recomendadas = doSetor.filter((i) => i.prioridade === "recomendado");
  const evitar = doSetor.filter((i) => i.prioridade === "evitar");
  const faltam = fundamentais.filter((i) => !i.feito).length;

  return (
    <section id={`fundamentais-${setor}`} className="mb-4 scroll-mt-28 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-accent">Avaliações fundamentais para este paciente</h4>
        <span className={`text-xs font-medium ${faltam > 0 ? "text-warn" : "text-ok-dark"}`}>
          {fundamentais.length === 0 ? "" : faltam > 0 ? `faltam ${faltam} de ${fundamentais.length}` : "todas feitas ✓"}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-muted">Sugestão da Dra. Nina (assistente de IA) a partir da anamnese. Nada é bloqueado: a decisão é sua.</p>

      {fundamentais.length > 0 && (
        <ul className="mt-2 space-y-1">
          {fundamentais.map((i) => (
            <li key={i.id} className="leading-snug">
              <span className={`mr-1.5 inline-block w-4 text-center font-semibold ${i.feito ? "text-ok-dark" : "text-warn"}`}>{i.feito ? "✓" : "○"}</span>
              <span className={i.feito ? "text-muted line-through decoration-ok/50" : "font-medium text-ink"}>{i.titulo}</span>
              <Motivo i={i} />
            </li>
          ))}
        </ul>
      )}

      {evitar.length > 0 && (
        <div className="mt-3 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-warn">Adiar ou evitar (aviso)</p>
          <ul className="mt-1 space-y-1">
            {evitar.map((i) => (
              <li key={i.id} className="leading-snug text-ink">
                {i.titulo}
                <Motivo i={i} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {recomendadas.length > 0 && (
        <div className="mt-2">
          <button type="button" onClick={() => setVerRecomendadas((v) => !v)} className="text-xs font-medium text-accent hover:underline">
            {verRecomendadas ? "esconder as recomendadas" : `ver ${recomendadas.length} recomendada(s)`}
          </button>
          {verRecomendadas && (
            <ul className="mt-1 space-y-1">
              {recomendadas.map((i) => (
                <li key={i.id} className="leading-snug">
                  <span className={`mr-1.5 inline-block w-4 text-center ${i.feito ? "text-ok-dark" : "text-muted"}`}>{i.feito ? "✓" : "·"}</span>
                  <span className={i.feito ? "text-muted" : "text-ink"}>{i.titulo}</span>
                  <Motivo i={i} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

// Linha da barra fixa: o que falta do fundamental, sem rolar a tela. Clicar leva à aba e ao quadro.
export function BarraFundamentais({ itens, aoAbrir }: { itens: ItemAvaliacao[]; aoAbrir: (setor: SetorFundamental) => void }) {
  const [tudo, setTudo] = useState(false);
  if (itens.length === 0) return null;
  const faltam = pendentesFundamentais(itens);
  const visiveis = tudo ? faltam : faltam.slice(0, MAX_CHIPS);
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs" aria-label="Avaliações fundamentais pendentes">
      <span className={`mr-1 font-semibold ${faltam.length > 0 ? "text-warn" : "text-ok-dark"}`}>
        {faltam.length > 0 ? `Faltam ${faltam.length} avaliação(ões) fundamental(is):` : "Avaliações fundamentais feitas ✓"}
      </span>
      {visiveis.map((i) => (
        <button
          key={i.id}
          type="button"
          onClick={() => aoAbrir(i.setor)}
          title={`${i.motivos.join("; ")} · ${tituloFontes(i.fontes)}`}
          className="rounded-full border border-warn/60 bg-bg px-2.5 py-0.5 text-warn transition hover:bg-warn-soft"
        >
          {ROTULO_SETOR[i.setor]} · {i.titulo}
        </button>
      ))}
      {faltam.length > MAX_CHIPS && (
        <button type="button" onClick={() => setTudo((v) => !v)} className="font-medium text-accent hover:underline">
          {tudo ? "mostrar menos" : `+${faltam.length - MAX_CHIPS}`}
        </button>
      )}
    </div>
  );
}

export function irParaFundamentais(setor: SetorFundamental) {
  setTimeout(() => document.getElementById(`fundamentais-${setor}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
}
