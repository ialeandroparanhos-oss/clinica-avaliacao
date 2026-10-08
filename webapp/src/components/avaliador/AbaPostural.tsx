"use client";

// Aba Postural e Biomecânica (Agente 4).
//
// Fotos nas 4 vistas padronizadas + ANÁLISE AUTOMÁTICA de cada foto (pontos do
// corpo, ângulos, alinhamento e linha de prumo, desenhados sobre a foto) + um
// PARECER descritivo redigido pelo agente, que o avaliador revisa e edita.
// A análise roda no navegador: a foto não é enviada a nenhum serviço de IA.

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, TextArea } from "@/components/forms";
import { SalvarBar, Selo, useAutoSalvar, useSalvarSecao, type TomSelo } from "./campos";
import { SobreposicaoPostural } from "./SobreposicaoPostural";
import { MarcacaoEscapula } from "./MarcacaoEscapula";
import { temMarcacaoEscapula, type MarcacaoEscapula as DadosEscapula } from "@/lib/avaliacao/escapula";
import { PainelParecer, estiloPreferido, lerParecer, type ParecerSalvo } from "./PainelParecer";
import { analisarVista, gerarParecer, ROTULO_VISTA, type AnaliseVistaSalva, type Vista } from "@/lib/avaliacao/analisePostural";
import { detectarPontos, prepararImagem, type ImagemPreparada } from "@/lib/avaliacao/poseModelo";

const BUCKET_FOTOS_POSTURAIS = "fotos-posturais";
const VISTAS: Vista[] = ["anterior", "posterior", "lateral_d", "lateral_e"];

type Vistas = Partial<Record<Vista, AnaliseVistaSalva>>;
type EstadoAnalise = { vistas: Vistas; parecer: ParecerSalvo | null; escapula?: DadosEscapula };

// Fichas gravadas antes do parecer ganhar estilos guardavam o texto em analise.parecer.
function parecerInicial(dados: any): ParecerSalvo | null {
  const novo = lerParecer(dados?.parecer);
  if (novo) return novo;
  const a = dados?.analise;
  if (a && typeof a.parecer === "string" && a.parecer !== "") {
    return { texto: a.parecer, estilo: "explicativo", automatico: a.parecer_automatico ?? "", revisado: !!a.parecer_revisado };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Envio das fotos (como antes)
// ---------------------------------------------------------------------------
function useFotoSignedUrl(path: string, versao: number): string | null {
  const supabase = useMemo(() => createClient(), []);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelado = false;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from(BUCKET_FOTOS_POSTURAIS)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (!cancelado) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelado = true;
    };
  }, [path, versao, supabase]);
  return url;
}

