// Ilustração (SVG) de cada agente. São personagens FICTÍCIOS desenhados para identificar visualmente
// cada assistente de IA na ferramenta: não representam nenhuma pessoa real nem profissional registrado.
// Cada um tem cor própria e um emblema da sua área (prancheta, fita métrica, cronômetro etc.).

import type { AgenteId } from "@/lib/agentes";

type Cabelo = "coque" | "ondas" | "curto" | "rabo" | "cacheado" | "bob" | "liso" | "raspado";
type Emblema = "prancheta" | "balao" | "fita" | "coluna" | "cronometro" | "nos" | "haltere" | "documento" | "coracao";

type Visual = {
  fundo: string;
  cor: string; // cor da área (camisa por baixo do jaleco e do emblema)
  pele: string;
  cabelo: string;
  estilo: Cabelo;
  barba?: boolean;
  oculos?: boolean;
  emblema: Emblema;
};

export const VISUAL_AGENTE: Record<AgenteId, Visual> = {
  nina: { fundo: "#d8efe9", cor: "#0f766e", pele: "#8d5a3b", cabelo: "#2b1b14", estilo: "coque", emblema: "prancheta" },
  sofia: { fundo: "#fde7d3", cor: "#d97706", pele: "#f1c6a4", cabelo: "#7a3e1d", estilo: "ondas", emblema: "balao" },
  marco: { fundo: "#dbe8f8", cor: "#1d4ed8", pele: "#d9a37c", cabelo: "#2a2320", estilo: "curto", barba: true, emblema: "fita" },
  paula: { fundo: "#ebe0f7", cor: "#7e22ce", pele: "#e3b48d", cabelo: "#1f1a2e", estilo: "rabo", emblema: "coluna" },
  rita: { fundo: "#dcf2dc", cor: "#15803d", pele: "#a86b47", cabelo: "#24160f", estilo: "cacheado", emblema: "cronometro" },
  iris: { fundo: "#e0e2f8", cor: "#4338ca", pele: "#f4d2b8", cabelo: "#4b2e83", estilo: "bob", oculos: true, emblema: "nos" },
  theo: { fundo: "#fbe0da", cor: "#c2410c", pele: "#6b4129", cabelo: "#15100d", estilo: "raspado", emblema: "haltere" },
  clara: { fundo: "#fbe0ee", cor: "#be185d", pele: "#f7d9c4", cabelo: "#c9a45c", estilo: "liso", oculos: true, emblema: "documento" },
  caio: { fundo: "#fbdada", cor: "#b91c1c", pele: "#e9bf9a", cabelo: "#3a2a1c", estilo: "curto", emblema: "coracao" },
};

function CabeloTras({ estilo, cor }: { estilo: Cabelo; cor: string }) {
  switch (estilo) {
    case "coque":
      return <circle cx="100" cy="46" r="15" fill={cor} />;
    case "ondas":
      return <path d="M62 90 C46 142 54 170 78 174 L122 174 C146 170 154 142 138 90 Z" fill={cor} />;
    case "liso":
      return <path d="M63 90 C54 138 58 168 74 172 L126 172 C142 168 146 138 137 90 Z" fill={cor} />;
    case "bob":
      return <path d="M62 88 C52 126 58 140 72 142 L128 142 C142 140 148 126 138 88 Z" fill={cor} />;
    case "rabo":
      return <path d="M126 62 C160 58 170 100 148 138 C150 108 142 90 126 82 Z" fill={cor} />;
    case "cacheado":
      return (
        <g fill={cor}>
          <circle cx="68" cy="70" r="17" />
          <circle cx="132" cy="70" r="17" />
          <circle cx="80" cy="52" r="18" />
          <circle cx="120" cy="52" r="18" />
          <circle cx="100" cy="46" r="18" />
          <circle cx="62" cy="92" r="13" />
          <circle cx="138" cy="92" r="13" />
        </g>
      );
    default:
      return null;
  }
}

function CabeloFrente({ estilo, cor }: { estilo: Cabelo; cor: string }) {
  const cap = "M64 92 C58 46 142 46 136 92 C130 70 114 62 100 62 C86 62 70 70 64 92 Z";
  switch (estilo) {
    case "raspado":
      return <path d="M67 84 C66 58 134 58 133 84 C128 74 114 70 100 70 C86 70 72 74 67 84 Z" fill={cor} />;
    case "curto":
      return <path d="M64 92 C56 42 144 42 136 92 C131 72 118 62 100 62 C82 62 69 72 64 92 Z" fill={cor} />;
    case "bob":
      return <path d="M64 96 C58 46 142 46 136 96 C134 80 124 68 112 66 C100 80 80 84 64 96 Z" fill={cor} />;
    case "liso":
      return <path d="M64 96 C58 46 142 46 136 96 C132 76 118 66 104 64 C96 80 78 90 64 96 Z" fill={cor} />;
    default:
      return <path d={cap} fill={cor} />;
  }
}

