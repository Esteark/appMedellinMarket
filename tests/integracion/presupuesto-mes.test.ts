import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { clienteAdmin } from "@/corrida/admin";
import type { Database } from "@/lib/supabase/tipos";

// Contra Supabase local. Se llama la acción real; solo se sustituye quién tiene la sesión.
const sesion = vi.hoisted(() => ({
  usuario: null as { id: string; email: string } | null,
  cliente: null as unknown,
}));

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/lib/supabase/server", () => ({
  clienteServidor: async () => sesion.cliente,
}));
vi.mock("@/lib/datos", async (original) => {
  const real = await original<typeof import("@/lib/datos")>();
  return { ...real, usuario: async () => sesion.usuario };
});

import {
  guardarPresupuestoMensual,
  listarHistorialPresupuesto,
  obtenerPresupuestosHasta,
} from "@/app/presupuesto/acciones";

const admin = clienteAdmin();
const ids: string[] = [];

async function persona(nombre: string) {
  const email = `${nombre}-${Date.now()}@ejemplo.test`;
  const creado = await admin.auth.admin.createUser({
    email,
    password: "clave-de-prueba-123",
    email_confirm: true,
  });
  if (creado.error) throw creado.error;
  ids.push(creado.data.user.id);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) throw new Error("Falta .env.local (pnpm env:local).");
  const cliente = createClient<Database>(url, clave, {
    auth: { persistSession: false },
  });
  const entrada = await cliente.auth.signInWithPassword({
    email,
    password: "clave-de-prueba-123",
  });
  if (entrada.error) throw entrada.error;
  return { id: creado.data.user.id, email, cliente };
}

let a: Awaited<ReturnType<typeof persona>>;
let b: Awaited<ReturnType<typeof persona>>;

beforeAll(async () => {
  a = await persona("pm-a");
  b = await persona("pm-b");
});

afterAll(async () => {
  for (const id of ids) await admin.auth.admin.deleteUser(id);
});

const como = (p: typeof a) => {
  sesion.usuario = { id: p.id, email: p.email };
  sesion.cliente = p.cliente;
};
const r = (rubro: string, monto: number, orden = 0) => ({
  rubro,
  monto,
  orden,
});

describe("presupuesto por rubro por mes", () => {
  it("guardar noviembre no cambia octubre y se lee por mes", async () => {
    como(a);
    expect(
      await guardarPresupuestoMensual("2026-10", [r("Carnes", 500000)]),
    ).toEqual({ ok: true });
    expect(
      await guardarPresupuestoMensual("2026-11", [
        r("Carnes", 600000),
        r("Granos", 250000, 1),
      ]),
    ).toEqual({ ok: true });
    const x = await obtenerPresupuestosHasta("2026-11");
    expect(x).toMatchObject({ ok: true });
    if (!x.ok) return;
    expect(x.meses["2026-10"]).toEqual([r("Carnes", 500000)]);
    expect(x.meses["2026-11"]).toEqual([
      r("Carnes", 600000),
      r("Granos", 250000, 1),
    ]);
  });

  it("cambiar un monto y quitar un rubro actualiza el mes y deja historial", async () => {
    como(a);
    await guardarPresupuestoMensual("2026-11", [r("Carnes", 650000)]);
    const x = await obtenerPresupuestosHasta("2026-11");
    if (!x.ok) throw new Error(x.error);
    expect(x.meses["2026-11"]).toEqual([r("Carnes", 650000)]);
    expect(x.meses["2026-10"]).toEqual([r("Carnes", 500000)]);

    const h = await listarHistorialPresupuesto("2026-11");
    if (!h.ok) throw new Error(h.error);
    const par = (c: {
      rubro: string;
      monto_anterior: number | null;
      monto_nuevo: number | null;
    }) => `${c.rubro}:${c.monto_anterior}>${c.monto_nuevo}`;
    expect(h.cambios.map(par).sort()).toEqual(
      [
        "Carnes:null>600000",
        "Carnes:600000>650000",
        "Granos:null>250000",
        "Granos:250000>null",
      ].sort(),
    );
    // el más nuevo primero: el rubro quitado se registró después del cambio de monto
    expect(par(h.cambios[0])).toBe("Granos:250000>null");
  });

  it("solo trae los 12 meses anteriores", async () => {
    como(a);
    await guardarPresupuestoMensual("2025-09", [r("Carnes", 1)]);
    const x = await obtenerPresupuestosHasta("2026-11");
    if (!x.ok) throw new Error(x.error);
    expect(Object.keys(x.meses)).not.toContain("2025-09");
  });

  it("rechaza un mes o un monto inválido con una clave, no con el mensaje de la base", async () => {
    como(a);
    expect(
      await guardarPresupuestoMensual("noviembre", [r("Carnes", 1)]),
    ).toEqual({ ok: false, error: "mes_invalido" });
    expect(
      await guardarPresupuestoMensual("2026-11", [r("Carnes", 50_000_001)]),
    ).toMatchObject({ ok: false });
    expect(await guardarPresupuestoMensual("2026-11", [])).toMatchObject({
      ok: false,
      error: "rubros_invalidos",
    });
  });

  it("otra persona no ve el presupuesto ni el historial de la primera", async () => {
    como(b);
    const x = await obtenerPresupuestosHasta("2026-11");
    expect(x).toEqual({ ok: true, meses: {} });
    expect(await listarHistorialPresupuesto("2026-11")).toEqual({
      ok: true,
      cambios: [],
    });
  });

  it("sin sesión no hay presupuesto en la cuenta", async () => {
    sesion.usuario = null;
    expect(await obtenerPresupuestosHasta("2026-11")).toEqual({
      ok: false,
      error: "sin_sesion",
    });
    expect(
      await guardarPresupuestoMensual("2026-11", [r("Carnes", 1)]),
    ).toEqual({ ok: false, error: "sin_sesion" });
  });
});
