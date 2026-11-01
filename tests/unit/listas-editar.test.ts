import { describe, expect, it } from "vitest";
import {
  actualizarLista,
  agregarItem,
  ajustarItem,
  MAX_ITEMS,
  quitarItem,
} from "@/lib/listas/guardadas";

describe("ajustarItem", () => {
  it("no baja de 1 ni sube de 999", () => {
    expect(ajustarItem({ a: 1 }, "a", -1)).toEqual({ a: 1 });
    expect(ajustarItem({ a: 999 }, "a", 1)).toEqual({ a: 999 });
    expect(ajustarItem({ a: 3 }, "a", 2)).toEqual({ a: 5 });
  });

  it("un producto que no está no se inventa", () => {
    expect(ajustarItem({ a: 1 }, "b", 1)).toEqual({ a: 1 });
  });
});

describe("quitarItem", () => {
  it("borra solo ese producto y no muta el original", () => {
    const items = { a: 1, b: 2 };
    expect(quitarItem(items, "a")).toEqual({ b: 2 });
    expect(items).toEqual({ a: 1, b: 2 });
  });
});

describe("agregarItem", () => {
  it("agrega con cantidad 1 y respeta lo que ya estaba", () => {
    expect(agregarItem({ a: 4 }, "b")).toEqual({ a: 4, b: 1 });
    expect(agregarItem({ a: 4 }, "a")).toEqual({ a: 4 });
  });

  it("rechaza el producto 201", () => {
    const lleno = Object.fromEntries(
      Array.from({ length: MAX_ITEMS }, (_, i) => [`p${i}`, 1]),
    );
    expect(agregarItem(lleno, "nuevo")).toBeNull();
    expect(agregarItem(lleno, "p0")).toEqual(lleno);
  });
});

describe("actualizarLista", () => {
  it("cambia items y actualizada, no el nombre", () => {
    const lista = {
      nombre: "Quincena",
      items: { a: 1 },
      tienda_preferida: "d1",
      actualizada: "2020-01-01T00:00:00.000Z",
    };
    const r = actualizarLista(lista, { a: 3 });
    expect(r).toMatchObject({
      nombre: "Quincena",
      items: { a: 3 },
      tienda_preferida: "d1",
    });
    expect(r.actualizada > lista.actualizada).toBe(true);
  });
});
