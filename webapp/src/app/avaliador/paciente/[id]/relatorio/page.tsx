"use client";

// Agente 8 — Relatório Técnico (Seção 3 de 07-Agente8-Relatorio-e-Devolutiva.md)
// Documento de uso do profissional / prontuário. A conversa de devolutiva
// com o paciente segue o roteiro RECONHECER -> MOSTRAR -> EXPLICAR ->
// PRIORIZAR -> PROJETAR -> PLANEJAR usando este material como base -
// nunca é lido ao paciente literalmente.

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import type { PacienteRow } from "@/lib/anamnese/types";
import { escorePSS10, somaSemNulos, rotuloNivel } from "@/lib/anamnese/alerts";
import { calcularPerfilIntegrado, type Classificacao } from "@/lib/integracao/perfil";
import { HORIZONTES, type Plano } from "@/lib/integracao/plano";

const ROTULO_CLASSIFICACAO: Record<Classificacao, string> = {
  adequado: "Adequado",
  atencao: "Atenção",
  prioridade: "Prioridade de intervenção",
  investigar: "Necessita investigação adicional",
};

function L({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="grid grid-cols-3 gap-2 py-1 text-sm">
      <dt className="text-muted col-span-1">{label}</dt>
      <dd className="col-span-2 text-ink">{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="font-display text-lg text-ink border-b border-border pb-1 mb-2">{titulo}</h2>
      {children}
    </section>
  );
}

export default function RelatorioTecnico() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [paciente, setPaciente] = useState<PacienteRow | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    supabase
      .from("pacientes")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setPaciente(data as PacienteRow);
        setCarregando(false);
      });
  }, [id]);

  if (carregando) return <main className="max-w-3xl mx-auto px-6 py-10 text-muted text-sm">Carregando...</main>;
  if (!paciente) return <main className="max-w-3xl mx-auto px-6 py-10 text-danger text-sm">Paciente não encontrado.</main>;

  const anamnese = mesclarComPadrao(paciente.anamnese);
  const perfil = calcularPerfilIntegrado(paciente);
  const plano = paciente.plano as Plano | undefined;
  const pss10 = escorePSS10(anamnese.saude_mental.pss10);
  const gad7 = somaSemNulos(anamnese.saude_mental.gad7);
  const phq9 = somaSemNulos(anamnese.saude_mental.phq9);

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 print:hidden flex items-center justify-between">
        <Link href={`/avaliador/paciente/${paciente.id}`} className="text-sm text-muted hover:text-ink">
          ← Voltar à ficha
        </Link>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-accent text-white font-medium px-5 py-2 text-sm hover:bg-accent-dark transition"
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 print:px-0">
        <header className="mb-8 border-b-2 border-ink pb-4">
          <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">
            Relatório Técnico de Avaliação Integrada — uso do profissional
          </p>
          <h1 className="font-display text-2xl text-ink">{paciente.nome}</h1>
          <p className="text-sm text-muted mt-1">
            Nascimento: {new Date(paciente.data_nascimento).toLocaleDateString("pt-BR")} · Sexo: {paciente.sexo || "não informado"}
          </p>
          <p className="text-xs text-muted mt-2">
            Gerado em {new Date().toLocaleString("pt-BR")} · Confiança do Perfil Integrado:{" "}
            <strong>{{ alta: "Alta", media: "Média", baixa: "Baixa" }[perfil.confianca]}</strong>
          </p>
        </header>

        {paciente.alertas?.length > 0 && (
          <Secao titulo="Alertas emitidos">
            <ul className="space-y-1 text-sm">
              {paciente.alertas
                .slice()
                .sort((a, b) => b.nivel - a.nivel)
                .map((a, i) => (
                  <li key={i}>
                    <strong>
                      Nível {a.nivel} · {rotuloNivel[a.nivel]}
                    </strong>{" "}
                    — {a.descricao} <span className="text-muted">({a.origem})</span>
                  </li>
                ))}
            </ul>
          </Secao>
        )}

        <Secao titulo="1. Resumo da anamnese">
          <dl>
            <L label="Motivo da procura" value={anamnese.motivo.motivo_procura} />
            <L label="Queixa principal" value={anamnese.motivo.queixa_principal} />
            <L label="Objetivos" value={anamnese.motivo.objetivos} />
            <L label="Histórico de saúde" value={anamnese.historico_saude.doencas} />
            <L label="Queda em 12 meses" value={anamnese.historico_saude.quedas_12m === true ? "Sim" : anamnese.historico_saude.quedas_12m === false ? "Não" : null} />
            <L label="Atividade física atual" value={anamnese.atividade_fisica.pratica_atual === true ? anamnese.atividade_fisica.modalidades || "Sim" : anamnese.atividade_fisica.pratica_atual === false ? "Sedentário(a)" : null} />
            <L label="Qualidade do sono (1-5)" value={anamnese.sono.qualidade_percebida} />
            <L label="Estresse percebido (0-10)" value={anamnese.estilo_vida.estresse_percebido} />
            <L label="Dor atual" value={anamnese.dor.tem_dor === true ? `${anamnese.dor.localizacoes.join(", ")} (NRS ${anamnese.dor.intensidade_nrs ?? "–"})` : anamnese.dor.tem_dor === false ? "Nega dor" : null} />
            <L label="PSS-10 / GAD-7 / PHQ-9" value={`${pss10 ?? "–"} / ${gad7 ?? "–"} / ${phq9 ?? "–"}`} />
          </dl>
        </Secao>

        <Secao titulo="2. Avaliação física e antropométrica">
          <dl>
            <L label="Peso / Altura" value={paciente.fisica?.peso_kg && paciente.fisica?.altura_cm ? `${paciente.fisica.peso_kg} kg / ${paciente.fisica.altura_cm} cm` : null} />
            <L label="PA" value={paciente.fisica?.pa_sistolica ? `${paciente.fisica.pa_sistolica}/${paciente.fisica.pa_diastolica} mmHg` : null} />
            <L label="FC de repouso" value={paciente.fisica?.fc_repouso ? `${paciente.fisica.fc_repouso} bpm` : null} />
            <L label="SpO2" value={paciente.fisica?.spo2 ? `${paciente.fisica.spo2}%` : null} />
            <L label="Circ. cintura / quadril" value={paciente.fisica?.circ_cintura ? `${paciente.fisica.circ_cintura} / ${paciente.fisica.circ_quadril || "–"} cm` : null} />
            <L label="Composição corporal" value={paciente.fisica?.percentual_gordura ? `${paciente.fisica.percentual_gordura}% gordura (${paciente.fisica.metodo_composicao || "método não informado"})` : null} />
            <L label="Observações" value={paciente.fisica?.observacoes} />
          </dl>
        </Secao>

        <Secao titulo="3. Avaliação postural e biomecânica">
          <dl>
            <L label="Vista anterior" value={paciente.postural?.obs_anterior} />
            <L label="Vista posterior" value={paciente.postural?.obs_posterior} />
            <L label="Vista lateral direita" value={paciente.postural?.obs_lateral_d} />
            <L label="Vista lateral esquerda" value={paciente.postural?.obs_lateral_e} />
            <L label="Padrões de movimento" value={paciente.postural?.obs_movimento} />
          </dl>
        </Secao>

        <Secao titulo="4. Avaliação funcional">
          <dl>
            <L label="30s Chair Stand" value={paciente.funcional?.chair_stand_reps ? `${paciente.funcional.chair_stand_reps} repetições` : null} />
            <L label="TUG" value={paciente.funcional?.tug_seg ? `${paciente.funcional.tug_seg} s` : null} />
            <L label="Apoio unipodal D/E" value={paciente.funcional?.apoio_unipodal_d_seg ? `${paciente.funcional.apoio_unipodal_d_seg}s / ${paciente.funcional.apoio_unipodal_e_seg || "–"}s` : null} />
            <L label="Velocidade de marcha" value={paciente.funcional?.velocidade_marcha_ms ? `${paciente.funcional.velocidade_marcha_ms} m/s` : null} />
            <L label="TC6" value={paciente.funcional?.tc6_metros ? `${paciente.funcional.tc6_metros} m` : null} />
            <L label="Dinamometria D/E" value={paciente.funcional?.dinamometria_d_kg ? `${paciente.funcional.dinamometria_d_kg} / ${paciente.funcional.dinamometria_e_kg || "–"} kgf` : null} />
            <L label="Observações" value={paciente.funcional?.observacoes} />
          </dl>
        </Secao>

        <Secao titulo="5. Painel Integrado de Saúde (10 domínios)">
          <table className="w-full text-sm border-collapse">
            <tbody>
              {perfil.dominios.map((d) => (
                <tr key={d.chave} className="border-b border-border">
                  <td className="py-1.5 pr-3 font-medium text-ink whitespace-nowrap align-top">{d.titulo}</td>
                  <td className="py-1.5 pr-3 whitespace-nowrap align-top">{ROTULO_CLASSIFICACAO[d.classificacao]}</td>
                  <td className="py-1.5 text-muted align-top">{d.justificativa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Secao>

        <Secao titulo="6. Potencialidades, limitações, riscos e prioridades">
          <p className="text-sm mb-1"><strong>Potencialidades:</strong> {perfil.potencialidades.map((d) => d.titulo).join(", ") || "nenhuma identificada"}</p>
          <p className="text-sm mb-1"><strong>Limitações:</strong> {perfil.limitacoes.map((d) => d.titulo).join(", ") || "nenhuma identificada"}</p>
          <p className="text-sm mb-1"><strong>Riscos:</strong> {perfil.riscos.map((d) => d.titulo).join(", ") || "nenhum identificado"}</p>
          <p className="text-sm"><strong>Prioridades (ordem):</strong> {perfil.prioridades.map((d) => d.titulo).join(" → ") || "nenhuma identificada"}</p>
        </Secao>

        <Secao titulo="7. Plano de intervenção">
          {!plano || (plano.itens ?? []).length === 0 ? (
            <p className="text-sm text-muted">Plano ainda não elaborado.</p>
          ) : (
            HORIZONTES.map((h) => {
              const itensDoHorizonte = (plano.itens ?? []).filter((i) => i.horizonte === h.chave);
              if (itensDoHorizonte.length === 0) return null;
              return (
                <div key={h.chave} className="mb-3">
                  <p className="text-sm font-semibold text-ink">{h.titulo}</p>
                  <ul className="list-disc list-inside text-sm text-muted">
                    {itensDoHorizonte.map((i) => (
                      <li key={i.id}>{i.descricao}</li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
          {plano?.encaminhamentos && plano.encaminhamentos.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-ink">Encaminhamentos sugeridos</p>
              <ul className="list-disc list-inside text-sm text-muted">
                {plano.encaminhamentos.map((e) => (
                  <li key={e.id}>
                    {e.especialidade} — {e.motivo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Secao>

        <footer className="text-xs text-muted mt-10 pt-4 border-t border-border">
          Documento gerado automaticamente a partir dos dados registrados na avaliação. Não constitui diagnóstico
          médico, psicológico ou psiquiátrico. Toda conduta é de responsabilidade do profissional que assina o
          atendimento.
        </footer>
      </main>
    </>
  );
}
