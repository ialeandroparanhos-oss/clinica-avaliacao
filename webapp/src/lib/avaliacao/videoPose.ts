"use client";

// Lê um vídeo no PRÓPRIO NAVEGADOR: amostra quadros, detecta os pontos do corpo em cada um (mesmo motor da
// foto) e devolve o resumo e o quadro do ponto máximo. O vídeo não é enviado a nenhum serviço de IA.

import { INDICE_PONTO, type NomePonto, type Pontos } from "./analisePostural";
import { carregarModeloPose } from "./poseModelo";
import { resumirVideo, type Quadro, type ResumoVideo } from "./videoMovimento";

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
    const duracao = Number.isFinite(video.duration) ? video.duration : 0;
    if (!duracao || !video.videoWidth) throw new Error("Não foi possível ler a duração ou o tamanho do vídeo.");
    const modelo = await carregarModeloPose(aoMudar);

    const n = Math.max(3, Math.min(MAXIMO_QUADROS, Math.ceil(duracao * QUADROS_POR_SEGUNDO)));
    const quadros: Quadro[] = [];
    for (let i = 0; i < n; i++) {
      const t = Math.min(duracao - 0.05, (duracao * i) / (n - 1 || 1));
      aoMudar?.(`Analisando o vídeo: quadro ${i + 1} de ${n}...`);
      video.currentTime = Math.max(0, t);
      await esperar(video, "seeked");
      const canvas = desenhar(video, LADO_ANALISE_PX);
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

    const { resumo, indiceMaximo } = resumirVideo(quadros, movimentoId, vista, duracao);
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
