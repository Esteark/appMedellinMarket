import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { aBase, itemDeProducto, leerListaCsv } from "@/lib/importar/lista";
import { PROMPT_LISTA } from "@/lib/importar/prompt-lista";

const CAB = "lista,producto,cantidad,unidad,nota";
const ejemplo = [
  CAB,
  "1 semana,Papa,4,kg,Capira / Pastusa; aprox. 8 libras",
  "1 semana,Pepino cohombro,4,kg,",
  "1 semana,Tomate chonto,3,kg,",
  "1 semana,Pimentón,3,kg,Rojo / Verde",
  "1 semana,Cebolla morada,3,kg,",
  "1 semana,Aguacate,3,kg,entre 6 y 8 unidades",
  "2 semanas,Papa,8,kg,",
  "2 semanas,Lechuga crespa,16,u,reponer a mitad de tiempo",
].join("\n");

describe("leerListaCsv", () => {
  it("devuelve una lista por sección con el ejemplo", () => {
    const r = leerListaCsv(ejemplo);
    expect(r.errores).toEqual([]);
    expect(r.listas.map((l) => [l.nombre, l.filas.length])).toEqual([
      ["1 semana", 6],
      ["2 semanas", 2],
    ]);
    expect(r.listas[0].filas[0].nota).toContain("aprox. 8 libras");
  });

  it("sin sección usa «Lista importada»; tolera BOM, CRLF y ;", () => {
    const r = leerListaCsv(
      `﻿lista;producto;cantidad;unidad;nota\r\n;Papa;1,5;kg;`,
    );
    expect(r.listas[0]).toMatchObject({ nombre: "Lista importada" });
    expect(r.listas[0].filas[0].cantidad).toBe(1.5);
  });

  it("rechaza cabecera distinta, cantidad no numérica, unidad rara y .xlsx con su línea", () => {
    expect(leerListaCsv("producto,cantidad\nPapa,1").errores[0]).toMatchObject({
      linea: 1,
    });
    expect(leerListaCsv(`${CAB}\n,Papa,mucho,kg,`).errores).toEqual([
      { linea: 2, mensaje: "cantidad_invalida" },
    ]);
    expect(leerListaCsv(`${CAB}\n,Papa,1,costal,`).errores[0].mensaje).toBe(
      "unidad_invalida",
    );
    expect(
      leerListaCsv("PK\u0003\u0004[Content_Types].xml").errores[0],
    ).toMatchObject({ linea: 1 });
  });

  it("rechaza más de 200 filas", () => {
    const filas = Array.from({ length: 201 }, (_, i) => `,P${i},1,u,`);
    expect(leerListaCsv([CAB, ...filas].join("\n")).errores[0].mensaje).toBe(
      "demasiadas_filas",
    );
  });
});

describe("conversión de unidades", () => {
  const kg = { unidad_base: "g", cantidad_base: 1000 };

  it("8 lb son 4 kg y el «aprox.» no entra en el cálculo", () => {
    expect(aBase(8, "lb")).toEqual({ base: "g", valor: 4000 });
    expect(itemDeProducto(kg, 8, "lb")).toEqual({ ok: true, item: 4 });
    expect(itemDeProducto(kg, 4, "kg")).toEqual({ ok: true, item: 4 });
  });

  it("redondea hacia arriba por presentación", () => {
    expect(
      itemDeProducto({ unidad_base: "g", cantidad_base: 500 }, 1.2, "kg"),
    ).toEqual({ ok: true, item: 3 });
  });

  it("marca como «unidad distinta» pedir unidades de algo que se vende por peso", () => {
    expect(itemDeProducto(kg, 12, "u")).toEqual({
      ok: false,
      error: "unidad_distinta",
    });
  });
});

describe("PROMPT_LISTA", () => {
  it("está contenido en prompts/importar-lista.md", () => {
    const md = readFileSync(
      "blueprints/mercado-medellin/prompts/importar-lista.md",
      "utf-8",
    ).replace(/\r\n/g, "\n");
    expect(md).toContain(PROMPT_LISTA);
  });
});

describe("registrarAliasLista", () => {
  it("sin sesión responde sin_sesion y no toca la base", async () => {
    const usuario = vi.fn().mockResolvedValue(null);
    const clienteServidor = vi.fn();
    vi.doMock("next/server", () => ({ connection: async () => {} }));
    vi.doMock("@/lib/datos", () => ({ usuario }));
    vi.doMock("@/lib/supabase/server", () => ({ clienteServidor }));
    const { registrarAliasLista } = await import("@/app/listas/acciones");
    expect(await registrarAliasLista("Papas", "p-papa")).toEqual({
      ok: false,
      error: "sin_sesion",
    });
    expect(clienteServidor).not.toHaveBeenCalled();
  });
});
