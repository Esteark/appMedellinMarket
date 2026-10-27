import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Mercado Medellín: compara precios de mercado en Medellín";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Vista previa al compartir el enlace (WhatsApp, redes): logo, nombre y para qué sirve. */
export default async function Imagen() {
  const logo = await readFile(join(process.cwd(), "src/app/icon.svg"));
  const src = `data:image/svg+xml;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 56,
        padding: "0 88px",
        background: "#FAFAF7",
        color: "#0F172A",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: ImageResponse solo entiende <img> */}
      <img src={src} width={260} height={260} alt="" />
      <div
        style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}
      >
        <div style={{ fontSize: 80, fontWeight: 700, letterSpacing: -2 }}>
          Mercado Medellín
        </div>
        <div style={{ fontSize: 36, color: "#5B6474", lineHeight: 1.3 }}>
          Compara precios de mercado en las tiendas de Medellín y arma la lista
          de tu familia.
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            marginTop: 8,
            padding: "10px 22px",
            borderRadius: 999,
            background: "#E7F7F0",
            color: "#047857",
            fontSize: 30,
            fontWeight: 600,
          }}
        >
          ↓ Encuentra dónde sale más barato
        </div>
      </div>
    </div>,
    size,
  );
}
