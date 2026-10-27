import * as cheerio from "cheerio";
import { normalizar } from "@/corrida/normalizar";
import { permitido } from "@/corrida/robots";
import type { Adaptador, Consulta, Contexto, Hallazgo } from "@/corrida/tipos";
import { unidadBase } from "@/lib/unidades";

// Solo páginas de producto (`/<categoría>/<nombre>.html`), sin parámetros: el robots.txt de La Vaquita
// (Magento) prohíbe la búsqueda (`/catalogsearch/`), el carrito y las URL con `?dir`, `?limit`, etc.
const PAGINA = /^https:\/\/vaquitaexpress\.com\.co\/[a-z0-9/_-]+\.html$/;

type Pagina = { nombre: string; precio: number; disponible: boolean };

/** El ld+json de Magento trae el nombre con espacios como `&#x20;`: se decodifica como HTML. */
const decodificar = (texto: string) =>
  cheerio.load(`<p>${texto}</p>`)("p").text();

/** Precio y disponibilidad del `Product` del ld+json (`offers.price`, una sola oferta). */
export function leerPagina(html: string): Pagina | null {
  const $ = cheerio.load(html);
  for (const script of $('script[type="application/ld+json"]').toArray()) {
    try {
      const datos = JSON.parse($(script).text());
      const oferta = datos?.offers;
      if (datos?.["@type"] !== "Product" || !oferta) continue;
      const precio = Number(oferta.price);
      if (!Number.isFinite(precio)) continue;
      return {
        nombre: decodificar(String(datos.name)),
        precio,
        disponible: /in\s?stock/i.test(String(oferta.availability)),
      };
    } catch {
      // ld+json roto o de otro tipo: se prueba con el siguiente
    }
  }
  return null;
}

async function buscar(c: Consulta, ctx: Contexto): Promise<Hallazgo | null> {
  if (!c.url || !PAGINA.test(c.url) || !(await permitido(c.url, ctx)))
    return null;
  const res = await ctx.fetch(c.url, {
    headers: { "user-agent": ctx.userAgent },
  });
  await ctx.esperar(ctx.pausaMs);
  if (!res.ok) return null;
  const p = leerPagina(await res.text());
  if (!p?.disponible || p.precio <= 0) return null;
  const precio = normalizar(p.precio, c, unidadBase(p.nombre));
  if (precio == null) return null;
  return { producto_id: c.producto_id, precio, sku: null, url: c.url };
}

export const vaquita: Adaptador = {
  tienda: "vaquita",
  cubre: (c) => c.url != null && PAGINA.test(c.url),
  buscar,
};
