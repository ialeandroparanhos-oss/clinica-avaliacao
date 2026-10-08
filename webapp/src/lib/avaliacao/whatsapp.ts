// Envio por WhatsApp: o sistema monta a mensagem e abre o WhatsApp com ela pronta
// (link wa.me). Quem confere e aperta "enviar" é o profissional - nada sai sozinho.
// O link não anexa arquivo: o PDF completo (Imprimir / Salvar PDF) é anexado
// por quem envia.

import type { Alerta, PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { rotuloNivel } from "@/lib/anamnese/alerts";
import { NOME_PROFISSIONAL } from "@/lib/marca";
import { frentesPrioritarias, objetivoDoPaciente, primeiroNome, TEXTO_DOMINIO, TEXTO_FASE } from "@/lib/integracao/devolutiva";
import { calcularPerfilIntegrado } from "@/lib/integracao/perfil";
import { HORIZONTES, itemAprovado, type Plano } from "@/lib/integracao/plano";

// Telefone brasileiro: aceita (11) 91234-5678, 11912345678, +55 11 91234-5678.
// Devolve só dígitos com o 55, ou null se não parecer um número válido.
export function normalizarTelefone(bruto: string | null | undefined): string | null {
  let d = (bruto ?? "").replace(/\D/g, "");
  if (!d) return null;
  d = d.replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
  if (d.length >= 11 && d.length <= 15) return d; // número internacional
  return null;
}

// Sem número válido o link abre o WhatsApp para escolher o contato.
export function linkWhatsApp(telefone: string | null | undefined, mensagem: string): string {
  const numero = normalizarTelefone(telefone);
  return `https://wa.me/${numero ?? ""}?text=${encodeURIComponent(mensagem)}`;
}

function listar(nomes: string[]): string {
  if (nomes.length <= 1) return nomes.join("");
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

// Fronts (domínios) aprovados no plano, por horizonte - o mesmo que o paciente vê.
function frentesAprovadasPorHorizonte(paciente: PacienteRow, perfil: ReturnType<typeof calcularPerfilIntegrado>) {
  const plano = paciente.plano as Plano | undefined;
  return HORIZONTES.map((h) => {
    const nomes = Array.from(
      new Set(
        (plano?.itens ?? [])
          .filter((it) => it.horizonte === h.chave && itemAprovado(it))
          .map((it) => (it.dominio ? TEXTO_DOMINIO[it.dominio]?.nome ?? perfil.dominios.find((d) => d.chave === it.dominio)?.titulo : null))
          .filter((x): x is string => !!x)
      )
    );
    return { horizonte: h.chave, nomes };
  }).filter((x) => x.nomes.length > 0);
}

// ---------------------------------------------------------------------------
// Mensagem ao paciente (curta, calorosa, com o próximo passo)
// ---------------------------------------------------------------------------
export function mensagemPaciente(paciente: PacienteRow): string {
  const perfil = calcularPerfilIntegrado(paciente);
  const motivo = mesclarComPadrao(paciente.anamnese).motivo;
  const objetivo = objetivoDoPaciente(motivo);
  const frentes = frentesPrioritarias(perfil, motivo, paciente.plano as Plano | undefined).slice(0, 3);
  const fortes = perfil.potencialidades.map((d) => TEXTO_DOMINIO[d.chave].nome.toLowerCase());
  const fases = frentesAprovadasPorHorizonte(paciente, perfil);

  const linhas: string[] = [];
  linhas.push(`Olá, ${primeiroNome(paciente.nome)}! Aqui é o ${NOME_PROFISSIONAL}.`);
  linhas.push("Preparei o seu plano de cuidado a partir da avaliação que fizemos, em linguagem simples, para você ver onde está e aonde vamos chegar.");
  if (objetivo) linhas.push("", `🎯 O que você quer: "${objetivo.length > 160 ? objetivo.slice(0, 157) + "..." : objetivo}"`);
  if (fortes.length > 0) linhas.push("", `✅ O que já está bom: ${listar(fortes.slice(0, 4))}.`);
  if (frentes.length > 0) {
    linhas.push("", "🔎 Por onde vamos começar:");
    frentes.forEach((f, i) => linhas.push(`${i + 1}. ${f.nome} - ${f.plano}`));
  }
  const fase30 = fases.find((f) => f.horizonte === "30");
  linhas.push("", `📅 ${TEXTO_FASE["30"].titulo}: ${fase30 ? `foco em ${listar(fase30.nomes.map((n) => n.toLowerCase()))}.` : TEXTO_FASE["30"].texto}`);
  const t90 = TEXTO_FASE["90"].texto;
  linhas.push(`📅 ${TEXTO_FASE["90"].titulo}: ${t90.charAt(0).toLowerCase()}${t90.slice(1)}`);
  linhas.push("", "Qualquer movimento já faz bem, e com acompanhamento o caminho é mais seguro e mais fácil de manter.", "Vamos combinar a data para começar? 😊");
  return linhas.join("\n");
}

// ---------------------------------------------------------------------------
// Resumo técnico (para outro profissional/médico). Dado de saúde: confidencial.
// ---------------------------------------------------------------------------
function textoAlertas(alertas: Alerta[] | undefined): string[] {
  return (alertas ?? [])
    .slice()
    .sort((a, b) => b.nivel - a.nivel)
    .slice(0, 5)
    .map((a) => `- Nível ${a.nivel} (${rotuloNivel[a.nivel]}): ${a.descricao}`);
}

export function mensagemTecnica(paciente: PacienteRow, idade: number | null): string {
  const perfil = calcularPerfilIntegrado(paciente);
  const nomes = (lista: { titulo: string }[]) => lista.map((d) => d.titulo.toLowerCase()).join(", ");
  const fases = frentesAprovadasPorHorizonte(paciente, perfil);
  const confianca = { alta: "alta", media: "média", baixa: "baixa" }[perfil.confianca];

  const linhas: string[] = [];
  linhas.push(`*Resumo técnico - ${paciente.nome}*${idade !== null ? ` (${idade} anos)` : ""}`);
  linhas.push(`Avaliação integrada de saúde, física e funcional - ${NOME_PROFISSIONAL}`);
  linhas.push(`Confiança do perfil: ${confianca}`);
  const alertas = textoAlertas(paciente.alertas);
  if (alertas.length > 0) linhas.push("", "*Alertas*", ...alertas);
  if (perfil.riscos.length > 0) linhas.push("", `*Prioridade:* ${nomes(perfil.riscos)}`);
  if (perfil.limitacoes.length > 0) linhas.push(`*Atenção:* ${nomes(perfil.limitacoes)}`);
  if (perfil.potencialidades.length > 0) linhas.push(`*Adequado:* ${nomes(perfil.potencialidades)}`);
  const investigar = perfil.dominios.filter((d) => d.classificacao === "investigar");
  if (investigar.length > 0) linhas.push(`*A investigar:* ${nomes(investigar)}`);
  const plano = paciente.plano as Plano | undefined;
  const enc = (plano?.encaminhamentos ?? []).filter(itemAprovado);
  if (fases.length > 0) {
    linhas.push("", "*Plano aprovado*");
    fases.forEach((f) => linhas.push(`- ${HORIZONTES.find((h) => h.chave === f.horizonte)?.curto}: ${f.nomes.join(", ").toLowerCase()}`));
  }
  if (enc.length > 0) linhas.push("", `*Encaminhamentos:* ${enc.map((e) => e.especialidade).join(", ")}`);
  linhas.push("", `_Triagem e apoio à decisão, não é diagnóstico. Pareceres redigidos por assistentes de IA, com responsabilidade de ${NOME_PROFISSIONAL}. Informação de saúde confidencial: não encaminhar a terceiros. O relatório completo segue em PDF._`);
  return linhas.join("\n");
}