function FotoVista({
  pacienteId,
  vista,
  label,
  path,
  versao,
  onChange,
}: {
  pacienteId: string;
  vista: string;
  label: string;
  path: string;
  versao: number;
  onChange: (path: string) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [enviando, setEnviando] = useState(false);
  const url = useFotoSignedUrl(path, versao);

  async function enviar(file: File) {
    setEnviando(true);
    const extensao = file.name.split(".").pop() || "jpg";
    const caminho = `${pacienteId}/${vista}.${extensao}`;
    const { error } = await supabase.storage.from(BUCKET_FOTOS_POSTURAIS).upload(caminho, file, { upsert: true, contentType: file.type });
    if (!error) onChange(caminho);
    setEnviando(false);
  }

  async function remover() {
    if (!path) return;
    await supabase.storage.from(BUCKET_FOTOS_POSTURAIS).remove([path]);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink">{label}</p>
      {url ? (
        <img src={url} alt={label} className="h-44 w-auto rounded-lg border border-border object-cover" />
      ) : (
        <div className="h-44 w-32 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted text-center px-2">Sem foto</div>
      )}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-accent hover:underline cursor-pointer">
          {enviando ? "Enviando..." : url ? "Substituir" : "Enviar foto"}
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
        {url && (
          <button type="button" onClick={remover} className="text-xs text-muted hover:text-danger">
            remover
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Análise de uma vista
// ---------------------------------------------------------------------------
const TOM_DESTAQUE: Record<string, TomSelo> = { ok: "ok", discreta: "atencao", evidente: "alerta", info: "info" };
const TEXTO_DESTAQUE: Record<string, string> = { ok: "sem diferença perceptível", discreta: "diferença discreta", evidente: "diferença evidente", info: "referência" };

function AnaliseVista({
  vista,
  caminho,
  versao,
  salva,
  sinal,
  grade,
  onResultado,
  escapula,
  onEscapula,
}: {
  escapula?: DadosEscapula;
  onEscapula?: (m: DadosEscapula) => void;
  vista: Vista;
  caminho: string;
  versao: number;
  salva?: AnaliseVistaSalva;
  sinal: number;
  grade: boolean;
  onResultado: (a: AnaliseVistaSalva) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [imagem, setImagem] = useState<ImagemPreparada | null>(null);
  const [estado, setEstado] = useState<"parado" | "preparando" | "analisando" | "erro">("parado");
  const [mensagem, setMensagem] = useState("");
  const ultimoSinal = useRef(0);
  const urlAtual = useRef<string | null>(null);

  // Baixa a foto e prepara a imagem (mesma imagem para analisar e para mostrar).
  useEffect(() => {
    let cancelado = false;
    if (!caminho) {
      setImagem(null);
      return;
    }
    (async () => {
      setEstado("preparando");
      setMensagem("");
      const { data, error } = await supabase.storage.from(BUCKET_FOTOS_POSTURAIS).download(caminho);
      if (cancelado) return;
      if (error || !data) {
        setEstado("erro");
        setMensagem("Não foi possível baixar a foto.");
        return;
      }
      try {
        const preparada = await prepararImagem(data);
        if (cancelado) {
          URL.revokeObjectURL(preparada.urlExibicao);
          return;
        }
        if (urlAtual.current) URL.revokeObjectURL(urlAtual.current);
        urlAtual.current = preparada.urlExibicao;
        setImagem(preparada);
        setEstado("parado");
      } catch {
        setEstado("erro");
        setMensagem("Não foi possível abrir esta foto (formato não suportado?).");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [caminho, versao, supabase]);

  useEffect(
    () => () => {
      if (urlAtual.current) URL.revokeObjectURL(urlAtual.current);
    },
    []
  );

  async function executar() {
    if (!imagem) return;
    setEstado("analisando");
    setMensagem("Preparando a análise...");
    try {
      const { pontos, encontrou } = await detectarPontos(imagem, setMensagem);
      if (!encontrou) {
        setEstado("erro");
        setMensagem("Nenhuma pessoa foi encontrada na foto. Confira o enquadramento (corpo inteiro, boa luz) ou envie outra foto.");
        return;
      }
      const r = analisarVista(vista, pontos, imagem.largura, imagem.altura);
      onResultado({
        foto_path: caminho,
        largura: imagem.largura,
        altura: imagem.altura,
        pontos,
        medidas: r.medidas,
        avisos: r.avisos,
        linhaPrumoX: r.linhaPrumoX,
        gerado_em: new Date().toISOString(),
      });
      setEstado("parado");
      setMensagem("");
    } catch (e: any) {
      setEstado("erro");
      setMensagem(`Falha na análise: ${e?.message ?? "erro desconhecido"}. Verifique a conexão (o modelo é baixado na primeira vez) e tente de novo.`);
    }
  }

  // "Analisar todas": roda quando o sinal muda e a imagem já está pronta.
  useEffect(() => {
    if (sinal > 0 && sinal !== ultimoSinal.current && imagem && estado === "parado") {
      ultimoSinal.current = sinal;
      executar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sinal, imagem, estado]);

  const resultado = salva && salva.foto_path === caminho ? salva : null;
  const ocupado = estado === "preparando" || estado === "analisando";

  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h5 className="font-display text-base text-ink">{ROTULO_VISTA[vista]}</h5>
        {caminho && (
          <button type="button" onClick={executar} disabled={!imagem || ocupado} className="text-sm font-medium text-accent hover:underline disabled:opacity-50">
            {estado === "analisando" ? "Analisando..." : resultado ? "Analisar de novo" : "Analisar foto"}
          </button>
        )}
      </div>

      {!caminho && <p className="text-sm text-muted">Envie a foto desta vista acima para analisar.</p>}
      {estado === "preparando" && <p className="text-xs text-muted">Abrindo a foto...</p>}
      {mensagem && <p className={`text-xs ${estado === "erro" ? "text-danger" : "text-muted"}`}>{mensagem}</p>}

      {imagem &&
        (resultado ? (
          <SobreposicaoPostural
            urlImagem={imagem.urlExibicao}
            largura={imagem.largura}
            altura={imagem.altura}
            pontos={resultado.pontos}
            medidas={resultado.medidas}
            linhaPrumoX={resultado.linhaPrumoX}
            vista={vista}
            grade={grade}
          />
        ) : (
          <img src={imagem.urlExibicao} alt={ROTULO_VISTA[vista]} className="w-full h-auto rounded-xl border border-border" />
        ))}

      {vista === "posterior" && imagem && onEscapula && (
        <details className="rounded-lg border border-border p-3" open={temMarcacaoEscapula(escapula)}>
          <summary className="cursor-pointer text-sm font-medium text-accent">Marcar as escápulas (opcional, manual)</summary>
          <div className="mt-3">
            <MarcacaoEscapula urlImagem={imagem.urlExibicao} largura={imagem.largura} altura={imagem.altura} marcacao={escapula ?? {}} onChange={onEscapula} />
          </div>
        </details>
      )}

      {resultado && (
        <div className="space-y-2">
          <ul className="space-y-1.5 text-sm">
            {resultado.medidas.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start gap-2">
                <Selo tom={TOM_DESTAQUE[m.destaque]}>{TEXTO_DESTAQUE[m.destaque]}</Selo>
                <span className="flex-1 min-w-[12rem] text-ink">
                  <strong>{m.rotulo}:</strong> {m.texto}
                </span>
              </li>
            ))}
          </ul>
          {resultado.avisos.length > 0 && (
            <ul className="text-xs text-warn space-y-0.5 list-disc list-inside">
              {resultado.avisos.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Aba
// ---------------------------------------------------------------------------
export function AbaPostural({ pacienteId, dados, onSalvo }: { pacienteId: string; dados: any; onSalvo: () => void }) {
  const [d, setD] = useState<Record<string, string>>({
    obs_anterior: dados?.obs_anterior ?? "",
    obs_posterior: dados?.obs_posterior ?? "",
    obs_lateral_d: dados?.obs_lateral_d ?? "",
    obs_lateral_e: dados?.obs_lateral_e ?? "",
    obs_movimento: dados?.obs_movimento ?? "",
    foto_anterior_path: dados?.foto_anterior_path ?? "",
    foto_posterior_path: dados?.foto_posterior_path ?? "",
    foto_lateral_d_path: dados?.foto_lateral_d_path ?? "",
    foto_lateral_e_path: dados?.foto_lateral_e_path ?? "",
  });
  const [analise, setAnalise] = useState<EstadoAnalise>(() => ({ vistas: dados?.analise?.vistas ?? {}, parecer: parecerInicial(dados), escapula: dados?.analise?.escapula }));
  const [versaoFotos, setVersaoFotos] = useState<Record<Vista, number>>({ anterior: 0, posterior: 0, lateral_d: 0, lateral_e: 0 });
  const [sinal, setSinal] = useState(0);
  const [grade, setGrade] = useState(true);
  const { salvar, salvando, ok, rascunho } = useSalvarSecao(pacienteId, "postural");
  const set = (k: string, v: string) => setD((prev) => ({ ...prev, [k]: v }));
  const caminhoDe = (v: Vista) => d[`foto_${v}_path`];

  // O parecer acompanha as análises enquanto o avaliador não o edita; depois de
  // editado, o texto dele nunca é sobrescrito (aparece o aviso de "dados mudaram").
  function comVistas(prev: EstadoAnalise, vistas: Vistas): EstadoAnalise {
    const p = prev.parecer;
    const seguiaAuto = !p || p.texto === "" || p.texto === p.automatico;
    if (!seguiaAuto) return { ...prev, vistas };
    const estilo = p?.estilo ?? estiloPreferido();
    const novo = gerarParecer(vistas, estilo, prev.escapula);
    return { ...prev, vistas, parecer: novo ? { texto: novo, estilo, automatico: novo, revisado: false } : null };
  }

  function aoMudarFoto(vista: Vista, caminho: string) {
    set(`foto_${vista}_path`, caminho);
    setVersaoFotos((prev) => ({ ...prev, [vista]: prev[vista] + 1 }));
    // Foto nova ou removida: a análise antiga dessa vista deixa de valer.
    setAnalise((prev) => {
      let atual = prev;
      // A marcação das escápulas vale para a foto posterior daquele momento.
      if (vista === "posterior" && prev.escapula) atual = { ...atual, escapula: undefined };
      if (atual.vistas[vista]) {
        const { [vista]: _removida, ...resto } = atual.vistas;
        return comVistas(atual, resto);
      }
      return atual !== prev ? comVistas(atual, atual.vistas) : prev;
    });
  }

  function aoEscapula(m: DadosEscapula) {
    setAnalise((prev) => comVistas({ ...prev, escapula: m }, prev.vistas));
  }

  function aoResultado(vista: Vista, resultado: AnaliseVistaSalva) {
    setAnalise((prev) => comVistas(prev, { ...prev.vistas, [vista]: resultado }));
  }

  const dadosAtuais = { ...d, analise: { versao: 2, vistas: analise.vistas, escapula: analise.escapula }, parecer: analise.parecer };
  const estadoAuto = useAutoSalvar(dadosAtuais, rascunho);
  const vistasComFoto = VISTAS.filter((v) => caminhoDe(v));

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
      <p className="text-sm text-muted">
        Registre as fotos nas 4 vistas padronizadas (ver protocolo fotográfico no documento do Agente 4: mesma distância, altura da câmera e posição do paciente em todas as reavaliações). As fotos ficam em um arquivo
        privado, visível apenas para avaliadores autenticados da clínica.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {VISTAS.map((v) => (
          <FotoVista key={v} pacienteId={pacienteId} vista={v} label={ROTULO_VISTA[v]} path={caminhoDe(v)} versao={versaoFotos[v]} onChange={(p) => aoMudarFoto(v, p)} />
        ))}
      </div>

      <div className="pt-4 border-t border-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg text-ink">Análise automática das fotos</h3>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="inline-flex items-center gap-1.5 text-muted cursor-pointer">
              <input type="checkbox" checked={grade} onChange={(e) => setGrade(e.target.checked)} /> mostrar grade
            </label>
            <button
              type="button"
              onClick={() => setSinal((n) => n + 1)}
              disabled={vistasComFoto.length === 0}
              className="font-medium text-accent hover:underline disabled:opacity-50"
            >
              Analisar todas as fotos
            </button>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          O agente localiza os pontos do corpo na foto, mede ombros, quadris, cabeça, tronco, joelhos e o alinhamento com a linha de prumo, e desenha o resultado sobre a foto. A análise roda neste computador: <strong>a foto não é
          enviada a nenhum serviço de IA</strong> (só o modelo é baixado, uma vez). São medidas em foto 2D, sujeitas a erro de enquadramento e de marcação - os cortes (3° discreta, 6° evidente) são referências práticas do
          sistema, sem validação publicada.
        </p>

        {vistasComFoto.length === 0 ? (
          <p className="text-sm text-muted">Envie ao menos uma foto para habilitar a análise.</p>
        ) : (
          <div className="grid lg:grid-cols-2 gap-4">
            {VISTAS.map((v) => (
              <AnaliseVista key={v} vista={v} caminho={caminhoDe(v)} versao={versaoFotos[v]} salva={analise.vistas[v]} sinal={sinal} grade={grade} onResultado={(r) => aoResultado(v, r)} escapula={v === "posterior" ? analise.escapula : undefined} onEscapula={v === "posterior" ? aoEscapula : undefined} />
            ))}
          </div>
        )}
      </div>

      <PainelParecer
        agente="paula"
        valor={analise.parecer}
        onChange={(p) => setAnalise((prev) => ({ ...prev, parecer: p }))}
        gerar={(estilo) => gerarParecer(analise.vistas, estilo, analise.escapula)}
        mensagemVazia="Analise ao menos uma foto para o agente redigir o parecer."
        linhas={analise.parecer?.estilo === "explicativo" ? 16 : 8}
      />

      <div className="pt-4 border-t border-border space-y-4">
        <h3 className="font-display text-lg text-ink">Suas observações</h3>
        <Field label="Vista anterior">
          <TextArea value={d.obs_anterior} onChange={(e) => set("obs_anterior", e.target.value)} />
        </Field>
        <Field label="Vista posterior">
          <TextArea value={d.obs_posterior} onChange={(e) => set("obs_posterior", e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Vista lateral direita">
            <TextArea value={d.obs_lateral_d} onChange={(e) => set("obs_lateral_d", e.target.value)} />
          </Field>
          <Field label="Vista lateral esquerda">
            <TextArea value={d.obs_lateral_e} onChange={(e) => set("obs_lateral_e", e.target.value)} />
          </Field>
        </div>
        <Field label="Padrões de movimento observados (agachamento, alcance, etc.)">
          <TextArea value={d.obs_movimento} onChange={(e) => set("obs_movimento", e.target.value)} />
        </Field>
      </div>

      <SalvarBar salvando={salvando} ok={ok} onSalvar={() => salvar(dadosAtuais).then(onSalvo)} auto={estadoAuto} />
    </div>
  );
}
