"use client";

// Botão "Enviar por WhatsApp": abre um quadro com o número e a mensagem prontos
// (editáveis). Nada é enviado pelo sistema: o WhatsApp abre com o texto pronto e
// quem envia é o profissional. Fica fora da impressão.

import { useState } from "react";
import { linkWhatsApp, normalizarTelefone } from "@/lib/avaliacao/whatsapp";

export function EnvioWhatsApp({
  rotuloBotao = "Enviar por WhatsApp",
  telefoneInicial = "",
  mensagemInicial,
  rotuloTelefone,
  aviso,
}: {
  rotuloBotao?: string;
  telefoneInicial?: string;
  mensagemInicial: () => string; // montada só ao abrir, com os dados mais recentes
  rotuloTelefone: string;
  aviso?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [telefone, setTelefone] = useState(telefoneInicial);
  const [mensagem, setMensagem] = useState("");
  const [copiado, setCopiado] = useState(false);

  function abrir() {
    if (!aberto) setMensagem(mensagemInicial());
    setAberto(!aberto);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // sem permissão de área de transferência: o texto continua selecionável na caixa
    }
  }

  const numeroValido = normalizarTelefone(telefone) !== null;

  return (
    <div className="print:hidden">
      <button
        type="button"
        onClick={abrir}
        aria-expanded={aberto}
        className="rounded-lg border border-accent text-accent-dark font-medium px-4 py-2 text-sm hover:bg-accent-soft transition"
      >
        {rotuloBotao}
      </button>
      {aberto && (
        <div className="mt-3 rounded-xl border border-border bg-surface p-4 space-y-3 text-left">
          {aviso && <p className="text-xs text-warn">{aviso}</p>}
          <label className="block text-sm text-ink">
            {rotuloTelefone}
            <input
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 91234-5678"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-[15px] outline-none focus:border-accent"
            />
            {!numeroValido && <span className="block text-xs text-muted mt-1">Sem um número válido, o WhatsApp abre para você escolher o contato.</span>}
          </label>
          <label className="block text-sm text-ink">
            Mensagem (você pode editar antes de enviar)
            <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={12} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm leading-relaxed outline-none focus:border-accent" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={linkWhatsApp(telefone, mensagem)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-accent text-white font-medium px-5 py-2 text-sm hover:bg-accent-dark transition"
            >
              Abrir no WhatsApp
            </a>
            <button type="button" onClick={copiar} className="text-sm font-medium text-accent hover:underline">
              {copiado ? "Copiado ✓" : "Copiar mensagem"}
            </button>
          </div>
          <p className="text-xs text-muted">O WhatsApp abre com a mensagem pronta e você aperta enviar. Para mandar o documento completo, clique em Imprimir / Salvar PDF e anexe o arquivo na conversa.</p>
        </div>
      )}
    </div>
  );
}
