"use client";

// Apresentação da devolutiva (estilo slides) para sentar com o paciente.
//
// Usa os mesmos dados e a mesma linguagem da versão do paciente (sem pontuação,
// corte ou termo clínico): principais achados, o que vamos fazer em 30, 60 e 90
// dias e o próximo passo. As "notas do apresentador" (tecla N) trazem o detalhe
// técnico e ficam só para o profissional: não aparecem na impressão.
//
// Teclas: setas / espaço = navegar · F = tela cheia · N = notas · Esc = sair da tela cheia.

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { calcularPerfilIntegrado, type Classificacao } from "@/lib/integracao/perfil";
import { itemAprovado, type Plano } from "@/lib/integracao/plano";
import { INDICADORES, extrairSerie, type LinhaHistorico } from "@/lib/integracao/historico";
import { COMBINADOS, FONTE_PORQUE, PORQUE_VALE_A_PENA, perfilParaPaciente, ROTULO_SITUACAO, TEXTO_DOMINIO, fasesDoPlano, frentesPrioritarias, objetivoDoPaciente, primeiroNome } from "@/lib/integracao/devolutiva";
import { NOME_PROFISSIONAL } from "@/lib/marca";
import { SerieChart } from "@/components/SerieChart";

const LARGURA = 1280;
const ALTURA = 720;
const INDICADORES_PACIENTE = ["peso_kg", "imc", "chair_stand_reps", "tug_seg", "velocidade_marcha_ms"];

const COR_SITUACAO: Record<Classificacao, { fundo: string; ponto: string }> = {
  adequado: { fundo: "bg-accent-soft text-accent-dark", ponto: "bg-accent" },
  atencao: { fundo: "bg-warn-soft text-warn", ponto: "bg-warn" },
  prioridade: { fundo: "bg-info-soft text-info", ponto: "bg-info" },
  investigar: { fundo: "bg-surface text-muted border-2 border-border", ponto: "bg-ink/30" },
};

type SlideDef = { id: string; nav: string; notas: string[]; conteudo: ReactNode };

function Quadro({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col h-full px-20 pt-14 pb-16">
      <h2 className="font-display text-[52px] leading-tight text-ink">{titulo}</h2>
      {subtitulo && <p className="text-[26px] text-muted mt-2">{subtitulo}</p>}
      <div className="flex-1 mt-8 min-h-0">{children}</div>
    </div>
  );
}

