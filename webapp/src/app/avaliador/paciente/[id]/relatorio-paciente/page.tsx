"use client";

// Agente 8 — Clara: versão simplificada do relatório, para entregar ao
// paciente. Linguagem simples, sem termos clínicos nem pontuações cruas -
// o relatório técnico (prontuário) continua em /relatorio, de uso do
// profissional. Este documento é o apoio visual da devolutiva
// (RECONHECER -> MOSTRAR -> EXPLICAR -> PRIORIZAR -> PROJETAR -> PLANEJAR),
// nunca um substituto da conversa.

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PacienteRow } from "@/lib/anamnese/types";
import { calcularPerfilIntegrado, type DomainKey } from "@/lib/integracao/perfil";
import { HORIZONTES, type Plano } from "@/lib/integracao/plano";
import { INDICADORES, extrairSerie, type LinhaHistorico } from "@/lib/integracao/historico";
import { SerieChart } from "@/components/SerieChart";

// Frases de apoio em linguagem simples - nunca os critérios/pontuações
// clínicas usadas em perfil.ts, que ficam reservadas ao relatório técnico.
const FRASE_AMIGAVEL: Record<DomainKey, string> = {
  forca: "Vamos trabalhar para aumentar sua força muscular.",
  mobilidade: "Vamos melhorar a amplitude dos seus movimentos.",
  equilibrio: "Vamos treinar seu equilíbrio, para reduzir o risco de quedas.",
  capacidade_cardiorrespiratoria: "Vamos melhorar seu condicionamento físico.",
  composicao_corporal: "Vamos trabalhar sua composição corporal.",
  dor: "Vamos cuidar da sua dor, com acompanhamento adequado.",
  estilo_de_vida: "Vamos ajustar hábitos do dia a dia para te ajudar.",
  sono: "Vamos cuidar da qualidade do seu sono.",
  bem_estar: "Vamos cuidar do seu bem-estar emocional.",
  funcionalidade: "Vamos melhorar sua capacidade de fazer as atividades do dia a dia.",
};

const INDICADORES_PACIENTE = ["peso_kg", "imc", "chair_stand_reps", "tug_seg", "velocidade_marcha_ms"];

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 break-inside-avoid">
      <h2 className="font-display text-xl text-ink mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

