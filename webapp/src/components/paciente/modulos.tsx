"use client";

// Modulos complementares do questionario do paciente - cada um pode ser respondido
// a parte do questionario base (pagina /paciente/modulo/[modulo]).

import type { ReactNode } from "react";
import type { Anamnese } from "@/lib/anamnese/types";
import { precisaInstrumentoCompleto } from "@/lib/anamnese/alerts";
import { Field, TextInput, TextArea, YesNo, ChoiceGroup, CheckboxGroup, Slider, LikertItem } from "@/components/forms";
import {
  itensPSS10,
  escalaPSS10,
  itensGAD7,
  itensPHQ9,
  escalaFrequencia4,
  caracteristicasDor,
  barreirasExercicioOpcoes,
  opcoesHidratacao,
  opcoesAlcool,
  opcoesLazer,
  opcoesDisponibilidadeTempo,
  itensTSK11,
  escalaTSK11,
  itensPSEQ,
  escalaPSEQ,
  opcoesQualidadeSonoPSQI,
  opcoesFrequenciaPSQI,
  opcoesProblemaPSQI,
  indicePHQ9Ideacao,
} from "@/lib/anamnese/questionnaires";

export type SetAnamnese = <K extends keyof Anamnese>(capitulo: K, patch: Partial<Anamnese[K]>) => void;
export type ModuloProps = { anamnese: Anamnese; set: SetAnamnese };

