// N1 (aprovada pelo profissional em 19/10/2026): na lista de pacientes, mostrar quem concluiu a anamnese e
// ainda não tem avaliação, para ninguém ficar esperando sem que se perceba. É só uma etiqueta: não muda
// nenhum cálculo. Uma área conta como "iniciada" quando a seção foi gravada ao menos uma vez (o carimbo
// atualizado_em é gravado em todo salvamento, manual ou automático; abrir a aba não grava nada).

export type LinhaSituacao = {
  anamnese_status: string;
  atualizado_em: string;
  fisica_em?: string | null;
  postural_em?: string | null;
  funcional_em?: string | null;
  cardio_em?: string | null;
};

export type SituacaoAvaliacao = {
  chave: "aguarda_anamnese" | "sem_avaliacao" | "em_andamento" | "completa";
  rotulo: string;
  detalhe: string;
  tom: "neutro" | "aviso" | "info" | "ok";
  areas: number; // de 4 (física, postural, funcional e cardiorrespiratória)
};

export function situacaoAvaliacao(p: LinhaSituacao, hoje: Date = new Date()): SituacaoAvaliacao {
  const areas = [p.fisica_em, p.postural_em, p.funcional_em, p.cardio_em].filter((x) => !!x).length;
  if (p.anamnese_status !== "concluida") {
    return { chave: "aguarda_anamnese", rotulo: "Aguarda anamnese", detalhe: "", tom: "neutro", areas };
  }
  if (areas === 0) {
    const dias = Math.max(0, Math.floor((hoje.getTime() - new Date(p.atualizado_em).getTime()) / 86400000));
    return { chave: "sem_avaliacao", rotulo: "Sem avaliação", detalhe: dias === 0 ? "anamnese concluída hoje" : `anamnese concluída há ${dias} dia${dias === 1 ? "" : "s"}`, tom: "aviso", areas };
  }
  if (areas < 4) return { chave: "em_andamento", rotulo: "Avaliação em andamento", detalhe: `${areas} de 4 áreas`, tom: "info", areas };
  return { chave: "completa", rotulo: "Avaliação completa", detalhe: "4 de 4 áreas", tom: "ok", areas };
}
