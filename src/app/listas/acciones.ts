"use server";

import { z } from "zod";
import { usuario } from "@/lib/datos";
import { MAX_ITEMS, MAX_LISTAS } from "@/lib/listas/guardadas";
import { clienteServidor } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const id = z.string().regex(/^[a-z0-9_-]{1,60}$/);
const listas = z
  .array(
    z.object({
      nombre: z.string().trim().min(1).max(60),
      items: z
        .record(id, z.number().int().min(1).max(999))
        .refine((i) => Object.keys(i).length <= MAX_ITEMS),
      tienda_preferida: id,
      actualizada: z.iso.datetime({ offset: true }),
    }),
  )
  .max(MAX_LISTAS);

/**
 * Deja en la nube exactamente estas listas: upsert por nombre y borra las que ya no están.
 * shortcut: el cliente manda el conjunto completo (≤20); si hace falta granularidad, una acción por operación.
 */
export async function sincronizarListas(entrada: unknown): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const v = listas.safeParse(entrada);
  if (!v.success) return { ok: false, error: "invalido" };
  // Dos nombres que solo difieren en mayúsculas chocarían en la base.
  const claves = v.data.map((l) => l.nombre.toLowerCase());
  if (new Set(claves).size !== claves.length)
    return { ok: false, error: "nombre_repetido" };

  const db = await clienteServidor();
  const { data: previas, error: e1 } = await db
    .from("listas_guardadas")
    .select("id, nombre_clave");
  if (e1) return { ok: false, error: e1.message };
  const sobran = (previas ?? [])
    .filter((p) => !claves.includes(p.nombre_clave ?? ""))
    .map((p) => p.id);
  if (sobran.length) {
    const { error } = await db
      .from("listas_guardadas")
      .delete()
      .in("id", sobran);
    if (error) return { ok: false, error: error.message };
  }
  if (v.data.length) {
    const { error } = await db.from("listas_guardadas").upsert(
      v.data.map((l) => ({
        user_id: u.id,
        nombre: l.nombre,
        items: l.items,
        tienda_preferida: l.tienda_preferida,
        actualizada: l.actualizada,
      })),
      { onConflict: "user_id,nombre_clave" },
    );
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}
