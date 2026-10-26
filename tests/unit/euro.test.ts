import { describe, expect, it } from "vitest";
import { euro } from "@/corrida/adaptadores/euro";
import type { Consulta } from "@/corrida/tipos";
import { contextoPrueba, fetchFalso } from "../helpers/fetch-falso";

const EURO = "https://www.eurosupermercados.com.co";
const URL_ACEITE = `${EURO}/aceite-girasol-100---euromax--x-900ml-444/p`;

const consulta = (c: Partial<Consulta>): Consulta => ({
  producto_id: "x",
  unidad_base: "u",
  cantidad_base: 1,
  termino: null,
  sku: null,
  url: null,
  ...c,
});

const buscar = (c: Partial<Consulta>, f = fetchFalso("euro")) =>
  euro.buscar(consulta(c), contextoPrueba(f.fetch));

describe("adaptador Euro sobre páginas /p reales", () => {
  it("extrae offers.price y lo lleva a la unidad del producto (900 ml → 1 L)", async () => {
    // 8990 por 900 ml → 9989 → 10000
    expect(
      await buscar({
        producto_id: "aceite",
        unidad_base: "ml",
        cantidad_base: 1000,
        url: URL_ACEITE,
      }),
    ).toEqual({
      producto_id: "aceite",
      precio: 10000,
      sku: "00019323",
      url: URL_ACEITE,
    });
  });

  it("a granel por kg y en gramos", async () => {
    expect(
      await buscar({
        unidad_base: "g",
        cantidad_base: 1000,
        url: `${EURO}/aguacate-hass-c4a/p`,
      }),
    ).toMatchObject({ precio: 8980 });
    expect(
      await buscar({
        unidad_base: "g",
        cantidad_base: 160,
        url: `${EURO}/atun-lomitos-en-agua--euromax--x-160gr-892/p`,
      }),
    ).toMatchObject({ precio: 4490 });
  });

  it("null si la unidad no es convertible (6 croissants de 300 g contra 'unidad')", async () => {
    expect(
      await buscar({
        url: `${EURO}/pan-croissant-x6und--300gr-esponjados-072/p`,
      }),
    ).toBeNull();
  });

  it("sin ld+json usa el __STATE__", async () => {
    const sinLd = fetchFalso("euro", (_, html) =>
      html.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
        "",
      ),
    );
    expect(
      await buscar(
        { unidad_base: "ml", cantidad_base: 1000, url: URL_ACEITE },
        sinLd,
      ),
    ).toMatchObject({ precio: 10000 });
  });

  it("null si está agotado", async () => {
    const agotado = fetchFalso("euro", (_, html) =>
      html.replaceAll("schema.org/InStock", "schema.org/OutOfStock"),
    );
    expect(
      await buscar(
        { unidad_base: "ml", cantidad_base: 1000, url: URL_ACEITE },
        agotado,
      ),
    ).toBeNull();
  });

  it("nunca pide rutas que robots prohíbe ni páginas que no son /p", async () => {
    const espia = fetchFalso("euro");
    const ctx = contextoPrueba(espia.fetch);
    for (const url of [
      `${EURO}/aceite%20girasol/p`, // robots: Disallow /*%
      `${EURO}/busca/aceite/p`, // robots: Disallow /busca/
      `${EURO}/api/catalog_system/pub/products/search?ft=aceite`,
      `${EURO}/mercado/lacteos`, // categoría, no /p
    ]) {
      expect(await euro.buscar(consulta({ url }), ctx)).toBeNull();
    }
    // A lo sumo el robots.txt; ninguna de las rutas de arriba.
    expect(espia.pedidas.every((u) => u === `${EURO}/robots.txt`)).toBe(true);
  });
});
