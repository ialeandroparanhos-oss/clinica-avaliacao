// Gravação de vídeo direto no aplicativo (câmera do navegador). Funções puras e constantes, sem acesso à câmera,
// para poderem ser testadas. O vídeo gravado segue o mesmo caminho do vídeo enviado: a análise roda neste aparelho e
// o vídeo não vai a nenhum serviço de IA.

export const LIMITE_GRAVACAO_S = 30; // a gravação para sozinha neste tempo
export const MINIMO_GRAVACAO_S = 3; // abaixo disso a análise não tem o que ler
export const CONTAGEM_PADRAO_S = 5; // tempo para o aluno se posicionar depois de tocar em gravar
export const BITRATE_VIDEO = 2_500_000; // ~9 MB em 30 s: cabe folgado no limite de 45 MB do arquivo

// Do mais compatível com a reprodução (MP4) ao mais comum no Chrome (WebM). O Safari grava MP4; o Chrome grava WebM.
export const FORMATOS_PREFERIDOS = [
  "video/mp4;codecs=avc1",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

export function escolherFormato(suporta: (tipo: string) => boolean): string | null {
  for (const t of FORMATOS_PREFERIDOS) {
    try {
      if (suporta(t)) return t;
    } catch {
      // navegador que lança erro para tipo desconhecido: tenta o próximo
    }
  }
  return null;
}

export function extensaoDoFormato(tipo: string | undefined | null): "mp4" | "webm" {
  return (tipo ?? "").toLowerCase().includes("mp4") ? "mp4" : "webm";
}

// Tipo sem os parâmetros de codec ("video/webm;codecs=vp9" vira "video/webm"), como o armazenamento espera.
export function tipoSemCodec(tipo: string | undefined | null): string {
  const base = (tipo ?? "").split(";")[0].trim().toLowerCase();
  return base || "video/webm";
}

export function formatarTempo(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// O navegador consegue abrir a câmera e gravar? (precisa de HTTPS, ou localhost, e de MediaRecorder)
export function gravacaoDisponivel(nav: { mediaDevices?: { getUserMedia?: unknown } } | undefined, temGravador: boolean): boolean {
  return !!nav?.mediaDevices && typeof nav.mediaDevices.getUserMedia === "function" && temGravador;
}

export const MENSAGEM_SEM_GRAVACAO =
  "Este navegador não permite gravar dentro do aplicativo. Use \"Enviar vídeo\" (no celular, ele abre a câmera do aparelho).";

// Erro do getUserMedia em palavras que o avaliador entende e sabe resolver.
export function mensagemErroCamera(nome: string | undefined): string {
  switch (nome) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "O acesso à câmera foi negado. Libere a câmera para este site nas permissões do navegador e tente de novo. Se preferir, use \"Enviar vídeo\".";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "Nenhuma câmera foi encontrada neste aparelho. Use \"Enviar vídeo\" com um arquivo gravado antes.";
    case "NotReadableError":
    case "TrackStartError":
      return "A câmera está sendo usada por outro aplicativo. Feche o outro aplicativo e tente de novo.";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "Esta câmera não aceitou a configuração pedida. Tente trocar de câmera.";
    default:
      return "Não foi possível abrir a câmera agora. Tente de novo ou use \"Enviar vídeo\".";
  }
}

export type CameraLado = "environment" | "user";

export function restricoesCamera(lado: CameraLado) {
  return {
    audio: false,
    video: { facingMode: { ideal: lado }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
  };
}

// Duração mínima atingida? (a gravação parada antes disso é descartada, com aviso)
export function gravacaoCurtaDemais(segundos: number): boolean {
  return segundos < MINIMO_GRAVACAO_S;
}

export function nomeDoArquivo(tipo: string | undefined | null, agora: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `gravacao_${agora.getFullYear()}${p(agora.getMonth() + 1)}${p(agora.getDate())}_${p(agora.getHours())}${p(agora.getMinutes())}${p(agora.getSeconds())}.${extensaoDoFormato(tipo)}`;
}
