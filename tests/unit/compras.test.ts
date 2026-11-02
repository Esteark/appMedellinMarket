import { describe, expect, it } from "vitest";
import {
  comprasDelMes,
  comprasDeSemana,
  costoDeCompras,
} from "@/lib/planes/compras";
import { semanaVacia } from "@/lib/planes/semanas";

const semana = () => {
  const s = semanaVacia();
  s.dias[0].almuerzo = { arroz: 2, pollo: 1 };
  s.dias[1].cena = { arroz: 3 };
  s.despensa = { arroz: 1, sal: 1 };
  return s;
};

describe("compras derivadas del plan", () => {
  it("suma el mismo producto de varias comidas en una línea y añade la despensa", () => {
    expect(comprasDeSemana(semana())).toEqual({ arroz: 6, pollo: 1, sal: 1 });
  });

  it("el mes es la suma de las semanas y un plan sin semanas da vacío", () => {
    expect(comprasDelMes([semana(), semana(), semanaVacia()])).toEqual({
      arroz: 12,
      pollo: 2,
      sal: 2,
    });
    expect(comprasDelMes(undefined)).toEqual({});
  });

  it("usa la tienda más barata y no estima un producto sin precio", () => {
    const precios = {
      arroz: { d1: 3000, vaquita: 2500 },
      pollo: { d1: 8000, vaquita: null },
      sal: { d1: null, vaquita: undefined },
    };
    const r = costoDeCompras({ arroz: 6, pollo: 1, sal: 1 }, precios, [
      "d1",
      "vaquita",
    ]);
    expect(r.total).toBe(6 * 2500 + 8000);
    expect(r.sinPrecio).toBe(1);
    const sal = r.lineas.find((l) => l.id === "sal");
    expect(sal).toMatchObject({ tienda: null, costo: null });
    expect(r.lineas.find((l) => l.id === "arroz")?.costo).toBe(15000);
  });
});
