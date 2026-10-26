import { describe, expect, it } from "vitest";
import { unidadBase } from "@/lib/unidades";

describe("unidadBase (las 5 reglas de §4)", () => {
  it("coma decimal → punto", () => {
    expect(unidadBase("1,5 L")).toEqual({
      unidad_base: "ml",
      cantidad_base: 1500,
    });
  });
  it("kg → g ×1000, L → ml ×1000, g y ml tal cual", () => {
    expect(unidadBase("1 kg")).toEqual({
      unidad_base: "g",
      cantidad_base: 1000,
    });
    expect(unidadBase("1 L")).toEqual({
      unidad_base: "ml",
      cantidad_base: 1000,
    });
    expect(unidadBase("bolsa 500 g")).toEqual({
      unidad_base: "g",
      cantidad_base: 500,
    });
    expect(unidadBase("200 ml")).toEqual({
      unidad_base: "ml",
      cantidad_base: 200,
    });
  });
  it('"kg" sola → g 1000', () => {
    expect(unidadBase("kg")).toEqual({ unidad_base: "g", cantidad_base: 1000 });
  });
  it('"6 × 330 ml" → ml 1980', () => {
    expect(unidadBase("6 × 330 ml")).toEqual({
      unidad_base: "ml",
      cantidad_base: 1980,
    });
  });
  it("cualquier otra unidad → u 1", () => {
    for (const u of ["cabeza", "manojo", "cubeta", "paquete"]) {
      expect(unidadBase(u)).toEqual({ unidad_base: "u", cantidad_base: 1 });
    }
  });
});

describe("unidadBase con nombres reales de D1", () => {
  it("punto de miles no es decimal", () => {
    expect(unidadBase("Arroz Integral Diana 1.000 G")).toEqual({
      unidad_base: "g",
      cantidad_base: 1000,
    });
  });
  it("Gr y Grs son gramos; X900 Ml son mililitros", () => {
    expect(unidadBase("Arroz Económico Albar 450 Grs").cantidad_base).toBe(450);
    expect(unidadBase("Crema de Leche Larga Vida 200 Gr").cantidad_base).toBe(
      200,
    );
    expect(unidadBase("Leche Súper Cremosa Latti X900 Ml")).toEqual({
      unidad_base: "ml",
      cantidad_base: 900,
    });
  });
});
