import type { MetadataRoute } from "next";

// Faz o celular tratar o site como aplicativo ao adicioná-lo à tela inicial: nome, cores e ícones da marca.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Avaliação Integrada de Saúde, Física e Funcional",
    short_name: "Avaliação Integrada",
    description: "Avaliação integrada de saúde, física e funcional",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "pt-BR",
    background_color: "#FFFFFF",
    theme_color: "#0B1F40",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
