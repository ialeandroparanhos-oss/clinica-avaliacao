"use client";

// Aba Plano de Intervenção (Agente 7 - Theo).
//
// O sistema SUGERE (a partir dos resultados, confrontados com a literatura) um
// plano para 30, 60, 90 dias e anual. Cada sugestão chega "a revisar": o
// avaliador concorda, discorda (com o motivo), edita ou acrescenta itens. Só o
// que foi aprovado entra no plano e no relatório.

import { useMemo, useState } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { createClient } from "@/lib/supabase/client";
import { Field, TextArea, TextInput } from "@/components/forms";
import { SalvarBar, Selo, mesclarNoPlano, useAutoSalvar, type TomSelo } from "./campos";
import { calcularPerfilIntegrado } from "@/lib/integracao/perfil";
import {
  HORIZONTES,
  HORIZONTE_LEGADO,
  ROTULO_CATEGORIA,
  ROTULO_STATUS,
  gerarId,
  itemAprovado,
  mesclarSugestoes,
  statusDe,
  sugerirPlano,
  type Categoria,
  type Encaminhamento,
  type Evidencia,
  type Horizonte,
  type ItemPlano,
  type Plano,
  type StatusItem,
} from "@/lib/integracao/plano";
import { NOME_SERVICO, ROTULO_PRIORIDADE_SERVICO, type EtapaServico, type PrioridadeServico, type ServicoPlano } from "@/lib/integracao/servicos";

const ORDEM_CATEGORIA: Categoria[] = ["seguranca", "encaminhamento", "intervencao", "orientacao", "reavaliacao"];

const TOM_STATUS: Record<StatusItem, TomSelo> = { sugerido: "atencao", concordo: "ok", discordo: "neutro", editado: "info", manual: "info" };
const TOM_CATEGORIA: Record<Categoria, TomSelo> = { seguranca: "alerta", encaminhamento: "atencao", intervencao: "ok", orientacao: "info", reavaliacao: "neutro" };

function BlocoEvidencia({ evidencia }: { evidencia: Evidencia }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-accent-dark font-medium">O que a ciência diz</summary>
      <div className="mt-2 space-y-2 rounded-lg bg-bg p-3">
        <p className="text-ink leading-relaxed">{evidencia.resumo}</p>
        {evidencia.certeza && (
          <p className="text-xs text-muted">
            <strong>Nível de evidência:</strong> {evidencia.certeza}
          </p>
        )}
        {evidencia.ressalva && (
          <p className="text-xs text-warn">
            <strong>Atenção:</strong> {evidencia.ressalva}
          </p>
        )}
        <ul className="text-xs space-y-0.5">
          {evidencia.referencias.map((r) => (
            <li key={r.rotulo}>
              {r.url ? (
                <a href={r.url} target="_blank" rel="noreferrer" className="text-accent-dark underline">
                  {r.rotulo}
                </a>
              ) : (
                r.rotulo
              )}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-muted">Referências consultadas em resumos e páginas de síntese: confirme na fonte antes de adotar a conduta em definitivo.</p>
      </div>
    </details>
  );
}

function BotoesDecisao({ status, onConcordo, onDiscordo, onEditar }: { status: StatusItem; onConcordo: () => void; onDiscordo: () => void; onEditar: () => void }) {
  const base = "rounded-full border px-3 py-1 text-xs font-medium transition";
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onConcordo} aria-pressed={status === "concordo"} className={`${base} ${status === "concordo" ? "bg-accent text-white border-accent" : "bg-surface text-ink border-border hover:border-accent"}`}>
        ✓ Concordo
      </button>
      <button type="button" onClick={onDiscordo} aria-pressed={status === "discordo"} className={`${base} ${status === "discordo" ? "bg-danger text-white border-danger" : "bg-surface text-ink border-border hover:border-danger"}`}>
        ✗ Discordo
      </button>
      <button type="button" onClick={onEditar} className={`${base} bg-surface text-ink border-border hover:border-info`}>
        ✎ Editar
      </button>
    </div>
  );
}

// Primeira frase de um texto (para a visão resumida da linha do tempo).
function primeiraFrase(t: string): string {
  const i = t.search(/[.:;]\s/);
  return i > 10 ? t.slice(0, i) : t.replace(/\.$/, "");
}

