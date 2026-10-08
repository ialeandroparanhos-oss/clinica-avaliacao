"use client";

// Marcação manual das escápulas sobre a foto posterior: o avaliador clica nos pontos, na ordem
// indicada. O modelo de pose não enxerga as escápulas; aqui o sistema só mede o que foi marcado.
// Sem corte de normalidade e sem conclusão clínica: ver o limite em lib/avaliacao/escapula.ts.

import { useRef } from "react";
import { medirEscapula, PASSOS_ESCAPULA, type ChavePontoEscapula, type MarcacaoEscapula } from "@/lib/avaliacao/escapula";

const COR: Record<ChavePontoEscapula, string> = {
  c7: "#22D3EE",
  sacro: "#22D3EE",
  ai_d: "#FF3B3B",
  rs_d: "#FF3B3B",
  ai_e: "#FFE600",
  rs_e: "#FFE600",
  cal_a: "#7CFF00",
  cal_b: "#7CFF00",
};

export function MarcacaoEscapula({
  urlImagem,
  largura,
  altura,
  marcacao,
  onChange,
}: {
  urlImagem: string;
  largura: number;
  altura: number;
  marcacao: MarcacaoEscapula;
  onChange: (m: MarcacaoEscapula) => void;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const proximo = PASSOS_ESCAPULA.find((p) => !marcacao[p.chave]);
  const { medidas, escalaCm, faltam } = medirEscapula(marcacao);
  const u = largura / 1000;

  function clicar(e: React.MouseEvent<SVGSVGElement>) {
    if (!proximo || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * largura;
    const y = ((e.clientY - r.top) / r.height) * altura;
    onChange({ ...marcacao, [proximo.chave]: { x, y } });
  }

  function desfazer() {
    const feitos = PASSOS_ESCAPULA.filter((p) => marcacao[p.chave]);
    const ultimo = feitos[feitos.length - 1];
    if (!ultimo) return;
    const { [ultimo.chave]: _removido, ...resto } = marcacao;
    onChange(resto);
  }

  const linha = (a?: { x: number; y: number }, b?: { x: number; y: number }, cor = "#FFFFFF", tracejada = false) =>
    a && b ? <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={cor} strokeWidth={3 * u} strokeDasharray={tracejada ? `${14 * u} ${9 * u}` : undefined} /> : null;

  return (
    <div className="space-y-3">
      <div className="rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn leading-relaxed">
        <strong>Limite da literatura:</strong> uma revisão sistemática de 2020 (D&apos;hondt et al., J Orthop Sports Phys Ther, PMID 33131391) não encontrou instrumento clínico com evidência suficiente para avaliar a
        função da escápula, e alerta contra concluir &quot;discinesia&quot; por essas medidas. Use este registro só para comparar o mesmo paciente, com a mesma técnica, ao longo do tempo.
      </div>
      <p className="text-sm text-ink">
        {proximo ? (
          <>
            <strong>Clique na foto:</strong> {proximo.rotulo}. <span className="text-muted">{proximo.dica}</span>
          </>
        ) : (
          <strong>Todos os pontos marcados.</strong>
        )}
      </p>
      <svg ref={svg} viewBox={`0 0 ${largura} ${altura}`} className={`w-full h-auto rounded-xl bg-black ${proximo ? "cursor-crosshair" : ""}`} onClick={clicar} role="img" aria-label="Foto posterior para marcar as escápulas">
        <image href={urlImagem} x={0} y={0} width={largura} height={altura} preserveAspectRatio="none" />
        {linha(marcacao.c7, marcacao.sacro, "#22D3EE", true)}
        {linha(marcacao.ai_d, marcacao.ai_e, "#FFFFFF")}
        {linha(marcacao.rs_d, marcacao.rs_e, "#FFFFFF")}
        {linha(marcacao.cal_a, marcacao.cal_b, "#7CFF00")}
        {PASSOS_ESCAPULA.map((p) => {
          const pt = marcacao[p.chave];
          if (!pt) return null;
          return (
            <g key={p.chave}>
              <circle cx={pt.x} cy={pt.y} r={9 * u} fill={COR[p.chave]} stroke="#000" strokeWidth={2 * u} />
              <text x={pt.x + 13 * u} y={pt.y + 5 * u} fontSize={22 * u} fontWeight={700} fill="#fff" stroke="#000" strokeWidth={0.8 * u} paintOrder="stroke">
                {p.chave.replace("_", " ").toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button type="button" onClick={desfazer} className="font-medium text-accent hover:underline">
          Desfazer o último ponto
        </button>
        <button type="button" onClick={() => onChange({ cal_cm: marcacao.cal_cm })} className="text-muted hover:text-danger">
          Limpar marcações
        </button>
        <label className="inline-flex items-center gap-2 text-muted">
          Distância real entre A e B (cm)
          <input
            inputMode="decimal"
            value={marcacao.cal_cm ?? ""}
            onChange={(e) => {
              const v = Number(e.target.value.replace(",", "."));
              onChange({ ...marcacao, cal_cm: Number.isFinite(v) && e.target.value !== "" ? v : undefined });
            }}
            className="w-20 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink"
            placeholder="ex.: 10"
          />
        </label>
      </div>
      {medidas.length > 0 && (
        <ul className="text-sm space-y-1">
          {medidas.map((m) => (
            <li key={m.id}>
              <strong className="text-ink">{m.rotulo}:</strong> <span className="text-ink">{m.texto}</span>
            </li>
          ))}
          {!escalaCm && <li className="text-xs text-muted">Sem referência de escala, as distâncias aparecem só como razão D/E. Marque os pontos A e B de uma referência de tamanho conhecido para ver em cm.</li>}
        </ul>
      )}
      {faltam.length > 0 && <p className="text-xs text-muted">Falta: {faltam.join("; ")}.</p>}
      <p className="text-xs text-muted leading-relaxed">
        Protocolo sugerido: marcadores adesivos sobre os pontos ósseos antes da foto, paciente de pé, relaxado, braços ao lado do corpo, câmera na altura do meio das costas, mesma distância em todas as reavaliações. A inclinação das
        linhas e as distâncias mudam com a postura do momento e com a inclinação da câmera.
      </p>
    </div>
  );
}
