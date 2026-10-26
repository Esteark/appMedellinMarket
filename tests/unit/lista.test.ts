import { describe, expect, it } from "vitest";
import {
  ahorro,
  mejorTiendaCompleta,
  optimoDividido,
  totalesPorTienda,
} from "@/lib/precios/lista";

const tiendas = ["exito", "d1", "euro"];
const precios = {
  arroz: { exito: 5000, d1: 4000, euro: 4500 },
  leche: { exito: 3000, d1: 3500, euro: 2800 },
  queso: { exito: 9000, d1: null, euro: 9500 },
};
const lista = { arroz: 2, leche: 3, queso: 1 };

describe("lista", () => {
  it("total y faltantes por tienda", () => {
    expect(totalesPorTienda(lista, precios, tiendas)).toEqual([
      { tienda: "exito", total: 28000, faltantes: [] },
      { tienda: "d1", total: 18500, faltantes: ["queso"] },
      { tienda: "euro", total: 26900, faltantes: [] },
    ]);
  });

  it("mejor tienda completa ignora las que tienen faltantes aunque sean más baratas", () => {
    const mejor = mejorTiendaCompleta(
      totalesPorTienda(lista, precios, tiendas),
    );
    expect(mejor?.tienda).toBe("euro");
    expect(mejor?.total).toBe(26900);
  });

  it("mejor tienda completa es null si ninguna tiene todo", () => {
    const sinQueso = {
      ...precios,
      queso: { exito: null, d1: null, euro: null },
    };
    expect(
      mejorTiendaCompleta(totalesPorTienda(lista, sinQueso, tiendas)),
    ).toBeNull();
  });

  it("óptimo dividido toma cada producto en su tienda más barata", () => {
    expect(optimoDividido(lista, precios, tiendas)).toEqual({
      total: 2 * 4000 + 3 * 2800 + 9000,
      tiendaDe: { arroz: "d1", leche: "euro", queso: "exito" },
      faltantes: [],
    });
  });

  it("ahorro = mejor tienda completa − óptimo dividido", () => {
    expect(ahorro(lista, precios, tiendas)).toBe(26900 - 25400);
  });
});
