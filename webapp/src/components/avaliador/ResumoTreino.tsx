"use client";

// "Para o treino": o que a pessoa contou na anamnese e que ajuda a prescrever, logo ao abrir a ficha.
// Só organiza as respostas (ver lib/anamnese/resumoTreino.ts); não prescreve. A decisão é do profissional.

import { useMemo } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { montarResumoTreino, type ItemResumo } from "@/lib/anamnese/resumoTreino";
import { Recolhivel } from "./Recolhivel";

const COR_ITEM: Record<ItemResumo["tom"], string> = {
  normal: "text-ink",
  atencao: "text-warn font-medium",
  alerta: "text-danger font-medium",
};

export function ResumoTreino({ paciente }: { paciente: PacienteRow }) {
  const r = useMemo(() => montarResumoTreino(paciente), [paciente]);
  if (r.totalItens === 0 && r.perguntar.length === 0) return null;
  return (
    <Recolhivel
      aberto
      tom="accent"
      titulo="Para o treino: o que foi dito na anamnese"
      resumo={r.totalItens > 0 ? `${r.totalItens} informações` : "sem respostas ainda"}
    >
      {!r.anamneseConcluida && (
        <p className="mb-3 rounded-lg bg-gold-soft px-3 py-2 text-xs font-medium text-gold-dark">
          A anamnese ainda não foi concluída: este resumo é parcial.
        </p>
      )}

      <div className="md:columns-2 md:gap-3">
        {r.secoes.map((s) => (
          <section
            key={s.id}
            className={`mb-3 break-inside-avoid rounded-xl border bg-surface p-4 ${s.seguranca ? "border-warn/30" : "border-border"}`}
          >
            <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${s.seguranca ? "text-warn" : "text-accent"}`}>{s.titulo}</h4>
            <dl className="space-y-1.5 text-sm">
              {s.itens.map((i, k) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{i.rotulo}</dt>
                  <dd className={`leading-snug ${COR_ITEM[i.tom]}`}>{i.valor}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      {r.perguntar.length > 0 && (
        <div className="mt-3 rounded-xl border border-gold/60 bg-gold-soft p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Perguntar agora (não está na anamnese)</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            {r.perguntar.map((p, k) => (
              <li key={k}>{p}</li>
            ))}
          </ul>
        </div>
      )}
    </Recolhivel>
  );
}
