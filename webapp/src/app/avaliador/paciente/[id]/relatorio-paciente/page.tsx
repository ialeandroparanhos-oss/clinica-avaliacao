"use client";

// Agente 8 — Clara: versão do relatório para entregar ao paciente.
//
// Objetivo: o paciente entender, em linguagem simples, onde está, por que cada
// ponto importa e o que vamos fazer - e querer começar. Segue a devolutiva
// (RECONHECER -> MOSTRAR -> EXPLICAR -> PRIORIZAR -> PROJETAR -> PLANEJAR) e
// termina com o próximo passo. Sem pontuação, corte ou termo clínico (isso fica
// no relatório técnico, em /relatorio). Apoio visual da conversa, nunca um
// substituto dela.

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { calcularPerfilIntegrado, type Classificacao } from "@/lib/integracao/perfil";
import { HORIZONTES, HORIZONTE_LEGADO, itemAprovado, type ItemPlano, type Plano } from "@/lib/integracao/plano";
import { INDICADORES, extrairSerie, type LinhaHistorico } from "@/lib/integracao/historico";
import { COMBINADOS, FONTE_PORQUE, PORQUE_VALE_A_PENA, ROTULO_SITUACAO, TEXTO_DOMINIO, TEXTO_FASE, frentesPrioritarias, objetivoDoPaciente, primeiroNome } from "@/lib/integracao/devolutiva";
import { mensagemPaciente } from "@/lib/avaliacao/whatsapp";
import { NOME_PROFISSIONAL } from "@/lib/marca";
import { SerieChart } from "@/components/SerieChart";
import { EnvioWhatsApp } from "@/components/avaliador/EnvioWhatsApp";

const INDICADORES_PACIENTE = ["peso_kg", "imc", "chair_stand_reps", "tug_seg", "velocidade_marcha_ms"];

const ESTILO_SITUACAO: Record<Classificacao, string> = {
  adequado: "bg-accent-soft text-accent-dark",
  atencao: "bg-warn-soft text-warn",
  prioridade: "bg-info-soft text-info",
  investigar: "bg-surface text-muted border border-border",
};

