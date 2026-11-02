"use server";

import { z } from "zod";
import { usuario } from "@/lib/datos";
import { configPlan } from "@/lib/planes/config";
import {
  MAX_GUARDADOS,
  normalizarNombre,
  type PlanGuardado,
} from "@/lib/planes/guardados";
import { clienteServidor } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const tipo = z.enum(["hogar", "dieta"]);

const guardado = z.object({
  nombre: z.string().trim().min(1).max(60),
  config: configPlan,
  actualizada: z.iso.datetime({ offset: true }),
});
const guardados = z.array(guardado).max(MAX_GUARDADOS);

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

/**
 * Deja en la cuenta exactamente estos presupuestos guardados: upsert por nombre
 * y borra los que ya no están. El cliente manda el conjunto completo (≤20).
 */
export async function sincronizarPlanes(
  t: unknown,
  entrada: unknown,
): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const v = z
    .object({ tipo, planes: guardados })
    .safeParse({ tipo: t, planes: entrada });
  if (!v.success) return { ok: false, error: "invalido" };

  const claves = v.data.planes.map((p) => normalizarNombre(p.nombre));
  if (new Set(claves).size !== claves.length)
    return { ok: false, error: "nombre_repetido" };

  const db = await clienteServidor();
  const { data: previas, error: e1 } = await db
    .from("planes_guardados")
    .select("id, nombre_clave")
    .eq("tipo", v.data.tipo);
  if (e1) return { ok: false, error: e1.message };
  const sobran = (previas ?? [])
    .filter((p) => !claves.includes(p.nombre_clave ?? ""))
    .map((p) => p.id);
  if (sobran.length) {
    const { error } = await db
      .from("planes_guardados")
      .delete()
      .in("id", sobran);
    if (error) return { ok: false, error: error.message };
  }
  if (v.data.planes.length) {
    const { error } = await db.from("planes_guardados").upsert(
      v.data.planes.map((p: PlanGuardado) => ({
        user_id: u.id,
        tipo: v.data.tipo,
        nombre: p.nombre,
        config: p.config,
        actualizada: p.actualizada,
      })),
      { onConflict: "user_id,tipo,nombre_clave" },
    );
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}
