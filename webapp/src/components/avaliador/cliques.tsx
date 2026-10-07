"use client";

// Escolhas clicáveis para o avaliador preencher rápido, sem digitar:
// - EscolhaUnica: um botão entre várias opções (com "Outro" opcional em texto)
// - EscolhaMultipla: vários botões marcáveis
// O campo de anotações livres continua existindo ao lado, para o que não cabe nos botões.

import { TextInput } from "@/components/forms";

const base = "rounded-full border px-3 py-1.5 text-sm transition";
const ativo = "bg-accent text-white border-accent";
const inativo = "bg-surface text-ink border-border hover:border-accent";

export function EscolhaUnica({
  opcoes,
  valor,
  onChange,
  permitirOutro = false,
  placeholderOutro = "Descreva",
  deselecionavel = true,
}: {
  opcoes: string[];
  valor: string;
  onChange: (v: string) => void;
  permitirOutro?: boolean;
  placeholderOutro?: string;
  deselecionavel?: boolean;
}) {
  const ehOutro = permitirOutro && valor !== "" && !opcoes.includes(valor);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => {
          const sel = valor === o;
          return (
            <button key={o} type="button" aria-pressed={sel} onClick={() => onChange(sel && deselecionavel ? "" : o)} className={`${base} ${sel ? ativo : inativo}`}>
              {o}
            </button>
          );
        })}
        {permitirOutro && (
          <button
            type="button"
            aria-pressed={ehOutro}
            onClick={() => onChange(ehOutro ? "" : " ")}
            className={`${base} ${ehOutro ? ativo : inativo}`}
          >
            Outro
          </button>
        )}
      </div>
      {ehOutro && <TextInput value={valor.trimStart()} onChange={(e) => onChange(e.target.value || " ")} placeholder={placeholderOutro} autoFocus />}
    </div>
  );
}

export function EscolhaMultipla({
  opcoes,
  valores,
  onChange,
  exclusivas = [],
}: {
  opcoes: string[];
  valores: string[];
  onChange: (v: string[]) => void;
  // Opções que excluem as demais (ex.: "Sem compensações").
  exclusivas?: string[];
}) {
  function alternar(o: string) {
    if (valores.includes(o)) return onChange(valores.filter((v) => v !== o));
    if (exclusivas.includes(o)) return onChange([o]);
    onChange([...valores.filter((v) => !exclusivas.includes(v)), o]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {opcoes.map((o) => {
        const sel = valores.includes(o);
        return (
          <button key={o} type="button" aria-pressed={sel} onClick={() => alternar(o)} className={`${base} ${sel ? ativo : inativo}`}>
            {o}
          </button>
        );
      })}
    </div>
  );
}
