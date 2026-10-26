"use client";

// Gravador dentro do aplicativo: abre a câmera do aparelho, mostra a imagem ao vivo e grava o movimento sem sair da
// tela. O resultado volta como arquivo e segue o mesmo caminho do vídeo enviado (análise neste aparelho, sem serviço de IA).

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BITRATE_VIDEO,
  CONTAGEM_PADRAO_S,
  LIMITE_GRAVACAO_S,
  MENSAGEM_SEM_GRAVACAO,
  escolherFormato,
  formatarTempo,
  gravacaoCurtaDemais,
  gravacaoDisponivel,
  mensagemErroCamera,
  nomeDoArquivo,
  restricoesCamera,
  tipoSemCodec,
  type CameraLado,
} from "@/lib/avaliacao/gravacao";

type Fase = "abrindo" | "pronto" | "contagem" | "gravando" | "erro";

export function GravadorVideo({
  titulo,
  dica,
  onGravado,
  onFoto,
  onFechar,
  rotuloGravar = "● Gravar",
}: {
  titulo: string;
  dica?: string;
  onGravado?: (arquivo: File) => void; // sem isso, a tela só tira foto
  onFoto?: (arquivo: File) => void;
  onFechar: () => void;
  rotuloGravar?: string;
}) {
  const refVideo = useRef<HTMLVideoElement>(null);
  const refStream = useRef<MediaStream | null>(null);
  const refGravador = useRef<MediaRecorder | null>(null);
  const refPedacos = useRef<Blob[]>([]);
  const refTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const refDescartar = useRef(false);
  const [fase, setFase] = useState<Fase>("abrindo");
  const [lado, setLado] = useState<CameraLado>("environment");
  const [contagem, setContagem] = useState(CONTAGEM_PADRAO_S);
  const [decorrido, setDecorrido] = useState(0);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [usarContagem, setUsarContagem] = useState(true);

  const pararCamera = useCallback(() => {
    refStream.current?.getTracks().forEach((t) => t.stop());
    refStream.current = null;
  }, []);

  const limparTimer = useCallback(() => {
    if (refTimer.current) clearInterval(refTimer.current);
    refTimer.current = null;
  }, []);

  // Abre (ou troca) a câmera sempre que o lado muda.
  useEffect(() => {
    let cancelado = false;
    async function abrir() {
      if (!gravacaoDisponivel(navigator, typeof MediaRecorder !== "undefined")) {
        setMensagem(MENSAGEM_SEM_GRAVACAO);
        setFase("erro");
        return;
      }
      setFase("abrindo");
      setMensagem(null);
      pararCamera();
      try {
        const stream = await navigator.mediaDevices.getUserMedia(restricoesCamera(lado));
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        refStream.current = stream;
        const v = refVideo.current;
        if (v) {
          v.srcObject = stream;
          v.play().catch(() => undefined); // sem esperar: a imagem aparece quando o navegador liberar
        }
        setFase("pronto");
      } catch (e: any) {
        if (cancelado) return;
        setMensagem(mensagemErroCamera(e?.name));
        setFase("erro");
      }
    }
    abrir();
    return () => {
      cancelado = true;
    };
  }, [lado, pararCamera]);

  // Ao fechar a tela, tudo é desligado: câmera, gravador e relógio.
  useEffect(
    () => () => {
      refDescartar.current = true;
      limparTimer();
      if (refGravador.current && refGravador.current.state !== "inactive") {
        try {
          refGravador.current.stop();
        } catch {
          // já parado
        }
      }
      pararCamera();
    },
    [limparTimer, pararCamera]
  );

  function comecarGravacao() {
    const stream = refStream.current;
    if (!stream) return;
    const formato = escolherFormato((t) => MediaRecorder.isTypeSupported(t));
    let gravador: MediaRecorder;
    try {
      gravador = new MediaRecorder(stream, formato ? { mimeType: formato, videoBitsPerSecond: BITRATE_VIDEO } : { videoBitsPerSecond: BITRATE_VIDEO });
    } catch {
      try {
        gravador = new MediaRecorder(stream);
      } catch {
        setMensagem(MENSAGEM_SEM_GRAVACAO);
        setFase("erro");
        return;
      }
    }
    refPedacos.current = [];
    refDescartar.current = false;
    const inicio = Date.now();
    gravador.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) refPedacos.current.push(ev.data);
    };
    gravador.onstop = () => {
      limparTimer();
      const segundos = (Date.now() - inicio) / 1000;
      if (refDescartar.current) return;
      if (gravacaoCurtaDemais(segundos)) {
        setMensagem("A gravação ficou muito curta. Grave o movimento completo (de 5 a 30 segundos) e tente de novo.");
        setFase("pronto");
        return;
      }
      const tipo = tipoSemCodec(gravador.mimeType || formato);
      const blob = new Blob(refPedacos.current, { type: tipo });
      if (blob.size === 0) {
        setMensagem("Nada foi gravado. Tente de novo.");
        setFase("pronto");
        return;
      }
      pararCamera();
      onGravado?.(new File([blob], nomeDoArquivo(tipo), { type: tipo }));
    };
    gravador.start(1000);
    refGravador.current = gravador;
    setDecorrido(0);
    setMensagem(null);
    setFase("gravando");
    refTimer.current = setInterval(() => {
      const s = (Date.now() - inicio) / 1000;
      setDecorrido(s);
      if (s >= LIMITE_GRAVACAO_S) pararGravacao();
    }, 250);
  }

  function pararGravacao() {
    const g = refGravador.current;
    if (g && g.state !== "inactive") g.stop();
  }

  function aoTocarGravar() {
    if (!usarContagem) {
      comecarGravacao();
      return;
    }
    setFase("contagem");
    setContagem(CONTAGEM_PADRAO_S);
    let restante = CONTAGEM_PADRAO_S;
    refTimer.current = setInterval(() => {
      restante -= 1;
      setContagem(restante);
      if (restante <= 0) {
        limparTimer();
        comecarGravacao();
      }
    }, 1000);
  }

  function cancelarContagem() {
    limparTimer();
    setFase("pronto");
  }

  // Foto com contagem opcional: dá tempo de o avaliador se afastar da câmera ou de o aluno se posicionar.
  function aoTocarFoto() {
    if (!usarContagem) {
      tirarFoto();
      return;
    }
    setFase("contagem");
    setContagem(CONTAGEM_PADRAO_S);
    let restante = CONTAGEM_PADRAO_S;
    refTimer.current = setInterval(() => {
      restante -= 1;
      setContagem(restante);
      if (restante <= 0) {
        limparTimer();
        tirarFoto();
      }
    }, 1000);
  }

  function tirarFoto() {
    const v = refVideo.current;
    if (!v || !v.videoWidth || !onFoto) {
      setFase("pronto");
      return;
    }
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    c.toBlob(
      (b) => {
        if (!b) return;
        pararCamera();
        onFoto(new File([b], "foto.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  }

  const gravando = fase === "gravando";
  const emContagem = fase === "contagem";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <p className="font-display text-lg">{titulo}</p>
          {dica && <p className="mt-0.5 text-xs text-white/70 leading-relaxed">{dica}</p>}
        </div>
        <button
          type="button"
          onClick={onFechar}
          disabled={gravando}
          className="shrink-0 rounded-lg border border-white/30 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-40"
        >
          Fechar
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 py-3">
        <video ref={refVideo} muted playsInline autoPlay className={`max-h-full max-w-full rounded-lg bg-black ${fase === "erro" ? "hidden" : ""}`} />
        {fase === "abrindo" && <p className="absolute text-sm text-white/80">Abrindo a câmera...</p>}
        {fase === "erro" && <p className="max-w-sm text-center text-sm leading-relaxed text-white/90">{mensagem}</p>}
        {emContagem && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
            <p className="font-display text-8xl" aria-live="assertive">
              {Math.max(contagem, 1)}
            </p>
            <p className="text-sm text-white/80">Posicione o aluno no quadro, dos pés à cabeça</p>
          </div>
        )}
        {gravando && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-sm">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" />
            {formatarTempo(decorrido)} / {formatarTempo(LIMITE_GRAVACAO_S)}
          </div>
        )}
      </div>

      {fase !== "erro" && mensagem && <p className="px-4 pb-2 text-center text-xs text-gold">{mensagem}</p>}

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 pb-6">
        {fase === "pronto" && (
          <>
            <button
              type="button"
              onClick={() => setLado((l) => (l === "environment" ? "user" : "environment"))}
              className="rounded-lg border border-white/30 px-3 py-2 text-sm hover:bg-white/10"
            >
              Trocar câmera
            </button>
            {onGravado && (
              <button type="button" onClick={aoTocarGravar} className="rounded-full bg-danger px-6 py-3 text-base font-semibold text-white hover:opacity-90">
                {rotuloGravar}
              </button>
            )}
            {onFoto && (
              <button
                type="button"
                onClick={onGravado ? tirarFoto : aoTocarFoto}
                className={onGravado ? "rounded-lg border border-white/30 px-3 py-2 text-sm hover:bg-white/10" : "rounded-full bg-white px-6 py-3 text-base font-semibold text-black hover:opacity-90"}
              >
                {onGravado ? "Tirar foto" : "● Tirar foto"}
              </button>
            )}
            <label className="inline-flex items-center gap-1.5 text-xs text-white/80">
              <input type="checkbox" checked={usarContagem} onChange={(e) => setUsarContagem(e.target.checked)} /> contagem de {CONTAGEM_PADRAO_S} s
            </label>
          </>
        )}
        {emContagem && (
          <button type="button" onClick={cancelarContagem} className="rounded-lg border border-white/30 px-4 py-2 text-sm hover:bg-white/10">
            Cancelar
          </button>
        )}
        {gravando && (
          <button type="button" onClick={pararGravacao} className="rounded-full bg-white px-6 py-3 text-base font-semibold text-black hover:opacity-90">
            ■ Parar e analisar
          </button>
        )}
        {fase === "erro" && (
          <button type="button" onClick={onFechar} className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-dark">
            Voltar
          </button>
        )}
      </div>
    </div>
  );
}
