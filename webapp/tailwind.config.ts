import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F2F7F7",
        surface: "#FFFFFF",
        ink: "#10242B",
        muted: "#5A6F77",
        border: "#D8E4E6",
        accent: {
          DEFAULT: "#0E7C7F",
          soft: "#E1F3F2",
          dark: "#0A5559",
        },
        warn: "#955A00",
        "warn-soft": "#FFF1D4",
        danger: "#BE2F29",
        "danger-soft": "#FDE5E2",
        info: "#2A5CA8",
        "info-soft": "#E4EDFA",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 36, 43, 0.05), 0 6px 18px rgba(16, 36, 43, 0.05)",
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
