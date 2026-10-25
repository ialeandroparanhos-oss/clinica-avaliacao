import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Avaliação Integrada",
  description: "Avaliação integrada de saúde, física e funcional",
  // Ícone ao adicionar à tela inicial: vem de app/apple-icon.png e app/icon.png; o manifesto está em app/manifest.ts.
  appleWebApp: { capable: true, title: "Avaliação Integrada", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0B1F40",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${fraunces.variable} ${manrope.variable} ${mono.variable} font-body text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
