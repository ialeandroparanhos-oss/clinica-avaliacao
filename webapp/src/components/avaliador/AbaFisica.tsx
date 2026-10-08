"use client";

// Aba Física e Antropométrica (Agente 3 - Marco).

import { Fragment, useMemo, useState } from "react";
import type { PacienteRow } from "@/lib/anamnese/types";
import { Field, TextArea, TextInput } from "@/components/forms";
import { CampoComSugestao, NumField, SalvarBar, SelectField, Selo, ValorCalculado, useAutoSalvar, useSalvarSecao, type TomSelo } from "./campos";
import { PainelParecer, lerParecer, type ParecerSalvo } from "./PainelParecer";
import { gerarParecerAgente, type EstiloParecer } from "@/lib/avaliacao/pareceres";
import { AvatarCorporal } from "./AvatarCorporal";
import { normalizarDecimal, paraNumero } from "@/lib/numeros";
import {
  SITIOS_FAULKNER,
  SITIOS_JP3,
  SITIOS_JP7,
  TODOS_SITIOS_DOBRA,
  calcularPercentualGorduraDobras,
  CORTES_CIRC_ABDOMINAL,
  classificarCircAbdominal,
  classificarIMC,
  classificarRCEst,
  classificarRCQ,
  confirmarAdiposidade,
  faixaGorduraSugerida,
  percentualGorduraIdealSugerido,
  relacaoCinturaEstatura,
  sexoNormalizado,
  sugerirProtocoloDobras,
  type ClasseCircAbdominal,
  type ClasseIMC,
  type ProtocoloDobras,
  type SexoComp,
} from "@/lib/avaliacao/composicaoCorporal";
import {
  CAMPOS_CIRCUNFERENCIA,
  CIRC_MEMBROS,
  CIRC_TRONCO,
  LIMITE_ASSIMETRIA_PCT,
  NIVEIS_COXA,
  assimetriaLados,
  calcularMassaMagraRelativa,
  circunferenciaCoxaPrincipal,
  expansibilidadeToracica,
} from "@/lib/avaliacao/medidasRegionais";
import { idadeAutomatica, sexoAutomatico } from "@/lib/avaliacao/identificacao";
import { EscolhaMultipla } from "./cliques";

const TOM_IMC: Record<ClasseIMC, TomSelo> = {
  baixo_peso: "info",
  eutrofia: "ok",
  sobrepeso: "atencao",
  obesidade_1: "alerta",
  obesidade_2: "perigo",
  obesidade_3: "critico",
};

const f1 = (n: number | null) => (n === null ? "–" : n.toFixed(1));

// Selo do corte da circunferência da cintura/abdômen (OMS), com os cortes do sexo.
function SeloCircAbdominal({ classe, sexo, umbilical, temValor }: { classe: ClasseCircAbdominal | null; sexo: SexoComp; umbilical: boolean; temValor: boolean }) {
  if (!temValor) return null;
  if (sexo === "desconhecido" || classe === null) {
    return (
      <p className="mt-1.5 text-xs text-muted">
        <Selo tom="neutro">Sexo não informado</Selo> Informe o sexo acima para aplicar o corte da OMS.
      </p>
    );
  }
  const c = CORTES_CIRC_ABDOMINAL[sexo];
  const tom: TomSelo = classe === "adequado" ? "ok" : classe === "aumentado" ? "atencao" : "alerta";
  const texto = classe === "adequado" ? "Abaixo do corte" : classe === "aumentado" ? "Risco aumentado" : "Risco muito aumentado";
  return (
    <div className="mt-1.5 space-y-1">
      <Selo tom={tom}>{texto}</Selo>
      <p className="text-xs text-muted">
        Corte OMS ({sexo === "masculino" ? "homem" : "mulher"}): ≥ {c.aumentado} cm aumentado · ≥ {c.muitoAumentado} cm muito aumentado.
        {umbilical && " Definido para a cintura; a medida no umbigo costuma ser maior."}
      </p>
    </div>
  );
}

