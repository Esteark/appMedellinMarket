import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { clienteAdmin } from "@/corrida/admin";
import { alertasUsuarios } from "@/corrida/alertas-usuario";
import { restarDias } from "@/lib/fecha";

// Contra Supabase local con los datos de `pnpm migrar` (41 productos de barrio, ningún precio).
// Crea su propio usuario y deja `anotados` de barrio como estaba.
const db = clienteAdmin();
const HOY = "2026-10-30";
let usuario = "";

const vencidas = async () => {
  await alertasUsuarios(db, HOY);
  const { data, error } = await db
    .from("alertas")
    .select("producto_id")
    .eq("user_id", usuario)
    .eq("tipo", "precio_manual_vencido");
  if (error) throw error;
  return data ?? [];
};
const anotarBarrio = async (producto_id: string, fecha: string) => {
  const r = await db
    .from("anotados")
    .upsert({ producto_id, tienda_id: "barrio", precio: 5000, fecha });
  if (r.error) throw r.error;
};
const ponerLista = async (items: Record<string, number>) => {
  const r = await db
    .from("listas")
    .upsert({ user_id: usuario, items, tienda_preferida: "d1" });
  if (r.error) throw r.error;
};

beforeAll(async () => {
  const creado = await db.auth.admin.createUser({
    email: `barrio-${Date.now()}@ejemplo.test`,
    password: "clave-de-prueba-123",
    email_confirm: true,
  });
  if (creado.error) throw creado.error;
  usuario = creado.data.user.id;
});

afterAll(async () => {
  await db.from("anotados").delete().eq("tienda_id", "barrio");
  if (usuario) await db.auth.admin.deleteUser(usuario);
});

describe("precio_manual_vencido", () => {
  it("un producto de barrio en la lista sin precio genera 1 alerta y repetir no duplica", async () => {
    await ponerLista({ pollo: 1 });
    expect(await vencidas()).toEqual([{ producto_id: "pollo" }]);
    expect(await vencidas()).toHaveLength(1);
  });

  it("con precio reciente no genera nada; pasado el plazo sí", async () => {
    await ponerLista({ pollo: 1 });
    await anotarBarrio("pollo", restarDias(HOY, 10));
    expect(await vencidas()).toHaveLength(0);
    await anotarBarrio("pollo", restarDias(HOY, 15));
    expect(await vencidas()).toHaveLength(1);
  });

  it("un producto del catálogo que no está en la lista no genera alerta", async () => {
    await db.from("anotados").delete().eq("tienda_id", "barrio");
    await ponerLista({ aguacate: 2 }); // fuera del catálogo de barrio
    expect(await vencidas()).toHaveLength(0);
  });
});
