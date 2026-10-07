// Agente 7 — Theo: regras do plano de intervenção confrontadas com a literatura.
//
// Para cada domínio do Perfil Integrado em "prioridade" ou "atenção", gera
// sugestões para 30, 60, 90 dias e anual, com: a dose proposta, o resultado do
// paciente que motivou, a evidência (com fonte), as ressalvas e o indicador de
// sucesso. São APOIO À DECISÃO: o avaliador concorda, discorda, edita ou
// acrescenta (ver AbaPlano). As referências foram consultadas em 02-07/10/2026
// em resumos e páginas de síntese - CONFIRMAR na fonte antes de adotar uma
// conduta de forma definitiva. Doses de treino seguem a literatura de adultos
// saudáveis e devem ser ADAPTADAS a doenças, dor e risco cardiovascular.

import type { Anamnese, PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { escoreTSK11, somaSemNulos } from "@/lib/anamnese/alerts";
import { calcularPSQI } from "@/lib/anamnese/psqi";
import { perguntasParQ } from "@/lib/anamnese/questionnaires";
import { calcularRiscoCardiovascular } from "@/lib/anamnese/riscoCardiovascular";
import { linhasDorPorRegiao, regioesEfetivas } from "@/lib/anamnese/dorPorRegiao";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { avaliarVO2max, fcAlvoKarvonen, fcMaxTanaka, testePrincipalDoRegistro, vo2maxDeRegistro, ROTULO_CLASSE_VO2 } from "@/lib/avaliacao/cardiorrespiratoria";
import { paraNumero } from "@/lib/numeros";
import { triarSarcopeniaDinapenia } from "./sarcopenia";
import { conectarObjetivo } from "./objetivo";
import type { DomainKey, DomainResult, PerfilIntegrado } from "./perfil";
import type { Categoria, Encaminhamento, Evidencia, Horizonte, ItemPlano, Referencia, SugestaoPlano } from "./plano";

function gerarId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Referências (todas consultadas; links para o resumo/artigo)
// ---------------------------------------------------------------------------
const R: Record<string, Referencia> = {
  OMS_2020: { rotulo: "OMS 2020 - Diretrizes de atividade física e comportamento sedentário", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/" },
  ACSM_FORCA_2026: {
    rotulo: "ACSM 2026 - Prescrição de treino de força (visão geral de revisões, adultos saudáveis)",
    url: "https://www.ovid.com/jnls/acsm-msse/fulltext/10.1249/mss.0000000000003897~american-college-of-sports-medicine-position-stand",
  },
  ACSM_2011: { rotulo: "ACSM 2011 - Quantidade e qualidade de exercício (aeróbio, flexibilidade)", url: "https://pubmed.ncbi.nlm.nih.gov/21694556/" },
  ACSM_PESO_2009: { rotulo: "ACSM 2009 - Atividade física para perda e manutenção de peso", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3925973/" },
  ACSM_TRIAGEM_2015: { rotulo: "ACSM 2015 - Triagem pré-participação em exercício", url: "https://pubmed.ncbi.nlm.nih.gov/26473759/" },
  FORCA_MORTALIDADE: { rotulo: "Treino de força e mortalidade - revisão sistemática (Am J Prev Med)", url: "https://www.ajpmonline.org/article/S0749-3797(22)00176-3/abstract" },
  COCHRANE_QUEDAS: { rotulo: "Cochrane (Sherrington, 2019) - Exercício para prevenir quedas em idosos", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6402469/" },
  ICFSR_2021: { rotulo: "ICFSR 2021 - Recomendações internacionais de exercício em idosos", url: "https://link.springer.com/article/10.1007/s12603-021-1665-8" },
  EWGSOP2: { rotulo: "EWGSOP2 (2019) - Consenso europeu de sarcopenia", url: "https://academic.oup.com/ageing/article/48/1/16/5126243" },
  PROT_AGE: { rotulo: "PROT-AGE (2013) - Proteína na dieta de idosos", url: "https://pubmed.ncbi.nlm.nih.gov/23867520/" },
  ESPEN_SARCOPENIA: { rotulo: "ESPEN (2014) - Proteína e exercício para função muscular no envelhecimento", url: "https://www.espen.org/files/PIIS0261561414001113.pdf" },
  AHA_ACR: { rotulo: "AHA 2016 - Aptidão cardiorrespiratória como sinal vital", url: "https://www.ahajournals.org/doi/full/10.1161/CIR.0000000000000461" },
  MANDSAGER_2018: { rotulo: "Mandsager et al. 2018 (JAMA Netw Open) - Aptidão e mortalidade, n = 122.007", url: "https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2707428" },
  KODAMA_2009: { rotulo: "Kodama et al. 2009 (JAMA) - Aptidão e mortalidade, meta-análise", url: "https://jamanetwork.com/journals/jama/fullarticle/1108396" },
  HIIT_2023: { rotulo: "Meta-análise 2023 - HIIT vs treino contínuo moderado (VO2pico)", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10048683/" },
  SINGH_2023: { rotulo: "Singh et al. 2023 (Br J Sports Med) - Atividade física para depressão, ansiedade e sofrimento", url: "https://doi.org/10.1136/bjsports-2022-106195" },
  ACP_INSONIA: { rotulo: "ACP 2016 - Manejo da insônia crônica (TCC-I como 1ª linha)", url: "https://pubmed.ncbi.nlm.nih.gov/27136449/" },
  NICE_NG59: { rotulo: "NICE NG59 - Dor lombar e ciática (educação, exercício)", url: "https://www.nice.org.uk/guidance/ng59" },
  MONITORAMENTO_DOR: { rotulo: "Modelo de monitoramento da dor (Thomeé; Silbernagel et al.)", url: "https://www.researchgate.net/publication/6497499_Continued_Sports_Activity_Using_a_Pain-Monitoring_Model_During_Rehabilitation_in_Patients_With_Achilles_Tendinopathy_A_Randomized_Controlled_Study" },
  MICHIE_2009: { rotulo: "Michie et al. 2009 (Health Psychol) - Técnicas efetivas em atividade física e alimentação", url: "https://www.research.ed.ac.uk/en/publications/effective-techniques-in-healthy-eating-and-physical-activity-inte/" },
};

// ---------------------------------------------------------------------------
// Contexto do paciente (dados que personalizam as sugestões)
// ---------------------------------------------------------------------------
type Ctx = {
  paciente: PacienteRow;
  perfil: PerfilIntegrado;
  a: Anamnese;
  idade: number | null;
  dom: (k: DomainKey) => DomainResult | undefined;
  fcAlvo: { min: number; max: number; fcMax: number; medida: boolean } | null;
  vo2Texto: string | null;
  sarcopenia: ReturnType<typeof triarSarcopeniaDinapenia>;
  parqPositivos: string[];
  riscoCV: "baixo" | "moderado" | "alto" | null;
  alertaGrave: boolean;
  dorLinhas: string[];
  dorCronica: boolean;
  tskAlto: boolean;
  pseqBaixo: boolean;
  psqiGlobal: number | null;
  suspeitaApneia: boolean;
  objetivoTexto: string;
};

function montarContexto(perfil: PerfilIntegrado, paciente: PacienteRow): Ctx {
  const a = mesclarComPadrao(paciente.anamnese);
  const idade = idadeEfetiva(paciente);
  const cardio = paciente.cardio ?? {};

  // FC alvo moderada (40-59% da FC de reserva, ACSM): FCmáx medida (maior entre os testes) ou Tanaka.
  const testes: any[] = Array.isArray(cardio.testes) ? cardio.testes : [];
  const fcsMedidas = [...testes.map((t) => paraNumero(t.fc_maxima_atingida)), paraNumero(cardio.fc_maxima_atingida)].filter((v): v is number => v !== null);
  const fcMedida = fcsMedidas.length > 0 ? Math.max(...fcsMedidas) : null;
  const fcMax = fcMedida ?? (idade !== null ? fcMaxTanaka(idade) : null);
  const principal = testePrincipalDoRegistro(cardio);
  const fcRepouso = paraNumero(principal?.fc_repouso_teste) ?? paraNumero(cardio.fc_repouso_teste) ?? paraNumero(paciente.fisica?.fc_repouso);
  const fcAlvo = fcMax !== null && fcRepouso !== null && fcMax > fcRepouso ? { min: fcAlvoKarvonen(fcRepouso, fcMax, 40), max: fcAlvoKarvonen(fcRepouso, fcMax, 59), fcMax, medida: fcMedida !== null } : null;

  const vo2 = vo2maxDeRegistro(cardio);
  const av = vo2 !== null ? avaliarVO2max(vo2, idade, sexoEfetivo(paciente)) : null;
  const vo2Texto = vo2 !== null ? `VO2máx ≈ ${Math.round(vo2)} ml/kg/min${av ? ` (${av.textoPercentil}, ${ROTULO_CLASSE_VO2[av.classe]})` : ""}` : null;

  const parq = a.prontidao.parq as Record<string, boolean | null>;
  const parqPositivos = perguntasParQ.filter((p) => parq[p.chave] === true).map((p) => p.texto);

  const por = regioesEfetivas(a.dor);
  const dorCronica = Object.values(por).some((v) => ["3 a 6 meses", "6 meses a 1 ano", "Mais de 1 ano"].includes(v.duracao));
  const tsk = escoreTSK11(a.dor.tsk11);
  const pseq = somaSemNulos(a.dor.pseq);

  const psqi = calcularPSQI(a);
  const suspeitaApneia = (a.psqi.freq_respirar_mal ?? 0) >= 2 || (a.psqi.freq_tosse_ronco ?? 0) >= 2;

  const motivo = a.motivo;
  const objetivoTexto = [motivo.objetivos, motivo.atividades_perdidas].filter(Boolean).join(" · ");

  return {
    paciente,
    perfil,
    a,
    idade,
    dom: (k) => perfil.dominios.find((d) => d.chave === k),
    fcAlvo,
    vo2Texto,
    sarcopenia: triarSarcopeniaDinapenia(paciente),
    parqPositivos,
    riscoCV: calcularRiscoCardiovascular(paciente)?.classificacao ?? null,
    alertaGrave: (paciente.alertas ?? []).some((al) => al.nivel >= 3),
    dorLinhas: linhasDorPorRegiao(a.dor),
    dorCronica,
    tskAlto: tsk !== null && tsk >= 26,
    pseqBaixo: pseq !== null && pseq < 40,
    psqiGlobal: psqi ? psqi.global : null,
    suspeitaApneia,
    objetivoTexto,
  };
}

const precisaAtencao = (d?: DomainResult): d is DomainResult => !!d && (d.classificacao === "prioridade" || d.classificacao === "atencao");

function textoFC(ctx: Ctx): string {
  return ctx.fcAlvo
    ? `FC alvo ≈ ${Math.round(ctx.fcAlvo.min)}-${Math.round(ctx.fcAlvo.max)} bpm (40-59% da FC de reserva; FCmáx ${ctx.fcAlvo.medida ? "medida" : "prevista"} ${Math.round(ctx.fcAlvo.fcMax)} bpm)`
    : "esforço moderado (PSE 11-13 na escala de Borg 6-20: consegue conversar com algum esforço)";
}

// ---------------------------------------------------------------------------
// Construção dos itens
// ---------------------------------------------------------------------------
// Frentes de intervenção simultâneas no início: acima de 3 domínios, o excedente
// começa 1 horizonte depois (adesão: muitas mudanças ao mesmo tempo falham).
const MAX_FRENTES_INICIAIS = 3;
const PROXIMO_HORIZONTE: Record<string, Horizonte> = { "30": "60", "60": "90", "90": "365", "365": "365" };

type Emissor = (regra: string, h: Horizonte, categoria: Categoria, descricao: string, extra?: { indicador?: string; resultado?: string; evidencia?: Evidencia | null }) => void;

function criarEmissor(ctx: Ctx, dominio: DomainResult, adiado: boolean, saida: ItemPlano[]): Emissor {
  const prefixo = dominio.classificacao === "prioridade" ? "Risco" : "Limitação";
  return (regra, h, categoria, descricao, extra) => {
    const adiar = adiado && categoria === "intervencao";
    saida.push({
      id: gerarId(),
      horizonte: adiar ? PROXIMO_HORIZONTE[h] : h,
      descricao: adiar && h === "30" ? `${descricao} (Entra em 60 dias para não sobrecarregar o início: no máximo ${MAX_FRENTES_INICIAIS} frentes ao mesmo tempo.)` : descricao,
      origem: `${prefixo} — ${dominio.titulo}`,
      categoria,
      dominio: dominio.chave,
      regra: `${dominio.chave}|${regra}`,
      resultado: extra?.resultado ?? dominio.justificativa,
      evidencia: extra?.evidencia ?? undefined,
      indicador: extra?.indicador,
      objetivoPaciente: conectarObjetivo(dominio, ctx.a.motivo) ?? undefined,
      status: "sugerido",
    });
  };
}

// ---------------------------------------------------------------------------
// Regras por domínio
// ---------------------------------------------------------------------------
type RegraDominio = (ctx: Ctx, d: DomainResult, emit: Emissor, enc: Encaminhamento[]) => void;

const REGRAS: Partial<Record<DomainKey, RegraDominio>> = {
  forca: (ctx, d, emit, enc) => {
    const evid: Evidencia = {
      resumo:
        "O treino de força melhora força, potência, velocidade de marcha, equilíbrio e função física. A OMS recomenda força em ≥ 2 dias/semana; qualquer quantidade de treino de força se associa a menor mortalidade (observacional); a diretriz ACSM 2026 (adultos saudáveis) aponta ≥ 2 sessões/semana, 2-3 séries e esforço perto da falha (2-3 repetições em reserva), com cargas ≥ 80% de 1RM favorecendo a força máxima e cerca de 10 séries/grupo/semana para hipertrofia.",
      certeza: "Alta para ganho de força e função (revisões de ensaios); observacional para mortalidade.",
      ressalva: "A diretriz do ACSM é para adultos saudáveis - adapte a doenças, dor e risco cardiovascular; cargas pesadas só com técnica consolidada e sem contraindicação.",
      referencias: [R.OMS_2020, R.ACSM_FORCA_2026, R.FORCA_MORTALIDADE],
    };
    emit("30", "30", "intervencao", "Treino de força 2x/semana (dias não consecutivos): 6-8 exercícios para os grandes grupos (agachar/sentar-levantar, empurrar, puxar, ponte/quadril, core), 1-2 séries de 10-15 repetições com carga leve a moderada (esforço 5-6 de 10) e técnica supervisionada. Meta do mês: aprender os movimentos e criar o hábito.", {
      indicador: "Adesão ≥ 80% das sessões e execução técnica correta nos exercícios principais.",
      evidencia: evid,
    });
    emit("60", "60", "intervencao", "Progredir para 2-3 séries por exercício, 2x/semana (3x se tolerar), aproximando o esforço de 2-3 repetições em reserva; aumentar a carga cerca de 5-10% quando completar todas as séries/repetições com boa técnica.", {
      indicador: "Carga ou repetições maiores em ≥ 3 dos exercícios principais.",
      evidencia: evid,
    });
    emit("90", "90", "intervencao", "Consolidar 2-3x/semana, 2-3 séries, 2-3 repetições em reserva. Para ganho de força máxima, incluir séries mais pesadas (até ≥ 80% de 1RM) só com técnica consolidada e sem contraindicação cardiovascular; associar potência leve (levantar rápido, descer controlado) em idosos.", {
      indicador: `Sair da zona de força reduzida nos testes (hoje: ${d.justificativa})`,
      evidencia: evid,
    });
    emit("365", "365", "intervencao", "Manter treino de força ≥ 2x/semana de forma contínua (a interrupção reverte os ganhos); periodizar a cada 8-12 semanas e reavaliar a força a cada 90 dias.", {
      indicador: "Força mantida/melhorada nas reavaliações trimestrais; adesão ao longo de 12 meses.",
      evidencia: evid,
    });
    if (ctx.sarcopenia.classificacao === "sarcopenia_provavel" || ctx.sarcopenia.classificacao === "dinapenia_provavel") {
      const evSarc: Evidencia = {
        resumo:
          "Na sarcopenia/dinapenia, o treino de resistência é a base do tratamento, e a ingestão proteica de 1,0-1,2 g/kg/dia em idosos saudáveis (1,2-1,5 g/kg/dia com doença crônica) apoia o ganho muscular. O diagnóstico exige confirmar a massa muscular (DXA/bioimpedância segmentar); a triagem do sistema é aproximada.",
        certeza: "Diretrizes/consensos de especialistas e ensaios clínicos.",
        ressalva: "Ajuste proteico em doença renal ou outras condições é decisão médica/nutricional.",
        referencias: [R.EWGSOP2, R.PROT_AGE, R.ESPEN_SARCOPENIA],
      };
      emit("sarcopenia", "30", "orientacao", `A triagem sugere ${ctx.sarcopenia.classificacao === "sarcopenia_provavel" ? "sarcopenia provável" : "dinapenia provável"}: combinar o treino de força com ingestão proteica adequada (~1,0-1,2 g/kg/dia, distribuída nas refeições) e confirmar a massa muscular com DXA/bioimpedância segmentar.`, {
        resultado: ctx.sarcopenia.justificativa,
        indicador: "Confirmação da massa muscular; força e massa magra estáveis ou crescentes na reavaliação de 90 dias.",
        evidencia: evSarc,
      });
      enc.push({
        id: gerarId(),
        especialidade: "Nutrição",
        motivo: "Triagem de sarcopenia/dinapenia positiva: avaliar e ajustar a ingestão proteica e energética junto do treino de força.",
        regra: "forca|nutricao-sarcopenia",
        evidencia: evSarc,
        status: "sugerido",
      });
    }
  },

  equilibrio: (ctx, d, emit) => {
    const idoso = ctx.idade !== null && ctx.idade >= 65;
    const evid: Evidencia = {
      resumo:
        "Exercícios que desafiam o equilíbrio e a função reduzem a taxa de quedas em cerca de 23% em idosos da comunidade (Cochrane 2019, evidência de alta certeza). A OMS recomenda, a partir de 65 anos, atividade multicomponente com equilíbrio e força em ≥ 3 dias/semana, em intensidade moderada ou maior.",
      certeza: "Alta (ensaios clínicos randomizados e revisão Cochrane).",
      ressalva: "Evidência de quedas é em idosos; em adultos mais jovens os mesmos exercícios são razoáveis, mas o efeito sobre quedas é menos estudado.",
      referencias: [R.COCHRANE_QUEDAS, R.OMS_2020],
    };
    if (ctx.a.historico_saude.quedas_12m) {
      emit("seguranca-casa", "30", "orientacao", "Houve queda nos últimos 12 meses: revisar riscos domiciliares (tapetes, iluminação, piso escorregadio), calçado e uso de medicamentos com o médico; ensinar como se levantar do chão com segurança. Exercícios de equilíbrio sempre com apoio ao alcance (barra/parede).", {
        indicador: "Nenhuma nova queda; paciente sabe levantar-se do chão.",
        evidencia: evid,
      });
    }
    emit("30", "30", "intervencao", "Exercícios de equilíbrio 2-3x/semana, 10-15 min por sessão: apoio unipodal com apoio leve, posição em linha (tandem), transferência de peso, levantar-sentar com controle.", {
      indicador: "Apoio unipodal ≥ 10 s no lado mais fraco e TUG < 12 s, sem apoio de mãos.",
      evidencia: evid,
    });
    emit("60", "60", "intervencao", "Reduzir o apoio e a base de sustentação: olhos abertos sem apoio, dupla tarefa (contar, carregar objeto), superfície levemente instável, caminhar em linha; 3x/semana.", {
      indicador: "Aumento do tempo de apoio unipodal; menor oscilação nas tarefas duplas.",
      evidencia: evid,
    });
    emit("90", "90", "intervencao", `Programa multicomponente (equilíbrio + força + marcha) ${idoso ? "em ≥ 3 dias/semana (OMS, ≥ 65 anos)" : "em 2-3 dias/semana"}, podendo incluir versão domiciliar com progressão (tipo Otago) e reavaliação de equilíbrio e risco de queda.`, {
      indicador: `Reavaliar apoio unipodal, TUG e 5xSTS (hoje: ${d.justificativa})`,
      evidencia: evid,
    });
    emit("365", "365", "intervencao", `Manter atividade multicomponente ${idoso ? "≥ 3 dias/semana" : "2-3 dias/semana"}; reavaliar equilíbrio e histórico de quedas a cada 90 dias.`, {
      indicador: "Sem quedas em 12 meses; testes de equilíbrio estáveis ou melhores.",
      evidencia: evid,
    });
  },

  capacidade_cardiorrespiratoria: (ctx, d, emit) => {
    const evid: Evidencia = {
      resumo:
        "A aptidão cardiorrespiratória é um dos mais fortes preditores de mortalidade (a baixa aptidão pesa tanto ou mais que fatores de risco tradicionais; maior benefício ao sair da faixa mais baixa). A cada +1 MET, o risco de morte por qualquer causa é cerca de 13% menor e o de eventos cardiovasculares cerca de 15% menor (meta-análise). A OMS recomenda 150-300 min/semana de atividade moderada (ou 75-150 vigorosa); o treino intervalado de alta intensidade eleva o VO2pico um pouco mais que o contínuo moderado (+1,9 ml/kg/min em meta-análise). Zonas do ACSM: moderada = 40-59% e vigorosa = 60-89% da FC de reserva.",
      certeza: "Observacional (mortalidade) e meta-análise de ensaios (VO2pico).",
      ressalva: "Treino vigoroso/intervalado exige triagem (PAR-Q+, risco cardiovascular) e, se indicado, liberação médica. A FCmáx prevista tem erro individual de ±11 bpm.",
      referencias: [R.OMS_2020, R.ACSM_2011, R.AHA_ACR, R.MANDSAGER_2018, R.KODAMA_2009, R.HIIT_2023],
    };
    emit("30", "30", "intervencao", `Aeróbio contínuo de intensidade moderada, 3-5x/semana, 20-30 min, ${textoFC(ctx)}. Se for sedentário, comece com 10-15 min e some 5 min por semana.`, {
      indicador: ctx.vo2Texto ? `Hoje: ${ctx.vo2Texto}. Aderência ≥ 3 sessões/semana.` : "Aderência ≥ 3 sessões/semana; PSE e FC no alvo.",
      evidencia: evid,
    });
    emit("60", "60", "intervencao", "Aumentar o volume em até ~10% por semana até 150 min/semana de atividade moderada; incluir 1 sessão com ritmo variado (ex.: 4-6 × 2 min um pouco mais intensos, 2 min leves) se tolerar e sem sinais de alerta.", {
      indicador: "≥ 150 min/semana acumulados; FC em esforço padrão menor que no início.",
      evidencia: evid,
    });
    emit("90", "90", "intervencao", "Meta da OMS: 150-300 min/semana moderados (ou 75-150 vigorosos). Se o objetivo for elevar o VO2máx e houver liberação, 1-2 sessões/semana de treino intervalado de alta intensidade (ex.: 4 × 4 min a 85-95% da FCmáx, com recuperação ativa).", {
      indicador: ctx.vo2Texto ? `Reteste de VO2 (mesmo protocolo). Hoje: ${ctx.vo2Texto}.` : "Reteste de VO2 (mesmo protocolo) e comparação com a linha de base.",
      evidencia: evid,
    });
    emit("365", "365", "intervencao", "Manter ≥ 150 min/semana de atividade; retestar o VO2 a cada 90 dias com o mesmo protocolo. Meta do ano: subir de faixa de percentil e ganhar ~1 MET (≈ 3,5 ml/kg/min).", {
      indicador: ctx.vo2Texto ? `Meta: +1 MET em 12 meses a partir de: ${ctx.vo2Texto}.` : "Meta: +1 MET em 12 meses.",
      evidencia: evid,
    });
  },

  composicao_corporal: (ctx, d, emit, enc) => {
    const fis = ctx.paciente.fisica ?? {};
    const peso = paraNumero(fis.peso_kg);
    const altura = paraNumero(fis.altura_cm);
    const imc = peso !== null && altura !== null ? peso / Math.pow(altura / 100, 2) : null;
    const evidPeso: Evidencia = {
      resumo:
        "Para peso: 150-250 min/semana de atividade moderada previnem ganho e produzem perda modesta; mais de 250 min/semana se associam a perda clinicamente significativa (≥ 5%). Automonitoramento combinado a outra técnica de mudança de comportamento (metas, feedback) foi mais efetivo (efeito 0,42 vs 0,26). Força preserva a massa magra durante a perda de peso.",
      certeza: "Posição de consenso (ACSM) e meta-regressão de ensaios.",
      ressalva: "Prescrição alimentar é da Nutrição. Atividade física sozinha costuma dar perda de peso modesta; o efeito vem do conjunto.",
      referencias: [R.ACSM_PESO_2009, R.MICHIE_2009, R.ACSM_FORCA_2026],
    };
    if (imc !== null && imc < 18.5) {
      emit("baixo-peso", "30", "orientacao", "IMC abaixo de 18,5: investigar causa (avaliação médica/nutricional) antes de aumentar o volume de exercício; priorizar força e aporte energético e proteico adequado.", {
        indicador: "Avaliação feita; peso estável ou crescente com preservação de força.",
        evidencia: null,
      });
      enc.push({ id: gerarId(), especialidade: "Avaliação médica e Nutrição", motivo: "IMC abaixo de 18,5: investigar causa e planejar recuperação nutricional.", regra: "composicao_corporal|baixo-peso", status: "sugerido" });
      return;
    }
    emit("30", "30", "intervencao", "Base de hábitos: 150 min/semana de atividade aeróbia moderada (inclusive em blocos de 10 min) + força 2x/semana; registrar peso e cintura 1x/semana (automonitoramento) e definir uma meta específica por escrito.", {
      indicador: "Registro semanal feito; ≥ 150 min/semana em 4-6 semanas.",
      evidencia: evidPeso,
    });
    emit("60", "60", "intervencao", "Elevar para 200-250 min/semana de atividade moderada (ou combinar com vigorosa, se liberado) mantendo a força; meta intermediária: 3-5% do peso, se houver indicação de perda.", {
      indicador: "Cintura e peso em tendência de queda; massa magra relativa mantida.",
      evidencia: evidPeso,
    });
    emit("90", "90", "intervencao", "Acima de 250 min/semana é o volume associado a perda clinicamente significativa (≥ 5%) - escalonar conforme tolerância e tempo disponível; manter força 2-3x/semana e proteína adequada para preservar a massa magra.", {
      indicador: "Cintura abaixo do corte da OMS e relação cintura/estatura < 0,5; %G na faixa ideal para idade/sexo.",
      evidencia: evidPeso,
    });
    emit("365", "365", "intervencao", "Fase de manutenção: 200-300 min/semana de atividade e força 2-3x/semana; reavaliar composição a cada 90 dias com o mesmo método.", {
      indicador: "Peso mantido (±3%) e medidas estáveis ou melhores em 12 meses.",
      evidencia: evidPeso,
    });
    if (imc !== null && imc >= 25) {
      enc.push({
        id: gerarId(),
        especialidade: "Nutrição",
        motivo: "Excesso de peso/adiposidade: plano alimentar individualizado associado ao programa de exercício.",
        regra: "composicao_corporal|nutricao",
        evidencia: evidPeso,
        status: "sugerido",
      });
    }
  },

  dor: (ctx, d, emit, enc) => {
    const evid: Evidencia = {
      resumo:
        "Em dor musculoesquelética persistente, as diretrizes (ex.: NICE NG59 para dor lombar) recomendam educação e exercício como base do cuidado. Durante a reabilitação, o modelo de monitoramento da dor aceita dor de até 5/10 durante e logo após o exercício, desde que volte ao nível de base na manhã seguinte.",
      certeza: "Diretriz (NICE) para dor lombar; o modelo de monitoramento vem de ensaios em tendinopatias - extrapolar com cautela para outras regiões.",
      ressalva: "Sinais de alerta (dor noturna que não melhora, perda de peso inexplicada, febre, déficit neurológico progressivo, alteração esfincteriana) exigem avaliação médica antes de intensificar o exercício.",
      referencias: [R.NICE_NG59, R.MONITORAMENTO_DOR],
    };
    const bandeiras = ctx.a.dor.bandeiras_vermelhas ?? [];
    if (bandeiras.length > 0) {
      emit("bandeira-vermelha", "30", "seguranca", `Sinal(is) de alerta relatado(s): ${bandeiras.join("; ")}. Encaminhar para avaliação médica antes de intensificar o exercício; até lá, apenas atividade leve que não piore os sintomas.`, {
        indicador: "Avaliação médica realizada e conduta registrada.",
        evidencia: evid,
      });
      enc.push({ id: gerarId(), especialidade: "Avaliação médica", motivo: `Dor com sinal(is) de alerta: ${bandeiras.join("; ")}.`, regra: "dor|bandeira", evidencia: evid, status: "sugerido" });
    }
    const regioes = ctx.dorLinhas.length > 0 ? ` Regiões: ${ctx.dorLinhas.join("; ")}.` : "";
    emit("30", "30", "intervencao", `Educação em dor (dor não significa necessariamente lesão; movimento é seguro e terapêutico) + exercício leve em amplitude confortável, 3-5x/semana, usando o monitoramento: dor durante/após ≤ 5/10 e de volta ao nível de base na manhã seguinte.${regioes}`, {
      indicador: "Dor (0-10) estável ou menor por região; paciente consegue manter a atividade sem piora no dia seguinte.",
      evidencia: evid,
    });
    emit("60", "60", "intervencao", "Progressão gradual de carga nas regiões dolorosas: mudar uma variável por vez (carga, volume ou amplitude), cerca de 10% por semana, mantendo o aeróbio leve; reavaliar a dor por região (0-10).", {
      indicador: "Maior carga tolerada com a mesma dor; retorno às atividades cotidianas.",
      evidencia: evid,
    });
    emit("90", "90", "intervencao", `Fortalecimento específico e retorno às atividades que o paciente deixou de fazer${ctx.a.motivo.atividades_perdidas ? ` (${ctx.a.motivo.atividades_perdidas})` : ""}.`, {
      indicador: "Intensidade máxima de dor menor que a inicial e atividade-alvo retomada.",
      evidencia: evid,
    });
    emit("365", "365", "intervencao", "Autogestão: plano de exercício contínuo e estratégia para crises de dor (reduzir carga por alguns dias, manter movimento); reavaliar a cada 90 dias.", {
      indicador: "Dor controlada sem restrição relevante de atividade ao longo de 12 meses.",
      evidencia: evid,
    });
    if (ctx.dorCronica || ctx.tskAlto || ctx.pseqBaixo) {
      emit("psicossocial", "30", "orientacao", `Fatores que perpetuam a dor: ${[ctx.dorCronica ? "dor há ≥ 3 meses" : "", ctx.tskAlto ? "medo de movimento alto (TSK-11 ≥ 26)" : "", ctx.pseqBaixo ? "baixa autoeficácia para dor (PSEQ < 40)" : ""].filter(Boolean).join("; ")}. Reforçar educação, exposição gradual ao movimento temido e, se persistir, considerar apoio psicológico.`, {
        indicador: "TSK-11 e PSEQ melhores na reavaliação de 90 dias.",
        evidencia: evid,
      });
    }
  },

  sono: (ctx, d, emit, enc) => {
    const evid: Evidencia = {
      resumo:
        "Para insônia crônica, a terapia cognitivo-comportamental para insônia (TCC-I) é o tratamento inicial recomendado (recomendação forte, evidência de qualidade moderada - ACP). A atividade física regular melhora a qualidade do sono. Ronco alto/pausas respiratórias justificam avaliação médica para apneia do sono.",
      certeza: "Diretriz (ACP) para TCC-I; efeito do exercício sobre o sono: evidência moderada.",
      referencias: [R.ACP_INSONIA],
    };
    emit("30", "30", "orientacao", "Higiene do sono: horários regulares para deitar/acordar, luz natural pela manhã, evitar cafeína e telas à noite; manter atividade física regular e evitar exercício vigoroso na hora antes de dormir se isso atrapalhar o sono.", {
      indicador: ctx.psqiGlobal !== null ? `PSQI hoje ${ctx.psqiGlobal}/21; meta ≤ 5.` : "Qualidade de sono percebida (1-5) melhor na reavaliação.",
      evidencia: evid,
    });
    emit("60", "60", "orientacao", "Reavaliar o sono (diário de sono de 2 semanas ou PSQI) e ajustar a rotina; se sem melhora, encaminhar.", { evidencia: evid });
    emit("90", "90", "reavaliacao", "Repetir o PSQI (módulo de sono): se continuar > 5, encaminhar para TCC-I/medicina do sono.", { indicador: "PSQI ≤ 5 ou queda ≥ 3 pontos.", evidencia: evid });
    emit("365", "365", "orientacao", "Manter hábitos de sono e reavaliar a cada 90 dias; revisar se houver mudança de rotina, dor ou humor.", { evidencia: evid });
    if ((ctx.psqiGlobal ?? 0) > 10) {
      enc.push({ id: gerarId(), especialidade: "Psicologia (TCC-I) / Medicina do sono", motivo: `PSQI ${ctx.psqiGlobal}/21 (muito acima do corte): sono de má qualidade importante.`, regra: "sono|tcc-i", evidencia: evid, status: "sugerido" });
    }
    if (ctx.suspeitaApneia) {
      enc.push({ id: gerarId(), especialidade: "Avaliação médica (apneia do sono)", motivo: "Dificuldade para respirar ou ronco/tosse frequentes durante o sono (itens do PSQI): triagem para apneia do sono.", regra: "sono|apneia", evidencia: evid, status: "sugerido" });
    }
  },

  bem_estar: (ctx, d, emit, enc) => {
    const ideacao = (ctx.a.saude_mental.phq9[8] ?? 0) > 0;
    const evid: Evidencia = {
      resumo:
        "Em uma revisão guarda-chuva de 97 revisões sistemáticas (1.039 estudos), a atividade física teve efeito médio sobre depressão (−0,43), ansiedade (−0,42) e sofrimento psicológico (−0,60) frente ao cuidado usual, em todos os modos de exercício, com benefício maior em intensidades mais altas (respeitando a adaptação).",
      certeza: "Revisão guarda-chuva de revisões sistemáticas (heterogeneidade alta entre estudos).",
      ressalva: "Exercício complementa - não substitui - avaliação e tratamento em saúde mental. Escores do GAD-7/PHQ-9 são triagem, não diagnóstico.",
      referencias: [R.SINGH_2023],
    };
    if (ideacao) {
      emit("ideacao", "30", "seguranca", "Resposta positiva ao item de pensamentos de autolesão (PHQ-9): encaminhamento prioritário a Psicologia/Psiquiatria e acolhimento do paciente em ambiente reservado, sem adiar. O CVV atende 24 h, gratuitamente, no 188. O exercício só entra como complemento após avaliação profissional.", {
        indicador: "Encaminhamento realizado e contato de seguimento confirmado.",
        evidencia: null,
      });
      enc.push({ id: gerarId(), especialidade: "Psicologia/Psiquiatria (prioritário)", motivo: "PHQ-9: item de ideação de autolesão positivo.", regra: "bem_estar|ideacao", status: "sugerido" });
    } else if (d.classificacao === "prioridade") {
      enc.push({ id: gerarId(), especialidade: "Psicologia/Psiquiatria (triagem)", motivo: d.justificativa, regra: "bem_estar|triagem", evidencia: evid, status: "sugerido" });
    }
    if (ctx.a.saude_mental.sinalizacao === "sim" && d.classificacao !== "adequado" && (ctx.a.saude_mental.gad7.every((v) => v === null) && ctx.a.saude_mental.phq9.every((v) => v === null))) {
      emit("oferecer-questionario", "30", "reavaliacao", "O paciente disse que estresse, ansiedade ou humor atrapalham bastante o dia a dia: oferecer o questionário de bem-estar emocional (módulo à parte) e conversar com acolhimento.", {
        indicador: "Questionário respondido; conduta definida após a triagem.",
        evidencia: null,
      });
    }
    emit("30", "30", "intervencao", "Exercício regular como parte do cuidado: aeróbio e/ou força, 3x/semana, 30-45 min, de preferência em grupo ou supervisionado; adaptar intensidade ao conforto e à rotina.", {
      indicador: "Adesão ≥ 3 sessões/semana; percepção de humor/estresse melhor.",
      evidencia: evid,
    });
    emit("60", "60", "intervencao", "Manter a regularidade e aumentar gradualmente a intensidade conforme tolerância; acompanhar sinais de piora e conversar sobre eles na reavaliação.", {
      indicador: "Regularidade mantida (≥ 3 sessões/semana) sem piora do humor ou da ansiedade.",
      evidencia: evid,
    });
    emit("90", "90", "reavaliacao", "Repetir GAD-7/PHQ-9 (módulo de bem-estar) e comparar com a triagem inicial; ajustar o plano e os encaminhamentos.", { indicador: "Queda dos escores ou manutenção em faixa mínima.", evidencia: evid });
    emit("365", "365", "intervencao", "Manter a prática regular como estratégia contínua de saúde mental; reavaliar a cada 90 dias.", {
      indicador: "Escores de GAD-7/PHQ-9 em faixa mínima e prática mantida em 12 meses.",
      evidencia: evid,
    });
  },

  estilo_de_vida: (ctx, d, emit) => {
    const barreiras = ctx.a.estilo_vida.barreiras_exercicio ?? [];
    const evid: Evidencia = {
      resumo:
        "Intervenções de atividade física e alimentação foram mais efetivas quando combinaram automonitoramento com ao menos outra técnica baseada em controle (metas, feedback, revisão das metas): efeito 0,42 vs 0,26. A OMS recomenda limitar o tempo sedentário e substituí-lo por qualquer atividade, de qualquer intensidade.",
      certeza: "Meta-regressão de 122 avaliações (heterogeneidade alta) e diretriz da OMS.",
      referencias: [R.MICHIE_2009, R.OMS_2020],
    };
    emit("30", "30", "intervencao", `Começar pequeno: metas específicas e mensuráveis (ex.: "caminhar 15 min às terças, quintas e sábados"), automonitoramento (diário ou passos) e pausas ativas a cada 30-60 min sentado.${barreiras.length > 0 ? ` Barreiras relatadas: ${barreiras.join("; ")} - planejar uma estratégia para cada uma.` : ""}`, {
      indicador: "≥ 2 das metas semanais cumpridas por 4 semanas; registro mantido.",
      evidencia: evid,
    });
    emit("60", "60", "intervencao", "Aumentar a frequência para 3-4x/semana e revisar as barreiras e as metas (ajustar o que não funcionou).", {
      indicador: "Frequência semanal subiu em relação ao primeiro mês; barreiras revisadas.",
      evidencia: evid,
    });
    emit("90", "90", "intervencao", "Consolidar a rotina: horários fixos, atividade de que o paciente goste e rede de apoio (grupo, parceiro de treino).", { indicador: "Rotina mantida ≥ 80% das semanas.", evidencia: evid });
    emit("365", "365", "intervencao", "Manutenção: revisar metas a cada 90 dias e planejar como retomar após interrupções (viagens, doença).", {
      indicador: "Atividade regular mantida na maior parte das semanas do ano; plano de retomada definido.",
      evidencia: evid,
    });
  },

  mobilidade: (ctx, d, emit) => {
    const evid: Evidencia = {
      resumo: "Alongamento estático: ≥ 2-3 dias/semana (ganhos maiores se diário), manter 10-30 s (30-60 s em idosos), 2-4 repetições, cerca de 60 s no total por exercício, até o ponto de leve desconforto.",
      certeza: "Posição de consenso (ACSM) em adultos aparentemente saudáveis.",
      ressalva: "A classificação de mobilidade do sistema depende de observação e dos testes de flexibilidade/goniometria: confirme com medidas objetivas.",
      referencias: [R.ACSM_2011],
    };
    emit("30", "30", "intervencao", "Mobilidade/alongamento 2-3x/semana nas regiões com restrição observada: alongamento estático de 10-30 s (30-60 s se ≥ 65 anos), 2-4 repetições por exercício, sem dor.", { indicador: "Sessões realizadas; ausência de dor durante o alongamento.", evidencia: evid });
    emit("60", "60", "intervencao", "Associar à mobilidade ativa (amplitude controlada nos movimentos do treino) e ampliar para a prática quase diária.", {
      indicador: "Prática ≥ 4x/semana; maior amplitude percebida nos movimentos do treino.",
      evidencia: evid,
    });
    emit("90", "90", "reavaliacao", "Reavaliar flexibilidade e amplitude (sentar e alcançar, Back Scratch, goniometria) e comparar com o início.", { indicador: "Ganho de amplitude/alcance em relação à linha de base.", evidencia: evid });
    emit("365", "365", "intervencao", "Manter mobilidade como parte fixa do aquecimento/volta à calma.", {
      indicador: "Amplitude/alcance mantidos ou melhores nas reavaliações trimestrais.",
      evidencia: evid,
    });
  },

  funcionalidade: (ctx, d, emit) => {
    const evid: Evidencia = {
      resumo: "Exercícios de equilíbrio e funcionais reduzem quedas (alta certeza) e atividade multicomponente com força e equilíbrio melhora a função física em idosos. O TUG isolado detecta mal o risco de queda (sensibilidade ~0,31): interpretar com os demais testes.",
      certeza: "Alta (Cochrane) para quedas; consenso para multicomponente.",
      referencias: [R.COCHRANE_QUEDAS, R.OMS_2020, R.ICFSR_2021],
    };
    emit("30", "30", "intervencao", "Treino funcional 2-3x/semana integrando força e equilíbrio: sentar-levantar, subir degraus, caminhar com mudança de direção, carregar objetos.", { indicador: "TUG < 12 s e velocidade de marcha > 0,8 m/s (ideal ≥ 1,0 m/s).", evidencia: evid });
    emit("60", "60", "intervencao", "Progredir velocidade, altura de degrau e carga dos movimentos funcionais; incluir dupla tarefa.", {
      indicador: "Mais repetições no sentar-levantar e subida de degraus com menos apoio.",
      evidencia: evid,
    });
    emit("90", "90", "reavaliacao", "Reavaliar TUG, 5xSTS/Chair Stand e velocidade de marcha.", { indicador: "Melhora em ≥ 2 dos testes funcionais.", evidencia: evid });
    emit("365", "365", "intervencao", "Manter treino funcional contínuo e reavaliar a cada 90 dias.", {
      indicador: "TUG < 12 s e velocidade de marcha ≥ 1,0 m/s mantidos nas reavaliações.",
      evidencia: evid,
    });
  },
};

// Precedência funcional entre domínios (menor índice = começa antes).
const PRECEDENCIA: DomainKey[] = [
  "dor",
  "bem_estar",
  "equilibrio",
  "forca",
  "capacidade_cardiorrespiratoria",
  "funcionalidade",
  "composicao_corporal",
  "sono",
  "mobilidade",
  "estilo_de_vida",
];

// Testes a repetir por domínio (plano de reavaliações).
const TESTES_POR_DOMINIO: Partial<Record<DomainKey, string>> = {
  forca: "força (dinamometria, 5xSTS, Chair Stand, Arm Curl)",
  equilibrio: "equilíbrio (apoio unipodal, TUG)",
  capacidade_cardiorrespiratoria: "capacidade cardiorrespiratória (teste de VO2 no mesmo protocolo, velocidade de marcha)",
  composicao_corporal: "composição corporal (peso, circunferências, dobras/bioimpedância)",
  dor: "dor (intensidade 0-10 por região)",
  sono: "sono (PSQI)",
  bem_estar: "bem-estar (GAD-7/PHQ-9)",
  mobilidade: "mobilidade (flexibilidade, goniometria)",
  funcionalidade: "função (TUG, velocidade de marcha)",
  estilo_de_vida: "hábitos (atividade, adesão)",
};

// ---------------------------------------------------------------------------
// Montagem do plano
// ---------------------------------------------------------------------------
export function sugerirItensComCiencia(perfil: PerfilIntegrado, paciente: PacienteRow): SugestaoPlano {
  const ctx = montarContexto(perfil, paciente);
  const itens: ItemPlano[] = [];
  const encaminhamentos: Encaminhamento[] = [];

  // 1) Segurança antes de tudo.
  const evidTriagem: Evidencia = {
    resumo:
      "A triagem pré-participação do ACSM considera o nível atual de atividade, a presença de sinais/sintomas ou doença cardiovascular, metabólica ou renal e a intensidade pretendida. Testes máximos e treino vigoroso exigem cautela e, quando houver sintomas ou doença, liberação médica.",
    certeza: "Posição de consenso.",
    referencias: [R.ACSM_TRIAGEM_2015],
  };
  if (ctx.parqPositivos.length > 0 || ctx.riscoCV === "alto" || ctx.alertaGrave) {
    const motivos = [
      ctx.parqPositivos.length > 0 ? `PAR-Q+ com ${ctx.parqPositivos.length} resposta(s) positiva(s)` : "",
      ctx.riscoCV === "alto" ? "risco cardiovascular alto na triagem" : "",
      ctx.alertaGrave ? "alerta de precaução/encaminhamento na anamnese" : "",
    ].filter(Boolean);
    itens.push({
      id: gerarId(),
      horizonte: "30",
      descricao: `Obter liberação médica antes de testes máximos ou treino vigoroso (${motivos.join("; ")}). Até lá, atividade leve a moderada conforme orientação.`,
      origem: "Segurança — triagem de prontidão",
      categoria: "seguranca",
      regra: "seguranca|liberacao",
      resultado: motivos.join("; "),
      evidencia: evidTriagem,
      indicador: "Liberação (ou restrições) registrada no prontuário.",
      status: "sugerido",
    });
    encaminhamentos.push({ id: gerarId(), especialidade: "Avaliação médica (liberação para exercício)", motivo: motivos.join("; "), regra: "seguranca|medico", evidencia: evidTriagem, status: "sugerido" });
  }

  // 2) Dados que faltam.
  const pendentes = perfil.dominios.filter((d) => d.classificacao === "investigar");
  if (pendentes.length > 0) {
    itens.push({
      id: gerarId(),
      horizonte: "30",
      descricao: `Completar a avaliação dos domínios sem dados: ${pendentes.map((d) => d.titulo).join(", ")} - as sugestões ficam mais precisas depois.`,
      origem: "Perfil Integrado — dados pendentes",
      categoria: "reavaliacao",
      regra: "pendencias|30",
      resultado: pendentes.map((d) => `${d.titulo}: ${d.justificativa}`).join(" | "),
      status: "sugerido",
    });
  }

  // 3) Intervenções por domínio. Ordem de precedência (decide quais 3 frentes
  // começam em 30 dias; o resto entra um horizonte depois): primeiro a classe
  // (prioridade antes de atenção); dentro dela, dor e bem-estar (condicionam o
  // exercício), depois o que se liga ao objetivo que o paciente declarou, depois
  // a ordem funcional de segurança. O avaliador pode mover qualquer item.
  const ordenados = perfil.dominios
    .filter(precisaAtencao)
    .map((d) => ({ d, classe: d.classificacao === "prioridade" ? 0 : 1, condiciona: d.chave === "dor" || d.chave === "bem_estar" ? 0 : 1, objetivo: conectarObjetivo(d, ctx.a.motivo) ? 0 : 1, ordem: PRECEDENCIA.indexOf(d.chave) }))
    .sort((x, y) => x.classe - y.classe || x.condiciona - y.condiciona || x.objetivo - y.objetivo || x.ordem - y.ordem)
    .map((x) => x.d);
  ordenados.forEach((d, i) => {
    const regra = REGRAS[d.chave];
    if (!regra) return;
    regra(ctx, d, criarEmissor(ctx, d, i >= MAX_FRENTES_INICIAIS, itens), encaminhamentos);
  });

  // 4) Reavaliações programadas (30/60/90/365), dos domínios em foco.
  const emFoco = ordenados.map((d) => TESTES_POR_DOMINIO[d.chave]).filter(Boolean) as string[];
  const reav = (h: Horizonte, descricao: string, indicador?: string) =>
    itens.push({ id: gerarId(), horizonte: h, descricao, origem: "Reavaliação programada", categoria: "reavaliacao", regra: `reavaliacao|${h}`, indicador, status: "sugerido" });
  reav("30", "Reavaliação rápida (sem testes máximos): adesão, dor (0-10), percepção de esforço nas sessões, peso e cintura; ajustar o plano.", "Adesão ≥ 80% e ausência de piora.");
  reav("60", `Reavaliação intermediária dos indicadores em foco: ${emFoco.length > 0 ? emFoco.join("; ") : "os já alterados"}.`, "Direção de melhora em cada indicador em foco.");
  reav("90", "Reavaliação completa (física, funcional e cardiorrespiratória, com os mesmos protocolos do início); comparar ANTES → ATUAL → META na aba Reavaliação e renovar o plano.", "Metas parciais atingidas; novo plano de 90 dias definido.");
  reav("365", "Reavaliação anual completa; revisar metas, perfil e plano para os próximos 12 meses.", "Relatório comparativo de 12 meses entregue ao paciente.");

  return { itens, encaminhamentos };
}
