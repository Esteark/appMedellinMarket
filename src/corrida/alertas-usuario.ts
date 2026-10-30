import type { Admin } from "@/corrida/admin";
import {
  type AlertaNueva,
  alertaMercadoCompleto,
  alertaSubida,
  alertasMasBarato,
} from "@/lib/alertas/reglas";
import { restarDias } from "@/lib/fecha";
import type { Lista, Precios } from "@/lib/precios/lista";
import { todas } from "@/lib/supabase/paginar";
import type { TablesInsert } from "@/lib/supabase/tipos";

const TIPOS_USUARIO = [
  "mas_barato",
  "mercado_completo",
  "subida",
  "caro_por_clima",
];

/**
 * Calcula las alertas de cada usuario con lista y las escribe. Idempotente: antes de insertar
 * borra las no leídas de hoy de esos tipos, así repetir la corrida no las duplica.
 * Devuelve cuántas quedaron.
 */
export async function alertasUsuarios(db: Admin, hoy: string): Promise<number> {
  // shortcut: sin paginar; una familia tiene pocas listas. Paginar si pasan de 1000.
  const { data: listas, error } = await db
    .from("listas")
    .select("user_id, items, tienda_preferida");
  if (error) throw new Error(`listas: ${error.message}`);
  if (!listas?.length) return 0;

  const items = new Map<string, Lista>();
  for (const l of listas) {
    const lista: Lista = {};
    for (const [id, cantidad] of Object.entries(
      (l.items ?? {}) as Record<string, unknown>,
    ))
      if (typeof cantidad === "number" && cantidad > 0) lista[id] = cantidad;
    items.set(l.user_id, lista);
  }
  const ids = [...new Set([...items.values()].flatMap((l) => Object.keys(l)))];

  const { data: tiendasDb } = await db.from("tiendas").select("id");
  const tiendas = (tiendasDb ?? []).map((t) => t.id);

  const precios: Precios = {};
  for (const p of await todas(
    (d, h) =>
      db
        .from("precio_efectivo")
        .select("producto_id, tienda_id, precio")
        .in("producto_id", ids)
        .order("producto_id")
        .order("tienda_id")
        .range(d, h),
    "precio_efectivo",
  )) {
    if (!p.producto_id || !p.tienda_id) continue;
    precios[p.producto_id] ??= {};
    precios[p.producto_id][p.tienda_id] = p.precio;
  }

  // Los 7 puntos previos a hoy de cada producto en cada tienda (para "subida").
  const previos = new Map<string, number[]>();
  for (const h of await todas(
    (d, hasta) =>
      db
        .from("precios_historial")
        .select("producto_id, tienda_id, precio")
        .in("producto_id", ids)
        .gte("fecha", restarDias(hoy, 14))
        .lt("fecha", hoy)
        .not("precio", "is", null)
        .order("fecha", { ascending: false })
        .order("id")
        .range(d, hasta),
    "precios_historial",
  )) {
    const clave = `${h.producto_id}|${h.tienda_id}`;
    const lista = previos.get(clave) ?? [];
    if (lista.length < 7 && h.precio != null) lista.push(h.precio);
    previos.set(clave, lista);
  }

  const causas = new Map<string, { fecha: string; es_clima: boolean }[]>();
  for (const c of await todas(
    (d, h) =>
      db
        .from("clima_causas")
        .select("producto_id, fecha, es_clima")
        .in("producto_id", ids)
        .gte("fecha", restarDias(hoy, 7))
        .order("producto_id")
        .order("fecha")
        .range(d, h),
    "clima_causas",
  )) {
    causas.set(c.producto_id, [...(causas.get(c.producto_id) ?? []), c]);
  }

  const { data: preferencias } = await db
    .from("preferencias_notif")
    .select("user_id, umbral_ahorro");
  const umbral = new Map(
    (preferencias ?? []).map((p) => [p.user_id, p.umbral_ahorro]),
  );

  const filas: TablesInsert<"alertas">[] = [];
  for (const l of listas) {
    const lista = items.get(l.user_id) ?? {};
    const preferida = l.tienda_preferida ?? "d1";
    const nuevas: AlertaNueva[] = [
      ...alertasMasBarato(
        lista,
        precios,
        preferida,
        tiendas,
        umbral.get(l.user_id) ?? 1000,
      ),
    ];
    const completo = alertaMercadoCompleto(lista, precios, preferida, tiendas);
    if (completo) nuevas.push(completo);
    for (const id of Object.keys(lista)) {
      const actual = precios[id]?.[preferida];
      if (actual == null) continue;
      const subida = alertaSubida(
        id,
        preferida,
        actual,
        previos.get(`${id}|${preferida}`) ?? [],
        causas.get(id) ?? [],
        hoy,
      );
      if (subida) nuevas.push(subida);
    }
    for (const a of nuevas) filas.push({ ...a, user_id: l.user_id });
  }

  const { error: errorBorrar } = await db
    .from("alertas")
    .delete()
    .in(
      "user_id",
      listas.map((l) => l.user_id),
    )
    .eq("leida", false)
    .in("tipo", TIPOS_USUARIO)
    .gte("creada", `${hoy}T00:00:00-05:00`);
  if (errorBorrar) throw new Error(`alertas: ${errorBorrar.message}`);
  for (let i = 0; i < filas.length; i += 1000) {
    const { error: errorInsertar } = await db
      .from("alertas")
      .insert(filas.slice(i, i + 1000));
    if (errorInsertar) throw new Error(`alertas: ${errorInsertar.message}`);
  }
  return filas.length;
}
