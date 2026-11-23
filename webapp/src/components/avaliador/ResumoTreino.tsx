"use client";

// "Para o treino": o que a pessoa contou na anamnese e que ajuda a prescrever, logo ao abrir a ficha.
// Só organiza as respostas (ver lib/anamnese/resumoTreino.ts); não prescreve. A decisão é do profissional.

import { useMemo, useState } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { montarResumoTreino, type ItemResumo } from "@/lib/anamnese/resumoTreino";
import { Recolhivel } from "./Recolhivel";

const COR_ITEM: Record<ItemResumo["tom"], string> = {
  normal: "text-ink",
  atencao: "text-warn font-medium",
  alerta: "text-danger font-medium",
};

const MAX_PERGUNTAS = 5;

// Perguntas para fazer agora, curtas: primeiro o que está na anamnese mas não ficou claro (com o motivo), depois o
// que não está na anamnese. Mostra no máximo 5; o resto fica atrás de "ver mais".
function PerguntarAgora({ r }: { r: ReturnType<typeof montarResumoTreino> }) {
  const [tudo, setTudo] = useState(false);
  const itens = [
    ...r.esclarecer.map((e) => ({ texto: e.pergunta, motivo: e.motivo, claro: true })),
    ...r.perguntar.map((p) => ({ texto: p, motivo: "", claro: false })),
  ];
  if (itens.length === 0) return null;
  const visiveis = tudo ? itens : itens.slice(0, MAX_PERGUNTAS);
  return (
    <div className="mt-3 rounded-xl border border-gold/60 bg-gold-soft p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gold-dark">Perguntar agora</h4>
      <ul className="mt-2 space-y-1.5 text-sm text-ink">
        {visiveis.map((p, k) => (
          <li key={k} className="leading-snug">
            <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${p.claro ? "bg-warn-soft text-warn" : "bg-border text-muted"}`}>
              {p.claro ? "não ficou claro" : "não está na anamnese"}
            </span>
            {p.texto}
            {p.motivo && <span className="text-xs text-muted"> ({p.motivo})</span>}
          </li>
        ))}
      </ul>
      {itens.length > MAX_PERGUNTAS && (
        <button type="button" onClick={() => setTudo((v) => !v)} className="mt-2 text-xs font-medium text-accent hover:underline">
          {tudo ? "mostrar menos" : `ver mais ${itens.length - MAX_PERGUNTAS}`}
        </button>
      )}
    </div>
  );
}

export function ResumoTreino({ paciente }: { paciente: PacienteRow }) {
  const r = useMemo(() => montarResumoTreino(paciente), [paciente]);
  if (r.totalItens === 0 && r.perguntar.length === 0 && r.esclarecer.length === 0) return null;
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

      <PerguntarAgora r={r} />
    </Recolhivel>
  );
}
