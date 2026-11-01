import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leerCsv } from "@/lib/importar/csv";
import { hashLote } from "@/lib/importar/hash";

const CABECERA = "producto,cantidad,precio_total,tienda,fecha";
const csv = (nombre: string) =>
  readFileSync(`tests/importar/${nombre}`, "utf-8");

describe("leerCsv", () => {
  const base = `${CABECERA}\nLeche 1 L,3,12750,D1,2026-10-30\nArroz,2,6400,D1,2026-10-30`;

  it("BOM y CRLF no cambian las filas", () => {
    const limpio = leerCsv(base);
    const sucio = leerCsv(`\uFEFF${base.replace(/\n/g, "\r\n")}`);
    expect(limpio.errores).toEqual([]);
    expect(sucio.filas).toEqual(limpio.filas);
    expect(limpio.filas).toHaveLength(2);
  });

  it("con ; lee la coma decimal", () => {
    const r = leerCsv(
      "producto;cantidad;precio_total;tienda\nPapa;1,25;12500,50;Plaza",
    );
    expect(r.errores).toEqual([]);
    expect(r.filas[0].cantidad).toBe(1.25);
    expect(r.filas[0].precioTotal).toBe(12500.5);
  });

  it("una cabecera sin tienda falla en la línea 1", () => {
    const r = leerCsv("producto,cantidad,precio_total\nPapa,1,5000");
    expect(r.errores[0]).toMatchObject({ linea: 1 });
    expect(r.filas).toEqual([]);
  });

  it("una fila con 4 columnas cuando se esperan 5 falla con su número", () => {
    const r = leerCsv(
      `${CABECERA}\nLeche,3,12750,D1,2026-10-30\nArroz,2,6400,D1`,
    );
    expect(r.errores).toEqual([{ linea: 3, mensaje: "columnas_distintas" }]);
    expect(r.filas).toHaveLength(1);
  });

  it("501 filas se rechazan y 500 pasan", () => {
    const fila = "Leche,1,5000,D1,2026-10-30";
    const con = (n: number) =>
      leerCsv([CABECERA, ...Array(n).fill(fila)].join("\n"));
    expect(con(500).errores).toEqual([]);
    expect(con(501).errores[0].mensaje).toBe("demasiadas_filas");
  });

  it("# TOTAL llena total y # DUDOSA llega a notas, ninguna crea fila", () => {
    const r = leerCsv(`${base}\n# TOTAL=48200\n# DUDOSA: falta un renglón`);
    expect(r.total).toBe(48200);
    expect(r.notas).toEqual(["falta un renglón"]);
    expect(r.filas).toHaveLength(2);
  });

  it("tolera vallas de markdown y cabecera con acentos y mayúsculas", () => {
    const r = leerCsv(
      "```csv\nProducto,Cantidad,Precio_Total,Tienda\nPapa,1,5000,Plaza\n```",
    );
    expect(r.errores).toEqual([]);
    expect(r.filas).toHaveLength(1);
  });

  it("rechaza precio con letras, fecha imposible y archivo de más de 1 MB", () => {
    expect(
      leerCsv(`${CABECERA}\nPapa,1,seis mil,D1,2026-10-30`).errores[0].mensaje,
    ).toBe("precio_invalido");
    expect(
      leerCsv(`${CABECERA}\nPapa,1,5000,D1,2026-02-30`).errores[0].mensaje,
    ).toBe("fecha_invalida");
    expect(leerCsv("x".repeat(1024 * 1024 + 1)).errores[0].mensaje).toBe(
      "archivo_muy_grande",
    );
  });

  it("lee los CSV de ejemplo", () => {
    expect(leerCsv(csv("d1.csv"))).toMatchObject({ total: 41050, errores: [] });
    expect(leerCsv(csv("barrio.csv")).filas).toHaveLength(2);
    const varias = leerCsv(csv("varias-tiendas.csv"));
    expect(
      new Set(varias.filas.map((f) => `${f.tienda}|${f.fecha}`)).size,
    ).toBe(2);
    expect(leerCsv(csv("con-promocion.csv")).filas).toHaveLength(2);
    expect(leerCsv(csv("malo.csv")).errores.map((e) => e.linea)).toEqual([
      3, 4,
    ]);
  });
});

describe("hashLote", () => {
  it("es igual para el mismo texto y fecha, e ignora BOM y CRLF", async () => {
    const a = await hashLote("a,b\n1,2", "2026-10-30");
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(await hashLote("\uFEFFa,b\r\n1,2\r\n", "2026-10-30")).toBe(a);
  });

  it("cambia si cambia la fecha o el texto", async () => {
    const a = await hashLote("a,b\n1,2", "2026-10-30");
    expect(await hashLote("a,b\n1,2", "2026-10-31")).not.toBe(a);
    expect(await hashLote("a,b\n1,3", "2026-10-30")).not.toBe(a);
  });
});