function Icone({ tipo, cor }: { tipo: Emblema; cor: string }) {
  const s = { stroke: cor, strokeWidth: 3, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (tipo) {
    case "prancheta":
      return (
        <g {...s}>
          <rect x="13" y="11" width="22" height="28" rx="3" />
          <path d="M19 9 h10 v5 h-10 z" fill={cor} />
          <path d="M18 23 l3 3 l6 -7 M18 33 h12" />
        </g>
      );
    case "balao":
      return (
        <g {...s}>
          <path d="M11 14 h26 a3 3 0 0 1 3 3 v12 a3 3 0 0 1 -3 3 h-14 l-8 7 v-7 h-4 a3 3 0 0 1 -3 -3 v-12 a3 3 0 0 1 3 -3 z" />
          <path d="M18 23 h.1 M24 23 h.1 M30 23 h.1" strokeWidth="4" />
        </g>
      );
    case "fita":
      return (
        <g {...s}>
          <rect x="8" y="17" width="32" height="14" rx="2" />
          <path d="M14 17 v6 M20 17 v9 M26 17 v6 M32 17 v9" strokeWidth="2.5" />
        </g>
      );
    case "coluna":
      return (
        <g {...s}>
          <path d="M24 8 v32" strokeWidth="2" strokeDasharray="2 3" />
          <rect x="18" y="12" width="12" height="6" rx="3" />
          <rect x="19" y="21" width="10" height="6" rx="3" />
          <rect x="18" y="30" width="12" height="6" rx="3" />
        </g>
      );
    case "cronometro":
      return (
        <g {...s}>
          <circle cx="24" cy="28" r="13" />
          <path d="M20 10 h8 M24 10 v5 M24 28 l6 -6" />
        </g>
      );
    case "nos":
      return (
        <g {...s}>
          <path d="M24 12 L11 34 M24 12 L37 34 M11 34 H37" />
          <circle cx="24" cy="12" r="5" fill="#fff" />
          <circle cx="11" cy="34" r="5" fill="#fff" />
          <circle cx="37" cy="34" r="5" fill="#fff" />
        </g>
      );
    case "haltere":
      return (
        <g {...s}>
          <path d="M14 24 h20" />
          <rect x="8" y="16" width="6" height="16" rx="2" fill={cor} />
          <rect x="34" y="16" width="6" height="16" rx="2" fill={cor} />
        </g>
      );
    case "documento":
      return (
        <g {...s}>
          <path d="M14 9 h14 l8 8 v22 h-22 z" />
          <path d="M28 9 v8 h8 M19 25 h12 M19 32 h12" />
        </g>
      );
    case "coracao":
      return (
        <g {...s}>
          <path d="M24 39 C8 27 10 12 20 12 C23 12 24 15 24 16 C24 15 25 12 28 12 C38 12 40 27 24 39 Z" />
          <path d="M12 25 h8 l3 -6 l4 11 l3 -5 h7" strokeWidth="2.5" />
        </g>
      );
  }
}

export default function AgenteAvatar({ id, tamanho = 96, titulo }: { id: AgenteId; tamanho?: number; titulo?: string }) {
  const v = VISUAL_AGENTE[id];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={tamanho}
      height={tamanho}
      role="img"
      aria-label={titulo ?? `Ilustração do agente ${id}`}
      className="shrink-0 rounded-full"
    >
      <rect width="200" height="200" fill={v.fundo} />
      <CabeloTras estilo={v.estilo} cor={v.cabelo} />
      {/* ombros e jaleco */}
      <path d="M26 202 C26 162 62 148 100 148 C138 148 174 162 174 202 Z" fill="#ffffff" stroke="#d6d3d1" strokeWidth="2" />
      <path d="M80 150 L100 184 L120 150 Z" fill={v.cor} />
      <path d="M80 150 L100 184 M120 150 L100 184" stroke="#d6d3d1" strokeWidth="2" fill="none" />
      {/* pescoço e cabeça */}
      <rect x="89" y="118" width="22" height="34" rx="8" fill={v.pele} />
      <rect x="89" y="132" width="22" height="10" fill="#000" opacity="0.08" />
      <ellipse cx="67" cy="98" rx="5" ry="8" fill={v.pele} />
      <ellipse cx="133" cy="98" rx="5" ry="8" fill={v.pele} />
      <ellipse cx="100" cy="94" rx="33" ry="38" fill={v.pele} />
      {v.barba && <path d="M67 100 C66 142 134 142 133 100 C130 122 114 130 100 130 C86 130 70 122 67 100 Z" fill={v.cabelo} />}
      <CabeloFrente estilo={v.estilo} cor={v.cabelo} />
      {/* rosto */}
      <circle cx="88" cy="96" r="3.4" fill="#1c1917" />
      <circle cx="112" cy="96" r="3.4" fill="#1c1917" />
      <path d="M80 86 q8 -5 16 0 M104 86 q8 -5 16 0" stroke={v.cabelo} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M100 100 q-3 8 2 9" stroke="#000" opacity="0.22" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M89 114 Q100 124 111 114" stroke={v.barba ? "#ffffff" : "#8a3b2e"} strokeWidth="3" fill="none" strokeLinecap="round" />
      {v.oculos && (
        <g stroke="#27272a" strokeWidth="2.5" fill="none">
          <circle cx="88" cy="96" r="11" />
          <circle cx="112" cy="96" r="11" />
          <path d="M99 96 h2" />
        </g>
      )}
      {/* emblema da área */}
      <circle cx="158" cy="158" r="25" fill="#ffffff" stroke={v.cor} strokeWidth="3" />
      <g transform="translate(134 134)">
        <Icone tipo={v.emblema} cor={v.cor} />
      </g>
    </svg>
  );
}
