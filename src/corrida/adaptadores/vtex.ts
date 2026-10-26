import { z } from "zod";
import { normalizar } from "@/corrida/normalizar";
import { permitido } from "@/corrida/robots";
import type { Adaptador, Consulta, Contexto, Hallazgo } from "@/corrida/tipos";
import { unidadBase } from "@/lib/unidades";

// Solo D1: Éxito y Carulla prohíben /api/ en robots.txt (blueprint §1).
const HOST = "https://www.d1.com.co";

const Respuesta = z.array(
  z.object({
    productName: z.string(),
    link: z.string(),
    items: z.array(
      z.object({
        itemId: z.string(),
        measurementUnit: z.string(),
        unitMultiplier: z.number(),
        sellers: z.array(
          z.object({
            commertialOffer: z.object({
              Price: z.number(),
              AvailableQuantity: z.number(),
            }),
          }),
        ),
      }),
    ),
  }),
);

export function urlConsulta(c: Consulta): string | null {
  const base = `${HOST}/api/catalog_system/pub/products/search`;
  if (c.sku) return `${base}?fq=skuId:${encodeURIComponent(c.sku)}`;
  // D1 falla con espacios o "+": solo la primera palabra del término.
  const palabra = c.termino?.trim().split(/\s+/)[0];
  return palabra
    ? `${base}?ft=${encodeURIComponent(palabra)}&_from=0&_to=4`
    : null;
}

async function buscar(c: Consulta, ctx: Contexto): Promise<Hallazgo | null> {
  const url = urlConsulta(c);
  if (!url || !(await permitido(url, ctx))) return null;
  const res = await ctx.fetch(url, {
    headers: { "user-agent": ctx.userAgent },
  });
  await ctx.esperar(ctx.pausaMs);
  if (!res.ok) return null; // VTEX responde 206 en búsquedas: también es ok
  const productos = Respuesta.safeParse(await res.json());
  if (!productos.success) return null;

  // Primer resultado con existencias, precio y unidad convertible.
  for (const p of productos.data) {
    const item = p.items[0];
    const oferta = item?.sellers[0]?.commertialOffer;
    if (!oferta || oferta.AvailableQuantity <= 0 || oferta.Price <= 0) continue;
    // A granel (kg) el precio es por unitMultiplier kg; si no, la cantidad sale del nombre.
    const medida =
      item.measurementUnit.toLowerCase() === "kg"
        ? {
            unidad_base: "g" as const,
            cantidad_base: item.unitMultiplier * 1000,
          }
        : unidadBase(p.productName);
    const precio = normalizar(oferta.Price, c, medida);
    if (precio == null) continue;
    return {
      producto_id: c.producto_id,
      precio,
      sku: item.itemId,
      url: p.link,
    };
  }
  return null;
}

export const d1: Adaptador = { tienda: "d1", buscar };
