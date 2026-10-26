import nodemailer from "nodemailer";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { clienteAdmin } from "@/corrida/admin";
import { crearAviso } from "@/corrida/correo";
import { correr } from "@/corrida/orquestador";
import { contextoPrueba } from "../helpers/fetch-falso";

// Contra Supabase local con los datos de `pnpm migrar`. Crea su propio usuario y lo borra.
const db = clienteAdmin();
const HOY = "2026-10-26";
// Ningún sitio responde: las tres tiendas automáticas quedan en fallo y no se escribe ningún precio.
const sinRed = (async () =>
  new Response("", { status: 404 })) as unknown as typeof fetch;
const ctx = { ...contextoPrueba(sinRed), hoy: HOY };

let usuario = "";
let estadosAntes: unknown[] = [];
let maxCorrida = 0;
let preferida = "";

beforeAll(async () => {
  const [e, c] = await Promise.all([
    db.from("tienda_estado").select("*"),
    db.from("corridas").select("id").order("id", { ascending: false }).limit(1),
  ]);
  estadosAntes = e.data ?? [];
  maxCorrida = c.data?.[0]?.id ?? 0;

  const creado = await db.auth.admin.createUser({
    email: `alertas-${Date.now()}@ejemplo.test`,
    password: "clave-de-prueba-123",
    email_confirm: true,
  });
  if (creado.error) throw creado.error;
  usuario = creado.data.user.id;

  // Preferida = la tienda donde el aceite sale más caro; así otra es más barata.
  const { data: precios } = await db
    .from("precio_efectivo")
    .select("tienda_id, precio")
    .eq("producto_id", "aceite")
    .not("precio", "is", null)
    .order("precio", { ascending: false });
  const [cara, ...resto] = precios ?? [];
  const barata = resto[resto.length - 1];
  // Precondición con los datos del export: ≥10 % y ahorro ≥ $1.000 con 3 unidades.
  expect(
    ((cara.precio ?? 0) - (barata.precio ?? 0)) * 100,
  ).toBeGreaterThanOrEqual((cara.precio ?? 0) * 10);
  expect(
    ((cara.precio ?? 0) - (barata.precio ?? 0)) * 3,
  ).toBeGreaterThanOrEqual(1000);
  preferida = cara.tienda_id ?? "";

  const lista = await db.from("listas").insert({
    user_id: usuario,
    items: { aceite: 3 },
    tienda_preferida: preferida,
  });
  if (lista.error) throw lista.error;
});

afterAll(async () => {
  if (usuario) await db.auth.admin.deleteUser(usuario); // lista y alertas caen en cascada
  await db.from("corridas").delete().gt("id", maxCorrida);
  // biome-ignore lint/suspicious/noExplicitAny: filas tal cual se leyeron
  await db.from("tienda_estado").upsert(estadosAntes as any);
});

describe("alertas y correo en la corrida", () => {
  it("1 mas_barato aunque la corrida se repita, y 1 correo por corrida con tiendas en fallo", async () => {
    const transporte = nodemailer.createTransport({ jsonTransport: true });
    const enviar = vi.spyOn(transporte, "sendMail");
    const aviso = crearAviso(transporte, "admin@ejemplo.test");

    const primera = await correr(db, ctx, { productos: ["aceite"], aviso });
    expect(primera.caidas.sort()).toEqual(["d1", "euro", "minorista"]);
    expect(enviar).toHaveBeenCalledTimes(1);

    await correr(db, ctx, { productos: ["aceite"], aviso });
    expect(enviar).toHaveBeenCalledTimes(2);

    const { data: alertas } = await db
      .from("alertas")
      .select("tipo, producto_id, tienda_id, monto")
      .eq("user_id", usuario)
      .eq("tipo", "mas_barato");
    expect(alertas).toHaveLength(1);
    expect(alertas?.[0]).toMatchObject({ producto_id: "aceite" });
    expect(alertas?.[0].tienda_id).not.toBe(preferida);
    expect(alertas?.[0].monto).toBeGreaterThanOrEqual(1000);
  });

  it("una alerta ya leída no se borra al repetir la corrida", async () => {
    await db.from("alertas").update({ leida: true }).eq("user_id", usuario);
    await correr(db, ctx, { productos: ["aceite"] });
    const { data } = await db
      .from("alertas")
      .select("leida")
      .eq("user_id", usuario)
      .eq("tipo", "mas_barato");
    // La leída sigue y hay una nueva sin leer.
    expect(data?.map((a) => a.leida).sort()).toEqual([false, true]);
  });
});
