import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mercado Medellín",
    short_name: "Mercado",
    description: "Compara precios de mercado en las tiendas de Medellín.",
    lang: "es-CO",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF7",
    theme_color: "#0F172A",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
