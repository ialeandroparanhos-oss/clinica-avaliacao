// Agente 8 — Clara: conteúdo da devolutiva ao paciente.
//
// Linguagem simples e acolhedora, que explica o PORQUÊ de cada ponto e conduz ao
// próximo passo (RECONHECER -> MOSTRAR -> EXPLICAR -> PRIORIZAR -> PROJETAR ->
// PLANEJAR). Persuasão honesta: só benefícios sustentados pelas diretrizes de
// atividade física da OMS (2020) e pela literatura, sem promessas de resultado,
// sem medo e sem culpa. Nunca mostra pontuação, corte ou termo clínico: isso fica
// no relatório técnico.

import type { Anamnese, PacienteRow } from "@/lib/anamnese/types";
import { paraNumero } from "@/lib/numeros";
import { conectarObjetivo } from "./objetivo";
import type { Classificacao, DomainKey, DomainResult, PerfilIntegrado } from "./perfil";
import { itemAprovado, type Horizonte, type ItemPlano, type Plano } from "./plano";

export type TextoDominio = {
  nome: string; // como o paciente lê o nome da área
  importa: string; // por que isso importa na vida dele
  plano: string; // o que vamos fazer
  bom: string; // quando está adequado
};

export const TEXTO_DOMINIO: Record<DomainKey, TextoDominio> = {
  forca: {
    nome: "Força muscular",
    importa: "É a força que permite levantar da cadeira, subir escadas, carregar as compras e continuar independente. Ela também protege as suas articulações.",
    plano: "Exercícios de força com carga ajustada ao seu nível, aumentada aos poucos.",
    bom: "Sua força está em boa condição. Vamos mantê-la e usar como base.",
  },
  mobilidade: {
    nome: "Mobilidade e movimento",
    importa: "Movimentos livres deixam o dia a dia mais leve e o exercício mais seguro e confortável.",
    plano: "Exercícios de mobilidade e atenção à qualidade do seu movimento.",
    bom: "Seus movimentos estão bem. Vamos manter essa liberdade.",
  },
  equilibrio: {
    nome: "Equilíbrio",
    importa: "Um bom equilíbrio ajuda a prevenir quedas e dá segurança para se movimentar com confiança.",
    plano: "Treino de equilíbrio e de controle do corpo, em níveis que aumentam aos poucos.",
    bom: "Seu equilíbrio está bom. Vamos continuar treinando para manter.",
  },
  capacidade_cardiorrespiratoria: {
    nome: "Condicionamento (fôlego)",
    importa: "Coração e pulmões bem condicionados dão disposição no dia a dia e fazem bem à saúde a longo prazo. Estudos mostram que quem tem melhor condicionamento tende a ter mais saúde ao longo da vida.",
    plano: "Atividades aeróbicas na intensidade certa para você, com aumento gradual.",
    bom: "Seu condicionamento está em boa faixa. Vamos preservá-lo.",
  },
  composicao_corporal: {
    nome: "Composição do corpo",
    importa: "Importa mais a proporção entre músculo e gordura (principalmente na barriga) do que o número na balança: ela influencia o coração e o metabolismo.",
    plano: "Exercício, ajuste de hábitos e acompanhamento das medidas, com metas realistas e sem pressa.",
    bom: "A composição do seu corpo está bem. Vamos acompanhar para manter.",
  },
  dor: {
    nome: "Dor",
    importa: "A dor limita o que você gosta de fazer. Para muitas dores que persistem, o exercício bem dosado faz parte do cuidado.",
    plano: "Exercícios escolhidos e dosados de acordo com a sua dor, com ajuste a cada encontro.",
    bom: "Você não relatou dor que limite o seu dia. Ótimo ponto de partida.",
  },
  estilo_de_vida: {
    nome: "Hábitos do dia a dia",
    importa: "Pequenos hábitos repetidos (se movimentar mais, comer bem, lidar com o estresse) pesam mais do que grandes esforços ocasionais. Qualquer movimento já conta.",
    plano: "Metas pequenas e possíveis, combinadas com você.",
    bom: "Seus hábitos são um ponto forte. Vamos aproveitar isso.",
  },
  sono: {
    nome: "Sono",
    importa: "Dormir bem ajuda na recuperação do corpo, no humor, na disposição e na resposta ao treino.",
    plano: "Orientações práticas para a rotina de sono e acompanhamento da evolução.",
    bom: "Seu sono está bom, e isso ajuda muito na recuperação.",
  },
  bem_estar: {
    nome: "Bem-estar emocional",
    importa: "Corpo e mente caminham juntos: cuidar do bem-estar melhora a disposição e a constância nos exercícios. O exercício regular também ajuda no humor.",
    plano: "Vamos conversar com cuidado sobre isso e, se for útil, indicar um apoio profissional.",
    bom: "Seu bem-estar emocional está bem no momento.",
  },
  funcionalidade: {
    nome: "Autonomia no dia a dia",
    importa: "É a capacidade de fazer as suas atividades com segurança e sem depender de ajuda.",
    plano: "Treinar os movimentos do cotidiano: levantar, caminhar, subir escadas e outros.",
    bom: "Você tem boa autonomia nas atividades do dia a dia.",
  },
};

