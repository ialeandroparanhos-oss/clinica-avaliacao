"use client";

// Aba Cardiorrespiratória (Agente 9 - Caio).

import { useState } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { Field, TextArea, TextInput } from "@/components/forms";
import { NumField, SalvarBar, Selo, SelectField, ValorCalculado, useSalvarSecao, type TomSelo } from "./campos";
import { RotuloComInfo } from "./instrucoes";
import { idadeEfetiva, sexoEfetivo } from "@/lib/avaliacao/identificacao";
import { paraNumero } from "@/lib/numeros";
import {
  ESTAGIOS_BRUCE,
  vo2maxDeRegistro,
  avaliarVO2max,
  ROTULO_CLASSE_VO2,
  descreverPSE,
  PSE_ESFORCO_MAXIMO,
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

// ---------------------------------------------------------------------------
// Aba Cardiorrespiratória (Agente 9 - Caio)
// ---------------------------------------------------------------------------
const TOM_CLASSE_VO2: Record<ClasseVO2, TomSelo> = { muito_fraco: "perigo", fraco: "alerta", regular: "atencao", bom: "ok", excelente: "ok" };

const ROTULO_CLASSIFICACAO_LIMIAR = "Estimativa de campo (deflexão da FC, método de Conconi) - não substitui limiar ventilatório/lactato medido em laboratório.";

export function AbaCardio({ pacienteId, dados, paciente, onSalvo }: { pacienteId: string; dados: any; paciente: PacienteRow; onSalvo: () => void }) {
  const [d, setD] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {
      protocolo: dados?.protocolo ?? "",
      bruce_tempo_total_min: dados?.bruce_tempo_total_min ?? "",
      rampa_velocidade_final_kmh: dados?.rampa_velocidade_final_kmh ?? "",
      rampa_tempo_total_min: dados?.rampa_tempo_total_min ?? "",
      cooper_distancia_m: dados?.cooper_distancia_m ?? "",
      vo2max_manual: dados?.vo2max_manual ?? "",
      fc_repouso_teste: dados?.fc_repouso_teste ?? "",
      fc_maxima_atingida: dados?.fc_maxima_atingida ?? "",
      fc_max_metodo: dados?.fc_max_metodo || "tanaka",
      fc_max_manual: dados?.fc_max_manual ?? "",
      pa_sistolica_pos: dados?.pa_sistolica_pos ?? "",
      pa_diastolica_pos: dados?.pa_diastolica_pos ?? "",
      rpe_borg: dados?.rpe_borg ?? "",
      intensidade_prescricao_pct: dados?.intensidade_prescricao_pct ?? "70",
      observacoes: dados?.observacoes ?? "",
    };
    for (const e of ESTAGIOS_BRUCE) base[`bruce_fc_estagio_${e.estagio}`] = dados?.[`bruce_fc_estagio_${e.estagio}`] ?? "";
    return base;
  });
  const { salvar, salvando, ok } = useSalvarSecao(pacienteId, "cardio");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));

  const idade = idadeEfetiva(paciente);
  const pesoKg = paraNumero(paciente.fisica?.peso_kg);
  const fcRepousoNum = Number(d.fc_repouso_teste || paciente.fisica?.fc_repouso) || null;

  const vo2max = vo2maxDeRegistro(d);
  const sexo = sexoEfetivo(paciente);
  const vo2Medido = paraNumero(d.vo2max_manual) !== null;
  const avVo2 = vo2max !== null ? avaliarVO2max(vo2max, idade, sexo) : null;
  const classeVo2 = avVo2?.classe ?? null;
  const pseNum = paraNumero(d.rpe_borg);
  const pse = pseNum !== null ? descreverPSE(pseNum) : null;

  const vVo2max =
    d.protocolo === "rampa" && d.rampa_velocidade_final_kmh
      ? Number(d.rampa_velocidade_final_kmh)
      : d.protocolo === "bruce" && d.bruce_tempo_total_min
        ? (ESTAGIOS_BRUCE.find((e) => Number(d.bruce_tempo_total_min) <= e.duracaoAcumuladaMin) ?? ESTAGIOS_BRUCE[ESTAGIOS_BRUCE.length - 1]).velocidadeKmh
        : null;

  const fcMaxEfetiva = d.fc_maxima_atingida
    ? Number(d.fc_maxima_atingida)
    : d.fc_max_metodo === "tanaka" && idade !== null
      ? fcMaxTanaka(idade)
      : d.fc_max_metodo === "fox" && idade !== null
        ? fcMaxFox(idade)
        : d.fc_max_metodo === "manual" && d.fc_max_manual
          ? Number(d.fc_max_manual)
          : null;

  const fcMaxPrevista = !d.fc_maxima_atingida && fcMaxEfetiva !== null && (d.fc_max_metodo === "tanaka" || d.fc_max_metodo === "fox");
  const fcReserva = fcMaxEfetiva !== null && fcRepousoNum !== null ? fcMaxEfetiva - fcRepousoNum : null;
  const zonasKarvonen =
    fcMaxEfetiva !== null && fcRepousoNum !== null
      ? ZONAS_KARVONEN_PADRAO.map((pct) => ({ pct, fc: fcAlvoKarvonen(fcRepousoNum, fcMaxEfetiva, pct) }))
      : [];

  const intensidadePct = d.intensidade_prescricao_pct ? Number(d.intensidade_prescricao_pct) : 70;
  const fcAlvoPrescricao = fcMaxEfetiva !== null && fcRepousoNum !== null ? fcAlvoKarvonen(fcRepousoNum, fcMaxEfetiva, intensidadePct) : null;

  const met = vo2max !== null ? metDeVo2(vo2max) : null;
  const tempoTotalTesteMin =
    d.protocolo === "bruce" ? Number(d.bruce_tempo_total_min) || null : d.protocolo === "rampa" ? Number(d.rampa_tempo_total_min) || null : d.protocolo === "cooper" ? 12 : null;
  const kcalMinNoTeste = vo2max !== null && pesoKg !== null ? kcalPorMinuto(vo2max, pesoKg) : null;
  const kcalTotalTeste = kcalMinNoTeste !== null && tempoTotalTesteMin !== null ? kcalMinNoTeste * tempoTotalTesteMin : null;
  const kcalMinPrescricao = vo2max !== null && pesoKg !== null ? kcalPorMinuto((vo2max * intensidadePct) / 100, pesoKg) : null;

  const pontosFc = ESTAGIOS_BRUCE.map((e) => ({ velocidadeKmh: e.velocidadeKmh, fc: Number(d[`bruce_fc_estagio_${e.estagio}`]) })).filter(
    (p) => Number.isFinite(p.fc) && p.fc > 0
  );
  const deflexao = d.protocolo === "bruce" ? detectarDeflexaoFc(pontosFc) : null;

  const duploProdutoCalc = fcMaxEfetiva !== null && d.pa_sistolica_pos ? duploProduto(fcMaxEfetiva, Number(d.pa_sistolica_pos)) : null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
      <p className="text-sm text-muted">
        Antes de um teste máximo, confira a triagem de risco cardiovascular na aba Anamnese. Nenhum destes testes
        substitui um teste ergométrico clínico com ECG quando houver indicação.
      </p>

      <div className="max-w-sm">
        <SelectField
          label="Protocolo usado"
          value={d.protocolo}
          onChange={(v) => set("protocolo", v)}
          opcoes={[
            { value: "bruce", label: "Com inclinação - Protocolo de Bruce" },
            { value: "rampa", label: "Sem inclinação - rampa de velocidade (vVO2máx direta)" },
            { value: "cooper", label: "Sem inclinação - Teste de Cooper (12 min)" },
            { value: "outro", label: "Outro (informar VO2máx manualmente)" },
          ]}
        />
      </div>

      {d.protocolo === "bruce" && (
        <div className="pt-2">
          <h4 className="font-display text-base text-ink mb-2">
            <RotuloComInfo texto="Protocolo de Bruce (7 estágios, 3 min cada)" chave="bruce_protocolo" />
          </h4>
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
                        value={d[`bruce_fc_estagio_${e.estagio}`]}
                        onChange={(ev) => set(`bruce_fc_estagio_${e.estagio}`, ev.target.value)}
                        className="max-w-[6rem]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="max-w-xs">
            <NumField label="Tempo total até a exaustão" suffix="min decimais, ex.: 9.5" value={d.bruce_tempo_total_min} onChange={(v) => set("bruce_tempo_total_min", v)} />
          </div>
          {deflexao && (
            <p className="text-xs text-warn mt-2">
              Possível limiar estimado por deflexão da FC: ~{deflexao.velocidade.toFixed(1)} km/h (estágio {deflexao.indice + 1}). {ROTULO_CLASSIFICACAO_LIMIAR}
            </p>
          )}
        </div>
      )}

      {d.protocolo === "rampa" && (
        <div className="pt-2">
          <h4 className="font-display text-base text-ink mb-2">
            <RotuloComInfo texto="Rampa de velocidade (sem inclinação)" chave="rampa_protocolo" />
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <NumField label="Velocidade final atingida (vVO2máx)" suffix="km/h" value={d.rampa_velocidade_final_kmh} onChange={(v) => set("rampa_velocidade_final_kmh", v)} />
            <NumField label="Tempo total até a exaustão" suffix="min" value={d.rampa_tempo_total_min} onChange={(v) => set("rampa_tempo_total_min", v)} />
          </div>
        </div>
      )}

      {d.protocolo === "cooper" && (
        <div className="pt-2">
          <h4 className="font-display text-base text-ink mb-2">
            <RotuloComInfo texto="Teste de Cooper (12 minutos)" chave="cooper_protocolo" />
          </h4>
          <div className="max-w-xs">
            <NumField label="Distância percorrida em 12 min" suffix="m" value={d.cooper_distancia_m} onChange={(v) => set("cooper_distancia_m", v)} />
          </div>
          <p className="mt-2 text-xs text-muted">
            O Cooper é mais adequado a adultos saudáveis e ativos: a correlação com o VO2máx medido é de ~0,7-0,8 (erro em torno de ±10%). Em pessoas pouco condicionadas tende a
            superestimar e em atletas, a subestimar{idade !== null && idade >= 60 ? " - nesta faixa etária, trate o valor como aproximação" : ""}.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-4">
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
          {vo2max !== null && !vo2Medido && (
            <p className="mt-1.5 text-xs text-muted">Estimativa por equação: o erro típico é de alguns ml/kg/min, por isso o valor é arredondado.</p>
          )}
        </ValorCalculado>
        <NumField label="VO2máx medido (ergoespirometria), se houver" value={d.vo2max_manual} onChange={(v) => set("vo2max_manual", v)} />
        <ValorCalculado label="vVO2máx" valor={vVo2max !== null ? `${vVo2max.toFixed(1)} km/h` : null} />
        <ValorCalculado label="MET" valor={met !== null ? met.toFixed(1) : null}>
          {met !== null && met < 5 && (
            <div className="mt-1.5 space-y-1">
              <Selo tom="alerta">Aptidão baixa (&lt; 5 METs)</Selo>
              <p className="text-xs text-muted">Na faixa abaixo de 5 METs está o maior risco de mortalidade; é onde pequenos ganhos de aptidão trazem mais benefício.</p>
            </div>
          )}
        </ValorCalculado>
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-3">Frequência cardíaca</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumField label="FC de repouso" suffix="bpm" value={d.fc_repouso_teste} onChange={(v) => set("fc_repouso_teste", v)} />
          <NumField label="FC máxima atingida no teste" suffix="bpm" value={d.fc_maxima_atingida} onChange={(v) => set("fc_maxima_atingida", v)} />
          <SelectField
            label="Método se FCmáx não foi medida"
            value={d.fc_max_metodo}
            onChange={(v) => set("fc_max_metodo", v)}
            opcoes={[
              { value: "tanaka", label: "Tanaka (208 - 0,7 × idade)" },
              { value: "fox", label: "Fox (220 - idade)" },
              { value: "manual", label: "Informar manualmente" },
            ]}
          />
          {d.fc_max_metodo === "manual" && <NumField label="FCmáx manual" suffix="bpm" value={d.fc_max_manual} onChange={(v) => set("fc_max_manual", v)} />}
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
            FCmáx prevista por equação ({d.fc_max_metodo === "fox" ? "Fox" : "Tanaka"}): o erro individual é de cerca de ±11 bpm, então as frequências calculadas a partir dela (zonas e FC alvo) são aproximadas. Prefira a
            FCmáx medida em teste máximo (PSE alta).
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-border grid grid-cols-2 sm:grid-cols-3 gap-4">
        <NumField label="PA sistólica pós-teste" suffix="mmHg" value={d.pa_sistolica_pos} onChange={(v) => set("pa_sistolica_pos", v)} />
        <NumField label="PA diastólica pós-teste" suffix="mmHg" value={d.pa_diastolica_pos} onChange={(v) => set("pa_diastolica_pos", v)} />
        <ValorCalculado label="Duplo produto (FC × PAS)" valor={duploProdutoCalc !== null ? duploProdutoCalc.toFixed(0) : null} />
        <div className="space-y-2">
          <NumField label="Percepção de esforço (PSE, Borg 6-20)" value={d.rpe_borg} onChange={(v) => set("rpe_borg", v)} />
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

      <div className="pt-4 border-t border-border">
        <h4 className="font-display text-base text-ink mb-3">Prescrição</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumField label="Intensidade alvo para prescrição" suffix="% FCres / %VO2máx" value={d.intensidade_prescricao_pct} onChange={(v) => set("intensidade_prescricao_pct", v)} />
          <ValorCalculado label="FC alvo na intensidade" valor={fcAlvoPrescricao !== null ? `${fcAlvoPrescricao.toFixed(0)} bpm` : null} />
          <ValorCalculado label="Kcal/min no teste (no VO2máx)" valor={kcalMinNoTeste !== null ? `${kcalMinNoTeste.toFixed(1)} kcal/min` : null} />
          <ValorCalculado label="Kcal totais estimados no teste" valor={kcalTotalTeste !== null ? `${kcalTotalTeste.toFixed(0)} kcal` : null} />
          <ValorCalculado label="Kcal/min na intensidade prescrita" valor={kcalMinPrescricao !== null ? `${kcalMinPrescricao.toFixed(1)} kcal/min` : null} />
        </div>
      </div>

      <Field label="Observações do avaliador">
        <TextArea value={d.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </Field>

      <SalvarBar salvando={salvando} ok={ok} onSalvar={() => salvar(d).then(onSalvo)} />
    </div>
  );
}
