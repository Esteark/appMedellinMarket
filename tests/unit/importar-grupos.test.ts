import { describe, expect, it } from "vitest";
import { aPayload, aRevision, guardarLocal } from "@/lib/importar/factura";
import { agrupar, noCuadra } from "@/lib/importar/grupos";
import type { FilaCsv } from "@/lib/importar/tipos";

const csv = (
  linea: number,
  tienda: string,
  fecha: string,
  producto = "Leche",
): FilaCsv => ({
  linea,
  producto,
  cantidad: 2,
  precioTotal: 5000,
  tienda,
  fecha,
  codigo: "",
  duda: "",
});

describe("agrupar", () => {
  it("junta por tienda + fecha y usa la fecha del lote si la fila no trae", () => {
    const filas = [
      csv(2, "D1", "2026-10-30"),
      csv(3, "Plaza", "2026-10-29"),
      csv(4, "D1", ""),
      csv(5, "D1", "2026-10-30"),
    ].map((f) => aRevision(f, []));
    const g = agrupar(filas, "2026-10-30");
    expect(g.map((x) => x.indices)).toEqual([[0, 2, 3], [1]]);
    expect(g[0].fecha).toBe("2026-10-30");
  });
});

describe("noCuadra", () => {
  it("avisa con más de 500 pesos o más de 1 % de diferencia", () => {
    expect(noCuadra(100_000, 100_400)).toBe(false);
    expect(noCuadra(100_000, 100_501)).toBe(true);
    expect(noCuadra(20_000, 20_300)).toBe(true);
  });
});

describe("aRevision y aPayload", () => {
  it("un producto fuera del catálogo nace nuevo, en Otros y 'u'; las promociones se detectan por el nombre", () => {
    const r = aRevision(csv(2, "D1", "", "Aceite 900 ml oferta"), []);
    expect(r).toMatchObject({
      nuevo: true,
      rubro: "Otros",
      unidad: "u",
      promocion: true,
    });
  });

  it("el payload redondea el precio y respeta publicar_precio", () => {
    const [p] = aPayload([
      {
        ...aRevision(csv(2, "D1", ""), []),
        precioTotal: 12500.4,
        publicarPrecio: false,
      },
    ]);
    expect(p).toMatchObject({ precio_total: 12500, publicar_precio: false });
  });
});

describe("guardarLocal", () => {
  it("sin ventana no escribe ni lanza", () => {
    expect(() =>
      guardarLocal([aRevision(csv(2, "D1", ""), [])], "2026-10-30"),
    ).not.toThrow();
  });
});
