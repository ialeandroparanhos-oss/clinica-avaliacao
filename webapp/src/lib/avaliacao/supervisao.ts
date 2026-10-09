// Agente 1 — Dra. Nina: SUPERVISÃO da avaliação, antes de emitir relatórios.
//
// Conferência automática de que os relatórios e pareceres refletem TUDO o que foi avaliado, e de que
// os achados de uma área não contradizem os de outra. Cada agente olha a sua área; a Nina olha o
// conjunto. Nada aqui diagnostica: são avisos para o profissional conferir.
//
// Três tipos de conferência:
//  1. Cobertura: o que foi registrado e o que falta (anamnese, composição, sinais vitais, testes...);
//  2. Cruzamentos entre áreas (ex.: IMC normal com %G alto; gordura alta com massa magra baixa e força
//     reduzida; queda relatada sem teste de equilíbrio; teste máximo com liberação médica pendente);
//  3. Pareceres: faltando, desatualizados em relação aos dados atuais, ou ainda não revisados.

import type { PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { calcularPerfilIntegrado } from "@/lib/integracao/perfil";
import { detectarDiscrepancias } from "@/lib/integracao/discrepancias";
import { triarSarcopeniaDinapenia } from "@/lib/integracao/sarcopenia";
import { itemAprovado, type Plano } from "@/lib/integracao/plano";
import { analisarComposicao, compararMetodosGordura } from "@/lib/avaliacao/composicaoCorporal";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { liberacaoPara } from "@/lib/avaliacao/liberacaoTeste";
import { testePrincipalDoRegistro } from "@/lib/avaliacao/cardiorrespiratoria";
import { gerarParecerAgente, nomeAgente, type AgenteParecer, type EstiloParecer } from "@/lib/avaliacao/pareceres";
import { CAMPOS_CIRCUNFERENCIA } from "@/lib/avaliacao/medidasRegionais";
import { paraNumero } from "@/lib/numeros";

export type NivelSupervisao = "ok" | "atencao" | "alerta";
export type ItemSupervisao = { nivel: NivelSupervisao; area: string; texto: string };
export type ItemCobertura = { area: string; registrado: boolean; detalhe: string };
export type ResultadoSupervisao = { itens: ItemSupervisao[]; cobertura: ItemCobertura[]; alertas: number; atencoes: number };

const ORDEM: Record<NivelSupervisao, number> = { alerta: 0, atencao: 1, ok: 2 };

export function supervisionar(paciente: PacienteRow): ResultadoSupervisao {
  const itens: ItemSupervisao[] = [];
  const add = (nivel: NivelSupervisao, area: string, texto: string) => itens.push({ nivel, area, texto });
  const cobertura: ItemCobertura[] = [];
  const cob = (area: string, registrado: boolean, detalhe: string) => cobertura.push({ area, registrado, detalhe });

  const a = mesclarComPadrao(paciente.anamnese);
  const f = paciente.fisica ?? {};
  const fu = paciente.funcional ?? {};
  const idade = idadeEfetiva(paciente);
  const sexo = sexoEfetivo(paciente);
  const perfil = calcularPerfilIntegrado(paciente);
  const dom = (k: string) => perfil.dominios.find((d) => d.chave === k);
  const comp = analisarComposicao(f, idade, sexo);
  const plano = paciente.plano as Plano | undefined;

  // ---------------------------------------------------------------- 1) cobertura
  cob("Anamnese", paciente.anamnese_status !== "nao_iniciada", paciente.anamnese_status === "concluida" ? "concluída" : paciente.anamnese_status === "em_andamento" ? "em andamento" : "não iniciada");
  cob("Peso e altura", paraNumero(f.peso_kg) !== null && paraNumero(f.altura_cm) !== null, "para IMC");
  cob("% de gordura", comp.pg !== null, comp.pg !== null ? `${comp.fontePg ?? "registrado"}` : "sem dobras nem bioimpedância");
  cob("Massa magra", comp.massaMagraKg !== null, comp.ffmi !== null ? `índice ${comp.ffmi.toFixed(1).replace(".", ",")} kg/m²` : "depende do %G e do peso");
  cob("Cintura / quadril", comp.cintura !== null, comp.rcest !== null ? "relação cintura/estatura calculada" : "sem cintura");
  const nCirc = CAMPOS_CIRCUNFERENCIA.filter((c) => paraNumero(f[c.chave]) !== null).length;
  cob("Circunferências regionais", nCirc > 3, `${nCirc} medida(s)`);
  cob("Sinais vitais", paraNumero(f.pa_sistolica) !== null || paraNumero(f.fc_repouso) !== null, "pressão arterial e frequência cardíaca");
  const testesFuncionais = ["chair_stand_reps", "five_sts_seg", "tug_seg", "apoio_unipodal_d_seg", "velocidade_marcha_ms", "marcha_tempo_s", "tc6_metros", "dinamometria_d_kg", "arm_curl_reps", "pushup_reps", "core_prancha_seg"].filter((k) => paraNumero(fu[k]) !== null).length;
  cob("Testes funcionais", testesFuncionais > 0, `${testesFuncionais} teste(s)`);
  cob("Mobilidade", dom("mobilidade")?.classificacao !== "investigar", dom("mobilidade")?.classificacao !== "investigar" ? "avaliada por teste objetivo" : "sem teste objetivo");
  const fotos = ["foto_anterior_path", "foto_posterior_path", "foto_lateral_d_path", "foto_lateral_e_path"].filter((k) => !!paciente.postural?.[k]).length;
  cob("Postura (fotos)", fotos > 0, `${fotos} foto(s)`);
  const principal = testePrincipalDoRegistro(paciente.cardio);
  cob("Cardiorrespiratório", !!principal || paraNumero(paciente.cardio?.vo2max_manual) !== null, principal ? "teste registrado" : "sem teste");
  const itensAprovados = (plano?.itens ?? []).filter(itemAprovado).length;
  cob("Plano de intervenção", itensAprovados > 0, `${itensAprovados} item(ns) aprovado(s)`);

  // ---------------------------------------------------------------- 2) cruzamentos
  switch (comp.padrao) {
    case "gordura_alta_massa_baixa":
      add("alerta", "Composição corporal", "Gordura alta com massa magra baixa. O IMC sozinho não mostra isso: conferir força (dinamometria, 5x sentar-e-levantar) e priorizar treino de força com nutrição.");
      break;
    case "peso_normal_gordura_alta":
      add("atencao", "Composição corporal", "IMC normal, mas %G acima do desejável pelas tabelas (Pollock & Wilmore ou massa magra em % do peso): o IMC subestima o risco; olhar a massa magra e a força.");
      break;
    case "imc_alto_sem_excesso_de_gordura":
      add("ok", "Composição corporal", "IMC elevado com %G sem excesso pelas tabelas: o IMC superestima a gordura nesta pessoa.");
      break;
    default:
      break;
  }
  const diverg = compararMetodosGordura(f, idade, sexo);
  if (diverg?.divergente) add("atencao", "Composição corporal", diverg.texto);
  if (comp.pg === null && ((comp.imc !== null && comp.imc >= 25) || comp.classeCintura === "aumentado" || comp.classeCintura === "muito_aumentado")) {
    add("atencao", "Composição corporal", "Há sinal de excesso de peso ou de gordura central, mas nenhum %G registrado (dobras ou bioimpedância): a leitura fica limitada ao IMC e às medidas de cintura.");
  }
  const sarc = triarSarcopeniaDinapenia(paciente);
  if (sarc.possivelObesidadeSarcopenica) add("alerta", "Íris (integração)", "Possível obesidade sarcopênica (excesso de adiposidade com força ou massa muscular baixas): confirmar com avaliação de composição corporal e função muscular.");

  const sis = paraNumero(f.pa_sistolica);
  const dia = paraNumero(f.pa_diastolica);
  if (sis !== null && dia !== null && (sis >= 140 || dia >= 90)) {
    add("alerta", "Sinais vitais", `Pressão arterial ${sis}/${dia} mmHg, acima de 140/90: repetir a medida e considerar avaliação médica antes de esforços intensos.`);
  }

  const nivelAlerta = (paciente.alertas ?? []).some((al) => al.nivel >= 3);
  const temSeguranca = (plano?.itens ?? []).some((i) => i.categoria === "seguranca" && itemAprovado(i));
  if (nivelAlerta && !temSeguranca) add("alerta", "Segurança", "Há alerta de nível 3 ou 4 na anamnese e nenhum item de segurança aprovado no plano.");

  if (a.historico_saude.quedas_12m === true && ["apoio_unipodal_d_seg", "tug_seg", "five_sts_seg"].every((k) => paraNumero(fu[k]) === null)) {
    add("atencao", "Equilíbrio", "Queda nos últimos 12 meses e nenhum teste de equilíbrio ou de risco de queda registrado (apoio unipodal, TUG ou 5x sentar-e-levantar).");
  }
  if (principal) {
    const protocolo = String(principal.protocolo ?? "");
    const maximo = ["bruce", "cooper", "rampa"].includes(protocolo);
    const lib = liberacaoPara(paciente, "vigorosa_maxima");
    if (maximo && (lib.nivel === "liberacao_necessaria" || lib.nivel === "liberacao_recomendada")) {
      add("alerta", "Cardiorrespiratório", `Teste máximo (${protocolo}) registrado com liberação médica ${lib.nivel === "liberacao_necessaria" ? "necessária" : "recomendada"} pelos critérios do ACSM: confirmar a liberação no prontuário.`);
    }
  }
  const pendentes = perfil.dominios.filter((d) => d.classificacao === "investigar");
  if (pendentes.length > 0) add("atencao", "Perfil Integrado", `Domínios sem dado suficiente: ${pendentes.map((d) => d.titulo.toLowerCase()).join(", ")}. O relatório trata isso como "a investigar", nunca como normal.`);
  for (const d of detectarDiscrepancias(paciente)) add("atencao", "Discrepância", `${d.titulo}: ${d.descricao}`);

  const revisar = [...(plano?.itens ?? []), ...(plano?.encaminhamentos ?? []), ...(plano?.servicos ?? [])].filter((i: { status?: string }) => (i.status ?? "concordo") === "sugerido").length;
  if (revisar > 0) add("atencao", "Plano", `${revisar} item(ns) do plano ainda a revisar: só o que você aprovar vai para o relatório e para o paciente.`);

  // ---------------------------------------------------------------- 3) pareceres
  const pareceres: { agente: AgenteParecer; salvo: { texto?: string; estilo?: string; automatico?: string; revisado?: boolean } | undefined }[] = [
    { agente: "anamnese", salvo: plano?.pareceres?.anamnese },
    { agente: "fisica", salvo: paciente.fisica?.parecer },
    { agente: "funcional", salvo: paciente.funcional?.parecer },
    { agente: "cardio", salvo: paciente.cardio?.parecer },
    { agente: "perfil", salvo: plano?.pareceres?.perfil },
  ];
  for (const { agente, salvo } of pareceres) {
    const nome = nomeAgente(agente);
    const estilo: EstiloParecer = salvo?.estilo === "explicativo" ? "explicativo" : "sucinto";
    const atual = gerarParecerAgente(agente, paciente, estilo);
    if (!salvo?.texto) {
      if (atual !== "") add("atencao", nome, `Há dados desta área, mas o parecer de ${nome} ainda não foi gerado: o relatório sairá sem ele.`);
      continue;
    }
    if (salvo.automatico && atual !== "" && salvo.automatico !== atual) {
      add("atencao", nome, `O parecer de ${nome} foi gerado antes dos dados atuais: atualize para o relatório refletir tudo o que foi avaliado.`);
    }
    if (!salvo.revisado) add("atencao", nome, `O parecer de ${nome} ainda não foi revisado e aprovado por você.`);
  }

  itens.sort((x, y) => ORDEM[x.nivel] - ORDEM[y.nivel]);
  return { itens, cobertura, alertas: itens.filter((i) => i.nivel === "alerta").length, atencoes: itens.filter((i) => i.nivel === "atencao").length };
}
