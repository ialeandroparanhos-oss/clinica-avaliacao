// Resultados para a apresentação (slides): para cada grupo de áreas, as linhas com o resultado do
// paciente, a referência usada e uma leitura simples, mais as possíveis intervenções.
//
// Linguagem do paciente, mas COM números (o profissional pediu mais resultados nos slides): cada
// linha mostra o que foi medido, com o que foi comparado e o que isso significa. Nada de termo de
// diagnóstico. Dados psicológicos sensíveis (escalas de humor e ansiedade) não aparecem em número.

import type { PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { regioesEfetivas } from "@/lib/anamnese/dorPorRegiao";
import { calcularPSQI } from "@/lib/anamnese/psqi";
import { analisarComposicao, CORTE_FFMI } from "@/lib/avaliacao/composicaoCorporal";
import { corteDinamometriaKgf, limite5stsPorIdade, limitesRikli, CORTE_5STS_SEG } from "@/lib/avaliacao/forca";
import { avaliarVO2max, ROTULO_CLASSE_VO2, vo2maxDeRegistro } from "@/lib/avaliacao/cardiorrespiratoria";
import { avaliarMobilidadeObjetiva, diferencaEntreLados, LIMITE_ASSIMETRIA_GRAUS, paresDeMobilidade } from "@/lib/avaliacao/mobilidade";
import { percentualDoPrevisto, tc6Previsto } from "@/lib/avaliacao/tc6";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { paraNumero } from "@/lib/numeros";
import { itemAprovado, type Plano } from "./plano";
import type { DomainKey, PerfilIntegrado } from "./perfil";
import { TEXTO_DOMINIO } from "./devolutiva";

export type Leitura = "ok" | "atencao" | "info";

export type LinhaResultado = { indicador: string; valor: string; referencia: string; leitura: Leitura; texto: string };

export type GrupoResultado = {
  id: string;
  titulo: string;
  subtitulo: string;
  linhas: LinhaResultado[];
  intervencoes: string[];
  notas: string[]; // para o apresentador (detalhe técnico)
};

const f1 = (n: number, c = 1) => n.toFixed(c).replace(".", ",");
const LEITURA_TXT: Record<Leitura, string> = { ok: "dentro do esperado", atencao: "pede atenção", info: "ponto de partida" };

function linha(indicador: string, valor: string, referencia: string, leitura: Leitura, texto?: string): LinhaResultado {
  return { indicador, valor, referencia, leitura, texto: texto ?? LEITURA_TXT[leitura] };
}

// Intervenções possíveis de um grupo: o que o avaliador aprovou no plano para esses domínios;
// se nada foi aprovado, a frase padrão do domínio que pede atenção.
function intervencoesDo(dominios: DomainKey[], perfil: PerfilIntegrado, plano: Plano | undefined): string[] {
  const aprovados = (plano?.itens ?? [])
    .filter((i) => itemAprovado(i) && i.dominio && dominios.includes(i.dominio) && (i.categoria ?? "intervencao") !== "reavaliacao")
    // O que trata o achado específico (ex.: massa magra baixa) vem antes das medidas gerais.
    .sort((x, y) => Number(!(x.regra ?? "").includes("massa-magra")) - Number(!(y.regra ?? "").includes("massa-magra")));
  if (aprovados.length > 0) {
    const vistos = new Set<string>();
    const saida: string[] = [];
    for (const i of aprovados) {
      const frase = i.descricao.split(/(?<=[.!?])\s/)[0].replace(/\s*\(Entra em .*$/, "");
      if (!vistos.has(frase)) {
        vistos.add(frase);
        saida.push(frase);
      }
    }
    return saida.slice(0, 3);
  }
  return dominios
    .map((k) => perfil.dominios.find((d) => d.chave === k))
    .filter((d) => d && (d.classificacao === "atencao" || d.classificacao === "prioridade"))
    .map((d) => TEXTO_DOMINIO[d!.chave].plano);
}

export function resultadosParaApresentacao(paciente: PacienteRow, perfil: PerfilIntegrado): GrupoResultado[] {
  const idade = idadeEfetiva(paciente);
  const sexo = sexoEfetivo(paciente);
  const a = mesclarComPadrao(paciente.anamnese);
  const f = paciente.fisica ?? {};
  const fu = paciente.funcional ?? {};
  const plano = paciente.plano as Plano | undefined;
  const dom = (k: DomainKey) => perfil.dominios.find((d) => d.chave === k);
  const n = (obj: Record<string, any>, k: string) => paraNumero(obj[k]);
  const grupos: GrupoResultado[] = [];

  // ------------------------------------------------------------------ composição corporal
  {
    const c = analisarComposicao(f, idade, sexo);
    const L: LinhaResultado[] = [];
    const peso = n(f, "peso_kg");
    const altura = n(f, "altura_cm");
    if (peso !== null && altura !== null) L.push(linha("Peso e altura", `${f1(peso)} kg · ${f1(altura, 0)} cm`, "ponto de partida", "info"));
    if (c.pg !== null) {
      L.push(
        linha(
          "Gordura corporal",
          `${f1(c.pg)}%`,
          c.faixa ? `faixa saudável para a sua idade: ${c.faixa[0]} a ${c.faixa[1]}%` : "sem faixa (faltam idade ou sexo)",
          c.pgStatus === "acima" ? "atencao" : c.pgStatus ? "ok" : "info",
          c.pgStatus === "acima" ? "acima da faixa" : c.pgStatus === "abaixo" ? "abaixo da faixa" : c.pgStatus === "na_faixa" ? "dentro da faixa" : undefined
        )
      );
    }
    if (c.massaMagraKg !== null) {
      const corte = sexo !== "desconhecido" ? CORTE_FFMI[sexo] : null;
      L.push(
        linha(
          "Massa magra (músculos, ossos, órgãos)",
          `${f1(c.massaMagraKg)} kg${c.ffmi !== null ? ` · índice ${f1(c.ffmi)}` : ""}`,
          corte !== null ? `índice mínimo esperado: ${corte}` : "—",
          c.ffmiBaixo === true ? "atencao" : c.ffmi !== null ? "ok" : "info",
          c.ffmiBaixo === true ? "abaixo do esperado" : c.ffmi !== null ? "adequada" : undefined
        )
      );
    }
    if (c.cintura !== null) {
      const corte = sexo === "masculino" ? 94 : sexo === "feminino" ? 80 : null;
      L.push(linha("Cintura", `${f1(c.cintura, 0)} cm`, corte !== null ? `abaixo de ${corte} cm` : "—", c.classeCintura && c.classeCintura !== "adequado" ? "atencao" : c.classeCintura ? "ok" : "info"));
    }
    if (c.rcest !== null) L.push(linha("Cintura em relação à altura", f1(c.rcest, 2), "abaixo de 0,50", c.rcest >= 0.5 ? "atencao" : "ok"));
    if (c.imc !== null) L.push(linha("IMC (peso em relação à altura)", f1(c.imc), "apenas uma triagem: não separa gordura de músculo", "info", "usamos junto com os itens acima"));
    if (L.length > 0) {
      const notas: string[] = [dom("composicao_corporal")?.justificativa ?? ""];
      if (c.pg === null) notas.push("Sem %G registrado: a leitura fica limitada. Registre dobras ou bioimpedância.");
      grupos.push({
        id: "composicao",
        titulo: "Composição do corpo",
        subtitulo: "Gordura, músculo e onde a gordura fica: olhamos tudo, não só o peso na balança.",
        linhas: L,
        intervencoes: intervencoesDo(["composicao_corporal"], perfil, plano),
        notas,
      });
    }
  }

  // ------------------------------------------------------------------ força
  {
    const L: LinhaResultado[] = [];
    const dD = n(fu, "dinamometria_d_kg");
    const dE = n(fu, "dinamometria_e_kg");
    const corteDina = corteDinamometriaKgf(idade, sexo);
    if (dD !== null || dE !== null) {
      const melhor = Math.max(dD ?? 0, dE ?? 0);
      L.push(linha("Força da mão (dinamometria)", `D ${dD !== null ? f1(dD) : "–"} · E ${dE !== null ? f1(dE) : "–"} kgf`, corteDina ? `mínimo esperado: ${f1(corteDina.kgf)} kgf` : "informe o sexo para comparar", corteDina ? (melhor < corteDina.kgf ? "atencao" : "ok") : "info"));
    }
    const lim = limitesRikli(idade, sexo);
    const chair = n(fu, "chair_stand_reps");
    if (chair !== null) L.push(linha("Levantar da cadeira em 30 s", `${chair} vezes`, lim ? `mínimo esperado: ${lim.chair} vezes` : "comparação a partir dos 60 anos", lim ? (chair < lim.chair ? "atencao" : "ok") : "info"));
    const five = n(fu, "five_sts_seg");
    if (five !== null) {
      const l5 = limite5stsPorIdade(idade);
      L.push(linha("Levantar da cadeira 5 vezes", `${f1(five)} s`, `até ${CORTE_5STS_SEG} s${l5 ? ` (ideal até ${f1(l5.seg)} s)` : ""}`, five > CORTE_5STS_SEG ? "atencao" : l5 && five > l5.seg ? "atencao" : "ok"));
    }
    const curl = n(fu, "arm_curl_reps");
    if (curl !== null) L.push(linha("Força dos braços (30 s)", `${curl} repetições`, lim ? `mínimo esperado: ${lim.curl}` : "comparação a partir dos 60 anos", lim ? (curl < lim.curl ? "atencao" : "ok") : "info"));
    const push = n(fu, "pushup_reps");
    if (push !== null) L.push(linha("Flexões de braço", `${push} repetições`, "acompanhamos a evolução", "info"));
    if (L.length > 0) {
      grupos.push({
        id: "forca",
        titulo: "Força muscular",
        subtitulo: "A força sustenta o dia a dia: levantar, subir escadas, carregar peso.",
        linhas: L,
        intervencoes: intervencoesDo(["forca"], perfil, plano),
        notas: [dom("forca")?.justificativa ?? ""],
      });
    }
  }

  // ------------------------------------------------------------------ equilíbrio, marcha e mobilidade
  {
    const L: LinhaResultado[] = [];
    const tug = n(fu, "tug_seg");
    if (tug !== null) L.push(linha("Levantar, andar 3 m e voltar (TUG)", `${f1(tug)} s`, "abaixo de 12 s", tug >= 12 ? "atencao" : "ok"));
    const uD = n(fu, "apoio_unipodal_d_seg");
    const uE = n(fu, "apoio_unipodal_e_seg");
    if (uD !== null || uE !== null) L.push(linha("Equilíbrio em um pé", `D ${uD !== null ? f1(uD, 0) : "–"} · E ${uE !== null ? f1(uE, 0) : "–"} s`, "10 s ou mais em cada pé", Math.min(uD ?? 99, uE ?? 99) < 10 ? "atencao" : "ok"));
    const marcha = n(fu, "velocidade_marcha_ms");
    if (marcha !== null) L.push(linha("Velocidade de caminhada", `${f1(marcha, 2)} m/s`, "1,0 m/s ou mais", marcha <= 0.8 ? "atencao" : marcha < 1 ? "atencao" : "ok", marcha <= 0.8 ? "devagar para a idade" : marcha < 1 ? "pede atenção" : "boa"));
    const pares = paresDeMobilidade(fu).filter((p) => p.d !== null && p.e !== null && !p.id.startsWith("gonio_") && p.unidade === "°");
    for (const p of pares.slice(0, 3)) {
      const dif = diferencaEntreLados(p.d, p.e)!;
      L.push(linha(p.rotulo.split(" - ").slice(-1)[0].replace(/^./, (s) => s.toUpperCase()) + ` (${p.rotulo.split(" - ")[0].toLowerCase()})`, `D ${f1(p.d!, 0)}° · E ${f1(p.e!, 0)}°`, `diferença entre os lados até ${LIMITE_ASSIMETRIA_GRAUS}°`, dif.dif > LIMITE_ASSIMETRIA_GRAUS ? "atencao" : "ok", dif.dif > LIMITE_ASSIMETRIA_GRAUS ? `lados diferentes (${f1(dif.dif, 0)}°)` : "lados parecidos"));
    }
    const mob = avaliarMobilidadeObjetiva(fu);
    if (L.length > 0 || mob.classificacao !== "investigar") {
      if (pares.length === 0 && mob.classificacao !== "investigar") L.push(linha("Mobilidade", mob.classificacao === "atencao" ? "ponto de atenção" : "sem restrição observada", "assimetria e agachamento observados", mob.classificacao === "atencao" ? "atencao" : "ok"));
      grupos.push({
        id: "equilibrio",
        titulo: "Equilíbrio, caminhada e mobilidade",
        subtitulo: "Segurança para se movimentar e prevenir quedas.",
        linhas: L.slice(0, 6),
        intervencoes: intervencoesDo(["equilibrio", "funcionalidade", "mobilidade"], perfil, plano),
        notas: [dom("equilibrio")?.justificativa ?? "", dom("funcionalidade")?.justificativa ?? "", mob.justificativa],
      });
    }
  }

  // ------------------------------------------------------------------ condicionamento
  {
    const L: LinhaResultado[] = [];
    const vo2 = vo2maxDeRegistro(paciente.cardio);
    if (vo2 !== null) {
      const av = avaliarVO2max(vo2, idade, sexo);
      const medido = n(paciente.cardio ?? {}, "vo2max_manual") !== null;
      L.push(
        linha(
          "Capacidade do coração e pulmões (VO2máx)",
          `${medido ? f1(vo2) : `≈ ${Math.round(vo2)}`} ml/kg/min`,
          av ? `comparado a pessoas da sua idade e sexo: ${av.textoPercentil.replace("≈ ", "percentil ≈ ").replace("P", "")}` : "faltam idade ou sexo",
          av && (av.classe === "muito_fraco" || av.classe === "fraco") ? "atencao" : av ? "ok" : "info",
          av ? ROTULO_CLASSE_VO2[av.classe].split(" (")[0].toLowerCase() : undefined
        )
      );
    }
    const tc6 = n(fu, "tc6_metros");
    if (tc6 !== null) {
      const imc = analisarComposicao(f, idade, sexo).imc;
      const formato = fu.tc6_formato;
      const prev = !formato || formato === "Corredor de 30 m (padrão)" ? tc6Previsto(idade, sexo, imc) : null;
      const pct = percentualDoPrevisto(tc6, prev);
      L.push(linha("Caminhada de 6 minutos", `${f1(tc6, 0)} m`, prev !== null ? `previsto ≈ ${Math.round(prev)} m${pct !== null ? ` (você fez ${Math.round(pct)}%)` : ""}` : "acompanhamos a evolução", "info", prev !== null ? "referência brasileira" : undefined));
    }
    if (L.length > 0) {
      grupos.push({
        id: "condicionamento",
        titulo: "Condicionamento (fôlego)",
        subtitulo: "Coração e pulmões em ação: disposição hoje e saúde no futuro.",
        linhas: L,
        intervencoes: intervencoesDo(["capacidade_cardiorrespiratoria"], perfil, plano),
        notas: [dom("capacidade_cardiorrespiratoria")?.justificativa ?? ""],
      });
    }
  }

  // ------------------------------------------------------------------ dor, sono e hábitos
  {
    const L: LinhaResultado[] = [];
    if (a.dor.tem_dor === true) {
      for (const [regiao, v] of Object.entries(regioesEfetivas(a.dor)).slice(0, 4)) {
        L.push(linha(`Dor: ${regiao.toLowerCase()}`, v.intensidade !== null ? `${v.intensidade} de 10` : "sem nota", v.duracao ? `há ${v.duracao.toLowerCase()}` : "tempo não informado", v.intensidade !== null && v.intensidade >= 4 ? "atencao" : "info", v.intensidade !== null && v.intensidade >= 7 ? "dor forte" : v.intensidade !== null && v.intensidade >= 4 ? "dor moderada" : "dor leve"));
      }
    } else if (a.dor.tem_dor === false) {
      L.push(linha("Dor", "sem dor relatada", "—", "ok"));
    }
    const psqi = calcularPSQI(a);
    if (psqi) L.push(linha("Sono", `${psqi.global} pontos (0 a 21)`, "até 5 pontos indica sono de boa qualidade", psqi.global > 5 ? "atencao" : "ok", psqi.global > 5 ? "sono pede atenção" : "sono bom"));
    else if (a.sono.qualidade_percebida !== null) L.push(linha("Sono", `${a.sono.qualidade_percebida} de 5`, "como você avalia a qualidade", a.sono.qualidade_percebida <= 2 ? "atencao" : "ok"));
    if (a.atividade_fisica.pratica_atual !== null) L.push(linha("Atividade física hoje", a.atividade_fisica.pratica_atual ? a.atividade_fisica.modalidades || "pratica" : "não pratica", "OMS: 150 a 300 min/semana + força 2x", a.atividade_fisica.pratica_atual ? "ok" : "atencao"));
    if (typeof a.estilo_vida.estresse_percebido === "number") L.push(linha("Estresse no dia a dia", `${a.estilo_vida.estresse_percebido} de 10`, "como você sente", a.estilo_vida.estresse_percebido >= 5 ? "atencao" : "ok"));
    const bem = dom("bem_estar")?.classificacao;
    if (bem === "atencao" || bem === "prioridade") L.push(linha("Bem-estar emocional", "vamos conversar com cuidado", "apoio disponível, se você quiser", "atencao", "ponto de atenção"));
    if (L.length > 0) {
      grupos.push({
        id: "dor-sono",
        titulo: "Dor, sono e hábitos",
        subtitulo: "O que você sente e como vive pesa tanto quanto os testes.",
        linhas: L.slice(0, 6),
        intervencoes: intervencoesDo(["dor", "sono", "estilo_de_vida", "bem_estar"], perfil, plano),
        notas: [dom("dor")?.justificativa ?? "", dom("sono")?.justificativa ?? "", dom("estilo_de_vida")?.justificativa ?? "", "Escalas de humor e ansiedade não aparecem em número nos slides (dado sensível)."],
      });
    }
  }

  // ------------------------------------------------------------------ postura (análise das fotos)
  {
    const vistas = (paciente.postural?.analise?.vistas ?? {}) as Record<string, { medidas?: { rotulo: string; valor: number; unidade: string; destaque: string }[] }>;
    const achados: LinhaResultado[] = [];
    let total = 0;
    for (const [v, a2] of Object.entries(vistas)) {
      for (const m of a2.medidas ?? []) {
        if (m.destaque === "info") continue;
        total++;
        if (m.destaque === "discreta" || m.destaque === "evidente") achados.push(linha(m.rotulo, `${f1(m.valor)}${m.unidade}`, "abaixo de 3° é considerado sem diferença", "atencao", m.destaque === "evidente" ? "diferença evidente na foto" : "diferença discreta na foto"));
      }
      void v;
    }
    if (total > 0) {
      const L = achados.slice(0, 5);
      if (L.length === 0) L.push(linha("Postura nas fotos", "sem diferença perceptível", "análise das fotos", "ok"));
      grupos.push({
        id: "postura",
        titulo: "Postura (análise das fotos)",
        subtitulo: "O que as fotos mostram hoje, para compararmos nas reavaliações. Postura não é diagnóstico nem causa de dor.",
        linhas: L,
        intervencoes: intervencoesDo(["mobilidade"], perfil, plano),
        notas: ["Medidas em foto 2D: dependem do enquadramento. Diferenças menores que 3° são tratadas como sem diferença (prática do sistema, sem validação publicada)."],
      });
    }
  }

  return grupos;
}
