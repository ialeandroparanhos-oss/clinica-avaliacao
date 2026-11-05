"use client";

// Capacidade funcional lida com UM dos testes (05/11/2026, pedido do profissional): o teste de 12 minutos (Cooper, que dá o
// VO2máx estimado) OU o TC6 (pelo % do previsto brasileiro). O avaliador escolhe o teste conforme o caso e a leitura aparece
// com qualquer um deles. Não converte um teste no outro: são testes diferentes (corrida máxima x caminhada submáxima).

import type { PacienteRow } from "@/lib/anamnese/types";
import { calcularPerfilIntegrado, type Classificacao } from "@/lib/integracao/perfil";
import { Selo, type TomSelo } from "./campos";

const TOM: Record<Classificacao, TomSelo> = { adequado: "ok", atencao: "atencao", prioridade: "alerta", investigar: "neutro" };
const ROTULO: Record<Classificacao, string> = { adequado: "Dentro do esperado", atencao: "Pede atenção", prioridade: "Prioridade", investigar: "Ainda sem teste" };

export function CapacidadeFuncional({ paciente }: { paciente: PacienteRow }) {
  const dom = calcularPerfilIntegrado(paciente).dominios.find((d) => d.chave === "capacidade_cardiorrespiratoria");
  if (!dom) return null;
  return (
    <div className="rounded-xl border border-border bg-bg p-4 space-y-1.5 text-sm" aria-label="Capacidade funcional">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium text-ink">Capacidade funcional</p>
        <Selo tom={TOM[dom.classificacao]}>{ROTULO[dom.classificacao]}</Selo>
      </div>
      <p className="text-ink leading-relaxed">{dom.justificativa}</p>
      <p className="text-xs text-muted leading-relaxed">
        Vale com <strong>um</strong> dos testes: o de 12 minutos (Cooper, na aba Cardio) ou o TC6 (aqui). Escolha o que for melhor para o caso; um não é convertido no outro, porque são testes diferentes (corrida até o limite x caminhada em ritmo próprio). Se fizer os dois, a leitura considera ambos. O corte do TC6 (80% do previsto) é referência prática do
        sistema, sem validação publicada.
      </p>
    </div>
  );
}
