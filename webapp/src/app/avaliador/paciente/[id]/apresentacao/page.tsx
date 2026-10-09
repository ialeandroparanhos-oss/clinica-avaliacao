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
import { COMBINADOS, FONTE_PORQUE, PORQUE_VALE_A_PENA, servicosParaPaciente, ROTULO_SITUACAO, TEXTO_DOMINIO, fasesDoPlano, frentesPrioritarias, nomeFrenteDoItem, objetivoDoPaciente, primeiroNome } from "@/lib/integracao/devolutiva";
import { NOME_PROFISSIONAL } from "@/lib/marca";
import { resultadosParaApresentacao } from "@/lib/integracao/resultadosApresentacao";
import { NOME_SERVICO } from "@/lib/integracao/servicos";
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

// Versão compacta (tabelas de resultado): título menor e menos margem, para caber 6 linhas.
function QuadroCompacto({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col h-full px-16 pt-10 pb-14">
      <h2 className="font-display text-[42px] leading-tight text-ink">{titulo}</h2>
      {subtitulo && <p className="text-[21px] text-muted mt-1">{subtitulo}</p>}
      <div className="flex-1 mt-4 min-h-0">{children}</div>
    </div>
  );
}

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
    const perfil = calcularPerfilIntegrado(paciente);
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
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0 flex items-center">
                <blockquote className={`border-l-[10px] border-accent bg-accent-soft rounded-r-3xl px-14 py-10 font-display leading-snug text-ink ${objetivo.length > 220 ? "text-[30px]" : objetivo.length > 110 ? "text-[36px]" : "text-[44px]"}`}>“{objetivo}”</blockquote>
              </div>
              <p className="text-[26px] text-muted pt-4">Este plano foi montado a partir disso.</p>
            </div>
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
      nav: "Plano: visão geral",
      notas: [
        semPlano ? "O plano ainda não foi aprovado na aba Plano de Intervenção: aqui aparecem só as fases. Aprove os itens para que o foco de cada fase apareça." : "O foco de cada fase vem dos itens que você aprovou na aba Plano de Intervenção.",
        "Peça a opinião: o ritmo parece possível para a sua rotina? Ajuste o que for preciso.",
      ],
      conteudo: (
        <QuadroCompacto titulo="Seu plano ao longo do tempo" subtitulo="Um passo de cada vez, com avaliação para você enxergar o que melhorou.">
          <div className={`grid gap-4 ${fases.length > 4 ? "grid-cols-5" : "grid-cols-4"}`}>
            {fases.map((f, i) => (
              <div key={f.chave} className="rounded-3xl border-2 border-border bg-surface p-5 flex flex-col">
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-white font-display text-[26px] ${i === 0 ? "bg-accent" : i === 1 ? "bg-accent-dark" : i === 2 ? "bg-info" : "bg-ink"}`}>{i + 1}</span>
                <p className="font-display text-[32px] text-ink mt-3">{f.curto}</p>
                <p className="text-[16px] text-muted mt-1.5 leading-snug">{f.texto}</p>
                {f.nomes.length > 0 && (
                  <div className="mt-auto pt-4 border-t border-border">
                    <p className="text-[16px] uppercase tracking-wide text-muted font-semibold">Foco</p>
                    <p className="text-[18px] text-ink leading-snug mt-1">{f.nomes.join(" · ")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </QuadroCompacto>
      ),
    });

    const servicos = servicosParaPaciente(plano);
    if (servicos.length > 0) {
      lista.push({
        id: "servicos",
        nav: "Serviços que podem ajudar",
        notas: [
          "Só aparecem os serviços que você aprovou na aba Plano. Apresente como apoio ao objetivo do paciente, sem pressão e sem preço nesta tela.",
          "O que está como 'se você quiser' é opcional de verdade: respeite a escolha. A continuidade de cada serviço é reavaliada junto com o paciente (30, 60 e 90 dias).",
          ...servicos.map((s) => `${s.nome}: para ${s.para}; ${s.quando}${s.opcional ? " (opcional)" : ""}.`),
        ],
        conteudo: (
          <QuadroCompacto titulo="Serviços que podem ajudar no seu cuidado" subtitulo="Cada um entra quando fizer sentido para você. A continuidade é conversada junto, sem compromisso.">
            <ul className={`grid gap-4 ${servicos.length > 4 ? "grid-cols-3" : "grid-cols-2"}`}>
              {servicos.map((s) => (
                <li key={s.servico} className="rounded-3xl border-2 border-border bg-surface px-5 py-4">
                  <p className="font-display text-[28px] text-ink leading-tight">{s.nome}</p>
                  {s.opcional && <p className="text-[15px] text-muted">se você quiser</p>}
                  <p className="text-[18px] text-ink mt-1.5 leading-snug">Para {s.para}.</p>
                  <p className="text-[16px] text-accent-dark mt-1">Pode começar {s.quando}.</p>
                </li>
              ))}
            </ul>
          </QuadroCompacto>
        ),
      });
    }

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
          <ul className="space-y-4">
            {PORQUE_VALE_A_PENA.map((t) => (
              <li key={t} className="flex items-start gap-5 text-[24px] text-ink leading-snug">
                <span className="text-accent-dark text-[36px] leading-none">✓</span>
                {t}
              </li>
            ))}
          </ul>
          <p className="text-[16px] text-muted mt-4">{FONTE_PORQUE}</p>
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

    // ---------------------------------------------------------------- resultados por área (com números)
    resultadosParaApresentacao(paciente, perfil).forEach((g) => {
      const COR_LEITURA = { ok: "bg-accent-soft text-accent-dark", atencao: "bg-warn-soft text-warn", info: "bg-surface text-muted border border-border" } as const;
      lista.push({
        id: `resultado-${g.id}`,
        nav: `Resultados: ${g.titulo}`,
        notas: [...g.notas.filter(Boolean).map((x) => `Detalhe técnico (só para você): ${x}`), "Leia cada linha com o paciente: o que foi medido, com o que comparamos e o que isso significa para o dia a dia.", "Mostre a caixa de possíveis intervenções como o caminho, não como cobrança."],
        conteudo: (
          <QuadroCompacto titulo={g.titulo} subtitulo={g.subtitulo}>
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl border border-border overflow-hidden">
                {g.linhas.slice(0, 6).map((l, i) => (
                  <div key={i} className={`grid grid-cols-[1.3fr_1fr_1.3fr_0.9fr] gap-4 items-center px-5 py-2 ${i % 2 === 1 ? "bg-bg" : "bg-surface"}`}>
                    <p className="text-[19px] text-ink leading-tight">{l.indicador}</p>
                    <p className="font-display text-[23px] text-ink leading-tight">{l.valor}</p>
                    <p className="text-[15px] text-muted leading-tight">{l.referencia}</p>
                    <span className={`justify-self-start rounded-full px-3 py-0.5 text-[15px] font-medium leading-tight ${COR_LEITURA[l.leitura]}`}>{l.texto}</span>
                  </div>
                ))}
              </div>
              {g.intervencoes.length > 0 && (
                <div className="rounded-2xl bg-info-soft px-6 py-3">
                  <p className="text-[15px] uppercase tracking-wide text-info font-semibold">Possível intervenção</p>
                  <ul className="mt-1 space-y-0.5">
                    {g.intervencoes.slice(0, 2).map((x, i) => (
                      <li key={i} className="text-[18px] text-ink leading-snug">
                        • {x.length > 140 ? x.slice(0, 137) + "..." : x}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </QuadroCompacto>
        ),
      });
    });

    // ---------------------------------------------------------------- plano de intervenção detalhado, por fase
    {
      const aprovados = (plano?.itens ?? []).filter(itemAprovado);
      const servAprov = (plano?.servicos ?? []).filter(itemAprovado);
      const ROTULO_TAG: Record<string, string> = { seguranca: "Segurança", intervencao: "Intervenção", orientacao: "Orientação", reavaliacao: "Reavaliação", encaminhamento: "Encaminhamento", servico: "Serviço" };
      const ORDEM_TAG = ["seguranca", "intervencao", "servico", "orientacao", "reavaliacao"];
      const resumo = (txt: string) => {
        const frases = txt.replace(/\s*\(Entra em .*$/, "").split(/(?<=[.!?])\s/);
        const dois = frases.slice(0, 2).join(" ");
        return dois.length > 190 ? dois.slice(0, 187) + "..." : dois;
      };
      for (const h of fases) {
        const entradas = [
          ...aprovados.filter((i) => i.horizonte === h.chave && (i.categoria ?? "intervencao") !== "reavaliacao").map((i) => ({ tag: i.categoria ?? "intervencao", titulo: nomeFrenteDoItem(i, perfil), texto: resumo(i.descricao) })),
          ...servAprov.flatMap((s) => s.etapas.filter((e) => e.horizonte === h.chave && e.texto.trim() !== "").map((e) => ({ tag: "servico", titulo: `${NOME_SERVICO[s.servico].split(" (")[0]}${s.prioridade === "opcional" ? " (opcional)" : ""}`, texto: resumo(e.texto) }))),
        ].sort((a, b) => ORDEM_TAG.indexOf(a.tag) - ORDEM_TAG.indexOf(b.tag));
        if (entradas.length === 0) continue;
        const paginas: (typeof entradas)[] = [];
        for (let k = 0; k < entradas.length; k += 4) paginas.push(entradas.slice(k, k + 4));
        paginas.forEach((pg, k) => {
          lista.push({
            id: `fase-${h.chave}-${k + 1}`,
            nav: `Plano: ${h.curto}${paginas.length > 1 ? ` (${k + 1}/${paginas.length})` : ""}`,
            notas: ["Esta é a parte final: o plano de intervenção que você aprovou. Passe item por item e pergunte se o ritmo é possível para a rotina do paciente.", "Ajuste na hora o que for preciso na aba Plano: a apresentação acompanha os dados em tempo real."],
            conteudo: (
              <QuadroCompacto titulo={`Plano de intervenção: ${h.curto}${paginas.length > 1 ? ` (${k + 1}/${paginas.length})` : ""}`} subtitulo={h.texto}>
                <div className="space-y-3">
                  {pg.map((e, i) => (
                    <div key={i} className="rounded-3xl border-2 border-border bg-surface px-7 py-3 flex gap-6 items-start">
                      <span className="shrink-0 rounded-full bg-accent-soft text-accent-dark px-4 py-1 text-[18px] font-medium mt-1">{ROTULO_TAG[e.tag] ?? "Plano"}</span>
                      <div>
                        <p className="font-display text-[26px] text-ink leading-tight">{e.titulo}</p>
                        <p className="text-[19px] text-muted mt-0.5 leading-snug">{e.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </QuadroCompacto>
            ),
          });
        });
      }
    }

    // Ordem final: panorama -> resultados -> achados e intervenções -> motivos e medidas -> PLANO -> combinados.
    const RANK = (idSlide: string) => {
      if (idSlide === "capa") return 0;
      if (idSlide === "objetivo") return 1;
      if (idSlide === "hoje") return 2;
      if (idSlide === "fortes") return 3;
      if (idSlide.startsWith("resultado-")) return 4;
      if (idSlide.startsWith("achado-")) return 5;
      if (idSlide === "depois") return 6;
      if (idSlide === "vale") return 7;
      if (idSlide === "medir") return 8;
      if (idSlide === "plano") return 9;
      if (idSlide.startsWith("fase-")) return 10;
      if (idSlide === "servicos") return 11;
      if (idSlide === "encaminhamentos") return 12;
      return 13; // fim
    };
    return lista.map((s, i) => ({ s, i })).sort((x, y) => RANK(x.s.id) - RANK(y.s.id) || x.i - y.i).map((x) => x.s);
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