export default function Apresentacao() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [paciente, setPaciente] = useState<PacienteRow | null>(null);
  const [historico, setHistorico] = useState<LinhaHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atual, setAtual] = useState(0);
  const [notas, setNotas] = useState(false);
  const [escala, setEscala] = useState(1);
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("pacientes").select("*").eq("id", id).single(),
      supabase.from("avaliacoes_historico").select("*").eq("paciente_id", id).order("criado_em", { ascending: true }),
    ]).then(([p, h]) => {
      setPaciente(p.data as PacienteRow);
      setHistorico((h.data as LinhaHistorico[]) ?? []);
      setCarregando(false);
    });
  }, [id]);

  const slides = useMemo<SlideDef[]>(() => {
    if (!paciente) return [];
    const perfil = perfilParaPaciente(calcularPerfilIntegrado(paciente), paciente);
    const plano = paciente.plano as Plano | undefined;
    const motivo = mesclarComPadrao(paciente.anamnese).motivo;
    const objetivo = objetivoDoPaciente(motivo);
    const frentes = frentesPrioritarias(perfil, motivo, plano);
    const principais = frentes.slice(0, 3);
    const depois = frentes.slice(3);
    const fortes = perfil.potencialidades;
    const fases = fasesDoPlano(plano, perfil);
    const encaminhamentos = (plano?.encaminhamentos ?? []).filter(itemAprovado);
    const semPlano = fases.every((f) => f.nomes.length === 0);
    const indicadores = INDICADORES.filter((i) => INDICADORES_PACIENTE.includes(i.chave))
      .map((ind) => ({ ind, serie: extrairSerie(historico, ind) }))
      .filter((x) => x.serie.length > 0)
      .slice(0, 4);
    const lista: SlideDef[] = [];

    lista.push({
      id: "capa",
      nav: "Início",
      notas: ["Agradeça a confiança e diga em uma frase o que vem: como a pessoa está hoje, o que vamos fazer e o próximo passo.", "Combine o tempo (cerca de 15 a 20 minutos) e convide a pessoa a interromper com dúvidas."],
      conteudo: (
        <div className="flex h-full">
          <div className="flex-1 flex flex-col justify-center px-24">
            <p className="text-[24px] tracking-[0.25em] uppercase text-accent font-semibold">Seu plano de cuidado</p>
            <h1 className="font-display text-[84px] leading-[1.05] text-ink mt-5">{paciente.nome}</h1>
            <p className="text-[28px] text-muted mt-6">Avaliação integrada de saúde, física e funcional</p>
            <p className="text-[26px] text-ink mt-10">{NOME_PROFISSIONAL}</p>
            <p className="text-[22px] text-muted">{new Date().toLocaleDateString("pt-BR")}</p>
          </div>
          <div className="w-[380px] bg-accent-soft flex items-center justify-center">
            <img src="/logo-sceh.png" alt="" className="w-[300px] h-auto" />
          </div>
        </div>
      ),
    });

    if (objetivo) {
      lista.push({
        id: "objetivo",
        nav: "O que você quer",
        notas: ["Leia a frase com a própria pessoa e confirme: isso ainda é o que você mais quer?", "Se o objetivo mudou, ajuste o plano antes de seguir: tudo o que vem depois parte daqui."],
        conteudo: (
          <Quadro titulo={`${primeiroNome(paciente.nome)}, o que você nos contou`}>
            <div className="h-full flex items-center">
              <blockquote className="border-l-[10px] border-accent bg-accent-soft rounded-r-3xl px-14 py-12 font-display text-[44px] leading-snug text-ink">“{objetivo}”</blockquote>
            </div>
            <p className="text-[26px] text-muted mt-6">Este plano foi montado a partir disso.</p>
          </Quadro>
        ),
      });
    }

    lista.push({
      id: "hoje",
      nav: "Como você está hoje",
      notas: [
        `Confiança do perfil: ${{ alta: "alta", media: "média", baixa: "baixa" }[perfil.confianca]}.`,
        "Explique que não é nota nem julgamento: é o ponto de partida para comparar na reavaliação.",
        ...perfil.dominios.filter((d) => d.classificacao !== "adequado").map((d) => `${d.titulo} (${d.classificacao}): ${d.justificativa}`),
      ],
      conteudo: (
        <Quadro titulo="Como você está hoje" subtitulo="Um retrato de cada área avaliada: o nosso ponto de partida.">
          <div className="grid grid-cols-5 gap-5">
            {perfil.dominios.map((d) => (
              <div key={d.chave} className={`min-w-0 rounded-3xl p-5 h-[188px] flex flex-col justify-between ${COR_SITUACAO[d.classificacao].fundo}`}>
                <span className={`block h-5 w-5 shrink-0 rounded-full ${COR_SITUACAO[d.classificacao].ponto}`} />
                <div>
                  <p className="font-display text-[25px] leading-tight text-ink break-words">{TEXTO_DOMINIO[d.chave].nome}</p>
                  <p className="text-[20px] mt-1.5 font-medium">{ROTULO_SITUACAO[d.classificacao]}</p>
                </div>
              </div>
            ))}
          </div>
        </Quadro>
      ),
    });

    if (fortes.length > 0) {
      lista.push({
        id: "fortes",
        nav: "O que já está bom",
        notas: ["Comece pelo positivo: reconhecer o que está bom aumenta a confiança e o engajamento.", "Diga que esses pontos fortes são a base do plano."],
        conteudo: (
          <Quadro titulo="O que já está bom" subtitulo="Pontos fortes que vamos manter e usar a seu favor.">
            <ul className="grid grid-cols-2 gap-x-14 gap-y-7">
              {fortes.slice(0, 6).map((d) => (
                <li key={d.chave} className="flex items-start gap-5">
                  <span className="text-accent-dark text-[44px] leading-none">✓</span>
                  <div>
                    <p className="font-display text-[34px] text-ink">{TEXTO_DOMINIO[d.chave].nome}</p>
                    <p className="text-[22px] text-muted mt-1 leading-snug">{TEXTO_DOMINIO[d.chave].bom}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Quadro>
        ),
      });
    }

    principais.forEach((f, i) => {
      lista.push({
        id: `achado-${f.dominio.chave}`,
        nav: `Achado ${i + 1}: ${f.nome}`,
        notas: [
          `Detalhe técnico (só para você): ${f.dominio.justificativa}`,
          "Use linguagem de cuidado, não de risco: 'é um ponto que merece atenção porque...'.",
          "Pergunte: isso faz sentido para você? Já percebeu isso no dia a dia?",
        ],
        conteudo: (
          <div className="flex h-full">
            <div className="w-[420px] bg-accent-soft px-14 flex flex-col justify-center">
              <p className="text-[24px] tracking-[0.2em] uppercase text-accent-dark font-semibold">Achado {i + 1} de {principais.length}</p>
              <h2 className="font-display text-[64px] leading-tight text-ink mt-4">{f.nome}</h2>
              <span className={`mt-6 self-start rounded-full px-6 py-2 text-[22px] font-medium ${COR_SITUACAO[f.dominio.classificacao].fundo}`}>{ROTULO_SITUACAO[f.dominio.classificacao]}</span>
            </div>
            <div className="flex-1 px-16 py-14 flex flex-col justify-center gap-9">
              <div>
                <p className="text-[22px] uppercase tracking-wide text-muted font-semibold">Por que importa</p>
                <p className="text-[30px] leading-snug text-ink mt-2">{f.importa}</p>
              </div>
              <div>
                <p className="text-[22px] uppercase tracking-wide text-muted font-semibold">O que vamos fazer</p>
                <p className="text-[30px] leading-snug text-ink mt-2">{f.plano}</p>
              </div>
              {f.objetivo && <p className="text-[24px] text-accent-dark italic leading-snug">Tem a ver com o que você nos contou: “{f.objetivo.length > 150 ? f.objetivo.slice(0, 147) + "..." : f.objetivo}”</p>}
            </div>
          </div>
        ),
      });
    });

    if (depois.length > 0) {
      lista.push({
        id: "depois",
        nav: "E depois",
        notas: ["Explique que começamos por poucas frentes para não sobrecarregar, e que as demais entram na sequência."],
        conteudo: (
          <Quadro titulo="E em seguida" subtitulo="Para não sobrecarregar, começamos por poucas frentes. Estas entram na sequência:">
            <ul className="flex flex-wrap gap-5">
              {depois.map((f) => (
                <li key={f.dominio.chave} className="rounded-full bg-info-soft text-info px-9 py-4 text-[30px] font-display">{f.nome}</li>
              ))}
            </ul>
          </Quadro>
        ),
      });
    }

    lista.push({
      id: "plano",
      nav: "Plano 30, 60 e 90 dias",
      notas: [
        semPlano ? "O plano ainda não foi aprovado na aba Plano de Intervenção: aqui aparecem só as fases. Aprove os itens para que o foco de cada fase apareça." : "O foco de cada fase vem dos itens que você aprovou na aba Plano de Intervenção.",
        "Peça a opinião: o ritmo parece possível para a sua rotina? Ajuste o que for preciso.",
      ],
      conteudo: (
        <Quadro titulo="Seu plano ao longo do tempo" subtitulo="Um passo de cada vez, com avaliação para você enxergar o que melhorou.">
          <div className={`grid gap-6 h-[430px] ${fases.length > 4 ? "grid-cols-5" : "grid-cols-4"}`}>
            {fases.map((f, i) => (
              <div key={f.chave} className="rounded-3xl border-2 border-border bg-surface p-7 flex flex-col">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-white font-display text-[26px] ${i === 0 ? "bg-accent" : i === 1 ? "bg-accent-dark" : i === 2 ? "bg-info" : "bg-ink"}`}>{i + 1}</span>
                <p className="font-display text-[38px] text-ink mt-4">{f.curto}</p>
                <p className="text-[20px] text-muted mt-2 leading-snug">{f.texto}</p>
                {f.nomes.length > 0 && (
                  <div className="mt-auto pt-4 border-t border-border">
                    <p className="text-[16px] uppercase tracking-wide text-muted font-semibold">Foco</p>
                    <p className="text-[22px] text-ink leading-snug mt-1">{f.nomes.join(" · ")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Quadro>
      ),
    });

    lista.push({
      id: "medir",
      nav: "Como vamos medir",
      notas: [
        indicadores.length > 0 ? "Mostre os números de hoje: serão repetidos na reavaliação para ver a evolução." : "Ainda não há medidas registradas no histórico: salve as abas Física e Funcional para que apareçam aqui.",
        "Reforce: a reavaliação em 90 dias compara com o ponto de partida de hoje.",
      ],
      conteudo: (
        <Quadro titulo="Como vamos medir o seu progresso" subtitulo="Hoje é o ponto de partida. Em 90 dias repetimos as medidas e você vê a diferença em números.">
          {indicadores.length === 0 ? (
            <p className="text-[32px] text-ink leading-snug max-w-[900px]">Vamos repetir as mesmas medidas na reavaliação, para comparar com o dia de hoje e mostrar a sua evolução.</p>
          ) : (
            <div className={`grid gap-6 ${indicadores.length > 2 ? "grid-cols-4" : "grid-cols-2"}`}>
              {indicadores.map(({ ind, serie }) => {
                const ultimo = serie[serie.length - 1];
                const metaTexto = plano?.metas?.[ind.chave];
                const metaNum = metaTexto ? Number(metaTexto) : undefined;
                const meta = metaNum !== undefined && Number.isFinite(metaNum) ? metaNum : undefined;
                return (
                  <div key={ind.chave} className="rounded-3xl border-2 border-border bg-surface p-6">
                    <p className="text-[22px] text-muted">{ind.titulo}{ind.unidade ? ` (${ind.unidade})` : ""}</p>
                    <p className="font-display text-[58px] text-ink leading-none mt-2">{ultimo.valor.toFixed(1).replace(".", ",")}</p>
                    <p className="text-[20px] text-muted mt-1">{serie.length > 1 ? `começou em ${serie[0].valor.toFixed(1).replace(".", ",")}` : "ponto de partida"}{meta !== undefined ? ` · meta ${meta}` : ""}</p>
                    {serie.length > 1 && (
                      <div className="mt-3">
                        <SerieChart serie={serie} meta={meta} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Quadro>
      ),
    });

    if (encaminhamentos.length > 0) {
      lista.push({
        id: "encaminhamentos",
        nav: "Outros profissionais",
        notas: ["Apresente como cuidado que soma ao plano, e explique o que esperar do retorno à clínica."],
        conteudo: (
          <Quadro titulo="Também recomendamos consultar" subtitulo="Esses profissionais somam ao seu cuidado e deixam o resultado mais seguro.">
            <ul className="space-y-6">
              {encaminhamentos.map((e) => (
                <li key={e.id} className="rounded-3xl bg-info-soft px-10 py-7">
                  <p className="font-display text-[38px] text-info">{e.especialidade}</p>
                  <p className="text-[26px] text-ink mt-1 leading-snug">{e.motivo}</p>
                </li>
              ))}
            </ul>
          </Quadro>
        ),
      });
    }

    lista.push({
      id: "vale",
      nav: "Por que vale a pena",
      notas: ["Sem promessa de resultado e sem pressão: o objetivo é informar. Fontes: diretrizes de atividade física da OMS (2020) e a meta-análise de 2024 sobre exercício supervisionado e não supervisionado em ≥ 60 anos (Gómez-Redondo et al., Sports Med, PMID 38647999).", "Cada pessoa responde de um jeito: acompanhamos o ritmo dela. A frase sobre supervisão vem de estudo em pessoas com 60 anos ou mais: se o paciente for mais jovem, não generalize."],
      conteudo: (
        <Quadro titulo="Por que vale a pena começar agora">
          <ul className="space-y-6">
            {PORQUE_VALE_A_PENA.map((t) => (
              <li key={t} className="flex items-start gap-5 text-[27px] text-ink leading-snug">
                <span className="text-accent-dark text-[36px] leading-none">✓</span>
                {t}
              </li>
            ))}
          </ul>
          <p className="text-[18px] text-muted mt-6">{FONTE_PORQUE}</p>
        </Quadro>
      ),
    });

    lista.push({
      id: "fim",
      nav: "Vamos começar?",
      notas: ["Peça o compromisso com a data: combine agora o dia e o horário do próximo encontro.", "Pergunte se ficou alguma dúvida e ofereça enviar o resumo por WhatsApp (botão na versão do paciente)."],
      conteudo: (
        <div className="flex h-full">
          <div className="flex-1 px-20 py-14 flex flex-col justify-center">
            <h2 className="font-display text-[52px] text-ink">O que combinamos</h2>
            <ul className="mt-8 space-y-5">
              {COMBINADOS.map((t) => (
                <li key={t} className="flex items-start gap-4 text-[28px] text-ink leading-snug">
                  <span className="text-accent-dark">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-[520px] bg-accent px-14 flex flex-col justify-center text-white">
            <h2 className="font-display text-[60px] leading-tight">Vamos começar?</h2>
            <p className="text-[28px] leading-snug mt-5 opacity-95">O primeiro passo é combinar a data do nosso próximo encontro, no dia e horário melhores para você.</p>
            <p className="text-[26px] mt-10 font-medium">{NOME_PROFISSIONAL}</p>
          </div>
        </div>
      ),
    });

    return lista;
  }, [paciente, historico]);

  const total = slides.length;
  const ir = useCallback((n: number) => setAtual((a) => Math.max(0, Math.min(total - 1, typeof n === "number" ? n : a))), [total]);
  const proximo = useCallback(() => setAtual((a) => Math.min(total - 1, a + 1)), [total]);
  const anterior = useCallback(() => setAtual((a) => Math.max(0, a - 1)), []);

  // Escala o "palco" 1280x720 para caber na janela (e na tela cheia).
  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const calcular = () => setEscala(Math.min(el.clientWidth / LARGURA, el.clientHeight / ALTURA));
    calcular();
    const obs = new ResizeObserver(calcular);
    obs.observe(el);
    return () => obs.disconnect();
  }, [carregando]);

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) {
        e.preventDefault();
        proximo();
      } else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) {
        e.preventDefault();
        anterior();
      } else if (e.key === "Home") ir(0);
      else if (e.key === "End") ir(total - 1);
      else if (e.key.toLowerCase() === "n") setNotas((v) => !v);
      else if (e.key.toLowerCase() === "f") alternarTelaCheia();
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [proximo, anterior, ir, total]);

  function alternarTelaCheia() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }

  if (carregando) return <main className="max-w-2xl mx-auto px-6 py-10 text-muted text-sm">Carregando...</main>;
  if (!paciente) return <main className="max-w-2xl mx-auto px-6 py-10 text-danger text-sm">Paciente não encontrado.</main>;

  const slide = slides[atual];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 print:static print:bg-white print:block">
      <style>{`@media print { @page { size: ${LARGURA}px ${ALTURA}px; margin: 0 } html, body { background: #fff !important } }`}</style>

      <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-white/85 print:hidden">
        <Link href={`/avaliador/paciente/${paciente.id}`} className="hover:text-white">
          ← Sair da apresentação
        </Link>
        <span className="truncate hidden sm:inline">{slide.nav}</span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setNotas((v) => !v)} className={`hover:text-white ${notas ? "text-white font-medium" : ""}`}>
            Notas (N)
          </button>
          <button type="button" onClick={alternarTelaCheia} className="hover:text-white">
            Tela cheia (F)
          </button>
          <button type="button" onClick={() => window.print()} className="hover:text-white">
            Salvar PDF
          </button>
        </div>
      </div>

      <div ref={area} className="flex-1 min-h-0 flex items-center justify-center print:block print:h-auto" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); (e.clientX - r.left) / r.width < 0.2 ? anterior() : proximo(); }}>
        <div className="relative print:!w-auto print:!h-auto" style={{ width: LARGURA * escala, height: ALTURA * escala }}>
          {slides.map((s, i) => (
            <div
              key={s.id}
              className={`${i === atual ? "block" : "hidden"} print:block relative bg-white overflow-hidden shadow-2xl print:shadow-none origin-top-left print:!transform-none`}
              style={{ width: LARGURA, height: ALTURA, transform: `scale(${escala})`, breakAfter: i < total - 1 ? "page" : "auto" }}
            >
              <div className="h-full">{s.conteudo}</div>
              {i > 0 && i < total - 1 && <div className="absolute bottom-4 left-20 text-[16px] text-muted">{NOME_PROFISSIONAL}</div>}
              <div className="absolute bottom-4 right-8 text-[16px] text-muted">{i + 1} / {total}</div>
            </div>
          ))}
        </div>
      </div>

      {notas && (
        <div className="print:hidden bg-surface border-t border-border px-6 py-3 max-h-[28vh] overflow-y-auto">
          <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-1">Notas do apresentador (não aparecem para o paciente na impressão)</p>
          <ul className="text-sm text-ink space-y-1 list-disc list-inside">
            {slide.notas.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="print:hidden flex items-center gap-3 px-4 py-2.5 text-white/85">
        <button type="button" onClick={anterior} disabled={atual === 0} className="rounded-lg border border-white/30 px-4 py-1.5 text-sm hover:bg-white/10 disabled:opacity-40">
          ← Anterior
        </button>
        <div className="flex-1 flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button key={s.id} type="button" onClick={() => ir(i)} title={s.nav} aria-label={`Ir para: ${s.nav}`} className={`h-2 flex-1 rounded-full transition ${i === atual ? "bg-white" : i < atual ? "bg-white/60" : "bg-white/25"} hover:bg-white`} />
          ))}
        </div>
        <button type="button" onClick={proximo} disabled={atual === total - 1} className="rounded-lg bg-white text-ink px-4 py-1.5 text-sm font-medium hover:bg-white/90 disabled:opacity-40">
          Próximo →
        </button>
      </div>
    </div>
  );
}
