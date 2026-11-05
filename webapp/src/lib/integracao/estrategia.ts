// Estratégia inicial do plano (05/11/2026, pedido do profissional): diante de todas as informações, o sistema sugere POR ONDE
// COMEÇAR (por exemplo, fisioterapia primeiro e depois a musculação consciente; ou medicina chinesa e musculação desde o
// início), quais OBJETIVOS trabalhar em 30, 90 e 180 dias, a EXPLICAÇÃO dessa sugestão e fica à espera de o avaliador
// concordar, discordar ou editar. É montada a partir dos serviços e dos itens do plano que ainda valem (o que foi recusado
// não entra) e não prescreve exercício: o profissional de cada serviço define a conduta.

import type { DomainKey, PerfilIntegrado } from "./perfil";
import { dominiosSemDado } from "./perfil";
import type { ItemPlano, StatusItem } from "./plano";
import { inicioDoServico, type ServicoPlano } from "./servicos";

export type MarcoId = "30" | "90" | "180";
export type FaseSequencia = { quando: string; servicos: string[] };
export type Marco = { marco: MarcoId; titulo: string; objetivos: string[] };

export type EstrategiaPlano = {
  id: string;
  titulo: string;
  sequencia: FaseSequencia[];
  marcos: Marco[];
  explicacao: string[];
  provisoria: boolean;
  regra: "estrategia|inicial";
  status?: StatusItem;
  comentario?: string;
};

const NOME_CURTO: Record<string, string> = {
  fisioterapia: "Fisioterapia",
  psicologia: "Psicologia",
  musculacao: "Musculação consciente",
  pilates: "Pilates",
  mtc: "Medicina chinesa",
  rpg: "RPG",
  massoterapia: "Massoterapia",
};

const QUANDO: Record<string, string> = { "30": "agora, nas primeiras semanas", "60": "a partir de 60 dias", "90": "a partir de 90 dias", "180": "a partir de 180 dias", "365": "ao longo do ano" };
const DIAS: Record<string, number> = { "30": 30, "60": 60, "90": 90, "180": 180, "365": 365 };

// Objetivo de cada domínio em cada marco (metas de resultado, sem prescrever exercício).
const OBJETIVO: Record<DomainKey, Record<MarcoId, string>> = {
  dor: { "30": "controlar a dor e criar segurança para se mexer", "90": "reduzir a dor e o quanto ela atrapalha o dia a dia, e reavaliar", "180": "manter a dor sob controle e voltar às atividades que ela limitava" },
  forca: { "30": "aprender os movimentos e criar o hábito do treino de força", "90": "ganhar força e reavaliar nos testes", "180": "consolidar a força e progredir com segurança" },
  mobilidade: { "30": "recuperar liberdade de movimento nas regiões restritas", "90": "reduzir assimetrias e restrições e reavaliar", "180": "manter a mobilidade conquistada" },
  equilibrio: { "30": "treinar equilíbrio e segurança para reduzir o risco de queda", "90": "melhorar o equilíbrio e reavaliar nos testes", "180": "manter a autonomia e a segurança nas atividades" },
  capacidade_cardiorrespiratoria: { "30": "começar a atividade aeróbia em intensidade confortável", "90": "melhorar o condicionamento e reavaliar", "180": "consolidar o condicionamento" },
  composicao_corporal: { "30": "organizar hábitos e alimentação com apoio profissional", "90": "reduzir gordura preservando a massa magra", "180": "caminhar para o alvo de composição combinado" },
  estilo_de_vida: { "30": "combinar uma rotina realista de atividade física", "90": "tornar o hábito regular", "180": "manter a regularidade" },
  sono: { "30": "ajustar a rotina para dormir melhor", "90": "melhorar a qualidade do sono e reavaliar", "180": "manter o sono em dia" },
  bem_estar: { "30": "acolher e cuidar do humor, da ansiedade e do estresse", "90": "reavaliar o bem-estar emocional", "180": "manter o cuidado emocional" },
  funcionalidade: { "30": "treinar as tarefas do dia a dia com segurança", "90": "melhorar nos testes funcionais", "180": "manter a autonomia" },
};

