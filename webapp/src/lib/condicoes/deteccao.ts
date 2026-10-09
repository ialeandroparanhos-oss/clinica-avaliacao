// Lê a anamnese e aponta quais condições do catálogo o paciente relatou, e onde (campo de texto, PAR-Q+,
// triagem de risco cardiovascular, saúde mental). É uma ajuda de leitura: o avaliador confere.

import type { PacienteRow } from "@/lib/anamnese/types";
import { mesclarComPadrao } from "@/lib/anamnese/defaults";
import { condicoesNoTexto, normalizar } from "@/lib/condicoes/catalogo";

export type CondicaoDetectada = { id: string; origens: string[] };
export type TermoNaoReconhecido = { texto: string; campo: string };
export type ResultadoDeteccao = {
  condicoes: CondicaoDetectada[];
  naoReconhecidos: TermoNaoReconhecido[];
  medicamentos: string[];
};

export function condicoesDoPaciente(paciente: PacienteRow): ResultadoDeteccao {
  const a = mesclarComPadrao(paciente.anamnese);
  const mapa = new Map<string, Set<string>>();
  const naoReconhecidos: TermoNaoReconhecido[] = [];
  const marca = (id: string, origem: string) => {
    if (!mapa.has(id)) mapa.set(id, new Set());
    mapa.get(id)!.add(origem);
  };

  // Campos de texto livre. Os dois primeiros também geram a lista de termos não reconhecidos.
  const campos: { rotulo: string; texto: string; listar: boolean }[] = [
    { rotulo: "Doenças", texto: a.historico_saude.doencas, listar: true },
    { rotulo: "Outras condições", texto: a.historico_saude.outras_condicoes, listar: true },
    { rotulo: "Lesões e fraturas", texto: a.historico_saude.lesoes_fraturas, listar: false },
    { rotulo: "Cirurgias", texto: a.historico_saude.cirurgias, listar: false },
    { rotulo: "Hospitalizações", texto: a.historico_saude.hospitalizacoes, listar: false },
    { rotulo: "Acompanhamento médico", texto: a.historico_saude.acompanhamento_medico, listar: false },
    { rotulo: "PAR-Q+: outro motivo", texto: a.prontidao.other_reason_detalhe, listar: false },
    ...a.medicamentos.lista.map((m) => ({ rotulo: `Medicamento (${m.nome || "sem nome"})`, texto: `${m.motivo} ${m.nome}`, listar: false })),
  ];
  for (const c of campos) {
    for (const id of condicoesNoTexto(c.texto)) marca(id, c.rotulo);
    if (c.listar && c.texto.trim()) {
      for (const parte of c.texto.split(/[,;\n/]+|\s+e\s+/i).map((p) => p.trim()).filter((p) => normalizar(p).length >= 3)) {
        if (condicoesNoTexto(parte).length === 0) naoReconhecidos.push({ texto: parte, campo: c.rotulo });
      }
    }
  }

  // Respostas estruturadas.
  if (a.prontidao.parq.heart_condition === true) marca("cardiopatia", "PAR-Q+: problema cardíaco");
  if (a.prontidao.parq.bp_or_heart_med === true) marca("hipertensao", "PAR-Q+: usa remédio para pressão ou coração (confirmar a causa)");
  if (a.risco_cardiovascular.colesterol_alto_ou_usa_estatina === true) marca("dislipidemia", "Triagem: colesterol alto ou estatina");
  if (a.risco_cardiovascular.glicemia_alterada_ou_diabetes === true) marca("diabetes", "Triagem: glicemia alterada ou diabetes");
  const sm = a.saude_mental.sinalizacao;
  if (sm === "sim" || sm === "um_pouco") marca("saude_mental", `Pergunta de bem-estar emocional: "${sm === "sim" ? "sim" : "um pouco"}"`);

  const condicoes = Array.from(mapa.entries()).map(([id, o]) => ({ id, origens: Array.from(o) }));
  const medicamentos = a.medicamentos.lista.map((m) => [m.nome, m.dose].filter(Boolean).join(" ")).filter(Boolean);
  return { condicoes, naoReconhecidos, medicamentos };
}
