"use client";

// Aba Cardiorrespiratória (Agente 9 - Caio).
//
// O paciente pode fazer MAIS DE UM teste (ex.: Bruce e depois um Cooper, ou
// uma rampa em outra data): cada teste tem seus próprios dados e resultados.
// Um deles é o "principal" - é o que alimenta o painel integrado, o histórico e
// o relatório; os demais ficam registrados e comparados na tabela do topo.

import { useState } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { Field, TextArea, TextInput } from "@/components/forms";
import { NumField, SalvarBar, Selo, SelectField, ValorCalculado, useAutoSalvar, useSalvarSecao, type TomSelo } from "./campos";
import { PainelParecer, lerParecer, type ParecerSalvo } from "./PainelParecer";
import { gerarParecerAgente, type EstiloParecer } from "@/lib/avaliacao/pareceres";
import { RotuloComInfo } from "./instrucoes";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { paraNumero } from "@/lib/numeros";
import {
  ESTAGIOS_BRUCE,
  vo2maxDeTeste,
  avaliarVO2max,
  ROTULO_CLASSE_VO2,
  descreverPSE,
  PSE_ESFORCO_MAXIMO,
  velocidadeMediaCooperKmh,
  type ClasseVO2,
  fcMaxTanaka,
  fcMaxFox,
  fcAlvoKarvonen,
  ZONAS_KARVONEN_PADRAO,
  metDeVo2,
  kcalPorMinuto,
  detectarDeflexaoFc,
  duploProduto,
} from "@/lib/avaliacao/cardiorrespiratoria";

const TOM_CLASSE_VO2: Record<ClasseVO2, TomSelo> = { muito_fraco: "perigo", fraco: "alerta", regular: "atencao", bom: "ok", excelente: "ok" };

const ROTULO_CLASSIFICACAO_LIMIAR = "Estimativa de campo (deflexão da FC, método de Conconi) - não substitui limiar ventilatório/lactato medido em laboratório.";

const ROTULO_PROTOCOLO: Record<string, string> = {
  bruce: "Bruce (com inclinação)",
  rampa: "Rampa de velocidade",
  cooper: "Cooper (12 min)",
  outro: "Outro (VO2máx informado)",
};

// Campos de UM teste (as chaves são as mesmas dos registros antigos, que tinham um teste só).
type Teste = Record<string, string>;

const CAMPOS_TESTE = [
  "protocolo",
  "data_teste",
  "bruce_tempo_total_min",
  "rampa_velocidade_final_kmh",
  "rampa_tempo_total_min",
  "rampa_inclinacao_pct",
  "cooper_distancia_m",
  "vo2max_manual",
  "fc_repouso_teste",
  "fc_maxima_atingida",
  "pa_sistolica_pos",
  "pa_diastolica_pos",
  "rpe_borg",
  "obs_teste",
  ...ESTAGIOS_BRUCE.map((e) => `bruce_fc_estagio_${e.estagio}`),
];

function novoId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function criarTeste(origem?: Record<string, any> | null): Teste {
  const t: Teste = { id: origem?.id ?? novoId() };
  for (const c of CAMPOS_TESTE) t[c] = origem?.[c] !== undefined && origem?.[c] !== null ? String(origem[c]) : "";
  if (!t.rampa_inclinacao_pct) t.rampa_inclinacao_pct = "0";
  return t;
}

function testesIniciais(dados: any): Teste[] {
  if (Array.isArray(dados?.testes) && dados.testes.length > 0) return dados.testes.map((t: any) => criarTeste(t));
  // Registro antigo: um teste só, com os campos soltos na raiz.
  if (dados?.protocolo || dados?.vo2max_manual) return [criarTeste({ ...dados, id: undefined })];
  return [criarTeste()];
}

