"use client";

// Aba Avaliação Funcional (Agente 5 - Rita).

import { useMemo, useState } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { Field, TextArea, TextInput } from "@/components/forms";
import { NumField, SalvarBar, Selo, ValorCalculado, useAutoSalvar, useSalvarSecao, type TomSelo } from "./campos";
import { PainelParecer, lerParecer, type ParecerSalvo } from "./PainelParecer";
import { gerarParecerAgente, type EstiloParecer } from "@/lib/avaliacao/pareceres";
import { RotuloComInfo } from "./instrucoes";
import { EscolhaMultipla, EscolhaUnica } from "./cliques";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { avaliarForca, corteDinamometriaKgf, limite5stsPorIdade, limitesRikli } from "@/lib/avaliacao/forca";
import { paraNumero } from "@/lib/numeros";
import { calcularTagsPerfil, gruposRecomendados, ROTULOS_GRUPO, type GrupoTesteFuncional } from "@/lib/integracao/tagsPerfil";
import { avaliarMobilidadeObjetiva, diferencaEntreLados, LIMITE_ASSIMETRIA_GRAUS, paresDeMobilidade } from "@/lib/avaliacao/mobilidade";
import { percentualDoPrevisto, tc6Previsto } from "@/lib/avaliacao/tc6";

const TOM_CLASSIFICACAO: Record<"adequado" | "atencao" | "prioridade" | "investigar", TomSelo> = {
  adequado: "ok",
  atencao: "atencao",
  prioridade: "alerta",
  investigar: "neutro",
};
const ROTULO_CLASSIFICACAO: Record<"adequado" | "atencao" | "prioridade" | "investigar", string> = {
  adequado: "Adequado",
  atencao: "Atenção",
  prioridade: "Prioridade",
  investigar: "Investigar",
};

// Opções clicáveis (mais rápido que digitar); as anotações livres continuam ao lado.
const EXERCICIOS_MUSCULACAO = [
  "Supino reto",
  "Leg press",
  "Agachamento",
  "Remada",
  "Puxada na frente",
  "Cadeira extensora",
  "Mesa flexora",
  "Desenvolvimento",
  "Rosca direta",
  "Levantamento terra",
];

const MOVIMENTOS_GONIOMETRIA = [
  "Flexão de ombro",
  "Extensão de ombro",
  "Abdução de ombro",
  "Rotação interna de ombro",
  "Rotação externa de ombro",
  "Flexão de cotovelo",
  "Extensão de cotovelo",
  "Flexão de quadril",
  "Extensão de quadril",
  "Abdução de quadril",
  "Rotação interna de quadril",
  "Rotação externa de quadril",
  "Flexão de joelho",
  "Extensão de joelho",
  "Dorsiflexão de tornozelo",
  "Flexão plantar de tornozelo",
  "Flexão de coluna cervical",
  "Rotação de coluna cervical",
];

const ACHADOS_AGACHAMENTO = [
  "Profundidade completa",
  "Profundidade limitada",
  "Valgo dinâmico D",
  "Valgo dinâmico E",
  "Varo de joelho",
  "Inclinação anterior do tronco",
  "Calcanhares saem do chão",
  "Compensação lombar",
  "Desvio de carga para um lado",
  "Pés rodam para fora",
  "Dor durante o movimento",
  "Sem compensações",
];

const ACHADOS_CORE = [
  "Mantém o alinhamento",
  "Quadril cai (lombar em extensão)",
  "Quadril sobe",
  "Quadril roda para um lado",
  "Escápulas aladas",
  "Ombros elevados (encolhidos)",
  "Cabeça projetada à frente",
  "Cotovelos abrem ou desalinham",
  "Joelhos dobram",
  "Prende a respiração",
  "Tremor excessivo",
  "Oscila ou balança o corpo",
  "Dor lombar",
  "Dor no ombro ou no punho",
  "Interrompeu por fadiga",
  "Interrompeu por dor",
];

const POSICOES_QUADRIL = ["Deitado de bruços (prono)", "Sentado"];

const FORMATOS_TC6 = ["Corredor de 30 m (padrão)", "Corredor mais curto", "Esteira (autoajustada)"];

type LinhaGoniometria = { id: string; articulacao: string; lado: string; graus: string };
// Um exercício do RM submáximo ou das repetições até a falha (pode haver vários).
type LinhaExercicio = { id: string; exercicio: string; carga: string; reps: string };

function linhasIniciais(lista: any, legado: { exercicio?: string; carga?: string; reps?: string }): LinhaExercicio[] {
  if (Array.isArray(lista) && lista.length > 0) {
    return lista.map((l: any) => ({ id: l.id ?? novoIdLocal(), exercicio: String(l.exercicio ?? ""), carga: String(l.carga ?? ""), reps: String(l.reps ?? "") }));
  }
  if (legado.exercicio || legado.carga || legado.reps) {
    return [{ id: novoIdLocal(), exercicio: legado.exercicio ?? "", carga: legado.carga ?? "", reps: legado.reps ?? "" }];
  }
  return [{ id: novoIdLocal(), exercicio: "", carga: "", reps: "" }];
}