export function ModuloBemEstar({ anamnese, set }: ModuloProps) {
  return (
    <>
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
                    texto={texto.replace(" (invertido)", "")}
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
                {itensGAD7.slice(0, 2).map((texto, i) => (
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
                {precisaInstrumentoCompleto(anamnese.saude_mental.gad7) &&
                  itensGAD7.slice(2).map((texto, idx) => {
                    const i = idx + 2;
                    return (
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
                    );
                  })}
              </div>

              <div>
                <p className="font-medium text-ink mb-1 pt-2">Humor (últimas 2 semanas)</p>
                {itensPHQ9.slice(0, 2).map((texto, i) => (
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
                {precisaInstrumentoCompleto(anamnese.saude_mental.phq9) &&
                  itensPHQ9.slice(2, indicePHQ9Ideacao).map((texto, idx) => {
                    const i = idx + 2;
                    return (
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
                    );
                  })}
                {/* Item de ideação/autolesão sempre perguntado, mesmo quando o
                    restante do PHQ-9 foi dispensado pela triagem curta - é
                    sensível demais para pular. */}
                <LikertItem
                  texto={itensPHQ9[indicePHQ9Ideacao]}
                  numero={indicePHQ9Ideacao + 1}
                  total={9}
                  opcoes={escalaFrequencia4}
                  value={anamnese.saude_mental.phq9[indicePHQ9Ideacao]}
                  onChange={(v) => {
                    const arr = [...anamnese.saude_mental.phq9];
                    arr[indicePHQ9Ideacao] = v;
                    set("saude_mental", { phq9: arr });
                  }}
                />
              </div>
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
    </>
  );
}

export function ModuloSono({ anamnese, set }: ModuloProps) {
  return (
    <>
              <Field label="No último mês, como você avaliaria a qualidade geral do seu sono?">
                <ChoiceGroup
                  columns={4}
                  options={opcoesQualidadeSonoPSQI.map((o, i) => ({ value: i, label: o }))}
                  value={anamnese.psqi.qualidade_subjetiva}
                  onChange={(v) => set("psqi", { qualidade_subjetiva: v })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="A que horas você costuma deitar?">
                  <TextInput type="time" value={anamnese.psqi.hora_deitar} onChange={(e) => set("psqi", { hora_deitar: e.target.value })} />
                </Field>
                <Field label="A que horas você costuma acordar?">
                  <TextInput type="time" value={anamnese.psqi.hora_acordar} onChange={(e) => set("psqi", { hora_acordar: e.target.value })} />
                </Field>
                <Field label="Quantos minutos você leva, em média, para pegar no sono?">
                  <TextInput inputMode="numeric" value={anamnese.psqi.minutos_para_adormecer} onChange={(e) => set("psqi", { minutos_para_adormecer: e.target.value })} />
                </Field>
                <Field label="Quantas horas você realmente dorme por noite?">
                  <TextInput inputMode="decimal" value={anamnese.psqi.horas_dormidas_noite} onChange={(e) => set("psqi", { horas_dormidas_noite: e.target.value })} />
                </Field>
              </div>
              <Field label="Com que frequência você demora mais de 30 minutos para pegar no sono?">
                <ChoiceGroup
                  columns={2}
                  options={opcoesFrequenciaPSQI.map((o, i) => ({ value: i, label: o }))}
                  value={anamnese.psqi.freq_demora_adormecer}
                  onChange={(v) => set("psqi", { freq_demora_adormecer: v })}
                />
              </Field>

              <p className="font-medium text-ink pt-2">Nas últimas 4 semanas, com que frequência você teve problemas de sono por causa de...</p>
              {([
                ["acordar no meio da noite ou de madrugada", "freq_acorda_meio_noite"],
                ["precisar levantar para ir ao banheiro", "freq_banheiro"],
                ["não conseguir respirar bem", "freq_respirar_mal"],
                ["tossir ou roncar alto", "freq_tosse_ronco"],
                ["sentir muito frio", "freq_frio"],
                ["sentir muito calor", "freq_calor"],
                ["ter pesadelos", "freq_pesadelos"],
                ["sentir dor", "freq_dor"],
              ] as const).map(([rotulo, chave]) => (
                <Field key={chave} label={rotulo}>
                  <ChoiceGroup
                    columns={4}
                    options={opcoesFrequenciaPSQI.map((o, i) => ({ value: i, label: o }))}
                    value={anamnese.psqi[chave]}
                    onChange={(v) => set("psqi", { [chave]: v } as Partial<Anamnese["psqi"]>)}
                  />
                </Field>
              ))}
              <Field label="Outro motivo? Descreva, se houver">
                <TextInput value={anamnese.psqi.outro_motivo_texto} onChange={(e) => set("psqi", { outro_motivo_texto: e.target.value })} />
              </Field>
              {anamnese.psqi.outro_motivo_texto && (
                <Field label="Com que frequência esse outro motivo atrapalhou seu sono?">
                  <ChoiceGroup
                    columns={4}
                    options={opcoesFrequenciaPSQI.map((o, i) => ({ value: i, label: o }))}
                    value={anamnese.psqi.freq_outro_motivo}
                    onChange={(v) => set("psqi", { freq_outro_motivo: v })}
                  />
                </Field>
              )}

              <Field label="Com que frequência você tomou algum remédio para dormir (com ou sem receita)?">
                <ChoiceGroup
                  columns={4}
                  options={opcoesFrequenciaPSQI.map((o, i) => ({ value: i, label: o }))}
                  value={anamnese.psqi.freq_medicamento_para_dormir}
                  onChange={(v) => set("psqi", { freq_medicamento_para_dormir: v })}
                />
              </Field>
              <Field label="Com que frequência você teve dificuldade para ficar acordado(a) dirigindo, comendo ou em atividades sociais?">
                <ChoiceGroup
                  columns={4}
                  options={opcoesFrequenciaPSQI.map((o, i) => ({ value: i, label: o }))}
                  value={anamnese.psqi.freq_sonolencia_atividades}
                  onChange={(v) => set("psqi", { freq_sonolencia_atividades: v })}
                />
              </Field>
              <Field label="O quanto foi um problema manter o entusiasmo para fazer as coisas?">
                <ChoiceGroup
                  columns={4}
                  options={opcoesProblemaPSQI.map((o, i) => ({ value: i, label: o }))}
                  value={anamnese.psqi.freq_falta_entusiasmo}
                  onChange={(v) => set("psqi", { freq_falta_entusiasmo: v })}
                />
              </Field>
    </>
  );
}

export function ModuloDorDetalhes({ anamnese, set }: ModuloProps) {
  return (
    <>
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
                  <div>
                    <p className="font-medium text-ink mb-1 pt-2">O que você pensa sobre se movimentar com essa dor</p>
                    {itensTSK11.map((texto, i) => (
                      <LikertItem
                        key={i}
                        texto={texto.replace(" (invertido)", "")}
                        numero={i + 1}
                        total={11}
                        opcoes={escalaTSK11}
                        value={anamnese.dor.tsk11[i]}
                        onChange={(v) => {
                          const arr = [...anamnese.dor.tsk11];
                          arr[i] = v;
                          set("dor", { tsk11: arr });
                        }}
                      />
                    ))}
                  </div>

                  <div>
                    <p className="font-medium text-ink mb-1 pt-2">O quanto você se sente confiante para fazer isso, apesar da dor</p>
                    {itensPSEQ.map((texto, i) => (
                      <LikertItem
                        key={i}
                        texto={texto}
                        numero={i + 1}
                        total={10}
                        opcoes={escalaPSEQ}
                        value={anamnese.dor.pseq[i]}
                        onChange={(v) => {
                          const arr = [...anamnese.dor.pseq];
                          arr[i] = v;
                          set("dor", { pseq: arr });
                        }}
                      />
                    ))}
                  </div>
    </>
  );
}

export function ModuloEstiloDeVida({ anamnese, set }: ModuloProps) {
  return (
    <>
              <Field label="Como você avalia sua alimentação, de forma geral?">
                <ChoiceGroup
                  columns={5}
                  options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))}
                  value={anamnese.estilo_vida.alimentacao_avaliacao}
                  onChange={(v) => set("estilo_vida", { alimentacao_avaliacao: v })}
                />
                <p className="text-xs text-muted mt-1">1 = muito ruim · 5 = muito boa</p>
              </Field>
              <Field label="Quer detalhar? (opcional)">
                <TextArea
                  value={anamnese.estilo_vida.alimentacao_geral}
                  onChange={(e) => set("estilo_vida", { alimentacao_geral: e.target.value })}
                />
              </Field>
              <Field label="Quantos litros de água você bebe por dia, aproximadamente?">
                <ChoiceGroup
                  columns={3}
                  options={opcoesHidratacao.map((o) => ({ value: o, label: o }))}
                  value={anamnese.estilo_vida.hidratacao_litros_dia || null}
                  onChange={(v) => set("estilo_vida", { hidratacao_litros_dia: v })}
                />
              </Field>
              <Field label="Com que frequência você consome bebida alcoólica?">
                <ChoiceGroup
                  columns={2}
                  options={opcoesAlcool.map((o) => ({ value: o, label: o }))}
                  value={anamnese.estilo_vida.alcool_frequencia || null}
                  onChange={(v) => set("estilo_vida", { alcool_frequencia: v })}
                />
              </Field>
              <Field label="O que você costuma fazer no seu tempo de lazer? (pode marcar mais de um)">
                <CheckboxGroup
                  columns={2}
                  options={opcoesLazer}
                  values={anamnese.estilo_vida.lazer_opcoes}
                  onChange={(v) => set("estilo_vida", { lazer_opcoes: v })}
                />
              </Field>
              <Field label="Outro, não listado acima? (opcional)">
                <TextInput value={anamnese.estilo_vida.lazer} onChange={(e) => set("estilo_vida", { lazer: e.target.value })} />
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
                <ChoiceGroup
                  columns={2}
                  options={opcoesDisponibilidadeTempo.map((o) => ({ value: o, label: o }))}
                  value={anamnese.estilo_vida.disponibilidade_tempo || null}
                  onChange={(v) => set("estilo_vida", { disponibilidade_tempo: v })}
                />
              </Field>
              <Field label="Você conta com apoio de familiares/amigos para cuidar da sua saúde?">
                <YesNo value={anamnese.estilo_vida.conta_com_apoio} onChange={(v) => set("estilo_vida", { conta_com_apoio: v })} />
              </Field>
              {anamnese.estilo_vida.conta_com_apoio && (
                <Field label="Quer contar mais? (opcional)">
                  <TextInput
                    value={anamnese.estilo_vida.rede_apoio}
                    onChange={(e) => set("estilo_vida", { rede_apoio: e.target.value })}
                  />
                </Field>
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
    </>
  );
}
