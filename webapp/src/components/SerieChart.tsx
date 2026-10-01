"use client";

// Gráfico de linha simples em SVG puro - sem dependência externa. Plota a
// série histórica de um indicador e, quando houver, uma linha tracejada com
// a meta definida pelo avaliador.
export function SerieChart({ serie, meta }: { serie: { valor: number; data: string }[]; meta?: number }) {
  if (serie.length < 2) return null;
  const largura = 560;
  const altura = 140;
  const margemX = 10;
  const margemY = 16;

  const valores = serie.map((p) => p.valor);
  if (meta !== undefined && Number.isFinite(meta)) valores.push(meta);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const span = max - min || 1;

  const x = (i: number) => margemX + (i / (serie.length - 1)) * (largura - margemX * 2);
  const y = (v: number) => altura - margemY - ((v - min) / span) * (altura - margemY * 2);

  const pontos = serie.map((p, i) => `${x(i)},${y(p.valor)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${largura} ${altura}`} className="w-full h-28">
      {meta !== undefined && Number.isFinite(meta) && (
        <line
          x1={margemX}
          x2={largura - margemX}
          y1={y(meta)}
          y2={y(meta)}
          className="stroke-accent/40"
          strokeDasharray="4 4"
          strokeWidth={1.5}
        />
      )}
      <polyline points={pontos} fill="none" className="stroke-accent" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {serie.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.valor)} r={3} className="fill-accent-dark" />
      ))}
    </svg>
  );
}
