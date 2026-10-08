"use client";

// Cartão de parecer do agente, igual em todas as abas: o avaliador escolhe o
// estilo (sucinto e objetivo / mais explicativo), o agente redige o rascunho,
// e o avaliador edita e marca como revisado. O estilo escolhido é lembrado.

import { useEffect, useMemo, useState } from "react";
import { TextArea } from "@/components/forms";
import { createClient } from "@/lib/supabase/client";
import { gerarParecerAgente, ROTULO_ESTILO, type AgenteParecer, type EstiloParecer } from "@/lib/avaliacao/pareceres";
import { AGENTES_SISTEMA, nomeComTitulo, revisaoVencida, textoRevisao, type AgenteId } from "@/lib/agentes";
import type { PacienteRow } from "@/lib/anamnese/types";
import { mesclarNoPlano, TextoAuto, useAutoSalvar } from "./campos";

export type ParecerSalvo = {
  texto: string;
  estilo: EstiloParecer;
  automatico: string; // último texto gerado pelo agente (para saber se o avaliador editou)
  revisado: boolean;
};

const CHAVE_ESTILO = "parecer-estilo-preferido";

export function estiloPreferido(): EstiloParecer {
  try {
    const v = window.localStorage.getItem(CHAVE_ESTILO);
    if (v === "sucinto" || v === "explicativo") return v;
  } catch {
    // sem armazenamento local: usa o padrão
  }
  return "sucinto";
}

function lembrarEstilo(e: EstiloParecer) {
  try {
    window.localStorage.setItem(CHAVE_ESTILO, e);
  } catch {
    // ignora
  }
}

export function parecerVazio(estilo: EstiloParecer): ParecerSalvo {
  return { texto: "", estilo, automatico: "", revisado: false };
}

// Normaliza o que veio do banco (aceita fichas sem parecer).
export function lerParecer(bruto: any): ParecerSalvo | null {
  if (!bruto || typeof bruto.texto !== "string") return null;
  return {
    texto: bruto.texto,
    estilo: bruto.estilo === "explicativo" ? "explicativo" : "sucinto",
    automatico: typeof bruto.automatico === "string" ? bruto.automatico : "",
    revisado: !!bruto.revisado,
  };
}

