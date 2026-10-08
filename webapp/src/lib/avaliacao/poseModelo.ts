"use client";

// Detecção de pose no PRÓPRIO NAVEGADOR (MediaPipe Pose Landmarker): a foto
// nunca é enviada a um serviço de IA - só o modelo (e o motor WASM) são baixados,
// uma vez, e ficam em cache do navegador.

import type { PoseLandmarker } from "@mediapipe/tasks-vision";
import { INDICE_PONTO, type NomePonto, type Pontos } from "./analisePostural";

const VERSAO_MOTOR = "1.1.0";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSAO_MOTOR}/wasm`;
const MODELOS = [
  { nome: "alta precisão (~30 MB)", url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task" },
  { nome: "padrão (~9 MB)", url: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task" },
];

const LADO_MAXIMO_PX = 1600;

let carregando: Promise<PoseLandmarker> | null = null;

export function carregarModeloPose(aoMudar?: (mensagem: string) => void): Promise<PoseLandmarker> {
  if (!carregando) {
    carregando = (async () => {
      aoMudar?.("Carregando o motor de análise (primeira vez pode levar alguns segundos)...");
      const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
      let ultimoErro: unknown = null;
      for (const modelo of MODELOS) {
        for (const delegate of ["GPU", "CPU"] as const) {
          try {
            aoMudar?.(`Carregando o modelo de pose ${modelo.nome} (${delegate})...`);
            return await PoseLandmarker.createFromOptions(fileset, {
              baseOptions: { modelAssetPath: modelo.url, delegate },
              runningMode: "IMAGE",
              numPoses: 1,
              minPoseDetectionConfidence: 0.5,
              minPosePresenceConfidence: 0.5,
              minTrackingConfidence: 0.5,
            });
          } catch (e) {
            ultimoErro = e;
          }
        }
      }
      throw ultimoErro ?? new Error("Não foi possível carregar o modelo de pose.");
    })();
    carregando.catch(() => {
      carregando = null; // permite tentar de novo
    });
  }
  return carregando;
}

export type ImagemPreparada = {
  canvas: HTMLCanvasElement;
  largura: number;
  altura: number;
  urlExibicao: string; // a MESMA imagem analisada (já com a orientação EXIF aplicada)
};

// Decodifica a foto aplicando a orientação EXIF (o canvas respeita) e reduz o
// tamanho; o desenho de resultado usa exatamente esta imagem, então os pontos
// sempre coincidem com o que é mostrado.
export async function prepararImagem(blob: Blob): Promise<ImagemPreparada> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(img.naturalWidth, img.naturalHeight));
    const largura = Math.round(img.naturalWidth * escala);
    const altura = Math.round(img.naturalHeight * escala);
    const canvas = document.createElement("canvas");
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível neste navegador.");
    ctx.drawImage(img, 0, 0, largura, altura);
    const urlExibicao = await new Promise<string>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(URL.createObjectURL(b)) : reject(new Error("Falha ao preparar a imagem."))), "image/jpeg", 0.92)
    );
    return { canvas, largura, altura, urlExibicao };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function detectarPontos(imagem: ImagemPreparada, aoMudar?: (mensagem: string) => void): Promise<{ pontos: Pontos; encontrou: boolean }> {
  const modelo = await carregarModeloPose(aoMudar);
  aoMudar?.("Analisando a foto...");
  const resultado = modelo.detect(imagem.canvas);
  const pontosBrutos = resultado.landmarks?.[0];
  if (!pontosBrutos) return { pontos: {}, encontrou: false };
  const pontos: Pontos = {};
  for (const nome of Object.keys(INDICE_PONTO) as NomePonto[]) {
    const p = pontosBrutos[INDICE_PONTO[nome]];
    if (p) pontos[nome] = { x: p.x * imagem.largura, y: p.y * imagem.altura, v: p.visibility ?? 0 };
  }
  return { pontos, encontrou: true };
}
