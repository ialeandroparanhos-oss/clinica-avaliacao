// Modo simples da avaliação postural (Dra. Paula): três fotos (de frente, de costas e de lado), uma lista curta
// de achados visuais por vista e dois testes de movimento (agachamento e flexão de tronco). O que é mais
// detalhado (lateral esquerda, análise automática das fotos, marcação das escápulas, vídeo e os outros
// movimentos) fica no modo avançado.
//
// Por que simples: assimetrias leves de ombros, pelve e joelhos são comuns, e a ligação entre a postura estática e
// a dor é pequena na literatura que o sistema já registra (Rani 2023, PMID 36825268; D'hondt 2020, PMID 33131391:
// nenhum instrumento clínico de escápula com evidência suficiente). O que mais ajuda quem prescreve é ver como a
// pessoa agacha e flexiona o tronco. As "atenções na execução" abaixo são pontos de observação do treino, não
// prescrição nem correção de postura; a decisão é do profissional.

import { linhasBaseCientifica, nomeComTitulo } from "@/lib/agentes";
import type { EstiloParecer } from "./pareceres";
import { descreverMovimentos, type Movimentos } from "./movimento";

export type VistaGuiada = "anterior" | "posterior" | "lateral";
export type ObsGuiada = Partial<Record<VistaGuiada, string[]>>; // chaves marcadas por vista

export const ROTULO_VISTA_GUIADA: Record<VistaGuiada, string> = { anterior: "De frente", posterior: "De costas", lateral: "De lado" };
// O texto livre de cada vista continua nos campos de sempre (a lateral guiada usa o da lateral direita).
export const CAMPO_TEXTO_VISTA: Record<VistaGuiada, "obs_anterior" | "obs_posterior" | "obs_lateral_d"> = {
  anterior: "obs_anterior",
  posterior: "obs_posterior",
  lateral: "obs_lateral_d",
};

export const MOVIMENTOS_SIMPLES = ["agachamento", "flexao_tronco"];

export type Achado = { chave: string; rotulo: string; atencao: string };

export const CHAVE_NADA = "nenhum";
export const ROTULO_NADA = "Nada de relevante nesta vista";

export const ACHADOS: Record<VistaGuiada, Achado[]> = {
  anterior: [
    { chave: "cabeca_inclinada", rotulo: "Cabeça inclinada para um lado", atencao: "observe a posição da cabeça nos exercícios de pescoço e ombro, sem forçar correção" },
    { chave: "ombros_desnivelados", rotulo: "Ombros desnivelados", atencao: "compare os dois lados nos exercícios unilaterais de ombro e costas" },
    { chave: "pelve_desnivelada", rotulo: "Quadril (pelve) desnivelado", atencao: "compare os dois lados nos exercícios unilaterais de perna" },
    { chave: "joelhos_dentro", rotulo: "Joelhos para dentro", atencao: "no agachamento e nas passadas, observe o joelho acompanhando a linha dos pés; comece com a amplitude e a carga que ele controla" },
    { chave: "joelhos_fora", rotulo: "Joelhos para fora", atencao: "no agachamento e nas passadas, observe o joelho acompanhando a linha dos pés; comece com a amplitude e a carga que ele controla" },
    { chave: "pes_virados", rotulo: "Pés muito virados para fora ou para dentro", atencao: "ajuste a largura e a direção dos pés no agachamento ao que for confortável e estável" },
  ],
  posterior: [
    { chave: "ombros_desnivelados", rotulo: "Ombros desnivelados", atencao: "compare os dois lados nos exercícios unilaterais de ombro e costas" },
    { chave: "escapulas_assimetricas", rotulo: "Escápulas (omoplatas) diferentes entre os lados", atencao: "só registrar e comparar na reavaliação: não há instrumento clínico de escápula com evidência suficiente para concluir disfunção" },
    { chave: "coluna_desvio", rotulo: "Desvio lateral da coluna visível", atencao: "registrar e comparar na reavaliação; se for acentuado ou houver dor, considere encaminhar para avaliação" },
    { chave: "pelve_desnivelada", rotulo: "Quadril (pelve) desnivelado", atencao: "compare os dois lados nos exercícios unilaterais de perna" },
    { chave: "calcanhares", rotulo: "Calcanhares desalinhados ou pés com arco caído", atencao: "observe o apoio do pé no agachamento e em saltos e progrida a carga aos poucos" },
  ],
  lateral: [
    { chave: "cabeca_frente", rotulo: "Cabeça à frente do tronco", atencao: "dê atenção à posição da cabeça e ao equilíbrio entre exercícios de puxar e de empurrar, sem prometer correção da postura" },
    { chave: "ombros_frente", rotulo: "Ombros arredondados para a frente", atencao: "dê atenção ao equilíbrio entre exercícios de puxar e de empurrar, sem prometer correção da postura" },
    { chave: "lombar_aumentada", rotulo: "Curva lombar aumentada", atencao: "no agachamento, no terra e nos abdominais, observe a posição da lombar e da pelve e use a amplitude em que ele mantém o controle" },
    { chave: "lombar_reduzida", rotulo: "Curva lombar reduzida (costas retas)", atencao: "no agachamento, no terra e nos abdominais, observe a posição da lombar e da pelve e use a amplitude em que ele mantém o controle" },
    { chave: "pelve_frente", rotulo: "Pelve projetada para a frente", atencao: "no agachamento, no terra e nos abdominais, observe a posição da lombar e da pelve e use a amplitude em que ele mantém o controle" },
    { chave: "joelhos_travados", rotulo: "Joelhos travados para trás", atencao: "evite travar os joelhos nos exercícios em pé; mantenha uma leve flexão" },
  ],
};

