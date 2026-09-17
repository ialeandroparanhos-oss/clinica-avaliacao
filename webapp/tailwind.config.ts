import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F6F7F5",
        surface: "#FFFFFF",
        ink: "#182420",
        muted: "#5B6B63",
        border: "#DFE6E1",
        accent: {
          DEFAULT: "#2F6F5E",
          soft: "#E4EFEA",
          dark: "#1F4E41",
        },
        warn: "#9A6B14",
        "warn-soft": "#FBF0DD",
        danger: "#B3261E",
        "danger-soft": "#FBE7E5",
        info: "#3A5F8A",
        "info-soft": "#E8EEF6",
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
