"use client";

// Avatar esquemático (não anatômico) com o resumo por região: circunferência
// e massa magra relativa. Apoio visual rápido - os números oficiais ficam nas
// tabelas do formulário.

const DX = 130; // desloca o corpo para o centro, deixando espaço para os rótulos
const X = (x: number) => x + DX;

type Marcador = {
  id: string;
  titulo: string;
  mx: number; // posição do marcador no corpo (coordenadas do desenho base)
  my: number;
  lado: "esq" | "dir";
  ly: number; // linha de base do título do rótulo
};

const MARCADORES: Marcador[] = [
  { id: "ombro", titulo: "Ombro", mx: 194, my: 84, lado: "dir", ly: 48 },
  { id: "peitoral", titulo: "Peitoral", mx: 160, my: 112, lado: "dir", ly: 100 },
  { id: "cintura", titulo: "Cintura", mx: 160, my: 160, lado: "dir", ly: 152 },
  { id: "abdomen", titulo: "Abdômen", mx: 160, my: 192, lado: "dir", ly: 204 },
  { id: "quadril", titulo: "Quadril", mx: 160, my: 230, lado: "dir", ly: 256 },
  { id: "braco", titulo: "Braço", mx: 94, my: 115, lado: "esq", ly: 92 },
  { id: "antebraco", titulo: "Antebraço", mx: 82, my: 205, lado: "esq", ly: 200 },
  { id: "coxa", titulo: "Coxa", mx: 139, my: 300, lado: "esq", ly: 316 },
  { id: "panturrilha", titulo: "Panturrilha", mx: 139, my: 410, lado: "esq", ly: 402 },
];

export function AvatarCorporal({ linhas }: { linhas: Record<string, string[]> }) {
  const contorno = "fill-none stroke-border";
  return (
    <div className="overflow-x-auto">
      <svg viewBox="0 0 580 480" className="w-full min-w-[460px] max-w-xl mx-auto" role="img" aria-label="Resumo corporal por região">
        <circle cx={X(160)} cy={35} r={26} className={contorno} strokeWidth={2} />
        <rect x={X(150)} y={58} width={20} height={14} className={contorno} strokeWidth={2} />
        <rect x={X(120)} y={75} width={80} height={70} rx={16} className={contorno} strokeWidth={2} />
        <rect x={X(124)} y={145} width={72} height={65} rx={14} className={contorno} strokeWidth={2} />
        <rect x={X(118)} y={210} width={84} height={40} rx={14} className={contorno} strokeWidth={2} />
        <rect x={X(75)} y={80} width={38} height={85} rx={16} className={contorno} strokeWidth={2} />
        <rect x={X(65)} y={165} width={34} height={85} rx={14} className={contorno} strokeWidth={2} />
        <rect x={X(207)} y={80} width={38} height={85} rx={16} className={contorno} strokeWidth={2} />
        <rect x={X(221)} y={165} width={34} height={85} rx={14} className={contorno} strokeWidth={2} />
        <rect x={X(122)} y={250} width={34} height={115} rx={16} className={contorno} strokeWidth={2} />
        <rect x={X(126)} y={365} width={26} height={95} rx={13} className={contorno} strokeWidth={2} />
        <rect x={X(164)} y={250} width={34} height={115} rx={16} className={contorno} strokeWidth={2} />
        <rect x={X(168)} y={365} width={26} height={95} rx={13} className={contorno} strokeWidth={2} />

        {MARCADORES.map((m) => {
          const esq = m.lado === "esq";
          const xRotulo = esq ? 132 : 438;
          const xLinha = esq ? 136 : 434;
          const textos = linhas[m.id] && linhas[m.id].length > 0 ? linhas[m.id] : ["sem dados"];
          return (
            <g key={m.id}>
              <line x1={X(m.mx)} y1={m.my} x2={xLinha} y2={m.ly - 4} className="stroke-border" strokeWidth={1} />
              <circle cx={X(m.mx)} cy={m.my} r={4} className="fill-accent-dark" />
              <text x={xRotulo} y={m.ly} textAnchor={esq ? "end" : "start"} fontSize={13} fontWeight={600} className="fill-ink">
                {m.titulo}
              </text>
              {textos.map((t, i) => (
                <text key={i} x={xRotulo} y={m.ly + 15 * (i + 1)} textAnchor={esq ? "end" : "start"} fontSize={12} className="fill-muted">
                  {t}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
