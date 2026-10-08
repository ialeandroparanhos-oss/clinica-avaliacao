// Agente 4/5 — Mobilidade: classificação do domínio a partir de TESTES OBJETIVOS.
//
// Antes, o domínio lia palavras-chave das observações posturais (não é medida, e achado
// postural isolado não é risco). Agora usa só o que foi medido ou observado de forma
// estruturada:
//  - assimetria entre os lados (D x E) em graus: tornozelo (dorsiflexão), quadril (rotação
//    interna e externa) e qualquer par de medidas de goniometria;
//  - restrição observada no agachamento ("profundidade limitada", "calcanhares saem do chão").
//
// Limites honestos:
//  - o corte de assimetria (> 8°) vem de Macedo & Magee 2008 (J Manipulative Physiol Ther
//    31:577, PMID 18984240): em 90 mulheres saudáveis de 18 a 59 anos, a maior diferença média
//    entre o lado dominante e o não dominante foi de 7,5°. É uma referência de variação normal
//    entre lados em mulheres, não um limite validado para todos;
//  - NÃO há corte absoluto (ex.: "dorsiflexão < X°"), porque as tabelas clássicas divergem
//    entre si. Compare com o manual de goniometria que você adota;
//  - os testes em cm (sentar e alcançar, Back Scratch, avanço em parede) ficam registrados,
//    mas sem corte adotado: sozinhos não classificam.

import type { Classificacao } from "@/lib/integracao/perfil";
import { paraNumero } from "@/lib/numeros";

export const LIMITE_ASSIMETRIA_GRAUS = 8;

export type ParDeMedidas = { id: string; rotulo: string; unidade: "°" | "cm"; d: number | null; e: number | null };

export function diferencaEntreLados(d: number | null, e: number | null): { dif: number; maiorLado: "D" | "E" | null } | null {
  if (d === null || e === null) return null;
  const dif = Math.abs(d - e);
  return { dif, maiorLado: d === e ? null : d > e ? "D" : "E" };
}

// Pares D/E da aba Funcional (chaves dos campos de mobilidade articular).
export function paresDeMobilidade(f: Record<string, any> | undefined): ParDeMedidas[] {
  const n = (k: string) => paraNumero(f?.[k]);
  const pares: ParDeMedidas[] = [
    { id: "tornozelo_wblt", rotulo: "Tornozelo - dorsiflexão com carga (avanço em parede)", unidade: "cm", d: n("mob_tornozelo_wblt_d_cm"), e: n("mob_tornozelo_wblt_e_cm") },
    { id: "tornozelo_df", rotulo: "Tornozelo - dorsiflexão (ângulo)", unidade: "°", d: n("mob_tornozelo_df_d_graus"), e: n("mob_tornozelo_df_e_graus") },
    { id: "quadril_ri", rotulo: "Quadril - rotação interna", unidade: "°", d: n("mob_quadril_ri_d_graus"), e: n("mob_quadril_ri_e_graus") },
    { id: "quadril_re", rotulo: "Quadril - rotação externa", unidade: "°", d: n("mob_quadril_re_d_graus"), e: n("mob_quadril_re_e_graus") },
  ];
  // Linhas livres de goniometria: pares D/E do mesmo movimento.
  const linhas: any[] = Array.isArray(f?.goniometria) ? f!.goniometria : [];
  const porMovimento = new Map<string, { d: number | null; e: number | null }>();
  for (const l of linhas) {
    const mov = String(l?.articulacao ?? "").trim();
    const graus = paraNumero(l?.graus);
    if (!mov || graus === null) continue;
    const atual = porMovimento.get(mov) ?? { d: null, e: null };
    if (l.lado === "D") atual.d = graus;
    else if (l.lado === "E") atual.e = graus;
    else if (l.lado === "Bilateral") {
      atual.d = graus;
      atual.e = graus;
    }
    porMovimento.set(mov, atual);
  }
  porMovimento.forEach((v, mov) => pares.push({ id: `gonio_${mov}`, rotulo: mov, unidade: "°", d: v.d, e: v.e }));
  return pares;
}

const ACHADOS_RESTRICAO_AGACHAMENTO = ["Profundidade limitada", "Calcanhares saem do chão"];

export function avaliarMobilidadeObjetiva(f: Record<string, any> | undefined): { classificacao: Classificacao; justificativa: string } {
  const pares = paresDeMobilidade(f);
  const achados: string[] = Array.isArray(f?.agachamento_achados) ? f!.agachamento_achados : [];

  const grausPareados = pares.filter((p) => p.unidade === "°" && p.d !== null && p.e !== null);
  const assimetrias = grausPareados
    .map((p) => ({ p, dif: diferencaEntreLados(p.d, p.e)! }))
    .filter((x) => x.dif.dif > LIMITE_ASSIMETRIA_GRAUS);
  const restricoes = achados.filter((a) => ACHADOS_RESTRICAO_AGACHAMENTO.includes(a));
  const agachamentoRegistrado = achados.length > 0;
  const avaliavel = grausPareados.length > 0 || agachamentoRegistrado;
  const temOutroTeste = pares.some((p) => p.d !== null || p.e !== null) || ["sit_and_reach_cm", "chair_sit_reach_cm", "back_scratch_d_cm", "back_scratch_e_cm"].some((k) => paraNumero(f?.[k]) !== null);

  if (assimetrias.length > 0 || restricoes.length > 0) {
    const partes: string[] = [];
    for (const a of assimetrias) partes.push(`${a.p.rotulo}: diferença de ${a.dif.dif.toFixed(0)}° entre os lados (maior no ${a.dif.maiorLado === "D" ? "direito" : "esquerdo"}; acima de ${LIMITE_ASSIMETRIA_GRAUS}°)`);
    if (restricoes.length > 0) partes.push(`agachamento observado com ${restricoes.map((r) => r.toLowerCase()).join(" e ")}`);
    return { classificacao: "atencao", justificativa: `${partes.join("; ")}. Investigar a causa antes de concluir (a assimetria pode ser normal para o paciente).` };
  }
  if (avaliavel) {
    const o: string[] = [];
    if (grausPareados.length > 0) o.push(`${grausPareados.length} par(es) de medidas D/E sem diferença acima de ${LIMITE_ASSIMETRIA_GRAUS}°`);
    if (agachamentoRegistrado) o.push("agachamento observado sem restrição de profundidade nem calcanhares fora do chão");
    return { classificacao: "adequado", justificativa: `${o.join("; ")}. Critério: assimetria e restrição observada; não há corte absoluto de amplitude validado.` };
  }
  if (temOutroTeste) {
    return { classificacao: "investigar", justificativa: "Testes de flexibilidade ou medidas de um só lado registrados, mas sem pares D/E em graus nem observação do agachamento: sem corte de referência adotado para classificar." };
  }
  return { classificacao: "investigar", justificativa: "Nenhum teste objetivo de mobilidade registrado (pares D/E de tornozelo, quadril ou goniometria, ou observação do agachamento)." };
}