export default function RelatorioPaciente() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [paciente, setPaciente] = useState<PacienteRow | null>(null);
  const [historico, setHistorico] = useState<LinhaHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("pacientes").select("*").eq("id", id).single(),
      supabase.from("avaliacoes_historico").select("*").eq("paciente_id", id).order("criado_em", { ascending: true }),
    ]).then(([pacienteRes, historicoRes]) => {
      setPaciente(pacienteRes.data as PacienteRow);
      setHistorico((historicoRes.data as LinhaHistorico[]) ?? []);
      setCarregando(false);
    });
  }, [id]);

  if (carregando) return <main className="max-w-2xl mx-auto px-6 py-10 text-muted text-sm">Carregando...</main>;
  if (!paciente) return <main className="max-w-2xl mx-auto px-6 py-10 text-danger text-sm">Paciente não encontrado.</main>;

  const perfil = calcularPerfilIntegrado(paciente);
  const plano = paciente.plano as Plano | undefined;
  const itensPorHorizonte = HORIZONTES.map((h) => ({
    ...h,
    titulosDominio: Array.from(
      new Set((plano?.itens ?? []).filter((it) => it.horizonte === h.chave).map((it) => it.origem.split(" — ")[1] ?? it.origem))
    ),
  })).filter((h) => h.titulosDominio.length > 0);

  const indicadoresComDados = INDICADORES.filter((ind) => INDICADORES_PACIENTE.includes(ind.chave))
    .map((ind) => ({ ind, serie: extrairSerie(historico, ind) }))
    .filter((x) => x.serie.length > 0);

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 print:hidden flex items-center justify-between">
        <Link href={`/avaliador/paciente/${paciente.id}`} className="text-sm text-muted hover:text-ink">
          ← Voltar à ficha
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-accent text-white font-medium px-5 py-2 text-sm hover:bg-accent-dark transition"
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pb-16 print:px-0">
        <header className="mb-8 border-b-2 border-ink pb-4">
          <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">Seu plano de cuidado</p>
          <h1 className="font-display text-2xl text-ink">{paciente.nome}</h1>
          <p className="text-sm text-muted mt-1">Preparado em {new Date().toLocaleDateString("pt-BR")}</p>
        </header>

        <Secao titulo="O que notamos de positivo">
          {perfil.potencialidades.length === 0 ? (
            <p className="text-sm text-muted">Ainda estamos reunindo informação suficiente para esta seção.</p>
          ) : (
            <ul className="space-y-1.5">
              {perfil.potencialidades.map((d) => (
                <li key={d.chave} className="flex items-start gap-2 text-[15px] text-ink">
                  <span className="text-accent-dark mt-0.5">✓</span>
                  {d.titulo}
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="O que vamos priorizar juntos">
          {perfil.prioridades.length === 0 ? (
            <p className="text-sm text-muted">Nenhum ponto de atenção específico identificado até o momento.</p>
          ) : (
            <ul className="space-y-3">
              {perfil.prioridades.map((d) => (
                <li key={d.chave} className="rounded-xl border border-border bg-surface p-4">
                  <p className="font-medium text-ink">{d.titulo}</p>
                  <p className="text-sm text-muted mt-0.5">{FRASE_AMIGAVEL[d.chave]}</p>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        {itensPorHorizonte.length > 0 && (
          <Secao titulo="Seu plano ao longo do tempo">
            <div className="space-y-4">
              {itensPorHorizonte.map((h) => (
                <div key={h.chave} className="rounded-xl border border-border bg-surface p-4">
                  <p className="font-medium text-ink mb-1.5">{h.titulo}</p>
                  <p className="text-sm text-muted">{h.titulosDominio.join(" · ")}</p>
                </div>
              ))}
            </div>
          </Secao>
        )}

        {plano?.encaminhamentos && plano.encaminhamentos.length > 0 && (
          <Secao titulo="Também recomendamos consultar">
            <ul className="space-y-1.5">
              {plano.encaminhamentos.map((e) => (
                <li key={e.id} className="text-[15px] text-ink">
                  <strong>{e.especialidade}</strong> — {e.motivo}
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {indicadoresComDados.length > 0 && (
          <Secao titulo="Sua evolução">
            <div className="space-y-5">
              {indicadoresComDados.map(({ ind, serie }) => {
                const antes = serie[0];
                const atual = serie[serie.length - 1];
                const metaTexto = plano?.metas?.[ind.chave];
                const metaNum = metaTexto ? Number(metaTexto) : undefined;
                const metaValida = metaNum !== undefined && Number.isFinite(metaNum) ? metaNum : undefined;
                return (
                  <div key={ind.chave} className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-ink">
                        {ind.titulo} {ind.unidade && <span className="text-muted text-sm">({ind.unidade})</span>}
                      </p>
                      <p className="text-sm text-muted">
                        {antes.valor.toFixed(1)} → <strong className="text-accent-dark">{atual.valor.toFixed(1)}</strong>
                        {metaValida !== undefined && <> · meta {metaValida}</>}
                      </p>
                    </div>
                    <SerieChart serie={serie} meta={metaValida} />
                  </div>
                );
              })}
            </div>
          </Secao>
        )}

        <p className="text-xs text-muted border-t border-border pt-4 mt-8">
          Este documento resume sua avaliação em linguagem simples, para apoiar nossa conversa. Qualquer dúvida,
          fale com {paciente ? "seu avaliador" : "a clínica"}.
        </p>
      </main>
    </>
  );
}