function Secao({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <section className="mb-9 break-inside-avoid">
      <h2 className="font-display text-xl text-ink">{titulo}</h2>
      {subtitulo && <p className="text-sm text-muted mt-1">{subtitulo}</p>}
      <div className="mt-3">{children}</div>
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
  const motivo = mesclarComPadrao(paciente.anamnese).motivo;
  const objetivo = objetivoDoPaciente(motivo);
  const frentes = frentesPrioritarias(perfil, motivo, plano);
  const principais = frentes.slice(0, 3);
  const depois = frentes.slice(3);
  const naoAvaliados = perfil.dominios.filter((d) => d.classificacao === "investigar");
  const avaliados = perfil.dominios.filter((d) => d.classificacao !== "investigar");

  // Só o que o avaliador aprovou. Para o paciente, cada horizonte lista as FRENTES
  // em foco, sem jargão técnico nem evidência.
  const tituloFrente = (it: ItemPlano): string => {
    if (it.dominio) return TEXTO_DOMINIO[it.dominio]?.nome ?? perfil.dominios.find((d) => d.chave === it.dominio)?.titulo ?? it.origem;
    if (it.categoria === "reavaliacao") return "Reavaliação do seu progresso";
    if (it.categoria === "seguranca") return "Segurança antes de intensificar o exercício";
    return it.origem.split(" — ")[1] ?? it.origem;
  };
  const frentesPorHorizonte = (chave: string) =>
    Array.from(new Set((plano?.itens ?? []).filter((it) => it.horizonte === chave && itemAprovado(it)).map(tituloFrente)));
  const fases = [...HORIZONTES, ...((plano?.itens ?? []).some((i) => i.horizonte === "180" && itemAprovado(i)) ? [HORIZONTE_LEGADO] : [])];

  const indicadoresComDados = INDICADORES.filter((ind) => INDICADORES_PACIENTE.includes(ind.chave))
    .map((ind) => ({ ind, serie: extrairSerie(historico, ind) }))
    .filter((x) => x.serie.length > 0);

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 print:hidden flex items-center justify-between">
        <Link href={`/avaliador/paciente/${paciente.id}`} className="text-sm text-muted hover:text-ink">
          ← Voltar à ficha
        </Link>
        <Link href={`/avaliador/paciente/${paciente.id}/apresentacao`} className="text-sm font-medium text-accent hover:underline">
          Apresentar em slides →
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-accent text-white font-medium px-5 py-2 text-sm hover:bg-accent-dark transition"
        >
          Imprimir / Salvar PDF
        </button>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-6 print:hidden">
        <EnvioWhatsApp rotuloTelefone="WhatsApp do paciente" telefoneInicial={paciente.telefone ?? ""} mensagemInicial={() => mensagemPaciente(paciente)} />
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 pb-16 print:px-0">
        <header className="mb-8 border-b-2 border-ink pb-4">
          <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">Seu plano de cuidado</p>
          <h1 className="font-display text-2xl text-ink">{paciente.nome}</h1>
          <p className="text-sm text-muted mt-1">Preparado em {new Date().toLocaleDateString("pt-BR")} por {NOME_PROFISSIONAL}</p>
        </header>

        <Secao titulo={`Olá, ${primeiroNome(paciente.nome)}!`}>
          <p className="text-[15px] text-ink leading-relaxed">
            Obrigado por confiar o seu cuidado a nós. Neste documento você vê, de forma simples, <strong>como você está hoje</strong>, <strong>por que cada ponto importa</strong> e <strong>o que vamos fazer juntos</strong> para
            chegar onde você quer.
          </p>
          {objetivo && (
            <blockquote className="mt-3 rounded-xl border-l-4 border-accent bg-accent-soft px-4 py-3 text-[15px] text-ink">
              <span className="block text-xs uppercase tracking-wide text-accent-dark font-semibold mb-1">O que você nos contou</span>“{objetivo}”
              <span className="block text-sm text-muted mt-2">Este plano foi montado a partir disso.</span>
            </blockquote>
          )}
        </Secao>

        <Secao titulo="Como você está hoje" subtitulo="Um retrato de cada área avaliada. Não é nota nem julgamento: é o nosso ponto de partida.">
          {avaliados.length === 0 ? (
            <p className="text-sm text-muted">Ainda estamos reunindo informação suficiente para esta seção.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {avaliados.map((d) => (
                <li key={d.chave} className="rounded-xl border border-border bg-surface p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-ink text-[15px]">{TEXTO_DOMINIO[d.chave].nome}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${ESTILO_SITUACAO[d.classificacao]}`}>{ROTULO_SITUACAO[d.classificacao]}</span>
                  </div>
                  {d.classificacao === "adequado" && <p className="text-sm text-muted mt-1.5">{TEXTO_DOMINIO[d.chave].bom}</p>}
                </li>
              ))}
            </ul>
          )}
          {naoAvaliados.length > 0 && (
            <p className="text-sm text-muted mt-3">Ainda vamos conhecer melhor: {naoAvaliados.map((d) => TEXTO_DOMINIO[d.chave].nome.toLowerCase()).join(", ")}.</p>
          )}
        </Secao>

        {principais.length > 0 && (
          <Secao titulo="Por onde vamos começar" subtitulo="Para não sobrecarregar, começamos pelo que mais pesa na sua saúde e no que você quer conquistar.">
            <ol className="space-y-3">
              {principais.map((f, i) => (
                <li key={f.dominio.chave} className="rounded-xl border border-border bg-surface p-4">
                  <p className="font-medium text-ink">
                    <span className="text-accent-dark mr-1.5">{i + 1}.</span>
                    {f.nome}
                  </p>
                  <p className="text-sm text-ink mt-1.5 leading-relaxed">
                    <strong>Por que importa:</strong> {f.importa}
                  </p>
                  <p className="text-sm text-ink mt-1.5 leading-relaxed">
                    <strong>O que vamos fazer:</strong> {f.plano}
                  </p>
                  {f.objetivo && <p className="text-sm text-accent-dark mt-1.5 italic">Isso tem a ver com o que você nos contou: “{f.objetivo.length > 140 ? f.objetivo.slice(0, 137) + "..." : f.objetivo}”</p>}
                </li>
              ))}
            </ol>
            {depois.length > 0 && <p className="text-sm text-muted mt-3">Em seguida, cuidaremos também de: {depois.map((f) => f.nome.toLowerCase()).join(", ")}.</p>}
          </Secao>
        )}

        <Secao titulo="Seu plano ao longo do tempo" subtitulo="Um passo de cada vez, com avaliação para você enxergar o que melhorou.">
          <div className="space-y-3">
            {fases.map((h) => {
              const fase = TEXTO_FASE[h.chave];
              const nomes = frentesPorHorizonte(h.chave);
              return (
                <div key={h.chave} className="rounded-xl border border-border bg-surface p-4">
                  <p className="font-medium text-ink">{fase.titulo}</p>
                  <p className="text-sm text-muted mt-1 leading-relaxed">{fase.texto}</p>
                  {nomes.length > 0 && <p className="text-sm text-ink mt-2"><strong>Foco:</strong> {nomes.join(" · ")}</p>}
                </div>
              );
            })}
          </div>
        </Secao>

        {plano?.encaminhamentos && plano.encaminhamentos.filter(itemAprovado).length > 0 && (
          <Secao titulo="Também recomendamos consultar" subtitulo="Esses profissionais somam ao seu cuidado e deixam o resultado mais seguro.">
            <ul className="space-y-1.5">
              {plano.encaminhamentos.filter(itemAprovado).map((e) => (
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

        <Secao titulo="Por que vale a pena começar agora">
          <ul className="space-y-2">
            {PORQUE_VALE_A_PENA.map((t) => (
              <li key={t} className="flex items-start gap-2 text-[15px] text-ink leading-relaxed">
                <span className="text-accent-dark mt-0.5">✓</span>
                {t}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted mt-2">{FONTE_PORQUE}</p>
        </Secao>

        <Secao titulo="O que combinamos">
          <p className="text-sm text-muted mb-2">O plano funciona melhor quando andamos juntos. De você, pedimos pouco:</p>
          <ul className="space-y-1.5">
            {COMBINADOS.map((t) => (
              <li key={t} className="flex items-start gap-2 text-[15px] text-ink">
                <span className="text-accent-dark mt-0.5">•</span>
                {t}
              </li>
            ))}
          </ul>
        </Secao>

        <section className="rounded-2xl bg-accent-soft p-5 break-inside-avoid">
          <h2 className="font-display text-xl text-accent-dark">Vamos começar?</h2>
          <p className="text-[15px] text-ink mt-1.5 leading-relaxed">
            O primeiro passo é combinar a data do nosso próximo encontro. Fale conosco para agendar no dia e horário que forem melhores para você. Estamos aqui para caminhar ao seu lado, no seu ritmo.
          </p>
          <p className="text-sm text-ink mt-3 font-medium">{NOME_PROFISSIONAL}</p>
        </section>

        <p className="text-xs text-muted border-t border-border pt-4 mt-8">
          Este documento resume a sua avaliação em linguagem simples, para apoiar a nossa conversa. Ele não é um diagnóstico nem substitui a orientação de um médico. Qualquer dúvida, fale conosco.
        </p>
      </main>
    </>
  );
}