export const ROTULO_SITUACAO: Record<Classificacao, string> = {
  adequado: "Ponto forte",
  atencao: "Podemos melhorar",
  prioridade: "Vamos começar por aqui",
  investigar: "Ainda vamos conhecer",
};

export const TEXTO_FASE: Record<Horizonte, { titulo: string; texto: string }> = {
  "30": { titulo: "Nos primeiros 30 dias", texto: "Começamos com segurança: você se adapta, conhece o seu corpo e cria o hábito. É a fase de dar o primeiro passo." },
  "60": { titulo: "Até 60 dias", texto: "Aumentamos o desafio aos poucos, conforme o seu corpo responde." },
  "90": { titulo: "Em 90 dias", texto: "Fazemos uma nova avaliação completa e comparamos com a de hoje: você vê o seu progresso em números." },
  "365": { titulo: "Ao longo de um ano", texto: "Mantemos o que foi conquistado, ganhamos autonomia e vamos além." },
  "180": { titulo: "Até 180 dias", texto: "Etapa intermediária do seu plano." },
};

// Por que vale a pena (diretrizes da OMS 2020 - frases deliberadamente prudentes).
export const PORQUE_VALE_A_PENA: string[] = [
  "A Organização Mundial da Saúde recomenda aos adultos de 150 a 300 minutos de atividade moderada por semana e exercícios de força em 2 ou mais dias. O seu plano foi pensado para levar você até lá, com segurança e aos poucos.",
  "Qualquer quantidade de movimento já faz bem: mexer-se um pouco é sempre melhor do que nada. Você não precisa começar perfeito, só começar.",
  "A atividade física regular se associa a menor risco de doenças do coração, diabetes tipo 2 e alguns tipos de câncer, e a melhor saúde mental e melhor sono.",
  "Em uma revisão de 34 estudos com pessoas de 60 anos ou mais, o exercício foi seguro, com ou sem supervisão, e ter um profissional por perto pôde somar um ganho extra, principalmente na força.",
];

// Fonte exata de cada afirmação acima (só entra frase que uma fonte conferida sustenta).
export const FONTE_PORQUE =
  "Baseado nas diretrizes de atividade física da Organização Mundial da Saúde (2020) e em uma revisão sistemática com meta-análise de ensaios clínicos de 2024 (Sports Medicine). Cada pessoa responde de um jeito: acompanhamos o seu ritmo.";

// Para o paciente, "Mobilidade" só vale se houver teste objetivo (flexibilidade ou
// goniometria): a leitura por palavras das observações posturais não é medida e não
// pode virar "ponto forte" nem "ponto a melhorar" dito ao paciente. Sem teste, vira
// "ainda vamos conhecer". O perfil técnico (profissional) não é alterado aqui.
export function perfilParaPaciente(perfil: PerfilIntegrado, paciente: Pick<PacienteRow, "funcional">): PerfilIntegrado {
  const f = paciente.funcional ?? {};
  const temTesteObjetivo =
    [f.sit_and_reach_cm, f.chair_sit_reach_cm, f.back_scratch_d_cm, f.back_scratch_e_cm].some((v) => paraNumero(v) !== null) ||
    (Array.isArray(f.goniometria) && f.goniometria.some((l: any) => paraNumero(l?.graus) !== null));
  const mob = perfil.dominios.find((d) => d.chave === "mobilidade");
  if (temTesteObjetivo || !mob || mob.classificacao === "investigar") return perfil;
  const dominios = perfil.dominios.map((d) => (d.chave === "mobilidade" ? { ...d, classificacao: "investigar" as Classificacao, justificativa: "Sem teste objetivo de mobilidade (flexibilidade ou goniometria) registrado." } : d));
  const potencialidades = dominios.filter((d) => d.classificacao === "adequado");
  const limitacoes = dominios.filter((d) => d.classificacao === "atencao");
  const riscos = dominios.filter((d) => d.classificacao === "prioridade");
  return { ...perfil, dominios, potencialidades, limitacoes, riscos, prioridades: [...riscos, ...limitacoes] };
}

