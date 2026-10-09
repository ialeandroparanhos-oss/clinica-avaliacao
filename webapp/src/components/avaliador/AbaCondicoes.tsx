"use client";

// Aba "Condições de saúde": explicação breve, em tópicos, das condições que o paciente relatou na anamnese
// (e de qualquer outra que o avaliador queira consultar). Texto educativo do sistema, escrito por assistente
// de IA (Dra. Íris), para tirar dúvidas: não diagnostica nem substitui o médico do paciente.

import { useMemo, useState } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { CATALOGO, buscarCondicoes, condicaoPorId, type Condicao, type GrupoCondicao } from "@/lib/condicoes/catalogo";
import { condicoesDoPaciente } from "@/lib/condicoes/deteccao";
import { referenciaPorId } from "@/lib/agentes";
import { paraNumero } from "@/lib/numeros";
import { analisarComposicao } from "@/lib/avaliacao/composicaoCorporal";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import AgenteAvatar from "./AgenteAvatar";

const ORDEM_GRUPOS: GrupoCondicao[] = ["Cardiovascular", "Metabólica e endócrina", "Respiratória", "Musculoesquelética e dor", "Neurológica", "Saúde mental e sono", "Outras"];

function dadoDoPaciente(c: Condicao, p: PacienteRow): string | null {
  const f = p.fisica ?? {};
  if (c.id === "hipertensao") {
    const sis = paraNumero(f.pa_sistolica);
    const dia = paraNumero(f.pa_diastolica);
    if (sis !== null && dia !== null) return `Pressão registrada na aba Física: ${sis}/${dia} mmHg${sis >= 140 || dia >= 90 ? " (a partir de 140/90: repetir a medida e considerar avaliação médica)" : ""}.`;
    return "Sem pressão arterial registrada na aba Física: meça antes de começar.";
  }
  if (c.id === "obesidade") {
    const comp = analisarComposicao(f, idadeEfetiva(p), sexoEfetivo(p));
    const partes = [comp.imc !== null ? `IMC ${comp.imc.toFixed(1).replace(".", ",")}` : null, comp.pg !== null ? `%G ${comp.pg.toFixed(1).replace(".", ",")}${comp.fontePg ? ` (${comp.fontePg})` : ""}` : null, comp.cintura !== null ? `cintura ${comp.cintura.toFixed(0)} cm` : null].filter(Boolean);
    return partes.length ? `Neste paciente: ${partes.join("; ")}.` : null;
  }
  return null;
}

