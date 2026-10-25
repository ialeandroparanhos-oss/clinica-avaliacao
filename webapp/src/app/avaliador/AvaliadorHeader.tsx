"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OWNER_EMAILS } from "@/lib/config";

export default function AvaliadorHeader() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [supabase]);

  async function sair() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (pathname === "/avaliador/login") return null;

  return (
    <header className="border-b-2 border-gold bg-accent-dark text-white print:hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/avaliador" className="font-display text-lg text-white">
          Avaliação Integrada <span className="text-gold">· Avaliador</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/avaliador/estudos" className="font-medium text-white/75 hover:text-gold transition">
            Estudos
          </Link>
          <Link href="/avaliador/agentes" className="font-medium text-white/75 hover:text-gold transition">
            Equipe de IA
          </Link>
          {email && <span className="text-white/55 hidden sm:inline">{email}</span>}
          {email && OWNER_EMAILS.includes(email) && (
            <Link href="/avaliador/admin" className="font-medium text-white/75 hover:text-gold transition">
              Licença
            </Link>
          )}
          <button onClick={sair} className="font-medium text-white/75 hover:text-gold transition">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