// Diferença entre o lado direito e o esquerdo de um segmento.
function CelulaDiferenca({ direito, esquerdo }: { direito: string; esquerdo: string }) {
  const a = assimetriaLados(paraNumero(direito), paraNumero(esquerdo));
  if (!a) return <span className="text-muted">–</span>;
  const alta = a.pct >= LIMITE_ASSIMETRIA_PCT;
  return (
    <div className="space-y-0.5 min-w-[9rem]">
      <p className="text-xs tabular-nums text-ink leading-snug">
        {a.maior === "igual" ? "iguais" : `${a.maior} maior em ${a.difCm.toFixed(1)} cm`} <span className="text-muted">({a.pct.toFixed(1)}%)</span>
      </p>
      {alta && <Selo tom="atencao">Diferença ≥ {LIMITE_ASSIMETRIA_PCT}%</Selo>}
    </div>
  );
}

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
    // Ficha antiga: um nível só (coxa_nivel) com o valor no campo único da coxa.
    // Leva o valor para o campo do nível correspondente.
    const nivelLegado = dados?.coxa_nivel;
    if (nivelLegado && !Array.isArray(dados?.coxa_niveis)) {
      for (const lado of ["d", "e"]) {
        const chaveNivel = `circ_coxa_${nivelLegado}_${lado}`;
        if (chaveNivel in base && !base[chaveNivel] && dados?.[`circ_coxa_${lado}`]) base[chaveNivel] = String(dados[`circ_coxa_${lado}`]);
      }
    }
    return base;
  });
  // Níveis da coxa em que houve medida (um, dois ou os três). Fichas antigas
  // tinham um só nível (coxa_nivel).
  const [niveisCoxa, setNiveisCoxa] = useState<string[]>(() =>
    Array.isArray(dados?.coxa_niveis) ? dados.coxa_niveis : dados?.coxa_nivel ? [dados.coxa_nivel] : []
  );
  const [parecer, setParecer] = useState<ParecerSalvo | null>(() => lerParecer(dados?.parecer));
  const { salvar, salvando, ok, rascunho } = useSalvarSecao(pacienteId, "fisica");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));

  const idadeNum = paraNumero(d.idade);
  const sexoNorm = sexoNormalizado(d.sexo);

  // Dados com a coxa "principal" (médio > proximal > distal > valor antigo) nos
  // campos circ_coxa_d/e - é o que alimenta a massa magra relativa, o avatar e o
  // histórico, que continuam lendo um único valor por lado.
  const coxaD = circunferenciaCoxaPrincipal(d, "d");
  const coxaE = circunferenciaCoxaPrincipal(d, "e");
  const dDeriv = useMemo<Record<string, string>>(
    () => ({
      ...d,
      circ_coxa_d: coxaD.valor !== null ? String(coxaD.valor) : d.circ_coxa_d,
      circ_coxa_e: coxaE.valor !== null ? String(coxaE.valor) : d.circ_coxa_e,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d]
  );

  // Só o que foi alterado manualmente é guardado - o automático segue o cadastro.
  function montarDadosFisica() {
    const { idade, sexo, ...resto } = d;
    const idadeManual = idade && idade !== String(idadeAuto) ? idade : "";
    const sexoManual = sexo && sexo !== sexoAuto ? sexo : "";
    return {
      ...resto,
      circ_coxa_d: dDeriv.circ_coxa_d,
      circ_coxa_e: dDeriv.circ_coxa_e,
      coxa_niveis: niveisCoxa,
      coxa_nivel: coxaD.nivel ?? coxaE.nivel ?? niveisCoxa[0] ?? "",
      idade_manual: idadeManual,
      sexo_manual: sexoManual,
      parecer,
    };
  }
  const dadosAtuais = montarDadosFisica();
  const salvarFisica = () => salvar(dadosAtuais).then(onSalvo);
  const estadoAuto = useAutoSalvar(dadosAtuais, rascunho);
  const gerarParecerFisica = (estilo: EstiloParecer) => gerarParecerAgente("fisica", { ...paciente, fisica: { ...dadosAtuais, parecer: undefined } }, estilo);

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
  const abdomenCm = paraNumero(d.circ_abdomen);
  const classeCintura = cintura !== null ? classificarCircAbdominal(cintura, sexoNorm) : null;
  const classeAbdomen = abdomenCm !== null ? classificarCircAbdominal(abdomenCm, sexoNorm) : null;
  const rcest = relacaoCinturaEstatura(cintura, altura);
  const classeRcest = rcest !== null ? classificarRCEst(rcest) : null;
  const adiposidade = confirmarAdiposidade({ imc, cinturaCm: cintura, rcq, rcest, sexo: sexoNorm });
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
  const linhasMagra = useMemo(() => calcularMassaMagraRelativa(dDeriv), [dDeriv]);

  const linhasAvatar = useMemo(() => {
    const circ = (k: string) => paraNumero(dDeriv[k]);
    const um = (k: string) => (circ(k) !== null ? [`${f1(circ(k))} cm`] : []);
    const par = (a: string, b: string) => (circ(a) !== null || circ(b) !== null ? [`D ${f1(circ(a))} · E ${f1(circ(b))} cm`] : []);
    const magra = (idD: string, idE?: string) => {
      const a = linhasMagra.find((l) => l.regiao.id === idD)?.corrigida ?? null;
      if (!idE) return a !== null ? [`massa magra rel. ${f1(a)} cm`] : [];
      const b = linhasMagra.find((l) => l.regiao.id === idE)?.corrigida ?? null;
      return a !== null || b !== null ? [`mag. rel. D ${f1(a)} · E ${f1(b)}`] : [];
    };
    // Coxa: um resumo por nível medido (proximal/médio/distal), D e E.
    const coxaPorNivel = NIVEIS_COXA.filter((n) => niveisCoxa.includes(n.value)).flatMap((n) => {
      const dir = circ(`circ_coxa_${n.value}_d`);
      const esq = circ(`circ_coxa_${n.value}_e`);
      return dir !== null || esq !== null ? [`${n.label.toLowerCase()}: D ${f1(dir)} · E ${f1(esq)} cm`] : [];
    });
    return {
      ombro: um("circ_ombro"),
      peitoral: [...um("circ_peitoral"), ...magra("peitoral")],
      cintura: [...um("circ_cintura"), ...magra("cintura")],
      abdomen: [...um("circ_abdomen"), ...magra("abdomen")],
      quadril: um("circ_quadril"),
      braco: [...par("circ_braco_d", "circ_braco_e"), ...magra("braco_d_triceps", "braco_e_triceps")],
      antebraco: par("circ_antebraco_d", "circ_antebraco_e"),
      coxa: [...(coxaPorNivel.length > 0 ? coxaPorNivel : par("circ_coxa_d", "circ_coxa_e")), ...magra("coxa_d", "coxa_e")],
      panturrilha: [...par("circ_panturrilha_d", "circ_panturrilha_e"), ...magra("panturrilha_d", "panturrilha_e")],
    } as Record<string, string[]>;
  }, [dDeriv, linhasMagra, niveisCoxa]);

  // Uma linha da tabela de segmentos: D, E e a diferença entre os lados.
  function linhaMembro(chaveD: string, chaveE: string, rotulo: string, rotuloAria: string, feminino: boolean) {
    return (
      <tr key={chaveD} className="border-b border-border last:border-0">
        <td className="py-2 pr-2 text-ink">{rotulo}</td>
        {([chaveD, chaveE] as const).map((chave, i) => (
          <td key={chave} className="py-2 px-2">
            <TextInput
              inputMode="decimal"
              value={d[chave]}
              onChange={(e) => set(chave, normalizarDecimal(e.target.value))}
              className="max-w-[7rem]"
              aria-label={`${rotuloAria} ${feminino ? (i === 0 ? "direita" : "esquerda") : i === 0 ? "direito" : "esquerdo"}`}
            />
          </td>
        ))}
        <td className="py-2 px-2 align-middle">
          <CelulaDiferenca direito={d[chaveD]} esquerdo={d[chaveE]} />
        </td>
      </tr>
    );
  }

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
            {adiposidade && (
              <p className="mt-1.5 text-xs text-muted">
                {adiposidade.estado === "confirmada" && <>Adiposidade central confirmada por: {adiposidade.criterios.join("; ")}.</>}
                {adiposidade.estado === "nao_confirmada" && (
                  <>IMC elevado, mas sem sinal de excesso de adiposidade central ({adiposidade.avaliados.join("; ")}) - pode refletir massa muscular; confirme pelo %G.</>
                )}
                {adiposidade.estado === "sem_medidas" && <>IMC elevado - adiposidade a confirmar: registre a cintura (e quadril) nas circunferências.</>}
              </p>
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
              {c.chave === "circ_cintura" || c.chave === "circ_abdomen" ? (
                <div>
                  <NumField label={c.rotulo} suffix="cm" value={d[c.chave]} onChange={(v) => set(c.chave, v)} />
                  <SeloCircAbdominal classe={c.chave === "circ_cintura" ? classeCintura : classeAbdomen} sexo={sexoNorm} umbilical={c.chave === "circ_abdomen"} temValor={c.chave === "circ_cintura" ? cintura !== null : abdomenCm !== null} />
                </div>
              ) : (
                <NumField label={c.rotulo} suffix="cm" value={d[c.chave]} onChange={(v) => set(c.chave, v)} />
              )}
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
          <ValorCalculado label="RCEst - relação cintura/estatura (calculado)" valor={rcest !== null ? rcest.toFixed(2) : null}>
            {classeRcest === "adequado" && (
              <div className="mt-1.5 space-y-1">
                <Selo tom="ok">Abaixo de 0,5</Selo>
                <p className="text-xs text-muted">Faixa sem risco aumentado (corte do NICE: 0,5).</p>
              </div>
            )}
            {classeRcest === "aumentado" && (
              <div className="mt-1.5 space-y-1">
                <Selo tom="alerta">Risco cardiometabólico aumentado</Selo>
                <p className="text-xs text-muted">0,5 ou mais (corte do NICE). O corte único tende a superestimar o risco em pessoas mais baixas.</p>
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
                <th className="py-2 px-2 font-medium">Diferença D − E</th>
              </tr>
            </thead>
            <tbody>
              {CIRC_MEMBROS.map((m) =>
                m.id === "coxa" ? (
                  <Fragment key={m.id}>
                    <tr className="border-b border-border">
                      <td className="py-2 pr-2 text-ink align-top">Coxa</td>
                      <td colSpan={3} className="py-2 px-2">
                        <p className="text-xs text-muted mb-1.5">Níveis medidos - marque quantos usar (um, dois ou os três):</p>
                        <EscolhaMultipla
                          opcoes={NIVEIS_COXA.map((n) => n.label)}
                          valores={NIVEIS_COXA.filter((n) => niveisCoxa.includes(n.value)).map((n) => n.label)}
                          onChange={(marcados) => setNiveisCoxa(NIVEIS_COXA.filter((n) => marcados.includes(n.label)).map((n) => n.value))}
                        />
                      </td>
                    </tr>
                    {niveisCoxa.length === 0
                      ? linhaMembro("circ_coxa_d", "circ_coxa_e", "Coxa (nível não informado)", "Coxa", true)
                      : NIVEIS_COXA.filter((n) => niveisCoxa.includes(n.value)).map((n) =>
                          linhaMembro(`circ_coxa_${n.value}_d`, `circ_coxa_${n.value}_e`, `Coxa ${n.label.toLowerCase()}`, `Coxa ${n.label.toLowerCase()}`, true)
                        )}
                  </Fragment>
                ) : (
                  linhaMembro(`circ_${m.id}_d`, `circ_${m.id}_e`, m.rotulo, m.rotulo, !!m.feminino)
                )
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          A diferença entre os lados é só informativa: não há corte validado para circunferências; {LIMITE_ASSIMETRIA_PCT}% é uma referência prática de assimetria de membros, e a dominância lateral explica
          parte da diferença (sobretudo nos braços).
        </p>
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
        {(() => {
          // Diferença D − E da massa magra relativa nos segmentos pareados.
          const pares: [string, string, string][] = [
            ["Braço (tríceps)", "braco_d_triceps", "braco_e_triceps"],
            ["Braço (bíceps)", "braco_d_biceps", "braco_e_biceps"],
            ["Coxa", "coxa_d", "coxa_e"],
            ["Panturrilha", "panturrilha_d", "panturrilha_e"],
          ];
          const itens = pares.flatMap(([rotulo, idD, idE]) => {
            const a = assimetriaLados(linhasMagra.find((l) => l.regiao.id === idD)?.corrigida ?? null, linhasMagra.find((l) => l.regiao.id === idE)?.corrigida ?? null);
            return a ? [`${rotulo}: ${a.maior === "igual" ? "iguais" : `${a.maior} maior ${a.difCm.toFixed(1)} cm`} (${a.pct.toFixed(1)}%)`] : [];
          });
          const nivelUsado = coxaD.nivel ?? coxaE.nivel;
          return (
            <>
              {itens.length > 0 && <p className="mt-2 text-xs text-muted">Diferença D − E na massa magra relativa - {itens.join(" · ")}.</p>}
              {nivelUsado && nivelUsado !== "medio" && (
                <p className="mt-1 text-xs text-warn">
                  A coxa usada aqui é a do nível {nivelUsado}, mas a dobra de coxa é do ponto médio: interprete a massa magra relativa da coxa com cautela (meça também o nível médio).
                </p>
              )}
            </>
          );
        })()}
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="font-display text-lg text-ink mb-3">Avatar - resumo visual por região</h3>
        <AvatarCorporal linhas={linhasAvatar} />
      </div>

      <Field label="Observações do avaliador">
        <TextArea value={d.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </Field>

      <PainelParecer titulo="Parecer do Marco" valor={parecer} onChange={setParecer} gerar={gerarParecerFisica} mensagemVazia="Registre peso, altura ou circunferências para o Marco redigir o parecer." />

      <SalvarBar salvando={salvando} ok={ok} onSalvar={salvarFisica} auto={estadoAuto} />
    </div>
  );
}
