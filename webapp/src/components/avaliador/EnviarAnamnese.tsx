"use client";

import { useState } from "react";
import { linkWhatsApp, normalizarTelefone } from "@/lib/avaliacao/whatsapp";
import { ASSINATURA_PROFISSIONAL } from "@/lib/marca";

// Atalho no painel do avaliador para mandar o questionário de anamnese (link público /paciente) pelo WhatsApp.
// Com o telefone preenchido a conversa abre direto; sem ele, o WhatsApp deixa escolher o contato.
// Nada sai sozinho: quem confere e aperta "enviar" é o profissional.
export function EnviarAnamnese() {
  const [telefone, setTelefone] = useState("");
  const [copiado, setCopiado] = useState(false);

  const link = typeof window !== "undefined" ? `${window.location.origin}/paciente` : "/paciente";
  const mensagem =
    `Olá! Para começarmos a sua avaliação, responda o questionário de saúde neste link (leva cerca de 15 a 20 minutos e você pode parar e continuar depois):\n${link}\n\n*${ASSINATURA_PROFISSIONAL}*`;
  const telefoneInvalido = telefone.trim() !== "" && !normalizarTelefone(telefone);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copie o link:", link);
    }
  }

  return (
    <section className="rounded-2xl border border-gold/60 bg-gold-soft/40 p-4 mb-6">
      <h2 className="font-display text-base text-ink">Enviar a anamnese ao paciente</h2>
      <p className="text-xs text-muted mt-1 break-all">
        Link: <span className="font-medium text-ink">{link}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          inputMode="tel"
          placeholder="WhatsApp do paciente (opcional)"
          className="w-full sm:w-64 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <a
          href={telefoneInvalido ? undefined : linkWhatsApp(telefone, mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={telefoneInvalido}
          className={`rounded-lg text-sm font-medium px-4 py-2 transition whitespace-nowrap ${
            telefoneInvalido ? "bg-border text-muted pointer-events-none" : "bg-accent text-white hover:bg-accent-dark"
          }`}
        >
          Enviar pelo WhatsApp
        </a>
        <button
          type="button"
          onClick={copiar}
          className="rounded-lg border border-border bg-surface text-sm font-medium text-ink px-4 py-2 hover:border-accent transition whitespace-nowrap"
        >
          {copiado ? "Link copiado!" : "Copiar link"}
        </button>
      </div>
      {telefoneInvalido && <p className="text-xs text-warn mt-2">Confira o número: use DDD + telefone, por exemplo (11) 91234-5678.</p>}
    </section>
  );
}
