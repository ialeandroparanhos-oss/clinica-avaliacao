"use client";

import { useEffect, useMemo, useState } from "react";
import { Marca } from "@/components/Marca";
import { createClient } from "@/lib/supabase/client";
import { anamneseVazia, mesclarComPadrao } from "@/lib/anamnese/defaults";
import type { Anamnese } from "@/lib/anamnese/types";
import { calcularAlertas, precisaInstrumentoCompleto } from "@/lib/anamnese/alerts";
import { Field, TextInput, TextArea, YesNo, ChoiceGroup, CheckboxGroup, StepShell } from "@/components/forms";
import { MapaDor } from "@/components/paciente/MapaDor";
import {
  perguntasParQ,
  bandeirasVermelhasDor,
  opcoesTabagismo,
  opcoesDificuldadesDiaADia,
  opcoesSinalizacaoBemEstar,
} from "@/lib/anamnese/questionnaires";
import { MODULOS, moduloSinalizado, statusModulo } from "@/lib/anamnese/modulos";
import { idadeDaDataNascimento } from "@/lib/avaliacao/identificacao";
import { CHAVE_IDENTIFICACAO } from "@/lib/anamnese/identificacaoSessao";

type Stage = "identificacao" | "wizard" | "concluido";

// Questionário base curto. Instrumentos longos ou sensíveis (bem-estar
// emocional, sono em detalhe, dor em detalhe, estilo de vida) ficam em
// módulos à parte - ver lib/anamnese/modulos.ts.
const TOTAL_STEPS = 7;

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
  const [salvandoFundo, setSalvandoFundo] = useState(false);
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
      // Guarda a identificação nesta aba para os módulos complementares não
      // pedirem tudo de novo (some ao fechar a aba).
      try {
        sessionStorage.setItem(CHAVE_IDENTIFICACAO, JSON.stringify({ nome: nome.trim(), dataNascimento }));
      } catch {}
      setStage("wizard");
    } catch (err: any) {
      setErro("Não foi possível iniciar. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Salva sem travar a navegação - Sofia (anamnese) não faz o paciente
  // esperar a rede para virar a página. Sempre envia o objeto completo da
  // anamnese, então uma tentativa que falhar é coberta pela próxima que
  // tiver sucesso (nenhum dado se perde, só o indicador visual atrasa).
  async function salvarSilencioso(status: "em_andamento" | "concluida") {
    if (!pacienteId) return false;
    setSalvandoFundo(true);
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
      setErro(null);
      return true;
    } catch {
      setErro("Não foi possível salvar a última resposta agora - suas respostas continuam aqui na tela e tentaremos de novo ao avançar.");
      return false;
    } finally {
      setSalvandoFundo(false);
    }
  }

  function proximo() {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    salvarSilencioso("em_andamento");
  }

  function voltar() {
    if (step > 0) setStep(step - 1);
  }

  async function enviarFinal() {
    setLoading(true);
    const ok = await salvarSilencioso("concluida");
    setLoading(false);
    if (ok) setStage("concluido");
  }

  // Atalho de teclado: Enter avança para a próxima etapa (exceto dentro de
  // um campo de texto multilinha, onde Enter deve só quebrar a linha).
  useEffect(() => {
    if (stage !== "wizard") return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      const alvo = e.target as HTMLElement;
      if (alvo.tagName === "TEXTAREA") return;
      e.preventDefault();
      if (step < TOTAL_STEPS - 1) proximo();
      else enviarFinal();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, step, anamnese, pacienteId]);

  if (stage === "identificacao") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <form onSubmit={identificar} className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 space-y-5">
          <div>
            <Marca compacta />
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
    // Todos os módulos ainda não respondidos são oferecidos (opcionais); os
    // recomendados pelas respostas do base vêm primeiro, destacados.
    const idadePaciente = idadeDaDataNascimento(dataNascimento);
    const modulosPendentes = MODULOS.filter((m) => statusModulo(anamnese, m.id, idadePaciente) !== "respondido")
      .filter((m) => m.id !== "capacidade-60" || (idadePaciente !== null && idadePaciente >= 60))
      .map((m) => ({ ...m, recomendado: moduloSinalizado(anamnese, m.id, idadePaciente) }))
      .sort((a, b) => Number(b.recomendado) - Number(a.recomendado));
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

          {modulosPendentes.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border text-left space-y-3">
              <p className="text-sm font-medium text-ink">Se quiser, você pode contar mais sobre (todos são opcionais):</p>
              {modulosPendentes.map((m) => (
                <div key={m.id} className={`rounded-lg border p-4 ${m.recomendado ? "border-accent/50 bg-accent/5" : "border-border"}`}>
                  <p className="font-medium text-ink text-sm">
                    {m.titulo}
                    {m.recomendado && <span className="ml-2 text-xs font-medium text-accent-dark">sugerido para você</span>}
                  </p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">
                    {m.id === "bem-estar" && m.recomendado
                      ? "Você comentou que o estresse, a ansiedade ou o humor têm pesado no seu dia a dia. Temos um questionário curto, separado e opcional - só a equipe da clínica vê as respostas."
                      : m.descricaoPaciente}{" "}
                    ({m.duracao})
                  </p>
                  <a href={`/paciente/modulo/${m.id}`} className="inline-block mt-3 text-sm font-medium text-accent hover:underline">
                    Responder agora (opcional) →
                  </a>
                </div>
              ))}
              <p className="text-xs text-muted">Você também pode deixar para depois: a equipe pode enviar o link quando preferir.</p>
            </div>
          )}
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
              <Field label="Seu trabalho exige esforço físico?">
                <YesNo
                  value={anamnese.contexto.exige_esforco_fisico}
                  onChange={(v) => set("contexto", { exige_esforco_fisico: v })}
                />
              </Field>
              {anamnese.contexto.exige_esforco_fisico && (
                <Field label="De que tipo?">
                  <TextArea
                    value={anamnese.contexto.demanda_fisica_trabalho}
                    onChange={(e) => set("contexto", { demanda_fisica_trabalho: e.target.value })}
                  />
                </Field>
              )}
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
              <Field label="Você sente dificuldade em alguma destas situações do dia a dia? (pode marcar mais de uma)">
                <CheckboxGroup
                  columns={1}
                  options={opcoesDificuldadesDiaADia}
                  values={anamnese.motivo.dificuldades}
                  onChange={(v) => {
                    // "Não tenho dificuldades" exclui as demais.
                    const nova = v.includes("Não tenho dificuldades") && !anamnese.motivo.dificuldades.includes("Não tenho dificuldades")
                      ? ["Não tenho dificuldades"]
                      : v.filter((x) => x !== "Não tenho dificuldades");
                    set("motivo", { dificuldades: nova });
                  }}
                />
              </Field>
              <Field label="Existe alguma atividade que você deixou de fazer por causa de alguma limitação?">
                <TextArea
                  value={anamnese.motivo.atividades_perdidas}
                  onChange={(e) => set("motivo", { atividades_perdidas: e.target.value })}
                />
              </Field>
              <Field label="O que você gostaria de melhorar ou alcançar com este acompanhamento?">
                <TextArea
                  value={anamnese.motivo.objetivos}
                  onChange={(e) => set("motivo", { objetivos: e.target.value })}
                />
              </Field>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell title="Sua saúde" subtitle="Só o essencial para a gente cuidar de você com segurança.">
              <Field label="Você tem alguma doença diagnosticada?">
                <YesNo value={anamnese.historico_saude.tem_doencas} onChange={(v) => set("historico_saude", { tem_doencas: v })} />
              </Field>
              {anamnese.historico_saude.tem_doencas && (
                <Field label="Qual(is)?">
                  <TextArea value={anamnese.historico_saude.doencas} onChange={(e) => set("historico_saude", { doencas: e.target.value })} />
                </Field>
              )}

              <Field label="Já realizou alguma cirurgia?">
                <YesNo value={anamnese.historico_saude.tem_cirurgias} onChange={(v) => set("historico_saude", { tem_cirurgias: v })} />
              </Field>
              {anamnese.historico_saude.tem_cirurgias && (
                <Field label="Qual(is)? Quando?">
                  <TextArea value={anamnese.historico_saude.cirurgias} onChange={(e) => set("historico_saude", { cirurgias: e.target.value })} />
                </Field>
              )}

              <Field label="Já teve lesões ou fraturas?">
                <YesNo value={anamnese.historico_saude.tem_lesoes} onChange={(v) => set("historico_saude", { tem_lesoes: v })} />
              </Field>
              {anamnese.historico_saude.tem_lesoes && (
                <Field label="Qual(is)? Onde?">
                  <TextArea
                    value={anamnese.historico_saude.lesoes_fraturas}
                    onChange={(e) => set("historico_saude", { lesoes_fraturas: e.target.value })}
                  />
                </Field>
              )}

              <Field label="Você sofreu alguma queda nos últimos 12 meses?">
                <YesNo
                  value={anamnese.historico_saude.quedas_12m}
                  onChange={(v) => set("historico_saude", { quedas_12m: v })}
                />
              </Field>

              <Field label="Você usa algum medicamento atualmente?">
                <YesNo value={anamnese.medicamentos.usa_medicamentos} onChange={(v) => set("medicamentos", { usa_medicamentos: v })} />
              </Field>
              {anamnese.medicamentos.usa_medicamentos && (
                <div className="space-y-3">
                  {anamnese.medicamentos.lista.map((med, i) => {
                    const atualizar = (patch: Partial<(typeof anamnese.medicamentos.lista)[number]>) => {
                      const lista = [...anamnese.medicamentos.lista];
                      lista[i] = { ...lista[i], ...patch };
                      set("medicamentos", { lista });
                    };
                    return (
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
                          <TextInput value={med.nome} onChange={(e) => atualizar({ nome: e.target.value })} />
                        </Field>
                        <Field label="Para quê você toma?">
                          <TextInput value={med.motivo} onChange={(e) => atualizar({ motivo: e.target.value })} />
                        </Field>
                      </div>
                    );
                  })}
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

              <p className="font-medium text-ink pt-2">Coração e metabolismo</p>
              <Field label="Você tem colesterol alto ou usa medicação para colesterol (estatina)?">
                <YesNo
                  value={anamnese.risco_cardiovascular.colesterol_alto_ou_usa_estatina}
                  onChange={(v) => set("risco_cardiovascular", { colesterol_alto_ou_usa_estatina: v })}
                />
              </Field>
              <Field label="Você sabe se seu HDL (colesterol bom) é alto (acima de 60)?">
                <YesNo
                  value={anamnese.risco_cardiovascular.hdl_alto_conhecido}
                  onChange={(v) => set("risco_cardiovascular", { hdl_alto_conhecido: v })}
                />
              </Field>
              <Field label="Você tem glicemia alterada (pré-diabetes) ou diabetes?">
                <YesNo
                  value={anamnese.risco_cardiovascular.glicemia_alterada_ou_diabetes}
                  onChange={(v) => set("risco_cardiovascular", { glicemia_alterada_ou_diabetes: v })}
                />
              </Field>

              <Field label="Na sua família (pais, irmãos), já apareceu algum destes? (pode marcar mais de um)">
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
              </Field>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell title="Dor" subtitle="Se houver dor, mostre no desenho onde e o quanto incomoda.">
              <Field label="Você sente alguma dor atualmente?">
                <YesNo value={anamnese.dor.tem_dor} onChange={(v) => set("dor", { tem_dor: v })} />
              </Field>
              {anamnese.dor.tem_dor && (
                <>
                  <MapaDor dor={anamnese.dor} onChange={(patch) => set("dor", patch)} />
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

          {step === 4 && (
            <StepShell title="Hábitos e bem-estar" subtitle="Algumas perguntas rápidas sobre o seu dia a dia.">
              <Field label="Você pratica alguma atividade física atualmente?">
                <YesNo value={anamnese.atividade_fisica.pratica_atual} onChange={(v) => set("atividade_fisica", { pratica_atual: v })} />
              </Field>
              {anamnese.atividade_fisica.pratica_atual && (
                <Field label="Quais modalidades e com que frequência?">
                  <TextInput
                    value={anamnese.atividade_fisica.modalidades}
                    onChange={(e) => set("atividade_fisica", { modalidades: e.target.value })}
                  />
                </Field>
              )}

              <Field label="Quantas horas você costuma dormir por noite?">
                <TextInput inputMode="decimal" value={anamnese.sono.horas_sono} onChange={(e) => set("sono", { horas_sono: e.target.value })} />
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
              <Field label="Você costuma ter dificuldade para pegar no sono?">
                <YesNo value={anamnese.sono.dificuldade_iniciar} onChange={(v) => set("sono", { dificuldade_iniciar: v })} />
              </Field>
              <Field label="Você costuma acordar durante a noite?">
                <YesNo value={anamnese.sono.despertares_noturnos} onChange={(v) => set("sono", { despertares_noturnos: v })} />
              </Field>

              <Field label="Você fuma?">
                <ChoiceGroup
                  columns={2}
                  options={opcoesTabagismo.map((o) => ({ value: o, label: o }))}
                  value={anamnese.estilo_vida.tabagismo || null}
                  onChange={(v) => set("estilo_vida", { tabagismo: v })}
                />
              </Field>

              <div className="rounded-lg border border-border bg-bg p-4 space-y-3">
                <Field label="Nos últimos tempos, o estresse, a ansiedade ou o humor têm atrapalhado o seu dia a dia?">
                  <ChoiceGroup
                    columns={2}
                    options={opcoesSinalizacaoBemEstar}
                    value={anamnese.saude_mental.sinalizacao}
                    onChange={(v) => set("saude_mental", { sinalizacao: v })}
                  />
                </Field>
                <p className="text-xs text-muted leading-relaxed">
                  Esta é só uma pergunta para a gente cuidar de você por inteiro. Se quiser falar mais sobre isso, há um questionário separado e
                  opcional - você decide se e quando responder.
                </p>
              </div>
            </StepShell>
          )}

          {step === 5 && (
            <StepShell title="Segurança para atividade física" subtitle="Perguntas de segurança, antes de qualquer teste físico.">
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

          {step === 6 && (
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
              disabled={step === 0}
              className="text-sm font-medium text-muted hover:text-ink disabled:opacity-40"
            >
              ← Voltar
            </button>
            <div className="flex items-center gap-3">
              {salvandoFundo && <span className="text-xs text-muted/70">salvando...</span>}
              {step < TOTAL_STEPS - 1 ? (
                <button
                  type="button"
                  onClick={proximo}
                  className="rounded-lg bg-accent text-white font-medium px-6 py-2.5 hover:bg-accent-dark transition"
                >
                  Próximo →
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
          <p className="text-xs text-muted/70 text-center mt-3">Dica: aperte Enter para avançar mais rápido.</p>
        </div>
      </div>
    </main>
  );
}
