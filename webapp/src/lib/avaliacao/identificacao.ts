// Idade e sexo "efetivos" do paciente. Por padrão vêm do cadastro/anamnese
// (data de nascimento e sexo informados na identificação); o avaliador pode
// sobrescrever manualmente na aba Física quando a anamnese não foi
// preenchida ou veio errada. Só o valor manual é guardado (idade_manual /
// sexo_manual) - assim a idade automática continua acompanhando o tempo em
// vez de congelar num valor antigo na reavaliação.

import type { PacienteRow } from "@/lib/anamnese/types";
import { paraNumero } from "@/lib/numeros";
import { sexoNormalizado, type SexoComp } from "./composicaoCorporal";

export function idadeDaDataNascimento(dataNascimento?: string | null, hoje: Date = new Date()): number | null {
  if (!dataNascimento) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataNascimento);
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  let anos = hoje.getFullYear() - ano;
  const aindaNaoFezAniversario = hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia);
  if (aindaNaoFezAniversario) anos--;
  return anos >= 0 && anos < 130 ? anos : null;
}

export function idadeAutomatica(p: PacienteRow): number | null {
  return idadeDaDataNascimento(p.data_nascimento) ?? paraNumero(p.anamnese?.contexto?.idade);
}

export function idadeEfetiva(p: PacienteRow): number | null {
  const manual = paraNumero(p.fisica?.idade_manual);
  return manual !== null && manual > 0 ? manual : idadeAutomatica(p);
}

export function sexoAutomatico(p: PacienteRow): SexoComp {
  return sexoNormalizado(p.sexo);
}

export function sexoEfetivo(p: PacienteRow): SexoComp {
  const manual = sexoNormalizado(p.fisica?.sexo_manual);
  return manual !== "desconhecido" ? manual : sexoAutomatico(p);
}
