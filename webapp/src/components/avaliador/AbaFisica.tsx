"use client";

// Aba Física e Antropométrica (Agente 3 - Marco).

import { Fragment, useMemo, useState } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { CheckboxGroup, Field, TextArea, TextInput } from "@/components/forms";
import { CampoComSugestao, NumField, SalvarBar, SelectField, Selo, ValorCalculado, useSalvarSecao, type TomSelo } from "./campos";
import { AvatarCorporal } from "./AvatarCorporal";
import { normalizarDecimal, paraNumero } from "@/lib/numeros";
import {
  SITIOS_FAULKNER,
  SITIOS_JP3,
  SITIOS_JP7,
  TODOS_SITIOS_DOBRA,
  calcularPercentualGorduraDobras,
  classificarIMC,
  classificarRCQ,
  faixaGorduraSugerida,
  percentualGorduraIdealSugerido,
  sexoNormalizado,
  sugerirProtocoloDobras,
  type ClasseIMC,
  type ProtocoloDobras,
} from "@/lib/avaliacao/composicaoCorporal";
import {
  CAMPOS_CIRCUNFERENCIA,
  CIRC_MEMBROS,
  CIRC_TRONCO,
  NIVEIS_COXA,
  calcularMassaMagraRelativa,
  expansibilidadeToracica,
} from "@/lib/avaliacao/medidasRegionais";
import { idadeAutomatica, sexoAutomatico } from "@/lib/avaliacao/identificacao";

const TOM_IMC: Record<ClasseIMC, TomSelo> = {
  baixo_peso: "info",
  eutrofia: "ok",
  sobrepeso: "atencao",
  obesidade_1: "alerta",
  obesidade_2: "perigo",
  obesidade_3: "critico",
};

const f1 = (n: number | null) => (n === null ? "–" : n.toFixed(1));

