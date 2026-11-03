import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { clienteAdmin } from "@/corrida/admin";
import { LIMITE_PRODUCTOS_DIA } from "@/lib/importar/limites";
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

import { cupoDeProductos } from "@/app/presupuesto/acciones";

const admin = clienteAdmin();
const ids: string[] = [];
const productos: string[] = [];

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

/** Productos de prueba creados por esa persona; `hace` mueve la fecha de creación hacia atrás. */
async function crear(creadoPor: string, cuantos: number, hace: string) {
  const sello = Date.now();
  const filas = Array.from({ length: cuantos }, (_, i) => {
    const id = `p-cupo-${sello}-${creadoPor.slice(0, 4)}-${hace.replace(/\W/g, "")}-${i}`;
    productos.push(id);
    return {
      id,
      nombre: `Cupo ${id}`,
      grupo: "Otros",
      unidad: "u",
      unidad_base: "u",
      cantidad_base: 1,
      frecuencia: "semanal",
      creado_por: creadoPor,
      creado: new Date(Date.now() - Number(hace) * 3_600_000).toISOString(),
    };
  });
  const r = await admin.from("productos").insert(filas);
  if (r.error) throw r.error;
}

let a: Awaited<ReturnType<typeof persona>>;
let b: Awaited<ReturnType<typeof persona>>;

beforeAll(async () => {
  a = await persona("cupo-a");
  b = await persona("cupo-b");
  // A creó 3 hoy y 2 hace dos días; B no creó ninguno.
  await crear(a.id, 3, "0");
  await crear(a.id, 2, "48");
});

afterAll(async () => {
  if (productos.length)
    await admin.from("productos").delete().in("id", productos);
  for (const id of ids) await admin.auth.admin.deleteUser(id);
});

const como = (p: typeof a) => {
  sesion.usuario = { id: p.id, email: p.email };
  sesion.cliente = p.cliente;
};

describe("cupoDeProductos", () => {
  it("cuenta solo los productos que la persona creó hoy (día de Bogotá)", async () => {
    como(a);
    expect(await cupoDeProductos()).toEqual({
      ok: true,
      usados: 3,
      limite: LIMITE_PRODUCTOS_DIA,
    });
  });

  it("el tope es de 200", () => {
    expect(LIMITE_PRODUCTOS_DIA).toBe(200);
  });

  it("otra persona no ve el cupo de la primera", async () => {
    como(b);
    expect(await cupoDeProductos()).toMatchObject({ ok: true, usados: 0 });
  });

  it("sin sesión no hay cupo", async () => {
    sesion.usuario = null;
    expect(await cupoDeProductos()).toEqual({ ok: false, error: "sin_sesion" });
  });
});
