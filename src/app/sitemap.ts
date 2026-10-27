import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

// shortcut: solo las páginas fijas; las de producto entran si algún día importa que Google las liste.
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/antojos", "/anotados"].map((ruta) => ({
    url: `${SITIO}${ruta}`,
    changeFrequency: "daily",
  }));
}
