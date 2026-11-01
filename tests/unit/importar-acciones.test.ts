import { beforeEach, describe, expect, it, vi } from "vitest";

const usuario = vi.hoisted(() => vi.fn());
const clienteServidor = vi.hoisted(() => vi.fn());

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/supabase/server", () => ({ clienteServidor }));

import { AVISOS } from "@/lib/avisos";

// `usuario` vive en el mismo módulo que `catalogoTiendas`: se toma el real y se reemplaza solo la sesión.
vi.mock("@/lib/datos", async (original) => {
  const real = await original<typeof import("@/lib/datos")>();
  return { ...real, usuario };
});

import {
  deshacerImportacion,
  importarCompra,
} from "@/app/presupuesto/acciones";
import { catalogoTiendas } from "@/lib/datos";
import { leerImportacionesLocal } from "@/lib/presupuesto/almacenamiento";

const HASH = "a".repeat(64);
const fila = {
  producto: "Leche 1 L",
  tienda: "D1",
  cantidad: 3,
  precio_total: 12750,
};
const entrada = (cambios: object = {}) => ({
  fecha: "2026-10-30",
  publicar: true,
  hash: HASH,
  filas: [fila],
  ...cambios,
});

beforeEach(() => {
  usuario.mockReset();
  clienteServidor.mockReset();
  usuario.mockResolvedValue({ id: "u1", email: "a@b.co" });
});

describe("importarCompra", () => {
  it("sin sesión responde sin_sesion y no toca la base", async () => {
    usuario.mockResolvedValue(null);
    expect(await importarCompra(entrada())).toEqual({
      ok: false,
      error: "sin_sesion",
    });
    expect(clienteServidor).not.toHaveBeenCalled();
  });

  it("rechaza con zod más de 500 filas, fecha inválida o hash inválido antes de tocar la base", async () => {
    for (const malo of [
      entrada({ filas: Array(501).fill(fila) }),
      entrada({ fecha: "2026-02-30" }),
      entrada({ hash: "xyz" }),
      entrada({ filas: [{ ...fila, precio_total: 12.5 }] }),
    ])
      expect(await importarCompra(malo)).toEqual({
        ok: false,
        error: "importacion_error",
      });
    expect(clienteServidor).not.toHaveBeenCalled();
  });

  it("traduce los errores de Postgres a claves del catálogo, sin filtrar el mensaje crudo", async () => {
    const rpc = vi.fn();
    clienteServidor.mockResolvedValue({ rpc });
    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "importacion_duplicada" },
    });
    expect(await importarCompra(entrada())).toEqual({
      ok: false,
      error: "importacion_duplicada",
    });
    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "relation x does not exist" },
    });
    const r = await importarCompra(entrada());
    expect(r).toEqual({ ok: false, error: "importacion_error" });
    for (const clave of [
      "importacion_duplicada",
      "importacion_error",
      "limite_tiendas",
      "limite_productos",
    ])
      expect(AVISOS, clave).toHaveProperty(clave);
  });

  it("devuelve el resumen del lote cuando la base responde", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        importacion_id: "i1",
        gastos: 1,
        precios: 1,
        tiendas_creadas: 0,
        productos_creados: 1,
        avisos: [],
      },
      error: null,
    });
    clienteServidor.mockResolvedValue({ rpc });
    expect(await importarCompra(entrada())).toMatchObject({
      ok: true,
      importacionId: "i1",
      productosCreados: 1,
    });
    expect(rpc).toHaveBeenCalledWith(
      "importar_compra",
      expect.objectContaining({ p_hash: HASH, p_publicar: true }),
    );
  });
});

describe("deshacerImportacion", () => {
  it("rechaza un id que no es uuid", async () => {
    expect(await deshacerImportacion("no-es-uuid")).toEqual({
      ok: false,
      error: "importacion_error",
    });
    expect(clienteServidor).not.toHaveBeenCalled();
  });
});

describe("leerImportacionesLocal", () => {
  it("con localStorage corrupto devuelve una lista vacía sin lanzar", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", { getItem: () => "{no es json" });
    expect(leerImportacionesLocal()).toEqual([]);
    vi.unstubAllGlobals();
  });
});

describe("catalogoTiendas", () => {
  it("pagina precio_efectivo con .range() y cuenta productos con precio y la fecha más nueva", async () => {
    const rangos: [number, number][] = [];
    const pagina = (desde: number) =>
      desde === 0
        ? Array.from({ length: 1000 }, (_, i) => ({
            tienda_id: "d1",
            precio: 1000 + i,
            fecha: "2026-10-01",
          }))
        : [
            { tienda_id: "d1", precio: 5000, fecha: "2026-10-30" },
            { tienda_id: "d1", precio: null, fecha: null },
          ];
    const efectivo = {
      select: () => efectivo,
      order: () => efectivo,
      range: (d: number, h: number) => {
        rangos.push([d, h]);
        return Promise.resolve({ data: pagina(d), error: null });
      },
    };
    const tiendas = {
      select: () => tiendas,
      order: () =>
        Promise.resolve({
          data: [
            {
              id: "d1",
              nombre: "D1",
              color: "#000",
              manual: false,
              origen: "seed",
            },
          ],
          error: null,
        }),
    };
    clienteServidor.mockResolvedValue({
      from: (t: string) => (t === "tiendas" ? tiendas : efectivo),
    });

    const [d1] = await catalogoTiendas();
    expect(rangos).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
    expect(d1).toMatchObject({
      productos: 1001,
      precios: 1002,
      ultimaFecha: "2026-10-30",
      manual: false,
    });
  });
});
