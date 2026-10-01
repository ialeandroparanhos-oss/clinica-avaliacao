"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import type { Anamnese, PacienteRow } from "@/lib/anamnese/types";
import { escorePSS10, escoreTSK11, somaSemNulos, rotuloNivel } from "@/lib/anamnese/alerts";
import { calcularPSQI } from "@/lib/anamnese/psqi";
import { calcularRiscoCardiovascular } from "@/lib/anamnese/riscoCardiovascular";
import { AlertBanner, Field, TextArea, TextInput } from "@/components/forms";
import { SerieChart } from "@/components/SerieChart";
import { perguntasParQ } from "@/lib/anamnese/questionnaires";
import { calcularPerfilIntegrado, type Classificacao, type DomainResult } from "@/lib/integracao/perfil";
import { HORIZONTES, sugerirPlano, type Encaminhamento, type Horizonte, type ItemPlano, type Plano } from "@/lib/integracao/plano";
import { INDICADORES, extrairSerie, type LinhaHistorico } from "@/lib/integracao/historico";
import { calcularTagsPerfil, gruposRecomendados, ROTULOS_GRUPO, type GrupoTesteFuncional } from "@/lib/integracao/tagsPerfil";
import { detectarDiscrepancias } from "@/lib/integracao/discrepancias";
import {
  sexoNormalizado,
  sugerirProtocoloDobras,
  calcularPercentualGorduraDobras,
  percentualGorduraIdealSugerido,
  faixaGorduraSugerida,
  SITIOS_JP3,
  SITIOS_JP7,
  TODOS_SITIOS_DOBRA,
  type ProtocoloDobras,
} from "@/lib/avaliacao/composicaoCorporal";
import { conectarObjetivo } from "@/lib/integracao/objetivo";
import { triarSarcopeniaDinapenia } from "@/lib/integracao/sarcopenia";

type Aba = "perfil" | "plano" | "reavaliacao" | "anamnese" | "fisica" | "postural" | "funcional";

