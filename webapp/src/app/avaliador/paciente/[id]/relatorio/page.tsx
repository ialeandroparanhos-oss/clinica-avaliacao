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
import { escorePSS10, escoreTSK11, somaSemNulos, escoreCurto, rotuloNivel } from "@/lib/anamnese/alerts";
import { calcularPSQI } from "@/lib/anamnese/psqi";
import { calcularRiscoCardiovascular } from "@/lib/anamnese/riscoCardiovascular";
import { linhasDorPorRegiao } from "@/lib/anamnese/dorPorRegiao";
import { classificarRCEst, percentualGorduraIdealSugerido, relacaoCinturaEstatura } from "@/lib/avaliacao/composicaoCorporal";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { CAMPOS_CIRCUNFERENCIA, calcularMassaMagraRelativa, expansibilidadeToracica } from "@/lib/avaliacao/medidasRegionais";
import { paraNumero } from "@/lib/numeros";
import { mensagemTecnica } from "@/lib/avaliacao/whatsapp";
import { avaliarMobilidadeObjetiva, paresDeMobilidade } from "@/lib/avaliacao/mobilidade";
import { percentualDoPrevisto, tc6Previsto } from "@/lib/avaliacao/tc6";
import { nomeComTitulo, textoRevisao, type AgenteId } from "@/lib/agentes";
import { NOME_PROFISSIONAL } from "@/lib/marca";
import { EnvioWhatsApp } from "@/components/avaliador/EnvioWhatsApp";
import { triarSarcopeniaDinapenia } from "@/lib/integracao/sarcopenia";
import { vo2maxDeRegistro, vo2maxDeTeste, testePrincipalDoRegistro, avaliarVO2max, ROTULO_CLASSE_VO2, descreverPSE, metDeVo2, fcMaxTanaka, fcMaxFox } from "@/lib/avaliacao/cardiorrespiratoria";
import { calcularPerfilIntegrado, type Classificacao } from "@/lib/integracao/perfil";
import { HORIZONTES, HORIZONTE_LEGADO, ROTULO_CATEGORIA, itemAprovado, type Plano } from "@/lib/integracao/plano";

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

// Parecer do agente (no estilo escolhido pelo avaliador), com a marca de revisão.
// Lista de exercícios (RM submáximo / repetições até a falha), com os campos antigos como reserva.
function linhasExercicio(lista: any, ex: any, carga: any, reps: any, sufixo: string): string | null {
  const itens: { exercicio?: string; carga?: string; reps?: string }[] = Array.isArray(lista) && lista.length > 0 ? lista : [{ exercicio: ex, carga, reps }];
  const linhas = itens.filter((l) => l.carga || l.reps).map((l) => `${l.exercicio || "Exercício"}: ${l.carga || "–"}kg x ${l.reps || "–"} reps${sufixo}`);
  return linhas.length > 0 ? linhas.join("; ") : null;
}

function ParecerRelatorio({ agente, parecer }: { agente: AgenteId; parecer: { texto?: string; revisado?: boolean } | null | undefined }) {
  if (!parecer?.texto) return null;
  return (
    <div className="mt-4 rounded-lg border border-border p-3">
      <p className="text-sm font-semibold text-ink mb-1">
        Parecer {nomeComTitulo(agente)} <span className="font-normal text-muted">(assistente de IA; {parecer.revisado ? "revisado pelo avaliador" : "rascunho automático, ainda não revisado"})</span>
      </p>
      <p className="text-sm text-ink whitespace-pre-line leading-relaxed">{parecer.texto}</p>
    </div>
  );
}

const BUCKET_FOTOS_POSTURAIS = "fotos-posturais";

