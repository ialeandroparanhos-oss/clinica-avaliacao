"use client";

// Cartão de parecer do agente, igual em todas as abas. O agente relê os dados e redige o parecer SUCINTO sozinho,
// sempre que algo muda (se o texto ainda é do sistema); o avaliador só pede o explicativo se quiser, edita e aprova.
// Texto editado à mão ou já aprovado nunca é trocado sozinho: aparece o aviso "dados novos", bem visível.

import { useEffect, useMemo, useState } from "react";
import { TextArea } from "@/components/forms";
import { createClient } from "@/lib/supabase/client";
import { gerarParecerAgente, type AgenteParecer, type EstiloParecer } from "@/lib/avaliacao/pareceres";
import { AGENTES_SISTEMA, nomeComTitulo, revisaoVencida, textoRevisao, type AgenteId } from "@/lib/agentes";
import AgenteAvatar from "./AgenteAvatar";
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
  linhas = 10,
}: {
  agente: AgenteId;
  valor: ParecerSalvo | null;
  onChange: (v: ParecerSalvo) => void;
  gerar: (estilo: EstiloParecer) => string;
  mensagemVazia?: string;
  linhas?: number;
}) {
  // O parecer automático é sempre o sucinto; o explicativo só quando o avaliador pede (e fica lembrado nesta ficha).
  const estilo: EstiloParecer = valor?.estilo ?? "sucinto";
  const texto = valor?.texto ?? "";
  const editado = texto !== "" && texto !== (valor?.automatico ?? "");
  const automaticoAtual = useMemo(() => gerar(estilo), [gerar, estilo]);
  const desatualizado = !!valor && valor.automatico !== "" && automaticoAtual !== "" && automaticoAtual !== valor.automatico;
  const nuncaGerado = !valor || (valor.texto === "" && valor.automatico === "");
  const acompanhaDados = !!valor && texto !== "" && !editado && !valor.revisado && desatualizado;

  function aplicar(novoEstilo: EstiloParecer) {
    const novo = gerar(novoEstilo);
    onChange({ texto: novo, estilo: novoEstilo, automatico: novo, revisado: false });
  }

  // Redige sozinho: na primeira vez e sempre que os dados mudam e o texto ainda é do sistema.
  useEffect(() => {
    if (automaticoAtual === "" || (!nuncaGerado && !acompanhaDados)) return;
    const t = setTimeout(() => aplicar(estilo), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [automaticoAtual, nuncaGerado, acompanhaDados, estilo]);

  function pedirEstilo(novo: EstiloParecer) {
    if (novo === estilo) return;
    if (editado && !window.confirm("Trocar o estilo substitui o texto que você editou por um novo parecer. Continuar?")) return;
    aplicar(novo);
  }

  function atualizarAgora() {
    if (editado && !window.confirm("Atualizar substitui o texto que você editou. Continuar?")) return;
    aplicar(estilo);
  }

  const aprovado = !!valor?.revisado;
  // Faixa de situação no topo do cartão: o que o avaliador precisa fazer, sem rolar a tela.
  let faixa: { tom: string; conteudo: React.ReactNode } | null = null;
  if (texto !== "") {
    if (desatualizado && (editado || aprovado)) {
      faixa = {
        tom: "border-warn bg-warn-soft text-warn",
        conteudo: (
          <>
            <strong>Dados novos</strong> desde que você {aprovado ? "aprovou" : "editou"} este parecer.
            <button type="button" onClick={atualizarAgora} className="ml-2 rounded-md bg-warn text-white font-medium px-3 py-1 text-xs">
              Atualizar o parecer
            </button>
          </>
        ),
      };
    } else if (aprovado) {
      faixa = { tom: "border-ok bg-ok-soft text-ok-dark", conteudo: <><strong>✓ Revisado e aprovado por você.</strong></> };
    } else {
      faixa = {
        tom: "border-info bg-info-soft text-info",
        conteudo: (
          <>
            <strong>Atualizado automaticamente</strong> com os dados atuais. Falta você revisar.
            <button type="button" onClick={() => onChange({ ...(valor as ParecerSalvo), revisado: true })} className="ml-2 rounded-md bg-accent text-white font-medium px-3 py-1 text-xs">
              Revisei e aprovo
            </button>
          </>
        ),
      };
    }
  }

  return (
    <div id={`parecer-${agente}`} className="rounded-2xl border border-border bg-surface p-5 space-y-3 scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AgenteAvatar id={agente} tamanho={48} titulo={`Ilustração de ${nomeComTitulo(agente)}`} />
          <div>
            <h3 className="font-display text-lg text-ink">
              Parecer {nomeComTitulo(agente)} <span className="align-middle text-xs font-sans font-medium rounded-full bg-info-soft text-info px-2 py-0.5 ml-1">assistente de IA</span>
            </h3>
            <p className="text-xs text-muted">{AGENTES_SISTEMA[agente].especialidade}</p>
          </div>
        </div>
        {texto !== "" && (
          <button type="button" onClick={() => pedirEstilo(estilo === "sucinto" ? "explicativo" : "sucinto")} className="text-sm font-medium text-accent hover:underline">
            {estilo === "sucinto" ? "Pedir parecer mais explicativo" : "Voltar ao parecer sucinto"}
          </button>
        )}
      </div>

      {faixa && <div className={`rounded-lg border px-3 py-2 text-sm ${faixa.tom}`}>{faixa.conteudo}</div>}

      {texto === "" ? (
        <div className="space-y-2">
          <p className="text-sm text-muted">{automaticoAtual === "" ? mensagemVazia : nuncaGerado ? "O agente está redigindo o parecer com os dados atuais..." : "Parecer apagado."}</p>
          {automaticoAtual !== "" && !nuncaGerado && (
            <button type="button" onClick={atualizarAgora} className="text-sm font-medium text-accent hover:underline">
              Gerar parecer
            </button>
          )}
        </div>
      ) : (
        <>
          <TextArea
            value={texto}
            onChange={(e) => onChange({ texto: e.target.value, estilo, automatico: valor?.automatico ?? "", revisado: false })}
            rows={linhas}
            className="text-sm leading-relaxed"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">Rascunho de um assistente de IA: você revisa, edita e responde pelo conteúdo. Não é diagnóstico. Aparece no relatório técnico, identificado como assistente de IA.</p>
            <button type="button" onClick={atualizarAgora} className="text-sm font-medium text-accent hover:underline">
              Gerar de novo
            </button>
          </div>
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