export const COMBINADOS: string[] = [
  "Comparecer com regularidade: constância vale mais do que intensidade.",
  "Avisar sempre que sentir dor ou desconforto, para ajustarmos o treino.",
  "Fazer em casa as pequenas metas que combinarmos.",
];

export function primeiroNome(nome: string): string {
  return (nome ?? "").trim().split(/\s+/)[0] ?? "";
}

// Frase do próprio paciente para abrir a devolutiva ("RECONHECER").
export function objetivoDoPaciente(motivo: Anamnese["motivo"] | undefined): string | null {
  const t = (motivo?.objetivos || motivo?.queixa_principal || motivo?.motivo_procura || "").trim();
  return t || null;
}

export type FrentePrioritaria = { dominio: DomainResult; nome: string; importa: string; plano: string; objetivo: string | null };

// Nome da "frente" de um item aprovado, em linguagem do paciente.
export function nomeFrenteDoItem(it: ItemPlano, perfil: PerfilIntegrado): string {
  if (it.dominio) return TEXTO_DOMINIO[it.dominio]?.nome ?? perfil.dominios.find((d) => d.chave === it.dominio)?.titulo ?? it.origem;
  if (it.categoria === "reavaliacao") return "Reavaliação do seu progresso";
  if (it.categoria === "seguranca") return "Segurança antes de intensificar o exercício";
  return it.origem.split(" — ")[1] ?? it.origem;
}

export type FaseDoPlano = { chave: Horizonte; curto: string; titulo: string; texto: string; nomes: string[] };

// Fases (30/60/90 dias e anual) com as frentes APROVADAS pelo avaliador em cada uma.
export function fasesDoPlano(plano: Pick<Plano, "itens"> | undefined, perfil: PerfilIntegrado): FaseDoPlano[] {
  const itens = (plano?.itens ?? []).filter(itemAprovado);
  const chaves: Horizonte[] = ["30", "60", "90", "365"];
  if (itens.some((i) => i.horizonte === "180")) chaves.push("180");
  return chaves.map((chave) => ({
    chave,
    curto: chave === "365" ? "12 meses" : `${chave} dias`,
    titulo: TEXTO_FASE[chave].titulo,
    texto: TEXTO_FASE[chave].texto,
    nomes: Array.from(new Set(itens.filter((i) => i.horizonte === chave).map((i) => nomeFrenteDoItem(i, perfil)))),
  }));
}

// Domínios com item aprovado no plano, na ordem dos horizontes (30 dias primeiro).
export function dominiosAprovadosNoPlano(plano: Pick<Plano, "itens"> | undefined): DomainKey[] {
  const ordem: Horizonte[] = ["30", "60", "90", "365", "180"];
  const itens = (plano?.itens ?? []).filter((i) => itemAprovado(i) && i.dominio);
  const vistos: DomainKey[] = [];
  for (const h of ordem) {
    for (const i of itens) if (i.horizonte === h && i.dominio && !vistos.includes(i.dominio)) vistos.push(i.dominio);
  }
  return vistos;
}

// Ordem de apresentação: primeiro o que o avaliador aprovou para o início do plano;
// depois dor e bem-estar (segurança e acolhimento vêm antes), e o restante na ordem do perfil.
// Cada frente traz a frase do paciente só na primeira vez em que ela aparece.
export function frentesPrioritarias(perfil: PerfilIntegrado, motivo: Anamnese["motivo"] | undefined, plano?: Pick<Plano, "itens">): FrentePrioritaria[] {
  const aprovados = dominiosAprovadosNoPlano(plano);
  const posto = (d: DomainResult, i: number) => {
    const idx = aprovados.indexOf(d.chave);
    if (idx >= 0) return idx;
    return 100 + (d.chave === "dor" || d.chave === "bem_estar" ? 0 : 50) + i;
  };
  const ordenados = perfil.prioridades.map((d, i) => ({ d, p: posto(d, i) })).sort((a, b) => a.p - b.p);
  const jaUsadas = new Set<string>();
  return ordenados.map(({ d }) => {
    let objetivo = motivo ? conectarObjetivo(d, motivo) : null;
    if (objetivo && jaUsadas.has(objetivo)) objetivo = null;
    if (objetivo) jaUsadas.add(objetivo);
    return {
      dominio: d,
      nome: TEXTO_DOMINIO[d.chave].nome,
      importa: TEXTO_DOMINIO[d.chave].importa,
      plano: TEXTO_DOMINIO[d.chave].plano,
      objetivo,
    };
  });
}
