"use client";

// Análise de movimento (Agente 4, Dra. Paula): o paciente executa o movimento (por exemplo, a flexão de
// tronco) e o avaliador registra o ponto máximo nas vistas sagital e frontal: foto, roteiro de observação,
// anotação livre e, se quiser, um ângulo medido na própria foto. É registro descritivo e aparente à
// inspeção (sem corte nem diagnóstico); a foto fica no arquivo privado da clínica e não vai a nenhum serviço de IA.

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TextArea } from "@/components/forms";
import { GravadorVideo } from "./GravadorVideo";
import { extensaoDoFormato } from "@/lib/avaliacao/gravacao";
import { analisarVideoNoNavegador } from "@/lib/avaliacao/videoPose";
import { detectarPontos, prepararImagem } from "@/lib/avaliacao/poseModelo";
import { pontosNaEscala, preMarcarAngulo, sugerirObservacoes } from "@/lib/avaliacao/preMarcacao";
import { AVISO_MARGEM_ERRO_VIDEO, ROTULO_VEREDITO } from "@/lib/avaliacao/videoMovimento";
import {
  alternarObsMovimento,
  anguloDe,
  MOVIMENTOS,
  pontosNecessarios,
  ROTULO_VISTA_MOV,
  VISTAS_MOV,
  type DefMovimento,
  type MedidaAngulo,
  type Movimentos,
  type MovimentoSalvo,
  type VistaMov,
  type VistaMovSalva,
} from "@/lib/avaliacao/movimento";

const BUCKET = "fotos-posturais";

function useUrlAssinada(path: string | undefined): string | null {
  const supabase = useMemo(() => createClient(), []);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelado = false;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelado) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelado = true;
    };
  }, [path, supabase]);
  return url;
}

