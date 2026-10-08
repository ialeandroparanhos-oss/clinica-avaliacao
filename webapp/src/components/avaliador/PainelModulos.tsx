"use client";

// Painel do avaliador: questionários complementares do paciente (status e link
// para enviar). O questionário base é curto; os módulos são oferecidos ao
// paciente quando as respostas indicam, ou enviados pelo avaliador por link.

import { useState } from "react";
import type { Anamnese } from "@/lib/anamnese/types";
import { MODULOS, ROTULO_STATUS_MODULO, linkDoModulo, statusModulo, type ModuloId, type StatusModulo } from "@/lib/anamnese/modulos";
import { Selo, type TomSelo } from "./campos";

const TOM_STATUS: Record<StatusModulo, TomSelo> = {
  respondido: "ok",
  em_andamento: "info",
  sinalizado: "atencao",
  nao_aplicado: "neutro",
};

export function PainelModulos({ anamnese, idade }: { anamnese: Anamnese; idade?: number | null }) {
  const [copiado, setCopiado] = useState<ModuloId | null>(null);

  async function copiar(id: ModuloId) {
    const link = linkDoModulo(window.location.origin, id);
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(id);
      setTimeout(() => setCopiado((atual) => (atual === id ? null : atual)), 2500);
    } catch {
      window.prompt("Copie o link do questionário:", link);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-lg text-ink mb-1">Questionários complementares</h3>
      <p className="text-xs text-muted mb-3">
        O questionário base é curto. Os questionários abaixo são separados e opcionais: o paciente é convidado a respondê-los quando as respostas do base indicam, ou você
        pode enviar o link quando quiser (ele se identifica com nome e data de nascimento).
      </p>
      <ul className="divide-y divide-border">
        {MODULOS.map((m) => {
          const status = statusModulo(anamnese, m.id, idade);
          return (
            <li key={m.id} className="py-3 flex flex-wrap items-start gap-3">
              <div className="flex-1 min-w-[14rem]">
                <p className="text-sm font-medium text-ink">
                  {m.titulo} <Selo tom={TOM_STATUS[status]}>{ROTULO_STATUS_MODULO[status]}</Selo>
                </p>
                <p className="text-xs text-muted mt-0.5">{m.instrumentos}</p>
                {m.id === "bem-estar" && anamnese.saude_mental.sinalizacao && (
                  <p className="text-xs text-muted mt-0.5">
                    Resposta do paciente à pergunta inicial:{" "}
                    {{ nao: "não", um_pouco: "um pouco", sim: "sim, bastante", prefiro_nao_responder: "prefere não responder" }[anamnese.saude_mental.sinalizacao]}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <button type="button" onClick={() => copiar(m.id)} className="font-medium text-accent hover:underline">
                  {copiado === m.id ? "Link copiado ✓" : "Copiar link"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
