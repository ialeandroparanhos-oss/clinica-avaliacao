// "Anamnese na clínica": o avaliador cadastra (ou escolhe) um paciente e abre o MESMO questionário que o
// paciente responderia em casa, já identificado, para fazer a anamnese junto com ele. A passagem entre a área
// do avaliador e o questionário é feita pelo sessionStorage da aba (some ao fechar a aba) e não grava nada
// além do que o próprio questionário já grava.

export const CHAVE_ANAMNESE_CLINICA = "anamnese_na_clinica";

export type SolicitacaoClinica = {
  nome: string;
  dataNascimento: string; // AAAA-MM-DD
  sexo?: string | null;
  telefone?: string | null;
  voltarPara: string; // rota da ficha do paciente na área do avaliador
};

export function guardarSolicitacaoClinica(s: SolicitacaoClinica): void {
  try {
    sessionStorage.setItem(CHAVE_ANAMNESE_CLINICA, JSON.stringify(s));
  } catch {}
}

export function lerSolicitacaoClinica(): SolicitacaoClinica | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_ANAMNESE_CLINICA);
    if (!bruto) return null;
    const s = JSON.parse(bruto);
    if (typeof s?.nome === "string" && typeof s?.dataNascimento === "string" && typeof s?.voltarPara === "string" && s.voltarPara.startsWith("/avaliador/")) {
      return s as SolicitacaoClinica;
    }
  } catch {}
  return null;
}

export function limparSolicitacaoClinica(): void {
  try {
    sessionStorage.removeItem(CHAVE_ANAMNESE_CLINICA);
  } catch {}
}

// Mesma regra do banco para achar o mesmo paciente: sem acento, minúsculas, só letras e números.
export function nomeNormalizado(nome: string): string {
  return (nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
