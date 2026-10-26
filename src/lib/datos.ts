import { connection } from "next/server";
import { alertasFuenteCaida } from "@/lib/alertas/reglas";
import { hoyBogota } from "@/lib/fecha";
import { clienteServidor } from "@/lib/supabase/server";

export type Fuente = {
  id: string;
  nombre: string;
  ok: boolean;
  ultimo_ok: string | null;
};

export type Frescura = {
  /** `fin` de la última corrida terminada (ISO), o null si nunca hubo una. */
  ultimaCorrida: string | null;
  horasDesdeCorrida: number | null;
  /** Tiendas automáticas (las manuales van por anotados y no cuentan). */
  fuentes: Fuente[];
  fuentesOk: number;
};

/** Estado de la corrida para el encabezado y /api/salud. Lanza si la base no responde. */
export async function frescura(fijo?: Date): Promise<Frescura> {
  // Con cacheComponents la hora solo puede leerse en tiempo de petición.
  await connection();
  const ahora = fijo ?? new Date();
  const db = await clienteServidor();
  const [corrida, tiendas, estados] = await Promise.all([
    db
      .from("corridas")
      .select("fin")
      .not("fin", "is", null)
      .order("fin", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("tiendas").select("id, nombre").eq("manual", false).order("id"),
    db.from("tienda_estado").select("tienda_id, estado, ultimo_ok"),
  ]);
  for (const r of [corrida, tiendas, estados])
    if (r.error) throw new Error(r.error.message);

  const porTienda = new Map((estados.data ?? []).map((e) => [e.tienda_id, e]));
  const filas = (tiendas.data ?? []).map((t) => ({
    tienda_id: t.id,
    estado: porTienda.get(t.id)?.estado ?? null,
    ultimo_ok: porTienda.get(t.id)?.ultimo_ok ?? null,
  }));
  const caidas = new Set(
    alertasFuenteCaida(filas, hoyBogota(ahora)).map((a) => a.tienda_id),
  );
  const fuentes = (tiendas.data ?? []).map((t) => ({
    id: t.id,
    nombre: t.nombre,
    ok: !caidas.has(t.id),
    ultimo_ok: porTienda.get(t.id)?.ultimo_ok ?? null,
  }));

  const fin = corrida.data?.fin ?? null;
  return {
    ultimaCorrida: fin,
    horasDesdeCorrida: fin
      ? Math.round((ahora.getTime() - Date.parse(fin)) / 360_000) / 10
      : null,
    fuentes,
    fuentesOk: fuentes.filter((f) => f.ok).length,
  };
}
