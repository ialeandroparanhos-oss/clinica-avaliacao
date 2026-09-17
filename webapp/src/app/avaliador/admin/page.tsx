"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OWNER_EMAILS } from "@/lib/config";
import { Field, TextArea } from "@/components/forms";

type Licenca = {
  ativo: boolean;
  motivo: string | null;
  atualizado_em: string;
  atualizado_por: string | null;
};

export default function AdminLicenca() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState<string | null>(null);
  const [licenca, setLicenca] = useState<Licenca | null>(null);
  const [motivo, setMotivo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const { data: userData } = await supabase.auth.getUser();
    setEmail(userData.user?.email ?? null);
    const { data } = await supabase.from("licenca_clinica").select("*").eq("id", 1).single();
    setLicenca(data as Licenca);
    setMotivo((data as Licenca)?.motivo ?? "");
    setCarregando(false);
  }

  async function alterar(novoAtivo: boolean) {
    setSalvando(true);
    await supabase
      .from("licenca_clinica")
      .update({
        ativo: novoAtivo,
        motivo: motivo || null,
        atualizado_em: new Date().toISOString(),
        atualizado_por: email,
      })
      .eq("id", 1);
    await carregar();
    setSalvando(false);
  }

  if (carregando) return <main className="max-w-2xl mx-auto px-6 py-10 text-muted text-sm">Carregando...</main>;

  if (!email || !OWNER_EMAILS.includes(email)) {
    return <main className="max-w-2xl mx-auto px-6 py-10 text-danger text-sm">Acesso restrito.</main>;
  }

  const ativo = licenca?.ativo ?? true;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-2xl text-ink mb-1">Licença da clínica</h1>
      <p className="text-muted text-sm mb-6">
        Controla se o link do paciente e o painel dos avaliadores (exceto esta página) ficam disponíveis. Você
        continua com acesso mesmo com a licença suspensa.
      </p>

      <div className={`rounded-2xl border p-6 mb-6 ${ativo ? "border-accent/30 bg-accent-soft" : "border-danger/30 bg-danger-soft"}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${ativo ? "text-accent-dark" : "text-danger"}`}>
          Status atual
        </p>
        <p className={`font-display text-xl ${ativo ? "text-accent-dark" : "text-danger"}`}>
          {ativo ? "Ativa — clínica com acesso normal" : "Suspensa — paciente e avaliadores bloqueados"}
        </p>
        {licenca?.atualizado_em && (
          <p className="text-xs text-muted mt-2">
            Última alteração: {new Date(licenca.atualizado_em).toLocaleString("pt-BR")}
            {licenca.atualizado_por && ` — por ${licenca.atualizado_por}`}
          </p>
        )}
        {licenca?.motivo && <p className="text-sm mt-2">Motivo registrado: {licenca.motivo}</p>}
      </div>

      <Field label="Motivo (opcional, fica registrado no histórico)" hint="Ex.: pagamento em atraso, contrato encerrado, teste interno.">
        <TextArea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </Field>

      <div className="flex gap-3 mt-5">
        {ativo ? (
          <button
            type="button"
            onClick={() => alterar(false)}
            disabled={salvando}
            className="rounded-lg bg-danger text-white font-medium px-6 py-2.5 hover:opacity-90 transition disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Suspender acesso da clínica"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => alterar(true)}
            disabled={salvando}
            className="rounded-lg bg-accent text-white font-medium px-6 py-2.5 hover:bg-accent-dark transition disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Reativar acesso da clínica"}
          </button>
        )}
      </div>
    </main>
  );
}
