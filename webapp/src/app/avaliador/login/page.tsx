"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, TextInput } from "@/components/forms";

export default function LoginAvaliadorPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    setLoading(false);
    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }
    const redirectTo = params.get("redirectTo") || "/avaliador";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <form onSubmit={entrar} className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 space-y-5">
        <div>
          <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">Área do avaliador</p>
          <h1 className="font-display text-2xl text-ink">Entrar</h1>
          <p className="text-muted text-sm mt-2">Acesso restrito à equipe da clínica.</p>
        </div>

        <Field label="E-mail">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </Field>
        <Field label="Senha">
          <TextInput type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </Field>

        {erro && <p className="text-sm text-danger">{erro}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent text-white font-medium py-3 hover:bg-accent-dark transition disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-xs text-muted text-center">
          Contas de avaliador são criadas pela administração da clínica no painel do Supabase.
        </p>
      </form>
    </main>
  );
}
