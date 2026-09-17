"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { anamneseVazia, mesclarComPadrao } from "@/lib/anamnese/defaults";
import type { Anamnese } from "@/lib/anamnese/types";
import { calcularAlertas } from "@/lib/anamnese/alerts";
import {
  Field,
  TextInput,
  TextArea,
  YesNo,
  ChoiceGroup,
  CheckboxGroup,
  Slider,
  LikertItem,
  StepShell,
} from "@/components/forms";
import {
  itensPSS10,
  escalaPSS10,
  itensGAD7,
  itensPHQ9,
  escalaFrequencia4,
  perguntasParQ,
  regioesCorporais,
  caracteristicasDor,
  bandeirasVermelhasDor,
  barreirasExercicioOpcoes,
} from "@/lib/anamnese/questionnaires";

type Stage = "identificacao" | "wizard" | "concluido";

const TOTAL_STEPS = 12;

export default function PacientePage() {
  const supabase = useMemo(() => createClient(), []);

  const [stage, setStage] = useState<Stage>("identificacao");
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [telefone, setTelefone] = useState("");

  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [anamnese, setAnamnese] = useState<Anamnese>(anamneseVazia);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function set<K extends keyof Anamnese>(capitulo: K, patch: Partial<Anamnese[K]>) {
    setAnamnese((prev) => ({ ...prev, [capitulo]: { ...prev[capitulo], ...patch } }));
  }

  async function identificar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (nome.trim().length < 3) {
      setErro("Digite seu nome completo.");
      return;
    }
    if (!dataNascimento) {
      setErro("Informe sua data de nascimento.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_or_create_paciente", {
        p_nome: nome.trim(),
        p_data_nascimento: dataNascimento,
        p_telefone: telefone || null,
        p_sexo: sexo || null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setPacienteId(row.id);
      setAnamnese(mesclarComPadrao(row.anamnese));
      setStage("wizard");
    } catch (err: any) {
      setErro("Não foi possível iniciar. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function salvar(status: "em_andamento" | "concluida") {
    if (!pacienteId) return;
    setLoading(true);
    setErro(null);
    try {
      const alertas = calcularAlertas(anamnese);
      const { error } = await supabase.rpc("save_anamnese", {
        p_id: pacienteId,
        p_nome: nome.trim(),
        p_data_nascimento: dataNascimento,
        p_anamnese: anamnese,
        p_status: status,
        p_alertas: alertas,
      });
      if (error) throw error;
      return true;
    } catch {
      setErro("Não foi possível salvar agora. Verifique sua conexão e tente novamente.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function proximo() {
    const ok = await salvar("em_andamento");
    if (!ok) return;
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  }

  function voltar() {
    if (step > 0) setStep(step - 1);
  }

  async function enviarFinal() {
    const ok = await salvar("concluida");
    if (ok) setStage("concluido");
  }

  if (stage === "identificacao") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <form onSubmit={identificar} className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 space-y-5">
          <div>
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">Anamnese</p>
            <h1 className="font-display text-2xl text-ink">Vamos começar com sua identificação</h1>
            <p className="text-muted text-sm mt-2">
              Isso garante que suas respostas fiquem salvas e você possa continuar de onde parou.
            </p>
          </div>

          <Field label="Nome completo">
            <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" required />
          </Field>
          <Field label="Data de nascimento">
            <TextInput type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required />
          </Field>
          <Field label="Sexo (opcional)">
            <TextInput value={sexo} onChange={(e) => setSexo(e.target.value)} placeholder="Ex.: feminino, masculino" />
          </Field>
          <Field label="Telefone (opcional)">
            <TextInput value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
          </Field>

          {erro && <p className="text-sm text-danger">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent text-white font-medium py-3 hover:bg-accent-dark transition disabled:opacity-60"
          >
            {loading ? "Carregando..." : "Iniciar anamnese"}
          </button>
        </form>
      </main>
    );
  }

  if (stage === "concluido") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-dark text-2xl mb-4">
            ✓
          </span>
          <h1 className="font-display text-2xl text-ink">Obrigado(a), {nome.split(" ")[0]}!</h1>
          <p className="text-muted text-sm mt-3 leading-relaxed">
            Suas respostas foram registradas com sucesso. A equipe da clínica vai usá-las para
            preparar sua avaliação presencial. Você pode fechar esta página.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span>
              Etapa {step + 1} de {TOTAL_STEPS}
            </span>
            <span>{nome}</span>
          </div>
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-accent transition-all"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          {step === 0 && (
            <StepShell title="Sobre você" subtitle="Um pouco do seu contexto diário.">
              <Field label="Qual sua idade?">
                <TextInput
                  value={anamnese.contexto.idade}
                  onChange={(e) => set("contexto", { idade: e.target.value })}
                  placeholder="Ex.: 42"
                />
              </Field>
              <Field label="Qual sua profissão?">
                <TextInput
                  value={anamnese.contexto.profissao}
                  onChange={(e) => set("contexto", { profissao: e.target.value })}
                />
              </Field>
              <Field label="Como é sua rotina diária, de forma geral?">
                <TextArea
                  value={anamnese.contexto.rotina}
                  onChange={(e) => set("contexto", { rotina: e.target.value })}
                />
              </Field>
              <Field label="Quantas horas por dia você trabalha, em média?">
                <TextInput
                  value={anamnese.contexto.jornada_horas}
                  onChange={(e) => set("contexto", { jornada_horas: e.target.value })}
                />
              </Field>
              <Field label="Seu trabalho exige esforço físico? De que tipo?">
                <TextArea
                  value={anamnese.contexto.demanda_fisica_trabalho}
                  onChange={(e) => set("contexto", { demanda_fisica_trabalho: e.target.value })}
                />
              </Field>
              <Field label="Quantas horas por dia você passa sentado(a), aproximadamente?">
                <TextInput
                  value={anamnese.contexto.tempo_sentado_horas}
                  onChange={(e) => set("contexto", { tempo_sentado_horas: e.target.value })}
                />
              </Field>
              <Field label="Quais atividades fazem parte do seu dia a dia?">
                <TextArea
                  value={anamnese.contexto.atividades_diarias}
                  onChange={(e) => set("contexto", { atividades_diarias: e.target.value })}
                />
              </Field>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="O que te trouxe até aqui" subtitle="Queremos entender de verdade o que você busca.">
              <Field label="O que te motivou a procurar a clínica?">
                <TextArea
                  value={anamnese.motivo.motivo_procura}
                  onChange={(e) => set("motivo", { motivo_procura: e.target.value })}
                />
              </Field>
              <Field label="Qual sua principal queixa hoje?">
                <TextArea
                  value={anamnese.motivo.queixa_principal}
                  onChange={(e) => set("motivo", { queixa_principal: e.target.value })}
                />
              </Field>
              <Field label="O que você gostaria de melhorar?">
                <TextArea
                  value={anamnese.motivo.deseja_melhorar}
                  onChange={(e) => set("motivo", { deseja_melhorar: e.target.value })}
                />
              </Field>
              <Field label="Existe alguma atividade que você deixou de fazer por causa de alguma limitação?">
                <TextArea
                  value={anamnese.motivo.atividades_perdidas}
                  onChange={(e) => set("motivo", { atividades_perdidas: e.target.value })}
                />
              </Field>
              <Field label="Quais são seus objetivos com este acompanhamento?">
                <TextArea
                  value={anamnese.motivo.objetivos}
                  onChange={(e) => set("motivo", { objetivos: e.target.value })}
                />
              </Field>
              <Field label="O que você espera da clínica?">
                <TextArea
                  value={anamnese.motivo.expectativas}
                  onChange={(e) => set("motivo", { expectativas: e.target.value })}
                />
              </Field>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="Histórico de saúde">
              <Field label="Você tem alguma doença diagnosticada?">
                <TextArea value={anamnese.historico_saude.doencas} onChange={(e) => set("historico_saude", { doencas: e.target.value })} />
              </Field>
              <Field label="Já realizou alguma cirurgia?">
                <TextArea value={anamnese.historico_saude.cirurgias} onChange={(e) => set("historico_saude", { cirurgias: e.target.value })} />
              </Field>
              <Field label="Já teve alguma hospitalização relevante?">
                <TextArea
                  value={anamnese.historico_saude.hospitalizacoes}
                  onChange={(e) => set("historico_saude", { hospitalizacoes: e.target.value })}
                />
              </Field>
              <Field label="Já teve lesões ou fraturas?">
                <TextArea
                  value={anamnese.historico_saude.lesoes_fraturas}
                  onChange={(e) => set("historico_saude", { lesoes_fraturas: e.target.value })}
                />
              </Field>
              <Field label="Você sofreu alguma queda nos últimos 12 meses?">
                <YesNo
                  value={anamnese.historico_saude.quedas_12m}
                  onChange={(v) => set("historico_saude", { quedas_12m: v })}
                />
              </Field>
              {anamnese.historico_saude.quedas_12m && (
                <Field label="Pode contar como foi?">
                  <TextArea
                    value={anamnese.historico_saude.quedas_detalhe}
                    onChange={(e) => set("historico_saude", { quedas_detalhe: e.target.value })}
                  />
                </Field>
              )}
              <Field label="Já fez algum tratamento anterior relevante (fisioterapia, outros)?">
                <TextArea
                  value={anamnese.historico_saude.tratamentos_anteriores}
                  onChange={(e) => set("historico_saude", { tratamentos_anteriores: e.target.value })}
                />
              </Field>
              <Field label="Você tem acompanhamento médico atual?">
                <TextArea
                  value={anamnese.historico_saude.acompanhamento_medico}
                  onChange={(e) => set("historico_saude", { acompanhamento_medico: e.target.value })}
                />
              </Field>
              <Field label="Outras condições de saúde que considere relevantes?">
                <TextArea
                  value={anamnese.historico_saude.outras_condicoes}
                  onChange={(e) => set("historico_saude", { outras_condicoes: e.target.value })}
                />
              </Field>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="Medicamentos" subtitle="Não vamos opinar sobre eles - só precisamos registrar.">
              <Field label="Você usa algum medicamento atualmente?">
                <YesNo value={anamnese.medicamentos.usa_medicamentos} onChange={(v) => set("medicamentos", { usa_medicamentos: v })} />
              </Field>
              {anamnese.medicamentos.usa_medicamentos && (
                <div className="space-y-4">
                  {anamnese.medicamentos.lista.map((med, i) => (
                    <div key={i} className="rounded-lg border border-border p-4 space-y-3 relative">
                      <button
                        type="button"
                        onClick={() =>
                          set("medicamentos", { lista: anamnese.medicamentos.lista.filter((_, idx) => idx !== i) })
                        }
                        className="absolute top-3 right-3 text-xs text-muted hover:text-danger"
                      >
                        remover
                      </button>
                      <Field label="Nome do medicamento">
                        <TextInput
                          value={med.nome}
                          onChange={(e) => {
                            const lista = [...anamnese.medicamentos.lista];
                            lista[i] = { ...lista[i], nome: e.target.value };
                            set("medicamentos", { lista });
                          }}
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Dose">
                          <TextInput
                            value={med.dose}
                            onChange={(e) => {
                              const lista = [...anamnese.medicamentos.lista];
                              lista[i] = { ...lista[i], dose: e.target.value };
                              set("medicamentos", { lista });
                            }}
                          />
                        </Field>
                        <Field label="Frequência">
                          <TextInput
                            value={med.frequencia}
                            onChange={(e) => {
                              const lista = [...anamnese.medicamentos.lista];
                              lista[i] = { ...lista[i], frequencia: e.target.value };
                              set("medicamentos", { lista });
                            }}
                          />
                        </Field>
                      </div>
                      <Field label="Para quê você toma?">
                        <TextInput
                          value={med.motivo}
                          onChange={(e) => {
                            const lista = [...anamnese.medicamentos.lista];
                            lista[i] = { ...lista[i], motivo: e.target.value };
                            set("medicamentos", { lista });
                          }}
                        />
                      </Field>
                      <Field label="Há quanto tempo usa?">
                        <TextInput
                          value={med.tempo_uso}
                          onChange={(e) => {
                            const lista = [...anamnese.medicamentos.lista];
                            lista[i] = { ...lista[i], tempo_uso: e.target.value };
                            set("medicamentos", { lista });
                          }}
                        />
                      </Field>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      set("medicamentos", {
                        lista: [...anamnese.medicamentos.lista, { nome: "", dose: "", frequencia: "", motivo: "", tempo_uso: "" }],
                      })
                    }
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    + Adicionar medicamento
                  </button>
                </div>
              )}
            </StepShell>
          )}

          {step === 4 && (
            <StepShell title="Histórico familiar" subtitle="Marque o que já apareceu na sua família (pais, irmãos).">
              <CheckboxGroup
                columns={2}
                options={[
                  "Hipertensão",
                  "Diabetes",
                  "Doença cardiovascular",
                  "AVC",
                  "Morte cardiovascular precoce",
                  "Obesidade",
                  "Doença metabólica",
                ]}
                values={[
                  anamnese.historico_familiar.hipertensao && "Hipertensão",
                  anamnese.historico_familiar.diabetes && "Diabetes",
                  anamnese.historico_familiar.doenca_cardiovascular && "Doença cardiovascular",
                  anamnese.historico_familiar.avc && "AVC",
                  anamnese.historico_familiar.morte_cardio_precoce && "Morte cardiovascular precoce",
                  anamnese.historico_familiar.obesidade && "Obesidade",
                  anamnese.historico_familiar.doenca_metabolica && "Doença metabólica",
                ].filter(Boolean) as string[]}
                onChange={(vals) =>
                  set("historico_familiar", {
                    hipertensao: vals.includes("Hipertensão"),
                    diabetes: vals.includes("Diabetes"),
                    doenca_cardiovascular: vals.includes("Doença cardiovascular"),
                    avc: vals.includes("AVC"),
                    morte_cardio_precoce: vals.includes("Morte cardiovascular precoce"),
                    obesidade: vals.includes("Obesidade"),
                    doenca_metabolica: vals.includes("Doença metabólica"),
                  })
                }
              />
              <Field label="Quer detalhar (grau de parentesco, idade, etc.)?">
                <TextArea
                  value={anamnese.historico_familiar.detalhe}
                  onChange={(e) => set("historico_familiar", { detalhe: e.target.value })}
                />
              </Field>
            </StepShell>
          )}

          {step === 5 && (
            <StepShell title="Atividade física">
              <Field label="Você pratica alguma atividade física atualmente?">
                <YesNo value={anamnese.atividade_fisica.pratica_atual} onChange={(v) => set("atividade_fisica", { pratica_atual: v })} />
              </Field>
              {anamnese.atividade_fisica.pratica_atual && (
                <>
                  <Field label="Quais modalidades?">
                    <TextInput
                      value={anamnese.atividade_fisica.modalidades}
                      onChange={(e) => set("atividade_fisica", { modalidades: e.target.value })}
                    />
                  </Field>
                  <Field label="Há quanto tempo treina?">
                    <TextInput
                      value={anamnese.atividade_fisica.tempo_treinamento}
                      onChange={(e) => set("atividade_fisica", { tempo_treinamento: e.target.value })}
                    />
                  </Field>
                </>
              )}
              <Field label="Já teve alguma interrupção importante no treino? Por quê?">
                <TextArea
                  value={anamnese.atividade_fisica.interrupcoes}
                  onChange={(e) => set("atividade_fisica", { interrupcoes: e.target.value })}
                />
              </Field>

              <div className="pt-2 border-t border-border">
                <p className="text-sm font-medium text-ink mb-3">Nos últimos 7 dias...</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Dias de atividade vigorosa">
                      <TextInput
                        value={anamnese.atividade_fisica.ipaq.dias_vigorosa}
                        onChange={(e) => set("atividade_fisica", { ipaq: { ...anamnese.atividade_fisica.ipaq, dias_vigorosa: e.target.value } })}
                      />
                    </Field>
                    <Field label="Minutos por dia">
                      <TextInput
                        value={anamnese.atividade_fisica.ipaq.min_vigorosa_dia}
                        onChange={(e) => set("atividade_fisica", { ipaq: { ...anamnese.atividade_fisica.ipaq, min_vigorosa_dia: e.target.value } })}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Dias de atividade moderada">
                      <TextInput
                        value={anamnese.atividade_fisica.ipaq.dias_moderada}
                        onChange={(e) => set("atividade_fisica", { ipaq: { ...anamnese.atividade_fisica.ipaq, dias_moderada: e.target.value } })}
                      />
                    </Field>
                    <Field label="Minutos por dia">
                      <TextInput
                        value={anamnese.atividade_fisica.ipaq.min_moderada_dia}
                        onChange={(e) => set("atividade_fisica", { ipaq: { ...anamnese.atividade_fisica.ipaq, min_moderada_dia: e.target.value } })}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Dias de caminhada">
                      <TextInput
                        value={anamnese.atividade_fisica.ipaq.dias_caminhada}
                        onChange={(e) => set("atividade_fisica", { ipaq: { ...anamnese.atividade_fisica.ipaq, dias_caminhada: e.target.value } })}
                      />
                    </Field>
                    <Field label="Minutos por dia">
                      <TextInput
                        value={anamnese.atividade_fisica.ipaq.min_caminhada_dia}
                        onChange={(e) => set("atividade_fisica", { ipaq: { ...anamnese.atividade_fisica.ipaq, min_caminhada_dia: e.target.value } })}
                      />
                    </Field>
                  </div>
                  <Field label="Quantas horas por dia você fica sentado(a)?">
                    <TextInput
                      value={anamnese.atividade_fisica.ipaq.horas_sentado_dia}
                      onChange={(e) => set("atividade_fisica", { ipaq: { ...anamnese.atividade_fisica.ipaq, horas_sentado_dia: e.target.value } })}
                    />
                  </Field>
                </div>
              </div>
            </StepShell>
          )}

          {step === 6 && (
            <StepShell title="Sono">
              <Field label="Em média, quantas horas você dorme por noite?">
                <TextInput value={anamnese.sono.horas_sono} onChange={(e) => set("sono", { horas_sono: e.target.value })} />
              </Field>
              <Field label="Como você avalia a qualidade do seu sono?">
                <ChoiceGroup
                  columns={5}
                  options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
                  value={anamnese.sono.qualidade_percebida}
                  onChange={(v) => set("sono", { qualidade_percebida: v })}
                />
                <p className="text-xs text-muted mt-1">1 = muito ruim · 5 = muito boa</p>
              </Field>
              <Field label="Você tem dificuldade para pegar no sono?">
                <YesNo value={anamnese.sono.dificuldade_iniciar} onChange={(v) => set("sono", { dificuldade_iniciar: v })} />
              </Field>
              <Field label="Você acorda no meio da noite com frequência?">
                <YesNo value={anamnese.sono.despertares_noturnos} onChange={(v) => set("sono", { despertares_noturnos: v })} />
              </Field>
              <Field label="Sente sonolência durante o dia?">
                <ChoiceGroup
                  columns={4}
                  options={[
                    { value: 0, label: "Nunca" },
                    { value: 1, label: "Às vezes" },
                    { value: 2, label: "Frequente" },
                    { value: 3, label: "Sempre" },
                  ]}
                  value={anamnese.sono.sonolencia_diurna}
                  onChange={(v) => set("sono", { sonolencia_diurna: v })}
                />
              </Field>
              <Field label="Como você se sente ao acordar?">
                <ChoiceGroup
                  columns={5}
                  options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
                  value={anamnese.sono.sensacao_ao_acordar}
                  onChange={(v) => set("sono", { sensacao_ao_acordar: v })}
                />
                <p className="text-xs text-muted mt-1">1 = exausto(a) · 5 = totalmente descansado(a)</p>
              </Field>
            </StepShell>
          )}

          {step === 7 && (
            <StepShell title="Estilo de vida">
              <Field label="Como você descreveria sua alimentação, de forma geral?">
                <TextArea
                  value={anamnese.estilo_vida.alimentacao_geral}
                  onChange={(e) => set("estilo_vida", { alimentacao_geral: e.target.value })}
                />
              </Field>
              <Field label="Quantos litros de água você bebe por dia, aproximadamente?">
                <TextInput
                  value={anamnese.estilo_vida.hidratacao_litros_dia}
                  onChange={(e) => set("estilo_vida", { hidratacao_litros_dia: e.target.value })}
                />
              </Field>
              <Field label="Com que frequência você consome bebida alcoólica?">
                <TextInput
                  value={anamnese.estilo_vida.alcool_frequencia}
                  onChange={(e) => set("estilo_vida", { alcool_frequencia: e.target.value })}
                />
              </Field>
              <Field label="Você fuma?">
                <TextInput value={anamnese.estilo_vida.tabagismo} onChange={(e) => set("estilo_vida", { tabagismo: e.target.value })} />
              </Field>
              <Field label="O que você costuma fazer no seu tempo de lazer?">
                <TextInput value={anamnese.estilo_vida.lazer} onChange={(e) => set("estilo_vida", { lazer: e.target.value })} />
              </Field>
              <Field label="De 0 a 10, o quanto você se sente estressado(a) atualmente?">
                <Slider
                  min={0}
                  max={10}
                  value={anamnese.estilo_vida.estresse_percebido}
                  onChange={(v) => set("estilo_vida", { estresse_percebido: v })}
                  labelMin="nada estressado(a)"
                  labelMax="extremamente estressado(a)"
                />
              </Field>
              <Field label="O que mais dificulta você praticar exercícios?">
                <CheckboxGroup
                  columns={2}
                  options={barreirasExercicioOpcoes}
                  values={anamnese.estilo_vida.barreiras_exercicio}
                  onChange={(v) => set("estilo_vida", { barreiras_exercicio: v })}
                />
              </Field>
              <Field label="Quanto tempo você teria disponível por semana para se dedicar a isso?">
                <TextInput
                  value={anamnese.estilo_vida.disponibilidade_tempo}
                  onChange={(e) => set("estilo_vida", { disponibilidade_tempo: e.target.value })}
                />
              </Field>
              <Field label="Você conta com apoio de familiares/amigos para cuidar da sua saúde?">
                <TextInput
                  value={anamnese.estilo_vida.rede_apoio}
                  onChange={(e) => set("estilo_vida", { rede_apoio: e.target.value })}
                />
              </Field>
            </StepShell>
          )}

          {step === 8 && (
            <StepShell title="Dor">
              <Field label="Você sente alguma dor atualmente?">
                <YesNo value={anamnese.dor.tem_dor} onChange={(v) => set("dor", { tem_dor: v })} />
              </Field>
              {anamnese.dor.tem_dor && (
                <>
                  <Field label="Onde você sente dor? (pode marcar mais de uma região)">
                    <CheckboxGroup columns={2} options={regioesCorporais} values={anamnese.dor.localizacoes} onChange={(v) => set("dor", { localizacoes: v })} />
                  </Field>
                  <Field label="De 0 (sem dor) a 10 (pior dor imaginável), qual a intensidade?">
                    <Slider
                      min={0}
                      max={10}
                      value={anamnese.dor.intensidade_nrs}
                      onChange={(v) => set("dor", { intensidade_nrs: v })}
                      labelMin="sem dor"
                      labelMax="pior dor imaginável"
                    />
                  </Field>
                  <Field label="Há quanto tempo você sente essa dor?">
                    <TextInput value={anamnese.dor.duracao} onChange={(e) => set("dor", { duracao: e.target.value })} />
                  </Field>
                  <Field label="Com que frequência ela aparece?">
                    <TextInput value={anamnese.dor.frequencia} onChange={(e) => set("dor", { frequencia: e.target.value })} />
                  </Field>
                  <Field label="Como você descreveria essa dor?">
                    <CheckboxGroup columns={3} options={caracteristicasDor} values={anamnese.dor.caracteristicas} onChange={(v) => set("dor", { caracteristicas: v })} />
                  </Field>
                  <Field label="Como e quando ela começou?">
                    <TextArea value={anamnese.dor.inicio} onChange={(e) => set("dor", { inicio: e.target.value })} />
                  </Field>
                  <Field label="O que piora a dor?">
                    <TextInput value={anamnese.dor.agravantes} onChange={(e) => set("dor", { agravantes: e.target.value })} />
                  </Field>
                  <Field label="O que melhora a dor?">
                    <TextInput value={anamnese.dor.atenuantes} onChange={(e) => set("dor", { atenuantes: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field label="Dor em repouso?">
                      <YesNo value={anamnese.dor.dor_repouso} onChange={(v) => set("dor", { dor_repouso: v })} />
                    </Field>
                    <Field label="Dor ao se mover?">
                      <YesNo value={anamnese.dor.dor_movimento} onChange={(v) => set("dor", { dor_movimento: v })} />
                    </Field>
                    <Field label="Dor à noite?">
                      <YesNo value={anamnese.dor.dor_noturna} onChange={(v) => set("dor", { dor_noturna: v })} />
                    </Field>
                  </div>
                  <Field label="Você já fez algum tratamento para essa dor?">
                    <TextArea
                      value={anamnese.dor.tratamentos_anteriores}
                      onChange={(e) => set("dor", { tratamentos_anteriores: e.target.value })}
                    />
                  </Field>
                  <Field label="Você apresenta algum destes sinais junto com a dor? (marque se houver)">
                    <CheckboxGroup
                      columns={1}
                      options={bandeirasVermelhasDor}
                      values={anamnese.dor.bandeiras_vermelhas}
                      onChange={(v) => set("dor", { bandeiras_vermelhas: v })}
                    />
                  </Field>
                </>
              )}
            </StepShell>
          )}

          {step === 9 && (
            <StepShell title="Saúde mental e bem-estar" subtitle="Isso é só uma triagem para orientar seu cuidado - não é diagnóstico.">
              <Field label="Como você avalia sua saúde de forma geral?">
                <ChoiceGroup
                  columns={5}
                  options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
                  value={anamnese.saude_mental.percepcao_saude}
                  onChange={(v) => set("saude_mental", { percepcao_saude: v })}
                />
                <p className="text-xs text-muted mt-1">1 = muito ruim · 5 = muito boa</p>
              </Field>

              <div>
                <p className="font-medium text-ink mb-1">Estresse percebido (últimas 4 semanas)</p>
                {itensPSS10.map((texto, i) => (
                  <LikertItem
                    key={i}
                    texto={texto}
                    numero={i + 1}
                    total={10}
                    opcoes={escalaPSS10}
                    value={anamnese.saude_mental.pss10[i]}
                    onChange={(v) => {
                      const arr = [...anamnese.saude_mental.pss10];
                      arr[i] = v;
                      set("saude_mental", { pss10: arr });
                    }}
                  />
                ))}
              </div>

              <div>
                <p className="font-medium text-ink mb-1 pt-2">Ansiedade (últimas 2 semanas)</p>
                {itensGAD7.map((texto, i) => (
                  <LikertItem
                    key={i}
                    texto={texto}
                    numero={i + 1}
                    total={7}
                    opcoes={escalaFrequencia4}
                    value={anamnese.saude_mental.gad7[i]}
                    onChange={(v) => {
                      const arr = [...anamnese.saude_mental.gad7];
                      arr[i] = v;
                      set("saude_mental", { gad7: arr });
                    }}
                  />
                ))}
              </div>

              <div>
                <p className="font-medium text-ink mb-1 pt-2">Humor (últimas 2 semanas)</p>
                {itensPHQ9.map((texto, i) => (
                  <LikertItem
                    key={i}
                    texto={texto}
                    numero={i + 1}
                    total={9}
                    opcoes={escalaFrequencia4}
                    value={anamnese.saude_mental.phq9[i]}
                    onChange={(v) => {
                      const arr = [...anamnese.saude_mental.phq9];
                      arr[i] = v;
                      set("saude_mental", { phq9: arr });
                    }}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {step === 10 && (
            <StepShell title="Prontidão para atividade física" subtitle="Perguntas de segurança, antes de qualquer teste físico.">
              {perguntasParQ.map((p) => (
                <Field key={p.chave} label={p.texto}>
                  <YesNo
                    value={(anamnese.prontidao.parq as any)[p.chave]}
                    onChange={(v) => set("prontidao", { parq: { ...anamnese.prontidao.parq, [p.chave]: v } })}
                  />
                </Field>
              ))}
              {anamnese.prontidao.parq.other_reason && (
                <Field label="Pode explicar melhor?">
                  <TextArea
                    value={anamnese.prontidao.other_reason_detalhe}
                    onChange={(e) => set("prontidao", { other_reason_detalhe: e.target.value })}
                  />
                </Field>
              )}
            </StepShell>
          )}

          {step === 11 && (
            <StepShell title="Quase lá" subtitle="Confira e envie suas respostas.">
              <p className="text-sm text-muted leading-relaxed">
                Obrigado por responder com atenção. Ao enviar, sua equipe de saúde vai revisar suas
                respostas antes da sua avaliação presencial. Se alguma resposta te deixou em dúvida,
                você pode voltar e ajustar antes de enviar.
              </p>
            </StepShell>
          )}

          {erro && <p className="text-sm text-danger mt-4">{erro}</p>}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={voltar}
              disabled={step === 0 || loading}
              className="text-sm font-medium text-muted hover:text-ink disabled:opacity-40"
            >
              ← Voltar
            </button>
            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={proximo}
                disabled={loading}
                className="rounded-lg bg-accent text-white font-medium px-6 py-2.5 hover:bg-accent-dark transition disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Próximo →"}
              </button>
            ) : (
              <button
                type="button"
                onClick={enviarFinal}
                disabled={loading}
                className="rounded-lg bg-accent text-white font-medium px-6 py-2.5 hover:bg-accent-dark transition disabled:opacity-60"
              >
                {loading ? "Enviando..." : "Enviar anamnese"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
