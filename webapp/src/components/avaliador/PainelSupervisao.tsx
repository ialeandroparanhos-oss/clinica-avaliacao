"use client";

// Supervisão da Dra. Nina: conferência de cobertura, cruzamentos entre áreas e pareceres, para o
// relatório refletir TUDO o que foi avaliado. Ver lib/avaliacao/supervisao.ts.

import { useMemo } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { supervisionar, type NivelSupervisao } from "@/lib/avaliacao/supervisao";
import { Selo, type TomSelo } from "./campos";
import AgenteAvatar from "./AgenteAvatar";

const TOM: Record<NivelSupervisao, TomSelo> = { alerta: "alerta", atencao: "atencao", ok: "ok" };
const ROTULO: Record<NivelSupervisao, string> = { alerta: "Conferir já", atencao: "Atenção", ok: "Ok" };

export function PainelSupervisao({ paciente, compacto = false }: { paciente: PacienteRow; compacto?: boolean }) {
  const r = useMemo(() => supervisionar(paciente), [paciente]);
  const faltam = r.cobertura.filter((c) => !c.registrado);
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3 break-inside-avoid">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <AgenteAvatar id="nina" tamanho={44} titulo="Ilustração da Dra. Nina" />
          <h3 className="font-display text-lg text-ink">Supervisão da Dra. Nina</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Selo tom={r.alertas > 0 ? "alerta" : "ok"}>{r.alertas} para conferir já</Selo>
          <Selo tom={r.atencoes > 0 ? "atencao" : "ok"}>{r.atencoes} de atenção</Selo>
          <Selo tom={faltam.length > 0 ? "neutro" : "ok"}>{r.cobertura.length - faltam.length} de {r.cobertura.length} áreas com dado</Selo>
        </div>
      </div>
      {!compacto && (
        <p className="text-xs text-muted leading-relaxed">
          Confere, antes de emitir os relatórios, se tudo o que foi avaliado está refletido, se os achados de uma área não contradizem os de outra e se os pareceres estão completos, atualizados e revisados. São avisos para você conferir, não diagnóstico.
        </p>
      )}

      {r.itens.length === 0 ? (
        <p className="text-sm text-accent-dark">Nada a apontar: pareceres atualizados, sem conflito entre áreas.</p>
      ) : (
        <ul className="space-y-2">
          {r.itens.map((i, k) => (
            <li key={k} className="flex flex-wrap items-start gap-2 text-sm">
              <Selo tom={TOM[i.nivel]}>{ROTULO[i.nivel]}</Selo>
              <span className="flex-1 min-w-[16rem]">
                <strong className="text-ink">{i.area}:</strong> <span className="text-ink">{i.texto}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="pt-2 border-t border-border">
        <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-1.5">O que foi avaliado</p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {r.cobertura.map((c) => (
            <span key={c.area} title={c.detalhe} className={`rounded-full border px-2.5 py-1 ${c.registrado ? "border-accent/40 bg-accent-soft text-accent-dark" : "border-border text-muted"}`}>
              {c.registrado ? "✓" : "–"} {c.area}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
