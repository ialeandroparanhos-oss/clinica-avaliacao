"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import type { Anamnese, PacienteRow } from "@/lib/anamnese/types";
import { escorePSS10, somaSemNulos, rotuloNivel } from "@/lib/anamnese/alerts";
import { AlertBanner, Field, TextArea, TextInput } from "@/components/forms";
import { perguntasParQ } from "@/lib/anamnese/questionnaires";
import { calcularPerfilIntegrado, type Classificacao, type DomainResult } from "@/lib/integracao/perfil";
import { HORIZONTES, sugerirPlano, type Encaminhamento, type Horizonte, type ItemPlano, type Plano } from "@/lib/integracao/plano";

type Aba = "perfil" | "plano" | "anamnese" | "fisica" | "postural" | "funcional";

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
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">{paciente.nome}</h1>
        <p className="text-muted text-sm mt-1">
          {new Date(paciente.data_nascimento).toLocaleDateString("pt-BR")} · {paciente.telefone || "sem telefone"}
        </p>
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
      {aba === "anamnese" && <AbaAnamnese anamnese={anamnese} status={paciente.anamnese_status} />}
      {aba === "fisica" && <AbaFisica pacienteId={paciente.id} dados={paciente.fisica} onSalvo={carregar} />}
      {aba === "postural" && <AbaPostural pacienteId={paciente.id} dados={paciente.postural} onSalvo={carregar} />}
      {aba === "funcional" && <AbaFuncional pacienteId={paciente.id} dados={paciente.funcional} onSalvo={carregar} />}
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
          <ol className="space-y-1 text-sm text-ink list-decimal list-inside">
            {perfil.prioridades.map((d) => (
              <li key={d.chave}>
                <strong>{d.titulo}</strong> — {d.justificativa}
              </li>
            ))}
          </ol>
        )}
        <p className="text-xs text-muted mt-3">
          Conecte estas prioridades ao objetivo declarado pelo paciente (capítulo "Motivo da procura" da anamnese)
          na hora de montar o plano — a IA não faz essa conexão fina automaticamente.
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

