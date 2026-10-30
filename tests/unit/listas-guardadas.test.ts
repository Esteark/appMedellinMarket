import { describe, expect, it } from "vitest";
import {
  cargar,
  fusionarListas,
  type ListaGuardada,
  normalizarNombre,
  recortarALimite,
  sumar,
} from "@/lib/listas/guardadas";

const lista = (
  nombre: string,
  actualizada: string,
  items: Record<string, number> = { arroz: 1 },
): ListaGuardada => ({ nombre, items, tienda_preferida: "d1", actualizada });

describe("listas guardadas", () => {
  it("normaliza el nombre como la base: sin espacios en los bordes y sin mayúsculas", () => {
    expect(normalizarNombre("  Mercado Quincena ")).toBe("mercado quincena");
  });

  it("fusiona por nombre y gana la más reciente", () => {
    const local = lista("Quincena", "2026-10-02", { arroz: 5 });
    const nube = lista(" quincena", "2026-10-01", { arroz: 1 });
    expect(fusionarListas([local], [nube])).toEqual([local]);
    expect(fusionarListas([nube], [local])).toEqual([local]);
  });

  it("conserva la local si el nombre no está en la nube", () => {
    const solo = lista("Fiesta", "2026-10-03");
    const resultado = fusionarListas([solo], [lista("Quincena", "2026-10-01")]);
    expect(resultado.map((l) => l.nombre).sort()).toEqual([
      "Fiesta",
      "Quincena",
    ]);
  });

  it("recorta a 20 y deja las más recientes", () => {
    const muchas = Array.from({ length: 25 }, (_, i) =>
      lista(`l${i}`, `2026-10-${String(i + 1).padStart(2, "0")}`),
    );
    const r = recortarALimite(muchas);
    expect(r).toHaveLength(20);
    expect(r.some((l) => l.nombre === "l0")).toBe(false);
    expect(r.some((l) => l.nombre === "l24")).toBe(true);
  });

  it("sumar usa max y nunca baja una cantidad", () => {
    const g = lista("x", "2026-10-01", { arroz: 2, leche: 4 });
    expect(sumar({ arroz: 5, papa: 1 }, g)).toEqual({
      arroz: 5,
      papa: 1,
      leche: 4,
    });
  });

  it("cargar reemplaza la lista activa", () => {
    const g = lista("x", "2026-10-01", { leche: 2 });
    expect(cargar(g)).toEqual({ leche: 2 });
    expect(cargar(g)).not.toBe(g.items);
  });
});