// Serviços da clínica sugeridos: linha do tempo (quando entra cada um) + cartões com o porquê, a
// evidência e a decisão do avaliador. Não é tabela de vendas: cada serviço tem de ter achado que o
// justifique, o que tem evidência fraca ou divergente aparece como opcional, e a decisão é sempre sua.
function PainelServicos({
  servicos,
  editandoId,
  setEditandoId,
  atualizar,
  remover,
  horizontes,
}: {
  servicos: ServicoPlano[];
  editandoId: string | null;
  setEditandoId: (id: string | null) => void;
  atualizar: (id: string, patch: Partial<ServicoPlano>) => void;
  remover: (id: string) => void;
  horizontes: { chave: Horizonte; titulo: string; curto: string }[];
}) {
  const ativos = servicos.filter((s) => statusDe(s) !== "discordo");
  const atualizarEtapa = (s: ServicoPlano, i: number, patch: Partial<EtapaServico>) => atualizar(s.id, { etapas: s.etapas.map((e, k) => (k === i ? { ...e, ...patch } : e)) });
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <div>
        <h4 className="font-display text-base text-ink">Serviços da clínica que podem entrar no plano</h4>
        <p className="text-xs text-muted leading-relaxed mt-1">
          Sugeridos a partir dos achados da avaliação e da anamnese, com o momento em que cada um poderia entrar (30, 60, 90 dias ou anual). Cada serviço mostra o motivo e o que a literatura diz; o que tem evidência fraca ou divergente
          aparece como <strong>opcional</strong>. O sistema só sugere o que tem um achado que o justifique; <strong>a decisão é sua e do paciente</strong>, e nada é oferecido sem a sua aprovação.
        </p>
      </div>

      {servicos.length === 0 ? (
        <p className="text-sm text-muted">Nenhum serviço sugerido ainda. Use &quot;Sugerir a partir dos resultados&quot; (precisa de dados de dor, testes ou questionários).</p>
      ) : (
        <>
          {ativos.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {horizontes.map((h) => {
                const doHorizonte = ativos.flatMap((s) => s.etapas.filter((e) => e.horizonte === h.chave).map((e) => ({ s, e })));
                return (
                  <div key={h.chave} className="rounded-xl border border-border bg-bg p-3">
                    <p className="text-sm font-medium text-ink mb-1.5">{h.curto}</p>
                    {doHorizonte.length === 0 ? (
                      <p className="text-xs text-muted">Sem serviço novo.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {doHorizonte.map(({ s, e }, i) => (
                          <li key={`${s.id}-${i}`} className="text-xs leading-snug">
                            <span className={`font-semibold ${s.prioridade === "indicado" ? "text-accent-dark" : "text-muted"}`}>{NOME_SERVICO[s.servico].split(" (")[0]}</span>
                            {s.prioridade === "opcional" && <span className="text-muted"> (opcional)</span>}
                            <span className="text-ink">: {primeiraFrase(e.texto)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <ul className="space-y-3">
            {servicos.map((s) => {
              const status = statusDe(s);
              const editando = editandoId === s.id;
              return (
                <li key={s.id} className={`rounded-xl border p-4 space-y-2 ${status === "discordo" ? "border-border bg-bg opacity-70" : status === "sugerido" ? "border-warn/40 bg-warn-soft/30" : "border-border"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`text-sm font-medium text-ink ${status === "discordo" ? "line-through" : ""}`}>{NOME_SERVICO[s.servico]}</p>
                    <Selo tom={s.prioridade === "indicado" ? "ok" : "neutro"}>{ROTULO_PRIORIDADE_SERVICO[s.prioridade]}</Selo>
                    <Selo tom={TOM_STATUS[status]}>{ROTULO_STATUS[status]}</Selo>
                  </div>
                  <p className="text-xs text-muted">
                    <strong>Por que:</strong> {s.motivos.join("; ")}.
                  </p>
                  {editando ? (
                    <div className="space-y-2">
                      <label className="text-xs text-ink">
                        Classificação{" "}
                        <select value={s.prioridade} onChange={(e) => atualizar(s.id, { prioridade: e.target.value as PrioridadeServico, status: status === "concordo" ? "editado" : status })} className="rounded-lg border border-border bg-surface px-2 py-1 text-xs">
                          <option value="indicado">Indicado</option>
                          <option value="opcional">Opcional</option>
                        </select>
                      </label>
                      {s.etapas.map((e, i) => (
                        <div key={i} className="flex flex-wrap gap-2 items-start">
                          <select value={e.horizonte} onChange={(ev) => atualizarEtapa(s, i, { horizonte: ev.target.value as Horizonte })} className="text-xs rounded-lg border border-border bg-surface px-2 py-1" aria-label="Quando">
                            {horizontes.map((h) => (
                              <option key={h.chave} value={h.chave}>
                                {h.curto}
                              </option>
                            ))}
                          </select>
                          <TextArea value={e.texto} onChange={(ev) => atualizarEtapa(s, i, { texto: ev.target.value })} className="flex-1 min-w-[16rem]" />
                          <button type="button" onClick={() => atualizar(s.id, { etapas: s.etapas.filter((_, k) => k !== i) })} className="text-xs text-muted hover:text-danger">
                            remover etapa
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-3 text-sm">
                        <button type="button" onClick={() => atualizar(s.id, { etapas: [...s.etapas, { horizonte: "60", texto: "" }] })} className="font-medium text-accent hover:underline">
                          + Etapa
                        </button>
                        <button type="button" onClick={() => setEditandoId(null)} className="font-medium text-accent hover:underline">
                          Concluir edição
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ul className="text-sm space-y-1">
                      {s.etapas.map((e, i) => (
                        <li key={i} className={status === "discordo" ? "line-through" : ""}>
                          <strong className="text-ink">{horizontes.find((h) => h.chave === e.horizonte)?.curto ?? e.horizonte}:</strong> <span className="text-ink">{e.texto}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.ressalva && (
                    <p className="text-xs text-warn">
                      <strong>Atenção:</strong> {s.ressalva}
                    </p>
                  )}
                  {s.evidencia && <BlocoEvidencia evidencia={s.evidencia} />}
                  {status === "discordo" && (
                    <Field label="Por que você discorda? (opcional - fica registrado)">
                      <TextInput value={s.comentario ?? ""} onChange={(e) => atualizar(s.id, { comentario: e.target.value })} />
                    </Field>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    <BotoesDecisao status={status} onConcordo={() => atualizar(s.id, { status: "concordo" })} onDiscordo={() => atualizar(s.id, { status: "discordo" })} onEditar={() => setEditandoId(s.id)} />
                    <button type="button" onClick={() => remover(s.id)} className="text-xs text-muted hover:text-danger">
                      remover
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export function AbaPlano({ paciente, onSalvo }: { paciente: PacienteRow; onSalvo: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const planoSalvo = (paciente.plano ?? {}) as Partial<Plano>;
  const [itens, setItens] = useState<ItemPlano[]>(planoSalvo.itens ?? []);
  const [encaminhamentos, setEncaminhamentos] = useState<Encaminhamento[]>(planoSalvo.encaminhamentos ?? []);
  const [servicos, setServicos] = useState<ServicoPlano[]>(planoSalvo.servicos ?? []);
  const [editandoServico, setEditandoServico] = useState<string | null>(null);
  const atualizarServico = (id: string, patch: Partial<ServicoPlano>) => setServicos((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<{ descricao: string; indicador: string; comentario: string }>({ descricao: "", indicador: "", comentario: "" });
  const [novoItem, setNovoItem] = useState("");
  const [novoHorizonte, setNovoHorizonte] = useState<Horizonte>("30");
  const [novaCategoria, setNovaCategoria] = useState<Categoria>("intervencao");
  const [novaEspecialidade, setNovaEspecialidade] = useState("");
  const [novoMotivo, setNovoMotivo] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);

  const atualizarItem = (id: string, patch: Partial<ItemPlano>) => setItens((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const atualizarEnc = (id: string, patch: Partial<Encaminhamento>) => setEncaminhamentos((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  function gerarSugestoes() {
    const perfil = calcularPerfilIntegrado(paciente);
    const sugestao = sugerirPlano(perfil, paciente);
    const mesclado = mesclarSugestoes({ itens, encaminhamentos, servicos }, sugestao);
    const novos = mesclado.itens.length - itens.length + (mesclado.encaminhamentos.length - encaminhamentos.length) + (mesclado.servicos.length - servicos.length);
    setItens(mesclado.itens);
    setEncaminhamentos(mesclado.encaminhamentos);
    setServicos(mesclado.servicos);
    setMensagem(novos > 0 ? `${novos} sugestão(ões) nova(s) adicionada(s) para você revisar. O que você já decidiu ou editou não foi alterado.` : "Nenhuma sugestão nova: o plano já contém as sugestões para estes resultados.");
  }

  function concordarComPendentes() {
    setItens((prev) => prev.map((i) => (statusDe(i) === "sugerido" ? { ...i, status: "concordo" } : i)));
    setEncaminhamentos((prev) => prev.map((e) => (statusDe(e) === "sugerido" ? { ...e, status: "concordo" } : e)));
    setServicos((prev) => prev.map((s) => (statusDe(s) === "sugerido" ? { ...s, status: "concordo" } : s)));
  }

  function abrirEdicao(i: ItemPlano) {
    setEditandoId(i.id);
    setRascunho({ descricao: i.descricao, indicador: i.indicador ?? "", comentario: i.comentario ?? "" });
  }

  function salvarEdicao(i: ItemPlano) {
    const mudou = rascunho.descricao.trim() !== i.descricao;
    atualizarItem(i.id, {
      descricao: rascunho.descricao.trim() || i.descricao,
      indicador: rascunho.indicador.trim() || undefined,
      comentario: rascunho.comentario.trim() || undefined,
      descricaoOriginal: i.descricaoOriginal ?? (mudou ? i.descricao : undefined),
      status: i.status === "manual" ? "manual" : "editado",
    });
    setEditandoId(null);
  }

  function adicionarItem() {
    if (!novoItem.trim()) return;
    setItens((prev) => [
      ...prev,
      { id: gerarId(), horizonte: novoHorizonte, descricao: novoItem.trim(), origem: "Adicionado manualmente pelo avaliador", categoria: novaCategoria, status: "manual" },
    ]);
    setNovoItem("");
  }

  function adicionarEncaminhamento() {
    if (!novaEspecialidade.trim()) return;
    setEncaminhamentos((prev) => [...prev, { id: gerarId(), especialidade: novaEspecialidade.trim(), motivo: novoMotivo.trim(), status: "manual" }]);
    setNovaEspecialidade("");
    setNovoMotivo("");
  }

  async function salvar() {
    setSalvando(true);
    const { data: userData } = await supabase.auth.getUser();
    // Preserva as metas da aba Reavaliação (e qualquer outro campo do plano).
    const payload: Plano = {
      ...(planoSalvo as Plano),
      itens,
      encaminhamentos,
      servicos,
      avaliador: userData.user?.email ?? null,
      atualizado_em: new Date().toISOString(),
      versao: 2,
    };
    await supabase.from("pacientes").update({ plano: payload, atualizado_em: new Date().toISOString() }).eq("id", paciente.id);
    setSalvando(false);
    setOk(true);
    setTimeout(() => setOk(false), 2500);
    onSalvo();
  }

  // Rascunho automático: o plano é gravado sozinho (preservando metas e pareceres).
  const estadoAuto = useAutoSalvar({ itens, encaminhamentos, servicos }, (v) => mesclarNoPlano(supabase, paciente.id, (plano) => ({ ...plano, itens: v.itens, encaminhamentos: v.encaminhamentos, servicos: v.servicos, versao: 2 })));

  const todos = [...itens, ...encaminhamentos, ...servicos];
  const contagem = {
    revisar: todos.filter((x) => statusDe(x) === "sugerido").length,
    aprovados: todos.filter((x) => itemAprovado(x)).length,
    discordo: todos.filter((x) => statusDe(x) === "discordo").length,
  };
  const horizontesVisiveis = itens.some((i) => i.horizonte === "180") ? [...HORIZONTES, HORIZONTE_LEGADO] : HORIZONTES;

  function resumoAprovado(): string {
    const linhas: string[] = ["PLANO DE INTERVENÇÃO (itens aprovados)"];
    for (const h of horizontesVisiveis) {
      const doHorizonte = itens.filter((i) => i.horizonte === h.chave && itemAprovado(i));
      if (doHorizonte.length === 0) continue;
      linhas.push("", h.titulo.toUpperCase());
      doHorizonte.forEach((i) => linhas.push(`- [${ROTULO_CATEGORIA[i.categoria ?? "intervencao"]}] ${i.descricao}${i.indicador ? ` | Indicador: ${i.indicador}` : ""}`));
    }
    const servAprov = servicos.filter(itemAprovado);
    if (servAprov.length > 0) {
      linhas.push("", "SERVIÇOS DA CLÍNICA");
      servAprov.forEach((s) => {
        linhas.push(`- ${NOME_SERVICO[s.servico]} (${ROTULO_PRIORIDADE_SERVICO[s.prioridade].toLowerCase()})`);
        s.etapas.forEach((e) => linhas.push(`    ${HORIZONTES.find((h) => h.chave === e.horizonte)?.curto ?? e.horizonte}: ${e.texto}`));
      });
    }
    const encAprov = encaminhamentos.filter(itemAprovado);
    if (encAprov.length > 0) {
      linhas.push("", "ENCAMINHAMENTOS");
      encAprov.forEach((e) => linhas.push(`- ${e.especialidade}: ${e.motivo}`));
    }
    return linhas.join("\n");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg text-ink">Plano de Intervenção</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <button type="button" onClick={gerarSugestoes} className="font-medium text-accent hover:underline">
              Sugerir a partir dos resultados
            </button>
            {contagem.revisar > 0 && (
              <button type="button" onClick={concordarComPendentes} className="font-medium text-accent hover:underline">
                Concordar com todos os pendentes ({contagem.revisar})
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          As sugestões saem do Perfil Integrado e dos seus dados (FC alvo, dor por região, testes, objetivo do paciente), confrontados com a literatura: cada item mostra a dose, o resultado que o motivou, a evidência e como
          medir se funcionou. <strong>Nada vale até você decidir</strong>: concorde, discorde (com o motivo), edite ou acrescente. São apoio à decisão, não prescrição automática; as doses seguem a literatura de adultos
          saudáveis e devem ser adaptadas a doenças, dor e risco cardiovascular. No início entram no máximo 3 frentes ao mesmo tempo, para favorecer a adesão.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <Selo tom="atencao">{contagem.revisar} a revisar</Selo>
          <Selo tom="ok">{contagem.aprovados} no plano</Selo>
          <Selo tom="neutro">{contagem.discordo} descartados</Selo>
        </div>
        {mensagem && <p className="text-sm text-accent-dark">{mensagem}</p>}
      </div>

      <PainelServicos
        servicos={servicos}
        editandoId={editandoServico}
        setEditandoId={setEditandoServico}
        atualizar={atualizarServico}
        remover={(id) => setServicos((prev) => prev.filter((s) => s.id !== id))}
        horizontes={horizontesVisiveis}
      />

      {horizontesVisiveis.map((h) => {
        const doHorizonte = itens
          .filter((i) => i.horizonte === h.chave)
          .sort((a, b) => ORDEM_CATEGORIA.indexOf(a.categoria ?? "intervencao") - ORDEM_CATEGORIA.indexOf(b.categoria ?? "intervencao"));
        return (
          <div key={h.chave} className="rounded-2xl border border-border bg-surface p-5">
            <h4 className="font-display text-base text-ink mb-3">{h.titulo}</h4>
            {doHorizonte.length === 0 ? (
              <p className="text-sm text-muted">Nenhum item neste horizonte ainda. Use "Sugerir a partir dos resultados" ou adicione manualmente.</p>
            ) : (
              <ul className="space-y-3">
                {doHorizonte.map((item) => {
                  const status = statusDe(item);
                  const editando = editandoId === item.id;
                  return (
                    <li
                      key={item.id}
                      className={`rounded-xl border p-4 space-y-2 ${
                        status === "discordo" ? "border-border bg-bg opacity-70" : status === "sugerido" ? "border-warn/40 bg-warn-soft/30" : "border-border"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Selo tom={TOM_CATEGORIA[item.categoria ?? "intervencao"]}>{ROTULO_CATEGORIA[item.categoria ?? "intervencao"]}</Selo>
                        <Selo tom={TOM_STATUS[status]}>{ROTULO_STATUS[status]}</Selo>
                        <span className="text-xs text-muted">{item.origem}</span>
                      </div>

                      {editando ? (
                        <div className="space-y-2">
                          <Field label="O que fazer">
                            <TextArea value={rascunho.descricao} onChange={(e) => setRascunho((r) => ({ ...r, descricao: e.target.value }))} />
                          </Field>
                          <Field label="Como saber que funcionou (indicador/meta)">
                            <TextInput value={rascunho.indicador} onChange={(e) => setRascunho((r) => ({ ...r, indicador: e.target.value }))} />
                          </Field>
                          <Field label="Por que mudou? (opcional)">
                            <TextInput value={rascunho.comentario} onChange={(e) => setRascunho((r) => ({ ...r, comentario: e.target.value }))} />
                          </Field>
                          <div className="flex gap-3 text-sm">
                            <button type="button" onClick={() => salvarEdicao(item)} className="font-medium text-accent hover:underline">
                              Salvar edição
                            </button>
                            <button type="button" onClick={() => setEditandoId(null)} className="text-muted hover:text-ink">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className={`text-sm text-ink leading-relaxed ${status === "discordo" ? "line-through" : ""}`}>{item.descricao}</p>
                          {item.resultado && (
                            <p className="text-xs text-muted">
                              <strong>Resultado do paciente:</strong> {item.resultado}
                            </p>
                          )}
                          {item.objetivoPaciente && (
                            <p className="text-xs text-accent-dark italic">Ligado ao que o paciente disse: "{item.objetivoPaciente}"</p>
                          )}
                          {item.indicador && (
                            <p className="text-xs text-ink">
                              <strong>Como saber que funcionou:</strong> {item.indicador}
                            </p>
                          )}
                          {item.comentario && (
                            <p className="text-xs text-info">
                              <strong>Sua nota:</strong> {item.comentario}
                            </p>
                          )}
                          {item.descricaoOriginal && (
                            <details className="text-xs text-muted">
                              <summary className="cursor-pointer">Ver o texto sugerido originalmente</summary>
                              <p className="mt-1">{item.descricaoOriginal}</p>
                            </details>
                          )}
                          {item.evidencia && <BlocoEvidencia evidencia={item.evidencia} />}
                        </>
                      )}

                      {status === "discordo" && !editando && (
                        <Field label="Por que você discorda? (opcional - fica registrado)">
                          <TextInput value={item.comentario ?? ""} onChange={(e) => atualizarItem(item.id, { comentario: e.target.value })} />
                        </Field>
                      )}

                      {!editando && (
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          {status !== "manual" && (
                            <BotoesDecisao
                              status={status}
                              onConcordo={() => atualizarItem(item.id, { status: item.descricaoOriginal ? "editado" : "concordo" })}
                              onDiscordo={() => atualizarItem(item.id, { status: "discordo" })}
                              onEditar={() => abrirEdicao(item)}
                            />
                          )}
                          {status === "manual" && (
                            <button type="button" onClick={() => abrirEdicao(item)} className="text-xs font-medium text-accent hover:underline">
                              ✎ Editar
                            </button>
                          )}
                          <select
                            value={item.horizonte}
                            onChange={(e) => atualizarItem(item.id, { horizonte: e.target.value as Horizonte })}
                            className="text-xs rounded-lg border border-border bg-surface px-2 py-1"
                            aria-label="Mover para outro horizonte"
                          >
                            {horizontesVisiveis.map((opt) => (
                              <option key={opt.chave} value={opt.chave}>
                                {opt.curto}
                              </option>
                            ))}
                          </select>
                          <button type="button" onClick={() => setItens((prev) => prev.filter((i) => i.id !== item.id))} className="text-xs text-muted hover:text-danger">
                            remover
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h4 className="font-display text-base text-ink">Adicionar item manualmente</h4>
        <div className="flex flex-col sm:flex-row gap-2">
          <TextInput value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Descrição do item do plano" className="flex-1" />
          <select value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value as Categoria)} className="text-sm rounded-lg border border-border bg-surface px-3 py-2">
            {ORDEM_CATEGORIA.map((c) => (
              <option key={c} value={c}>
                {ROTULO_CATEGORIA[c]}
              </option>
            ))}
          </select>
          <select value={novoHorizonte} onChange={(e) => setNovoHorizonte(e.target.value as Horizonte)} className="text-sm rounded-lg border border-border bg-surface px-3 py-2">
            {HORIZONTES.map((opt) => (
              <option key={opt.chave} value={opt.chave}>
                {opt.curto}
              </option>
            ))}
          </select>
          <button type="button" onClick={adicionarItem} className="text-sm font-medium text-accent hover:underline whitespace-nowrap">
            + Adicionar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <h4 className="font-display text-base text-ink">Encaminhamentos sugeridos</h4>
        {encaminhamentos.length === 0 ? (
          <p className="text-sm text-muted">Nenhum encaminhamento registrado.</p>
        ) : (
          <ul className="space-y-3">
            {encaminhamentos.map((enc) => {
              const status = statusDe(enc);
              return (
                <li key={enc.id} className={`rounded-xl border p-4 space-y-2 ${status === "discordo" ? "border-border bg-bg opacity-70" : status === "sugerido" ? "border-warn/40 bg-warn-soft/30" : "border-border"}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Selo tom={TOM_STATUS[status]}>{ROTULO_STATUS[status]}</Selo>
                    <p className={`text-sm font-medium text-ink ${status === "discordo" ? "line-through" : ""}`}>{enc.especialidade}</p>
                  </div>
                  <p className="text-xs text-muted">{enc.motivo}</p>
                  {enc.evidencia && <BlocoEvidencia evidencia={enc.evidencia} />}
                  {status === "discordo" && (
                    <Field label="Por que você discorda? (opcional)">
                      <TextInput value={enc.comentario ?? ""} onChange={(e) => atualizarEnc(enc.id, { comentario: e.target.value })} />
                    </Field>
                  )}
                  <div className="flex flex-wrap items-center gap-3">
                    {status !== "manual" && (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => atualizarEnc(enc.id, { status: "concordo" })} className={`rounded-full border px-3 py-1 text-xs font-medium ${status === "concordo" ? "bg-accent text-white border-accent" : "bg-surface border-border hover:border-accent"}`}>
                          ✓ Concordo
                        </button>
                        <button type="button" onClick={() => atualizarEnc(enc.id, { status: "discordo" })} className={`rounded-full border px-3 py-1 text-xs font-medium ${status === "discordo" ? "bg-danger text-white border-danger" : "bg-surface border-border hover:border-danger"}`}>
                          ✗ Discordo
                        </button>
                      </div>
                    )}
                    <button type="button" onClick={() => setEncaminhamentos((prev) => prev.filter((e) => e.id !== enc.id))} className="text-xs text-muted hover:text-danger">
                      remover
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
          <TextInput value={novaEspecialidade} onChange={(e) => setNovaEspecialidade(e.target.value)} placeholder="Especialidade (ex.: Nutrição)" className="flex-1" />
          <TextInput value={novoMotivo} onChange={(e) => setNovoMotivo(e.target.value)} placeholder="Motivo" className="flex-1" />
          <button type="button" onClick={adicionarEncaminhamento} className="text-sm font-medium text-accent hover:underline whitespace-nowrap">
            + Adicionar
          </button>
        </div>
      </div>

      <details className="rounded-2xl border border-border bg-surface p-5">
        <summary className="cursor-pointer font-display text-base text-ink">Resumo do plano aprovado (o que vai para o relatório)</summary>
        <pre className="mt-3 whitespace-pre-wrap text-xs text-ink font-sans leading-relaxed">{resumoAprovado()}</pre>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(resumoAprovado())}
          className="mt-3 text-sm font-medium text-accent hover:underline"
        >
          Copiar resumo
        </button>
      </details>

      <SalvarBar salvando={salvando} ok={ok} onSalvar={salvar} auto={estadoAuto} />
    </div>
  );
}
