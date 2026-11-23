// Pareceres automáticos (23/11/2026, pedido do profissional): sempre que os dados mudam, o agente da área
// relê tudo e atualiza o parecer SUCINTO sozinho; o explicativo só sai se o avaliador pedir.
//
// Regras para nunca apagar o trabalho do avaliador:
//  - sem parecer ainda: o sistema redige o sucinto;
//  - parecer que ainda é exatamente o do sistema e não foi aprovado: acompanha os dados (troca sozinho);
//  - parecer editado à mão ou já aprovado: NÃO é trocado; aparece "dados novos" bem visível para o avaliador decidir.
// Ao trocar o texto, o "revisado" volta a ficar desmarcado: a barra do topo mostra o que falta conferir.

import type { PacienteRow } from "@/lib/anamnese/types";
import { gerarParecerAgente, type AgenteParecer, type EstiloParecer } from "./pareceres";

export type SecaoParecer = AgenteParecer | "postural";
export const SECOES_PARECER: SecaoParecer[] = ["anamnese", "fisica", "postural", "funcional", "cardio", "perfil"];
export const SECOES_AUTOMATICAS: AgenteParecer[] = ["anamnese", "fisica", "funcional", "cardio", "perfil"];

export const ROTULO_SECAO: Record<SecaoParecer, string> = {
  anamnese: "Anamnese",
  fisica: "Física",
  postural: "Postural",
  funcional: "Funcional",
  cardio: "Cardio",
  perfil: "Perfil",
};

// Agente (id do avatar) de cada seção, usado para achar o cartão do parecer na aba.
export const AGENTE_DA_SECAO: Record<SecaoParecer, string> = { anamnese: "sofia", fisica: "marco", postural: "paula", funcional: "rita", cardio: "caio", perfil: "iris" };

export type ParecerGuardado = { texto?: string; estilo?: string; automatico?: string; revisado?: boolean };
export type NovoParecer = { texto: string; estilo: EstiloParecer; automatico: string; revisado: false };

export function parecerGuardado(paciente: PacienteRow, secao: SecaoParecer): ParecerGuardado | undefined {
  const plano = (paciente.plano ?? {}) as Record<string, any>;
  if (secao === "anamnese" || secao === "perfil") return plano.pareceres?.[secao];
  if (secao === "postural") {
    const p = (paciente.postural ?? {}) as Record<string, any>;
    if (p.parecer && typeof p.parecer.texto === "string") return p.parecer;
    const a = p.analise;
    if (a && typeof a.parecer === "string" && a.parecer !== "") return { texto: a.parecer, estilo: "explicativo", automatico: a.parecer_automatico ?? "", revisado: !!a.parecer_revisado };
    return undefined;
  }
  return (paciente[secao] as Record<string, any> | undefined)?.parecer;
}

const estiloDe = (g?: ParecerGuardado): EstiloParecer => (g?.estilo === "explicativo" ? "explicativo" : "sucinto");

// Texto que o sistema escreveria hoje com os dados atuais ("" se não há dado da área).
export function parecerAtual(paciente: PacienteRow, secao: AgenteParecer): string {
  return gerarParecerAgente(secao, paciente, estiloDe(parecerGuardado(paciente, secao)));
}

// O parecer ainda é do sistema (não editado, não aprovado)? Então pode acompanhar os dados sozinho.
export function acompanhaDadosSozinho(g?: ParecerGuardado): boolean {
  return !!g && !!g.texto && g.texto === g.automatico && !g.revisado;
}

// O que atualizar agora, sem tocar no que o avaliador editou ou aprovou. `ignorar`: seções cuja aba está aberta
// (o próprio cartão do parecer cuida delas).
export function atualizacoesAutomaticas(paciente: PacienteRow, ignorar: SecaoParecer[] = []): { secao: AgenteParecer; valor: NovoParecer }[] {
  const saida: { secao: AgenteParecer; valor: NovoParecer }[] = [];
  for (const secao of SECOES_AUTOMATICAS) {
    if (ignorar.includes(secao)) continue;
    const g = parecerGuardado(paciente, secao);
    const estilo = estiloDe(g);
    const atual = gerarParecerAgente(secao, paciente, estilo);
    if (atual === "") continue;
    const nuncaGerado = !g || (!g.texto && !g.automatico);
    const acompanha = acompanhaDadosSozinho(g) && g!.automatico !== atual;
    if (nuncaGerado || acompanha) saida.push({ secao, valor: { texto: atual, estilo, automatico: atual, revisado: false } });
  }
  return saida;
}

export type SituacaoParecer = "sem_dados" | "sem" | "revisar" | "dados_novos" | "aprovado";

// Situação de cada parecer, para a barra do topo da ficha.
export function situacaoParecer(paciente: PacienteRow, secao: SecaoParecer): SituacaoParecer {
  const g = parecerGuardado(paciente, secao);
  const tem = !!g?.texto;
  if (secao === "postural") {
    const temDado = !!(paciente.postural as Record<string, any> | undefined)?.analise?.vistas;
    if (!tem) return temDado ? "sem" : "sem_dados";
    return g!.revisado ? "aprovado" : "revisar";
  }
  const atual = gerarParecerAgente(secao, paciente, estiloDe(g));
  if (!tem) return atual === "" ? "sem_dados" : "sem";
  const desatualizado = !!g!.automatico && atual !== "" && g!.automatico !== atual;
  if (desatualizado && !acompanhaDadosSozinho(g)) return "dados_novos";
  return g!.revisado ? "aprovado" : "revisar";
}