export const LIMITE_LEITURA =
  "Assimetrias leves são comuns e, sozinhas, não indicam problema. Valorize o que se repete entre as vistas e os movimentos ou vem com dor ou limitação. É observação visual, não diagnóstico nem causa de dor.";

const VISTAS: VistaGuiada[] = ["anterior", "posterior", "lateral"];

const rotuloDe = (vista: VistaGuiada, chave: string) => ACHADOS[vista].find((a) => a.chave === chave)?.rotulo;
// Os achados saem sempre na ordem da lista, e não na ordem em que foram marcados.
const posicao = (vista: VistaGuiada, chave: string) => {
  const i = ACHADOS[vista].findIndex((a) => a.chave === chave);
  return i < 0 ? 999 : i;
};
const emOrdem = (vista: VistaGuiada, chaves: string[]) => [...chaves].sort((a, b) => posicao(vista, a) - posicao(vista, b));

// "Nada de relevante" exclui os achados, e marcar um achado tira o "nada".
export function alternarAchado(g: ObsGuiada, vista: VistaGuiada, chave: string, marcado: boolean): ObsGuiada {
  const atuais = new Set(g[vista] ?? []);
  if (marcado) {
    if (chave === CHAVE_NADA) atuais.clear();
    else atuais.delete(CHAVE_NADA);
    atuais.add(chave);
  } else {
    atuais.delete(chave);
  }
  const lista = Array.from(atuais);
  const novo = { ...g };
  if (lista.length === 0) delete novo[vista];
  else novo[vista] = lista;
  return novo;
}

export function temGuiada(g: ObsGuiada | undefined): boolean {
  return !!g && VISTAS.some((v) => (g[v] ?? []).length > 0);
}

// Uma linha por vista avaliada: "De frente: ombros desnivelados; joelhos para dentro."
export function linhasGuiadas(g: ObsGuiada | undefined): string[] {
  if (!g) return [];
  const linhas: string[] = [];
  for (const v of VISTAS) {
    const chaves = g[v] ?? [];
    if (chaves.length === 0) continue;
    if (chaves.includes(CHAVE_NADA)) {
      linhas.push(`${ROTULO_VISTA_GUIADA[v]}: nada de relevante.`);
      continue;
    }
    const rotulos = emOrdem(v, chaves).map((c) => rotuloDe(v, c)?.toLowerCase()).filter((x): x is string => !!x);
    if (rotulos.length > 0) linhas.push(`${ROTULO_VISTA_GUIADA[v]}: ${rotulos.join("; ")}.`);
  }
  return linhas;
}

export function atencoesNaExecucao(g: ObsGuiada | undefined): string[] {
  if (!g) return [];
  const vistos = new Set<string>();
  for (const v of VISTAS) for (const c of emOrdem(v, g[v] ?? [])) {
    const a = ACHADOS[v].find((x) => x.chave === c);
    if (a) vistos.add(a.atencao);
  }
  return Array.from(vistos);
}

// Texto de uma vista para os relatórios e para o cruzamento de discrepâncias: o que o avaliador escreveu e,
// junto, os achados marcados na lista curta (a lateral guiada entra no campo da lateral direita).
export function textoObsPostural(postural: Record<string, any> | undefined, campo: string): string {
  const livre = typeof postural?.[campo] === "string" ? (postural![campo] as string).trim() : "";
  const vista = (Object.keys(CAMPO_TEXTO_VISTA) as VistaGuiada[]).find((v) => CAMPO_TEXTO_VISTA[v] === campo);
  const guiado = vista ? linhasGuiadas({ [vista]: (postural?.obs_guiada ?? {})[vista] }).map((l) => l.replace(/^[^:]+: /, "").replace(/\.$/, "")) : [];
  return [guiado.length > 0 ? `Achados marcados: ${guiado.join("; ")}.` : "", livre].filter(Boolean).join(" ");
}

