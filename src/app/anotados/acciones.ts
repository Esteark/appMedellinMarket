"use server";

import { z } from "zod";
import { usuario } from "@/lib/datos";
import { clienteServidor } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const id = z.string().regex(/^[a-z0-9_-]{1,60}$/);
const celda = z.object({ producto: id, tienda: id });
// "8.900" o "$ 8 900" también valen: se quitan puntos, espacios y el signo.
const precio = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/[.\s$]/g, "") : v),
  z.coerce.number().int().min(100).max(10_000_000),
);

/** Corrige a mano el precio de una celda: anotado vigente + fila en el historial (SQL `corregir_precio`). */
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
  const { error } = await db.rpc("corregir_precio", {
    p_producto: v.data.producto,
    p_tienda: v.data.tienda,
    p_precio: v.data.precio,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Quita una corrección propia: vuelve a mandar el precio automático (si hay). */
export async function quitarAnotado(datos: FormData): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const v = celda.safeParse({
    producto: datos.get("producto"),
    tienda: datos.get("tienda"),
  });
  if (!v.success) return { ok: false, error: "invalido" };
  const db = await clienteServidor();
  const { data, error } = await db.rpc("quitar_correccion", {
    p_producto: v.data.producto,
    p_tienda: v.data.tienda,
  });
  if (error) return { ok: false, error: error.message };
  // false = la corrección es de otra persona.
  return data ? { ok: true } : { ok: false, error: "ajeno" };
}