export function PainelParecer({
  agente,
  valor,
  onChange,
  gerar,
  mensagemVazia = "Ainda não há dados para o agente redigir o parecer.",
  linhas = 14,
}: {
  agente: AgenteId;
  valor: ParecerSalvo | null;
  onChange: (v: ParecerSalvo) => void;
  gerar: (estilo: EstiloParecer) => string;
  mensagemVazia?: string;
  linhas?: number;
}) {
  const [estiloInicial, setEstiloInicial] = useState<EstiloParecer>("sucinto");
  useEffect(() => setEstiloInicial(estiloPreferido()), []);

  const estilo = valor?.estilo ?? estiloInicial;
  const texto = valor?.texto ?? "";
  const editado = texto !== "" && texto !== (valor?.automatico ?? "");
  const automaticoAtual = useMemo(() => gerar(estilo), [gerar, estilo]);
  const desatualizado = !!valor && valor.automatico !== "" && automaticoAtual !== "" && automaticoAtual !== valor.automatico;

  function aplicar(novoEstilo: EstiloParecer) {
    const novo = gerar(novoEstilo);
    onChange({ texto: novo, estilo: novoEstilo, automatico: novo, revisado: false });
  }

  function escolherEstilo(novo: EstiloParecer) {
    lembrarEstilo(novo);
    if (novo === estilo) return;
    if (texto === "") {
      setEstiloInicial(novo);
      onChange({ ...(valor ?? parecerVazio(novo)), estilo: novo });
      return;
    }
    if (editado && !window.confirm("Trocar o estilo substitui o texto que você editou por um novo parecer. Continuar?")) return;
    aplicar(novo);
  }

  function gerarOuAtualizar() {
    if (editado && !window.confirm("Gerar de novo substitui o texto que você editou. Continuar?")) return;
    aplicar(estilo);
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-ink">
            Parecer {nomeComTitulo(agente)} <span className="align-middle text-xs font-sans font-medium rounded-full bg-info-soft text-info px-2 py-0.5 ml-1">assistente de IA</span>
          </h3>
          <p className="text-xs text-muted">{AGENTES_SISTEMA[agente].especialidade}</p>
        </div>
        <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm" role="group" aria-label="Estilo do parecer">
          {(["sucinto", "explicativo"] as EstiloParecer[]).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => escolherEstilo(e)}
              aria-pressed={estilo === e}
              className={`px-3 py-1.5 transition ${estilo === e ? "bg-accent text-white" : "bg-surface text-muted hover:text-ink"}`}
            >
              {ROTULO_ESTILO[e]}
            </button>
          ))}
        </div>
      </div>

      {texto === "" ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">{automaticoAtual === "" ? mensagemVazia : "O agente redige um rascunho com os dados atuais; você edita e aprova."}</p>
          <button type="button" onClick={gerarOuAtualizar} disabled={automaticoAtual === ""} className="text-sm font-medium text-accent hover:underline disabled:opacity-50">
            Gerar parecer
          </button>
        </div>
      ) : (
        <>
          {desatualizado && (
            <p className="text-xs text-warn">
              Os dados mudaram depois que este parecer foi gerado.{" "}
              <button type="button" onClick={gerarOuAtualizar} className="font-medium underline">
                Atualizar o parecer
              </button>
            </p>
          )}
          <TextArea
            value={texto}
            onChange={(e) => onChange({ texto: e.target.value, estilo, automatico: valor?.automatico ?? "", revisado: false })}
            rows={linhas}
            className="text-sm leading-relaxed"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input type="checkbox" checked={valor?.revisado ?? false} onChange={(e) => onChange({ ...(valor as ParecerSalvo), revisado: e.target.checked })} />
              Revisado e aprovado por mim
            </label>
            <button type="button" onClick={gerarOuAtualizar} className="text-sm font-medium text-accent hover:underline">
              Gerar de novo
            </button>
          </div>
          <p className="text-xs text-muted">
            Rascunho de um assistente de IA: você revisa, edita e responde pelo conteúdo. Não é diagnóstico. Fica guardado e aparece no relatório técnico, identificado como assistente de IA.
          </p>
          <p className={`text-xs ${revisaoVencida() ? "text-warn" : "text-muted"}`}>
            {textoRevisao()}
            {revisaoVencida() && " A revisão está com mais de 6 meses: peça uma nova revisão da literatura à Dra. Nina antes de confiar nos cortes."}
          </p>
        </>
      )}
    </div>
  );
}

// Parecer das abas sem ficha própria (Anamnese e Perfil): fica guardado no plano
// do paciente, em "pareceres", com salvamento automático.
export function ParecerNoPlano({
  paciente,
  agente,
  gerar,
}: {
  paciente: PacienteRow;
  agente: Extract<AgenteParecer, "anamnese" | "perfil">;
  gerar?: (estilo: EstiloParecer) => string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [valor, setValor] = useState<ParecerSalvo | null>(() => lerParecer(paciente.plano?.pareceres?.[agente]));
  const funcaoGerar = useMemo(() => gerar ?? ((e: EstiloParecer) => gerarParecerAgente(agente, paciente, e)), [gerar, agente, paciente]);

  const estado = useAutoSalvar(valor, async (v: ParecerSalvo | null) => {
    if (!v) return;
    await mesclarNoPlano(supabase, paciente.id, (plano) => ({ ...plano, pareceres: { ...(plano.pareceres ?? {}), [agente]: v } }));
  });

  return (
    <div className="space-y-1">
      <PainelParecer agente={agente === "anamnese" ? "sofia" : "iris"} valor={valor} onChange={setValor} gerar={funcaoGerar} />
      <div className="px-1">
        <TextoAuto estado={estado} />
      </div>
    </div>
  );
}
