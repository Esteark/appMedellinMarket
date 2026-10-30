"use server";

import { z } from "zod";
import { usuario } from "@/lib/datos";
import { configPlan } from "@/lib/planes/config";
import { clienteServidor } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const tipo = z.enum(["hogar", "dieta"]);

/** Guarda (o reemplaza) el plan del usuario. La fecha `actualizada` la manda el cliente: decide quién gana al fusionar. */
export async function guardarPlan(
  t: unknown,
  config: unknown,
): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const v = z
    .object({ tipo, config: configPlan })
    .safeParse({ tipo: t, config });
  if (!v.success) return { ok: false, error: "invalido" };
  const db = await clienteServidor();
  const { error } = await db.from("planes_usuario").upsert(
    {
      user_id: u.id,
      tipo: v.data.tipo,
      config: v.data.config,
      actualizada: v.data.config.actualizada,
    },
    { onConflict: "user_id,tipo" },
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}
