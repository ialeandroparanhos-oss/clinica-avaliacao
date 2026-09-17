"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
    <header className="border-b border-border bg-surface print:hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/avaliador" className="font-display text-lg text-ink">
          Avaliação Integrada <span className="text-accent">· Avaliador</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {email && <span className="text-muted hidden sm:inline">{email}</span>}
          <button onClick={sair} className="font-medium text-muted hover:text-danger transition">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
