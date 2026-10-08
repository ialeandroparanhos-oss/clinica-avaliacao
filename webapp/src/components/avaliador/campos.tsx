"use client";

// Campos e hooks compartilhados pelas abas de avaliação do profissional
// (Física, Postural, Funcional, Cardiorrespiratória).

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, TextInput } from "@/components/forms";
import { normalizarDecimal } from "@/lib/numeros";

// ---------------------------------------------------------------------------
// Salvamento automático (rascunho)
//
// Tudo o que o avaliador digita é gravado sozinho, alguns segundos depois da
// última alteração e ao sair da aba - nada se perde ao trocar de página. O
// rascunho atualiza só a ficha atual do paciente; o botão "Salvar" continua
// sendo o que registra a avaliação no histórico (comparação nas reavaliações).
// ---------------------------------------------------------------------------
export type EstadoAuto = "parado" | "pendente" | "salvando" | "salvo" | "erro";

export const EVENTO_RASCUNHO = "paciente-rascunho";

type Supabase = ReturnType<typeof createClient>;
export type SecaoPaciente = "fisica" | "postural" | "funcional" | "cardio" | "plano";

// Avisa a página do paciente do que foi gravado, para que ao voltar a uma aba
// ela já abra com o dado mais recente (sem recarregar a página).
function avisarRascunho(pacienteId: string, secao: SecaoPaciente, dados: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENTO_RASCUNHO, { detail: { pacienteId, secao, dados } }));
}

export async function gravarRascunhoSecao(supabase: Supabase, pacienteId: string, secao: Exclude<SecaoPaciente, "plano">, dados: Record<string, any>) {
  const { data: sessao } = await supabase.auth.getSession();
  const payload = { ...dados, avaliador: sessao.session?.user?.email ?? null, atualizado_em: new Date().toISOString() };
  const { error } = await supabase.from("pacientes").update({ [secao]: payload, atualizado_em: new Date().toISOString() }).eq("id", pacienteId);
  if (error) throw error;
  avisarRascunho(pacienteId, secao, payload);
}

// O plano é compartilhado por três abas (Plano, Reavaliação/metas e os pareceres
// da Anamnese e do Perfil): lê o que está gravado e troca só a parte alterada.
export async function mesclarNoPlano(supabase: Supabase, pacienteId: string, alterar: (planoAtual: Record<string, any>) => Record<string, any>) {
  const { data, error: erroLeitura } = await supabase.from("pacientes").select("plano").eq("id", pacienteId).single();
  if (erroLeitura) throw erroLeitura;
  const novo = alterar((data?.plano ?? {}) as Record<string, any>);
  const { error } = await supabase.from("pacientes").update({ plano: novo, atualizado_em: new Date().toISOString() }).eq("id", pacienteId);
  if (error) throw error;
  avisarRascunho(pacienteId, "plano", novo);
}

export function useAutoSalvar(valor: unknown, gravar: (valor: any) => Promise<void>, atrasoMs = 1500): EstadoAuto {
  const json = JSON.stringify(valor);
  const ultimoGravado = useRef(json); // começa igual ao que foi carregado: abrir a aba não grava nada
  const atual = useRef({ json, valor, gravar });
  atual.current = { json, valor, gravar };
  const [estado, setEstado] = useState<EstadoAuto>("parado");

  async function descarregar() {
    const { json: j, valor: v, gravar: g } = atual.current;
    if (j === ultimoGravado.current) return;
    const anterior = ultimoGravado.current;
    ultimoGravado.current = j;
    setEstado("salvando");
    try {
      await g(v);
      setEstado("salvo");
    } catch {
      ultimoGravado.current = anterior; // tenta de novo na próxima alteração
      setEstado("erro");
    }
  }

  useEffect(() => {
    if (json === ultimoGravado.current) return;
    setEstado("pendente");
    const t = setTimeout(descarregar, atrasoMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json]);

  // Ao sair da aba (ou da página), grava o que ainda estiver pendente.
  useEffect(
    () => () => {
      void descarregar();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return estado;
}

export function TextoAuto({ estado }: { estado: EstadoAuto }) {
  const texto: Record<EstadoAuto, string> = {
    parado: "Salvamento automático ativo.",
    pendente: "Alterações ainda não gravadas...",
    salvando: "Gravando rascunho...",
    salvo: "Rascunho salvo automaticamente ✓",
    erro: "Não foi possível gravar o rascunho: use o botão Salvar.",
  };
  return <span className={`text-xs ${estado === "erro" ? "text-danger" : "text-muted"}`}>{texto[estado]}</span>;
}

export function useSalvarSecao(pacienteId: string, secao: "fisica" | "postural" | "funcional" | "cardio") {
  const supabase = useMemo(() => createClient(), []);
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);

  const rascunho = (dados: Record<string, any>) => gravarRascunhoSecao(supabase, pacienteId, secao, dados);

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

  return { salvar, salvando, ok, rascunho };
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

export function SalvarBar({ salvando, ok, onSalvar, auto }: { salvando: boolean; ok: boolean; onSalvar: () => void; auto?: EstadoAuto }) {
  return (
    <div className="pt-2 space-y-1.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSalvar}
          disabled={salvando}
          className="rounded-lg bg-accent text-white font-medium px-6 py-2.5 hover:bg-accent-dark transition disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        {ok && <span className="text-sm text-accent-dark">Salvo ✓</span>}
        {auto && <TextoAuto estado={auto} />}
      </div>
      {auto && <p className="text-xs text-muted">O que você digita é guardado sozinho como rascunho. Use Salvar para registrar esta avaliação no histórico (comparação na reavaliação).</p>}
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