export default function DetalhePaciente() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [paciente, setPaciente] = useState<PacienteRow | null>(null);
  const [aba, setAba] = useState<Aba>("perfil");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, [id]);

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

      <div className="flex gap-1 border-b border-border mb-6">
        {(
          [
            ["perfil", "Perfil Integrado"],
            ["plano", "Plano de Intervenção"],
            ["reavaliacao", "Reavaliação"],
            ["anamnese", "Anamnese"],
            ["fisica", "Física e Antropométrica"],
            ["postural", "Postural e Biomecânica"],
            ["funcional", "Avaliação Funcional"],
          ] as [Aba, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setAba(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
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
// Aba Plano de Intervenção (Agente 7) - horizontes 30/90/180/365 dias
// ---------------------------------------------------------------------------
function gerarIdLocal(): string {
  return Math.random().toString(36).slice(2, 10);
}

function AbaPlano({ paciente, onSalvo }: { paciente: PacienteRow; onSalvo: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const planoSalvo = paciente.plano as Plano | undefined;
  const [itens, setItens] = useState<ItemPlano[]>(planoSalvo?.itens ?? []);
  const [encaminhamentos, setEncaminhamentos] = useState<Encaminhamento[]>(planoSalvo?.encaminhamentos ?? []);
  const [novoItem, setNovoItem] = useState("");
  const [novoHorizonte, setNovoHorizonte] = useState<Horizonte>("30");
  const [novaEspecialidade, setNovaEspecialidade] = useState("");
  const [novoMotivo, setNovoMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);

  function sugerir() {
    const perfil = calcularPerfilIntegrado(paciente);
    const sugestao = sugerirPlano(perfil);
    setItens((prev) => {
      const existentes = new Set(prev.map((i) => i.descricao));
      return [...prev, ...sugestao.itens.filter((i) => !existentes.has(i.descricao))];
    });
    setEncaminhamentos((prev) => {
      const existentes = new Set(prev.map((e) => e.especialidade + e.motivo));
      return [...prev, ...sugestao.encaminhamentos.filter((e) => !existentes.has(e.especialidade + e.motivo))];
    });
  }

  function adicionarItem() {
    if (!novoItem.trim()) return;
    setItens((prev) => [...prev, { id: gerarIdLocal(), horizonte: novoHorizonte, descricao: novoItem.trim(), origem: "Adicionado manualmente pelo avaliador" }]);
    setNovoItem("");
  }

  function adicionarEncaminhamento() {
    if (!novaEspecialidade.trim()) return;
    setEncaminhamentos((prev) => [...prev, { id: gerarIdLocal(), especialidade: novaEspecialidade.trim(), motivo: novoMotivo.trim() }]);
    setNovaEspecialidade("");
    setNovoMotivo("");
  }

  async function salvar() {
    setSalvando(true);
    const { data: userData } = await supabase.auth.getUser();
    const payload: Plano = {
      itens,
      encaminhamentos,
      avaliador: userData.user?.email ?? null,
      atualizado_em: new Date().toISOString(),
    };
    await supabase.from("pacientes").update({ plano: payload, atualizado_em: new Date().toISOString() }).eq("id", paciente.id);
    setSalvando(false);
    setOk(true);
    setTimeout(() => setOk(false), 2500);
    onSalvo();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-lg text-ink">Plano de Intervenção</h3>
          <button
            type="button"
            onClick={sugerir}
            className="text-sm font-medium text-accent hover:underline"
          >
            Sugerir a partir do Perfil Integrado
          </button>
        </div>
        <p className="text-xs text-muted">
          Riscos entram sugeridos em 30 dias; limitações em 90 dias (Seção 3.1 do Agente 7) — ajuste os horizontes
          conforme seu julgamento clínico. Todo item deve ter origem rastreável.
        </p>
      </div>

      {HORIZONTES.map((h) => {
        const itensDoHorizonte = itens.filter((i) => i.horizonte === h.chave);
        return (
          <div key={h.chave} className="rounded-2xl border border-border bg-surface p-5">
            <h4 className="font-display text-base text-ink mb-3">{h.titulo}</h4>
            {itensDoHorizonte.length === 0 ? (
              <p className="text-sm text-muted">Nenhum item neste horizonte ainda.</p>
            ) : (
              <ul className="space-y-2">
                {itensDoHorizonte.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm border-b border-border pb-2 last:border-0">
                    <div className="flex-1">
                      <p className="text-ink">{item.descricao}</p>
                      <p className="text-xs text-muted">Origem: {item.origem}</p>
                    </div>
                    <select
                      value={item.horizonte}
                      onChange={(e) =>
                        setItens((prev) => prev.map((i) => (i.id === item.id ? { ...i, horizonte: e.target.value as Horizonte } : i)))
                      }
                      className="text-xs rounded-lg border border-border bg-surface px-2 py-1"
                    >
                      {HORIZONTES.map((opt) => (
                        <option key={opt.chave} value={opt.chave}>
                          {opt.chave} dias
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setItens((prev) => prev.filter((i) => i.id !== item.id))}
                      className="text-xs text-muted hover:text-danger"
                    >
                      remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h4 className="font-display text-base text-ink">Adicionar item manualmente</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <TextInput
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            placeholder="Descrição do item do plano"
            className="flex-1"
          />
          <select
            value={novoHorizonte}
            onChange={(e) => setNovoHorizonte(e.target.value as Horizonte)}
            className="text-sm rounded-lg border border-border bg-surface px-3 py-2"
          >
            {HORIZONTES.map((opt) => (
              <option key={opt.chave} value={opt.chave}>
                {opt.chave} dias
              </option>
            ))}
          </select>
          <button type="button" onClick={adicionarItem} className="text-sm font-medium text-accent hover:underline whitespace-nowrap">
            + Adicionar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h4 className="font-display text-base text-ink">Encaminhamentos sugeridos</h4>
        {encaminhamentos.length === 0 ? (
          <p className="text-sm text-muted">Nenhum encaminhamento registrado.</p>
        ) : (
          <ul className="space-y-2">
            {encaminhamentos.map((enc) => (
              <li key={enc.id} className="flex items-start gap-2 text-sm border-b border-border pb-2 last:border-0">
                <div className="flex-1">
                  <p className="text-ink font-medium">{enc.especialidade}</p>
                  <p className="text-xs text-muted">{enc.motivo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEncaminhamentos((prev) => prev.filter((e) => e.id !== enc.id))}
                  className="text-xs text-muted hover:text-danger"
                >
                  remover
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
          <TextInput
            value={novaEspecialidade}
            onChange={(e) => setNovaEspecialidade(e.target.value)}
            placeholder="Especialidade (ex.: Nutrição)"
            className="flex-1"
          />
          <TextInput
            value={novoMotivo}
            onChange={(e) => setNovoMotivo(e.target.value)}
            placeholder="Motivo"
            className="flex-1"
          />
          <button type="button" onClick={adicionarEncaminhamento} className="text-sm font-medium text-accent hover:underline whitespace-nowrap">
            + Adicionar
          </button>
        </div>
      </div>

      <SalvarBar salvando={salvando} ok={ok} onSalvar={salvar} />
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

      <SalvarBar salvando={salvandoMetas} ok={ok} onSalvar={salvarMetas} />
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
  const parqPositivos = perguntasParQ.filter((p) => (anamnese.prontidao.parq as any)[p.chave] === true);
  const psqi = calcularPSQI(anamnese);
  const tsk11 = escoreTSK11(anamnese.dor.tsk11);
  const pseq = somaSemNulos(anamnese.dor.pseq);
  const riscoCV = calcularRiscoCardiovascular(paciente);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted uppercase tracking-wide">Status: {status}</p>

      <Capitulo titulo="Contexto">
        <Linha label="Idade" value={anamnese.contexto.idade} />
        <Linha label="Profissão" value={anamnese.contexto.profissao} />
        <Linha label="Rotina" value={anamnese.contexto.rotina} />
        <Linha label="Jornada (h)" value={anamnese.contexto.jornada_horas} />
        <Linha label="Exige esforço físico" value={anamnese.contexto.exige_esforco_fisico === null ? null : anamnese.contexto.exige_esforco_fisico ? "Sim" : "Não"} />
        <Linha label="Demanda física no trabalho" value={anamnese.contexto.demanda_fisica_trabalho} />
        <Linha label="Horas sentado/dia" value={anamnese.contexto.tempo_sentado_horas} />
        <Linha label="Atividades diárias" value={anamnese.contexto.atividades_diarias} />
      </Capitulo>

      <Capitulo titulo="Motivo da procura">
        <Linha label="Motivo" value={anamnese.motivo.motivo_procura} />
        <Linha label="Queixa principal" value={anamnese.motivo.queixa_principal} />
        <Linha label="Deseja melhorar" value={anamnese.motivo.deseja_melhorar} />
        <Linha label="Atividades perdidas" value={anamnese.motivo.atividades_perdidas} />
        <Linha label="Objetivos" value={anamnese.motivo.objetivos} />
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

      <Capitulo titulo="Sono (PSQI)">
        <Linha label="PSQI - escore global (0-21)" value={psqi ? `${psqi.global}${psqi.global > 5 ? " (acima do corte de má qualidade)" : ""}` : null} />
        <Linha label="Componente 1 - qualidade subjetiva (0-3)" value={psqi?.componentes.qualidadeSubjetiva} />
        <Linha label="Componente 2 - latência (0-3)" value={psqi?.componentes.latencia} />
        <Linha label="Componente 3 - duração (0-3)" value={psqi?.componentes.duracao} />
        <Linha label="Componente 4 - eficiência habitual (0-3)" value={psqi?.componentes.eficiencia} />
        <Linha label="Componente 5 - distúrbios do sono (0-3)" value={psqi?.componentes.disturbios} />
        <Linha label="Componente 6 - uso de medicação (0-3)" value={psqi?.componentes.medicacao} />
        <Linha label="Componente 7 - disfunção diurna (0-3)" value={psqi?.componentes.disfuncaoDiurna} />
        <Linha label="Outro motivo relatado" value={anamnese.psqi.outro_motivo_texto} />
        {!psqi && <Linha label="Status" value="PSQI incompleto - respostas insuficientes para calcular o escore." />}
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
          <Linha label="Localizações" value={anamnese.dor.localizacoes} />
          <Linha label="Intensidade (NRS 0-10)" value={anamnese.dor.intensidade_nrs} />
          <Linha label="Duração" value={anamnese.dor.duracao} />
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
        <Linha label="Percepção geral de saúde (1-5)" value={anamnese.saude_mental.percepcao_saude} />
        <Linha label="PSS-10 (estresse, 0-40)" value={pss10} />
        <Linha label="GAD-7 (ansiedade, 0-21)" value={gad7} />
        <Linha label="PHQ-9 (humor, 0-27)" value={phq9} />
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
// Abas de avaliação do profissional (física, postural, funcional)
// ---------------------------------------------------------------------------
function useSalvarSecao(pacienteId: string, secao: "fisica" | "postural" | "funcional") {
  const supabase = useMemo(() => createClient(), []);
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);

  async function salvar(dados: Record<string, any>) {
    setSalvando(true);
    setOk(false);
    const { data: userData } = await supabase.auth.getUser();
    const avaliador = userData.user?.email ?? null;
    const payload = {
      ...dados,
      avaliador,
      atualizado_em: new Date().toISOString(),
    };
    await supabase
      .from("pacientes")
      .update({ [secao]: payload, atualizado_em: new Date().toISOString() })
      .eq("id", pacienteId);
    // Guarda também no histórico, para permitir comparar ANTES -> ATUAL ->
    // META nas reavaliações (Etapa 11) sem perder o registro anterior.
    await supabase.from("avaliacoes_historico").insert({
      paciente_id: pacienteId,
      tipo: secao,
      dados,
      avaliador,
    });
    setSalvando(false);
    setOk(true);
    setTimeout(() => setOk(false), 2500);
  }

  return { salvar, salvando, ok };
}

function NumField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <Field
      label={
        <>
          {label}
          {suffix && <span> ({suffix})</span>}
        </>
      }
    >
      <TextInput inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function SalvarBar({ salvando, ok, onSalvar }: { salvando: boolean; ok: boolean; onSalvar: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onSalvar}
        disabled={salvando}
        className="rounded-lg bg-accent text-white font-medium px-6 py-2.5 hover:bg-accent-dark transition disabled:opacity-60"
      >
        {salvando ? "Salvando..." : "Salvar"}
      </button>
      {ok && <span className="text-sm text-accent-dark">Salvo ✓</span>}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  opcoes,
  placeholder = "Selecione...",
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  opcoes: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
      >
        <option value="">{placeholder}</option>
        {opcoes.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function CampoComSugestao({
  label,
  value,
  onChange,
  sugestao,
  sufixo,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  sugestao: number | null;
  sufixo: string;
}) {
  return (
    <Field label={label}>
      <TextInput inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
      {sugestao !== null && (
        <p className="text-xs text-danger mt-1">
          Sugestão pela idade/sexo: {sugestao.toFixed(1)}
          {sufixo}
          {!value && (
            <button type="button" onClick={() => onChange(sugestao.toFixed(1))} className="ml-2 text-accent hover:underline">
              usar
            </button>
          )}
        </p>
      )}
    </Field>
  );
}

function ValorCalculado({ label, valor }: { label: React.ReactNode; valor: string | null }) {
  return (
    <Field label={label}>
      <div className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[15px] font-mono tabular-nums">{valor ?? "–"}</div>
    </Field>
  );
}

const REGIOES_CORPORAIS: { chave: string; rotulo: string }[] = [
  { chave: "braco_relaxado", rotulo: "Braço relaxado" },
  { chave: "braco_contraido", rotulo: "Braço contraído" },
  { chave: "antebraco", rotulo: "Antebraço" },
  { chave: "torax", rotulo: "Tórax" },
  { chave: "abdomen", rotulo: "Abdômen" },
  { chave: "quadril", rotulo: "Quadril" },
  { chave: "coxa", rotulo: "Coxa" },
  { chave: "panturrilha", rotulo: "Panturrilha" },
];

// Avatar esquemático (não anatômico) que mostra, por região, a
// circunferência e a dobra cutânea mais recentes - apoio visual rápido
// para o avaliador, os números oficiais ficam na tabela acima.
function AvatarCorporal({ regioes }: { regioes: Record<string, { circ: string; dobra: string }> }) {
  const marcador = (x: number, y: number) => <circle cx={x} cy={y} r={4} className="fill-accent-dark" />;
  const rotulo = (x: number, y: number, ancora: "start" | "end", texto: string) => (
    <text x={x} y={y} textAnchor={ancora} className="fill-ink" style={{ font: "11px sans-serif" }}>
      {texto}
    </text>
  );
  const linha = (x1: number, y1: number, x2: number, y2: number) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-border" strokeWidth={1} />
  );
  const texto = (chave: string) => {
    const r = regioes[chave];
    if (!r || (!r.circ && !r.dobra)) return "sem dados";
    return `${r.circ ? `${r.circ}cm` : "–"} · ${r.dobra ? `${r.dobra}mm` : "–"}`;
  };

  return (
    <svg viewBox="0 0 320 480" className="w-full max-w-xs mx-auto">
      {/* corpo esquemático */}
      <circle cx="160" cy="35" r="26" className="fill-none stroke-border" strokeWidth={2} />
      <rect x="150" y="58" width="20" height="14" className="fill-none stroke-border" strokeWidth={2} />
      <rect x="120" y="75" width="80" height="70" rx="16" className="fill-none stroke-border" strokeWidth={2} />
      <rect x="124" y="145" width="72" height="65" rx="14" className="fill-none stroke-border" strokeWidth={2} />
      <rect x="118" y="210" width="84" height="40" rx="14" className="fill-none stroke-border" strokeWidth={2} />
      {/* braços */}
      <rect x="75" y="80" width="38" height="85" rx="16" className="fill-none stroke-border" strokeWidth={2} />
      <rect x="65" y="165" width="34" height="85" rx="14" className="fill-none stroke-border" strokeWidth={2} />
      <rect x="207" y="80" width="38" height="85" rx="16" className="fill-none stroke-border" strokeWidth={2} />
      <rect x="221" y="165" width="34" height="85" rx="14" className="fill-none stroke-border" strokeWidth={2} />
      {/* pernas */}
      <rect x="122" y="250" width="34" height="115" rx="16" className="fill-none stroke-border" strokeWidth={2} />
      <rect x="126" y="365" width="26" height="95" rx="13" className="fill-none stroke-border" strokeWidth={2} />
      <rect x="164" y="250" width="34" height="115" rx="16" className="fill-none stroke-border" strokeWidth={2} />
      <rect x="168" y="365" width="26" height="95" rx="13" className="fill-none stroke-border" strokeWidth={2} />

      {/* marcadores + leaders + rótulos */}
      {marcador(94, 115)}
      {linha(94, 115, 20, 100)}
      {rotulo(16, 104, "end", "Braço")}
      {rotulo(16, 118, "end", texto("braco_relaxado"))}

      {marcador(82, 205)}
      {linha(82, 205, 20, 220)}
      {rotulo(16, 210, "end", "Antebraço")}
      {rotulo(16, 224, "end", texto("antebraco"))}

      {marcador(160, 105)}
      {linha(160, 105, 300, 90)}
      {rotulo(304, 80, "start", "Tórax")}
      {rotulo(304, 94, "start", texto("torax"))}

      {marcador(160, 175)}
      {linha(160, 175, 300, 180)}
      {rotulo(304, 170, "start", "Abdômen")}
      {rotulo(304, 184, "start", texto("abdomen"))}

      {marcador(160, 228)}
      {linha(160, 228, 300, 260)}
      {rotulo(304, 250, "start", "Quadril")}
      {rotulo(304, 264, "start", texto("quadril"))}

      {marcador(139, 300)}
      {linha(139, 300, 20, 330)}
      {rotulo(16, 320, "end", "Coxa")}
      {rotulo(16, 334, "end", texto("coxa"))}

      {marcador(139, 410)}
      {linha(139, 410, 20, 420)}
      {rotulo(16, 410, "end", "Panturrilha")}
      {rotulo(16, 424, "end", texto("panturrilha"))}
    </svg>
  );
}

function AbaFisica({ pacienteId, dados, paciente, onSalvo }: { pacienteId: string; dados: any; paciente: PacienteRow; onSalvo: () => void }) {
  const [d, setD] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {
      peso_kg: dados?.peso_kg ?? "",
      altura_cm: dados?.altura_cm ?? "",
      pa_sistolica: dados?.pa_sistolica ?? "",
      pa_diastolica: dados?.pa_diastolica ?? "",
      fc_repouso: dados?.fc_repouso ?? "",
      spo2: dados?.spo2 ?? "",
      circ_cintura: dados?.circ_cintura ?? "",
      circ_quadril: dados?.circ_quadril ?? "",
      circ_panturrilha: dados?.circ_panturrilha ?? "",
      protocolo_dobras: dados?.protocolo_dobras ?? "",
      bio_percentual_gordura: dados?.bio_percentual_gordura ?? "",
      bio_massa_magra_kg: dados?.bio_massa_magra_kg ?? "",
      bio_massa_gorda_kg: dados?.bio_massa_gorda_kg ?? "",
      bio_agua_corporal_pct: dados?.bio_agua_corporal_pct ?? "",
      bio_aparelho: dados?.bio_aparelho ?? "",
      protocolo_referencia_gordura: dados?.protocolo_referencia_gordura ?? "",
      percentual_gordura: dados?.percentual_gordura ?? "",
      percentual_gordura_ideal: dados?.percentual_gordura_ideal ?? "",
      massa_magra_ideal_kg: dados?.massa_magra_ideal_kg ?? "",
      observacoes: dados?.observacoes ?? "",
    };
    for (const s of TODOS_SITIOS_DOBRA) base[s.chave] = dados?.[s.chave] ?? "";
    for (const r of REGIOES_CORPORAIS) {
      base[`reg_${r.chave}_circ`] = dados?.[`reg_${r.chave}_circ`] ?? "";
      base[`reg_${r.chave}_dobra`] = dados?.[`reg_${r.chave}_dobra`] ?? "";
    }
    return base;
  });
  const { salvar, salvando, ok } = useSalvarSecao(pacienteId, "fisica");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));

  const idadeNum = Number(paciente.anamnese?.contexto?.idade) || null;
  const sexoNorm = sexoNormalizado(paciente.sexo);

  const imc = d.peso_kg && d.altura_cm ? Number(d.peso_kg) / Math.pow(Number(d.altura_cm) / 100, 2) : null;

  const rcq = d.circ_cintura && d.circ_quadril ? Number(d.circ_cintura) / Number(d.circ_quadril) : null;
  const rcqRiscoAumentado =
    rcq !== null ? (sexoNorm === "masculino" ? rcq >= 0.9 : sexoNorm === "feminino" ? rcq >= 0.85 : null) : null;

  const { protocolo: protocoloSugerido, motivo: motivoProtocolo } = sugerirProtocoloDobras(idadeNum);
  const percentualDobrasCalc = calcularPercentualGorduraDobras(d.protocolo_dobras as ProtocoloDobras, d, idadeNum, sexoNorm);
  const percentualBioInformado = d.bio_percentual_gordura ? Number(d.bio_percentual_gordura) : null;

  const percentualGorduraEncontrado = d.percentual_gordura ? Number(d.percentual_gordura) : null;
  const faixaIdeal = faixaGorduraSugerida(idadeNum, sexoNorm);
  const percentualIdealSugerido = percentualGorduraIdealSugerido(idadeNum, sexoNorm);
  const percentualIdealEfetivo = d.percentual_gordura_ideal ? Number(d.percentual_gordura_ideal) : percentualIdealSugerido;

  const percentualExcedente =
    percentualGorduraEncontrado !== null && percentualIdealEfetivo !== null ? percentualGorduraEncontrado - percentualIdealEfetivo : null;

  const pesoNum = d.peso_kg ? Number(d.peso_kg) : null;
  const pesoGorduraTotalKg = pesoNum !== null && percentualGorduraEncontrado !== null ? (pesoNum * percentualGorduraEncontrado) / 100 : null;
  const massaMagraKg = pesoNum !== null && pesoGorduraTotalKg !== null ? pesoNum - pesoGorduraTotalKg : null;
  const gorduraExcedenteKg =
    pesoNum !== null && percentualExcedente !== null ? Math.max(0, (pesoNum * percentualExcedente) / 100) : null;

  const massaMagraIdealSugerida = pesoNum !== null && percentualIdealSugerido !== null ? pesoNum * (1 - percentualIdealSugerido / 100) : null;
  const massaMagraIdealEfetiva = d.massa_magra_ideal_kg ? Number(d.massa_magra_ideal_kg) : massaMagraIdealSugerida;
  const carenciaMuscularKg =
    massaMagraIdealEfetiva !== null && massaMagraKg !== null ? Math.max(0, massaMagraIdealEfetiva - massaMagraKg) : null;

  const pesoIdealKg =
    massaMagraKg !== null && percentualIdealEfetivo !== null && percentualIdealEfetivo < 100
      ? massaMagraKg / (1 - percentualIdealEfetivo / 100)
      : null;

  const sitiosProtocolo = d.protocolo_dobras === "jp3" ? (sexoNorm !== "desconhecido" ? SITIOS_JP3[sexoNorm] : []) : d.protocolo_dobras === "jp7" ? SITIOS_JP7 : [];
  const chavesProtocolo = new Set(sitiosProtocolo.map((s) => s.chave));

  const regioesParaAvatar = useMemo(() => {
    const obj: Record<string, { circ: string; dobra: string }> = {};
    for (const r of REGIOES_CORPORAIS) {
      obj[r.chave] = { circ: d[`reg_${r.chave}_circ`], dobra: d[`reg_${r.chave}_dobra`] };
    }
    return obj;
  }, [d]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
      <div>
        <h3 className="font-display text-lg text-ink mb-1">Sinais vitais</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
          <NumField label="PA sistólica" suffix="mmHg" value={d.pa_sistolica} onChange={(v) => set("pa_sistolica", v)} />
          <NumField label="PA diastólica" suffix="mmHg" value={d.pa_diastolica} onChange={(v) => set("pa_diastolica", v)} />
          <NumField label="FC de repouso" suffix="bpm" value={d.fc_repouso} onChange={(v) => set("fc_repouso", v)} />
          <NumField label="SpO2" suffix="%" value={d.spo2} onChange={(v) => set("spo2", v)} />
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg text-ink mb-1">Antropometria</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
          <NumField label="Peso" suffix="kg" value={d.peso_kg} onChange={(v) => set("peso_kg", v)} />
          <NumField label="Altura" suffix="cm" value={d.altura_cm} onChange={(v) => set("altura_cm", v)} />
          <ValorCalculado label="IMC (calculado)" valor={imc !== null ? imc.toFixed(1) : null} />
          <NumField label="Circ. cintura" suffix="cm" value={d.circ_cintura} onChange={(v) => set("circ_cintura", v)} />
          <NumField label="Circ. quadril" suffix="cm" value={d.circ_quadril} onChange={(v) => set("circ_quadril", v)} />
          <NumField label="Circ. panturrilha" suffix="cm" value={d.circ_panturrilha} onChange={(v) => set("circ_panturrilha", v)} />
          <Field label="RCQ - relação cintura/quadril (calculado)">
            <div className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[15px] font-mono tabular-nums">
              {rcq !== null ? rcq.toFixed(2) : "–"}
            </div>
            {rcqRiscoAumentado !== null && (
              <p className={`text-xs mt-1 ${rcqRiscoAumentado ? "text-warn" : "text-muted"}`}>
                {rcqRiscoAumentado
                  ? "Acima do corte da OMS associado a risco cardiometabólico aumentado para o sexo registrado."
                  : "Dentro da faixa esperada pelo corte da OMS para o sexo registrado."}
              </p>
            )}
            {rcq !== null && rcqRiscoAumentado === null && (
              <p className="text-xs text-muted mt-1">Sexo não registrado - corte da OMS não aplicado.</p>
            )}
          </Field>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-1">Dobras cutâneas</h3>
        <p className="text-xs text-muted mb-3">
          Sugestão para este paciente: <strong>{protocoloSugerido === "jp3" ? "3 dobras (Jackson & Pollock)" : "7 dobras (Jackson & Pollock)"}</strong> — {motivoProtocolo} Meça quantas dobras quiser; o %G automático só é calculado para os protocolos de 3 ou 7 dobras.
        </p>
        <div className="mb-4 max-w-sm">
          <SelectField
            label="Protocolo usado nesta coleta"
            value={d.protocolo_dobras}
            onChange={(v) => set("protocolo_dobras", v)}
            opcoes={[
              { value: "jp3", label: "Jackson & Pollock - 3 dobras" },
              { value: "jp7", label: "Jackson & Pollock - 7 dobras" },
              { value: "outro", label: "Outro protocolo (informar %G manualmente)" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TODOS_SITIOS_DOBRA.map((s) => (
            <NumField
              key={s.chave}
              label={chavesProtocolo.has(s.chave) ? `${s.rotulo} ★` : s.rotulo}
              suffix="mm"
              value={d[s.chave]}
              onChange={(v) => set(s.chave, v)}
            />
          ))}
        </div>
        {(d.protocolo_dobras === "jp3" || d.protocolo_dobras === "jp7") && (
          <div className="mt-3 rounded-lg bg-bg p-3 text-sm flex items-center justify-between">
            <span>
              %G calculado por dobras ({d.protocolo_dobras === "jp3" ? "3 sítios" : "7 sítios"}):{" "}
              <strong className="font-mono">{percentualDobrasCalc !== null ? `${percentualDobrasCalc.toFixed(1)}%` : "— faltam dobras, idade ou sexo"}</strong>
            </span>
            {percentualDobrasCalc !== null && (
              <button
                type="button"
                onClick={() => {
                  set("percentual_gordura", percentualDobrasCalc.toFixed(1));
                  set("protocolo_referencia_gordura", "dobras");
                }}
                className="text-xs font-medium text-accent hover:underline"
              >
                usar como %G de referência
              </button>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-1">Bioimpedância</h3>
        <p className="text-xs text-muted mb-3">Preencha se este paciente também (ou apenas) usa bioimpedância - pode usar os dois métodos juntos.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Aparelho/modelo">
            <TextInput value={d.bio_aparelho} onChange={(e) => set("bio_aparelho", e.target.value)} placeholder="Opcional" />
          </Field>
          <NumField label="% de gordura (bioimpedância)" value={d.bio_percentual_gordura} onChange={(v) => set("bio_percentual_gordura", v)} />
          <NumField label="Massa magra" suffix="kg" value={d.bio_massa_magra_kg} onChange={(v) => set("bio_massa_magra_kg", v)} />
          <NumField label="Massa gorda" suffix="kg" value={d.bio_massa_gorda_kg} onChange={(v) => set("bio_massa_gorda_kg", v)} />
          <NumField label="Água corporal" suffix="%" value={d.bio_agua_corporal_pct} onChange={(v) => set("bio_agua_corporal_pct", v)} />
        </div>
        {percentualBioInformado !== null && (
          <div className="mt-3 rounded-lg bg-bg p-3 text-sm flex items-center justify-between">
            <span>
              %G informado pela bioimpedância: <strong className="font-mono">{percentualBioInformado.toFixed(1)}%</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                set("percentual_gordura", percentualBioInformado.toFixed(1));
                set("protocolo_referencia_gordura", "bioimpedancia");
              }}
              className="text-xs font-medium text-accent hover:underline"
            >
              usar como %G de referência
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-1">Composição corporal - resultado de referência</h3>
        <p className="text-xs text-muted mb-3">
          Declare aqui qual %G está valendo para esta avaliação (dobras, bioimpedância, média dos dois, ou outro
          protocolo externo) - os botões "usar" acima preenchem automaticamente, mas o campo sempre pode ser
          digitado/ajustado.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <SelectField
            label="Protocolo de referência usado"
            value={d.protocolo_referencia_gordura}
            onChange={(v) => set("protocolo_referencia_gordura", v)}
            opcoes={[
              { value: "dobras", label: "Dobras cutâneas" },
              { value: "bioimpedancia", label: "Bioimpedância" },
              { value: "media", label: "Média dos dois" },
              { value: "outro", label: "Outro / clínico externo" },
            ]}
          />
          <NumField label="%G encontrado (referência)" value={d.percentual_gordura} onChange={(v) => set("percentual_gordura", v)} />
          <CampoComSugestao
            label="%G ideal"
            value={d.percentual_gordura_ideal}
            onChange={(v) => set("percentual_gordura_ideal", v)}
            sugestao={percentualIdealSugerido}
            sufixo={faixaIdeal ? `% (faixa saudável ${faixaIdeal[0]}-${faixaIdeal[1]}%)` : "%"}
          />
          <ValorCalculado label="%G excedente" valor={percentualExcedente !== null ? `${percentualExcedente.toFixed(1)}%` : null} />
          <ValorCalculado label="Peso de gordura total" valor={pesoGorduraTotalKg !== null ? `${pesoGorduraTotalKg.toFixed(1)} kg` : null} />
          <ValorCalculado label="Gordura excedente" valor={gorduraExcedenteKg !== null ? `${gorduraExcedenteKg.toFixed(1)} kg` : null} />
          <ValorCalculado label="Massa magra" valor={massaMagraKg !== null ? `${massaMagraKg.toFixed(1)} kg` : null} />
          <CampoComSugestao
            label="Massa magra ideal"
            value={d.massa_magra_ideal_kg}
            onChange={(v) => set("massa_magra_ideal_kg", v)}
            sugestao={massaMagraIdealSugerida}
            sufixo=" kg (peso atual com o %G ideal sugerido)"
          />
          <ValorCalculado label="Carência muscular" valor={carenciaMuscularKg !== null ? `${carenciaMuscularKg.toFixed(1)} kg` : null} />
          <ValorCalculado label="Peso ideal" valor={pesoIdealKg !== null ? `${pesoIdealKg.toFixed(1)} kg` : null} />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-1">Medidas regionais (circunferência + dobra cutânea)</h3>
        <p className="text-xs text-muted mb-3">
          Registrar as duas medidas na mesma região permite comparar, com o tempo (aba Reavaliação), se a
          circunferência caiu por perda de gordura (dobra menor) ou se houve troca de gordura por músculo
          (circunferência estável/maior com dobra menor).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-2 font-medium">Região</th>
                <th className="py-2 px-2 font-medium">Circunferência (cm)</th>
                <th className="py-2 px-2 font-medium">Dobra cutânea (mm)</th>
              </tr>
            </thead>
            <tbody>
              {REGIOES_CORPORAIS.map((r) => (
                <tr key={r.chave} className="border-b border-border last:border-0">
                  <td className="py-2 pr-2 text-ink">{r.rotulo}</td>
                  <td className="py-2 px-2">
                    <TextInput
                      inputMode="decimal"
                      value={d[`reg_${r.chave}_circ`]}
                      onChange={(e) => set(`reg_${r.chave}_circ`, e.target.value)}
                      className="max-w-[7rem]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <TextInput
                      inputMode="decimal"
                      value={d[`reg_${r.chave}_dobra`]}
                      onChange={(e) => set(`reg_${r.chave}_dobra`, e.target.value)}
                      className="max-w-[7rem]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-3">Avatar - resumo visual por região</h3>
        <AvatarCorporal regioes={regioesParaAvatar} />
      </div>

      <Field label="Observações do avaliador">
        <TextArea value={d.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </Field>

      <SalvarBar salvando={salvando} ok={ok} onSalvar={() => salvar(d).then(onSalvo)} />
    </div>
  );
}

const BUCKET_FOTOS_POSTURAIS = "fotos-posturais";

function useFotoSignedUrl(path: string): string | null {
  const supabase = useMemo(() => createClient(), []);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelado = false;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from(BUCKET_FOTOS_POSTURAIS)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelado) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelado = true;
    };
  }, [path]);
  return url;
}

function FotoVista({
  pacienteId,
  vista,
  label,
  path,
  onChange,
}: {
  pacienteId: string;
  vista: string;
  label: string;
  path: string;
  onChange: (path: string) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [enviando, setEnviando] = useState(false);
  const url = useFotoSignedUrl(path);

  async function enviar(file: File) {
    setEnviando(true);
    const extensao = file.name.split(".").pop() || "jpg";
    const caminho = `${pacienteId}/${vista}.${extensao}`;
    const { error } = await supabase.storage
      .from(BUCKET_FOTOS_POSTURAIS)
      .upload(caminho, file, { upsert: true, contentType: file.type });
    if (!error) onChange(caminho);
    setEnviando(false);
  }

  async function remover() {
    if (!path) return;
    await supabase.storage.from(BUCKET_FOTOS_POSTURAIS).remove([path]);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink">{label}</p>
      {url ? (
        <img src={url} alt={label} className="h-44 w-auto rounded-lg border border-border object-cover" />
      ) : (
        <div className="h-44 w-32 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted text-center px-2">
          Sem foto
        </div>
      )}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-accent hover:underline cursor-pointer">
          {enviando ? "Enviando..." : url ? "Substituir" : "Enviar foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={enviando}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) enviar(file);
              e.target.value = "";
            }}
          />
        </label>
        {url && (
          <button type="button" onClick={remover} className="text-xs text-muted hover:text-danger">
            remover
          </button>
        )}
      </div>
    </div>
  );
}

function AbaPostural({ pacienteId, dados, onSalvo }: { pacienteId: string; dados: any; onSalvo: () => void }) {
  const [d, setD] = useState<Record<string, string>>({
    obs_anterior: dados?.obs_anterior ?? "",
    obs_posterior: dados?.obs_posterior ?? "",
    obs_lateral_d: dados?.obs_lateral_d ?? "",
    obs_lateral_e: dados?.obs_lateral_e ?? "",
    obs_movimento: dados?.obs_movimento ?? "",
    foto_anterior_path: dados?.foto_anterior_path ?? "",
    foto_posterior_path: dados?.foto_posterior_path ?? "",
    foto_lateral_d_path: dados?.foto_lateral_d_path ?? "",
    foto_lateral_e_path: dados?.foto_lateral_e_path ?? "",
  });
  const { salvar, salvando, ok } = useSalvarSecao(pacienteId, "postural");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <p className="text-sm text-muted">
        Registre observações descritivas (nunca causais) para cada vista - ver protocolo fotográfico
        padronizado no documento do Agente 4. As fotos ficam em um arquivo privado, visível apenas para
        avaliadores autenticados da clínica.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <FotoVista pacienteId={pacienteId} vista="anterior" label="Vista anterior" path={d.foto_anterior_path} onChange={(v) => set("foto_anterior_path", v)} />
        <FotoVista pacienteId={pacienteId} vista="posterior" label="Vista posterior" path={d.foto_posterior_path} onChange={(v) => set("foto_posterior_path", v)} />
        <FotoVista pacienteId={pacienteId} vista="lateral_d" label="Vista lateral direita" path={d.foto_lateral_d_path} onChange={(v) => set("foto_lateral_d_path", v)} />
        <FotoVista pacienteId={pacienteId} vista="lateral_e" label="Vista lateral esquerda" path={d.foto_lateral_e_path} onChange={(v) => set("foto_lateral_e_path", v)} />
      </div>
      <Field label="Vista anterior">
        <TextArea value={d.obs_anterior} onChange={(e) => set("obs_anterior", e.target.value)} />
      </Field>
      <Field label="Vista posterior">
        <TextArea value={d.obs_posterior} onChange={(e) => set("obs_posterior", e.target.value)} />
      </Field>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Vista lateral direita">
          <TextArea value={d.obs_lateral_d} onChange={(e) => set("obs_lateral_d", e.target.value)} />
        </Field>
        <Field label="Vista lateral esquerda">
          <TextArea value={d.obs_lateral_e} onChange={(e) => set("obs_lateral_e", e.target.value)} />
        </Field>
      </div>
      <Field label="Padrões de movimento observados (agachamento, alcance, etc.)">
        <TextArea value={d.obs_movimento} onChange={(e) => set("obs_movimento", e.target.value)} />
      </Field>
      <SalvarBar salvando={salvando} ok={ok} onSalvar={() => salvar(d).then(onSalvo)} />
    </div>
  );
}

type LinhaGoniometria = { id: string; articulacao: string; lado: string; graus: string };

function novoIdLocal(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Estimativa de 1RM pela fórmula de Brzycki - referência de campo comumente
// usada, válida sobretudo até ~10 repetições; é uma estimativa, nunca um
// valor medido diretamente.
function estimarRM(cargaKg: string, repeticoes: string): string | null {
  const carga = Number(cargaKg);
  const reps = Number(repeticoes);
  if (!carga || !reps || reps <= 0 || reps >= 37) return null;
  const rm = (carga * 36) / (37 - reps);
  return rm.toFixed(1);
}

// Instruções de aplicação em português, para o avaliador consultar sem sair
// da tela - não é protocolo oficial fechado, é um lembrete rápido de campo.
const INSTRUCOES_TESTE: Record<string, string> = {
  chair_stand:
    "Paciente sentado numa cadeira sem apoio de braço, com os braços cruzados sobre o peito. Conte quantas vezes ele consegue levantar e sentar completamente em 30 segundos.",
  five_sts:
    "Mesma posição do Chair Stand. Cronometre o tempo que o paciente leva para levantar e sentar 5 vezes seguidas, o mais rápido possível, sem usar os braços.",
  tug: "Paciente sentado numa cadeira com apoio de braço. Ao sinal, ele se levanta, caminha 3 metros, dá a volta, retorna e senta novamente. Cronometre o tempo total.",
  apoio_unipodal:
    "Peça para o paciente ficar em pé sobre uma perna, sem apoio, olhos abertos. Cronometre até ele perder o equilíbrio ou tocar o chão com o outro pé. Repita para o outro lado.",
  velocidade_marcha:
    "Marque um percurso de 4 a 10 metros em piso plano. Peça para o paciente caminhar no ritmo habitual dele. Cronometre e divida a distância pelo tempo (m/s).",
  tc6: "Em um corredor marcado (geralmente 30m), peça para o paciente caminhar o mais rápido possível, sem correr, durante 6 minutos. Registre a distância total percorrida.",
  dinamometria:
    "Com o dinamômetro de preensão manual, braço ao lado do corpo, cotovelo a 90°. Peça para apertar com força máxima. Registre o melhor de 2-3 tentativas por lado.",
  pushup:
    "Posição de flexão de braço padrão, ou apoiada nos joelhos (modificada) quando necessário. Conte o máximo de repetições com boa técnica, sem pausa prolongada, até a falha ou esgotamento.",
  arm_curl:
    "Sentado, com halter leve (referência: ~2kg mulheres / ~3kg homens, ajuste pelo condicionamento do paciente). Conte quantas flexões de cotovelo completas ele consegue fazer em 30 segundos (Arm Curl Test, Senior Fitness Test).",
  rm_submaximo:
    "Escolha uma carga que o paciente consiga mover entre 3 e 10 vezes com boa técnica, perto da falha. Registre a carga e as repetições - o sistema estima o 1RM pela fórmula de Brzycki.",
  falha_carga_fixa:
    "Escolha uma carga fixa (geralmente mais leve que o teste de RM submáximo) e peça o máximo de repetições possível com boa técnica até a falha. Útil para acompanhar resistência muscular com a mesma carga ao longo do tempo.",
  goniometria:
    "Posicione o goniômetro no eixo articular, alinhando os braços fixo e móvel conforme o movimento avaliado. Registre o ângulo máximo atingido (anote nas observações se foi ativo ou passivo).",
  agachamento_livre:
    "Peça para o paciente agachar livremente, sem carga, até onde conseguir com conforto. Observe profundidade, alinhamento do joelho (valgo/varo), compensações no tronco e nos tornozelos.",
  core_prancha:
    "Paciente em posição de prancha (apoio nos antebraços e pés, corpo alinhado da cabeça aos calcanhares). Cronometre até ele perder a postura correta (quadril cair ou subir, tremores excessivos).",
};

function InfoPopover({ texto }: { texto: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <span className="relative inline-block align-middle ml-1">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setAberto((v) => !v);
        }}
        className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-accent/15 text-accent-dark text-[10px] font-bold leading-none hover:bg-accent/25"
        aria-label="Como aplicar este teste"
      >
        i
      </button>
      {aberto && (
        <span className="absolute z-20 top-6 left-0 w-64 rounded-lg border border-border bg-surface shadow-lg p-3 text-xs font-normal normal-case text-ink whitespace-normal block text-left">
          {texto}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setAberto(false);
            }}
            className="block mt-2 text-accent-dark text-xs font-medium"
          >
            Fechar
          </button>
        </span>
      )}
    </span>
  );
}

function RotuloComInfo({ texto, chave }: { texto: string; chave: keyof typeof INSTRUCOES_TESTE }) {
  return (
    <>
      {texto}
      <InfoPopover texto={INSTRUCOES_TESTE[chave]} />
    </>
  );
}

function PainelRecomendacaoTestes({ paciente }: { paciente: PacienteRow }) {
  const tags = useMemo(() => calcularTagsPerfil(paciente), [paciente]);
  const recomendados = useMemo(() => gruposRecomendados(tags), [tags]);
  const grupos = Object.entries(recomendados) as [GrupoTesteFuncional, string[]][];

  if (tags.length === 0) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm space-y-2">
      <p className="text-ink">
        <span className="font-medium">Perfil deste paciente (anamnese): </span>
        {tags.map((t) => t.rotulo).join(" · ")}
      </p>
      {grupos.length > 0 && (
        <div>
          <p className="text-muted mb-1">Com base nisso, Rita sugere priorizar:</p>
          <ul className="list-disc list-inside space-y-0.5 text-ink">
            {grupos.map(([grupo, motivos]) => (
              <li key={grupo}>
                <span className="font-medium">{ROTULOS_GRUPO[grupo]}</span>
                <span className="text-muted"> — {motivos.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted">Sugestão de ordem/ênfase, não uma restrição - todos os testes continuam disponíveis abaixo.</p>
    </div>
  );
}

function AbaFuncional({ pacienteId, dados, paciente, onSalvo }: { pacienteId: string; dados: any; paciente: PacienteRow; onSalvo: () => void }) {
  const [d, setD] = useState<Record<string, string>>({
    chair_stand_reps: dados?.chair_stand_reps ?? "",
    five_sts_seg: dados?.five_sts_seg ?? "",
    tug_seg: dados?.tug_seg ?? "",
    apoio_unipodal_d_seg: dados?.apoio_unipodal_d_seg ?? "",
    apoio_unipodal_e_seg: dados?.apoio_unipodal_e_seg ?? "",
    velocidade_marcha_ms: dados?.velocidade_marcha_ms ?? "",
    tc6_metros: dados?.tc6_metros ?? "",
    dinamometria_d_kg: dados?.dinamometria_d_kg ?? "",
    dinamometria_e_kg: dados?.dinamometria_e_kg ?? "",
    pushup_reps: dados?.pushup_reps ?? "",
    arm_curl_reps: dados?.arm_curl_reps ?? "",
    rm_exercicio: dados?.rm_exercicio ?? "",
    rm_carga_kg: dados?.rm_carga_kg ?? "",
    rm_repeticoes: dados?.rm_repeticoes ?? "",
    falha_exercicio: dados?.falha_exercicio ?? "",
    falha_carga_kg: dados?.falha_carga_kg ?? "",
    falha_repeticoes: dados?.falha_repeticoes ?? "",
    agachamento_livre_obs: dados?.agachamento_livre_obs ?? "",
    core_prancha_seg: dados?.core_prancha_seg ?? "",
    core_estabilidade_obs: dados?.core_estabilidade_obs ?? "",
    observacoes: dados?.observacoes ?? "",
  });
  const [goniometria, setGoniometria] = useState<LinhaGoniometria[]>(dados?.goniometria ?? []);
  const { salvar, salvando, ok } = useSalvarSecao(pacienteId, "funcional");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));

  const rmEstimado = estimarRM(d.rm_carga_kg, d.rm_repeticoes);

  function adicionarGoniometria() {
    setGoniometria((prev) => [...prev, { id: novoIdLocal(), articulacao: "", lado: "", graus: "" }]);
  }
  function atualizarGoniometria(id: string, patch: Partial<LinhaGoniometria>) {
    setGoniometria((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function removerGoniometria(id: string) {
    setGoniometria((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
      <PainelRecomendacaoTestes paciente={paciente} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <NumField label={<RotuloComInfo texto="Chair Stand" chave="chair_stand" />} suffix="reps/30s" value={d.chair_stand_reps} onChange={(v) => set("chair_stand_reps", v)} />
        <NumField label={<RotuloComInfo texto="5x Sit-to-Stand" chave="five_sts" />} suffix="s" value={d.five_sts_seg} onChange={(v) => set("five_sts_seg", v)} />
        <NumField label={<RotuloComInfo texto="TUG" chave="tug" />} suffix="s" value={d.tug_seg} onChange={(v) => set("tug_seg", v)} />
        <NumField label={<RotuloComInfo texto="Apoio unipodal D" chave="apoio_unipodal" />} suffix="s" value={d.apoio_unipodal_d_seg} onChange={(v) => set("apoio_unipodal_d_seg", v)} />
        <NumField label={<RotuloComInfo texto="Apoio unipodal E" chave="apoio_unipodal" />} suffix="s" value={d.apoio_unipodal_e_seg} onChange={(v) => set("apoio_unipodal_e_seg", v)} />
        <NumField label={<RotuloComInfo texto="Velocidade de marcha" chave="velocidade_marcha" />} suffix="m/s" value={d.velocidade_marcha_ms} onChange={(v) => set("velocidade_marcha_ms", v)} />
        <NumField label={<RotuloComInfo texto="TC6" chave="tc6" />} suffix="m" value={d.tc6_metros} onChange={(v) => set("tc6_metros", v)} />
        <NumField label={<RotuloComInfo texto="Dinamometria D" chave="dinamometria" />} suffix="kgf" value={d.dinamometria_d_kg} onChange={(v) => set("dinamometria_d_kg", v)} />
        <NumField label={<RotuloComInfo texto="Dinamometria E" chave="dinamometria" />} suffix="kgf" value={d.dinamometria_e_kg} onChange={(v) => set("dinamometria_e_kg", v)} />
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-1">Força sem dinamômetro (exercícios de musculação)</h4>
        <p className="text-xs text-muted mb-3">
          Alternativas validadas para estimar força/resistência muscular sem dinamômetro e sem teste de 1RM direto.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumField label={<RotuloComInfo texto="Push-up test" chave="pushup" />} suffix="reps" value={d.pushup_reps} onChange={(v) => set("pushup_reps", v)} />
          <NumField label={<RotuloComInfo texto="Arm Curl Test" chave="arm_curl" />} suffix="reps/30s" value={d.arm_curl_reps} onChange={(v) => set("arm_curl_reps", v)} />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-1">
          <RotuloComInfo texto="RM submáximo (estimado)" chave="rm_submaximo" />
        </h4>
        <p className="text-xs text-muted mb-3">
          Fórmula de Brzycki - estimativa de campo, mais confiável até ~10 repetições. Nunca substitui um teste
          direto de 1RM.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Exercício">
            <TextInput value={d.rm_exercicio} onChange={(e) => set("rm_exercicio", e.target.value)} placeholder="Ex.: Supino, Leg press" />
          </Field>
          <NumField label="Carga utilizada" suffix="kg" value={d.rm_carga_kg} onChange={(v) => set("rm_carga_kg", v)} />
          <NumField label="Repetições realizadas" value={d.rm_repeticoes} onChange={(v) => set("rm_repeticoes", v)} />
          <Field label="1RM estimado">
            <div className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[15px] font-mono tabular-nums">
              {rmEstimado ? `${rmEstimado} kg` : "–"}
            </div>
          </Field>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-1">
          <RotuloComInfo texto="Repetições até a falha (carga fixa)" chave="falha_carga_fixa" />
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Exercício">
            <TextInput value={d.falha_exercicio} onChange={(e) => set("falha_exercicio", e.target.value)} />
          </Field>
          <NumField label="Carga fixa" suffix="kg" value={d.falha_carga_kg} onChange={(v) => set("falha_carga_kg", v)} />
          <NumField label="Repetições até a falha" value={d.falha_repeticoes} onChange={(v) => set("falha_repeticoes", v)} />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-display text-base text-ink">
            <RotuloComInfo texto="Amplitude articular (goniometria)" chave="goniometria" />
          </h4>
          <button type="button" onClick={adicionarGoniometria} className="text-sm font-medium text-accent hover:underline">
            + Adicionar articulação
          </button>
        </div>
        {goniometria.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma medida registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {goniometria.map((linha) => (
              <div key={linha.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                <Field label="Articulação/movimento">
                  <TextInput
                    value={linha.articulacao}
                    onChange={(e) => atualizarGoniometria(linha.id, { articulacao: e.target.value })}
                    placeholder="Ex.: Flexão de ombro"
                  />
                </Field>
                <Field label="Lado">
                  <TextInput
                    value={linha.lado}
                    onChange={(e) => atualizarGoniometria(linha.id, { lado: e.target.value })}
                    placeholder="D/E"
                    className="w-16"
                  />
                </Field>
                <Field label="Graus">
                  <TextInput
                    inputMode="decimal"
                    value={linha.graus}
                    onChange={(e) => atualizarGoniometria(linha.id, { graus: e.target.value })}
                    className="w-20"
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => removerGoniometria(linha.id)}
                  className="text-xs text-muted hover:text-danger pb-2.5"
                >
                  remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border space-y-4">
        <h4 className="font-display text-base text-ink">Testes funcionais observacionais</h4>
        <Field label={<RotuloComInfo texto="Agachamento livre - observações (profundidade, valgo dinâmico, compensações...)" chave="agachamento_livre" />}>
          <TextArea value={d.agachamento_livre_obs} onChange={(e) => set("agachamento_livre_obs", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumField label={<RotuloComInfo texto="Estabilidade do core - prancha" chave="core_prancha" />} suffix="s" value={d.core_prancha_seg} onChange={(v) => set("core_prancha_seg", v)} />
        </div>
        <Field label="Estabilidade do core - observações">
          <TextArea value={d.core_estabilidade_obs} onChange={(e) => set("core_estabilidade_obs", e.target.value)} />
        </Field>
      </div>

      <Field label="Observações gerais do avaliador">
        <TextArea value={d.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </Field>
      <SalvarBar salvando={salvando} ok={ok} onSalvar={() => salvar({ ...d, goniometria }).then(onSalvo)} />
    </div>
  );
}
