import { hoyBogota } from "@/lib/fecha";
import type { UnidadBase } from "@/lib/unidades";

export const USER_AGENT_POR_DEFECTO =
  "MercadoMedellinBot/1.0 (+uso familiar; contacto en README)";

/** Todo lo que un adaptador toca del mundo exterior; en pruebas se inyecta un fetch falso. */
export type Contexto = {
  fetch: typeof fetch;
  esperar: (ms: number) => Promise<void>;
  hoy: string;
  pausaMs: number;
  userAgent: string;
};

/** Lo que la corrida le pide a un adaptador sobre un producto en una tienda. */
export type Consulta = {
  producto_id: string;
  unidad_base: UnidadBase;
  cantidad_base: number;
  termino: string | null;
  sku: string | null;
  url: string | null;
};

/** Precio ya normalizado a la unidad del producto. */
export type Hallazgo = {
  producto_id: string;
  precio: number;
  sku: string | null;
  url: string;
};

export type Adaptador = {
  tienda: string;
  buscar: (consulta: Consulta, ctx: Contexto) => Promise<Hallazgo | null>;
};

export function contextoReal(): Contexto {
  return {
    fetch,
    esperar: (ms) => new Promise((r) => setTimeout(r, ms)),
    hoy: hoyBogota(),
    pausaMs: 1000,
    userAgent: process.env.CORRIDA_USER_AGENT || USER_AGENT_POR_DEFECTO,
  };
}
