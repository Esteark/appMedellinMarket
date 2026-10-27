import { describe, expect, it } from "vitest";
import { PLANES, rubroDe } from "@/data/planes";
import { aplicarPlan } from "@/lib/precios/planes";

const todo = (plan: keyof typeof PLANES) =>
  new Set(Object.keys(PLANES[plan].items));

describe("aplicarPlan", () => {
  it("hogar trae los 28 ítems del origen", () => {
    const lista = aplicarPlan(
      {},
      PLANES.hogar.items,
      "reemplazar",
      todo("hogar"),
    );
    expect(Object.keys(lista)).toHaveLength(28);
  });

  it("reemplazar descarta la lista anterior; sumar acumula cantidades", () => {
    const items = { huevos: 4, pollo: 3 };
    const catalogo = new Set(["huevos", "pollo", "arroz"]);
    const antes = { huevos: 2, arroz: 1 };
    expect(aplicarPlan(antes, items, "reemplazar", catalogo)).toEqual(items);
    expect(aplicarPlan(antes, items, "sumar", catalogo)).toEqual({
      huevos: 6,
      pollo: 3,
      arroz: 1,
    });
  });

  it("redondea hacia arriba las cantidades fraccionarias", () => {
    const lista = aplicarPlan(
      {},
      PLANES.semana.items,
      "reemplazar",
      todo("semana"),
    );
    expect(lista.cebolla).toBe(2);
    expect(lista.pimenton).toBe(4);
    expect(Object.values(lista).every(Number.isInteger)).toBe(true);
  });

  it("omite ids que no están en el catálogo y cantidades no positivas", () => {
    const lista = aplicarPlan(
      {},
      { huevos: 4, fantasma: 2, sal: 0 },
      "sumar",
      new Set(["huevos", "sal"]),
    );
    expect(lista).toEqual({ huevos: 4 });
  });
});

describe("rubroDe", () => {
  it("clasifica por rubro del presupuesto", () => {
    expect(rubroDe({ id: "huevos", grupo: "Proteínas" })).toBe("Huevos");
    expect(rubroDe({ id: "pollo", grupo: "Proteínas" })).toBe("Carnes");
    expect(rubroDe({ id: "papa", grupo: "Tubérculos" })).toBe(
      "Verduras y frutas",
    );
    expect(rubroDe({ id: "papas_fritas", grupo: "Mecato" })).toBe("Antojos");
  });
});
