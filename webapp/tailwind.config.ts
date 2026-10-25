import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F7FB",
        surface: "#FFFFFF",
        ink: "#0B1B33",
        muted: "#55657D",
        border: "#DCE3EE",
        // Azul-marinho: cor da marca (botões, links, seleção, cabeçalho).
        accent: {
          DEFAULT: "#16325C",
          soft: "#E8EDF6",
          dark: "#0B1F40",
        },
        // Dourado: destaque da marca (aba ativa, filetes, detalhes). gold-dark é o tom legível para texto.
        gold: {
          DEFAULT: "#C9A24D",
          soft: "#FBF4E3",
          dark: "#8A6A1E",
        },
        // Verde discreto só para "ok / adequado", para o significado não se perder com a marca azul.
        ok: {
          DEFAULT: "#1D6B4C",
          soft: "#E2F4EA",
          dark: "#14523A",
        },
        warn: "#A04F00",
        "warn-soft": "#FDECDD",
        danger: "#BE2F29",
        "danger-soft": "#FDE5E2",
        info: "#2F6DB5",
        "info-soft": "#E6EEFA",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 27, 51, 0.05), 0 6px 18px rgba(11, 27, 51, 0.06)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
