import { readFileSync } from "node:fs";
import { type Contexto, USER_AGENT_POR_DEFECTO } from "@/corrida/tipos";

/**
 * fetch que sirve los fixtures capturados de `tests/fixtures/<grupo>/` por URL exacta
 * (según capturado.json) y responde 404 al resto. `variar` deriva en memoria una variante
 * del fixture (sin existencias, precio 0…): los archivos nunca se editan.
 */
export function fetchFalso(
  grupos: string | string[],
  variar?: (archivo: string, texto: string) => string,
) {
  // url → ruta del fixture, de todos los grupos pedidos
  const rutaDe = new Map<string, string>();
  for (const grupo of [grupos].flat()) {
    const carpeta = `tests/fixtures/${grupo}`;
    const { urls } = JSON.parse(
      readFileSync(`${carpeta}/capturado.json`, "utf8"),
    ) as { urls: Record<string, string> };
    for (const [archivo, url] of Object.entries(urls))
      rutaDe.set(url, `${carpeta}/${archivo}`);
  }
  const pedidas: string[] = [];
  const falso = (async (entrada: string | URL | Request) => {
    const url = entrada instanceof Request ? entrada.url : String(entrada);
    pedidas.push(url);
    const ruta = rutaDe.get(url);
    if (!ruta) return new Response("", { status: 404 });
    // Bytes tal cual: hay fixtures binarios (xlsx, pdf).
    const bytes = readFileSync(ruta);
    const archivo = ruta.slice(ruta.lastIndexOf("/") + 1);
    return new Response(
      variar ? variar(archivo, bytes.toString("utf8")) : bytes,
      { status: 200 },
    );
  }) as typeof fetch;
  return { fetch: falso, pedidas };
}

export function contextoPrueba(f: typeof fetch): Contexto {
  return {
    fetch: f,
    esperar: async () => {},
    hoy: "2026-10-26",
    pausaMs: 0,
    userAgent: USER_AGENT_POR_DEFECTO,
  };
}
