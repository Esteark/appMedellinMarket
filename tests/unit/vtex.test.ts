import { describe, expect, it } from "vitest";
import { d1 } from "@/corrida/adaptadores/vtex";
import type { Consulta } from "@/corrida/tipos";
import { contextoPrueba, fetchFalso } from "../helpers/fetch-falso";

const consulta = (c: Partial<Consulta>): Consulta => ({
  producto_id: "x",
  unidad_base: "u",
  cantidad_base: 1,
  termino: null,
  sku: null,
  url: null,
  ...c,
});

// Variante en memoria del fixture por SKU (el archivo no se toca).
const conOferta = (cambio: { Price?: number; AvailableQuantity?: number }) =>
  fetchFalso("vtex", (archivo, texto) => {
    if (archivo !== "d1-sku.json") return texto;
    const datos = JSON.parse(texto);
    Object.assign(datos[0].items[0].sellers[0].commertialOffer, cambio);
    return JSON.stringify(datos);
  });

describe("adaptador VTEX (D1) sobre fixtures reales", () => {
  it("por SKU devuelve precio, sku y url", async () => {
    const { fetch } = fetchFalso("vtex");
    const h = await d1.buscar(
      consulta({ producto_id: "ajo", sku: "657" }),
      contextoPrueba(fetch),
    );
    expect(h).toEqual({
      producto_id: "ajo",
      precio: 1350,
      sku: "657",
      url: expect.stringMatching(/^https:\/\/www\.d1\.com\.co\/.+\/p$/),
    });
  });

  it("por término salta resultados no convertibles y normaliza a la unidad del producto", async () => {
    const { fetch } = fetchFalso("vtex");
    const ctx = contextoPrueba(fetch);
    // arroz 1 kg: "Kit Donación" (unidad) se salta; "Arroz Diana 500 G" a 1990 → 3980 → 4000
    const arroz = await d1.buscar(
      consulta({
        producto_id: "arroz",
        unidad_base: "g",
        cantidad_base: 1000,
        termino: "arroz",
      }),
      ctx,
    );
    expect(arroz).toMatchObject({ precio: 4000, sku: "1092" });
    // leche 1,1 L: los resultados en g se saltan; "X900 Ml" a 4700 → 5744 → 5700
    const leche = await d1.buscar(
      consulta({
        producto_id: "leche",
        unidad_base: "ml",
        cantidad_base: 1100,
        termino: "leche entera",
      }),
      ctx,
    );
    expect(leche).toMatchObject({ precio: 5700, sku: "772" });
  });

  it("null si AvailableQuantity es 0", async () => {
    const { fetch } = conOferta({ AvailableQuantity: 0 });
    expect(
      await d1.buscar(consulta({ sku: "657" }), contextoPrueba(fetch)),
    ).toBeNull();
  });

  it("null si el precio es 0", async () => {
    const { fetch } = conOferta({ Price: 0 });
    expect(
      await d1.buscar(consulta({ sku: "657" }), contextoPrueba(fetch)),
    ).toBeNull();
  });

  it("null si la unidad no es convertible", async () => {
    const { fetch } = fetchFalso("vtex");
    const h = await d1.buscar(
      consulta({ sku: "657", unidad_base: "ml", cantidad_base: 1000 }),
      contextoPrueba(fetch),
    );
    expect(h).toBeNull();
  });

  it("lee robots.txt una vez por corrida y antes de la API", async () => {
    const { fetch, pedidas } = fetchFalso("vtex");
    const ctx = contextoPrueba(fetch);
    await d1.buscar(consulta({ sku: "657" }), ctx);
    await d1.buscar(consulta({ termino: "ajo" }), ctx);
    expect(pedidas[0]).toBe("https://www.d1.com.co/robots.txt");
    expect(pedidas.filter((u) => u.endsWith("/robots.txt"))).toHaveLength(1);
  });
});
