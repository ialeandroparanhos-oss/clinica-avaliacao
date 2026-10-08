"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import type { Anamnese, PacienteRow } from "@/lib/anamnese/types";
import { escorePSS10, escoreTSK11, somaSemNulos, escoreCurto, rotuloNivel } from "@/lib/anamnese/alerts";
import { calcularPSQI } from "@/lib/anamnese/psqi";
import { calcularRiscoCardiovascular } from "@/lib/anamnese/riscoCardiovascular";
import { AlertBanner, Field, TextArea, TextInput } from "@/components/forms";
import { SerieChart } from "@/components/SerieChart";
import { perguntasParQ } from "@/lib/anamnese/questionnaires";
import { calcularPerfilIntegrado, type Classificacao, type DomainResult } from "@/lib/integracao/perfil";
import type { Plano } from "@/lib/integracao/plano";
import { AbaPlano } from "@/components/avaliador/AbaPlano";
import { INDICADORES, extrairSerie, type LinhaHistorico } from "@/lib/integracao/historico";
import { detectarDiscrepancias } from "@/lib/integracao/discrepancias";
import { EVENTO_RASCUNHO, SalvarBar, mesclarNoPlano, useAutoSalvar } from "@/components/avaliador/campos";
import { ParecerNoPlano } from "@/components/avaliador/PainelParecer";
import { AbaFisica } from "@/components/avaliador/AbaFisica";
import { AbaFuncional } from "@/components/avaliador/AbaFuncional";
import { AbaCardio } from "@/components/avaliador/AbaCardio";
import { AbaPostural } from "@/components/avaliador/AbaPostural";
import { PainelModulos } from "@/components/avaliador/PainelModulos";
import { statusModulo } from "@/lib/anamnese/modulos";
import { linhasDorPorRegiao } from "@/lib/anamnese/dorPorRegiao";
import { idadeEfetiva } from "@/lib/avaliacao/identificacao";
import { conectarObjetivo } from "@/lib/integracao/objetivo";
import { triarSarcopeniaDinapenia } from "@/lib/integracao/sarcopenia";

type Aba = "perfil" | "plano" | "reavaliacao" | "anamnese" | "fisica" | "postural" | "funcional" | "cardio";

