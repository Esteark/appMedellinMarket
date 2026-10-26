"use server";

import { z } from "zod";
import { frescura, usuario } from "@/lib/datos";
import { dispararDesdeEnv } from "@/lib/github";
import { clienteServidor } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const esquemaLista = z
  .record(
    z.string().regex(/^[a-z0-9_-]{1,60}$/),
    z.number().int().min(1).max(999),
  )
  .refine((l) => Object.keys(l).length <= 200, "Máximo 200 productos");

/** Guarda la lista del usuario con sesión. `error: "sin_sesion"` si expiró. */
export async function guardarLista(items: unknown): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const lista = esquemaLista.safeParse(items);
  if (!lista.success) return { ok: false, error: "Lista inválida" };
  const db = await clienteServidor();
  const { error } = await db.from("listas").upsert({
    user_id: u.id,
    items: lista.data,
    updated_at: new Date().toISOString(),
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export type ResultadoActualizar =
  | { ok: true; enCurso: boolean; fresco: boolean; desde: string | null }
  | { ok: false; error: string };

/** Botón "Actualizar precios": exige sesión, no dispara si los datos están frescos. */
export async function actualizarPrecios(): Promise<ResultadoActualizar> {
  if (!(await usuario())) return { ok: false, error: "sin_sesion" };
  const f = await frescura();
  const desde = f.ultimaCorrida;
  if (f.horasDesdeCorrida != null && f.horasDesdeCorrida <= 26)
    return { ok: true, enCurso: false, fresco: true, desde };
  const r = await dispararDesdeEnv();
  if (!r.ok) {
    console.error("actualizarPrecios:", r.error);
    return { ok: false, error: "No se pudo iniciar" };
  }
  return { ok: true, enCurso: r.enCurso, fresco: false, desde };
}
