import { beforeEach, describe, expect, it, vi } from "vitest";

const usuario = vi.hoisted(() => vi.fn());
const clienteServidor = vi.hoisted(() => vi.fn());

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/supabase/server", () => ({ clienteServidor }));
vi.mock("@/lib/datos", () => ({ usuario }));

import {
  crearProducto,
  crearTienda,
  fusionarProductos,
  renombrarTienda,
} from "@/app/tiendas/acciones";
import { AVISOS } from "@/lib/avisos";
import {
  candidatosFusion,
  textoFusion,
  validarFusion,
} from "@/lib/tiendas/fusion";

const prod = (id: string, nombre: string) => ({ id, nombre });

describe("validarFusion", () => {
  it("rechaza ids iguales o vacíos", () => {
    expect(validarFusion("a", "a")).toEqual({
      ok: false,
      error: "fusion_no_permitida",
    });
    expect(validarFusion("", "b")).toEqual({
      ok: false,
      error: "fusion_sin_datos",
    });
    expect(validarFusion("a", "  ")).toEqual({
      ok: false,
      error: "fusion_sin_datos",
    });
    expect(validarFusion("a", "b")).toEqual({ ok: true });
  });

  it("las claves de error existen en el catálogo de avisos", () => {
    expect(AVISOS).toHaveProperty("fusion_no_permitida");
    expect(AVISOS).toHaveProperty("fusion_sin_datos");
  });
});

describe("candidatosFusion", () => {
  const catalogo = [
    prod("1", "Leche entera 1 L"),
    prod("2", "Leche deslactosada 1 L"),
    prod("3", "LECHE  ENTERA 1 l"),
    prod("4", "Arroz Diana 500 g"),
    prod("5", "Leche entera 900 ml"),
  ];

  it("pone primero el nombre normalizado idéntico y no propone el propio producto", () => {
    const r = candidatosFusion(catalogo[0], catalogo);
    expect(r[0].id).toBe("3");
    expect(r.map((p) => p.id)).not.toContain("1");
  });

  it("después ordena por palabras compartidas y deja fuera lo que no comparte nada", () => {
    const r = candidatosFusion(catalogo[0], catalogo).map((p) => p.id);
    expect(r).toEqual(["3", "5", "2"]);
    expect(r).not.toContain("4");
  });
});

describe("textoFusion", () => {
  it("nombra origen y destino", () => {
    const t = textoFusion("Papa pastusa", "Papa");
    expect(t).toContain("Papa pastusa");
    expect(t).toContain("«Papa»");
  });
});

describe("acciones de /tiendas", () => {
  beforeEach(() => {
    usuario.mockReset();
    clienteServidor.mockReset();
    usuario.mockResolvedValue({ id: "u1", email: "a@b.co" });
  });

  it("sin sesión no tocan la base", async () => {
    usuario.mockResolvedValue(null);
    expect(await crearTienda("Olímpica")).toEqual({
      ok: false,
      error: "sin_sesion",
    });
    expect(await fusionarProductos("a", "b")).toEqual({
      ok: false,
      error: "sin_sesion",
    });
    expect(clienteServidor).not.toHaveBeenCalled();
  });

  it("rechazan con zod un nombre de tienda de 1 o 61 caracteres antes de tocar la base", async () => {
    expect(await crearTienda("x")).toEqual({
      ok: false,
      error: "nombre_invalido",
    });
    expect(await crearTienda("x".repeat(61))).toEqual({
      ok: false,
      error: "nombre_invalido",
    });
    expect(await renombrarTienda("t1", "x")).toEqual({
      ok: false,
      error: "nombre_invalido",
    });
    expect(await renombrarTienda("t1", "x".repeat(61))).toEqual({
      ok: false,
      error: "nombre_invalido",
    });
    expect(clienteServidor).not.toHaveBeenCalled();
  });

  it("rechazan un producto con nombre fuera de 2–120 o frecuencia inválida", async () => {
    const base = { grupo: "Frutas", unidad: "kg", frecuencia: "diaria" };
    expect((await crearProducto({ ...base, nombre: "x" })).ok).toBe(false);
    expect((await crearProducto({ ...base, nombre: "x".repeat(121) })).ok).toBe(
      false,
    );
    expect(
      (await crearProducto({ ...base, nombre: "Mango", frecuencia: "mensual" }))
        .ok,
    ).toBe(false);
    expect(clienteServidor).not.toHaveBeenCalled();
  });

  it("renombrar a un nombre repetido devuelve tienda_nombre_repetido, no el error crudo", async () => {
    const eq = vi.fn().mockResolvedValue({
      error: { code: "23505", message: "duplicate key ..." },
    });
    clienteServidor.mockResolvedValue({
      from: () => ({ update: () => ({ eq }) }),
    });
    expect(await renombrarTienda("t1", "OLIMPICA")).toEqual({
      ok: false,
      error: "tienda_nombre_repetido",
    });
    expect(AVISOS).toHaveProperty("tienda_nombre_repetido");
  });

  it("crear una tienda cuyo nombre ya existe avisa y no inserta", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "olimpica", error: null });
    clienteServidor.mockResolvedValue({
      rpc,
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: "olimpica" } }),
          }),
        }),
      }),
    });
    expect(await crearTienda("OLIMPICA")).toEqual({
      ok: false,
      error: "tienda_nombre_repetido",
    });
    expect(rpc).not.toHaveBeenCalledWith("crear_tienda", expect.anything());
  });

  it("fusionar traduce los errores de la base a claves de avisos", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "producto_no_existe" },
    });
    clienteServidor.mockResolvedValue({ rpc });
    expect(await fusionarProductos("p1", "p2")).toEqual({
      ok: false,
      error: "fusion_sin_datos",
    });
    rpc.mockResolvedValue({
      data: null,
      error: { message: "algo interno raro" },
    });
    expect(await fusionarProductos("p1", "p2")).toEqual({
      ok: false,
      error: "importacion_error",
    });
  });

  it("fusionar devuelve los conteos cuando la base responde", async () => {
    const conteos = {
      precios: 2,
      historial: 1,
      manuales: 0,
      anotados: 1,
      gastos: 3,
      catalogo: 0,
      alias: 1,
      codigos: 0,
    };
    const rpc = vi.fn().mockResolvedValue({ data: conteos, error: null });
    clienteServidor.mockResolvedValue({ rpc });
    expect(await fusionarProductos("p1", "p2")).toEqual({
      ok: true,
      ...conteos,
    });
    expect(rpc).toHaveBeenCalledWith("fusionar_productos", {
      p_origen: "p1",
      p_destino: "p2",
    });
  });
});
