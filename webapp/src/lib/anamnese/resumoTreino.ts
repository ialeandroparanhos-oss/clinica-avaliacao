// Resumo da anamnese para a prescrição do treino: reúne, na hora em que o avaliador abre a ficha, o que a
// pessoa contou e que muda o que se prescreve (objetivo, segurança, dor, experiência, rotina, recuperação).
// Só mostra o que foi respondido; o que falta e faria diferença vira "perguntar agora". Não interpreta nem
// prescreve: apenas organiza as respostas e aponta o que merece cuidado. A decisão é do profissional.

import type { Anamnese, PacienteRow } from "./types";
import { mesclarComPadrao } from "./defaults";
import { itensParqPositivos } from "./alerts";
import { calcularPSQI } from "./psqi";
import { calcularRiscoCardiovascular } from "./riscoCardiovascular";
import { paraNumero } from "@/lib/numeros";
import { condicoesDoPaciente } from "@/lib/condicoes/deteccao";
import { condicaoPorId } from "@/lib/condicoes/catalogo";
import { liberacaoPara, ROTULO_NIVEL_LIBERACAO } from "@/lib/avaliacao/liberacaoTeste";

export type TomItem = "normal" | "atencao" | "alerta";
export type ItemResumo = { rotulo: string; valor: string; tom: TomItem };
export type SecaoResumo = { id: string; titulo: string; itens: ItemResumo[]; seguranca?: boolean };
export type ResumoTreino = {
  secoes: SecaoResumo[];
  perguntar: string[]; // o que falta e faria diferença na prescrição
  totalItens: number;
  anamneseConcluida: boolean;
};

const txt = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const lista = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim() !== "").map((x) => (x as string).trim()) : []);

function item(rotulo: string, valor: string, tom: TomItem = "normal"): ItemResumo | null {
  const v = valor.trim();
  return v === "" ? null : { rotulo, valor: v, tom };
}
const compactar = (itens: (ItemResumo | null)[]): ItemResumo[] => itens.filter((i): i is ItemResumo => i !== null);

function simNao(v: boolean | null | undefined): string {
  return v === true ? "Sim" : v === false ? "Não" : "";
}

function minutosPorSemana(a: Anamnese): number {
  const ip = a.atividade_fisica.ipaq;
  return (
    (paraNumero(ip.dias_vigorosa) ?? 0) * (paraNumero(ip.min_vigorosa_dia) ?? 0) +
    (paraNumero(ip.dias_moderada) ?? 0) * (paraNumero(ip.min_moderada_dia) ?? 0) +
    (paraNumero(ip.dias_caminhada) ?? 0) * (paraNumero(ip.min_caminhada_dia) ?? 0)
  );
}

