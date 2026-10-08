"use client";

// Módulo complementar do questionário do paciente (bem-estar emocional, sono,
// dor, estilo de vida) - respondido à parte do questionário base, por link.

import { useEffect, useMemo, useState } from "react";
import { Marca } from "@/components/Marca";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { anamneseVazia, mesclarComPadrao } from "@/lib/anamnese/defaults";
import type { Anamnese } from "@/lib/anamnese/types";
import { calcularAlertas } from "@/lib/anamnese/alerts";
import { Field, TextInput, StepShell } from "@/components/forms";
import { moduloPorId, type ModuloId } from "@/lib/anamnese/modulos";
import { CHAVE_IDENTIFICACAO } from "@/lib/anamnese/identificacaoSessao";
import { ModuloBemEstar, ModuloDorDetalhes, ModuloEstiloDeVida, ModuloSono, type SetAnamnese } from "@/components/paciente/modulos";

type Stage = "identificacao" | "modulo" | "concluido";

export default function ModuloPage() {
  const params = useParams<{ modulo: string }>();
  const modulo = moduloPorId(String(params?.modulo ?? ""));
  const supabase = useMemo(() => createClient(), []);

  const [stage, setStage] = useState<Stage>("identificacao");
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [statusAnamnese, setStatusAnamnese] = useState<string>("em_andamento");
  const [anamnese, setAnamnese] = useState<Anamnese>(anamneseVazia);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const set: SetAnamnese = (capitulo, patch) => {
    setAnamnese((prev) => ({ ...prev, [capitulo]: { ...prev[capitulo], ...patch } }));
  };

  async function identificarCom(n: string, d: string) {
    setErro(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_or_create_paciente", {
        p_nome: n.trim(),
        p_data_nascimento: d,
        p_telefone: null,
        p_sexo: null,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setPacienteId(row.id);
      setAnamnese(mesclarComPadrao(row.anamnese));
      setStatusAnamnese(row.anamnese_status === "concluida" ? "concluida" : "em_andamento");
      setNome(n.trim());
      setDataNascimento(d);
      setStage("modulo");
    } catch {
      setErro("Não foi possível iniciar. Verifique o nome e a data de nascimento e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Se o paciente acabou de responder o questionário base nesta aba, entra direto.
  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_IDENTIFICACAO);
      if (!salvo) return;
      const { nome: n, dataNascimento: d } = JSON.parse(salvo);
      if (n && d) {
        setNome(n);
        setDataNascimento(d);
        identificarCom(n, d);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enviar() {
    if (!pacienteId) return;
    setLoading(true);
    setErro(null);
    try {
      const { error } = await supabase.rpc("save_anamnese", {
        p_id: pacienteId,
        p_nome: nome.trim(),
        p_data_nascimento: dataNascimento,
        p_anamnese: anamnese,
        p_status: statusAnamnese,
        p_alertas: calcularAlertas(anamnese),
      });
      if (error) throw error;
      setStage("concluido");
    } catch {
      setErro("Não foi possível salvar agora. Suas respostas continuam na tela - tente enviar de novo.");
    } finally {
      setLoading(false);
    }
  }

  if (!modulo) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
          <h1 className="font-display text-2xl text-ink">Questionário não encontrado</h1>
          <p className="text-muted text-sm mt-3">Confira o link que a clínica enviou.</p>
        </div>
      </main>
    );
  }

  if (stage === "identificacao") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nome.trim().length < 3 || !dataNascimento) {
              setErro("Informe seu nome completo e sua data de nascimento.");
              return;
            }
            identificarCom(nome, dataNascimento);
          }}
          className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 space-y-5"
        >
          <div>
            <Marca compacta />
            <p className="text-xs font-semibold tracking-widest text-accent uppercase mb-2">Questionário complementar</p>
            <h1 className="font-display text-2xl text-ink">{modulo.titulo}</h1>
            <p className="text-muted text-sm mt-2 leading-relaxed">
              {modulo.descricaoPaciente} ({modulo.duracao}). Use o mesmo nome e a mesma data de nascimento do questionário principal.
            </p>
          </div>
          <Field label="Nome completo">
            <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome completo" required />
          </Field>
          <Field label="Data de nascimento">
            <TextInput type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required />
          </Field>
          {erro && <p className="text-sm text-danger">{erro}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent text-white font-medium py-3 hover:bg-accent-dark transition disabled:opacity-60"
          >
            {loading ? "Carregando..." : "Começar"}
          </button>
        </form>
      </main>
    );
  }

  if (stage === "concluido") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-dark text-2xl mb-4">
            ✓
          </span>
          <h1 className="font-display text-2xl text-ink">Obrigado(a), {nome.split(" ")[0]}!</h1>
          <p className="text-muted text-sm mt-3 leading-relaxed">
            Suas respostas foram registradas. Só a equipe da clínica tem acesso a elas. Você pode fechar esta página.
          </p>
          {modulo.id === "bem-estar" && (
            <p className="text-muted text-xs mt-4 leading-relaxed">
              Se em algum momento você sentir que precisa conversar com alguém, o CVV (Centro de Valorização da Vida) atende 24 horas, de graça, pelo telefone 188.
            </p>
          )}
        </div>
      </main>
    );
  }

  const subtitulo =
    modulo.id === "bem-estar"
      ? "Isso é só uma triagem para orientar o seu cuidado - não é diagnóstico. É opcional, e só a equipe da clínica vê as respostas."
      : modulo.descricaoPaciente;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between text-xs text-muted">
          <span>{modulo.titulo}</span>
          <span>{nome}</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <StepShell title={modulo.titulo} subtitle={subtitulo}>
            {modulo.id === ("bem-estar" as ModuloId) && <ModuloBemEstar anamnese={anamnese} set={set} />}
            {modulo.id === ("sono" as ModuloId) && <ModuloSono anamnese={anamnese} set={set} />}
            {modulo.id === ("dor" as ModuloId) && (
              <>
                {anamnese.dor.tem_dor !== true && (
                  <p className="text-sm text-muted">Este questionário é para quem sente dor. Responda só se fizer sentido para você.</p>
                )}
                <ModuloDorDetalhes anamnese={anamnese} set={set} />
              </>
            )}
            {modulo.id === ("estilo-de-vida" as ModuloId) && <ModuloEstiloDeVida anamnese={anamnese} set={set} />}
          </StepShell>

          {erro && <p className="text-sm text-danger mt-4">{erro}</p>}

          <div className="flex items-center justify-end mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={enviar}
              disabled={loading}
              className="rounded-lg bg-accent text-white font-medium px-6 py-2.5 hover:bg-accent-dark transition disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar respostas"}
            </button>
          </div>
          {modulo.id === "bem-estar" && (
            <p className="text-xs text-muted text-center mt-3">
              Se você estiver passando por um momento difícil agora, o CVV atende 24 horas, de graça, pelo telefone 188.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
