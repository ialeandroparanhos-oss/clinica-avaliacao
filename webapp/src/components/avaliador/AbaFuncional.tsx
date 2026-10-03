"use client";

// Aba Avaliação Funcional (Agente 5 - Rita).

import { useMemo, useState } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { Field, TextArea, TextInput } from "@/components/forms";
import { NumField, SalvarBar, Selo, ValorCalculado, useSalvarSecao, type TomSelo } from "./campos";
import { RotuloComInfo } from "./instrucoes";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { avaliarForca, corteDinamometriaKgf, limite5stsPorIdade, limitesRikli } from "@/lib/avaliacao/forca";
import { paraNumero } from "@/lib/numeros";
import { calcularTagsPerfil, gruposRecomendados, ROTULOS_GRUPO, type GrupoTesteFuncional } from "@/lib/integracao/tagsPerfil";

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

type LinhaGoniometria = { id: string; articulacao: string; lado: string; graus: string };

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
          <p className="text-muted mb-1">Com base nisso, Rita sugere priorizar:</p>
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
      <p className="text-xs text-muted">Sugestão de ordem/ênfase, não uma restrição - todos os testes continuam disponíveis abaixo.</p>
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
    dinamometria_d_kg: dados?.dinamometria_d_kg ?? "",
    dinamometria_e_kg: dados?.dinamometria_e_kg ?? "",
    pushup_reps: dados?.pushup_reps ?? "",
    arm_curl_reps: dados?.arm_curl_reps ?? "",
    rm_exercicio: dados?.rm_exercicio ?? "",
    rm_carga_kg: dados?.rm_carga_kg ?? "",
    rm_repeticoes: dados?.rm_repeticoes ?? "",
    falha_exercicio: dados?.falha_exercicio ?? "",
    falha_carga_kg: dados?.falha_carga_kg ?? "",
    falha_repeticoes: dados?.falha_repeticoes ?? "",
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
  const { salvar, salvando, ok } = useSalvarSecao(pacienteId, "funcional");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));

  const rmEstimado = estimarRM(d.rm_carga_kg, d.rm_repeticoes);

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
    return { ...d, velocidade_marcha_ms: velocidade, goniometria };
  }

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
        <NumField label={<RotuloComInfo texto="Chair Stand" chave="chair_stand" />} suffix="reps/30s" value={d.chair_stand_reps} onChange={(v) => set("chair_stand_reps", v)} />
        <NumField label={<RotuloComInfo texto="5x Sit-to-Stand" chave="five_sts" />} suffix="s" value={d.five_sts_seg} onChange={(v) => set("five_sts_seg", v)} />
        <NumField label={<RotuloComInfo texto="TUG" chave="tug" />} suffix="s" value={d.tug_seg} onChange={(v) => set("tug_seg", v)} />
        <NumField label={<RotuloComInfo texto="Apoio unipodal D" chave="apoio_unipodal" />} suffix="s" value={d.apoio_unipodal_d_seg} onChange={(v) => set("apoio_unipodal_d_seg", v)} />
        <NumField label={<RotuloComInfo texto="Apoio unipodal E" chave="apoio_unipodal" />} suffix="s" value={d.apoio_unipodal_e_seg} onChange={(v) => set("apoio_unipodal_e_seg", v)} />
        <NumField label={<RotuloComInfo texto="TC6" chave="tc6" />} suffix="m" value={d.tc6_metros} onChange={(v) => set("tc6_metros", v)} />
        <NumField label={<RotuloComInfo texto="Dinamometria D" chave="dinamometria" />} suffix="kgf" value={d.dinamometria_d_kg} onChange={(v) => set("dinamometria_d_kg", v)} />
        <NumField label={<RotuloComInfo texto="Dinamometria E" chave="dinamometria" />} suffix="kgf" value={d.dinamometria_e_kg} onChange={(v) => set("dinamometria_e_kg", v)} />
      </div>

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
          <NumField label={<RotuloComInfo texto="Push-up test" chave="pushup" />} suffix="reps" value={d.pushup_reps} onChange={(v) => set("pushup_reps", v)} />
          <NumField label={<RotuloComInfo texto="Arm Curl Test" chave="arm_curl" />} suffix="reps/30s" value={d.arm_curl_reps} onChange={(v) => set("arm_curl_reps", v)} />
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

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-1">
          <RotuloComInfo texto="RM submáximo (estimado)" chave="rm_submaximo" />
        </h4>
        <p className="text-xs text-muted mb-3">
          Fórmula de Brzycki - estimativa de campo, mais confiável até ~10 repetições. Nunca substitui um teste
          direto de 1RM.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Exercício">
            <TextInput value={d.rm_exercicio} onChange={(e) => set("rm_exercicio", e.target.value)} placeholder="Ex.: Supino, Leg press" />
          </Field>
          <NumField label="Carga utilizada" suffix="kg" value={d.rm_carga_kg} onChange={(v) => set("rm_carga_kg", v)} />
          <NumField label="Repetições realizadas" value={d.rm_repeticoes} onChange={(v) => set("rm_repeticoes", v)} />
          <Field label="1RM estimado">
            <div className="rounded-lg border border-border bg-bg px-3.5 py-2.5 text-[15px] font-mono tabular-nums">
              {rmEstimado ? `${rmEstimado} kg` : "–"}
            </div>
          </Field>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-1">
          <RotuloComInfo texto="Repetições até a falha (carga fixa)" chave="falha_carga_fixa" />
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Exercício">
            <TextInput value={d.falha_exercicio} onChange={(e) => set("falha_exercicio", e.target.value)} />
          </Field>
          <NumField label="Carga fixa" suffix="kg" value={d.falha_carga_kg} onChange={(v) => set("falha_carga_kg", v)} />
          <NumField label="Repetições até a falha" value={d.falha_repeticoes} onChange={(v) => set("falha_repeticoes", v)} />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
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
              <div key={linha.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
                <Field label="Articulação/movimento">
                  <TextInput
                    value={linha.articulacao}
                    onChange={(e) => atualizarGoniometria(linha.id, { articulacao: e.target.value })}
                    placeholder="Ex.: Flexão de ombro"
                  />
                </Field>
                <Field label="Lado">
                  <TextInput
                    value={linha.lado}
                    onChange={(e) => atualizarGoniometria(linha.id, { lado: e.target.value })}
                    placeholder="D/E"
                    className="w-16"
                  />
                </Field>
                <Field label="Graus">
                  <TextInput
                    inputMode="decimal"
                    value={linha.graus}
                    onChange={(e) => atualizarGoniometria(linha.id, { graus: e.target.value })}
                    className="w-20"
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => removerGoniometria(linha.id)}
                  className="text-xs text-muted hover:text-danger pb-2.5"
                >
                  remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-1">Flexibilidade e mobilidade</h4>
        <p className="text-xs text-muted mb-3">Testes de referência - medida em cm, negativo quando não alcança o ponto de referência.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumField label={<RotuloComInfo texto="Sentar e alcançar" chave="sit_and_reach" />} suffix="cm" value={d.sit_and_reach_cm} onChange={(v) => set("sit_and_reach_cm", v)} />
          <NumField label={<RotuloComInfo texto="Sentar e alcançar na cadeira" chave="chair_sit_reach" />} suffix="cm" value={d.chair_sit_reach_cm} onChange={(v) => set("chair_sit_reach_cm", v)} />
          <NumField label={<RotuloComInfo texto="Back Scratch D" chave="back_scratch" />} suffix="cm" value={d.back_scratch_d_cm} onChange={(v) => set("back_scratch_d_cm", v)} />
          <NumField label={<RotuloComInfo texto="Back Scratch E" chave="back_scratch" />} suffix="cm" value={d.back_scratch_e_cm} onChange={(v) => set("back_scratch_e_cm", v)} />
        </div>
      </div>

      <div className="pt-4 border-t border-border space-y-4">
        <h4 className="font-display text-base text-ink">Testes funcionais observacionais</h4>
        <Field label={<RotuloComInfo texto="Agachamento livre - observações (profundidade, valgo dinâmico, compensações...)" chave="agachamento_livre" />}>
          <TextArea value={d.agachamento_livre_obs} onChange={(e) => set("agachamento_livre_obs", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumField label={<RotuloComInfo texto="Estabilidade do core - prancha" chave="core_prancha" />} suffix="s" value={d.core_prancha_seg} onChange={(v) => set("core_prancha_seg", v)} />
        </div>
        <Field label="Estabilidade do core - observações">
          <TextArea value={d.core_estabilidade_obs} onChange={(e) => set("core_estabilidade_obs", e.target.value)} />
        </Field>
      </div>

      <Field label="Observações gerais do avaliador">
        <TextArea value={d.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </Field>
      <SalvarBar salvando={salvando} ok={ok} onSalvar={() => salvar(dadosParaSalvar()).then(onSalvo)} />
    </div>
  );
}