export function montarResumoTreino(paciente: PacienteRow): ResumoTreino {
  const a = mesclarComPadrao(paciente.anamnese);
  const secoes: SecaoResumo[] = [];
  const perguntar: string[] = [];

  // ---- 1. Objetivo e motivação
  // Fichas antigas guardavam as dificuldades como texto; as novas, como lista.
  const dificuldades = Array.isArray(a.motivo.dificuldades) ? lista(a.motivo.dificuldades) : txt(a.motivo.dificuldades) ? [txt(a.motivo.dificuldades)] : [];
  secoes.push({
    id: "objetivo",
    titulo: "Objetivo e motivação",
    itens: compactar([
      item("Objetivo", txt(a.motivo.objetivos)),
      item("Motivo da procura", txt(a.motivo.motivo_procura)),
      item("Queixa principal", txt(a.motivo.queixa_principal)),
      item("Expectativas", txt(a.motivo.expectativas)),
      item("Dificuldades no dia a dia", dificuldades.join("; ")),
      item("Atividades que deixou de fazer", txt(a.motivo.atividades_perdidas)),
    ]),
  });
  if (txt(a.motivo.objetivos) === "") perguntar.push("Qual é o objetivo principal com o treino (e para quando)?");

  // ---- 2. Segurança
  const seg: (ItemResumo | null)[] = [];
  const parq = itensParqPositivos(a);
  if (parq.length > 0) seg.push(item("PAR-Q+ positivo", parq.join("; "), "atencao"));
  const det = condicoesDoPaciente(paciente);
  const nomesCondicoes = det.condicoes.map((c) => condicaoPorId(c.id)?.nome.split(" (")[0]).filter((n): n is string => !!n);
  // A liberação só aparece se o PAR-Q+ foi respondido: sem resposta ela seria uma conclusão tirada do nada.
  // Ela vem só do PAR-Q+ e da atividade atual; se a pessoa citou condições em outros campos, o aviso pede conferir.
  if (Object.values(a.prontidao.parq).some((v) => v !== null)) {
    const liberLeve = liberacaoPara(paciente, "leve_moderada");
    const liberForte = liberacaoPara(paciente, "vigorosa_maxima");
    const todasLiberadas = liberLeve.nivel === "liberado" && liberForte.nivel === "liberado";
    const conferir = todasLiberadas && nomesCondicoes.length > 0 ? ". A regra olha só o PAR-Q+: há condições citadas abaixo, confirme antes de esforço vigoroso" : "";
    seg.push(
      item(
        "Liberação para esforço",
        `leve a moderado: ${ROTULO_NIVEL_LIBERACAO[liberLeve.nivel].toLowerCase()}; vigoroso ou máximo: ${ROTULO_NIVEL_LIBERACAO[liberForte.nivel].toLowerCase()}${conferir}`,
        todasLiberadas ? (conferir ? "atencao" : "normal") : liberLeve.nivel === "liberacao_necessaria" ? "alerta" : "atencao"
      )
    );
  }
  if (nomesCondicoes.length > 0) seg.push(item("Condições citadas", `${nomesCondicoes.join("; ")} (cuidados na aba Condições de saúde)`, "atencao"));
  if (a.historico_saude.tem_doencas === true) seg.push(item("Doenças relatadas", txt(a.historico_saude.doencas)));
  if (a.historico_saude.tem_outras_condicoes === true) seg.push(item("Outras condições", txt(a.historico_saude.outras_condicoes)));
  if (a.medicamentos.usa_medicamentos === true) {
    const meds = a.medicamentos.lista.map((m) => [txt(m.nome), txt(m.motivo) ? `para ${txt(m.motivo)}` : ""].filter(Boolean).join(" ")).filter(Boolean);
    seg.push(item("Medicamentos", meds.join("; ") || "usa, sem detalhe informado", "atencao"));
  } else if (a.medicamentos.usa_medicamentos === false) seg.push(item("Medicamentos", "Não usa"));
  if (a.historico_saude.tem_cirurgias === true) seg.push(item("Cirurgias", txt(a.historico_saude.cirurgias) || "sim, sem detalhe", "atencao"));
  if (a.historico_saude.tem_lesoes === true) seg.push(item("Lesões e fraturas", txt(a.historico_saude.lesoes_fraturas) || "sim, sem detalhe", "atencao"));
  else if (a.historico_saude.tem_lesoes === false && a.historico_saude.tem_cirurgias === false) seg.push(item("Lesões e cirurgias", "Nenhuma informada"));
  if (a.historico_saude.quedas_12m === true) seg.push(item("Quedas nos últimos 12 meses", txt(a.historico_saude.quedas_detalhe) || "Sim", "atencao"));
  if (a.historico_saude.tem_hospitalizacoes === true) seg.push(item("Hospitalizações", txt(a.historico_saude.hospitalizacoes) || "Sim"));
  const risco = calcularRiscoCardiovascular(paciente);
  if (risco && risco.classificacao !== "baixo") {
    seg.push(item("Risco cardiovascular (triagem)", { moderado: "Moderado", alto: "Alto" }[risco.classificacao as "moderado" | "alto"], risco.classificacao === "alto" ? "alerta" : "atencao"));
  }
  const cap = a.capacidade;
  const capNotas: string[] = [];
  if (cap.visao_dificuldade === "alguma" || cap.visao_dificuldade === "muita") capNotas.push(`visão (${cap.visao_dificuldade === "muita" ? "muita" : "alguma"} dificuldade)`);
  if (cap.audicao_dificuldade === "alguma" || cap.audicao_dificuldade === "muita") capNotas.push(`audição (${cap.audicao_dificuldade === "muita" ? "muita" : "alguma"} dificuldade)`);
  if (cap.memoria_esquecimentos === "frequentemente") capNotas.push("esquecimentos frequentes");
  if (capNotas.length > 0) seg.push(item("Visão, audição e memória", capNotas.join("; "), "atencao"));
  secoes.push({ id: "seguranca", titulo: "Segurança e saúde", seguranca: true, itens: compactar(seg) });
  if (a.medicamentos.usa_medicamentos === null) perguntar.push("Usa algum medicamento (principalmente para pressão, coração ou diabetes)?");
  if (a.historico_saude.tem_lesoes === null) perguntar.push("Já teve alguma lesão, cirurgia ou limitação que muda os exercícios?");

  // ---- 3. Dor e limitações
  const dor: (ItemResumo | null)[] = [];
  if (a.dor.tem_dor === true) {
    const regioes = Object.entries(a.dor.por_regiao ?? {}).map(([nome, d]) => {
      const partes = [d.intensidade !== null && d.intensidade !== undefined ? `${d.intensidade}/10` : "", txt(d.duracao)].filter(Boolean);
      return partes.length > 0 ? `${nome} (${partes.join(", ")})` : nome;
    });
    const locais = regioes.length > 0 ? regioes : lista(a.dor.localizacoes);
    const maxima = a.dor.intensidade_nrs;
    dor.push(item("Onde dói", locais.join("; "), maxima !== null && maxima >= 7 ? "alerta" : "atencao"));
    if (maxima !== null && regioes.length === 0) dor.push(item("Intensidade máxima", `${maxima}/10`, maxima >= 7 ? "alerta" : "normal"));
    dor.push(item("Características", lista(a.dor.caracteristicas).join(", ")));
    dor.push(item("Frequência", txt(a.dor.frequencia)));
    dor.push(item("O que piora", txt(a.dor.agravantes)));
    dor.push(item("O que alivia", txt(a.dor.atenuantes)));
    const quando = [a.dor.dor_repouso === true ? "em repouso" : "", a.dor.dor_movimento === true ? "no movimento" : "", a.dor.dor_noturna === true ? "à noite" : ""].filter(Boolean);
    dor.push(item("Quando aparece", quando.join(", ")));
    const imp = (n: number | null | undefined) => (n !== null && n !== undefined ? `${n}/10` : "");
    dor.push(item("Impacto no treino", imp(a.dor.impacto_treino), (a.dor.impacto_treino ?? 0) >= 6 ? "atencao" : "normal"));
    dor.push(item("Impacto no trabalho e no dia a dia", [imp(a.dor.impacto_trabalho) && `trabalho ${imp(a.dor.impacto_trabalho)}`, imp(a.dor.impacto_avds) && `dia a dia ${imp(a.dor.impacto_avds)}`].filter(Boolean).join("; ")));
    dor.push(item("Sinais de alerta na dor", lista(a.dor.bandeiras_vermelhas).join("; "), "alerta"));
    dor.push(item("Tratamentos já feitos", txt(a.dor.tratamentos_anteriores)));
  } else if (a.dor.tem_dor === false) {
    dor.push(item("Dor", "Sem dor relatada"));
  } else {
    perguntar.push("Sente alguma dor hoje? Onde e em que movimento?");
  }
  secoes.push({ id: "dor", titulo: "Dor e limitações", itens: compactar(dor) });

  // ---- 4. Experiência de treino
  const exp: (ItemResumo | null)[] = [];
  const af = a.atividade_fisica;
  if (af.pratica_atual === true) {
    exp.push(item("Treina hoje", [txt(af.modalidades), txt(af.tempo_treinamento) ? `há ${txt(af.tempo_treinamento)}` : ""].filter(Boolean).join(", ") || "Sim, sem detalhe"));
    if (txt(af.modalidades) === "") perguntar.push("Qual modalidade treina e com que frequência?");
  } else if (af.pratica_atual === false) {
    exp.push(item("Treina hoje", "Não (sedentário no momento)"));
  } else {
    perguntar.push("Já treina? Qual modalidade e há quanto tempo?");
  }
  exp.push(item("Parou de treinar por quê", txt(af.interrupcoes)));
  const min = minutosPorSemana(a);
  if (min > 0) exp.push(item("Atividade por semana (autorrelato)", `${min} min (o IPAQ costuma superestimar)`));
  const sentado = txt(af.ipaq.horas_sentado_dia);
  if (sentado) exp.push(item("Tempo sentado por dia", `${sentado} h`));
  secoes.push({ id: "experiencia", titulo: "Experiência de treino", itens: compactar(exp) });

  // ---- 5. Rotina e organização
  const rot: (ItemResumo | null)[] = [];
  const ev = a.estilo_vida;
  rot.push(item("Disponibilidade de tempo", txt(ev.disponibilidade_tempo)));
  if (txt(ev.disponibilidade_tempo) === "") perguntar.push("Quantos dias por semana e quanto tempo por sessão consegue treinar?");
  rot.push(item("O que atrapalha treinar", lista(ev.barreiras_exercicio).join("; ")));
  if (lista(ev.barreiras_exercicio).length === 0) perguntar.push("O que mais costuma atrapalhar a constância no treino?");
  rot.push(item("Gosta de fazer (lazer)", [...lista(ev.lazer_opcoes), txt(ev.lazer)].filter(Boolean).join("; ")));
  rot.push(item("Profissão e jornada", [txt(a.contexto.profissao), txt(a.contexto.jornada_horas) ? `${txt(a.contexto.jornada_horas)} h por dia` : ""].filter(Boolean).join(", ")));
  rot.push(item("Esforço físico no trabalho", [a.contexto.exige_esforco_fisico === true ? "Sim" : a.contexto.exige_esforco_fisico === false ? "Não" : "", txt(a.contexto.demanda_fisica_trabalho)].filter(Boolean).join(": ")));
  rot.push(item("Rotina", txt(a.contexto.rotina)));
  rot.push(item("Atividades do dia a dia", txt(a.contexto.atividades_diarias)));
  if (ev.conta_com_apoio !== null) rot.push(item("Apoio para treinar", [simNao(ev.conta_com_apoio), txt(ev.rede_apoio)].filter(Boolean).join(": ")));
  secoes.push({ id: "rotina", titulo: "Rotina e organização", itens: compactar(rot) });

  // ---- 6. Recuperação e hábitos
  const rec: (ItemResumo | null)[] = [];
  const psqi = calcularPSQI(a);
  const sono = a.sono;
  const sonoPartes = [txt(sono.horas_sono) ? `${txt(sono.horas_sono)} h por noite` : "", sono.qualidade_percebida !== null ? `qualidade ${sono.qualidade_percebida}/5` : ""].filter(Boolean);
  if (psqi) sonoPartes.push(`PSQI ${psqi.global}/21${psqi.global > 5 ? " (acima do corte de 5)" : ""}`);
  rec.push(item("Sono", sonoPartes.join("; "), psqi && psqi.global > 5 ? "atencao" : "normal"));
  if (ev.estresse_percebido !== null) rec.push(item("Estresse percebido", `${ev.estresse_percebido}/10`, ev.estresse_percebido >= 7 ? "atencao" : "normal"));
  if (ev.alimentacao_avaliacao !== null) rec.push(item("Alimentação (autoavaliação)", `${ev.alimentacao_avaliacao}/5`));
  rec.push(item("Hidratação", txt(ev.hidratacao_litros_dia) ? `${txt(ev.hidratacao_litros_dia)} L por dia` : ""));
  rec.push(item("Álcool", txt(ev.alcool_frequencia)));
  rec.push(item("Tabagismo", txt(ev.tabagismo)));
  secoes.push({ id: "recuperacao", titulo: "Recuperação e hábitos", itens: compactar(rec) });

  const cheias = secoes.filter((s) => s.itens.length > 0);
  return {
    secoes: cheias,
    perguntar,
    totalItens: cheias.reduce((n, s) => n + s.itens.length, 0),
    anamneseConcluida: paciente.anamnese_status === "concluida",
  };
}
