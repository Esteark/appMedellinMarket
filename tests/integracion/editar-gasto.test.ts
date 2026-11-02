import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { clienteAdmin } from "@/corrida/admin";
import type { Database } from "@/lib/supabase/tipos";

// Contra Supabase local. Se llama la acción real; solo se sustituye quién tiene la sesión: cada usuario
// entra con su contraseña y la acción usa su cliente, así que la RLS de `gastos_reales` decide de verdad.
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

import { editarGasto } from "@/app/presupuesto/acciones";

const admin = clienteAdmin();
type Persona = {
  id: string;
  email: string;
  cliente: SupabaseClient<Database>;
  gasto: string;
};
const personas: Record<"a" | "b", Persona> = {} as never;

async function crearPersona(nombre: string): Promise<Persona> {
  const email = `${nombre}-${Date.now()}@ejemplo.test`;
  const creado = await admin.auth.admin.createUser({
    email,
    password: "clave-de-prueba-123",
    email_confirm: true,
  });
  if (creado.error) throw creado.error;
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
  const gasto = await admin
    .from("gastos_reales")
    .insert({
      user_id: creado.data.user.id,
      fecha: "2026-10-15",
      mes: "2026-10",
      rubro: "Despensa",
      monto: 5000,
      origen: "manual",
    })
    .select("id")
    .single();
  if (gasto.error) throw gasto.error;
  return { id: creado.data.user.id, email, cliente, gasto: gasto.data.id };
}

const como = (p: Persona) => {
  sesion.usuario = { id: p.id, email: p.email };
  sesion.cliente = p.cliente;
};
const leer = async (id: string) => {
  const { data, error } = await admin
    .from("gastos_reales")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
};
const base = (p: Persona) => ({
  id: p.gasto,
  fecha: "2026-10-15",
  rubro: "Despensa",
  monto: 5000,
});

beforeAll(async () => {
  personas.a = await crearPersona("gasto-a");
  personas.b = await crearPersona("gasto-b");
});

afterAll(async () => {
  for (const p of Object.values(personas))
    if (p?.id) await admin.auth.admin.deleteUser(p.id);
});

describe("editarGasto", () => {
  it("cambia producto, cantidad, descripción, nota y monto de un gasto propio", async () => {
    const a = personas.a;
    como(a);
    const r = await editarGasto({
      ...base(a),
      monto: 7200,
      producto_id: "aceite",
      cantidad: 2.5,
      descripcion: "Aceite 1 L x2",
      nota: "oferta",
    });
    expect(r).toEqual({ ok: true });
    const g = await leer(a.gasto);
    expect(g.producto_id).toBe("aceite");
    expect(Number(g.cantidad)).toBe(2.5);
    expect(g.descripcion).toBe("Aceite 1 L x2");
    expect(g.nota).toBe("oferta");
    expect(g.monto).toBe(7200);
  });

  it("null borra el producto, la cantidad y la descripción; ausente los deja", async () => {
    const a = personas.a;
    como(a);
    await editarGasto({ ...base(a), nota: "sin cambios" });
    let g = await leer(a.gasto);
    expect(g.producto_id).toBe("aceite");
    expect(g.descripcion).toBe("Aceite 1 L x2");
    await editarGasto({
      ...base(a),
      producto_id: null,
      cantidad: null,
      descripcion: null,
    });
    g = await leer(a.gasto);
    expect(g.producto_id).toBeNull();
    expect(g.cantidad).toBeNull();
    expect(g.descripcion).toBeNull();
  });

  it("no edita el gasto de otra persona", async () => {
    const [a, b] = [personas.a, personas.b];
    como(a);
    const r = await editarGasto({ ...base(b), monto: 1 });
    expect(r).toEqual({ ok: false, error: "ajeno" });
    expect((await leer(b.gasto)).monto).toBe(5000);
  });

  it("un producto que no existe falla y no cambia nada", async () => {
    const a = personas.a;
    como(a);
    const antes = await leer(a.gasto);
    const r = await editarGasto({
      ...base(a),
      monto: 9999,
      producto_id: "no-existe-xyz",
    });
    expect(r).toEqual({ ok: false, error: "gasto_edicion_invalida" });
    expect(await leer(a.gasto)).toEqual(antes);
  });

  it.each([-1, 0, 100_001])("la cantidad %s se rechaza", async (cantidad) => {
    const a = personas.a;
    como(a);
    const antes = await leer(a.gasto);
    const r = await editarGasto({ ...base(a), cantidad });
    expect(r).toEqual({ ok: false, error: "gasto_edicion_invalida" });
    expect(await leer(a.gasto)).toEqual(antes);
  });

  it("cambiar la fecha a otro mes recalcula el mes", async () => {
    const a = personas.a;
    como(a);
    const r = await editarGasto({ ...base(a), fecha: "2026-09-30" });
    expect(r).toEqual({ ok: true });
    const g = await leer(a.gasto);
    expect(g.fecha).toBe("2026-09-30");
    expect(g.mes).toBe("2026-09");
  });

  it("sin sesión no edita", async () => {
    sesion.usuario = null;
    const r = await editarGasto({ ...base(personas.a), monto: 1 });
    expect(r).toEqual({ ok: false, error: "sin_sesion" });
  });
});
