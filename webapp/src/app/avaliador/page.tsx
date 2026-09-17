"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Alerta } from "@/lib/anamnese/types";

type LinhaPaciente = {
  id: string;
  nome: string;
  data_nascimento: string;
  anamnese_status: string;
  alertas: Alerta[];
  atualizado_em: string;
};

const statusLabel: Record<string, string> = {
  nao_iniciada: "Não iniciada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

const statusStyle: Record<string, string> = {
  nao_iniciada: "bg-border text-muted",
  em_andamento: "bg-warn-soft text-warn",
  concluida: "bg-accent-soft text-accent-dark",
};

function idade(dataNascimento: string) {
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let anos = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) anos--;
  return anos;
}

export default function DashboardAvaliador() {
  const supabase = useMemo(() => createClient(), []);
  const [pacientes, setPacientes] = useState<LinhaPaciente[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    const { data } = await supabase
      .from("pacientes")
      .select("id, nome, data_nascimento, anamnese_status, alertas, atualizado_em")
      .order("atualizado_em", { ascending: false })
      .limit(500);
    setPacientes((data as LinhaPaciente[]) ?? []);
    setLoading(false);
  }

  const filtrados = pacientes.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">Pacientes</h1>
          <p className="text-muted text-sm mt-1">{pacientes.length} registro(s) na base.</p>
        </div>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-56 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {loading ? (
        <p className="text-muted text-sm">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted text-sm">
          Nenhum paciente encontrado. Assim que um paciente se identificar e começar a anamnese
          pelo link público, ele aparece aqui automaticamente.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Paciente</th>
                <th className="px-4 py-3 font-medium">Idade</th>
                <th className="px-4 py-3 font-medium">Anamnese</th>
                <th className="px-4 py-3 font-medium">Alertas</th>
                <th className="px-4 py-3 font-medium">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const nivelMax = p.alertas?.length ? Math.max(...p.alertas.map((a) => a.nivel)) : 0;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg transition">
                    <td className="px-4 py-3">
                      <Link href={`/avaliador/paciente/${p.id}`} className="font-medium text-ink hover:text-accent">
                        {p.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted tabular-nums">{idade(p.data_nascimento)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[p.anamnese_status]}`}>
                        {statusLabel[p.anamnese_status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {nivelMax >= 4 ? (
                        <span className="inline-block rounded-full bg-danger-soft text-danger px-2.5 py-1 text-xs font-medium">
                          Nível 4
                        </span>
                      ) : nivelMax >= 2 ? (
                        <span className="inline-block rounded-full bg-warn-soft text-warn px-2.5 py-1 text-xs font-medium">
                          Nível {nivelMax}
                        </span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">{new Date(p.atualizado_em).toLocaleString("pt-BR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