// Ficha que já tem registros do modo avançado abre nele, para nada ficar escondido.
export function temDadosAvancados(postural: Record<string, any> | undefined): boolean {
  if (!postural) return false;
  const vistas = postural.analise?.vistas ?? {};
  if (Object.keys(vistas).length > 0) return true;
  const esc = postural.analise?.escapula;
  if (esc && Object.keys(esc).length > 0) return true;
  if (postural.foto_lateral_e_path || (typeof postural.obs_lateral_e === "string" && postural.obs_lateral_e.trim() !== "")) return true;
  const movs = (postural.movimentos ?? {}) as Movimentos;
  return Object.entries(movs).some(([id, m]) => {
    if (!MOVIMENTOS_SIMPLES.includes(id)) {
      return !!m && Object.keys(m).some((k) => k !== "ativo" && (m as any)[k] && (typeof (m as any)[k] !== "object" || Object.keys((m as any)[k]).length > 0));
    }
    return ["sagital", "frontal"].some((v) => !!(m as any)?.[v]?.video_path || !!(m as any)?.[v]?.analise_video);
  });
}

// Parecer curto do modo simples: o que o avaliador viu, os movimentos, o que observar na execução e o limite da leitura.
export function gerarParecerSimples(g: ObsGuiada | undefined, movimentos: Movimentos | undefined, estilo: EstiloParecer, rotuloModo = "modo simples"): string {
  const vistas = linhasGuiadas(g);
  const movs = descreverMovimentos(movimentos);
  if (vistas.length === 0 && movs.length === 0) return "";
  const atencoes = atencoesNaExecucao(g);
  const cab = `PARECER ${nomeComTitulo("paula").toUpperCase()} (assistente de IA) - POSTURA E MOVIMENTO (${rotuloModo}${estilo === "sucinto" ? ", resumo" : ""})`;
  const linhas: string[] = [cab, ""];
  if (vistas.length > 0) {
    linhas.push(estilo === "sucinto" ? "Observação visual do avaliador:" : "OBSERVAÇÃO VISUAL DO AVALIADOR (três vistas)");
    vistas.forEach((x) => linhas.push(`- ${x}`));
    linhas.push("");
  }
  if (movs.length > 0) {
    linhas.push(estilo === "sucinto" ? "Movimento (registro do avaliador):" : "MOVIMENTOS (agachamento e flexão de tronco; registro do avaliador)");
    movs.forEach((x) => linhas.push(`- ${x}`));
    linhas.push("");
  }
  if (atencoes.length > 0) {
    linhas.push(estilo === "sucinto" ? "Atenção na execução do treino:" : "O QUE OBSERVAR NA EXECUÇÃO DO TREINO (pontos de observação, não prescrição)");
    atencoes.forEach((x) => linhas.push(`- ${x}.`));
    linhas.push("");
  }
  linhas.push(estilo === "sucinto" ? LIMITE_LEITURA : `COMO LER\n- ${LIMITE_LEITURA}\n- Os itens da lista são um roteiro prático do sistema, sem corte nem validação publicada. A literatura mostra associação pequena entre a postura estática e a dor, em estudos que não provam causa; por isso o foco é o movimento e a execução do treino, e não "corrigir a postura".`);
  linhas.push(...linhasBaseCientifica("paula", estilo));
  return linhas.join("\n");
}

// No modo avançado o parecer é o de sempre; os achados da lista curta entram logo no começo, para não se perderem.
export function juntarGuiadaAoParecer(texto: string, g: ObsGuiada | undefined, estilo: EstiloParecer): string {
  const bloco = linhasGuiadas(g);
  if (bloco.length === 0) return texto;
  if (texto === "") return gerarParecerSimples(g, undefined, estilo, "lista curta");
  const titulo = estilo === "sucinto" ? "Observação visual do avaliador (lista curta):" : "OBSERVAÇÃO VISUAL DO AVALIADOR (lista curta)";
  const linhas = texto.split("\n");
  const i = linhas.findIndex((l) => l === "");
  const inserir = [titulo, ...bloco.map((x) => `- ${x}`), ""];
  if (i < 0) return [...linhas, "", ...inserir].join("\n");
  linhas.splice(i + 1, 0, ...inserir);
  return linhas.join("\n");
}