// Classe de uma seção inteira de teste: realce amarelo quando sugerida pela idade/perfil.
function secaoClasse(sugerida: boolean): string {
  return sugerida ? "rounded-xl border-2 border-amber-300 bg-amber-100/60 p-4" : "pt-4 border-t border-border";
}

// Realce amarelo dos testes sugeridos pela idade e pelo perfil (todos continuam disponíveis).
function Sugerido({ ativo, children, className = "" }: { ativo: boolean; children: React.ReactNode; className?: string }) {
  if (!ativo) return <div className={className}>{children}</div>;
  return (
    <div className={`rounded-xl border-2 border-amber-300 bg-amber-100/70 p-2.5 ${className}`} title="Sugerido pela idade e pelo perfil deste paciente">
      {children}
    </div>
  );
}

function novoIdLocal(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Estimativa de 1RM pela fórmula de Brzycki - referência de campo comumente
// usada, válida sobretudo até ~10 repetições; é uma estimativa, nunca um
// valor medido diretamente.
function estimarRM(cargaKg: string, repeticoes: string): string | null {
  const carga = Number(cargaKg);
  const reps = Number(repeticoes);
  if (!carga || !reps || reps <= 0 || reps >= 37) return null;
  const rm = (carga * 36) / (37 - reps);
  return rm.toFixed(1);
}


// Vários exercícios no mesmo teste (RM submáximo ou repetições até a falha).
function ListaExercicios({
  linhas,
  onChange,
  rotuloCarga,
  rotuloReps,
  mostrarRM = false,
}: {
  linhas: LinhaExercicio[];
  onChange: (l: LinhaExercicio[]) => void;
  rotuloCarga: string;
  rotuloReps: string;
  mostrarRM?: boolean;
}) {
  const atualizar = (id: string, patch: Partial<LinhaExercicio>) => onChange(linhas.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  return (
    <div className="space-y-3">
      {linhas.map((l, i) => {
        const rm = mostrarRM ? estimarRM(l.carga, l.reps) : null;
        return (
          <div key={l.id} className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Field label={`Exercício ${linhas.length > 1 ? i + 1 : ""}`.trim()}>
                  <EscolhaUnica opcoes={EXERCICIOS_MUSCULACAO} valor={l.exercicio} onChange={(v) => atualizar(l.id, { exercicio: v })} permitirOutro placeholderOutro="Qual exercício?" />
                </Field>
              </div>
              {linhas.length > 1 && (
                <button type="button" onClick={() => onChange(linhas.filter((x) => x.id !== l.id))} className="text-xs text-muted hover:text-danger shrink-0">
                  remover
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <NumField label={rotuloCarga} suffix="kg" value={l.carga} onChange={(v) => atualizar(l.id, { carga: v })} />
              <NumField label={rotuloReps} value={l.reps} onChange={(v) => atualizar(l.id, { reps: v })} />
              {mostrarRM && (
                <Field label="1RM estimado">
                  <div className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[15px] font-mono tabular-nums">{rm ? `${rm} kg` : "–"}</div>
                </Field>
              )}
            </div>
          </div>
        );
      })}
      <button type="button" onClick={() => onChange([...linhas, { id: novoIdLocal(), exercicio: "", carga: "", reps: "" }])} className="text-sm font-medium text-accent hover:underline">
        + Adicionar outro exercício
      </button>
    </div>
  );
}

function PainelRecomendacaoTestes({ paciente }: { paciente: PacienteRow }) {
  const tags = useMemo(() => calcularTagsPerfil(paciente), [paciente]);
  const recomendados = useMemo(() => gruposRecomendados(tags), [tags]);
  const grupos = Object.entries(recomendados) as [GrupoTesteFuncional, string[]][];

  if (tags.length === 0) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm space-y-2">
      <p className="text-ink">
        <span className="font-medium">Perfil deste paciente (anamnese): </span>
        {tags.map((t) => t.rotulo).join(" · ")}
      </p>
      {grupos.length > 0 && (
        <div>
          <p className="text-muted mb-1">Com base nisso, a Dra. Rita sugere priorizar:</p>
          <ul className="list-disc list-inside space-y-0.5 text-ink">
            {grupos.map(([grupo, motivos]) => (
              <li key={grupo}>
                <span className="font-medium">{ROTULOS_GRUPO[grupo]}</span>
                <span className="text-muted"> — {motivos.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted flex items-center gap-2">
        <span className="inline-block h-3.5 w-6 rounded border-2 border-amber-300 bg-amber-100" aria-hidden />
        Em amarelo: testes sugeridos pela idade e pelo perfil. É só uma sugestão de ênfase: todos os testes continuam disponíveis.
      </p>
    </div>
  );
}

export function AbaFuncional({ pacienteId, dados, paciente, onSalvo }: { pacienteId: string; dados: any; paciente: PacienteRow; onSalvo: () => void }) {
  const [d, setD] = useState<Record<string, string>>({
    chair_stand_reps: dados?.chair_stand_reps ?? "",
    five_sts_seg: dados?.five_sts_seg ?? "",
    tug_seg: dados?.tug_seg ?? "",
    apoio_unipodal_d_seg: dados?.apoio_unipodal_d_seg ?? "",
    apoio_unipodal_e_seg: dados?.apoio_unipodal_e_seg ?? "",
    velocidade_marcha_ms: dados?.velocidade_marcha_ms ?? "",
    marcha_distancia_m: dados?.marcha_distancia_m ?? "",
    marcha_tempo_s: dados?.marcha_tempo_s ?? "",
    tc6_metros: dados?.tc6_metros ?? "",
    tc6_formato: dados?.tc6_formato ?? "",
    tc6_corredor_m: dados?.tc6_corredor_m ?? "",
    dinamometria_d_kg: dados?.dinamometria_d_kg ?? "",
    dinamometria_e_kg: dados?.dinamometria_e_kg ?? "",
    pushup_reps: dados?.pushup_reps ?? "",
    arm_curl_reps: dados?.arm_curl_reps ?? "",
    mob_tornozelo_wblt_d_cm: dados?.mob_tornozelo_wblt_d_cm ?? "",
    mob_tornozelo_wblt_e_cm: dados?.mob_tornozelo_wblt_e_cm ?? "",
    mob_tornozelo_df_d_graus: dados?.mob_tornozelo_df_d_graus ?? "",
    mob_tornozelo_df_e_graus: dados?.mob_tornozelo_df_e_graus ?? "",
    mob_quadril_posicao: dados?.mob_quadril_posicao ?? "",
    mob_quadril_ri_d_graus: dados?.mob_quadril_ri_d_graus ?? "",
    mob_quadril_ri_e_graus: dados?.mob_quadril_ri_e_graus ?? "",
    mob_quadril_re_d_graus: dados?.mob_quadril_re_d_graus ?? "",
    mob_quadril_re_e_graus: dados?.mob_quadril_re_e_graus ?? "",
    agachamento_livre_obs: dados?.agachamento_livre_obs ?? "",
    core_prancha_seg: dados?.core_prancha_seg ?? "",
    core_estabilidade_obs: dados?.core_estabilidade_obs ?? "",
    sit_and_reach_cm: dados?.sit_and_reach_cm ?? "",
    chair_sit_reach_cm: dados?.chair_sit_reach_cm ?? "",
    back_scratch_d_cm: dados?.back_scratch_d_cm ?? "",
    back_scratch_e_cm: dados?.back_scratch_e_cm ?? "",
    observacoes: dados?.observacoes ?? "",
  });
  const [goniometria, setGoniometria] = useState<LinhaGoniometria[]>(dados?.goniometria ?? []);
  const [rmLista, setRmLista] = useState<LinhaExercicio[]>(() => linhasIniciais(dados?.rm_lista, { exercicio: dados?.rm_exercicio, carga: dados?.rm_carga_kg, reps: dados?.rm_repeticoes }));
  const [falhaLista, setFalhaLista] = useState<LinhaExercicio[]>(() => linhasIniciais(dados?.falha_lista, { exercicio: dados?.falha_exercicio, carga: dados?.falha_carga_kg, reps: dados?.falha_repeticoes }));
  const [achadosAgachamento, setAchadosAgachamento] = useState<string[]>(Array.isArray(dados?.agachamento_achados) ? dados.agachamento_achados : []);
  const [achadosCore, setAchadosCore] = useState<string[]>(Array.isArray(dados?.core_achados) ? dados.core_achados : []);
  const [parecer, setParecer] = useState<ParecerSalvo | null>(() => lerParecer(dados?.parecer));
  const { salvar, salvando, ok, rascunho } = useSalvarSecao(pacienteId, "funcional");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));


  const distanciaMarcha = paraNumero(d.marcha_distancia_m);
  const tempoMarcha = paraNumero(d.marcha_tempo_s);
  const marchaPorCalculo = distanciaMarcha !== null && distanciaMarcha > 0 && tempoMarcha !== null && tempoMarcha > 0;
  const velocidadeMarcha = marchaPorCalculo ? distanciaMarcha / tempoMarcha : paraNumero(d.velocidade_marcha_ms);
  const seloMarcha =
    velocidadeMarcha === null
      ? null
      : velocidadeMarcha <= 0.8
        ? { tom: "alerta" as TomSelo, texto: "0,8 m/s ou menos (corte EWGSOP2)" }
        : velocidadeMarcha < 1.0
          ? { tom: "atencao" as TomSelo, texto: "Entre 0,8 e 1,0 m/s" }
          : { tom: "ok" as TomSelo, texto: "1,0 m/s ou mais" };

  const idadeAtual = idadeEfetiva(paciente);
  const sexoAtual = sexoEfetivo(paciente);
  const tagsPerfil = useMemo(() => calcularTagsPerfil(paciente), [paciente]);
  const rec = useMemo(() => gruposRecomendados(tagsPerfil), [tagsPerfil]);

  // TC6 previsto (só com corredor padrão de 30 m e IMC conhecido).
  const pesoFis = paraNumero(paciente.fisica?.peso_kg);
  const alturaFis = paraNumero(paciente.fisica?.altura_cm);
  const imcFis = pesoFis && alturaFis ? pesoFis / Math.pow(alturaFis / 100, 2) : null;
  const previstoTc6 = d.tc6_formato === "" || d.tc6_formato === "Corredor de 30 m (padrão)" ? tc6Previsto(idadeAtual, sexoAtual, imcFis) : null;
  const tc6Info = previstoTc6 !== null && imcFis !== null ? { previsto: previstoTc6, imc: imcFis, percentual: percentualDoPrevisto(paraNumero(d.tc6_metros), previstoTc6) } : null;
  const mobilidade = avaliarMobilidadeObjetiva({ ...d, goniometria, agachamento_achados: achadosAgachamento });
  const paresMob = paresDeMobilidade({ ...d, goniometria });
  const limitesForca = limitesRikli(idadeAtual, sexoAtual);
  const dinaD = paraNumero(d.dinamometria_d_kg);
  const dinaE = paraNumero(d.dinamometria_e_kg);
  const corteDina = corteDinamometriaKgf(idadeAtual, sexoAtual);
  const limite5sts = limite5stsPorIdade(idadeAtual);
  const forcaResultado = avaliarForca({
    dinamometriaKgf: dinaD !== null && dinaE !== null ? Math.max(dinaD, dinaE) : dinaD ?? dinaE,
    fiveStsSeg: paraNumero(d.five_sts_seg),
    chairReps: paraNumero(d.chair_stand_reps),
    armCurlReps: paraNumero(d.arm_curl_reps),
    idade: idadeAtual,
    sexo: sexoAtual,
  });

  // Grava a velocidade calculada em velocidade_marcha_ms (o campo que o painel
  // integrado e o histórico já leem). Se distância/tempo foram apagados, não
  // deixa um valor antigo para trás.
  function dadosParaSalvar() {
    let velocidade = d.velocidade_marcha_ms;
    if (marchaPorCalculo) velocidade = (distanciaMarcha / tempoMarcha).toFixed(2);
    else if (d.marcha_distancia_m || d.marcha_tempo_s) velocidade = "";
    return {
      ...d,
      // Listas (vários exercícios). O primeiro exercício preenchido também vai nos campos
      // antigos, que o histórico e os registros anteriores ainda leem.
      rm_lista: rmLista.map((l) => ({ ...l, exercicio: l.exercicio.trim() })),
      falha_lista: falhaLista.map((l) => ({ ...l, exercicio: l.exercicio.trim() })),
      rm_exercicio: (rmLista.find((l) => l.carga || l.reps)?.exercicio ?? "").trim(),
      rm_carga_kg: rmLista.find((l) => l.carga || l.reps)?.carga ?? "",
      rm_repeticoes: rmLista.find((l) => l.carga || l.reps)?.reps ?? "",
      falha_exercicio: (falhaLista.find((l) => l.carga || l.reps)?.exercicio ?? "").trim(),
      falha_carga_kg: falhaLista.find((l) => l.carga || l.reps)?.carga ?? "",
      falha_repeticoes: falhaLista.find((l) => l.carga || l.reps)?.reps ?? "",
      velocidade_marcha_ms: velocidade,
      goniometria: goniometria.map((l) => ({ ...l, articulacao: l.articulacao.trim() })),
      agachamento_achados: achadosAgachamento,
      core_achados: achadosCore,
      parecer,
    };
  }
  const dadosAtuais = dadosParaSalvar();
  const estadoAuto = useAutoSalvar(dadosAtuais, rascunho);
  const gerarParecerFuncional = (estilo: EstiloParecer) => gerarParecerAgente("funcional", { ...paciente, funcional: { ...dadosAtuais, parecer: undefined } }, estilo);

  function adicionarGoniometria() {
    setGoniometria((prev) => [...prev, { id: novoIdLocal(), articulacao: "", lado: "", graus: "" }]);
  }
  function atualizarGoniometria(id: string, patch: Partial<LinhaGoniometria>) {
    setGoniometria((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function removerGoniometria(id: string) {
    setGoniometria((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
      <PainelRecomendacaoTestes paciente={paciente} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Sugerido ativo={!!rec.chair_stand_5sts}>
          <NumField label={<RotuloComInfo texto="Chair Stand" chave="chair_stand" />} suffix="reps/30s" value={d.chair_stand_reps} onChange={(v) => set("chair_stand_reps", v)} />
        </Sugerido>
        <Sugerido ativo={!!rec.chair_stand_5sts}>
          <NumField label={<RotuloComInfo texto="5x Sit-to-Stand" chave="five_sts" />} suffix="s" value={d.five_sts_seg} onChange={(v) => set("five_sts_seg", v)} />
        </Sugerido>
        <Sugerido ativo={!!rec.tug}>
          <NumField label={<RotuloComInfo texto="TUG" chave="tug" />} suffix="s" value={d.tug_seg} onChange={(v) => set("tug_seg", v)} />
        </Sugerido>
        <Sugerido ativo={!!rec.apoio_unipodal}>
          <NumField label={<RotuloComInfo texto="Apoio unipodal D" chave="apoio_unipodal" />} suffix="s" value={d.apoio_unipodal_d_seg} onChange={(v) => set("apoio_unipodal_d_seg", v)} />
        </Sugerido>
        <Sugerido ativo={!!rec.apoio_unipodal}>
          <NumField label={<RotuloComInfo texto="Apoio unipodal E" chave="apoio_unipodal" />} suffix="s" value={d.apoio_unipodal_e_seg} onChange={(v) => set("apoio_unipodal_e_seg", v)} />
        </Sugerido>
        <Sugerido ativo={!!rec.tc6}>
          <NumField label={<RotuloComInfo texto="TC6" chave="tc6" />} suffix="m" value={d.tc6_metros} onChange={(v) => set("tc6_metros", v)} />
        </Sugerido>
        <Sugerido ativo={!!rec.dinamometria}>
          <NumField label={<RotuloComInfo texto="Dinamometria D" chave="dinamometria" />} suffix="kgf" value={d.dinamometria_d_kg} onChange={(v) => set("dinamometria_d_kg", v)} />
        </Sugerido>
        <Sugerido ativo={!!rec.dinamometria}>
          <NumField label={<RotuloComInfo texto="Dinamometria E" chave="dinamometria" />} suffix="kgf" value={d.dinamometria_e_kg} onChange={(v) => set("dinamometria_e_kg", v)} />
        </Sugerido>
      </div>

      <div className="rounded-xl border border-border bg-bg p-4 space-y-2">
        <p className="text-sm font-medium text-ink">Como o TC6 foi realizado?</p>
        <EscolhaUnica opcoes={FORMATOS_TC6} valor={d.tc6_formato} onChange={(v) => set("tc6_formato", v)} />
        {d.tc6_formato === "Corredor mais curto" && (
          <div className="max-w-[10rem]">
            <NumField label="Comprimento do corredor" suffix="m" value={d.tc6_corredor_m} onChange={(v) => set("tc6_corredor_m", v)} />
          </div>
        )}
        {(d.tc6_formato === "Corredor mais curto" || d.tc6_formato === "Esteira (autoajustada)") && (
          <p className="text-xs text-warn leading-relaxed">
            {d.tc6_formato === "Esteira (autoajustada)"
              ? "A esteira de ritmo externo não é recomendada para o TC6 (distâncias bem menores); esteira autoajustada (o paciente controla a velocidade) dá valores em geral mais baixos que o corredor e não tem referência validada aqui. "
              : "Corredor menor que 30 m reduz a distância por causa das viradas (em estudo, ~43 m a menos em 15 m e ~93 m a menos em 10 m). "}
            Não compare a distância com valores previstos (que valem para o corredor de 30 m); use-a só para acompanhar o próprio paciente, sempre no mesmo formato.
          </p>
        )}
      </div>

      {tc6Info && (
        <div className="rounded-xl border border-border bg-bg p-4 text-sm space-y-1">
          <p className="text-ink">
            <strong>TC6 previsto (população brasileira, Britto 2013):</strong> {Math.round(tc6Info.previsto)} m
            {tc6Info.percentual !== null && (
              <>
                {" "}
                · realizado {d.tc6_metros} m = <strong>{Math.round(tc6Info.percentual)}% do previsto</strong>
              </>
            )}
          </p>
          <p className="text-xs text-muted">
            Informativo, sem corte de classificação (o estudo não traz o limite inferior da normalidade no resumo). Vale para o corredor de 30 m. Idade {idadeAtual}, IMC {tc6Info.imc.toFixed(1).replace(".", ",")}.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-1">
          <RotuloComInfo texto="Velocidade de marcha" chave="velocidade_marcha" />
        </h4>
        <p className="text-xs text-muted mb-3">Informe a distância percorrida e o tempo cronometrado - a velocidade é calculada automaticamente.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumField label="Distância" suffix="m" value={d.marcha_distancia_m} onChange={(v) => set("marcha_distancia_m", v)} />
          <NumField label="Tempo" suffix="s" value={d.marcha_tempo_s} onChange={(v) => set("marcha_tempo_s", v)} />
          <ValorCalculado label="Velocidade" valor={velocidadeMarcha !== null ? `${velocidadeMarcha.toFixed(2).replace(".", ",")} m/s` : null}>
            {seloMarcha && (
              <div className="mt-1.5">
                <Selo tom={seloMarcha.tom}>{seloMarcha.texto}</Selo>
              </div>
            )}
          </ValorCalculado>
        </div>
        {velocidadeMarcha !== null && !marchaPorCalculo && (
          <p className="mt-2 text-xs text-muted">Valor de um registro anterior (sem distância/tempo). Informe distância e tempo para recalcular.</p>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-1">Força - resultado e ponto de corte</h4>
        <p className="text-xs text-muted mb-3">
          O painel integrado classifica a força com <strong>um ponto único</strong>, com ou sem dinamômetro: qualquer indicador abaixo do corte conta como <strong>força reduzida</strong>
          {" "}(critério do EWGSOP2) - <strong>dinamometria</strong> abaixo do corte brasileiro, <strong>5x Sit-to-Stand &gt; 15 s</strong>, ou <strong>Chair Stand e Arm Curl</strong> (60+) ambos
          abaixo da faixa normal de Rikli &amp; Jones. Um só teste de Rikli &amp; Jones abaixo vale como atenção. O Push-up é registrado para acompanhar evolução (sem corte de referência).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Sugerido ativo={!!rec.pushup}>
            <NumField label={<RotuloComInfo texto="Push-up test" chave="pushup" />} suffix="reps" value={d.pushup_reps} onChange={(v) => set("pushup_reps", v)} />
          </Sugerido>
          <Sugerido ativo={!!rec.forca_rikli}>
            <NumField label={<RotuloComInfo texto="Arm Curl Test" chave="arm_curl" />} suffix="reps/30s" value={d.arm_curl_reps} onChange={(v) => set("arm_curl_reps", v)} />
          </Sugerido>
        </div>
        <p className="mt-2 text-xs text-muted">
          Cortes para este paciente
          {idadeAtual !== null ? ` (${idadeAtual} anos` : " ("}
          {sexoAtual === "feminino" ? ", mulher)" : sexoAtual === "masculino" ? ", homem)" : ", sexo não informado)"}:{" "}
          {corteDina ? `dinamometria < ${String(corteDina.kgf).replace(".", ",")} kgf (${corteDina.fonte})` : "dinamometria - informe o sexo"}; 5x Sit-to-Stand &gt; 15 s
          {limite5sts ? ` (atenção a partir de ${String(limite5sts.seg).replace(".", ",")} s)` : ""}
          {limitesForca ? `; Chair Stand < ${limitesForca.chair} reps; Arm Curl < ${limitesForca.curl} reps.` : "; Chair Stand/Arm Curl só a partir dos 60 anos."}
        </p>
        {forcaResultado.classificacao !== "investigar" && (
          <div className="mt-3 flex flex-wrap items-start gap-2 text-sm">
            <Selo tom={TOM_CLASSIFICACAO[forcaResultado.classificacao]}>{ROTULO_CLASSIFICACAO[forcaResultado.classificacao]}</Selo>
            <span className="text-muted flex-1 min-w-[16rem]">{forcaResultado.justificativa}</span>
          </div>
        )}
      </div>

      <div className={secaoClasse(!!rec.rm_submaximo)}>
        <h4 className="font-display text-base text-ink mb-1">
          <RotuloComInfo texto="RM submáximo (estimado)" chave="rm_submaximo" />
        </h4>
        <p className="text-xs text-muted mb-3">
          Fórmula de Brzycki - estimativa de campo, mais confiável até ~10 repetições. Nunca substitui um teste
          direto de 1RM.
        </p>
        <ListaExercicios linhas={rmLista} onChange={setRmLista} rotuloCarga="Carga utilizada" rotuloReps="Repetições realizadas" mostrarRM />
      </div>

      <div className={secaoClasse(!!rec.falha_carga_fixa)}>
        <h4 className="font-display text-base text-ink mb-1">
          <RotuloComInfo texto="Repetições até a falha (carga fixa)" chave="falha_carga_fixa" />
        </h4>
        <ListaExercicios linhas={falhaLista} onChange={setFalhaLista} rotuloCarga="Carga fixa" rotuloReps="Repetições até a falha" />
      </div>

      <div className={secaoClasse(!!rec.goniometria)}>
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-display text-base text-ink">
            <RotuloComInfo texto="Amplitude articular (goniometria)" chave="goniometria" />
          </h4>
          <button type="button" onClick={adicionarGoniometria} className="text-sm font-medium text-accent hover:underline">
            + Adicionar articulação
          </button>
        </div>
        {goniometria.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma medida registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {goniometria.map((linha) => (
              <div key={linha.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <Field label="Articulação/movimento">
                      <select
                        value={MOVIMENTOS_GONIOMETRIA.includes(linha.articulacao) ? linha.articulacao : linha.articulacao.trim() ? "__outro" : ""}
                        onChange={(e) => atualizarGoniometria(linha.id, { articulacao: e.target.value === "__outro" ? " " : e.target.value })}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[15px]"
                      >
                        <option value="">Selecione...</option>
                        {MOVIMENTOS_GONIOMETRIA.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                        <option value="__outro">Outro (digitar)</option>
                      </select>
                    </Field>
                    {linha.articulacao !== "" && !MOVIMENTOS_GONIOMETRIA.includes(linha.articulacao) && (
                      <TextInput
                        value={linha.articulacao.trimStart()}
                        onChange={(e) => atualizarGoniometria(linha.id, { articulacao: e.target.value || " " })}
                        placeholder="Qual movimento?"
                      />
                    )}
                  </div>
                  <button type="button" onClick={() => removerGoniometria(linha.id)} className="text-xs text-muted hover:text-danger shrink-0">
                    remover
                  </button>
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <Field label="Lado">
                    <EscolhaUnica opcoes={["D", "E", "Bilateral"]} valor={linha.lado} onChange={(v) => atualizarGoniometria(linha.id, { lado: v })} />
                  </Field>
                  <Field label="Graus">
                    <TextInput inputMode="decimal" value={linha.graus} onChange={(e) => atualizarGoniometria(linha.id, { graus: e.target.value })} className="w-24" />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={secaoClasse(false)}>
        <h4 className="font-display text-base text-ink mb-1">Flexibilidade e mobilidade</h4>
        <p className="text-xs text-muted mb-3">Testes de referência - medida em cm, negativo quando não alcança o ponto de referência.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Sugerido ativo={!!rec.flexibilidade_adulto}>
            <NumField label={<RotuloComInfo texto="Sentar e alcançar" chave="sit_and_reach" />} suffix="cm" value={d.sit_and_reach_cm} onChange={(v) => set("sit_and_reach_cm", v)} />
          </Sugerido>
          <Sugerido ativo={!!rec.flexibilidade_idoso}>
            <NumField label={<RotuloComInfo texto="Sentar e alcançar na cadeira" chave="chair_sit_reach" />} suffix="cm" value={d.chair_sit_reach_cm} onChange={(v) => set("chair_sit_reach_cm", v)} />
          </Sugerido>
          <Sugerido ativo={!!rec.flexibilidade_idoso}>
            <NumField label={<RotuloComInfo texto="Back Scratch D" chave="back_scratch" />} suffix="cm" value={d.back_scratch_d_cm} onChange={(v) => set("back_scratch_d_cm", v)} />
          </Sugerido>
          <Sugerido ativo={!!rec.flexibilidade_idoso}>
            <NumField label={<RotuloComInfo texto="Back Scratch E" chave="back_scratch" />} suffix="cm" value={d.back_scratch_e_cm} onChange={(v) => set("back_scratch_e_cm", v)} />
          </Sugerido>
        </div>
      </div>

      <div className={secaoClasse(!!rec.mobilidade_articular)}>
        <h4 className="font-display text-base text-ink mb-1">Mobilidade articular: tornozelo e quadril</h4>
        <p className="text-xs text-muted mb-3 leading-relaxed">
          Meça os dois lados com o mesmo método e a mesma posição. A diferença entre os lados é calculada sozinha: acima de {LIMITE_ASSIMETRIA_GRAUS}° (em graus) ela entra como atenção no painel (referência: Macedo &amp; Magee 2008, maior diferença média entre lados em mulheres saudáveis de 7,5°).
          Não há corte absoluto de amplitude: compare com o manual de goniometria que você adota.
        </p>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-ink mb-2">Tornozelo - dorsiflexão com carga (avanço em parede)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <NumField label="Distância do pé à parede D" suffix="cm" value={d.mob_tornozelo_wblt_d_cm} onChange={(v) => set("mob_tornozelo_wblt_d_cm", v)} />
              <NumField label="Distância do pé à parede E" suffix="cm" value={d.mob_tornozelo_wblt_e_cm} onChange={(v) => set("mob_tornozelo_wblt_e_cm", v)} />
              <NumField label="Ângulo da tíbia D (opcional)" suffix="°" value={d.mob_tornozelo_df_d_graus} onChange={(v) => set("mob_tornozelo_df_d_graus", v)} />
              <NumField label="Ângulo da tíbia E (opcional)" suffix="°" value={d.mob_tornozelo_df_e_graus} onChange={(v) => set("mob_tornozelo_df_e_graus", v)} />
            </div>
            <p className="text-xs text-muted mt-1.5">Joelho avança até tocar a parede com o calcanhar no chão; afaste o pé até o máximo em que o calcanhar ainda não levanta. O ângulo da tíbia pode ser lido com inclinômetro ou aplicativo.</p>
          </div>
          <div>
            <p className="text-sm font-medium text-ink mb-2">Quadril - rotação interna e externa</p>
            <Field label="Posição do teste">
              <EscolhaUnica opcoes={POSICOES_QUADRIL} valor={d.mob_quadril_posicao} onChange={(v) => set("mob_quadril_posicao", v)} />
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
              <NumField label="Rotação interna D" suffix="°" value={d.mob_quadril_ri_d_graus} onChange={(v) => set("mob_quadril_ri_d_graus", v)} />
              <NumField label="Rotação interna E" suffix="°" value={d.mob_quadril_ri_e_graus} onChange={(v) => set("mob_quadril_ri_e_graus", v)} />
              <NumField label="Rotação externa D" suffix="°" value={d.mob_quadril_re_d_graus} onChange={(v) => set("mob_quadril_re_d_graus", v)} />
              <NumField label="Rotação externa E" suffix="°" value={d.mob_quadril_re_e_graus} onChange={(v) => set("mob_quadril_re_e_graus", v)} />
            </div>
          </div>
          {paresMob.some((p) => p.d !== null && p.e !== null) && (
            <ul className="text-sm space-y-1">
              {paresMob
                .filter((p) => p.d !== null && p.e !== null)
                .map((p) => {
                  const dif = diferencaEntreLados(p.d, p.e)!;
                  const alto = p.unidade === "°" && dif.dif > LIMITE_ASSIMETRIA_GRAUS;
                  return (
                    <li key={p.id} className="flex flex-wrap items-center gap-2">
                      <Selo tom={alto ? "atencao" : p.unidade === "°" ? "ok" : "neutro"}>{alto ? "assimetria" : p.unidade === "°" ? "simétrico" : "diferença"}</Selo>
                      <span className="text-ink">
                        {p.rotulo}: D {String(p.d).replace(".", ",")}{p.unidade} · E {String(p.e).replace(".", ",")}{p.unidade} · diferença {dif.dif.toFixed(1).replace(".", ",")}{p.unidade}
                        {dif.maiorLado ? ` (maior no ${dif.maiorLado === "D" ? "direito" : "esquerdo"})` : ""}
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
          <div className="flex flex-wrap items-start gap-2 text-sm">
            <Selo tom={TOM_CLASSIFICACAO[mobilidade.classificacao]}>Mobilidade: {ROTULO_CLASSIFICACAO[mobilidade.classificacao]}</Selo>
            <span className="text-muted flex-1 min-w-[16rem]">{mobilidade.justificativa}</span>
          </div>
        </div>
      </div>

      <div className={`${secaoClasse(!!(rec.agachamento_livre || rec.core_estabilidade))} space-y-4`}>
        <h4 className="font-display text-base text-ink">Testes funcionais observacionais</h4>
        <Field label={<RotuloComInfo texto="Agachamento livre - o que você observou? (marque o que se aplica)" chave="agachamento_livre" />}>
          <EscolhaMultipla opcoes={ACHADOS_AGACHAMENTO} valores={achadosAgachamento} onChange={setAchadosAgachamento} exclusivas={["Sem compensações"]} />
        </Field>
        <Field label="Agachamento livre - anotações">
          <TextArea value={d.agachamento_livre_obs} onChange={(e) => set("agachamento_livre_obs", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumField label={<RotuloComInfo texto="Estabilidade do core - prancha" chave="core_prancha" />} suffix="s" value={d.core_prancha_seg} onChange={(v) => set("core_prancha_seg", v)} />
        </div>
        <Field label="Estabilidade do core - o que você observou? (marque o que se aplica)">
          <EscolhaMultipla opcoes={ACHADOS_CORE} valores={achadosCore} onChange={setAchadosCore} exclusivas={["Mantém o alinhamento"]} />
        </Field>
        <Field label="Estabilidade do core - anotações">
          <TextArea value={d.core_estabilidade_obs} onChange={(e) => set("core_estabilidade_obs", e.target.value)} />
        </Field>
      </div>

      <Field label="Anotações gerais do avaliador">
        <TextArea value={d.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </Field>
      <PainelParecer agente="rita" valor={parecer} onChange={setParecer} gerar={gerarParecerFuncional} mensagemVazia="Registre ao menos um teste para a Rita redigir o parecer." />
      <SalvarBar salvando={salvando} ok={ok} onSalvar={() => salvar(dadosAtuais).then(onSalvo)} auto={estadoAuto} />
    </div>
  );
}
