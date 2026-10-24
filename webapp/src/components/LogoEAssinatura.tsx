import { ASSINATURA_PROFISSIONAL } from "@/lib/marca";

// Logo e assinatura do profissional no topo dos documentos que saem para fora (relatórios que viram PDF).
export function LogoEAssinatura() {
  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <img src="/logo-sceh.png" alt="Logo" className="h-14 w-auto" />
      <p className="text-sm text-ink font-medium text-right">{ASSINATURA_PROFISSIONAL}</p>
    </div>
  );
}