function Painel({ c, paciente }: { c: Condicao; paciente: PacienteRow }) {
  const dado = dadoDoPaciente(c, paciente);
  const fontes = (c.fontes ?? []).map((id) => referenciaPorId(id)).filter(Boolean) as NonNullable<ReturnType<typeof referenciaPorId>>[];
  return (
    <div className="mt-2 rounded-xl border border-border bg-bg p-4 space-y-3 text-sm">
      {dado && <p className="rounded-lg bg-info-soft text-info px-3 py-2">{dado}</p>}
      <div>
        <p className="text-xs uppercase tracking-wide text-muted font-semibold">O que é</p>
        <p className="text-ink mt-1 leading-relaxed">{c.oQueE}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted font-semibold">Por que importa para a avaliação e o exercício</p>
        <p className="text-ink mt-1 leading-relaxed">{c.importaParaExercicio}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted font-semibold">Cuidados</p>
        <ul className="mt-1 list-disc pl-5 space-y-1 text-ink">
          {c.cuidados.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg bg-danger-soft px-3 py-2">
        <p className="text-xs uppercase tracking-wide text-danger font-semibold">Sinais de alerta (parar e conduzir)</p>
        <ul className="mt-1 list-disc pl-5 space-y-0.5 text-ink">
          {c.sinaisDeAlerta.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted font-semibold">Quando encaminhar</p>
        <p className="text-ink mt-1 leading-relaxed">{c.encaminhar}</p>
      </div>
      {c.noApp && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted font-semibold">No app</p>
          <p className="text-ink mt-1 leading-relaxed">{c.noApp}</p>
        </div>
      )}
      <div className="border-t border-border pt-2 text-xs text-muted space-y-1">
        {fontes.length > 0 ? (
          <>
            <p className="font-semibold">Fontes (existência conferida no PubMed):</p>
            <ul className="space-y-0.5">
              {fontes.map((r) => (
                <li key={r.id}>
                  {r.citacao} (PMID {r.pmid}): {r.apoia}.
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Sem citação: texto educativo geral do sistema. Confirme em fonte clínica antes de mudar uma conduta.</p>
        )}
        <p>Conferir a existência da fonte não é o mesmo que ter lido o texto completo. Este texto não diagnostica e não substitui o médico do paciente.</p>
      </div>
    </div>
  );
}

function Item({ c, aberto, onToggle, origens, paciente }: { c: Condicao; aberto: boolean; onToggle: () => void; origens?: string[]; paciente: PacienteRow }) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        className={`w-full text-left rounded-xl border px-4 py-3 transition flex items-start justify-between gap-3 ${aberto ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent"}`}
      >
        <span>
          <span className="font-medium text-ink">{c.nome}</span>
          {origens && origens.length > 0 && <span className="block text-xs text-muted mt-0.5">Citada em: {origens.join("; ")}</span>}
        </span>
        <span className="text-muted text-sm shrink-0">{aberto ? "Fechar" : "Ver explicação"}</span>
      </button>
      {aberto && <Painel c={c} paciente={paciente} />}
    </li>
  );
}

export function AbaCondicoes({ paciente }: { paciente: PacienteRow }) {
  const det = useMemo(() => condicoesDoPaciente(paciente), [paciente]);
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const alternar = (id: string) =>
    setAbertas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const idsDetectados = new Set(det.condicoes.map((d) => d.id));
  // Sem busca, as condições já citadas ficam só na lista de cima (evita o mesmo item duas vezes na tela).
  const resultado = useMemo(() => buscarCondicoes(busca).filter((c) => busca.trim() !== "" || !idsDetectados.has(c.id)), [busca, det]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center gap-3">
          <AgenteAvatar id="iris" tamanho={48} titulo="Ilustração da Dra. Íris" />
          <div>
            <h3 className="font-display text-lg text-ink">
              Explicação das condições de saúde <span className="align-middle text-xs font-sans font-medium rounded-full bg-info-soft text-info px-2 py-0.5 ml-1">assistente de IA</span>
            </h3>
            <p className="text-xs text-muted">Dra. Íris: integração e interpretação clínica</p>
          </div>
        </div>
        <p className="text-sm text-muted leading-relaxed">
          Para tirar dúvidas sobre o que o paciente relatou. Clique numa condição para ver, em tópicos, o que é, por que importa para a avaliação e o exercício, os cuidados, os sinais de alerta e quando encaminhar. É texto educativo do sistema: não faz diagnóstico, não prescreve e não substitui o médico do paciente.
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="font-display text-lg text-ink">Citadas na anamnese deste paciente</h3>
        {det.medicamentos.length > 0 && (
          <p className="text-sm text-muted">
            <strong className="text-ink">Medicamentos informados:</strong> {det.medicamentos.join("; ")}.
          </p>
        )}
        {det.condicoes.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma condição do catálogo foi reconhecida na anamnese (doenças, outras condições, lesões, cirurgias, medicamentos, PAR-Q+ e triagem de risco). Use a busca abaixo para consultar qualquer uma.</p>
        ) : (
          <ul className="space-y-2">
            {det.condicoes.map((d) => {
              const c = condicaoPorId(d.id);
              return c ? <Item key={c.id} c={c} aberto={abertas.has(c.id)} onToggle={() => alternar(c.id)} origens={d.origens} paciente={paciente} /> : null;
            })}
          </ul>
        )}
        {det.naoReconhecidos.length > 0 && (
          <div className="rounded-xl border border-warn bg-warn-soft px-4 py-3 text-sm">
            <p className="font-medium text-warn">Termos que o sistema não reconheceu (confira você):</p>
            <ul className="mt-1 list-disc pl-5 text-ink">
              {det.naoReconhecidos.map((t, i) => (
                <li key={i}>
                  “{t.texto}” <span className="text-muted">({t.campo})</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted">Pode ser uma condição fora do catálogo ou escrita de outro jeito. Procure abaixo; se não houver, consulte o médico do paciente.</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lg text-ink">Consultar outra condição</h3>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou sinônimo (ex.: pressão alta, artrose, derrame)"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          aria-label="Buscar condição"
        />
        {resultado.length === 0 && <p className="text-sm text-muted">Nada encontrado no catálogo ({CATALOGO.length} condições). Tente outro termo.</p>}
        {ORDEM_GRUPOS.map((g) => {
          const itens = resultado.filter((c) => c.grupo === g);
          if (itens.length === 0) return null;
          return (
            <div key={g}>
              <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-1.5">{g}</p>
              <ul className="space-y-2">
                {itens.map((c) => (
                  <Item key={c.id} c={c} aberto={abertas.has(c.id)} onToggle={() => alternar(c.id)} origens={idsDetectados.has(c.id) ? ["anamnese deste paciente"] : undefined} paciente={paciente} />
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
