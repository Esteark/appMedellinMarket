import * as cheerio from "cheerio";
import { normalizar } from "@/corrida/normalizar";
import { permitido } from "@/corrida/robots";
import type { Adaptador, Consulta, Contexto, Hallazgo } from "@/corrida/tipos";
import { unidadBase } from "@/lib/unidades";

// Solo páginas de producto: robots.txt de Euro prohíbe la API, la búsqueda y toda URL con ?, & o %.
const PAGINA_P = /^https:\/\/www\.eurosupermercados\.com\.co\/[^?&%]+\/p$/;

type Pagina = {
  nombre: string;
  precio: number;
  disponible: boolean;
  sku: string | null;
  /** "kg" si se vende a granel; el precio es entonces por `multiplicador` kg. */
  unidad: string;
  multiplicador: number;
};

type Estado = Record<string, Record<string, unknown> | undefined>;

function leerEstado(html: string): Estado | null {
  const linea = html.match(/^\s*__STATE__ = (\{.*\});?\s*$/m);
  if (!linea) return null;
  try {
    return JSON.parse(linea[1]) as Estado;
  } catch {
    return null;
  }
}

function porSufijo(estado: Estado | null, sufijo: string) {
  if (!estado) return undefined;
  return Object.entries(estado).find(([clave]) => clave.endsWith(sufijo))?.[1];
}

/** Precio y datos del producto: primero del ld+json (offers.price), si no del __STATE__. */
export function leerPagina(html: string): Pagina | null {
  const estado = leerEstado(html);
  const item = porSufijo(estado, ".items.0");
  const unidad = String(item?.measurementUnit ?? "und").toLowerCase();
  const multiplicador = Number(item?.unitMultiplier ?? 1);

  const $ = cheerio.load(html);
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try {
      const datos = JSON.parse($(script).text());
      const oferta = datos?.offers?.offers?.[0];
      if (datos?.["@type"] !== "Product" || typeof oferta?.price !== "number")
        continue;
      return {
        nombre: String(datos.name),
        precio: oferta.price,
        disponible: String(oferta.availability).endsWith("/InStock"),
        sku: datos.sku ? String(datos.sku) : null,
        unidad,
        multiplicador,
      };
    } catch {
      // ld+json roto: se intenta con el __STATE__
    }
  }

  const oferta = porSufijo(estado, ".items.0.sellers.0.commertialOffer");
  if (!item || typeof oferta?.Price !== "number") return null;
  return {
    nombre: String(item.name ?? item.nameComplete ?? ""),
    precio: oferta.Price,
    disponible: Number(oferta.AvailableQuantity) > 0,
    sku: item.itemId ? String(item.itemId) : null,
    unidad,
    multiplicador,
  };
}

async function buscar(c: Consulta, ctx: Contexto): Promise<Hallazgo | null> {
  if (!c.url || !PAGINA_P.test(c.url) || !(await permitido(c.url, ctx)))
    return null;
  const res = await ctx.fetch(c.url, {
    headers: { "user-agent": ctx.userAgent },
  });
  await ctx.esperar(ctx.pausaMs);
  if (!res.ok) return null;
  const p = leerPagina(await res.text());
  if (!p?.disponible || p.precio <= 0) return null;
  const medida =
    p.unidad === "kg"
      ? { unidad_base: "g" as const, cantidad_base: p.multiplicador * 1000 }
      : unidadBase(p.nombre);
  const precio = normalizar(p.precio, c, medida);
  if (precio == null) return null;
  return { producto_id: c.producto_id, precio, sku: p.sku, url: c.url };
}

export const euro: Adaptador = { tienda: "euro", buscar };