function FotoRelatorio({ label, path }: { label: string; path: string | null | undefined }) {
  const supabase = useMemo(() => createClient(), []);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelado = false;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from(BUCKET_FOTOS_POSTURAIS)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelado) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelado = true;
    };
  }, [path]);
  if (!path || !url) return null;
  return (
    <div className="space-y-1 break-inside-avoid">
      <img src={url} alt={label} className="h-40 w-auto rounded-lg border border-border object-cover" />
      <p className="text-xs text-muted">{label}</p>
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
  const gad2 = escoreCurto(anamnese.saude_mental.gad7);
  const phq2 = escoreCurto(anamnese.saude_mental.phq9);
  const psqi = calcularPSQI(anamnese);
  const tsk11 = escoreTSK11(anamnese.dor.tsk11);
  const pseq = somaSemNulos(anamnese.dor.pseq);
  const riscoCV = calcularRiscoCardiovascular(paciente);
  const sarcopenia = triarSarcopeniaDinapenia(paciente);
  const idadeNum = idadeEfetiva(paciente);

  const cardio = paciente.cardio ?? {};
  const vo2max = vo2maxDeRegistro(cardio);
  const avVo2 = vo2max !== null ? avaliarVO2max(vo2max, idadeNum, sexoEfetivo(paciente)) : null;
  const pseNum = paraNumero(cardio.rpe_borg);
  const pseDescricao = pseNum !== null ? descreverPSE(pseNum) : null;
  const metCardio = vo2max !== null ? metDeVo2(vo2max) : null;
  // Vários testes: uma linha por teste (o principal alimenta o restante desta seção).
  const testesCardio: any[] = Array.isArray(cardio.testes) ? cardio.testes : [];
  const principalCardio = testePrincipalDoRegistro(cardio);
  const linhasTestesCardio =
    testesCardio.length > 1
      ? testesCardio.map((t, i) => {
          const v = vo2maxDeTeste(t);
          const medido = paraNumero(t.vo2max_manual) !== null;
          const av = v !== null ? avaliarVO2max(v, idadeNum, sexoEfetivo(paciente)) : null;
          const nomes: Record<string, string> = { bruce: "Bruce", rampa: "Rampa de velocidade", cooper: "Cooper 12 min", outro: "Outro" };
          return `Teste ${i + 1}${t.data_teste ? ` (${new Date(t.data_teste + "T12:00:00").toLocaleDateString("pt-BR")})` : ""} - ${nomes[t.protocolo] ?? "protocolo não informado"}: ${
            v !== null ? `VO2máx ${medido ? v.toFixed(1) : `≈ ${Math.round(v)}`} ml/kg/min${av ? `, ${av.textoPercentil}` : ""}` : "sem VO2máx calculável"
          }${t.fc_maxima_atingida ? `, FCmáx ${t.fc_maxima_atingida} bpm` : ""}${t.rpe_borg ? `, PSE ${t.rpe_borg}` : ""}${principalCardio && t.id === principalCardio.id ? " [principal]" : ""}`;
        })
      : [];
  const fcMaxMedida = paraNumero(cardio.fc_maxima_atingida);
  const fcMaxManual = paraNumero(cardio.fc_max_manual);
  const fcMaxCardio =
    fcMaxMedida !== null
      ? fcMaxMedida
      : cardio.fc_max_metodo === "tanaka" && idadeNum !== null
        ? fcMaxTanaka(idadeNum)
        : cardio.fc_max_metodo === "fox" && idadeNum !== null
          ? fcMaxFox(idadeNum)
          : cardio.fc_max_metodo === "manual" && fcMaxManual !== null
            ? fcMaxManual
            : null;

  const circCintura = paraNumero(paciente.fisica?.circ_cintura);
  const circQuadril = paraNumero(paciente.fisica?.circ_quadril);
  const rcq = circCintura && circQuadril ? circCintura / circQuadril : null;
  const rcest = relacaoCinturaEstatura(circCintura, paraNumero(paciente.fisica?.altura_cm));
  const expansibilidade = expansibilidadeToracica(paciente.fisica ?? {});
  const linhasMagraRelativa = calcularMassaMagraRelativa(paciente.fisica ?? {});
  const circunferenciasRegistradas = CAMPOS_CIRCUNFERENCIA.filter((c) => paraNumero(paciente.fisica?.[c.chave]) !== null);

  const pesoKg = paraNumero(paciente.fisica?.peso_kg);
  const percentualGordura = paraNumero(paciente.fisica?.percentual_gordura);
  const massaGordaKg = pesoKg && percentualGordura ? (pesoKg * percentualGordura) / 100 : null;
  const massaMagraKg = pesoKg && massaGordaKg !== null ? pesoKg - massaGordaKg : null;

  const sexoNorm = sexoEfetivo(paciente);
  const mobilidadeClasse = avaliarMobilidadeObjetiva(paciente.funcional);
  const mobilidadeTexto = mobilidadeClasse.classificacao === "investigar" ? null : mobilidadeClasse.justificativa;
  const alturaCmRel = paraNumero(paciente.fisica?.altura_cm);
  const imcRel = pesoKg && alturaCmRel ? pesoKg / Math.pow(alturaCmRel / 100, 2) : null;
  const formatoTc6 = paciente.funcional?.tc6_formato;
  const previstoTc6 = !formatoTc6 || formatoTc6 === "Corredor de 30 m (padrão)" ? tc6Previsto(idadeNum, sexoNorm, imcRel) : null;
  const pctTc6 = percentualDoPrevisto(paraNumero(paciente.funcional?.tc6_metros), previstoTc6);
  const tc6Texto = previstoTc6 !== null ? `${Math.round(previstoTc6)} m${pctTc6 !== null ? ` (realizado = ${Math.round(pctTc6)}% do previsto; sem corte de classificação adotado)` : ""}` : null;
  const percentualIdealSugerido = percentualGorduraIdealSugerido(idadeNum, sexoNorm);
  const percentualIdealEfetivo = paraNumero(paciente.fisica?.percentual_gordura_ideal) ?? percentualIdealSugerido;
  const percentualExcedente = percentualGordura && percentualIdealEfetivo !== null ? percentualGordura - percentualIdealEfetivo : null;
  const gorduraExcedenteKg = pesoKg && percentualExcedente !== null ? Math.max(0, (pesoKg * percentualExcedente) / 100) : null;
  const massaMagraIdealSugerida = pesoKg && percentualIdealSugerido !== null ? pesoKg * (1 - percentualIdealSugerido / 100) : null;
  const massaMagraIdealEfetiva = paraNumero(paciente.fisica?.massa_magra_ideal_kg) ?? massaMagraIdealSugerida;
  const carenciaMuscularKg = massaMagraIdealEfetiva !== null && massaMagraKg !== null ? Math.max(0, massaMagraIdealEfetiva - massaMagraKg) : null;
  const pesoIdealKg = massaMagraKg !== null && percentualIdealEfetivo !== null && percentualIdealEfetivo < 100 ? massaMagraKg / (1 - percentualIdealEfetivo / 100) : null;
  const ROTULO_PROTOCOLO_REF: Record<string, string> = { dobras: "dobras cutâneas", bioimpedancia: "bioimpedância", media: "média dos dois", outro: "outro/externo" };

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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-6 print:hidden">
        <EnvioWhatsApp
          rotuloBotao="Enviar resumo por WhatsApp"
          rotuloTelefone="WhatsApp de quem vai receber (outro profissional, médico...)"
          mensagemInicial={() => mensagemTecnica(paciente, idadeNum)}
          aviso="Este relatório tem informação de saúde do paciente. Envie apenas a quem for autorizado a receber e confira o número antes de enviar."
        />
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 print:px-0">
        <header className="mb-8 border-b-2 border-ink pb-4">
          <p className="text-xs uppercase tracking-widest text-accent font-semibold mb-1">
            Relatório Técnico de Avaliação Integrada — uso do profissional
          </p>
          <h1 className="font-display text-2xl text-ink">{paciente.nome}</h1>
          <p className="text-sm text-muted mt-1">
            Nascimento: {new Date(paciente.data_nascimento).toLocaleDateString("pt-BR")} · Sexo: {sexoNorm === "masculino" ? "masculino" : sexoNorm === "feminino" ? "feminino" : "não informado"}{idadeNum !== null ? ` · Idade: ${idadeNum} anos` : ""}
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
            <L label="PSQI - escore global (0-21)" value={psqi ? psqi.global : anamnese.sono.qualidade_percebida ? `${anamnese.sono.qualidade_percebida}/5 (triagem simplificada, PSQI incompleto)` : null} />
            <L label="Estresse percebido (0-10)" value={anamnese.estilo_vida.estresse_percebido} />
            <L label="Dor atual" value={anamnese.dor.tem_dor === true ? (linhasDorPorRegiao(anamnese.dor).join("; ") || `NRS máx. ${anamnese.dor.intensidade_nrs ?? "–"}`) : anamnese.dor.tem_dor === false ? "Nega dor" : null} />
            <L label="TSK-11 / PSEQ" value={anamnese.dor.tem_dor === true ? `${tsk11 ?? "–"} / ${pseq ?? "–"}` : null} />
            <L
              label="PSS-10 / GAD-7 / PHQ-9"
              value={`${pss10 ?? "–"} / ${gad7 ?? (gad2 !== null ? `${gad2} (GAD-2)` : "–")} / ${phq9 ?? (phq2 !== null ? `${phq2} (PHQ-2)` : "–")}`}
            />
            <L
              label="Risco cardiovascular (triagem ACSM)"
              value={
                riscoCV
                  ? `${{ baixo: "Baixo", moderado: "Moderado", alto: "Alto" }[riscoCV.classificacao]} (${riscoCV.contagem} fator(es))`
                  : null
              }
            />
          </dl>
          <ParecerRelatorio agente="sofia" parecer={paciente.plano?.pareceres?.anamnese} />
        </Secao>

        <Secao titulo="2. Avaliação física e antropométrica">
          <dl>
            <L label="Peso / Altura" value={paciente.fisica?.peso_kg && paciente.fisica?.altura_cm ? `${paciente.fisica.peso_kg} kg / ${paciente.fisica.altura_cm} cm` : null} />
            <L label="PA" value={paciente.fisica?.pa_sistolica ? `${paciente.fisica.pa_sistolica}/${paciente.fisica.pa_diastolica} mmHg` : null} />
            <L label="FC de repouso" value={paciente.fisica?.fc_repouso ? `${paciente.fisica.fc_repouso} bpm` : null} />
            <L label="SpO2" value={paciente.fisica?.spo2 ? `${paciente.fisica.spo2}%` : null} />
            <L
              label="Circunferências registradas (cm)"
              value={
                circunferenciasRegistradas.length > 0
                  ? circunferenciasRegistradas.map((c) => `${c.rotulo}: ${paraNumero(paciente.fisica?.[c.chave])}`).join(" · ")
                  : null
              }
            />
            <L label="RCQ (calculado)" value={rcq !== null ? rcq.toFixed(2) : null} />
            <L label="RCEst - cintura/estatura (calculado)" value={rcest !== null ? `${rcest.toFixed(2)} (${classificarRCEst(rcest) === "aumentado" ? "≥ 0,5, risco aumentado" : "< 0,5"})` : null} />
            <L label="Expansibilidade torácica" value={expansibilidade !== null ? `${expansibilidade.toFixed(1)} cm` : null} />
            <L
              label="Massa magra relativa por região (cm)"
              value={
                linhasMagraRelativa.some((l) => l.corrigida !== null)
                  ? linhasMagraRelativa
                      .filter((l) => l.corrigida !== null)
                      .map((l) => `${l.regiao.rotulo}: ${(l.corrigida as number).toFixed(1)}`)
                      .join(" · ")
                  : null
              }
            />
            <L
              label="% de gordura (referência)"
              value={
                paciente.fisica?.percentual_gordura
                  ? `${paciente.fisica.percentual_gordura}%${paciente.fisica?.protocolo_referencia_gordura ? ` (${ROTULO_PROTOCOLO_REF[paciente.fisica.protocolo_referencia_gordura] ?? paciente.fisica.protocolo_referencia_gordura})` : ""}`
                  : null
              }
            />
            <L label="%G ideal / %G excedente" value={percentualIdealEfetivo !== null ? `${percentualIdealEfetivo.toFixed(1)}% / ${percentualExcedente !== null ? percentualExcedente.toFixed(1) : "–"}%` : null} />
            <L label="Massa gorda / magra (calculadas)" value={massaGordaKg !== null && massaMagraKg !== null ? `${massaGordaKg.toFixed(1)} kg / ${massaMagraKg.toFixed(1)} kg` : null} />
            <L label="Gordura excedente" value={gorduraExcedenteKg !== null ? `${gorduraExcedenteKg.toFixed(1)} kg` : null} />
            <L label="Massa magra ideal / carência muscular" value={massaMagraIdealEfetiva !== null ? `${massaMagraIdealEfetiva.toFixed(1)} kg / ${carenciaMuscularKg !== null ? carenciaMuscularKg.toFixed(1) : "–"} kg` : null} />
            <L label="Peso ideal (calculado)" value={pesoIdealKg !== null ? `${pesoIdealKg.toFixed(1)} kg` : null} />
            <L label="Observações" value={paciente.fisica?.observacoes} />
          </dl>
          <ParecerRelatorio agente="marco" parecer={paciente.fisica?.parecer} />
        </Secao>

        <Secao titulo="3. Avaliação postural e biomecânica">
          <div className="flex flex-wrap gap-4 mb-3">
            <FotoRelatorio label="Vista anterior" path={paciente.postural?.foto_anterior_path} />
            <FotoRelatorio label="Vista posterior" path={paciente.postural?.foto_posterior_path} />
            <FotoRelatorio label="Vista lateral direita" path={paciente.postural?.foto_lateral_d_path} />
            <FotoRelatorio label="Vista lateral esquerda" path={paciente.postural?.foto_lateral_e_path} />
          </div>
          <dl>
            <L label="Vista anterior" value={paciente.postural?.obs_anterior} />
            <L label="Vista posterior" value={paciente.postural?.obs_posterior} />
            <L label="Vista lateral direita" value={paciente.postural?.obs_lateral_d} />
            <L label="Vista lateral esquerda" value={paciente.postural?.obs_lateral_e} />
            <L label="Padrões de movimento" value={paciente.postural?.obs_movimento} />
          </dl>
          <ParecerRelatorio
            agente="paula"
            parecer={
              paciente.postural?.parecer ??
              (paciente.postural?.analise?.parecer ? { texto: paciente.postural.analise.parecer, revisado: paciente.postural.analise.parecer_revisado } : null)
            }
          />
        </Secao>

        <Secao titulo="4. Avaliação funcional">
          <dl>
            <L label="30s Chair Stand" value={paciente.funcional?.chair_stand_reps ? `${paciente.funcional.chair_stand_reps} repetições` : null} />
            <L label="TUG" value={paciente.funcional?.tug_seg ? `${paciente.funcional.tug_seg} s` : null} />
            <L label="Apoio unipodal D/E" value={paciente.funcional?.apoio_unipodal_d_seg ? `${paciente.funcional.apoio_unipodal_d_seg}s / ${paciente.funcional.apoio_unipodal_e_seg || "–"}s` : null} />
            <L label="Velocidade de marcha" value={paciente.funcional?.velocidade_marcha_ms ? `${paciente.funcional.velocidade_marcha_ms} m/s` : null} />
            <L
              label="TC6"
              value={
                paciente.funcional?.tc6_metros
                  ? `${paciente.funcional.tc6_metros} m${paciente.funcional.tc6_formato ? ` (${paciente.funcional.tc6_formato}${paciente.funcional.tc6_corredor_m ? `, ${paciente.funcional.tc6_corredor_m} m` : ""})` : ""}`
                  : null
              }
            />
            <L
              label="Agachamento livre (observado)"
              value={[...(Array.isArray(paciente.funcional?.agachamento_achados) ? paciente.funcional.agachamento_achados : []), paciente.funcional?.agachamento_livre_obs].filter(Boolean).join("; ") || null}
            />
            <L
              label="Estabilidade do core (observado)"
              value={[...(paciente.funcional?.core_prancha_seg ? [`prancha ${paciente.funcional.core_prancha_seg}s`] : []), ...(Array.isArray(paciente.funcional?.core_achados) ? paciente.funcional.core_achados : []), paciente.funcional?.core_estabilidade_obs].filter(Boolean).join("; ") || null}
            />
            <L label="Dinamometria D/E" value={paciente.funcional?.dinamometria_d_kg ? `${paciente.funcional.dinamometria_d_kg} / ${paciente.funcional.dinamometria_e_kg || "–"} kgf` : null} />
            <L label="Push-up test" value={paciente.funcional?.pushup_reps ? `${paciente.funcional.pushup_reps} reps` : null} />
            <L label="Arm Curl Test" value={paciente.funcional?.arm_curl_reps ? `${paciente.funcional.arm_curl_reps} reps/30s` : null} />
            <L
              label="RM submáximo (estimado)"
              value={linhasExercicio(paciente.funcional?.rm_lista, paciente.funcional?.rm_exercicio, paciente.funcional?.rm_carga_kg, paciente.funcional?.rm_repeticoes, "")}
            />
            <L
              label="Repetições até a falha (carga fixa)"
              value={linhasExercicio(paciente.funcional?.falha_lista, paciente.funcional?.falha_exercicio, paciente.funcional?.falha_carga_kg, paciente.funcional?.falha_repeticoes, " até a falha")}
            />
            <L
              label="Amplitude articular (goniometria)"
              value={
                Array.isArray(paciente.funcional?.goniometria) && paciente.funcional.goniometria.length > 0
                  ? paciente.funcional.goniometria
                      .map((g: any) => `${g.articulacao || "–"}${g.lado ? ` (${g.lado})` : ""}: ${g.graus || "–"}°`)
                      .join("; ")
                  : null
              }
            />
            <L
              label="Flexibilidade (sentar/alcançar · cadeira · back scratch D/E)"
              value={
                paciente.funcional?.sit_and_reach_cm || paciente.funcional?.chair_sit_reach_cm || paciente.funcional?.back_scratch_d_cm
                  ? `${paciente.funcional?.sit_and_reach_cm ?? "–"}cm · ${paciente.funcional?.chair_sit_reach_cm ?? "–"}cm · ${paciente.funcional?.back_scratch_d_cm ?? "–"}/${paciente.funcional?.back_scratch_e_cm ?? "–"}cm`
                  : null
              }
            />
            <L
              label="Mobilidade articular (D/E)"
              value={
                paresDeMobilidade(paciente.funcional)
                  .filter((p) => p.id.startsWith("tornozelo") || p.id.startsWith("quadril"))
                  .filter((p) => p.d !== null || p.e !== null)
                  .map((p) => `${p.rotulo}: D ${p.d ?? "–"}${p.unidade} / E ${p.e ?? "–"}${p.unidade}`)
                  .join("; ") || null
              }
            />
            <L label="Mobilidade - classificação do painel" value={mobilidadeTexto} />
            <L label="TC6 previsto (Britto 2013, informativo)" value={tc6Texto} />
            <L label="Agachamento livre - observações" value={paciente.funcional?.agachamento_livre_obs} />
            <L
              label="Estabilidade do core - prancha"
              value={paciente.funcional?.core_prancha_seg ? `${paciente.funcional.core_prancha_seg} s` : null}
            />
            <L label="Estabilidade do core - observações" value={paciente.funcional?.core_estabilidade_obs} />
            <L label="Observações" value={paciente.funcional?.observacoes} />
          </dl>
          <ParecerRelatorio agente="rita" parecer={paciente.funcional?.parecer} />
        </Secao>

        <Secao titulo="5. Avaliação cardiorrespiratória (VO2)">
          <dl>
            {linhasTestesCardio.length > 0 && <L label="Testes realizados" value={linhasTestesCardio.join(" | ")} />}
            <L
              label={linhasTestesCardio.length > 0 ? "Protocolo do teste principal" : "Protocolo"}
              value={
                cardio.protocolo
                  ? ({ bruce: "Bruce (com inclinação)", rampa: "Rampa de velocidade (sem inclinação)", cooper: "Teste de Cooper (12 min)", outro: "Outro" } as Record<string, string>)[cardio.protocolo]
                  : null
              }
            />
            <L label={paraNumero(cardio.vo2max_manual) !== null ? "VO2máx (medido)" : "VO2máx estimado"} value={vo2max !== null ? `${paraNumero(cardio.vo2max_manual) !== null ? vo2max.toFixed(1) : `≈ ${Math.round(vo2max)}`} ml/kg/min${avVo2 ? ` (${avVo2.textoPercentil} para idade/sexo, referência FRIEND de esteira: ${ROTULO_CLASSE_VO2[avVo2.classe]})` : ""}` : null} />
            <L label="MET" value={metCardio !== null ? metCardio.toFixed(1) : null} />
            <L label="vVO2máx" value={cardio.rampa_velocidade_final_kmh ? `${cardio.rampa_velocidade_final_kmh} km/h` : null} />
            <L label="FC máxima (medida/estimada)" value={fcMaxCardio !== null ? `${fcMaxCardio.toFixed(0)} bpm` : null} />
            <L label="PA pós-teste" value={cardio.pa_sistolica_pos ? `${cardio.pa_sistolica_pos}/${cardio.pa_diastolica_pos || "–"} mmHg` : null} />
            <L label="Percepção de esforço (Borg)" value={pseNum !== null ? `${pseNum}${pseDescricao ? ` - ${pseDescricao.rotulo}` : ""}` : null} />
            <L label="Observações" value={cardio.observacoes} />
          </dl>
          <ParecerRelatorio agente="caio" parecer={cardio.parecer} />
        </Secao>

        <Secao titulo="6. Painel Integrado de Saúde (10 domínios)">
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

        <Secao titulo="7. Triagem de sarcopenia/dinapenia (aproximada)">
          <p className="text-sm">
            <strong>
              {
                {
                  sarcopenia_provavel: "Sarcopenia provável",
                  dinapenia_provavel: "Dinapenia provável",
                  sem_sinais: "Sem sinais nesta triagem",
                  dados_insuficientes: "Dados insuficientes",
                }[sarcopenia.classificacao]
              }
            </strong>{" "}
            — {sarcopenia.justificativa}
          </p>
          <p className="text-xs text-muted mt-1">
            Massa muscular estimada pela panturrilha (&lt; 31 cm, a partir dos 60 anos) ou pela massa magra total (não a massa
            muscular apendicular por DXA exigida pelo EWGSOP2) - triagem, não diagnóstico.
          </p>
        </Secao>

        <Secao titulo="8. Potencialidades, limitações, riscos e prioridades">
          <p className="text-sm mb-1"><strong>Potencialidades:</strong> {perfil.potencialidades.map((d) => d.titulo).join(", ") || "nenhuma identificada"}</p>
          <p className="text-sm mb-1"><strong>Limitações:</strong> {perfil.limitacoes.map((d) => d.titulo).join(", ") || "nenhuma identificada"}</p>
          <p className="text-sm mb-1"><strong>Riscos:</strong> {perfil.riscos.map((d) => d.titulo).join(", ") || "nenhum identificado"}</p>
          <p className="text-sm"><strong>Prioridades (ordem):</strong> {perfil.prioridades.map((d) => d.titulo).join(" → ") || "nenhuma identificada"}</p>
          <ParecerRelatorio agente="iris" parecer={paciente.plano?.pareceres?.perfil} />
        </Secao>

        <Secao titulo="9. Plano de intervenção">
          {!plano || (plano.itens ?? []).filter(itemAprovado).length === 0 ? (
            <p className="text-sm text-muted">Plano ainda não elaborado (ou sem itens aprovados).</p>
          ) : (
            [...HORIZONTES, HORIZONTE_LEGADO].map((h) => {
              const itensDoHorizonte = (plano.itens ?? []).filter((i) => i.horizonte === h.chave && itemAprovado(i));
              if (itensDoHorizonte.length === 0) return null;
              return (
                <div key={h.chave} className="mb-3">
                  <p className="text-sm font-semibold text-ink">{h.titulo}</p>
                  <ul className="list-disc list-inside text-sm text-muted space-y-1">
                    {itensDoHorizonte.map((i) => (
                      <li key={i.id}>
                        {i.categoria ? <strong className="text-ink">[{ROTULO_CATEGORIA[i.categoria]}] </strong> : null}
                        {i.descricao}
                        {i.indicador ? <span className="block ml-5 text-xs">Indicador: {i.indicador}</span> : null}
                        {i.evidencia ? <span className="block ml-5 text-xs">Base: {i.evidencia.referencias.map((r) => r.rotulo).join("; ")}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
          {plano?.encaminhamentos && plano.encaminhamentos.filter(itemAprovado).length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-semibold text-ink">Encaminhamentos</p>
              <ul className="list-disc list-inside text-sm text-muted">
                {plano.encaminhamentos.filter(itemAprovado).map((e) => (
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
          <br />
          <strong>Autoria:</strong> os pareceres deste relatório foram redigidos por assistentes de IA (Dra. Sofia, Dr. Marco, Dra. Paula, Dra. Rita, Dr. Caio e Dra. Íris), que não são médicos nem profissionais registrados.
          Cada parecer indica se foi revisado. A responsabilidade pela avaliação e pelas condutas é de {NOME_PROFISSIONAL}. {textoRevisao()}
        </footer>
      </main>
    </>
  );
}
