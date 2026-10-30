import { describe, expect, it } from "vitest";
import { CATALOGO_BARRIO } from "@/data/barrio";
import { alertasBarrioVencido } from "@/lib/alertas/reglas";
import { etiquetas, porActualizar } from "@/lib/precios/etiquetas";

const HOY = "2026-10-30";
const catalogo = new Set(["pollo", "leche"]);
const diaria = new Map([
  ["pollo", "diaria" as const],
  ["leche", "semanal" as const],
]);

describe("catálogo de barrio", () => {
  it("tiene 41 productos únicos: 17 proteínas, 12 lácteos, 7 panadería y 5 despensa", () => {
    expect(CATALOGO_BARRIO).toHaveLength(41);
    expect(new Set(CATALOGO_BARRIO.map((p) => p.id)).size).toBe(41);
    const por = (g: string) =>
      CATALOGO_BARRIO.filter((p) => p.grupo === g).length;
    expect([
      por("Proteínas"),
      por("Lácteos"),
      por("Panadería"),
      por("Despensa"),
    ]).toEqual([17, 12, 7, 5]);
    expect(CATALOGO_BARRIO.map((p) => p.orden)).toEqual(
      Array.from({ length: 41 }, (_, i) => i + 1),
    );
  });
});

describe("porActualizar", () => {
  it("14 días si es diaria y 30 si es semanal", () => {
    expect(porActualizar("2026-10-16", HOY, "diaria")).toBe(false); // 14 días
    expect(porActualizar("2026-10-15", HOY, "diaria")).toBe(true); // 15 días
    expect(porActualizar("2026-09-30", HOY, "semanal")).toBe(false); // 30 días
    expect(porActualizar("2026-09-29", HOY, "semanal")).toBe(true); // 31 días
  });

  it("en barrio la etiqueta es «actualizar», no «desactualizado»", () => {
    const base = {
      precio: 5000,
      estado: "anotado",
      fecha: "2026-10-10",
      frecuencia: "diaria" as const,
      hoy: HOY,
    };
    expect(etiquetas({ ...base, tienda: "barrio" })).toContain("actualizar");
    expect(etiquetas({ ...base, tienda: "barrio" })).not.toContain(
      "desactualizado",
    );
    expect(etiquetas({ ...base, tienda: "d1" })).toContain("desactualizado");
  });
});

describe("alertasBarrioVencido", () => {
  it("un producto de la lista sin precio de barrio genera 1 alerta", () => {
    const a = alertasBarrioVencido(
      { pollo: 1 },
      catalogo,
      new Map(),
      diaria,
      HOY,
    );
    expect(a).toHaveLength(1);
    expect(a[0]).toMatchObject({
      tipo: "precio_manual_vencido",
      producto_id: "pollo",
      tienda_id: "barrio",
    });
  });

  it("con precio de hace 10 días no genera nada; con 15 (diaria) o 31 (semanal) sí", () => {
    const con = (fecha: string, id: string) =>
      alertasBarrioVencido(
        { [id]: 1 },
        catalogo,
        new Map([[id, fecha]]),
        diaria,
        HOY,
      );
    expect(con("2026-10-20", "pollo")).toHaveLength(0);
    expect(con("2026-10-15", "pollo")).toHaveLength(1);
    expect(con("2026-09-29", "leche")).toHaveLength(1);
  });

  it("un producto del catálogo que no está en la lista no genera alerta", () => {
    expect(
      alertasBarrioVencido({ arroz: 2 }, catalogo, new Map(), diaria, HOY),
    ).toHaveLength(0);
    expect(
      alertasBarrioVencido({}, catalogo, new Map(), diaria, HOY),
    ).toHaveLength(0);
  });
});