export default function DetalhePaciente() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [paciente, setPaciente] = useState<PacienteRow | null>(null);
  const [aba, setAba] = useState<Aba>("perfil");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, [id]);

  // Rascunhos gravados automaticamente pelas abas: mantém a ficha em memória em dia,
  // para que ao voltar a uma aba ela abra com o que foi digitado (sem recarregar).
  useEffect(() => {
    function aoGravar(e: Event) {
      const { pacienteId, secao, dados } = (e as CustomEvent).detail ?? {};
      setPaciente((atual) => (atual && atual.id === pacienteId ? ({ ...atual, [secao]: dados } as PacienteRow) : atual));
    }
    window.addEventListener(EVENTO_RASCUNHO, aoGravar);
    return () => window.removeEventListener(EVENTO_RASCUNHO, aoGravar);
  }, []);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase.from("pacientes").select("*").eq("id", id).single();
    setPaciente(data as PacienteRow);
    setCarregando(false);
  }

  if (carregando) return <main className="max-w-4xl mx-auto px-6 py-10 text-muted text-sm">Carregando...</main>;
  if (!paciente) return <main className="max-w-4xl mx-auto px-6 py-10 text-danger text-sm">Paciente não encontrado.</main>;

  const anamnese = mesclarComPadrao(paciente.anamnese);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">{paciente.nome}</h1>
          <p className="text-muted text-sm mt-1">
            {new Date(paciente.data_nascimento).toLocaleDateString("pt-BR")} · {paciente.telefone || "sem telefone"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 pt-1">
          <Link
            href={`/avaliador/paciente/${paciente.id}/relatorio`}
            className="text-sm font-medium text-accent hover:underline whitespace-nowrap"
          >
            Ver relatório técnico →
          </Link>
          <Link
            href={`/avaliador/paciente/${paciente.id}/relatorio-paciente`}
            className="text-sm font-medium text-accent hover:underline whitespace-nowrap"
          >
            Ver versão para o paciente →
          </Link>
        </div>
      </div>

      {paciente.alertas?.length > 0 && (
        <div className="space-y-2 mb-6">
          {paciente.alertas
            .slice()
            .sort((a, b) => b.nivel - a.nivel)
            .map((a, i) => (
              <AlertBanner key={i} nivel={a.nivel}>
                <strong>
                  Nível {a.nivel} · {rotuloNivel[a.nivel]}
                </strong>{" "}
                — {a.descricao}{" "}
                <span className="opacity-70">({a.origem})</span>
              </AlertBanner>
            ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {(
          [
            ["perfil", "Perfil Integrado"],
            ["reavaliacao", "Reavaliação"],
            ["anamnese", "Anamnese"],
            ["fisica", "Física e Antropométrica"],
            ["postural", "Postural e Biomecânica"],
            ["funcional", "Avaliação Funcional"],
            ["cardio", "Cardiorrespiratória"],
            ["plano", "Plano de Intervenção"],
          ] as [Aba, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap ${
              aba === key ? "border-accent text-accent-dark" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {aba === "perfil" && <AbaPerfilIntegrado paciente={paciente} />}
      {aba === "plano" && <AbaPlano paciente={paciente} onSalvo={carregar} />}
      {aba === "reavaliacao" && <AbaReavaliacao paciente={paciente} onSalvo={carregar} />}
      {aba === "anamnese" && <AbaAnamnese anamnese={anamnese} status={paciente.anamnese_status} paciente={paciente} />}
      {aba === "fisica" && <AbaFisica pacienteId={paciente.id} dados={paciente.fisica} paciente={paciente} onSalvo={carregar} />}
      {aba === "postural" && <AbaPostural pacienteId={paciente.id} dados={paciente.postural} onSalvo={carregar} />}
      {aba === "funcional" && <AbaFuncional pacienteId={paciente.id} dados={paciente.funcional} paciente={paciente} onSalvo={carregar} />}
      {aba === "cardio" && <AbaCardio pacienteId={paciente.id} dados={paciente.cardio} paciente={paciente} onSalvo={carregar} />}
    </main>
  );
}

// ---------------------------------------------------------------------------
// Aba Perfil Integrado (Agente 6) - cruza anamnese + física + postural +
// funcional em potencialidades/limitações/riscos/prioridades
// ---------------------------------------------------------------------------
const ESTILO_CLASSIFICACAO: Record<Classificacao, { rotulo: string; classe: string }> = {
  adequado: { rotulo: "Adequado", classe: "bg-accent-soft text-accent-dark border-accent/30" },
  atencao: { rotulo: "Atenção", classe: "bg-warn-soft text-warn border-warn/30" },
  prioridade: { rotulo: "Prioridade de intervenção", classe: "bg-danger-soft text-danger border-danger/30" },
  investigar: { rotulo: "Necessita investigação", classe: "bg-info-soft text-info border-info/30" },
};

function CartaoDominio({ dominio }: { dominio: DomainResult }) {
  const estilo = ESTILO_CLASSIFICACAO[dominio.classificacao];
  return (
    <div className={`rounded-xl border p-4 ${estilo.classe}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{dominio.titulo}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">{estilo.rotulo}</span>
      </div>
      <p className="text-xs opacity-90 leading-relaxed">{dominio.justificativa}</p>
    </div>
  );
}

function AbaPerfilIntegrado({ paciente }: { paciente: PacienteRow }) {
  const perfil = useMemo(() => calcularPerfilIntegrado(paciente), [paciente]);
  const discrepancias = useMemo(() => detectarDiscrepancias(paciente), [paciente]);
  const sarcopenia = useMemo(() => triarSarcopeniaDinapenia(paciente), [paciente]);
  const motivo = mesclarComPadrao(paciente.anamnese).motivo;
  const confiancaLabel = { alta: "Alta", media: "Média", baixa: "Baixa" }[perfil.confianca];
  const confiancaClasse = {
    alta: "bg-accent-soft text-accent-dark",
    media: "bg-warn-soft text-warn",
    baixa: "bg-danger-soft text-danger",
  }[perfil.confianca];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-lg text-ink">Painel Integrado de Saúde</h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${confiancaClasse}`}>
            Confiança do perfil: {confiancaLabel}
          </span>
        </div>
        <p className="text-xs text-muted mb-4">
          Calculado automaticamente a partir dos dados coletados. Critérios explícitos por domínio — nunca um
          diagnóstico. Sempre cruzar com o julgamento clínico do profissional.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {perfil.dominios.map((d) => (
            <CartaoDominio key={d.chave} dominio={d} />
          ))}
        </div>
      </div>

      <ParecerNoPlano paciente={paciente} agente="perfil" />

      <div
        className={`rounded-2xl border p-5 ${
          sarcopenia.classificacao === "sarcopenia_provavel"
            ? "border-danger/30 bg-danger-soft"
            : sarcopenia.classificacao === "dinapenia_provavel"
              ? "border-warn/30 bg-warn-soft"
              : sarcopenia.classificacao === "sem_sinais"
                ? "border-accent/30 bg-accent-soft"
                : "border-border bg-surface"
        }`}
      >
        <h4 className="font-display text-base text-ink mb-1">
          Sarcopenia / dinapenia (triagem aproximada) —{" "}
          {
            {
              sarcopenia_provavel: "Sarcopenia provável",
              dinapenia_provavel: "Dinapenia provável",
              sem_sinais: "Sem sinais nesta triagem",
              dados_insuficientes: "Dados insuficientes",
            }[sarcopenia.classificacao]
          }
        </h4>
        <p className="text-sm text-muted mb-1">{sarcopenia.justificativa}</p>
        <p className="text-xs text-muted">
          Usa força (dinamometria/chair stand, critério EWGSOP2) e massa magra total comparada à meta calculada
          para este paciente - não é o padrão-ouro (massa muscular apendicular por DXA). Nunca é diagnóstico;
          confirmação requer avaliação validada.
        </p>
      </div>

      {discrepancias.length > 0 && (
        <div className="rounded-2xl border border-info/30 bg-info-soft p-5">
          <h4 className="font-display text-base text-info mb-2">Discrepâncias a investigar</h4>
          <p className="text-xs text-info/80 mb-3">
            Pontos onde o autorrelato do paciente e os achados objetivos (fotos, observações, testes) parecem não
            bater — não é acusação de que o paciente "errou", é um convite a conversar sobre isso na devolutiva.
          </p>
          <ul className="space-y-2 text-sm text-info">
            {discrepancias.map((disc, i) => (
              <li key={i}>
                <strong>{disc.titulo}</strong>
                <p className="text-info/80">{disc.descricao}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {perfil.riscos.length > 0 && (
        <div className="rounded-2xl border border-danger/30 bg-danger-soft p-5">
          <h4 className="font-display text-base text-danger mb-2">Riscos / Prioridade de intervenção</h4>
          <ul className="space-y-1 text-sm text-danger">
            {perfil.riscos.map((d) => (
              <li key={d.chave}>
                <strong>{d.titulo}:</strong> {d.justificativa}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-accent/30 bg-accent-soft p-5">
          <h4 className="font-display text-base text-accent-dark mb-2">Potencialidades</h4>
          {perfil.potencialidades.length === 0 ? (
            <p className="text-sm text-accent-dark/70">Nenhum domínio classificado como adequado ainda.</p>
          ) : (
            <ul className="space-y-1 text-sm text-accent-dark">
              {perfil.potencialidades.map((d) => (
                <li key={d.chave}>
                  <strong>{d.titulo}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-warn/30 bg-warn-soft p-5">
          <h4 className="font-display text-base text-warn mb-2">Limitações</h4>
          {perfil.limitacoes.length === 0 ? (
            <p className="text-sm text-warn/70">Nenhum domínio classificado como atenção no momento.</p>
          ) : (
            <ul className="space-y-1 text-sm text-warn">
              {perfil.limitacoes.map((d) => (
                <li key={d.chave}>
                  <strong>{d.titulo}:</strong> {d.justificativa}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <h4 className="font-display text-base text-ink mb-2">Prioridades sugeridas (ordem)</h4>
        {perfil.prioridades.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma prioridade identificada com os dados atuais.</p>
        ) : (
          <ol className="space-y-2 text-sm text-ink list-decimal list-inside">
            {perfil.prioridades.map((d) => {
              const conexao = conectarObjetivo(d, motivo);
              return (
                <li key={d.chave}>
                  <strong>{d.titulo}</strong> — {d.justificativa}
                  {conexao && (
                    <p className="text-xs text-accent-dark mt-0.5 ml-5 italic">
                      Conecta com o que o paciente disse em "Motivo da procura": "{conexao}"
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        <p className="text-xs text-muted mt-3">
          Quando há uma palavra-chave em comum com o que o paciente escreveu no capítulo "Motivo da procura", a
          conexão aparece acima — é um apoio heurístico para começar a conversa, não uma ligação garantida. O
          profissional sempre confirma e refina essa conexão ao montar o plano.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba Reavaliação (Etapa 11) - ANTES -> ATUAL -> META por indicador
// ---------------------------------------------------------------------------
function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function AbaReavaliacao({ paciente, onSalvo }: { paciente: PacienteRow; onSalvo: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [historico, setHistorico] = useState<LinhaHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [metas, setMetas] = useState<Record<string, string>>((paciente.plano as Plano | undefined)?.metas ?? {});
  const [salvandoMetas, setSalvandoMetas] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    supabase
      .from("avaliacoes_historico")
      .select("*")
      .eq("paciente_id", paciente.id)
      .order("criado_em", { ascending: true })
      .then(({ data }) => {
        setHistorico((data as LinhaHistorico[]) ?? []);
        setCarregando(false);
      });
  }, [paciente.id]);

  async function salvarMetas() {
    setSalvandoMetas(true);
    const planoAtual = (paciente.plano as Plano | undefined) ?? { itens: [], encaminhamentos: [] };
    await supabase
      .from("pacientes")
      .update({ plano: { ...planoAtual, metas } })
      .eq("id", paciente.id);
    setSalvandoMetas(false);
    setOk(true);
    setTimeout(() => setOk(false), 2500);
    onSalvo();
  }

  const estadoAuto = useAutoSalvar(metas, (v) => mesclarNoPlano(supabase, paciente.id, (plano) => ({ ...plano, metas: v })));

  if (carregando) return <p className="text-sm text-muted">Carregando histórico...</p>;

  const indicadoresComDados = INDICADORES.map((ind) => ({ ind, serie: extrairSerie(historico, ind) })).filter(
    (x) => x.serie.length > 0
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-lg text-ink mb-1">Reavaliação — evolução ao longo do tempo</h3>
        <p className="text-xs text-muted">
          Cada vez que a aba Física ou Funcional é salva, um novo ponto entra no histórico automaticamente — nada
          é sobrescrito. Defina uma meta por indicador para acompanhar ANTES → ATUAL → META.
        </p>
      </div>

      {indicadoresComDados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          Ainda não há histórico suficiente. Assim que a Física ou a Avaliação Funcional forem salvas mais de uma
          vez, a evolução aparece aqui.
        </div>
      ) : (
        indicadoresComDados.map(({ ind, serie }) => {
          const antes = serie[0];
          const atual = serie[serie.length - 1];
          const metaTexto = metas[ind.chave];
          const metaNum = metaTexto !== undefined && metaTexto !== "" ? Number(metaTexto) : undefined;
          const metaValida = metaNum !== undefined && Number.isFinite(metaNum) ? metaNum : undefined;
          return (
            <div key={ind.chave} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display text-base text-ink">
                  {ind.titulo} {ind.unidade && <span className="text-muted text-sm">({ind.unidade})</span>}
                </h4>
                <span className="text-xs text-muted">{serie.length} registro(s)</span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-bg p-3 text-center">
                  <p className="text-xs text-muted mb-1">Antes</p>
                  <p className="font-mono text-lg text-ink tabular-nums">{antes.valor.toFixed(1)}</p>
                  <p className="text-xs text-muted">{formatarData(antes.data)}</p>
                </div>
                <div className="rounded-lg bg-accent-soft p-3 text-center">
                  <p className="text-xs text-accent-dark mb-1">Atual</p>
                  <p className="font-mono text-lg text-accent-dark tabular-nums">{atual.valor.toFixed(1)}</p>
                  <p className="text-xs text-accent-dark/70">{formatarData(atual.data)}</p>
                </div>
                <div className="rounded-lg border-2 border-dashed border-border p-3 text-center">
                  <p className="text-xs text-muted mb-1">Meta</p>
                  <input
                    value={metas[ind.chave] ?? ""}
                    onChange={(e) => setMetas((prev) => ({ ...prev, [ind.chave]: e.target.value }))}
                    placeholder="—"
                    className="w-full text-center font-mono text-lg bg-transparent outline-none text-ink"
                  />
                </div>
              </div>

              {serie.length > 1 && (
                <div className="mb-4">
                  <SerieChart serie={serie} meta={metaValida} />
                </div>
              )}

              {serie.length > 1 && (
                <details className="text-xs text-muted">
                  <summary className="cursor-pointer">Ver todos os {serie.length} registros</summary>
                  <ul className="mt-2 space-y-1">
                    {serie.map((p, i) => (
                      <li key={i}>
                        {formatarData(p.data)}: <strong className="text-ink">{p.valor.toFixed(1)}</strong>{" "}
                        {p.avaliador && <span>— {p.avaliador}</span>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          );
        })
      )}

      <SalvarBar salvando={salvandoMetas} ok={ok} onSalvar={salvarMetas} auto={estadoAuto} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba Anamnese - somente leitura, organizada por capítulo
// ---------------------------------------------------------------------------
function Linha({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-border last:border-0 text-sm">
      <dt className="text-muted col-span-1">{label}</dt>
      <dd className="col-span-2 text-ink">{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
    </div>
  );
}

function Capitulo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <h3 className="font-display text-lg text-ink mb-2">{titulo}</h3>
      <dl>{children}</dl>
    </div>
  );
}

function AbaAnamnese({ anamnese, status, paciente }: { anamnese: Anamnese; status: string; paciente: PacienteRow }) {
  const pss10 = escorePSS10(anamnese.saude_mental.pss10);
  const gad7 = somaSemNulos(anamnese.saude_mental.gad7);
  const phq9 = somaSemNulos(anamnese.saude_mental.phq9);
  const gad2 = escoreCurto(anamnese.saude_mental.gad7);
  const phq2 = escoreCurto(anamnese.saude_mental.phq9);
  const parqPositivos = perguntasParQ.filter((p) => (anamnese.prontidao.parq as any)[p.chave] === true);
  const psqi = calcularPSQI(anamnese);
  const tsk11 = escoreTSK11(anamnese.dor.tsk11);
  const pseq = somaSemNulos(anamnese.dor.pseq);
  const riscoCV = calcularRiscoCardiovascular(paciente);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted uppercase tracking-wide">Status: {status}</p>

      <PainelModulos anamnese={anamnese} />

      <ParecerNoPlano paciente={paciente} agente="anamnese" />

      <Capitulo titulo="Contexto">
        <Linha label="Idade (da data de nascimento)" value={idadeEfetiva(paciente) !== null ? `${idadeEfetiva(paciente)} anos` : null} />
        <Linha label="Profissão" value={anamnese.contexto.profissao} />
        <Linha label="Rotina" value={anamnese.contexto.rotina} />
        <Linha label="Jornada (h)" value={anamnese.contexto.jornada_horas} />
        <Linha label="Exige esforço físico" value={anamnese.contexto.exige_esforco_fisico === null ? null : anamnese.contexto.exige_esforco_fisico ? "Sim" : "Não"} />
        <Linha label="Demanda física no trabalho" value={anamnese.contexto.demanda_fisica_trabalho} />
        <Linha label="Atividades diárias" value={anamnese.contexto.atividades_diarias} />
      </Capitulo>

      <Capitulo titulo="Motivo da procura">
        <Linha label="Motivo" value={anamnese.motivo.motivo_procura} />
        <Linha label="Queixa principal" value={anamnese.motivo.queixa_principal} />
        <Linha label="Dificuldades no dia a dia" value={anamnese.motivo.dificuldades} />
        <Linha label="Atividades perdidas" value={anamnese.motivo.atividades_perdidas} />
        <Linha label="Objetivos / o que gostaria de melhorar" value={anamnese.motivo.objetivos} />
        <Linha label="Expectativas" value={anamnese.motivo.expectativas} />
      </Capitulo>

      <Capitulo titulo="Histórico de saúde">
        <Linha label="Doenças" value={anamnese.historico_saude.doencas} />
        <Linha label="Cirurgias" value={anamnese.historico_saude.cirurgias} />
        <Linha label="Hospitalizações" value={anamnese.historico_saude.hospitalizacoes} />
        <Linha label="Lesões/fraturas" value={anamnese.historico_saude.lesoes_fraturas} />
        <Linha label="Queda nos últimos 12 meses" value={anamnese.historico_saude.quedas_12m === null ? null : anamnese.historico_saude.quedas_12m ? "Sim" : "Não"} />
        <Linha label="Detalhe da queda" value={anamnese.historico_saude.quedas_detalhe} />
        <Linha label="Tratamentos anteriores" value={anamnese.historico_saude.tratamentos_anteriores} />
        <Linha label="Acompanhamento médico" value={anamnese.historico_saude.acompanhamento_medico} />
        <Linha label="Outras condições" value={anamnese.historico_saude.outras_condicoes} />
      </Capitulo>

      {riscoCV && (
        <div
          className={`rounded-2xl border p-5 ${
            riscoCV.classificacao === "alto"
              ? "border-danger/30 bg-danger-soft"
              : riscoCV.classificacao === "moderado"
                ? "border-warn/30 bg-warn-soft"
                : "border-accent/30 bg-accent-soft"
          }`}
        >
          <h3 className="font-display text-lg text-ink mb-1">
            Risco cardiovascular (triagem rápida) —{" "}
            {{ baixo: "Baixo", moderado: "Moderado", alto: "Alto" }[riscoCV.classificacao]}
          </h3>
          <p className="text-sm text-muted mb-2">{riscoCV.justificativa}</p>
          {riscoCV.fatores.length > 0 && (
            <p className="text-sm text-ink">
              <strong>Fatores presentes:</strong> {riscoCV.fatores.map((f) => f.rotulo).join(", ")}
            </p>
          )}
          {riscoCV.fatorProtetor && <p className="text-sm text-ink">HDL alto conhecido - descontado 1 fator de risco.</p>}
          <p className="text-xs text-muted mt-2">
            Baseado na estratificação de fatores de risco do ACSM - triagem para apoiar a decisão de liberação
            médica antes de testes de esforço, nunca um diagnóstico.
          </p>
        </div>
      )}

      {anamnese.medicamentos.usa_medicamentos && (
        <Capitulo titulo="Medicamentos">
          {anamnese.medicamentos.lista.map((m, i) => (
            <div key={i} className="py-2 border-b border-border last:border-0 text-sm">
              <strong>{m.nome}</strong> — {m.dose}, {m.frequencia} · {m.motivo} · há {m.tempo_uso}
            </div>
          ))}
        </Capitulo>
      )}

      <Capitulo titulo="Histórico familiar">
        <Linha
          label="Condições"
          value={Object.entries(anamnese.historico_familiar)
            .filter(([k, v]) => v === true)
            .map(([k]) => k)}
        />
        <Linha label="Detalhe" value={anamnese.historico_familiar.detalhe} />
      </Capitulo>

      <Capitulo titulo="Atividade física">
        <Linha label="Pratica atualmente" value={anamnese.atividade_fisica.pratica_atual === null ? null : anamnese.atividade_fisica.pratica_atual ? "Sim" : "Não"} />
        <Linha label="Modalidades" value={anamnese.atividade_fisica.modalidades} />
        <Linha label="Tempo de treinamento" value={anamnese.atividade_fisica.tempo_treinamento} />
        <Linha label="Interrupções" value={anamnese.atividade_fisica.interrupcoes} />
        <Linha label="IPAQ - dias/min vigorosa" value={`${anamnese.atividade_fisica.ipaq.dias_vigorosa || "–"} / ${anamnese.atividade_fisica.ipaq.min_vigorosa_dia || "–"}`} />
        <Linha label="IPAQ - dias/min moderada" value={`${anamnese.atividade_fisica.ipaq.dias_moderada || "–"} / ${anamnese.atividade_fisica.ipaq.min_moderada_dia || "–"}`} />
        <Linha label="IPAQ - dias/min caminhada" value={`${anamnese.atividade_fisica.ipaq.dias_caminhada || "–"} / ${anamnese.atividade_fisica.ipaq.min_caminhada_dia || "–"}`} />
        <Linha label="Horas sentado/dia (IPAQ)" value={anamnese.atividade_fisica.ipaq.horas_sentado_dia} />
      </Capitulo>

      <Capitulo titulo="Sono">
        <Linha label="Horas de sono por noite" value={anamnese.sono.horas_sono} />
        <Linha label="Qualidade percebida (1-5)" value={anamnese.sono.qualidade_percebida} />
        <Linha label="Dificuldade para pegar no sono" value={anamnese.sono.dificuldade_iniciar === null ? null : anamnese.sono.dificuldade_iniciar ? "Sim" : "Não"} />
        <Linha label="Acorda durante a noite" value={anamnese.sono.despertares_noturnos === null ? null : anamnese.sono.despertares_noturnos ? "Sim" : "Não"} />
        <Linha label="PSQI - escore global (0-21)" value={psqi ? `${psqi.global}${psqi.global > 5 ? " (acima do corte de má qualidade)" : ""}` : null} />
        <Linha label="Componente 1 - qualidade subjetiva (0-3)" value={psqi?.componentes.qualidadeSubjetiva} />
        <Linha label="Componente 2 - latência (0-3)" value={psqi?.componentes.latencia} />
        <Linha label="Componente 3 - duração (0-3)" value={psqi?.componentes.duracao} />
        <Linha label="Componente 4 - eficiência habitual (0-3)" value={psqi?.componentes.eficiencia} />
        <Linha label="Componente 5 - distúrbios do sono (0-3)" value={psqi?.componentes.disturbios} />
        <Linha label="Componente 6 - uso de medicação (0-3)" value={psqi?.componentes.medicacao} />
        <Linha label="Componente 7 - disfunção diurna (0-3)" value={psqi?.componentes.disfuncaoDiurna} />
        <Linha label="Outro motivo relatado" value={anamnese.psqi.outro_motivo_texto} />
        {!psqi && (
          <Linha
            label="PSQI"
            value={statusModulo(anamnese, "sono") === "em_andamento" ? "Incompleto - respostas insuficientes para calcular o escore." : "Módulo de sono em detalhe não respondido."}
          />
        )}
      </Capitulo>

      <Capitulo titulo="Estilo de vida">
        <Linha label="Alimentação (1-5)" value={anamnese.estilo_vida.alimentacao_avaliacao} />
        <Linha label="Alimentação (detalhe)" value={anamnese.estilo_vida.alimentacao_geral} />
        <Linha label="Hidratação (L/dia)" value={anamnese.estilo_vida.hidratacao_litros_dia} />
        <Linha label="Álcool" value={anamnese.estilo_vida.alcool_frequencia} />
        <Linha label="Tabagismo" value={anamnese.estilo_vida.tabagismo} />
        <Linha label="Lazer" value={anamnese.estilo_vida.lazer_opcoes} />
        <Linha label="Lazer (outro)" value={anamnese.estilo_vida.lazer} />
        <Linha label="Estresse percebido (0-10)" value={anamnese.estilo_vida.estresse_percebido} />
        <Linha label="Barreiras a exercício" value={anamnese.estilo_vida.barreiras_exercicio} />
        <Linha label="Disponibilidade de tempo" value={anamnese.estilo_vida.disponibilidade_tempo} />
        <Linha label="Conta com apoio" value={anamnese.estilo_vida.conta_com_apoio === null ? null : anamnese.estilo_vida.conta_com_apoio ? "Sim" : "Não"} />
        <Linha label="Rede de apoio (detalhe)" value={anamnese.estilo_vida.rede_apoio} />
      </Capitulo>

      {anamnese.dor.tem_dor && (
        <Capitulo titulo="Dor">
          <Linha label="Regiões (intensidade · há quanto tempo)" value={linhasDorPorRegiao(anamnese.dor)} />
          <Linha label="Intensidade máxima (NRS 0-10)" value={anamnese.dor.intensidade_nrs} />
          <Linha label="Frequência" value={anamnese.dor.frequencia} />
          <Linha label="Características" value={anamnese.dor.caracteristicas} />
          <Linha label="Início" value={anamnese.dor.inicio} />
          <Linha label="Agravantes" value={anamnese.dor.agravantes} />
          <Linha label="Atenuantes" value={anamnese.dor.atenuantes} />
          <Linha label="Dor em repouso" value={anamnese.dor.dor_repouso === null ? null : anamnese.dor.dor_repouso ? "Sim" : "Não"} />
          <Linha label="Dor ao movimento" value={anamnese.dor.dor_movimento === null ? null : anamnese.dor.dor_movimento ? "Sim" : "Não"} />
          <Linha label="Dor noturna" value={anamnese.dor.dor_noturna === null ? null : anamnese.dor.dor_noturna ? "Sim" : "Não"} />
          <Linha label="Tratamentos anteriores" value={anamnese.dor.tratamentos_anteriores} />
          <Linha label="Bandeiras vermelhas" value={anamnese.dor.bandeiras_vermelhas} />
          <Linha label="TSK-11 - cinesiofobia (11-44)" value={tsk11 ? `${tsk11}${tsk11 >= 26 ? " (faixa comumente citada como alta cinesiofobia)" : ""}` : null} />
          <Linha label="PSEQ - autoeficácia para dor (0-60)" value={pseq ? `${pseq}${pseq < 40 ? " (faixa comumente citada como baixa autoeficácia)" : ""}` : null} />
        </Capitulo>
      )}

      <Capitulo titulo="Saúde mental e bem-estar (triagem)">
        <Linha
          label="Pergunta inicial: estresse/ansiedade/humor atrapalham o dia a dia?"
          value={
            anamnese.saude_mental.sinalizacao
              ? { nao: "Não", um_pouco: "Um pouco", sim: "Sim, bastante", prefiro_nao_responder: "Prefere não responder" }[anamnese.saude_mental.sinalizacao]
              : null
          }
        />
        {statusModulo(anamnese, "bem-estar") === "nao_aplicado" && <Linha label="Questionário de bem-estar" value="Não aplicado." />}
        {statusModulo(anamnese, "bem-estar") === "sinalizado" && <Linha label="Questionário de bem-estar" value="Recomendado (o paciente sinalizou), ainda não respondido." />}
        <Linha label="Percepção geral de saúde (1-5)" value={anamnese.saude_mental.percepcao_saude} />
        <Linha label="PSS-10 (estresse, 0-40)" value={pss10} />
        <Linha label="GAD-7 (ansiedade, 0-21)" value={gad7} />
        <Linha label="GAD-2 (triagem curta, 0-6 - GAD-7 completo não foi necessário)" value={gad7 === null ? gad2 : null} />
        <Linha label="PHQ-9 (humor, 0-27)" value={phq9} />
        <Linha label="PHQ-2 (triagem curta, 0-6 - PHQ-9 completo não foi necessário)" value={phq9 === null ? phq2 : null} />
        <Linha
          label="Item de ideação (PHQ-9 #9)"
          value={
            anamnese.saude_mental.phq9[8] !== null && anamnese.saude_mental.phq9[8] > 0
              ? `Pontuação ${anamnese.saude_mental.phq9[8]} — requer atenção imediata`
              : null
          }
        />
      </Capitulo>

      <Capitulo titulo="Prontidão para exercício (PAR-Q+)">
        <Linha label="Itens positivos" value={parqPositivos.map((p) => p.texto)} />
        <Linha label="Outro motivo (detalhe)" value={anamnese.prontidao.other_reason_detalhe} />
        {parqPositivos.length === 0 && <p className="text-sm text-muted py-2">Nenhuma resposta positiva.</p>}
      </Capitulo>
    </div>
  );
}

// ---------------------------------------------------------------------------
