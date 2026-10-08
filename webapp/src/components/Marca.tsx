import { NOME_PROFISSIONAL } from "@/lib/marca";

// Marca exibida nas telas de entrada: logo + nome do profissional.
//
// A logo da Forma e Fisio (/logo-forma-e-fisio.jpg) está temporariamente oculta, até
// ser autorizada. Para trazê-la de volta, mude MARCA_ATIVA para "forma-e-fisio".
const MARCA_ATIVA: "profissional" | "forma-e-fisio" = "profissional";

export function Marca({ compacta = false }: { compacta?: boolean }) {
  if (MARCA_ATIVA === "forma-e-fisio") {
    return <img src="/logo-forma-e-fisio.jpg" alt="Forma e Fisio" className={`${compacta ? "h-24 w-24 mb-5" : "h-28 w-28 mb-6"} rounded-2xl mx-auto`} />;
  }
  return (
    <div className={`flex flex-col items-center ${compacta ? "mb-5" : "mb-6"}`}>
      <img src="/logo-sceh.png" alt="Logo" className={`${compacta ? "h-16" : "h-20"} w-auto`} />
      <p className="font-display text-ink text-lg mt-2">{NOME_PROFISSIONAL}</p>
    </div>
  );
}
