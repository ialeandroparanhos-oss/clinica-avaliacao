"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PacienteRow } from "@/lib/anamnese/types";
import { AGENTE_DA_SECAO, ROTULO_SECAO, SECOES_PARECER, atualizacoesAutomaticas, situacaoParecer, type SecaoParecer, type SituacaoParecer } from "@/lib/avaliacao/pareceresAuto";
import { gravarParecerAutomatico } from "./campos";

// Mantém os pareceres em dia sozinho, em qualquer aba: sempre que os dados mudam, o agente da área relê e atualiza o
// parecer sucinto (só o que ainda é do sistema). A aba aberta fica por conta do próprio cartão do parecer.
export function useParecerAutomatico(paciente: PacienteRow | null, secaoAberta: string) {
  const supabase = useMemo(() => createClient(), []);
  const ups = useMemo(() => (paciente ? atualizacoesAutomaticas(paciente, [secaoAberta as SecaoParecer]) : []), [paciente, secaoAberta]);
  const chave = JSON.stringify(ups);
  useEffect(() => {
    if (!paciente || ups.length === 0) return;
    const t = setTimeout(async () => {
      for (const u of ups) {
        try {
          await gravarParecerAutomatico(supabase, paciente.id, u.secao, u.valor);
        } catch {
          // tenta de novo na próxima alteração; o parecer continua disponível pelo botão do cartão
        }
      }
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
}

const ROTULO_SITUACAO: Record<SituacaoParecer, string> = {
  sem_dados: "sem dados",
  sem: "sem parecer",
  revisar: "revisar",
  dados_novos: "dados novos",
  aprovado: "aprovado ✓",
};
const ESTILO_SITUACAO: Record<SituacaoParecer, string> = {
  sem_dados: "border-border bg-bg text-muted",
  sem: "border-warn bg-warn-soft text-warn",
  revisar: "border-info bg-info-soft text-info",
  dados_novos: "border-warn bg-warn-soft text-warn font-semibold",
  aprovado: "border-ok bg-ok-soft text-ok-dark",
};

export function situacoesPareceres(paciente: PacienteRow): Record<SecaoParecer, SituacaoParecer> {
  const r = {} as Record<SecaoParecer, SituacaoParecer>;
  for (const s of SECOES_PARECER) r[s] = situacaoParecer(paciente, s);
  return r;
}

// Faixa fixa no topo da ficha: mostra, sem rolar a tela, quais pareceres já estão aprovados e quais esperam o avaliador.
export function BarraPareceres({ situacoes, aoAbrir }: { situacoes: Record<SecaoParecer, SituacaoParecer>; aoAbrir: (secao: SecaoParecer) => void }) {
  const pendentes = SECOES_PARECER.filter((s) => situacoes[s] === "revisar" || situacoes[s] === "dados_novos" || situacoes[s] === "sem").length;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs" aria-label="Situação dos pareceres">
      <span className={`font-semibold mr-1 ${pendentes > 0 ? "text-warn" : "text-ok-dark"}`}>
        {pendentes > 0 ? `${pendentes} parecer(es) esperam sua revisão:` : "Todos os pareceres revisados ✓"}
      </span>
      {SECOES_PARECER.filter((s) => situacoes[s] !== "sem_dados").map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => aoAbrir(s)}
          title={`Abrir o parecer ${ROTULO_SECAO[s]}`}
          className={`rounded-full border px-2.5 py-0.5 transition hover:brightness-95 ${ESTILO_SITUACAO[situacoes[s]]}`}
        >
          {ROTULO_SECAO[s]} · {ROTULO_SITUACAO[situacoes[s]]}
        </button>
      ))}
    </div>
  );
}

// Leva até o cartão do parecer depois que a aba trocar.
export function irParaParecer(secao: SecaoParecer) {
  setTimeout(() => document.getElementById(`parecer-${AGENTE_DA_SECAO[secao]}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
}
