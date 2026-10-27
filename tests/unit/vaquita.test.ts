import { describe, expect, it } from "vitest";
import { vaquita } from "@/corrida/adaptadores/vaquita";
import type { Consulta } from "@/corrida/tipos";
import { contextoPrueba, fetchFalso } from "../helpers/fetch-falso";

const V = "https://vaquitaexpress.com.co";
const URL_ACEITE = `${V}/productos-marca-vaquita/aceite-de-girasol-la-vaquita-x-900ml.html`;
const URL_MOLIDA = `${V}/productos-marca-vaquita/carne-molida-especial-de-res-x-1000gr.html`;
const URL_BANANO = `${V}/productos-marca-vaquita/banano-murrapo.html`;

const consulta = (c: Partial<Consulta>): Consulta => ({
  producto_id: "x",
  unidad_base: "u",
  cantidad_base: 1,
  termino: null,
  sku: null,
  url: null,
  ...c,
});

const buscar = (c: Partial<Consulta>, f = fetchFalso("vaquita")) =>
  vaquita.buscar(consulta(c), contextoPrueba(f.fetch));

describe("adaptador La Vaquita sobre páginas reales", () => {
  it("lee offers.price y lo lleva a la unidad del producto (900 ml → 1 L)", async () => {
    // 12300 por 900 ml → 13667 → 13700
    expect(
      await buscar({
        producto_id: "aceite",
        unidad_base: "ml",
        cantidad_base: 1000,
        url: URL_ACEITE,
      }),
    ).toEqual({
      producto_id: "aceite",
      precio: 13700,
      sku: null,
      url: URL_ACEITE,
    });
  });

  it("en gramos, sin conversión cuando la presentación ya es la del producto", async () => {
    expect(
      await buscar({ unidad_base: "g", cantidad_base: 1000, url: URL_MOLIDA }),
    ).toMatchObject({ precio: 29565 });
  });

  it("null si la unidad no es convertible (banano sin gramaje contra gramos)", async () => {
    expect(
      await buscar({ unidad_base: "g", cantidad_base: 1000, url: URL_BANANO }),
    ).toBeNull();
  });

  it("null si está agotado o el precio es 0", async () => {
    const agotado = fetchFalso("vaquita", (_, html) =>
      html.replaceAll("In stock", "Out of stock"),
    );
    const cero = fetchFalso("vaquita", (_, html) =>
      html.replace(/"price":\s*"12300"/, '"price": "0"'),
    );
    const c = {
      unidad_base: "ml" as const,
      cantidad_base: 1000,
      url: URL_ACEITE,
    };
    expect(await buscar(c, agotado)).toBeNull();
    expect(await buscar(c, cero)).toBeNull();
  });

  it("nunca pide búsqueda, carrito, parámetros prohibidos ni páginas que no son producto", async () => {
    const espia = fetchFalso("vaquita");
    const ctx = contextoPrueba(espia.fetch);
    for (const url of [
      `${V}/catalogsearch/result/?q=aceite`,
      `${V}/checkout/cart/`,
      `${V}/despensa/aceites.html?limit=all`,
      `${V}/customer/account/login/`,
      "https://otra-tienda.com/aceite.html",
    ]) {
      expect(await vaquita.buscar(consulta({ url }), ctx)).toBeNull();
    }
    // Ninguna petición a rutas prohibidas: a lo sumo el robots.txt.
    expect(espia.pedidas.every((u) => u === `${V}/robots.txt`)).toBe(true);
  });

  it("cubre solo URLs de producto de su dominio", () => {
    expect(vaquita.cubre(consulta({ url: URL_ACEITE }))).toBe(true);
    expect(
      vaquita.cubre(consulta({ url: `${V}/catalogsearch/result/?q=a` })),
    ).toBe(false);
    expect(vaquita.cubre(consulta({ url: null }))).toBe(false);
  });
});