const TITULO_MARCO: Record<MarcoId, string> = {
  "30": "Em 30 dias: segurança, adaptação e primeiros passos",
  "90": "Em 90 dias: consolidar e reavaliar",
  "180": "Em 180 dias: manter, progredir e decidir a continuidade",
};

const nome = (s: Pick<ServicoPlano, "servico">) => NOME_CURTO[s.servico] ?? s.servico;
const comOpcional = (s: ServicoPlano) => `${nome(s)}${s.prioridade === "opcional" ? " (opcional)" : ""}`;
const lista = (v: string[]) => (v.length <= 1 ? v.join("") : `${v.slice(0, -1).join(", ")} e ${v[v.length - 1]}`);

function vale(x: { status?: StatusItem }): boolean {
  return (x.status ?? "concordo") !== "discordo";
}

export function sugerirEstrategia(perfil: PerfilIntegrado, itens: ItemPlano[], servicos: ServicoPlano[]): EstrategiaPlano | null {
  const serv = servicos.filter(vale);
  const its = itens.filter(vale);
  if (serv.length === 0 && its.length === 0) return null;

  const provisoria = perfil.confianca !== "alta" && dominiosSemDado(perfil).length > 0;

  // Sequência dos serviços: quem começa agora e quem entra depois.
  const porQuando = new Map<string, ServicoPlano[]>();
  for (const s of serv) {
    const ini = inicioDoServico(s);
    const chave = ini.quando === "agora" ? "30" : ini.horizonte ?? "90";
    porQuando.set(chave, [...(porQuando.get(chave) ?? []), s]);
  }
  const chaves = Array.from(porQuando.keys()).sort((a, b) => DIAS[a] - DIAS[b]);
  const sequencia: FaseSequencia[] = chaves.map((c) => ({ quando: QUANDO[c], servicos: porQuando.get(c)!.map(comOpcional) }));
  const agora = porQuando.get("30") ?? [];
  const depois = chaves.filter((c) => c !== "30").flatMap((c) => porQuando.get(c)!.map((s) => ({ s, c })));

  const titulo =
    serv.length === 0
      ? "Ainda sem serviço indicado: começar pela avaliação completa e voltar a esta estratégia"
      : `${agora.length > 0 ? `Começar por ${lista(agora.map(comOpcional))}` : "Nenhum serviço pede início imediato"}${
          depois.length > 0 ? `; depois ${depois.length === 1 ? "entra" : "entram"} ${lista(depois.map(({ s, c }) => `${nome(s)}${s.prioridade === "opcional" ? ", opcional" : ""} (${QUANDO[c]})`))}` : ""
        }`;

  // Domínios em foco: os que têm intervenção no plano, com o marco em que entram.
  const inicioDom = new Map<DomainKey, number>();
  for (const i of its) {
    if (!i.dominio || (i.categoria ?? "intervencao") !== "intervencao") continue;
    const d = DIAS[i.horizonte] ?? 365;
    inicioDom.set(i.dominio, Math.min(inicioDom.get(i.dominio) ?? 9999, d));
  }
  const dominios = Array.from(inicioDom.entries());
  const temLiberacao = its.some((i) => i.regra === "seguranca|liberacao");

  const marcos: Marco[] = (["30", "90", "180"] as MarcoId[]).map((m) => {
    const lim = DIAS[m];
    const objetivos: string[] = [];
    if (m === "30") {
      if (temLiberacao) objetivos.push("Segurança: obter a liberação médica antes de intensificar o esforço.");
      agora.forEach((s) => objetivos.push(`Iniciar ${comOpcional(s)}.`));
      if (provisoria) objetivos.push("Completar a avaliação dos domínios sem dado, para o plano deixar de ser provisório.");
    } else {
      const entram = depois.filter(({ c }) => (m === "90" ? DIAS[c] <= 90 : DIAS[c] <= 180 && DIAS[c] > 90));
      entram.forEach(({ s }) => objetivos.push(`Entra ${comOpcional(s)}.`));
    }
    dominios
      .filter(([, d]) => d <= lim)
      .forEach(([dom]) => objetivos.push(`${perfil.dominios.find((x) => x.chave === dom)?.titulo ?? dom}: ${OBJETIVO[dom][m]}.`));
    if (m === "90") objetivos.push("Reavaliação completa e comparação com o ponto de partida.");
    if (m === "180") objetivos.push("Reavaliar a continuidade de cada serviço (manter, espaçar ou dar alta) e atualizar as metas; o horizonte anual segue no plano.");
    return { marco: m, titulo: TITULO_MARCO[m], objetivos };
  });

  // Explicação: por que esta sequência.
  const explicacao: string[] = [];
  if (agora.length > 0) {
    explicacao.push(`Por que começar por ${lista(agora.map(nome))}: ${agora.map((s) => `${nome(s)} (${s.motivos.slice(0, 2).join("; ")})`).join(" · ")}.`);
  }
  // Por que cada serviço entra NESTE momento (campo "momento" do serviço); sem ele, uma frase de reserva.
  const fisioAgora = agora.some((s) => s.servico === "fisioterapia");
  const musculacaoDepois = depois.find(({ s }) => s.servico === "musculacao");
  const ordemMomento = [...agora, ...depois.map(({ s }) => s)];
  const vistos = new Set<string>();
  for (const s of ordemMomento) {
    const texto =
      s.momento ??
      (s.servico === "musculacao" && fisioAgora && musculacaoDepois
        ? "A musculação consciente entra depois porque, no início, o fortalecimento acontece dentro da fisioterapia (há dor ou inflamação a controlar); ela começa quando o fisioterapeuta liberar e a dor estiver sob controle."
        : s.servico === "mtc"
          ? "A medicina chinesa entra como apoio opcional, só se o paciente quiser; não substitui o exercício nem o cuidado médico."
          : depois.some(({ s: d }) => d.id === s.id)
            ? `${nome(s)} entra ${QUANDO[inicioDoServico(s).horizonte ?? "90"]}: ${s.motivos.slice(0, 2).join("; ")}.`
            : null);
    if (texto && !vistos.has(texto)) {
      vistos.add(texto);
      explicacao.push(texto);
    }
  }
  if (serv.some((s) => s.servico === "musculacao") && serv.some((s) => s.servico === "pilates")) {
    explicacao.push("Musculação consciente e Pilates podem andar juntos ou ser escolhidos um de cada vez: a decisão é da cliente.");
  }  if (serv.some((s) => /liberação médica/.test(`${s.ressalva ?? ""} ${s.etapas.map((e) => e.texto).join(" ")}`))) {
    explicacao.push("Há sinal de alerta: os serviços com exercício só começam depois da avaliação e da liberação médica.");
  }
  if (provisoria) explicacao.push("O plano é provisório (poucos dados): esta sequência é um ponto de partida e deve ser revista quando a avaliação estiver completa; a supervisão da Dra. Nina continua listando o que falta.");
  explicacao.push("É uma sugestão do sistema: a decisão é do avaliador e do paciente, e o profissional de cada serviço define a conduta e o treino.");

  return {
    id: Math.random().toString(36).slice(2, 10),
    titulo,
    sequencia,
    marcos,
    explicacao,
    provisoria,
    regra: "estrategia|inicial",
    status: "sugerido",
  };
}

// Junta a estratégia nova à atual: se o avaliador já decidiu (concordo, discordo, editado), nada muda; se ainda está só
// "sugerida", acompanha a mais recente (mantendo o id).
export function mesclarEstrategia(atual: EstrategiaPlano | null | undefined, nova: EstrategiaPlano | null): EstrategiaPlano | null {
  if (atual && (atual.status ?? "sugerido") !== "sugerido") return atual;
  if (!nova) return atual ?? null;
  return { ...nova, id: atual?.id ?? nova.id };
}

export function textoEstrategia(e: EstrategiaPlano): string {
  const linhas: string[] = [`ESTRATÉGIA INICIAL: ${e.titulo}`];
  e.marcos.forEach((m) => {
    linhas.push("", m.titulo.toUpperCase());
    m.objetivos.forEach((o) => linhas.push(`- ${o}`));
  });
  linhas.push("", "POR QUÊ");
  e.explicacao.forEach((x) => linhas.push(`- ${x}`));
  return linhas.join("\n");
}