export function AbaFisica({
  pacienteId,
  dados,
  paciente,
  onSalvo,
}: {
  pacienteId: string;
  dados: any;
  paciente: PacienteRow;
  onSalvo: () => void;
}) {
  const idadeAuto = idadeAutomatica(paciente);
  const sexoAuto = sexoAutomatico(paciente);

  const [d, setD] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {
      // idade/sexo: valor manual salvo, senão o do cadastro/anamnese
      idade: dados?.idade_manual ? String(dados.idade_manual) : idadeAuto !== null ? String(idadeAuto) : "",
      sexo: dados?.sexo_manual ? String(dados.sexo_manual) : sexoAuto !== "desconhecido" ? sexoAuto : "",
      peso_kg: dados?.peso_kg ?? "",
      altura_cm: dados?.altura_cm ?? "",
      pa_sistolica: dados?.pa_sistolica ?? "",
      pa_diastolica: dados?.pa_diastolica ?? "",
      fc_repouso: dados?.fc_repouso ?? "",
      spo2: dados?.spo2 ?? "",
      coxa_nivel: dados?.coxa_nivel ?? "",
      protocolo_dobras: dados?.protocolo_dobras ?? "",
      bio_percentual_gordura: dados?.bio_percentual_gordura ?? "",
      bio_massa_magra_kg: dados?.bio_massa_magra_kg ?? "",
      bio_massa_gorda_kg: dados?.bio_massa_gorda_kg ?? "",
      bio_agua_corporal_pct: dados?.bio_agua_corporal_pct ?? "",
      bio_aparelho: dados?.bio_aparelho ?? "",
      protocolo_referencia_gordura: dados?.protocolo_referencia_gordura ?? "",
      percentual_gordura: dados?.percentual_gordura ?? "",
      percentual_gordura_ideal: dados?.percentual_gordura_ideal ?? "",
      massa_magra_ideal_kg: dados?.massa_magra_ideal_kg ?? "",
      observacoes: dados?.observacoes ?? "",
    };
    for (const s of TODOS_SITIOS_DOBRA) base[s.chave] = dados?.[s.chave] ?? "";
    for (const c of CAMPOS_CIRCUNFERENCIA) base[c.chave] = dados?.[c.chave] ?? "";
    return base;
  });
  const { salvar, salvando, ok } = useSalvarSecao(pacienteId, "fisica");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));

  const idadeNum = paraNumero(d.idade);
  const sexoNorm = sexoNormalizado(d.sexo);

  // Só o que foi alterado manualmente é guardado - o automático segue o cadastro.
  function salvarFisica() {
    const { idade, sexo, ...resto } = d;
    const idadeManual = idade && idade !== String(idadeAuto) ? idade : "";
    const sexoManual = sexo && sexo !== sexoAuto ? sexo : "";
    return salvar({ ...resto, idade_manual: idadeManual, sexo_manual: sexoManual }).then(onSalvo);
  }

  // ---- IMC ----
  const peso = paraNumero(d.peso_kg);
  const altura = paraNumero(d.altura_cm);
  const imc = peso && altura ? peso / Math.pow(altura / 100, 2) : null;
  const classeImc = imc !== null ? classificarIMC(imc) : null;

  // ---- RCQ e expansibilidade ----
  const cintura = paraNumero(d.circ_cintura);
  const quadril = paraNumero(d.circ_quadril);
  const rcq = cintura && quadril ? cintura / quadril : null;
  const classeRcq = rcq !== null ? classificarRCQ(rcq, sexoNorm) : null;
  const expansibilidade = expansibilidadeToracica(d);

  // ---- Composição corporal ----
  const { protocolo: protocoloSugerido, motivo: motivoProtocolo } = sugerirProtocoloDobras(idadeNum);
  const percentualDobrasCalc = calcularPercentualGorduraDobras(d.protocolo_dobras as ProtocoloDobras, d, idadeNum, sexoNorm);
  const percentualBioInformado = paraNumero(d.bio_percentual_gordura);

  const percentualGorduraEncontrado = paraNumero(d.percentual_gordura);
  const faixaIdeal = faixaGorduraSugerida(idadeNum, sexoNorm);
  const percentualIdealSugerido = percentualGorduraIdealSugerido(idadeNum, sexoNorm);
  const percentualIdealEfetivo = paraNumero(d.percentual_gordura_ideal) ?? percentualIdealSugerido;

  const percentualExcedente =
    percentualGorduraEncontrado !== null && percentualIdealEfetivo !== null ? percentualGorduraEncontrado - percentualIdealEfetivo : null;

  const pesoGorduraTotalKg = peso !== null && percentualGorduraEncontrado !== null ? (peso * percentualGorduraEncontrado) / 100 : null;
  const massaMagraKg = peso !== null && pesoGorduraTotalKg !== null ? peso - pesoGorduraTotalKg : null;
  const gorduraExcedenteKg = peso !== null && percentualExcedente !== null ? Math.max(0, (peso * percentualExcedente) / 100) : null;

  const massaMagraIdealSugerida = peso !== null && percentualIdealSugerido !== null ? peso * (1 - percentualIdealSugerido / 100) : null;
  const massaMagraIdealEfetiva = paraNumero(d.massa_magra_ideal_kg) ?? massaMagraIdealSugerida;
  const carenciaMuscularKg =
    massaMagraIdealEfetiva !== null && massaMagraKg !== null ? Math.max(0, massaMagraIdealEfetiva - massaMagraKg) : null;

  const pesoIdealKg =
    massaMagraKg !== null && percentualIdealEfetivo !== null && percentualIdealEfetivo < 100
      ? massaMagraKg / (1 - percentualIdealEfetivo / 100)
      : null;

  const sitiosProtocolo =
    d.protocolo_dobras === "jp3"
      ? sexoNorm !== "desconhecido"
        ? SITIOS_JP3[sexoNorm]
        : []
      : d.protocolo_dobras === "jp7"
        ? SITIOS_JP7
        : d.protocolo_dobras === "faulkner4"
          ? SITIOS_FAULKNER
          : [];
  const chavesProtocolo = new Set(sitiosProtocolo.map((s) => s.chave));

  // ---- Massa magra relativa por região ----
  const linhasMagra = useMemo(() => calcularMassaMagraRelativa(d), [d]);

  const linhasAvatar = useMemo(() => {
    const circ = (k: string) => paraNumero(d[k]);
    const um = (k: string) => (circ(k) !== null ? [`${f1(circ(k))} cm`] : []);
    const par = (a: string, b: string) => (circ(a) !== null || circ(b) !== null ? [`D ${f1(circ(a))} · E ${f1(circ(b))} cm`] : []);
    const magra = (idD: string, idE?: string) => {
      const a = linhasMagra.find((l) => l.regiao.id === idD)?.corrigida ?? null;
      if (!idE) return a !== null ? [`massa magra rel. ${f1(a)} cm`] : [];
      const b = linhasMagra.find((l) => l.regiao.id === idE)?.corrigida ?? null;
      return a !== null || b !== null ? [`mag. rel. D ${f1(a)} · E ${f1(b)}`] : [];
    };
    const nivelCoxa = NIVEIS_COXA.find((n) => n.value === d.coxa_nivel)?.label;
    return {
      ombro: um("circ_ombro"),
      peitoral: [...um("circ_peitoral"), ...magra("peitoral")],
      cintura: [...um("circ_cintura"), ...magra("cintura")],
      abdomen: [...um("circ_abdomen"), ...magra("abdomen")],
      quadril: um("circ_quadril"),
      braco: [...par("circ_braco_d", "circ_braco_e"), ...magra("braco_d_triceps", "braco_e_triceps")],
      antebraco: par("circ_antebraco_d", "circ_antebraco_e"),
      coxa: [...par("circ_coxa_d", "circ_coxa_e"), ...(nivelCoxa ? [`nível ${nivelCoxa.toLowerCase()}`] : []), ...magra("coxa_d", "coxa_e")],
      panturrilha: [...par("circ_panturrilha_d", "circ_panturrilha_e"), ...magra("panturrilha_d", "panturrilha_e")],
    } as Record<string, string[]>;
  }, [d, linhasMagra]);

  const dicaIdade =
    idadeAuto === null
      ? d.idade
        ? "Informada manualmente (o cadastro não tem data de nascimento)."
        : "Cadastro sem data de nascimento - preencha manualmente."
      : d.idade === String(idadeAuto)
        ? "Preenchida automaticamente a partir do cadastro (data de nascimento)."
        : `Ajustada manualmente (cadastro indica ${idadeAuto}).`;
  const dicaSexo =
    sexoAuto === "desconhecido"
      ? d.sexo
        ? "Informado manualmente (a anamnese não tem sexo)."
        : "Anamnese sem sexo informado - selecione manualmente."
      : d.sexo === sexoAuto
        ? "Preenchido automaticamente a partir da anamnese."
        : `Ajustado manualmente (anamnese indica ${sexoAuto}).`;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
      <div>
        <h3 className="font-display text-lg text-ink mb-1">Sinais vitais</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
          <NumField label="PA sistólica" suffix="mmHg" value={d.pa_sistolica} onChange={(v) => set("pa_sistolica", v)} />
          <NumField label="PA diastólica" suffix="mmHg" value={d.pa_diastolica} onChange={(v) => set("pa_diastolica", v)} />
          <NumField label="FC de repouso" suffix="bpm" value={d.fc_repouso} onChange={(v) => set("fc_repouso", v)} />
          <NumField label="SpO2" suffix="%" value={d.spo2} onChange={(v) => set("spo2", v)} />
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg text-ink mb-1">Antropometria</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
          <Field label="Idade (anos)" hint={dicaIdade}>
            <TextInput inputMode="numeric" value={d.idade} onChange={(e) => set("idade", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <div>
            <SelectField
              label="Sexo"
              value={d.sexo}
              onChange={(v) => set("sexo", v)}
              opcoes={[
                { value: "masculino", label: "Masculino" },
                { value: "feminino", label: "Feminino" },
              ]}
            />
            <p className="text-xs text-muted mt-1">{dicaSexo}</p>
          </div>
          <div className="hidden sm:block" />
          <NumField label="Peso" suffix="kg" value={d.peso_kg} onChange={(v) => set("peso_kg", v)} />
          <NumField label="Altura" suffix="cm" value={d.altura_cm} onChange={(v) => set("altura_cm", v)} />
          <ValorCalculado label="IMC (calculado)" valor={imc !== null ? imc.toFixed(1) : null}>
            {classeImc && (
              <div className="mt-1.5">
                <Selo tom={TOM_IMC[classeImc.chave]}>{classeImc.rotulo}</Selo>
              </div>
            )}
          </ValorCalculado>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-1">Circunferências</h3>
        <p className="text-xs text-muted mb-3">Medidas em cm. As do tronco ficam abaixo; braços, antebraços, coxas e panturrilhas têm lado direito e esquerdo.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {CIRC_TRONCO.map((c) => (
            <div key={c.chave} className="contents">
              <NumField label={c.rotulo} suffix="cm" value={d[c.chave]} onChange={(v) => set(c.chave, v)} />
              {c.chave === "circ_torax_insp_min" && (
                <ValorCalculado label="Expansibilidade torácica (máx − mín)" valor={expansibilidade !== null ? `${expansibilidade.toFixed(1)} cm` : null} />
              )}
            </div>
          ))}
          <ValorCalculado label="RCQ - relação cintura/quadril (calculado)" valor={rcq !== null ? rcq.toFixed(2) : null}>
            {rcq !== null && classeRcq === "adequado" && (
              <div className="mt-1.5 space-y-1">
                <Selo tom="ok">Risco adequado</Selo>
                <p className="text-xs text-muted">Abaixo do corte da OMS para o sexo informado.</p>
              </div>
            )}
            {rcq !== null && classeRcq === "aumentado" && (
              <div className="mt-1.5 space-y-1">
                <Selo tom="alerta">Risco cardiometabólico aumentado</Selo>
                <p className="text-xs text-muted">No ou acima do corte da OMS para o sexo informado.</p>
              </div>
            )}
            {rcq !== null && classeRcq === null && (
              <div className="mt-1.5 space-y-1">
                <Selo tom="neutro">Sexo não informado</Selo>
                <p className="text-xs text-muted">Informe o sexo acima para aplicar o corte da OMS.</p>
              </div>
            )}
          </ValorCalculado>
        </div>

        <div className="overflow-x-auto mt-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-2 font-medium">Segmento</th>
                <th className="py-2 px-2 font-medium">Direito (cm)</th>
                <th className="py-2 px-2 font-medium">Esquerdo (cm)</th>
              </tr>
            </thead>
            <tbody>
              {CIRC_MEMBROS.map((m) => (
                <Fragment key={m.id}>
                  <tr className="border-b border-border last:border-0">
                    <td className="py-2 pr-2 text-ink">{m.rotulo}</td>
                    {(["d", "e"] as const).map((lado) => (
                      <td key={lado} className="py-2 px-2">
                        <TextInput
                          inputMode="decimal"
                          value={d[`circ_${m.id}_${lado}`]}
                          onChange={(e) => set(`circ_${m.id}_${lado}`, normalizarDecimal(e.target.value))}
                          className="max-w-[7rem]"
                          aria-label={`${m.rotulo} ${m.feminino ? (lado === "d" ? "direita" : "esquerda") : lado === "d" ? "direito" : "esquerdo"}`}
                        />
                      </td>
                    ))}
                  </tr>
                  {m.id === "coxa" && (
                    <tr className="border-b border-border">
                      <td className="py-2 pr-2 text-muted text-xs align-top">Nível da coxa</td>
                      <td colSpan={2} className="py-2 px-2">
                        <div className="max-w-md">
                          <CheckboxGroup
                            columns={3}
                            options={NIVEIS_COXA.map((n) => n.label)}
                            values={NIVEIS_COXA.filter((n) => n.value === d.coxa_nivel).map((n) => n.label)}
                            onChange={(marcados) => {
                              const atual = NIVEIS_COXA.find((n) => n.value === d.coxa_nivel)?.label;
                              const novo = marcados.find((m) => m !== atual);
                              set("coxa_nivel", NIVEIS_COXA.find((n) => n.label === novo)?.value ?? "");
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-1">Dobras cutâneas</h3>
        <p className="text-xs text-muted mb-3">
          Sugestão para este paciente: <strong>{protocoloSugerido === "jp3" ? "3 dobras (Jackson & Pollock)" : "7 dobras (Jackson & Pollock)"}</strong> — {motivoProtocolo} Meça quantas dobras quiser; o %G automático só é calculado para os protocolos de 3 ou 7 dobras (Pollock) e 4 dobras (Faulkner).
        </p>
        <div className="mb-4 max-w-sm">
          <SelectField
            label="Protocolo usado nesta coleta"
            value={d.protocolo_dobras}
            onChange={(v) => set("protocolo_dobras", v)}
            opcoes={[
              { value: "jp3", label: "Jackson & Pollock - 3 dobras" },
              { value: "jp7", label: "Jackson & Pollock - 7 dobras" },
              { value: "faulkner4", label: "Faulkner - 4 dobras" },
              { value: "outro", label: "Outro protocolo (informar %G manualmente)" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {TODOS_SITIOS_DOBRA.map((s) => (
            <NumField
              key={s.chave}
              label={chavesProtocolo.has(s.chave) ? `${s.rotulo} ★` : s.rotulo}
              suffix="mm"
              value={d[s.chave]}
              onChange={(v) => set(s.chave, v)}
            />
          ))}
        </div>
        {(d.protocolo_dobras === "jp3" || d.protocolo_dobras === "jp7" || d.protocolo_dobras === "faulkner4") && (
          <div className="mt-3 rounded-lg bg-bg p-3 text-sm flex items-center justify-between gap-3">
            <span>
              %G calculado por dobras (
              {d.protocolo_dobras === "jp3" ? "3 sítios, Pollock" : d.protocolo_dobras === "jp7" ? "7 sítios, Pollock" : "4 sítios, Faulkner"}
              ):{" "}
              <strong className="font-mono">
                {percentualDobrasCalc !== null ? `${percentualDobrasCalc.toFixed(1)}%` : "— faltam dobras, idade ou sexo"}
              </strong>
            </span>
            {percentualDobrasCalc !== null && (
              <button
                type="button"
                onClick={() => {
                  set("percentual_gordura", percentualDobrasCalc.toFixed(1));
                  set("protocolo_referencia_gordura", "dobras");
                }}
                className="text-xs font-medium text-accent hover:underline whitespace-nowrap"
              >
                usar como %G de referência
              </button>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-1">Bioimpedância</h3>
        <p className="text-xs text-muted mb-3">Preencha se este paciente também (ou apenas) usa bioimpedância - pode usar os dois métodos juntos.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Aparelho/modelo">
            <TextInput value={d.bio_aparelho} onChange={(e) => set("bio_aparelho", e.target.value)} placeholder="Opcional" />
          </Field>
          <NumField label="% de gordura (bioimpedância)" value={d.bio_percentual_gordura} onChange={(v) => set("bio_percentual_gordura", v)} />
          <NumField label="Massa magra" suffix="kg" value={d.bio_massa_magra_kg} onChange={(v) => set("bio_massa_magra_kg", v)} />
          <NumField label="Massa gorda" suffix="kg" value={d.bio_massa_gorda_kg} onChange={(v) => set("bio_massa_gorda_kg", v)} />
          <NumField label="Água corporal" suffix="%" value={d.bio_agua_corporal_pct} onChange={(v) => set("bio_agua_corporal_pct", v)} />
        </div>
        {percentualBioInformado !== null && (
          <div className="mt-3 rounded-lg bg-bg p-3 text-sm flex items-center justify-between gap-3">
            <span>
              %G informado pela bioimpedância: <strong className="font-mono">{percentualBioInformado.toFixed(1)}%</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                set("percentual_gordura", percentualBioInformado.toFixed(1));
                set("protocolo_referencia_gordura", "bioimpedancia");
              }}
              className="text-xs font-medium text-accent hover:underline whitespace-nowrap"
            >
              usar como %G de referência
            </button>
          </div>
        )}
        {d.bio_percentual_gordura && percentualBioInformado === null && (
          <p className="mt-2 text-xs text-danger">Valor não reconhecido - digite apenas números (ex.: 18,5).</p>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-1">Composição corporal - resultado de referência</h3>
        <p className="text-xs text-muted mb-3">
          Declare aqui qual %G está valendo para esta avaliação (dobras, bioimpedância, média dos dois, ou outro
          protocolo externo) - os botões "usar" acima preenchem automaticamente, mas o campo sempre pode ser
          digitado/ajustado.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <SelectField
            label="Protocolo de referência usado"
            value={d.protocolo_referencia_gordura}
            onChange={(v) => set("protocolo_referencia_gordura", v)}
            opcoes={[
              { value: "dobras", label: "Dobras cutâneas" },
              { value: "bioimpedancia", label: "Bioimpedância" },
              { value: "media", label: "Média dos dois" },
              { value: "outro", label: "Outro / clínico externo" },
            ]}
          />
          <NumField label="%G encontrado (referência)" value={d.percentual_gordura} onChange={(v) => set("percentual_gordura", v)} />
          <CampoComSugestao
            label="%G ideal"
            value={d.percentual_gordura_ideal}
            onChange={(v) => set("percentual_gordura_ideal", v)}
            sugestao={percentualIdealSugerido}
            sufixo={faixaIdeal ? `% (faixa saudável ${faixaIdeal[0]}-${faixaIdeal[1]}%)` : "%"}
          />
          <ValorCalculado label="%G excedente" valor={percentualExcedente !== null ? `${percentualExcedente.toFixed(1)}%` : null} />
          <ValorCalculado label="Peso de gordura total" valor={pesoGorduraTotalKg !== null ? `${pesoGorduraTotalKg.toFixed(1)} kg` : null} />
          <ValorCalculado label="Gordura excedente" valor={gorduraExcedenteKg !== null ? `${gorduraExcedenteKg.toFixed(1)} kg` : null} />
          <ValorCalculado label="Massa magra" valor={massaMagraKg !== null ? `${massaMagraKg.toFixed(1)} kg` : null} />
          <CampoComSugestao
            label="Massa magra ideal"
            value={d.massa_magra_ideal_kg}
            onChange={(v) => set("massa_magra_ideal_kg", v)}
            sugestao={massaMagraIdealSugerida}
            sufixo=" kg (peso atual com o %G ideal sugerido)"
          />
          <ValorCalculado label="Carência muscular" valor={carenciaMuscularKg !== null ? `${carenciaMuscularKg.toFixed(1)} kg` : null} />
          <ValorCalculado label="Peso ideal" valor={pesoIdealKg !== null ? `${pesoIdealKg.toFixed(1)} kg` : null} />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-1">Medidas regionais - massa magra relativa</h3>
        <p className="text-xs text-muted mb-3">
          Calculada automaticamente: circunferência − π × dobra cutânea (dobra em cm), isto é, a circunferência
          "descontando" a gordura subcutânea daquela região. Usa as circunferências acima e as dobras da seção de
          dobras cutâneas (a dobra é registrada uma vez e vale para os dois lados). Na aba Reavaliação, cada região
          mostra se a circunferência mudou por perda de gordura ou por ganho de massa magra.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-2 pr-2 font-medium">Região</th>
                <th className="py-2 px-2 font-medium">Circunferência (cm)</th>
                <th className="py-2 px-2 font-medium">Dobra usada</th>
                <th className="py-2 px-2 font-medium">Massa magra relativa (cm)</th>
                <th className="py-2 px-2 font-medium min-w-[11rem]">Composição da circunferência</th>
              </tr>
            </thead>
            <tbody>
              {linhasMagra.map((l) => {
                const gorduraCm = l.circ !== null && l.corrigida !== null ? l.circ - l.corrigida : null;
                const pctGordura = gorduraCm !== null && l.circ !== null && l.circ > 0 ? Math.min(100, Math.max(0, (gorduraCm / l.circ) * 100)) : null;
                return (
                  <tr key={l.regiao.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-2 text-ink">{l.regiao.rotulo}</td>
                    <td className="py-2 px-2 font-mono tabular-nums text-muted">{f1(l.circ)}</td>
                    <td className="py-2 px-2 font-mono tabular-nums text-muted">
                      {l.dobra !== null ? `${f1(l.dobra)} mm` : "–"} <span className="font-sans text-xs">({l.regiao.dobraRotulo})</span>
                    </td>
                    <td className="py-2 px-2 font-mono tabular-nums font-semibold text-accent-dark">{f1(l.corrigida)}</td>
                    <td className="py-2 px-2">
                      {pctGordura !== null && gorduraCm !== null ? (
                        <div
                          title={`Massa magra relativa ${f1(l.corrigida)} cm (${(100 - pctGordura).toFixed(0)}%) · gordura subcutânea ${gorduraCm.toFixed(1)} cm (${pctGordura.toFixed(0)}%)`}
                        >
                          <div className="flex h-3 w-full overflow-hidden rounded-full border border-border bg-bg">
                            <div className="bg-accent" style={{ width: `${100 - pctGordura}%` }} />
                            <div className="bg-warn" style={{ width: `${pctGordura}%` }} />
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted tabular-nums">
                            {(100 - pctGordura).toFixed(0)}% magra · {pctGordura.toFixed(0)}% gordura ({gorduraCm.toFixed(1)} cm)
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent" /> massa magra relativa
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-warn" /> gordura subcutânea (π × dobra)
          </span>
        </p>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-3">Avatar - resumo visual por região</h3>
        <AvatarCorporal linhas={linhasAvatar} />
      </div>

      <Field label="Observações do avaliador">
        <TextArea value={d.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </Field>

      <SalvarBar salvando={salvando} ok={ok} onSalvar={salvarFisica} />
    </div>
  );
}
