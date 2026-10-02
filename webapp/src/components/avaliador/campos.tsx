"use client";

// Campos e hooks compartilhados pelas abas de avaliação do profissional
// (Física, Postural, Funcional, Cardiorrespiratória).

import { useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, TextInput } from "@/components/forms";
import { normalizarDecimal } from "@/lib/numeros";

export function useSalvarSecao(pacienteId: string, secao: "fisica" | "postural" | "funcional" | "cardio") {
  const supabase = useMemo(() => createClient(), []);
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);

  async function salvar(dados: Record<string, any>) {
    setSalvando(true);
    setOk(false);
    const { data: userData } = await supabase.auth.getUser();
    const avaliador = userData.user?.email ?? null;
    const payload = {
      ...dados,
      avaliador,
      atualizado_em: new Date().toISOString(),
    };
    await supabase
      .from("pacientes")
      .update({ [secao]: payload, atualizado_em: new Date().toISOString() })
      .eq("id", pacienteId);
    // Guarda também no histórico, para permitir comparar ANTES -> ATUAL ->
    // META nas reavaliações (Etapa 11) sem perder o registro anterior.
    await supabase.from("avaliacoes_historico").insert({
      paciente_id: pacienteId,
      tipo: secao,
      dados,
      avaliador,
    });
    setSalvando(false);
    setOk(true);
    setTimeout(() => setOk(false), 2500);
  }

  return { salvar, salvando, ok };
}

// Aceita vírgula ou ponto - o valor guardado sempre usa ponto, para que
// nenhuma conta downstream quebre com "18,5" (Number("18,5") = NaN).
export function NumField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <Field
      label={
        <>
          {label}
          {suffix && <span> ({suffix})</span>}
        </>
      }
    >
      <TextInput inputMode="decimal" value={value} onChange={(e) => onChange(normalizarDecimal(e.target.value))} />
    </Field>
  );
}

export function SalvarBar({ salvando, ok, onSalvar }: { salvando: boolean; ok: boolean; onSalvar: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onSalvar}
        disabled={salvando}
        className="rounded-lg bg-accent text-white font-medium px-6 py-2.5 hover:bg-accent-dark transition disabled:opacity-60"
      >
        {salvando ? "Salvando..." : "Salvar"}
      </button>
      {ok && <span className="text-sm text-accent-dark">Salvo ✓</span>}
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  opcoes,
  placeholder = "Selecione...",
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  opcoes: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        <option value="">{placeholder}</option>
        {opcoes.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CampoComSugestao({
  label,
  value,
  onChange,
  sugestao,
  sufixo,
}: {
  label: ReactNode;
  value: string;
  onChange: (v: string) => void;
  sugestao: number | null;
  sufixo: string;
}) {
  return (
    <Field label={label}>
      <TextInput inputMode="decimal" value={value} onChange={(e) => onChange(normalizarDecimal(e.target.value))} />
      {sugestao !== null && (
        <p className="text-xs text-danger mt-1">
          Sugestão pela idade/sexo: {sugestao.toFixed(1)}
          {sufixo}
          {!value && (
            <button type="button" onClick={() => onChange(sugestao.toFixed(1))} className="ml-2 text-accent hover:underline">
              usar
            </button>
          )}
        </p>
      )}
    </Field>
  );
}

export function ValorCalculado({ label, valor, children }: { label: ReactNode; valor: string | null; children?: ReactNode }) {
  return (
    <Field label={label}>
      <div className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[15px] font-mono tabular-nums">{valor ?? "–"}</div>
      {children}
    </Field>
  );
}

// Selo colorido para classificações (IMC, RCQ etc.).
export type TomSelo = "info" | "ok" | "atencao" | "alerta" | "perigo" | "critico" | "neutro";

const CLASSES_SELO: Record<TomSelo, string> = {
  info: "bg-info-soft text-info border-info/30",
  ok: "bg-accent-soft text-accent-dark border-accent/30",
  atencao: "bg-warn-soft text-warn border-warn/30",
  alerta: "bg-danger-soft text-danger border-danger/30",
  perigo: "bg-danger/20 text-danger border-danger/50",
  critico: "bg-danger text-white border-danger",
  neutro: "bg-bg text-muted border-border",
};

export function Selo({ tom, children }: { tom: TomSelo; children: ReactNode }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${CLASSES_SELO[tom]}`}>{children}</span>
  );
}