function AbaAnamnese({ anamnese, status }: { anamnese: Anamnese; status: string }) {
  const pss10 = escorePSS10(anamnese.saude_mental.pss10);
  const gad7 = somaSemNulos(anamnese.saude_mental.gad7);
  const phq9 = somaSemNulos(anamnese.saude_mental.phq9);
  const parqPositivos = perguntasParQ.filter((p) => (anamnese.prontidao.parq as any)[p.chave] === true);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted uppercase tracking-wide">Status: {status}</p>

      <Capitulo titulo="Contexto">
        <Linha label="Idade" value={anamnese.contexto.idade} />
        <Linha label="Profissão" value={anamnese.contexto.profissao} />
        <Linha label="Rotina" value={anamnese.contexto.rotina} />
        <Linha label="Jornada (h)" value={anamnese.contexto.jornada_horas} />
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
        <Linha label="Horas de sono" value={anamnese.sono.horas_sono} />
        <Linha label="Qualidade percebida (1-5)" value={anamnese.sono.qualidade_percebida} />
        <Linha label="Dificuldade para iniciar" value={anamnese.sono.dificuldade_iniciar === null ? null : anamnese.sono.dificuldade_iniciar ? "Sim" : "Não"} />
        <Linha label="Despertares noturnos" value={anamnese.sono.despertares_noturnos === null ? null : anamnese.sono.despertares_noturnos ? "Sim" : "Não"} />
        <Linha label="Sonolência diurna (0-3)" value={anamnese.sono.sonolencia_diurna} />
        <Linha label="Sensação ao acordar (1-5)" value={anamnese.sono.sensacao_ao_acordar} />
      </Capitulo>

      <Capitulo titulo="Estilo de vida">
        <Linha label="Alimentação" value={anamnese.estilo_vida.alimentacao_geral} />
        <Linha label="Hidratação (L/dia)" value={anamnese.estilo_vida.hidratacao_litros_dia} />
        <Linha label="Álcool" value={anamnese.estilo_vida.alcool_frequencia} />
        <Linha label="Tabagismo" value={anamnese.estilo_vida.tabagismo} />
        <Linha label="Lazer" value={anamnese.estilo_vida.lazer} />
        <Linha label="Estresse percebido (0-10)" value={anamnese.estilo_vida.estresse_percebido} />
        <Linha label="Barreiras a exercício" value={anamnese.estilo_vida.barreiras_exercicio} />
        <Linha label="Disponibilidade de tempo" value={anamnese.estilo_vida.disponibilidade_tempo} />
        <Linha label="Rede de apoio" value={anamnese.estilo_vida.rede_apoio} />
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
    const payload = {
      ...dados,
      avaliador: userData.user?.email ?? null,
      atualizado_em: new Date().toISOString(),
    };
    await supabase
      .from("pacientes")
      .update({ [secao]: payload, atualizado_em: new Date().toISOString() })
      .eq("id", pacienteId);
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
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <Field label={suffix ? `${label} (${suffix})` : label}>
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

function AbaFisica({ pacienteId, dados, onSalvo }: { pacienteId: string; dados: any; onSalvo: () => void }) {
  const [d, setD] = useState<Record<string, string>>({
    peso_kg: dados?.peso_kg ?? "",
    altura_cm: dados?.altura_cm ?? "",
    pa_sistolica: dados?.pa_sistolica ?? "",
    pa_diastolica: dados?.pa_diastolica ?? "",
    fc_repouso: dados?.fc_repouso ?? "",
    spo2: dados?.spo2 ?? "",
    circ_cintura: dados?.circ_cintura ?? "",
    circ_quadril: dados?.circ_quadril ?? "",
    circ_panturrilha: dados?.circ_panturrilha ?? "",
    metodo_composicao: dados?.metodo_composicao ?? "",
    percentual_gordura: dados?.percentual_gordura ?? "",
    observacoes: dados?.observacoes ?? "",
  });
  const { salvar, salvando, ok } = useSalvarSecao(pacienteId, "fisica");

  const imc =
    d.peso_kg && d.altura_cm
      ? (Number(d.peso_kg) / Math.pow(Number(d.altura_cm) / 100, 2)).toFixed(1)
      : null;

  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));

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
          <Field label="IMC (calculado)">
            <div className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[15px] font-mono tabular-nums">
              {imc ?? "–"}
            </div>
          </Field>
          <NumField label="Circ. cintura" suffix="cm" value={d.circ_cintura} onChange={(v) => set("circ_cintura", v)} />
          <NumField label="Circ. quadril" suffix="cm" value={d.circ_quadril} onChange={(v) => set("circ_quadril", v)} />
          <NumField label="Circ. panturrilha" suffix="cm" value={d.circ_panturrilha} onChange={(v) => set("circ_panturrilha", v)} />
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg text-ink mb-1">Composição corporal</h3>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <Field label="Método utilizado">
            <TextInput value={d.metodo_composicao} onChange={(e) => set("metodo_composicao", e.target.value)} placeholder="Dobras cutâneas, bioimpedância..." />
          </Field>
          <NumField label="% de gordura estimado" value={d.percentual_gordura} onChange={(v) => set("percentual_gordura", v)} />
        </div>
      </div>

      <Field label="Observações do avaliador">
        <TextArea value={d.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </Field>

      <SalvarBar salvando={salvando} ok={ok} onSalvar={() => salvar(d).then(onSalvo)} />
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
  });
  const { salvar, salvando, ok } = useSalvarSecao(pacienteId, "postural");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <p className="text-sm text-muted">
        Registre observações descritivas (nunca causais) para cada vista - ver protocolo fotográfico
        padronizado no documento do Agente 4.
      </p>
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

function AbaFuncional({ pacienteId, dados, onSalvo }: { pacienteId: string; dados: any; onSalvo: () => void }) {
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
    observacoes: dados?.observacoes ?? "",
  });
  const { salvar, salvando, ok } = useSalvarSecao(pacienteId, "funcional");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <NumField label="Chair Stand" suffix="reps/30s" value={d.chair_stand_reps} onChange={(v) => set("chair_stand_reps", v)} />
        <NumField label="5x Sit-to-Stand" suffix="s" value={d.five_sts_seg} onChange={(v) => set("five_sts_seg", v)} />
        <NumField label="TUG" suffix="s" value={d.tug_seg} onChange={(v) => set("tug_seg", v)} />
        <NumField label="Apoio unipodal D" suffix="s" value={d.apoio_unipodal_d_seg} onChange={(v) => set("apoio_unipodal_d_seg", v)} />
        <NumField label="Apoio unipodal E" suffix="s" value={d.apoio_unipodal_e_seg} onChange={(v) => set("apoio_unipodal_e_seg", v)} />
        <NumField label="Velocidade de marcha" suffix="m/s" value={d.velocidade_marcha_ms} onChange={(v) => set("velocidade_marcha_ms", v)} />
        <NumField label="TC6" suffix="m" value={d.tc6_metros} onChange={(v) => set("tc6_metros", v)} />
        <NumField label="Dinamometria D" suffix="kgf" value={d.dinamometria_d_kg} onChange={(v) => set("dinamometria_d_kg", v)} />
        <NumField label="Dinamometria E" suffix="kgf" value={d.dinamometria_e_kg} onChange={(v) => set("dinamometria_e_kg", v)} />
      </div>
      <Field label="Observações do avaliador">
        <TextArea value={d.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </Field>
      <SalvarBar salvando={salvando} ok={ok} onSalvar={() => salvar(d).then(onSalvo)} />
    </div>
  );
}
