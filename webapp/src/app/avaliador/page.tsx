"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Alerta } from "@/lib/anamnese/types";
import { situacaoAvaliacao, type SituacaoAvaliacao } from "@/lib/avaliacao/situacaoLista";
import { idadeDaDataNascimento } from "@/lib/avaliacao/identificacao";

type LinhaPaciente = {
  id: string;
  nome: string;
  data_nascimento: string;
  anamnese_status: string;
  alertas: Alerta[];
  atualizado_em: string;
  // Carimbos de gravação de cada área (N1): servem só para saber se a avaliação já foi iniciada.
  fisica_em?: string | null;
  postural_em?: string | null;
  funcional_em?: string | null;
  cardio_em?: string | null;
};

const TOM_SITUACAO: Record<SituacaoAvaliacao["tom"], string> = {
  neutro: "bg-border text-muted",
  aviso: "bg-warn-soft text-warn",
  info: "bg-info-soft text-info",
  ok: "bg-accent-soft text-accent-dark",
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
  return idadeDaDataNascimento(dataNascimento) ?? "";
}

export default function DashboardAvaliador() {
  const supabase = useMemo(() => createClient(), []);
  const [pacientes, setPacientes] = useState<LinhaPaciente[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setLoading(true);
    // Consulta enxuta: só o carimbo de cada área, sem trazer as avaliações inteiras. Se por algum motivo ela
    // falhar, volta para a consulta simples e a lista continua funcionando (só sem a coluna Avaliação).
    let { data, error } = await supabase
      .from("pacientes")
      .select("id, nome, data_nascimento, anamnese_status, alertas, atualizado_em, fisica_em:fisica->>atualizado_em, postural_em:postural->>atualizado_em, funcional_em:funcional->>atualizado_em, cardio_em:cardio->>atualizado_em")
      .order("atualizado_em", { ascending: false })
      .limit(500);
    if (error) {
      const simples = await supabase.from("pacientes").select("id, nome, data_nascimento, anamnese_status, alertas, atualizado_em").order("atualizado_em", { ascending: false }).limit(500);
      data = simples.data as typeof data;
    }
    setPacientes((data as unknown as LinhaPaciente[]) ?? []);
    setLoading(false);
  }

  async function excluirPaciente(p: LinhaPaciente) {
    const confirmado = window.confirm(
      `Excluir ${p.nome} e todos os dados da avaliação (anamnese, física, postural, funcional, cardio e histórico)?\n\nEsta ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    setExcluindoId(p.id);
    try {
      const { data: arquivos } = await supabase.storage.from("fotos-posturais").list(p.id);
      if (arquivos && arquivos.length > 0) {
        await supabase.storage.from("fotos-posturais").remove(arquivos.map((a) => `${p.id}/${a.name}`));
      }
      const { error } = await supabase.from("pacientes").delete().eq("id", p.id);
      if (error) {
        window.alert("Não foi possível excluir: " + error.message);
        return;
      }
      setPacientes((prev) => prev.filter((x) => x.id !== p.id));
    } finally {
      setExcluindoId(null);
    }
  }

  const filtrados = pacientes.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">Pacientes</h1>
          <p className="text-muted text-sm mt-1">{pacientes.length} registro(s) na base.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-48 sm:w-56 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <Link href="/avaliador/novo" className="rounded-lg bg-accent text-white text-sm font-medium px-4 py-2 hover:bg-accent-dark transition whitespace-nowrap">
            + Novo paciente
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Carregando...</p>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted text-sm">
          Nenhum paciente encontrado. Assim que um paciente se identificar e começar a anamnese
          pelo link público, ele aparece aqui automaticamente. Para quem vai direto à clínica, use{" "}
          <Link href="/avaliador/novo" className="font-medium text-accent hover:underline">
            + Novo paciente
          </Link>{" "}
          e faça a anamnese com ele.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Paciente</th>
                <th className="px-4 py-3 font-medium">Idade</th>
                <th className="px-4 py-3 font-medium">Anamnese</th>
                <th className="px-4 py-3 font-medium">Avaliação</th>
                <th className="px-4 py-3 font-medium">Alertas</th>
                <th className="px-4 py-3 font-medium">Atualizado</th>
                <th className="px-4 py-3 font-medium"></th>
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
                      {"fisica_em" in p ? (
                        (() => {
                          const s = situacaoAvaliacao(p);
                          return (
                            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${TOM_SITUACAO[s.tom]}`} title={s.detalhe || undefined}>
                              {s.rotulo}
                              {s.detalhe && s.chave !== "aguarda_anamnese" ? <span className="font-normal opacity-80"> · {s.detalhe}</span> : null}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
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
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => excluirPaciente(p)}
                        disabled={excluindoId === p.id}
                        className="text-xs font-medium text-muted hover:text-danger disabled:opacity-50"
                      >
                        {excluindoId === p.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </td>
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
