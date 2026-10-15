"use client";

// Estudos científicos para atualização: base usada por cada agente, situação da revisão, pendências de
// conferência e buscas prontas no PubMed. Não traz estudo novo sozinho (ver lib/estudos.ts).

import { useMemo, useState } from "react";
import Link from "next/link";
import AgenteAvatar from "@/components/avaliador/AgenteAvatar";
import { AGENTES_SISTEMA, REVISAO_LITERATURA, diasDesdeRevisao, referenciasDoAgente, revisaoVencida, type AgenteId } from "@/lib/agentes";
import { condicoesSemFonte, referenciasUsadas } from "@/lib/condicoes/catalogo";
import { PENDENCIAS, TEMAS_BUSCA, linkPmid, linkPubMed } from "@/lib/estudos";

const ORDEM: AgenteId[] = ["nina", "sofia", "marco", "paula", "rita", "iris", "theo", "clara", "caio"];

function dataBR(iso: string) {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export default function Estudos() {
  const dias = useMemo(() => diasDesdeRevisao(), []);
  const vencida = useMemo(() => revisaoVencida(), []);
  const restam = REVISAO_LITERATURA.validadeDias - dias;
  const [aberto, setAberto] = useState<AgenteId | null>(null);
  const refsCondicoes = useMemo(() => referenciasUsadas(), []);
  const semFonte = useMemo(() => condicoesSemFonte(), []);

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl text-ink">Estudos para atualização</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl leading-relaxed">
            Base científica que cada agente usa hoje, quando a revisão vence, o que ainda precisa ser conferido e buscas prontas no PubMed para trazer estudos novos.
          </p>
        </div>
        <Link href="/avaliador" className="text-sm text-muted hover:text-ink">
          ← Pacientes
        </Link>
      </div>

      <section className={`rounded-2xl border p-5 ${vencida ? "border-warn bg-warn-soft" : "border-border bg-surface"}`}>
        <h2 className="font-display text-lg text-ink">Situação da revisão</h2>
        <ul className="mt-2 text-sm text-ink space-y-1">
          <li>
            <strong>Literatura revisada por agente:</strong> {dataBR(REVISAO_LITERATURA.revisaoPorAgente)} ({dias} dias).{" "}
            {vencida ? <strong className="text-warn">Revisão vencida: peça uma nova rodada à Dra. Nina.</strong> : `Em dia: faltam ${restam} dias para o prazo de ${REVISAO_LITERATURA.validadeDias} dias.`}
          </li>
          <li>
            <strong>Referências conferidas no PubMed:</strong> última conferência em {dataBR(REVISAO_LITERATURA.referenciasConferidasNoPubMed)}.
          </li>
        </ul>
        <div className="mt-3 rounded-lg bg-bg p-3 text-sm text-muted leading-relaxed">
          <p className="font-medium text-ink">Como atualizar</p>
          <ol className="list-decimal pl-5 mt-1 space-y-1">
            <li>Abra as buscas do PubMed abaixo (já ordenadas pelas publicações mais novas dos últimos anos) e veja o que saiu.</li>
            <li>Peça a rodada de revisão à Dra. Nina: cada estudo é conferido (autor, revista, ano, volume e página) antes de entrar.</li>
            <li>O que passar é registrado em <code>10-Revisao-Cientifica-por-Agente.md</code> e na base de cada agente; o que não puder ser conferido fica marcado como a confirmar.</li>
          </ol>
          <p className="mt-2 text-xs">
            Esta página <strong>não traz estudos novos sozinha</strong> nem resume artigos: ela organiza o que já se usa e abre as buscas. Conferir que um artigo existe não é o mesmo que tê-lo lido por inteiro.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-ink">Por agente</h2>
        <ul className="space-y-3">
          {ORDEM.map((id) => {
            const a = AGENTES_SISTEMA[id];
            const refs = referenciasDoAgente(id);
            const abertoAqui = aberto === id;
            return (
              <li key={id} className="rounded-2xl border border-border bg-surface">
                <button type="button" aria-expanded={abertoAqui} onClick={() => setAberto(abertoAqui ? null : id)} className="w-full text-left p-4 flex items-center gap-3">
                  <AgenteAvatar id={id} tamanho={44} titulo={`${a.tratamento} ${a.nome}`} />
                  <span className="flex-1">
                    <span className="font-display text-ink">
                      {a.tratamento} {a.nome}
                    </span>
                    <span className="block text-xs text-muted">{a.especialidade}</span>
                  </span>
                  <span className="text-xs text-muted shrink-0">
                    {refs.length} referência(s) · {abertoAqui ? "fechar" : "abrir"}
                  </span>
                </button>
                {abertoAqui && (
                  <div className="px-4 pb-4 space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted font-semibold">Buscar novidades no PubMed</p>
                      <ul className="mt-1 space-y-1 text-sm">
                        {TEMAS_BUSCA[id].map((t) => (
                          <li key={t.consulta}>
                            <a href={linkPubMed(t.consulta)} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                              {t.rotulo}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted font-semibold">Referências usadas hoje (existência conferida no PubMed)</p>
                      {refs.length === 0 ? (
                        <p className="text-sm text-muted mt-1">Nenhuma referência própria cadastrada.</p>
                      ) : (
                        <ol className="mt-1 space-y-2 text-sm list-decimal pl-5">
                          {refs.map((r) => (
                            <li key={r.id} className="text-ink leading-relaxed">
                              {r.citacao}.{" "}
                              <a href={linkPmid(r.pmid)} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                                PubMed {r.pmid}
                              </a>
                              <span className="block text-xs text-muted">{r.apoia}.</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h2 className="font-display text-lg text-ink">Aba Condições de saúde</h2>
        <p className="text-sm text-muted">
          {refsCondicoes.length} referências conferidas no PubMed; {semFonte.length} condições seguem sem fonte conferida (texto educativo geral do sistema): {semFonte.map((c) => c.nome).join("; ")}.
        </p>
        <ul className="text-sm space-y-1">
          {["Hipertensão, doença do coração e AVC", "Diabetes e obesidade", "Asma, DPOC e apneia", "Dor lombar, artrose, osteoporose e fibromialgia", "Depressão e câncer"].map((rotulo, i) => {
            const consultas = [
              "exercise training hypertension coronary heart disease stroke guideline",
              "exercise diabetes obesity guideline",
              "exercise asthma COPD sleep apnea",
              "exercise low back pain osteoarthritis osteoporosis fibromyalgia",
              "exercise depression cancer survivors guideline",
            ];
            return (
              <li key={rotulo}>
                <a href={linkPubMed(consultas[i])} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Buscar: {rotulo}
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h2 className="font-display text-lg text-ink">O que ainda precisa de conferência</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-border">
                <th className="py-2 pr-3 font-medium">Agente</th>
                <th className="py-2 pr-3 font-medium">Item</th>
                <th className="py-2 font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {PENDENCIAS.map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0 align-top">
                  <td className="py-2 pr-3 text-muted whitespace-nowrap">{p.agente}</td>
                  <td className="py-2 pr-3 text-ink">{p.item}</td>
                  <td className="py-2 text-muted">{p.situacao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
