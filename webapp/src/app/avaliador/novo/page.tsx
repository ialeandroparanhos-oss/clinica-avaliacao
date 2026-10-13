"use client";

// Novo paciente cadastrado pelo avaliador, para quando o paciente vai direto à clínica sem ter feito a
// anamnese antes. Cria a ficha (ou reconhece uma que já existe) e, se quiser, abre a anamnese na hora.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, TextInput } from "@/components/forms";
import { guardarSolicitacaoClinica, nomeNormalizado } from "@/lib/anamnese/clinicaSessao";

type Existente = { id: string; nome: string; anamnese_status: string };

const ROTULO_STATUS: Record<string, string> = { nao_iniciada: "anamnese não iniciada", em_andamento: "anamnese em andamento", concluida: "anamnese concluída" };

export default function NovoPaciente() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [existente, setExistente] = useState<Existente | null>(null);

  function validar(): string | null {
    if (nome.trim().length < 3) return "Digite o nome completo do paciente.";
    if (!dataNascimento) return "Informe a data de nascimento.";
    const d = new Date(dataNascimento + "T00:00:00");
    if (Number.isNaN(d.getTime()) || d.getFullYear() < 1900 || d > new Date()) return "A data de nascimento parece incorreta. Confira.";
    if (!sexo) return "Escolha o sexo: o sistema usa para os cálculos e classificações da avaliação.";
    return null;
  }

  // Procura um paciente com o mesmo nome (sem acento) e a mesma data de nascimento.
  async function procurarExistente(): Promise<Existente | null> {
    const { data, error } = await supabase.from("pacientes").select("id, nome, anamnese_status").eq("data_nascimento", dataNascimento);
    if (error) throw error;
    const alvo = nomeNormalizado(nome);
    return ((data as Existente[]) ?? []).find((p) => nomeNormalizado(p.nome) === alvo) ?? null;
  }

  function abrirAnamnese(id: string, nomePaciente: string) {
    guardarSolicitacaoClinica({ nome: nomePaciente, dataNascimento, sexo: sexo || null, telefone: telefone || null, voltarPara: `/avaliador/paciente/${id}` });
    router.push("/paciente");
  }

  async function salvar(depois: "anamnese" | "ficha") {
    setErro(null);
    setExistente(null);
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }
    setCarregando(true);
    try {
      const ja = await procurarExistente();
      if (ja) {
        setExistente(ja);
        return;
      }
      const { data, error } = await supabase.rpc("get_or_create_paciente", {
        p_nome: nome.trim(),
        p_data_nascimento: dataNascimento,
        p_telefone: telefone.trim() || null,
        p_sexo: sexo,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (depois === "anamnese") abrirAnamnese(row.id, nome.trim());
      else router.push(`/avaliador/paciente/${row.id}`);
    } catch {
      setErro("Não foi possível cadastrar agora. Confira os dados e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href="/avaliador" className="text-sm text-muted hover:text-ink">
          ← Pacientes
        </Link>
        <h1 className="font-display text-2xl text-ink mt-2">Novo paciente</h1>
        <p className="text-sm text-muted mt-1 leading-relaxed">
          Para quem vai direto à clínica, sem ter respondido a anamnese antes. Cadastre aqui e faça a anamnese com o paciente, na hora: são as mesmas perguntas que ele responderia em casa.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          salvar("anamnese");
        }}
        className="rounded-2xl border border-border bg-surface p-6 space-y-5"
      >
        <Field label="Nome completo">
          <TextInput value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo do paciente" required />
        </Field>
        <Field label="Data de nascimento">
          <TextInput type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} required />
        </Field>
        <Field label="Sexo">
          <div className="flex gap-3">
            {[
              { v: "feminino", r: "Feminino" },
              { v: "masculino", r: "Masculino" },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setSexo(o.v)}
                aria-pressed={sexo === o.v}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${sexo === o.v ? "border-accent bg-accent-soft text-accent-dark" : "border-border bg-surface text-ink hover:border-accent"}`}
              >
                {o.r}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Telefone (opcional)">
          <TextInput value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
        </Field>

        {erro && <p className="text-sm text-danger">{erro}</p>}

        {existente && (
          <div className="rounded-xl border border-warn bg-warn-soft p-4 text-sm space-y-2">
            <p className="text-ink">
              <strong>Já existe um cadastro com este nome e data de nascimento:</strong> {existente.nome} ({ROTULO_STATUS[existente.anamnese_status] ?? existente.anamnese_status}).
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href={`/avaliador/paciente/${existente.id}`} className="font-medium text-accent hover:underline">
                Abrir a ficha
              </Link>
              <button type="button" onClick={() => abrirAnamnese(existente.id, existente.nome)} className="font-medium text-accent hover:underline">
                {existente.anamnese_status === "concluida" ? "Rever a anamnese com o paciente" : "Continuar a anamnese com o paciente"}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={carregando}
            className="flex-1 rounded-lg bg-accent text-white font-medium py-3 hover:bg-accent-dark transition disabled:opacity-60"
          >
            {carregando ? "Salvando..." : "Cadastrar e fazer a anamnese agora"}
          </button>
          <button
            type="button"
            disabled={carregando}
            onClick={() => salvar("ficha")}
            className="flex-1 rounded-lg border border-border bg-surface text-ink font-medium py-3 hover:border-accent transition disabled:opacity-60"
          >
            Só cadastrar (anamnese depois)
          </button>
        </div>
      </form>
    </main>
  );
}
