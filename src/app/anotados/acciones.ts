"use server";

import { z } from "zod";
import { usuario } from "@/lib/datos";
import { hoyBogota } from "@/lib/fecha";
import { clienteServidor } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const id = z.string().regex(/^[a-z0-9_-]{1,60}$/);
const celda = z.object({ producto: id, tienda: id });
// "8.900" o "$ 8 900" también valen: se quitan puntos, espacios y el signo.
const precio = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/[.\s$]/g, "") : v),
  z.coerce.number().int().min(100).max(10_000_000),
);

/** Guarda (o reemplaza) el precio anotado de una celda. RLS exige autor = usuario. */
export async function anotar(datos: FormData): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const v = celda.extend({ precio }).safeParse({
    producto: datos.get("producto"),
    tienda: datos.get("tienda"),
    precio: datos.get("precio"),
  });
  if (!v.success) return { ok: false, error: "invalido" };
  const db = await clienteServidor();
  const { error } = await db.from("anotados").upsert({
    producto_id: v.data.producto,
    tienda_id: v.data.tienda,
    precio: v.data.precio,
    fecha: hoyBogota(),
    autor: u.id,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Revierte un anotado propio: vuelve a mandar el precio automático (si hay). */
export async function quitarAnotado(datos: FormData): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const v = celda.safeParse({
    producto: datos.get("producto"),
    tienda: datos.get("tienda"),
  });
  if (!v.success) return { ok: false, error: "invalido" };
  const db = await clienteServidor();
  const { data, error } = await db
    .from("anotados")
    .delete()
    .eq("producto_id", v.data.producto)
    .eq("tienda_id", v.data.tienda)
    .select("producto_id");
  if (error) return { ok: false, error: error.message };
  // RLS deja borrar solo los propios: 0 filas = lo anotó otra persona.
  return data.length ? { ok: true } : { ok: false, error: "ajeno" };
}
