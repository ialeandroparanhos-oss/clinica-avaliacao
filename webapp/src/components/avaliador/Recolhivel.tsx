"use client";

// Bloco que abre e fecha: mostra só o título (e um resumo curto) e esconde o detalhe até a pessoa querer.
// GrupoRecolhiveis dá os botões "Abrir tudo" e "Recolher tudo" para todos os blocos dentro dele.
// Só para a tela: relatórios que viram PDF não usam este componente (bloco fechado não sai na impressão).

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Classificacao, DomainResult } from "@/lib/integracao/perfil";

type Alvo = { sinal: number; abrir: boolean };
const ContextoGrupo = createContext<Alvo | null>(null);

export function GrupoRecolhiveis({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [alvo, setAlvo] = useState<Alvo>({ sinal: 0, abrir: false });
  const botao = "rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted hover:border-accent hover:text-accent-dark transition";
  return (
    <ContextoGrupo.Provider value={alvo}>
      <div className={className}>
        <div className="flex justify-end gap-2 mb-3">
          <button type="button" className={botao} onClick={() => setAlvo((a) => ({ sinal: a.sinal + 1, abrir: true }))}>
            Abrir tudo
          </button>
          <button type="button" className={botao} onClick={() => setAlvo((a) => ({ sinal: a.sinal + 1, abrir: false }))}>
            Recolher tudo
          </button>
        </div>
        {children}
      </div>
    </ContextoGrupo.Provider>
  );
}

export type TomRecolhivel = "neutro" | "accent" | "warn" | "danger" | "info";

const ESTILO_TOM: Record<TomRecolhivel, { caixa: string; titulo: string; detalhe: string }> = {
  neutro: { caixa: "border-border bg-surface", titulo: "text-ink", detalhe: "text-muted" },
  accent: { caixa: "border-accent/25 bg-accent-soft", titulo: "text-accent-dark", detalhe: "text-accent-dark/80" },
  warn: { caixa: "border-warn/25 bg-warn-soft", titulo: "text-warn", detalhe: "text-warn/85" },
  danger: { caixa: "border-danger/25 bg-danger-soft", titulo: "text-danger", detalhe: "text-danger/85" },
  info: { caixa: "border-info/25 bg-info-soft", titulo: "text-info", detalhe: "text-info/85" },
};

export function Recolhivel({
  titulo,
  resumo,
  aberto = false,
  tom = "neutro",
  pequeno = false,
  children,
}: {
  titulo: ReactNode;
  resumo?: ReactNode; // selo ou frase curta ao lado do título, sempre visível
  aberto?: boolean; // como o bloco começa
  tom?: TomRecolhivel;
  pequeno?: boolean; // versão compacta (cartões em grade)
  children: ReactNode;
}) {
  const [estaAberto, setEstaAberto] = useState(aberto);
  const grupo = useContext(ContextoGrupo);
  useEffect(() => {
    if (grupo && grupo.sinal > 0) setEstaAberto(grupo.abrir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grupo?.sinal]);
  const e = ESTILO_TOM[tom];
  return (
    <details open={estaAberto} onToggle={(ev) => setEstaAberto((ev.currentTarget as HTMLDetailsElement).open)} className={`rounded-2xl border ${e.caixa} ${pequeno ? "" : ""}`}>
      <summary className={`flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl ${pequeno ? "px-4 py-3" : "px-5 py-4"} select-none [&::-webkit-details-marker]:hidden`}>
        <span className={`font-medium ${pequeno ? "text-sm" : "font-display text-base"} ${e.titulo}`}>{titulo}</span>
        <span className="flex shrink-0 items-center gap-2">
          {resumo && <span className="text-xs font-medium">{resumo}</span>}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`h-4 w-4 transition-transform duration-200 ${e.detalhe} ${estaAberto ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 8l5 5 5-5" />
          </svg>
        </span>
      </summary>
      <div className={`${pequeno ? "px-4 pb-4" : "px-5 pb-5"} ${e.detalhe}`}>{children}</div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Cartão de domínio do Painel Integrado: título e classificação sempre à vista, o porquê escondido.
// ---------------------------------------------------------------------------
export const ESTILO_CLASSIFICACAO: Record<Classificacao, { rotulo: string; tom: TomRecolhivel }> = {
  adequado: { rotulo: "Adequado", tom: "accent" },
  atencao: { rotulo: "Atenção", tom: "warn" },
  prioridade: { rotulo: "Prioridade", tom: "danger" },
  investigar: { rotulo: "Investigar", tom: "info" },
};

export function CartaoDominio({ dominio }: { dominio: DomainResult }) {
  const estilo = ESTILO_CLASSIFICACAO[dominio.classificacao];
  return (
    <Recolhivel
      pequeno
      tom={estilo.tom}
      aberto={dominio.classificacao === "prioridade"}
      titulo={dominio.titulo}
      resumo={<span className="uppercase tracking-wide text-[11px] font-semibold">{estilo.rotulo}</span>}
    >
      <p className="text-xs leading-relaxed">{dominio.justificativa}</p>
    </Recolhivel>
  );
}
