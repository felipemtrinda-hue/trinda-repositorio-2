import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Empiric Imob — Portal do cliente",
    short_name: "Empiric",
    description: "Boletos, contratos, recibos e manutenção do seu imóvel com a Empiric Negócios Imobiliários.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["business", "finance", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Minhas faturas", short_name: "Faturas", url: "/inquilino/faturas", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Abrir chamado de manutenção", short_name: "Chamado", url: "/inquilino/chamados", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
