"use server";

import { z } from "zod";
import { usuario } from "@/lib/datos";
import { clienteServidor } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const umbral = z.coerce.number().int().min(0).max(1_000_000);

/** Marca como leídas todas las alertas del usuario (RLS solo deja actualizar las propias). */
export async function marcarLeidas(): Promise<Resultado> {
  if (!(await usuario())) return { ok: false, error: "sin_sesion" };
  const db = await clienteServidor();
  const { error } = await db
    .from("alertas")
    .update({ leida: true })
    .eq("leida", false);
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Guarda el ahorro mínimo (en pesos) a partir del cual se genera una alerta `mas_barato`. */
export async function guardarUmbral(datos: FormData): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const v = umbral.safeParse(datos.get("umbral"));
  if (!v.success) return { ok: false, error: "invalido" };
  const db = await clienteServidor();
  const { error } = await db
    .from("preferencias_notif")
    .upsert({ user_id: u.id, umbral_ahorro: v.data });
  return error ? { ok: false, error: error.message } : { ok: true };
}
