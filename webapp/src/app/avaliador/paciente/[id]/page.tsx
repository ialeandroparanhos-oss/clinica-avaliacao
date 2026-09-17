"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import type { Anamnese, PacienteRow } from "@/lib/anamnese/types";
import { escorePSS10, somaSemNulos, rotuloNivel } from "@/lib/anamnese/alerts";
import { AlertBanner, Field, TextArea, TextInput } from "@/components/forms";
import { perguntasParQ } from "@/lib/anamnese/questionnaires";

type Aba = "anamnese" | "fisica" | "postural" | "funcional";

export default function DetalhePaciente() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [paciente, setPaciente] = useState<PacienteRow | null>(null);
  const [aba, setAba] = useState<Aba>("anamnese");
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

      {aba === "anamnese" && <AbaAnamnese anamnese={anamnese} status={paciente.anamnese_status} />}
      {aba === "fisica" && <AbaFisica pacienteId={paciente.id} dados={paciente.fisica} onSalvo={carregar} />}
      {aba === "postural" && <AbaPostural pacienteId={paciente.id} dados={paciente.postural} onSalvo={carregar} />}
      {aba === "funcional" && <AbaFuncional pacienteId={paciente.id} dados={paciente.funcional} onSalvo={carregar} />}
    </main>
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
