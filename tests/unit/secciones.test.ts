import { describe, expect, it } from "vitest";
import { optimoDividido } from "@/lib/precios/lista";
import { SIN_PRECIO, seccionar } from "@/lib/precios/secciones";

const tiendas = ["exito", "d1", "euro"];
const precios = {
  arroz: { exito: 5000, d1: 4000, euro: 4500 },
  leche: { exito: 3000, d1: 3500, euro: 2800 },
  queso: { exito: 9000, d1: null, euro: 9500 },
  trufa: { exito: null, d1: null, euro: null },
};
const productos = [
  { id: "arroz", grupo: "Granos" },
  { id: "leche", grupo: "Lácteos" },
  { id: "queso", grupo: "Lácteos" },
  { id: "trufa", grupo: "Gourmet" },
];
const lista = { arroz: 2, leche: 3, queso: 1 };

describe("seccionar", () => {
  it("por tienda: cada producto en su tienda más barata y los subtotales suman el óptimo", () => {
    const s = seccionar("tienda", lista, productos, precios, tiendas);
    // De mayor a menor subtotal: queso en Éxito, leche en Euro, arroz en D1.
    expect(s.map((x) => [x.clave, x.total])).toEqual([
      ["exito", 9000],
      ["euro", 8400],
      ["d1", 8000],
    ]);
    expect(s.reduce((a, x) => a + x.total, 0)).toBe(
      optimoDividido(lista, precios, tiendas).total,
    );
  });

  it("por grupo: agrupa por grupo y conserva las cantidades", () => {
    const s = seccionar("grupo", lista, productos, precios, tiendas);
    expect(s.map((x) => x.clave)).toEqual(["Lácteos", "Granos"]);
    expect(s[0].filas.map((f) => [f.id, f.cantidad])).toEqual([
      ["leche", 3],
      ["queso", 1],
    ]);
    // 3 × 2800 (euro) + 1 × 9000 (exito)
    expect(s[0].total).toBe(17400);
  });

  it("todo: una sola sección con todos los productos", () => {
    const s = seccionar("todo", lista, productos, precios, tiendas);
    expect(s).toHaveLength(1);
    expect(s[0].filas).toHaveLength(3);
  });

  it("los productos sin precio van en su sección al final, sin sumar nada", () => {
    const s = seccionar(
      "tienda",
      { ...lista, trufa: 1 },
      productos,
      precios,
      tiendas,
    );
    const ultima = s[s.length - 1];
    expect(ultima).toMatchObject({ clave: SIN_PRECIO, total: 0 });
    expect(ultima.filas).toEqual([{ id: "trufa", cantidad: 1, precio: null }]);
  });

  it("lista vacía: sin secciones", () => {
    expect(seccionar("tienda", {}, productos, precios, tiendas)).toEqual([]);
  });
});
