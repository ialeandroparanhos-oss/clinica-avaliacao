"use client";

// Lê um vídeo no PRÓPRIO NAVEGADOR: amostra quadros, detecta os pontos do corpo em cada um (mesmo motor da
// foto) e devolve o resumo e o quadro do ponto máximo. O vídeo não é enviado a nenhum serviço de IA.

import { INDICE_PONTO, type NomePonto, type Pontos } from "./analisePostural";
import { carregarModeloPose } from "./poseModelo";
import { resumirVideo, type InfoVideo, type Quadro, type ResumoVideo } from "./videoMovimento";

const LADO_ANALISE_PX = 960;
const LADO_FOTO_PX = 1600;
const QUADROS_POR_SEGUNDO = 5;
const MAXIMO_QUADROS = 50;

function esperar(video: HTMLVideoElement, evento: "loadedmetadata" | "seeked", ms = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      video.removeEventListener(evento, ok);
      reject(new Error("O navegador não conseguiu ler este vídeo."));
    }, ms);
    const ok = () => {
      clearTimeout(t);
      resolve();
    };
    video.addEventListener(evento, ok, { once: true });
  });
}

// Vídeo gravado pelo navegador (MediaRecorder, em WebM) costuma vir sem duração (Infinity) e sem poder pular para um
// instante. O truque padrão é ir ao fim "impossível" para o navegador calcular a duração real e voltar ao começo.
async function garantirDuracao(video: HTMLVideoElement): Promise<void> {
  if (Number.isFinite(video.duration) && video.duration > 0) return;
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(() => {
      video.removeEventListener("timeupdate", ok);
      reject(new Error("O navegador não conseguiu medir a duração deste vídeo."));
    }, 15000);
    const ok = () => {
      if (!Number.isFinite(video.duration)) return;
      clearTimeout(t);
      video.removeEventListener("timeupdate", ok);
      resolve();
    };
    video.addEventListener("timeupdate", ok);
    video.currentTime = 1e7;
  });
  video.currentTime = 0;
  await esperar(video, "seeked");
}

function desenhar(video: HTMLVideoElement, ladoMax: number): HTMLCanvasElement {
  const escala = Math.min(1, ladoMax / Math.max(video.videoWidth, video.videoHeight));
  const c = document.createElement("canvas");
  c.width = Math.round(video.videoWidth * escala);
  c.height = Math.round(video.videoHeight * escala);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador.");
  ctx.drawImage(video, 0, 0, c.width, c.height);
  return c;
}

// Brilho médio e contraste (desvio) do quadro, em escala 0 a 255, numa miniatura de 32 x 32 px.
function luminanciaDe(canvas: HTMLCanvasElement): { media: number; desvio: number } | null {
  const mini = document.createElement("canvas");
  mini.width = 32;
  mini.height = 32;
  const ctx = mini.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(canvas, 0, 0, 32, 32);
  const d = ctx.getImageData(0, 0, 32, 32).data;
  const v: number[] = [];
  for (let i = 0; i < d.length; i += 4) v.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
  const media = v.reduce((a, b) => a + b, 0) / v.length;
  const desvio = Math.sqrt(v.reduce((a, b) => a + (b - media) ** 2, 0) / v.length);
  return { media, desvio };
}

export type ResultadoAnaliseVideo = {
  resumo: ResumoVideo;
  quadroMaximo: Blob | null; // JPEG do ponto máximo
};

export async function analisarVideoNoNavegador(
  arquivo: Blob,
  movimentoId: string,
  vista: "sagital" | "frontal",
  aoMudar?: (mensagem: string) => void
): Promise<ResultadoAnaliseVideo> {
  const url = URL.createObjectURL(arquivo);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  try {
    await esperar(video, "loadedmetadata");
    await garantirDuracao(video);
    const duracao = Number.isFinite(video.duration) ? video.duration : 0;
    if (!duracao || !video.videoWidth) throw new Error("Não foi possível ler a duração ou o tamanho do vídeo.");
    const modelo = await carregarModeloPose(aoMudar);

    const n = Math.max(3, Math.min(MAXIMO_QUADROS, Math.ceil(duracao * QUADROS_POR_SEGUNDO)));
    const quadros: Quadro[] = [];
    const luminancia: { media: number; desvio: number }[] = [];
    let larguraAnalise = 0;
    let alturaAnalise = 0;
    for (let i = 0; i < n; i++) {
      const t = Math.min(duracao - 0.05, (duracao * i) / (n - 1 || 1));
      aoMudar?.(`Analisando o vídeo: quadro ${i + 1} de ${n}...`);
      video.currentTime = Math.max(0, t);
      await esperar(video, "seeked");
      const canvas = desenhar(video, LADO_ANALISE_PX);
      larguraAnalise = canvas.width;
      alturaAnalise = canvas.height;
      const luz = luminanciaDe(canvas);
      if (luz) luminancia.push(luz);
      const r = modelo.detect(canvas);
      const brutos = r.landmarks?.[0];
      const pontos: Pontos = {};
      if (brutos) {
        for (const nome of Object.keys(INDICE_PONTO) as NomePonto[]) {
          const p = brutos[INDICE_PONTO[nome]];
          if (p) pontos[nome] = { x: p.x * canvas.width, y: p.y * canvas.height, v: p.visibility ?? 0 };
        }
      }
      quadros.push({ t, pontos });
    }

    const info: InfoVideo = { largura: larguraAnalise, altura: alturaAnalise, videoLargura: video.videoWidth, videoAltura: video.videoHeight, luminancia };
    const { resumo, indiceMaximo } = resumirVideo(quadros, movimentoId, vista, duracao, info);
    let quadroMaximo: Blob | null = null;
    if (indiceMaximo !== null) {
      video.currentTime = Math.max(0, quadros[indiceMaximo].t);
      await esperar(video, "seeked");
      const c = desenhar(video, LADO_FOTO_PX);
      quadroMaximo = await new Promise<Blob | null>((resolve) => c.toBlob((b) => resolve(b), "image/jpeg", 0.92));
    }
    return { resumo, quadroMaximo };
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}