export function AbaCardio({ pacienteId, dados, paciente, onSalvo }: { pacienteId: string; dados: any; paciente: PacienteRow; onSalvo: () => void }) {
  const [testes, setTestes] = useState<Teste[]>(() => testesIniciais(dados));
  const [principalSel, setPrincipalSel] = useState<string>(dados?.teste_principal ?? "");
  const [comum, setComum] = useState<Record<string, string>>({
    fc_max_metodo: dados?.fc_max_metodo || "tanaka",
    fc_max_manual: dados?.fc_max_manual ?? "",
    intensidade_prescricao_pct: dados?.intensidade_prescricao_pct ?? "70",
    observacoes: dados?.observacoes ?? "",
  });
  const [parecer, setParecer] = useState<ParecerSalvo | null>(() => lerParecer(dados?.parecer));
  const { salvar, salvando, ok, rascunho } = useSalvarSecao(pacienteId, "cardio");
  const setComumCampo = (k: string, v: string) => setComum((prev) => ({ ...prev, [k]: v }));
  const setTeste = (id: string, k: string, v: string) => setTestes((prev) => prev.map((t) => (t.id === id ? { ...t, [k]: v } : t)));

  const idade = idadeEfetiva(paciente);
  const sexo = sexoEfetivo(paciente);
  const pesoKg = paraNumero(paciente.fisica?.peso_kg);

  // Teste principal: o escolhido, senão o primeiro com VO2 calculável.
  const principal = testes.find((t) => t.id === principalSel) ?? testes.find((t) => vo2maxDeTeste(t) !== null) ?? testes[0];

  // FC máxima: a MAIOR FC medida entre os testes (a mais próxima da máxima real);
  // sem medida, a prevista pelo método escolhido.
  const fcsMedidas = testes.map((t) => paraNumero(t.fc_maxima_atingida)).filter((v): v is number => v !== null);
  const fcMaxMedida = fcsMedidas.length > 0 ? Math.max(...fcsMedidas) : null;
  const fcMaxPrevistaValor =
    comum.fc_max_metodo === "tanaka" && idade !== null
      ? fcMaxTanaka(idade)
      : comum.fc_max_metodo === "fox" && idade !== null
        ? fcMaxFox(idade)
        : comum.fc_max_metodo === "manual"
          ? paraNumero(comum.fc_max_manual)
          : null;
  const fcMaxEfetiva = fcMaxMedida ?? fcMaxPrevistaValor;
  const fcMaxPrevista = fcMaxMedida === null && fcMaxEfetiva !== null && (comum.fc_max_metodo === "tanaka" || comum.fc_max_metodo === "fox");

  const fcRepousoNum = paraNumero(principal?.fc_repouso_teste) ?? testes.map((t) => paraNumero(t.fc_repouso_teste)).find((v) => v !== null) ?? paraNumero(paciente.fisica?.fc_repouso);
  const fcReserva = fcMaxEfetiva !== null && fcRepousoNum !== null ? fcMaxEfetiva - fcRepousoNum : null;
  const zonasKarvonen =
    fcMaxEfetiva !== null && fcRepousoNum !== null ? ZONAS_KARVONEN_PADRAO.map((pct) => ({ pct, fc: fcAlvoKarvonen(fcRepousoNum, fcMaxEfetiva, pct) })) : [];

  // Prescrição: a partir do teste principal.
  const vo2Principal = vo2maxDeTeste(principal);
  const intensidadePct = paraNumero(comum.intensidade_prescricao_pct) ?? 70;
  const fcAlvoPrescricao = fcMaxEfetiva !== null && fcRepousoNum !== null ? fcAlvoKarvonen(fcRepousoNum, fcMaxEfetiva, intensidadePct) : null;
  const tempoPrincipalMin = tempoTotalMin(principal);
  const kcalMinNoTeste = vo2Principal !== null && pesoKg !== null ? kcalPorMinuto(vo2Principal, pesoKg) : null;
  const kcalTotalTeste = kcalMinNoTeste !== null && tempoPrincipalMin !== null ? kcalMinNoTeste * tempoPrincipalMin : null;
  const kcalMinPrescricao = vo2Principal !== null && pesoKg !== null ? kcalPorMinuto((vo2Principal * intensidadePct) / 100, pesoKg) : null;

  function adicionarTeste() {
    const novo = criarTeste();
    setTestes((prev) => [...prev, novo]);
  }
  function removerTeste(id: string) {
    setTestes((prev) => (prev.length > 1 ? prev.filter((t) => t.id !== id) : prev));
    if (principalSel === id) setPrincipalSel("");
  }

  function dadosParaSalvar() {
    // Cópia dos campos do teste principal na raiz: é o que o histórico e os
    // registros/relatórios antigos já leem.
    const copiaPrincipal: Record<string, string> = {};
    for (const c of CAMPOS_TESTE) copiaPrincipal[c] = principal?.[c] ?? "";
    return {
      ...comum,
      ...copiaPrincipal,
      fc_maxima_atingida: fcMaxMedida !== null ? String(fcMaxMedida) : "",
      testes,
      teste_principal: principal?.id ?? "",
      parecer,
    };
  }
  const dadosAtuais = dadosParaSalvar();
  const estadoAuto = useAutoSalvar(dadosAtuais, rascunho);
  const gerarParecerCardio = (estilo: EstiloParecer) => gerarParecerAgente("cardio", { ...paciente, cardio: { ...dadosAtuais, parecer: undefined } }, estilo);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
      <p className="text-sm text-muted">
        Antes de um teste máximo, confira a triagem de risco cardiovascular na aba Anamnese. Nenhum destes testes substitui um teste ergométrico clínico com ECG quando houver indicação.
      </p>

      {testes.length > 1 && (
        <div className="rounded-xl border border-border p-4">
          <h4 className="font-display text-base text-ink mb-2">Comparação entre os testes</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-1.5 pr-2 font-medium">Teste</th>
                  <th className="py-1.5 px-2 font-medium">Protocolo</th>
                  <th className="py-1.5 px-2 font-medium">VO2máx (ml/kg/min)</th>
                  <th className="py-1.5 px-2 font-medium">Percentil</th>
                  <th className="py-1.5 px-2 font-medium">FCmáx</th>
                  <th className="py-1.5 px-2 font-medium">PSE</th>
                  <th className="py-1.5 pl-2 font-medium">No painel</th>
                </tr>
              </thead>
              <tbody>
                {testes.map((t, i) => {
                  const vo2 = vo2maxDeTeste(t);
                  const medido = paraNumero(t.vo2max_manual) !== null;
                  const av = vo2 !== null ? avaliarVO2max(vo2, idade, sexo) : null;
                  return (
                    <tr key={t.id} className="border-b border-border last:border-0">
                      <td className="py-1.5 pr-2 text-ink">{i + 1}</td>
                      <td className="py-1.5 px-2 text-muted">{ROTULO_PROTOCOLO[t.protocolo] ?? "–"}</td>
                      <td className="py-1.5 px-2 font-mono tabular-nums text-ink">{vo2 !== null ? (medido ? vo2.toFixed(1) : `≈ ${Math.round(vo2)}`) : "–"}</td>
                      <td className="py-1.5 px-2 font-mono tabular-nums text-muted">{av ? av.textoPercentil : "–"}</td>
                      <td className="py-1.5 px-2 font-mono tabular-nums text-muted">{t.fc_maxima_atingida || "–"}</td>
                      <td className="py-1.5 px-2 font-mono tabular-nums text-muted">{t.rpe_borg || "–"}</td>
                      <td className="py-1.5 pl-2">
                        <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                          <input type="radio" name="teste-principal" checked={principal?.id === t.id} onChange={() => setPrincipalSel(t.id)} />
                          principal
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted mt-2">
            O teste marcado como principal alimenta o painel integrado, o histórico e o relatório; os demais ficam registrados. Protocolos diferentes dão VO2máx estimados por equações diferentes, então pequenas diferenças entre
            eles são esperadas.
          </p>
        </div>
      )}

      {testes.map((t, i) => (
        <CartaoTeste
          key={t.id}
          teste={t}
          numero={i + 1}
          total={testes.length}
          idade={idade}
          sexo={sexo}
          pesoKg={pesoKg}
          fcMaxPrevistaValor={fcMaxPrevistaValor}
          ehPrincipal={principal?.id === t.id}
          onTornarPrincipal={() => setPrincipalSel(t.id)}
          onChange={(k, v) => setTeste(t.id, k, v)}
          onRemover={() => removerTeste(t.id)}
        />
      ))}

      <button type="button" onClick={adicionarTeste} className="text-sm font-medium text-accent hover:underline">
        + Adicionar outro teste cardiorrespiratório
      </button>

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-3">Frequência cardíaca (todos os testes)</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ValorCalculado label="FCmáx medida (maior entre os testes)" valor={fcMaxMedida !== null ? `${fcMaxMedida.toFixed(0)} bpm` : null} />
          <SelectField
            label="Método se FCmáx não foi medida"
            value={comum.fc_max_metodo}
            onChange={(v) => setComumCampo("fc_max_metodo", v)}
            opcoes={[
              { value: "tanaka", label: "Tanaka (208 - 0,7 × idade)" },
              { value: "fox", label: "Fox (220 - idade)" },
              { value: "manual", label: "Informar manualmente" },
            ]}
          />
          {comum.fc_max_metodo === "manual" && <NumField label="FCmáx manual" suffix="bpm" value={comum.fc_max_manual} onChange={(v) => setComumCampo("fc_max_manual", v)} />}
          <ValorCalculado label="FC de reserva (Karvonen)" valor={fcReserva !== null ? `${fcReserva.toFixed(0)} bpm` : null} />
        </div>

        {zonasKarvonen.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  {zonasKarvonen.map((z) => (
                    <th key={z.pct} className="py-1.5 px-2 font-medium">
                      {z.pct}% FCres
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {zonasKarvonen.map((z) => (
                    <td key={z.pct} className="py-1.5 px-2 font-mono text-ink">
                      {z.fc.toFixed(0)} bpm
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {fcMaxPrevista && (
          <p className="mt-2 text-xs text-muted">
            FCmáx prevista por equação ({comum.fc_max_metodo === "fox" ? "Fox" : "Tanaka"}): o erro individual é de cerca de ±11 bpm, então as frequências calculadas a partir dela (zonas e FC alvo) são aproximadas. Prefira a
            FCmáx medida em teste máximo (PSE alta).
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-1">Prescrição</h4>
        <p className="text-xs text-muted mb-3">Calculada a partir do teste principal{principal ? ` (teste ${testes.indexOf(principal) + 1})` : ""}.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumField label="Intensidade alvo para prescrição" suffix="% FCres / %VO2máx" value={comum.intensidade_prescricao_pct} onChange={(v) => setComumCampo("intensidade_prescricao_pct", v)} />
          <ValorCalculado label="FC alvo na intensidade" valor={fcAlvoPrescricao !== null ? `${fcAlvoPrescricao.toFixed(0)} bpm` : null} />
          <ValorCalculado label="Kcal/min no teste (no VO2máx)" valor={kcalMinNoTeste !== null ? `${kcalMinNoTeste.toFixed(1)} kcal/min` : null} />
          <ValorCalculado label="Kcal totais estimados no teste" valor={kcalTotalTeste !== null ? `${kcalTotalTeste.toFixed(0)} kcal` : null} />
          <ValorCalculado label="Kcal/min na intensidade prescrita" valor={kcalMinPrescricao !== null ? `${kcalMinPrescricao.toFixed(1)} kcal/min` : null} />
        </div>
      </div>

      <Field label="Observações do avaliador">
        <TextArea value={comum.observacoes} onChange={(e) => setComumCampo("observacoes", e.target.value)} />
      </Field>

      <PainelParecer agente="caio" valor={parecer} onChange={setParecer} gerar={gerarParecerCardio} mensagemVazia="Registre ao menos um teste para o Caio redigir o parecer." />
      <SalvarBar salvando={salvando} ok={ok} onSalvar={() => salvar(dadosAtuais).then(onSalvo)} auto={estadoAuto} />
    </div>
  );
}

function tempoTotalMin(t: Teste | undefined): number | null {
  if (!t) return null;
  if (t.protocolo === "bruce") return paraNumero(t.bruce_tempo_total_min);
  if (t.protocolo === "rampa") return paraNumero(t.rampa_tempo_total_min);
  if (t.protocolo === "cooper") return 12;
  return null;
}

// ---------------------------------------------------------------------------
// Um teste (protocolo, dados, resultados)
// ---------------------------------------------------------------------------
function CartaoTeste({
  teste: t,
  numero,
  total,
  idade,
  sexo,
  pesoKg,
  fcMaxPrevistaValor,
  ehPrincipal,
  onTornarPrincipal,
  onChange,
  onRemover,
}: {
  teste: Teste;
  numero: number;
  total: number;
  idade: number | null;
  sexo: ReturnType<typeof sexoEfetivo>;
  pesoKg: number | null;
  fcMaxPrevistaValor: number | null;
  ehPrincipal: boolean;
  onTornarPrincipal: () => void;
  onChange: (k: string, v: string) => void;
  onRemover: () => void;
}) {
  const vo2max = vo2maxDeTeste(t);
  const vo2Medido = paraNumero(t.vo2max_manual) !== null;
  const avVo2 = vo2max !== null ? avaliarVO2max(vo2max, idade, sexo) : null;
  const classeVo2 = avVo2?.classe ?? null;
  const met = vo2max !== null ? metDeVo2(vo2max) : null;
  const pseNum = paraNumero(t.rpe_borg);
  const pse = pseNum !== null ? descreverPSE(pseNum) : null;

  // vVO2máx / velocidade de referência de cada protocolo.
  const velocidadeFinalRampa = paraNumero(t.rampa_velocidade_final_kmh);
  const tempoBruce = paraNumero(t.bruce_tempo_total_min);
  const distanciaCooper = paraNumero(t.cooper_distancia_m);
  const vVo2max =
    t.protocolo === "rampa" && velocidadeFinalRampa !== null
      ? velocidadeFinalRampa
      : t.protocolo === "bruce" && tempoBruce !== null
        ? (ESTAGIOS_BRUCE.find((e) => tempoBruce <= e.duracaoAcumuladaMin) ?? ESTAGIOS_BRUCE[ESTAGIOS_BRUCE.length - 1]).velocidadeKmh
        : null;
  const velocidadeMediaCooper = t.protocolo === "cooper" && distanciaCooper !== null ? velocidadeMediaCooperKmh(distanciaCooper) : null;

  const pontosFc = ESTAGIOS_BRUCE.map((e) => ({ velocidadeKmh: e.velocidadeKmh, fc: Number(t[`bruce_fc_estagio_${e.estagio}`]) })).filter((p) => Number.isFinite(p.fc) && p.fc > 0);
  const deflexao = t.protocolo === "bruce" ? detectarDeflexaoFc(pontosFc) : null;

  const tempoTeste = tempoTotalMin(t);
  const kcalMin = vo2max !== null && pesoKg !== null ? kcalPorMinuto(vo2max, pesoKg) : null;
  const kcalTotal = kcalMin !== null && tempoTeste !== null ? kcalMin * tempoTeste : null;

  const fcMaxDoTeste = paraNumero(t.fc_maxima_atingida) ?? fcMaxPrevistaValor;
  const duploProdutoCalc = fcMaxDoTeste !== null && paraNumero(t.pa_sistolica_pos) !== null ? duploProduto(fcMaxDoTeste, paraNumero(t.pa_sistolica_pos)!) : null;

  return (
    <div className={`rounded-xl border p-4 space-y-4 ${ehPrincipal && total > 1 ? "border-accent/60" : "border-border"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-display text-base text-ink">
          Teste {numero}
          {t.protocolo ? ` - ${ROTULO_PROTOCOLO[t.protocolo]}` : ""}
          {ehPrincipal && total > 1 && <span className="ml-2 text-xs font-medium text-accent-dark">principal (alimenta o painel)</span>}
        </h4>
        <div className="flex items-center gap-3 text-sm">
          {total > 1 && !ehPrincipal && (
            <button type="button" onClick={onTornarPrincipal} className="font-medium text-accent hover:underline">
              Usar este no painel
            </button>
          )}
          {total > 1 && (
            <button type="button" onClick={onRemover} className="text-xs text-muted hover:text-danger">
              remover teste
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="Protocolo usado"
          value={t.protocolo}
          onChange={(v) => onChange("protocolo", v)}
          opcoes={[
            { value: "bruce", label: "Com inclinação - Protocolo de Bruce" },
            { value: "rampa", label: "Rampa de velocidade (vVO2máx direta)" },
            { value: "cooper", label: "Sem inclinação - Teste de Cooper (12 min)" },
            { value: "outro", label: "Outro (informar VO2máx manualmente)" },
          ]}
        />
        <Field label="Data do teste (opcional)">
          <TextInput type="date" value={t.data_teste} onChange={(e) => onChange("data_teste", e.target.value)} />
        </Field>
      </div>

      {t.protocolo === "bruce" && (
        <div className="pt-1">
          <h5 className="font-display text-base text-ink mb-2">
            <RotuloComInfo texto="Protocolo de Bruce (7 estágios, 3 min cada)" chave="bruce_protocolo" />
          </h5>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="py-1.5 pr-2 font-medium">Estágio</th>
                  <th className="py-1.5 px-2 font-medium">Velocidade</th>
                  <th className="py-1.5 px-2 font-medium">Inclinação</th>
                  <th className="py-1.5 px-2 font-medium">Até (min)</th>
                  <th className="py-1.5 px-2 font-medium">FC (bpm)</th>
                </tr>
              </thead>
              <tbody>
                {ESTAGIOS_BRUCE.map((e) => (
                  <tr key={e.estagio} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-2 text-ink">{e.estagio}</td>
                    <td className="py-1.5 px-2 text-muted">{e.velocidadeKmh} km/h</td>
                    <td className="py-1.5 px-2 text-muted">{e.inclinacaoPct}%</td>
                    <td className="py-1.5 px-2 text-muted">{e.duracaoAcumuladaMin}</td>
                    <td className="py-1.5 px-2">
                      <TextInput
                        inputMode="decimal"
                        value={t[`bruce_fc_estagio_${e.estagio}`]}
                        onChange={(ev) => onChange(`bruce_fc_estagio_${e.estagio}`, ev.target.value)}
                        className="max-w-[6rem]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="max-w-xs">
            <NumField label="Tempo total até a exaustão" suffix="min decimais, ex.: 9.5" value={t.bruce_tempo_total_min} onChange={(v) => onChange("bruce_tempo_total_min", v)} />
          </div>
          {deflexao && (
            <p className="text-xs text-warn mt-2">
              Possível limiar estimado por deflexão da FC: ~{deflexao.velocidade.toFixed(1)} km/h (estágio {deflexao.indice + 1}). {ROTULO_CLASSIFICACAO_LIMIAR}
            </p>
          )}
        </div>
      )}

      {t.protocolo === "rampa" && (
        <div className="pt-1">
          <h5 className="font-display text-base text-ink mb-2">
            <RotuloComInfo texto="Rampa de velocidade" chave="rampa_protocolo" />
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <NumField label="Velocidade final atingida (vVO2máx)" suffix="km/h" value={t.rampa_velocidade_final_kmh} onChange={(v) => onChange("rampa_velocidade_final_kmh", v)} />
            <NumField label="Inclinação da esteira" suffix="%" value={t.rampa_inclinacao_pct} onChange={(v) => onChange("rampa_inclinacao_pct", v)} />
            <NumField label="Tempo total até a exaustão" suffix="min" value={t.rampa_tempo_total_min} onChange={(v) => onChange("rampa_tempo_total_min", v)} />
          </div>
          <p className="mt-2 text-xs text-muted leading-relaxed">
            O VO2máx da rampa é <strong>estimado</strong> pela equação metabólica do ACSM a partir da velocidade final e da inclinação (corrida a partir de 8 km/h; abaixo disso, a equação de caminhada). Ela descreve o custo em
            estado estável e, aplicada ao último estágio de um teste máximo, tende a superestimar o VO2 medido (cerca de 3 ml/kg/min em estudo) - por isso o valor é arredondado. Com ergoespirometria, informe o valor medido abaixo.
          </p>
        </div>
      )}

      {t.protocolo === "cooper" && (
        <div className="pt-1">
          <h5 className="font-display text-base text-ink mb-2">
            <RotuloComInfo texto="Teste de Cooper (12 minutos)" chave="cooper_protocolo" />
          </h5>
          <div className="max-w-xs">
            <NumField label="Distância percorrida em 12 min" suffix="m" value={t.cooper_distancia_m} onChange={(v) => onChange("cooper_distancia_m", v)} />
          </div>
          <p className="mt-2 text-xs text-muted">
            O Cooper é mais adequado a adultos saudáveis e ativos: a correlação com o VO2máx medido é de ~0,7-0,8 (erro em torno de ±10%). Em pessoas pouco condicionadas tende a
            superestimar e em atletas, a subestimar{idade !== null && idade >= 60 ? " - nesta faixa etária, trate o valor como aproximação" : ""}.
          </p>
        </div>
      )}

      <div className="pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-4">
        <ValorCalculado label={vo2Medido ? "VO2máx (medido)" : "VO2máx estimado"} valor={vo2max !== null ? `${vo2Medido ? vo2max.toFixed(1) : `≈ ${Math.round(vo2max)}`} ml/kg/min` : null}>
          {classeVo2 && avVo2 && (
            <div className="mt-1.5 space-y-1">
              <Selo tom={TOM_CLASSE_VO2[classeVo2]}>{ROTULO_CLASSE_VO2[classeVo2]}</Selo>
              <p className="text-xs text-muted">
                Percentil {avVo2.textoPercentil.replace("≈ ", "aproximado ")} para a idade e o sexo (referência FRIEND, esteira, faixa {avVo2.faixaEtaria} anos
                {avVo2.extrapolado ? " - usada por aproximação" : ""}). Referência norte-americana com VO2 medido; estimativas por equação são menos precisas.
              </p>
            </div>
          )}
          {vo2max !== null && !classeVo2 && <p className="mt-1.5 text-xs text-muted">Informe idade e sexo (aba Física) para classificar.</p>}
          {vo2max !== null && !vo2Medido && <p className="mt-1.5 text-xs text-muted">Estimativa por equação: o erro típico é de alguns ml/kg/min, por isso o valor é arredondado.</p>}
          {vo2max === null && t.protocolo === "rampa" && <p className="mt-1.5 text-xs text-muted">Informe a velocidade final para estimar o VO2máx.</p>}
        </ValorCalculado>
        <NumField label="VO2máx medido (ergoespirometria), se houver" value={t.vo2max_manual} onChange={(v) => onChange("vo2max_manual", v)} />
        <ValorCalculado
          label={velocidadeMediaCooper !== null ? "Velocidade média no Cooper" : "vVO2máx"}
          valor={vVo2max !== null ? `${vVo2max.toFixed(1)} km/h` : velocidadeMediaCooper !== null ? `${velocidadeMediaCooper.toFixed(1)} km/h` : null}
        />
        <ValorCalculado label="MET" valor={met !== null ? met.toFixed(1) : null}>
          {met !== null && met < 5 && (
            <div className="mt-1.5 space-y-1">
              <Selo tom="alerta">Aptidão baixa (&lt; 5 METs)</Selo>
              <p className="text-xs text-muted">Na faixa abaixo de 5 METs está o maior risco de mortalidade; é onde pequenos ganhos de aptidão trazem mais benefício.</p>
            </div>
          )}
        </ValorCalculado>
        <ValorCalculado label="Gasto no teste" valor={kcalTotal !== null ? `${kcalTotal.toFixed(0)} kcal (${kcalMin!.toFixed(1)} kcal/min)` : null} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <NumField label="FC de repouso" suffix="bpm" value={t.fc_repouso_teste} onChange={(v) => onChange("fc_repouso_teste", v)} />
        <NumField label="FC máxima atingida no teste" suffix="bpm" value={t.fc_maxima_atingida} onChange={(v) => onChange("fc_maxima_atingida", v)} />
        <NumField label="PA sistólica pós-teste" suffix="mmHg" value={t.pa_sistolica_pos} onChange={(v) => onChange("pa_sistolica_pos", v)} />
        <NumField label="PA diastólica pós-teste" suffix="mmHg" value={t.pa_diastolica_pos} onChange={(v) => onChange("pa_diastolica_pos", v)} />
        <ValorCalculado label="Duplo produto (FC × PAS)" valor={duploProdutoCalc !== null ? duploProdutoCalc.toFixed(0) : null} />
        <div className="space-y-2">
          <NumField label="Percepção de esforço (PSE, Borg 6-20)" value={t.rpe_borg} onChange={(v) => onChange("rpe_borg", v)} />
          {pseNum !== null && (
            <div className="space-y-1">
              {pse ? (
                <>
                  <Selo tom={pse.tom}>
                    PSE {Math.round(pseNum)} - {pse.rotulo}
                  </Selo>
                  <p className="text-xs text-muted">
                    {pseNum >= PSE_ESFORCO_MAXIMO
                      ? "Esforço compatível com teste máximo (PSE ≥ 17)."
                      : "PSE abaixo de 17: o teste pode ter sido interrompido antes do esforço máximo e o VO2máx estimado tende a ficar subestimado."}
                  </p>
                </>
              ) : (
                <p className="text-xs text-warn">Valor fora da escala de Borg (6 a 20).</p>
              )}
            </div>
          )}
        </div>
      </div>

      <Field label="Anotações deste teste">
        <TextArea value={t.obs_teste} onChange={(e) => onChange("obs_teste", e.target.value)} />
      </Field>
    </div>
  );
}
