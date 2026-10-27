import { describe, expect, it } from "vitest";
import { datosPdf } from "@/lib/precios/exportar";
import { optimoDividido } from "@/lib/precios/lista";

const tiendas = [
  { id: "exito", nombre: "Éxito" },
  { id: "d1", nombre: "D1" },
  { id: "euro", nombre: "Euro" },
];
const base = { grupo: "Despensa", viejos: {}, mejor: null };
const productos = [
  {
    ...base,
    id: "arroz",
    nombre: "Arroz",
    unidad: "1 kg",
    precios: { exito: 5000, d1: 4000, euro: 4500 },
    // D1 (la más barata) con precio desactualizado hace 5 días.
    viejos: { d1: 5 },
    mejor: { tienda: "d1", precio: 4000, estado: "real" },
  },
  {
    ...base,
    id: "leche",
    nombre: "Leche",
    unidad: "1,1 L",
    precios: { exito: 3000, d1: 3500, euro: 2800 },
    mejor: { tienda: "euro", precio: 2800, estado: "anotado" },
  },
  {
    ...base,
    id: "queso",
    nombre: "Queso",
    unidad: "500 g",
    precios: { exito: 9000, d1: null, euro: 9500 },
    mejor: { tienda: "exito", precio: 9000, estado: "real" },
  },
  {
    ...base,
    id: "trufa",
    nombre: "Trufa",
    unidad: "50 g",
    precios: { exito: null, d1: null, euro: null },
  },
];
const lista = { arroz: 2, leche: 3, queso: 1, trufa: 1 };
const precios = Object.fromEntries(productos.map((p) => [p.id, p.precios]));

describe("datosPdf", () => {
  const d = datosPdf(lista, productos, tiendas);

  it("una tabla por tienda del óptimo dividido, de mayor a menor subtotal", () => {
    expect(d.tablas.map((t) => [t.tienda, t.subtotal])).toEqual([
      ["Éxito", 9000],
      ["Euro", 8400],
      ["D1", 8000],
    ]);
  });

  it("el total es el del óptimo dividido y cada subtotal es precio × cantidad", () => {
    const { total } = optimoDividido(
      { arroz: 2, leche: 3, queso: 1 },
      precios,
      tiendas.map((t) => t.id),
    );
    expect(d.total).toBe(total);
    const euro = d.tablas.find((t) => t.tienda === "Euro");
    expect(euro?.filas).toEqual([
      {
        producto: "Leche (1,1 L)",
        cantidad: 3,
        precio: 2800,
        subtotal: 8400,
        marca: true,
      },
    ]);
  });

  it("marca los precios anotados y los desactualizados, y solo esos", () => {
    const marcas = d.tablas.flatMap((t) =>
      t.filas.filter((f) => f.marca).map((f) => f.producto),
    );
    expect(marcas.sort()).toEqual(["Arroz (1 kg)", "Leche (1,1 L)"]);
    expect(d.hayMarcas).toBe(true);
  });

  it("los productos sin precio van aparte y no suman", () => {
    expect(d.sinPrecio).toEqual([
      {
        producto: "Trufa (50 g)",
        cantidad: 1,
        precio: null,
        subtotal: null,
        marca: false,
      },
    ]);
    expect(d.tablas.some((t) => t.filas.some((f) => f.precio == null))).toBe(
      false,
    );
  });
});