function BlocoVista({
  pacienteId,
  def,
  vista,
  valor,
  onChange,
  simples = false,
}: {
  pacienteId: string;
  def: DefMovimento;
  vista: VistaMov;
  valor: VistaMovSalva;
  onChange: (v: VistaMovSalva) => void;
  simples?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const url = useUrlAssinada(valor.foto_path);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [medindo, setMedindo] = useState<MedidaAngulo["tipo"] | null>(null);
  const [pts, setPts] = useState<{ x: number; y: number }[]>([]);
  const [analisandoVideo, setAnalisandoVideo] = useState(false);
  const [msgVideo, setMsgVideo] = useState<string | null>(null);
  const urlVideo = useUrlAssinada(valor.video_path);
  const [preMarcando, setPreMarcando] = useState(false);
  const [msgPre, setMsgPre] = useState<string | null>(null);
  const [gravando, setGravando] = useState(false);

  useEffect(() => {
    setDims(null);
    if (!url) return;
    const img = new Image();
    img.onload = () => setDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
  }, [url]);

  // Pré-marcação: o modelo de pose acha os pontos na foto (neste computador, sem enviar a foto a serviço de IA) e o
  // ângulo fica como PRÉ-MARCADO, esperando o ok do avaliador. Devolve null quando não há o que marcar.
  async function preMarcar(blob: Blob): Promise<{ angulo: MedidaAngulo | null; sugestoes: { chave: string; detalhe: string }[] } | null> {
    setPreMarcando(true);
    setMsgPre("Pré-marcando o ângulo...");
    try {
      const img = await prepararImagem(blob);
      try {
        const { pontos, encontrou } = await detectarPontos(img, setMsgPre);
        if (!encontrou) {
          setMsgPre("Não encontrei a pessoa nesta foto para pré-marcar o ângulo. Se quiser, marque à mão.");
          return null;
        }
        const r = preMarcarAngulo(def.id, vista, pontos, img.largura, img.altura);
        const sugestoes = sugerirObservacoes(def.id, vista, pontos);
        if (!r && sugestoes.length === 0) {
          setMsgPre("O sistema não tem ângulo nem sugestão automática para este movimento nesta vista. Se quiser, marque à mão.");
          return { angulo: null, sugestoes: [] };
        }
        setMsgPre(null);
        return { angulo: r?.angulo ?? null, sugestoes };
      } finally {
        URL.revokeObjectURL(img.urlExibicao);
      }
    } catch {
      setMsgPre("Não foi possível pré-marcar agora. Se quiser, marque à mão.");
      return null;
    } finally {
      setPreMarcando(false);
    }
  }

  async function preMarcarDaFoto() {
    if (!valor.foto_path) return;
    const { data, error } = await supabase.storage.from(BUCKET).download(valor.foto_path);
    if (error || !data) {
      setMsgPre("Não foi possível abrir a foto para pré-marcar.");
      return;
    }
    const pre = await preMarcar(data);
    if (pre) onChange({ ...valor, angulo: pre.angulo ?? valor.angulo, sugestoes: pre.sugestoes });
  }

  async function enviar(file: File) {
    setEnviando(true);
    setErro(null);
    const extensao = (file.name.split(".").pop() || "jpg").toLowerCase();
    const caminho = `${pacienteId}/mov_${def.id}_${vista}.${extensao}`;
    const { error } = await supabase.storage.from(BUCKET).upload(caminho, file, { upsert: true, contentType: file.type });
    if (error) setErro("Não foi possível enviar a foto agora. Tente de novo.");
    else {
      const pre = await preMarcar(file);
      onChange({ ...valor, foto_path: caminho, angulo: pre?.angulo ?? undefined, sugestoes: pre?.sugestoes ?? [] });
    }
    setEnviando(false);
  }

  // Análise inicial do vídeo, feita neste computador: o vídeo não é enviado a nenhum serviço de IA. O quadro do
  // ponto máximo vira a foto da vista e o vídeo, se couber, fica no arquivo privado da clínica.
  async function analisarVideo(file: File) {
    setAnalisandoVideo(true);
    setErro(null);
    setMsgVideo("Preparando a análise...");
    try {
      const { resumo, quadroMaximo } = await analisarVideoNoNavegador(file, def.id, vista, setMsgVideo);
      let novo: VistaMovSalva = { ...valor, analise_video: resumo };
      if (quadroMaximo) {
        const caminhoFoto = `${pacienteId}/mov_${def.id}_${vista}.jpg`;
        const { error } = await supabase.storage.from(BUCKET).upload(caminhoFoto, quadroMaximo, { upsert: true, contentType: "image/jpeg" });
        if (!error) {
          const pre = await preMarcar(quadroMaximo);
          novo = { ...novo, foto_path: caminhoFoto, angulo: pre?.angulo ?? undefined, sugestoes: pre?.sugestoes ?? [] };
        }
      }
      // Guarda o vídeo só se couber no limite do arquivo (o limite do plano costuma ser de 50 MB).
      if (file.size <= 45 * 1024 * 1024) {
        const extensao = (file.name.split(".").pop() || extensaoDoFormato(file.type)).toLowerCase();
        const caminhoVideo = `${pacienteId}/mov_${def.id}_${vista}_video.${extensao}`;
        const { error } = await supabase.storage.from(BUCKET).upload(caminhoVideo, file, { upsert: true, contentType: file.type || "video/mp4" });
        if (!error) novo = { ...novo, video_path: caminhoVideo };
        else setMsgVideo("Análise concluída. O vídeo não pôde ser guardado agora (a análise e o quadro do ponto máximo foram guardados).");
      } else {
        setMsgVideo("Análise concluída. O vídeo passa de 45 MB e não foi guardado; o quadro do ponto máximo foi guardado como foto.");
      }
      onChange(novo);
    } catch (e: any) {
      setErro(e?.message ? `Não foi possível analisar o vídeo: ${e.message}` : "Não foi possível analisar o vídeo. Tente um vídeo mais curto, em MP4.");
      setMsgVideo(null);
    } finally {
      setAnalisandoVideo(false);
    }
  }

  async function removerVideo() {
    if (valor.video_path) await supabase.storage.from(BUCKET).remove([valor.video_path]);
    const { video_path: _v, analise_video: _a, ...resto } = valor;
    onChange(resto);
    setMsgVideo(null);
  }

  async function removerFoto() {
    if (!valor.foto_path) return;
    await supabase.storage.from(BUCKET).remove([valor.foto_path]);
    const { foto_path: _f, angulo: _a, ...resto } = valor;
    onChange(resto);
  }

  function clicarFoto(e: React.MouseEvent<SVGSVGElement>) {
    if (!medindo || !dims) return;
    const r = e.currentTarget.getBoundingClientRect();
    const ponto = { x: ((e.clientX - r.left) / r.width) * dims.w, y: ((e.clientY - r.top) / r.height) * dims.h };
    const novos = [...pts, ponto];
    setPts(novos);
    if (novos.length >= pontosNecessarios(medindo)) {
      onChange({ ...valor, angulo: { tipo: medindo, pts: novos, largura: dims.w, altura: dims.h } });
      setMedindo(null);
      setPts([]);
    }
  }

  const opcoes = def.observacoes[vista];
  const marcadas = new Set(valor.obs ?? []);
  const pendentes = (valor.sugestoes ?? []).filter((s) => !marcadas.has(s.chave) && opcoes.some((o) => o.chave === s.chave));
  const angulo = anguloDe(valor.angulo);
  const u = dims ? dims.w / 1000 : 1;
  const exibidos = medindo ? pts : valor.angulo ? pontosNaEscala(valor.angulo, dims?.w ?? valor.angulo.largura) : [];
  const tipoExibido = medindo ?? valor.angulo?.tipo;

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      {gravando && (
        <GravadorVideo
          titulo={`${def.nome} · ${ROTULO_VISTA_MOV[vista]}`}
          dica={`Câmera parada (tripé ou apoiada), corpo inteiro no quadro, ${vista === "sagital" ? "de lado" : "de frente ou de costas"}. Peça o movimento completo, de 5 a 30 segundos.`}
          onFechar={() => setGravando(false)}
          onGravado={(arquivo) => {
            setGravando(false);
            analisarVideo(arquivo);
          }}
          onFoto={(arquivo) => {
            setGravando(false);
            enviar(arquivo);
          }}
        />
      )}
      <p className="font-medium text-ink text-sm">{ROTULO_VISTA_MOV[vista]}</p>

      {url && dims ? (
        <svg
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          className={`w-full max-w-sm h-auto rounded-lg bg-black ${medindo ? "cursor-crosshair" : ""}`}
          onClick={clicarFoto}
          role="img"
          aria-label={`${def.nome}, ${ROTULO_VISTA_MOV[vista]}`}
        >
          <image href={url} x={0} y={0} width={dims.w} height={dims.h} preserveAspectRatio="none" />
          {exibidos.length >= 2 && tipoExibido === "tres_pontos" &&
            exibidos.slice(0, -1).map((p, i) => <line key={i} x1={p.x} y1={p.y} x2={exibidos[i + 1].x} y2={exibidos[i + 1].y} stroke="#FFE600" strokeWidth={4 * u} />)}
          {exibidos.length >= 2 && tipoExibido === "vertical" && (
            <>
              <line x1={exibidos[0].x} y1={exibidos[0].y} x2={exibidos[1].x} y2={exibidos[1].y} stroke="#FFE600" strokeWidth={4 * u} />
              <line x1={exibidos[0].x} y1={exibidos[0].y} x2={exibidos[0].x} y2={exibidos[1].y} stroke="#22D3EE" strokeWidth={3 * u} strokeDasharray={`${14 * u} ${9 * u}`} />
            </>
          )}
          {exibidos.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={9 * u} fill="#FF3B3B" stroke="#000" strokeWidth={2 * u} />
          ))}
        </svg>
      ) : url ? (
        <p className="text-xs text-muted">Carregando a foto...</p>
      ) : (
        <div className="h-32 w-full max-w-sm rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted text-center px-3">
          Sem foto desta vista
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="font-medium text-accent hover:underline cursor-pointer">
          {enviando ? "Enviando..." : valor.foto_path ? "Substituir a foto" : "Enviar foto no ponto máximo"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={enviando}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) enviar(file);
              e.target.value = "";
            }}
          />
        </label>
        {valor.foto_path && (
          <button type="button" onClick={removerFoto} className="text-xs text-muted hover:text-danger">
            remover foto
          </button>
        )}
      </div>
      {erro && <p className="text-xs text-danger">{erro}</p>}

      <div className="rounded-lg bg-bg p-3 text-sm space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-muted font-semibold">Vídeo do movimento (análise inicial)</span>
          <button
            type="button"
            onClick={() => setGravando(true)}
            disabled={analisandoVideo}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-dark transition disabled:opacity-50"
          >
            ● {valor.analise_video ? "Gravar de novo" : "Gravar agora"}
          </button>
          <label className="font-medium text-accent hover:underline cursor-pointer">
            {analisandoVideo ? "Analisando..." : valor.analise_video ? "ou enviar outro vídeo" : "ou enviar um vídeo"}
            <input
              type="file"
              accept="video/*"
              className="hidden"
              disabled={analisandoVideo}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) analisarVideo(file);
                e.target.value = "";
              }}
            />
          </label>
          {(valor.analise_video || valor.video_path) && !analisandoVideo && (
            <button type="button" onClick={removerVideo} className="text-xs text-muted hover:text-danger">
              remover vídeo e análise
            </button>
          )}
        </div>
        {analisandoVideo && msgVideo && <p className="text-xs text-muted">{msgVideo}</p>}
        {!analisandoVideo && msgVideo && <p className="text-xs text-muted">{msgVideo}</p>}
        {!valor.analise_video && !analisandoVideo && (
          <p className="text-xs text-muted leading-relaxed">
            Filme com a câmera parada, corpo inteiro no quadro, {vista === "sagital" ? "de lado" : "de frente ou de costas"}, com o movimento completo (posição inicial, ponto máximo e retorno), de 5 a 30 segundos. A análise roda neste computador:
            o vídeo não é enviado a nenhum serviço de IA.
          </p>
        )}
        {valor.analise_video?.adequacao && (
          <div
            className={`rounded-lg border px-3 py-2 space-y-1.5 ${
              valor.analise_video.adequacao.veredito === "adequado"
                ? "border-ok/40 bg-ok-soft"
                : valor.analise_video.adequacao.veredito === "com_ressalvas"
                  ? "border-warn bg-warn-soft"
                  : "border-danger bg-danger-soft"
            }`}
          >
            <p className="font-medium text-ink">
              {valor.analise_video.adequacao.veredito === "adequado" ? "✓ " : valor.analise_video.adequacao.veredito === "com_ressalvas" ? "! " : "✕ "}
              {ROTULO_VEREDITO[valor.analise_video.adequacao.veredito]}
            </p>
            <p className="text-xs text-ink leading-relaxed">{valor.analise_video.adequacao.resumo}</p>
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-ink">Ver o porquê (critérios avaliados)</summary>
              <ul className="mt-1.5 space-y-1">
                {valor.analise_video.adequacao.criterios.map((c) => (
                  <li key={c.chave} className="flex gap-2">
                    <span className={`shrink-0 font-semibold ${c.estado === "ok" ? "text-ok-dark" : c.estado === "atencao" ? "text-warn" : "text-danger"}`}>{c.estado === "ok" ? "✓" : c.estado === "atencao" ? "!" : "✕"}</span>
                    <span className="text-ink">
                      <strong>{c.rotulo}:</strong> {c.detalhe}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-muted">Os limites são referências práticas do sistema, sem validação publicada: dizem se a leitura automática 2D é confiável, e não se o movimento do paciente está bom ou ruim.</p>
            </details>
          </div>
        )}
        {valor.analise_video && (
          <div className="space-y-1">
            <ul className="list-disc pl-5 text-ink space-y-0.5">
              {valor.analise_video.linhas.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
            <p className="text-xs text-muted">Ponto máximo definido por: {valor.analise_video.referencia_max}. O quadro desse ponto foi usado como a foto desta vista.</p>
            {valor.analise_video.avisos.map((a, i) => (
              <p key={i} className="text-xs text-warn">
                Atenção: {a}
              </p>
            ))}
            <p className="rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn leading-relaxed">{AVISO_MARGEM_ERRO_VIDEO}</p>
            <p className="text-xs text-muted leading-relaxed">
              Medida 2D automática, de primeira triagem: depende do enquadramento e não é diagnóstico nem substitui a sua observação. Confira o vídeo e marque o roteiro abaixo.
            </p>
          </div>
        )}
        {urlVideo && <video src={urlVideo} controls className="w-full max-w-sm rounded-lg bg-black" />}
      </div>

      {url && dims && (
        <div className="rounded-lg bg-bg p-3 text-sm space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-muted font-semibold">Medir ângulo na foto</span>
            <button type="button" onClick={() => { setMedindo("tres_pontos"); setPts([]); }} className="font-medium text-accent hover:underline">
              3 pontos
            </button>
            <button type="button" onClick={() => { setMedindo("vertical"); setPts([]); }} className="font-medium text-accent hover:underline">
              linha em relação à vertical
            </button>
            <button type="button" onClick={preMarcarDaFoto} disabled={preMarcando} className="font-medium text-accent hover:underline disabled:opacity-50">
              {preMarcando ? "Pré-marcando..." : "pré-marcar automaticamente"}
            </button>
            {(valor.angulo || medindo) && (
              <button
                type="button"
                onClick={() => {
                  setMedindo(null);
                  setPts([]);
                  const { angulo: _a, ...resto } = valor;
                  onChange(resto);
                }}
                className="text-xs text-muted hover:text-danger"
              >
                limpar medida
              </button>
            )}
          </div>
          {medindo && (
            <p className="text-ink">
              <strong>Clique na foto:</strong>{" "}
              {medindo === "tres_pontos"
                ? ["1º ponto (por exemplo, o ombro)", "vértice, onde o ângulo é medido (por exemplo, o quadril)", "3º ponto (por exemplo, o joelho)"][pts.length]
                : ["início da linha (por exemplo, o quadril)", "fim da linha (por exemplo, o ombro)"][pts.length]}
              .
            </p>
          )}
          {msgPre && <p className="text-xs text-muted">{msgPre}</p>}
          {valor.angulo?.pre && angulo !== null && !medindo && (
            <div className="rounded-lg border border-gold bg-gold-soft p-3 space-y-2">
              <p className="text-ink">
                <strong>Pré-marcado automaticamente:</strong> {valor.angulo.descricao ?? "ângulo"}: <strong>{angulo.toFixed(0)}°</strong>. Confira se os pontos estão no lugar na foto.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onChange({ ...valor, angulo: { ...valor.angulo!, pre: false } })}
                  className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-dark transition"
                >
                  Está certo, confirmar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const { angulo: _a, ...resto } = valor;
                    onChange(resto);
                    setMedindo(valor.angulo?.tipo ?? "tres_pontos");
                    setPts([]);
                  }}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Refazer à mão
                </button>
              </div>
              <p className="text-xs text-muted">Enquanto não confirmar, esta medida não entra no parecer nem nos relatórios.</p>
            </div>
          )}
          {angulo !== null && !medindo && !valor.angulo?.pre && (
            <p className="text-ink">
              <strong>{angulo.toFixed(0)}°</strong>
              <span className="text-muted"> {valor.angulo?.tipo === "vertical" ? "de inclinação em relação à vertical da foto (0° = vertical)" : "no vértice marcado"}. Medida 2D, depende do enquadramento e da inclinação da câmera.</span>
            </p>
          )}
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-1.5">O que se observa (marque o que se aplica)</p>
        {pendentes.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold bg-gold-soft px-3 py-2">
            <p className="text-xs text-ink">
              <strong>O sistema sugeriu {pendentes.length} {pendentes.length === 1 ? "marcação" : "marcações"}</strong> pelos pontos do corpo no ponto máximo. Só valem depois do seu ok.
            </p>
            <button
              type="button"
              onClick={() => onChange({ ...valor, obs: pendentes.reduce((o, s) => alternarObsMovimento(o, s.chave, true), valor.obs ?? []) })}
              className="rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-dark transition"
            >
              Aceitar todas
            </button>
          </div>
        )}
        <ul className="space-y-1.5">
          {opcoes.map((o) => {
            const sug = pendentes.find((s) => s.chave === o.chave);
            return (
              <li key={o.chave} className={sug ? "rounded-lg border border-gold bg-gold-soft px-2 py-1.5" : ""}>
                <label className="inline-flex items-start gap-2 text-sm text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={marcadas.has(o.chave)}
                    onChange={(e) => onChange({ ...valor, obs: alternarObsMovimento(valor.obs, o.chave, e.target.checked) })}
                  />
                  <span>
                    {o.rotulo}
                    {sug && <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-accent-dark">sugerido</span>}
                  </span>
                </label>
                {sug && (
                  <p className="ml-6 mt-0.5 text-xs text-gold-dark">
                    {sug.detalhe}. Referência prática do sistema, sem validação publicada.{" "}
                    <button type="button" onClick={() => onChange({ ...valor, obs: alternarObsMovimento(valor.obs, o.chave, true) })} className="font-semibold underline">
                      aceitar
                    </button>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>      <TextArea value={valor.texto ?? ""} onChange={(e) => onChange({ ...valor, texto: e.target.value })} placeholder="Anotação livre desta vista (opcional)" />
    </div>
  );
}

export function AnaliseMovimento({
  pacienteId,
  movimentos,
  onChange,
  ids,
  simples = false,
}: {
  pacienteId: string;
  movimentos: Movimentos;
  onChange: (m: Movimentos) => void;
  ids?: string[]; // quais movimentos mostrar (sem isso, todos)
  simples?: boolean; // sem vídeo e sem medida de ângulo
}) {
  const [aberto, setAberto] = useState<string | null>(null);

  function atualizar(id: string, patch: Partial<MovimentoSalvo>) {
    onChange({ ...movimentos, [id]: { ...(movimentos[id] ?? {}), ...patch } });
  }

  return (
    <div className="pt-4 border-t border-border space-y-3">
      <div>
        <h3 className="font-display text-lg text-ink">{simples ? "Movimentos: agachamento e flexão de tronco" : "Análise de movimento"}</h3>
        <p className="text-xs text-muted leading-relaxed mt-1">
          {simples ? (
            <>
              Peça o movimento e registre o ponto máximo de lado (<strong>sagital</strong>) e de frente ou de costas (<strong>frontal</strong>), em <strong>foto ou em vídeo</strong>. Ao enviar (ou gravar direto no aplicativo), o sistema <strong>pré-marca o ângulo</strong> na foto e <strong>sugere</strong> o que viu nos pontos do corpo; você só
              confirma (ou refaz à mão) e marca o roteiro. Se estiver tudo normal, marque "dentro do padrão". São registros descritivos, sem corte nem validação publicada: não são diagnóstico nem causa de dor. A foto e o vídeo ficam no arquivo privado da clínica e não vão a nenhum serviço de IA.
            </>
          ) : (
            <>
              O paciente executa o movimento e você registra o ponto máximo em duas vistas: a <strong>sagital</strong> (de lado) e a <strong>frontal</strong>. Para cada vista há foto, um roteiro de observação e, se quiser,
              um ângulo medido na foto. São registros descritivos, aparentes à inspeção, sem corte nem validação publicada: não são diagnóstico nem causa de dor. A foto fica no arquivo privado da clínica.
            </>
          )}
        </p>
      </div>

      {MOVIMENTOS.filter((m) => !ids || ids.includes(m.id)).map((def) => {
        const salvo = movimentos[def.id] ?? {};
        const preenchidas = VISTAS_MOV.filter((v) => (salvo[v]?.obs?.length ?? 0) > 0 || salvo[v]?.foto_path || salvo[v]?.texto).length + (salvo.medida ? 1 : 0);
        const estaAberto = aberto === def.id;
        return (
          <div key={def.id} className="rounded-xl border border-border bg-surface">
            <button type="button" aria-expanded={estaAberto} onClick={() => setAberto(estaAberto ? null : def.id)} className="w-full text-left px-4 py-3 flex items-center justify-between gap-3">
              <span className="font-medium text-ink">{def.nome}</span>
              <span className="text-xs text-muted shrink-0">{preenchidas > 0 ? `${preenchidas} registro(s)` : "não registrado"} · {estaAberto ? "fechar" : "abrir"}</span>
            </button>
            {estaAberto && (
              <div className="px-4 pb-4 space-y-4">
                <p className="text-sm text-muted leading-relaxed">{def.como}</p>
                {def.medida && (
                  <label className="inline-flex flex-wrap items-center gap-2 text-sm text-ink">
                    {def.medida.rotulo} ({def.medida.unidade})
                    <input
                      inputMode="decimal"
                      value={salvo.medida ?? ""}
                      onChange={(e) => atualizar(def.id, { medida: e.target.value.replace(",", ".") })}
                      className="w-24 rounded-lg border border-border bg-surface px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-muted">{def.medida.dica}</span>
                  </label>
                )}
                <div className="grid lg:grid-cols-2 gap-4">
                  {VISTAS_MOV.map((v) => (
                    <BlocoVista
                      key={v}
                      pacienteId={pacienteId}
                      def={def}
                      vista={v}
                      valor={salvo[v] ?? {}}
                      onChange={(nv) => atualizar(def.id, { [v]: nv })}
                      simples={simples}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
