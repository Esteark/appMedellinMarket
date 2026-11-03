import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leerCsv } from "@/lib/importar/csv";
import { emparejarProducto } from "@/lib/importar/emparejar";
import { inferirProducto } from "@/lib/importar/inferir";
import { repartirCupo, resumirFactura } from "@/lib/importar/resumen";
import type { ModoFila } from "@/lib/importar/tipos";

// La factura real contra un catálogo sin ninguno de sus productos: el peor caso, la primera vez.
const catalogoVacio = { productos: [], aliasProducto: [], codigos: {} };
const filas = leerCsv(
  readFileSync("tests/importar/factura-larga.csv", "utf-8"),
).filas.map((f) => {
  const existe = emparejarProducto(
    { producto: f.producto, tiendaId: null, codigo: f.codigo },
    catalogoVacio,
  );
  const modo: ModoFila = existe
    ? "existente"
    : inferirProducto(f.producto, f.cantidad).noEsProducto
      ? "solo_gasto"
      : "crear";
  return { producto: f.producto, tienda: f.tienda, fecha: f.fecha, modo };
});

describe("resumirFactura con la factura real", () => {
  const r = resumirFactura(filas, { limite: 200, usados: 0 });

  it("da 59 líneas, 52 productos distintos por crear y 1 línea que no es producto", () => {
    expect(r.lineas).toBe(59);
    // 52 nombres distintos, de los cuales «Bolsa Recicla» no se crea.
    expect(r.nuevos).toBe(51);
    expect(r.soloGasto).toBe(1);
    expect(r.existentes).toBe(0);
  });

  it("junta las 7 líneas repetidas (mismo producto, tienda y fecha)", () => {
    expect(r.repetidas).toBe(7);
  });

  it("cuenta las 3 tiendas", () => {
    expect(r.tiendas).toBe(3);
  });

  it("con 200 de cupo alcanza; con el tope viejo de 50, no", () => {
    expect(r.cupo).toMatchObject({
      limite: 200,
      queda: 200,
      necesita: 51,
      alcanza: true,
    });
    const vieja = resumirFactura(filas, { limite: 50, usados: 0 });
    expect(vieja.cupo).toMatchObject({
      queda: 50,
      necesita: 51,
      alcanza: false,
    });
  });

  it("lo ya creado hoy baja el cupo, y nunca queda negativo", () => {
    expect(resumirFactura(filas, { limite: 200, usados: 180 }).cupo.queda).toBe(
      20,
    );
    expect(resumirFactura(filas, { limite: 200, usados: 260 }).cupo.queda).toBe(
      0,
    );
  });
});

describe("repartirCupo", () => {
  it("con cupo 40 deja exactamente 40 productos por crear y el resto como solo gasto", () => {
    const repartidas = repartirCupo(filas, 40);
    const r = resumirFactura(repartidas, { limite: 200, usados: 0 });
    expect(r.nuevos).toBe(40);
    expect(r.cupo.alcanza).toBe(true);
    expect(repartidas).toHaveLength(filas.length);
    // Las que ya eran solo gasto siguen igual y se suman las que pasaron del cupo.
    expect(
      repartidas.filter((f) => f.modo === "solo_gasto").length,
    ).toBeGreaterThan(1);
  });

  it("las líneas del mismo producto comparten suerte", () => {
    const repartidas = repartirCupo(filas, 10);
    const modoPor = new Map<string, Set<string>>();
    for (const f of repartidas) {
      const s = modoPor.get(f.producto) ?? new Set<string>();
      s.add(f.modo);
      modoPor.set(f.producto, s);
    }
    for (const modos of modoPor.values()) expect(modos.size).toBe(1);
  });

  it("si el cupo alcanza no cambia nada, y no muta la lista recibida", () => {
    const antes = JSON.stringify(filas);
    expect(repartirCupo(filas, 200)).toEqual(filas);
    repartirCupo(filas, 5);
    expect(JSON.stringify(filas)).toBe(antes);
  });

  it("no toca las existentes", () => {
    const mezcla = [
      {
        producto: "A",
        tienda: "T",
        fecha: "2026-10-30",
        modo: "existente" as const,
      },
      {
        producto: "B",
        tienda: "T",
        fecha: "2026-10-30",
        modo: "crear" as const,
      },
      {
        producto: "C",
        tienda: "T",
        fecha: "2026-10-30",
        modo: "crear" as const,
      },
    ];
    expect(repartirCupo(mezcla, 1).map((f) => f.modo)).toEqual([
      "existente",
      "crear",
      "solo_gasto",
    ]);
  });
});
