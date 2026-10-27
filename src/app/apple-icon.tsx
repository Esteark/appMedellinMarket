import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícono al agregar la app a la pantalla de inicio en iPhone: el mismo logo, en PNG. */
export default async function IconoApple() {
  const logo = await readFile(join(process.cwd(), "src/app/icon.svg"));
  return new ImageResponse(
    // biome-ignore lint/performance/noImgElement: ImageResponse solo entiende <img>
    <img
      src={`data:image/svg+xml;base64,${logo.toString("base64")}`}
      width={180}
      height={180}
      alt=""
    />,
    size,
  );
}
