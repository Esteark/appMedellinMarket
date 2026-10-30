"use server";

import { z } from "zod";
import { usuario } from "@/lib/datos";
import { clienteServidor } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const producto = z.string().regex(/^[a-z0-9_-]{1,60}$/);

/** Agrega al catálogo de barrio un producto de los 144 (o reactiva uno quitado). No toca precios. */
export async function agregarProducto(id: unknown): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const v = producto.safeParse(id);
  if (!v.success) return { ok: false, error: "invalido" };
  const db = await clienteServidor();
  const { data } = await db
    .from("catalogo_tienda")
    .select("orden")
    .order("orden", { ascending: false })
    .limit(1);
  const { error } = await db.from("catalogo_tienda").upsert(
    {
      producto_id: v.data,
      tienda_id: "barrio",
      activo: true,
      orden: (data?.[0]?.orden ?? 0) + 1,
      autor: u.id,
    },
    { onConflict: "producto_id,tienda_id" },
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Quitar es `activo = false`: nunca se borra la fila ni los precios que ya tiene. */
export async function quitarProducto(id: unknown): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const v = producto.safeParse(id);
  if (!v.success) return { ok: false, error: "invalido" };
  const db = await clienteServidor();
  // RLS pide autor = usuario en la fila nueva: la fila pasa a ser de quien la quita.
  const { error } = await db
    .from("catalogo_tienda")
    .update({ activo: false, autor: u.id })
    .eq("producto_id", v.data)
    .eq("tienda_id", "barrio");
  return error ? { ok: false, error: error.message } : { ok: true };
}
