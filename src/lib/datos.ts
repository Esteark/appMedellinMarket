import { connection } from "next/server";
import { cache } from "react";
import { alertasFuenteCaida, ordenarAlertas } from "@/lib/alertas/reglas";
import { diasEntre, hoyBogota, restarDias } from "@/lib/fecha";
import type { ListaGuardada } from "@/lib/listas/guardadas";
import {
  desactualizado,
  type Etiqueta,
  enFluctuacion,
  etiquetas,
  type Frecuencia,
} from "@/lib/precios/etiquetas";
import { todas } from "@/lib/supabase/paginar";
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
  /** Tiendas sin consulta automática: solo cambian con anotados. */
  manuales: string[];
};

/** Estado de la corrida para el encabezado y /api/salud. Lanza si la base no responde. Una vez por petición. */
export const frescura = cache(async (fijo?: Date): Promise<Frescura> => {
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
    db.from("tiendas").select("id, nombre, manual").order("id"),
    db.from("tienda_estado").select("tienda_id, estado, ultimo_ok"),
  ]);
  for (const r of [corrida, tiendas, estados])
    if (r.error) throw new Error(r.error.message);

  const porTienda = new Map((estados.data ?? []).map((e) => [e.tienda_id, e]));
  const automaticas = (tiendas.data ?? []).filter((t) => !t.manual);
  const filas = automaticas.map((t) => ({
    tienda_id: t.id,
    estado: porTienda.get(t.id)?.estado ?? null,
    ultimo_ok: porTienda.get(t.id)?.ultimo_ok ?? null,
  }));
  const caidas = new Set(
    alertasFuenteCaida(filas, hoyBogota(ahora)).map((a) => a.tienda_id),
  );
  const fuentes = automaticas.map((t) => ({
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
    manuales: (tiendas.data ?? []).filter((t) => t.manual).map((t) => t.nombre),
  };
});

export type TiendaCatalogo = { id: string; nombre: string; color: string };

type Efectivo = {
  producto_id: string | null;
  tienda_id: string | null;
  precio: number | null;
  estado: string | null;
  fecha: string | null;
  fuente: string | null;
  revisar: boolean | null;
};
type Causa = { fecha: string; es_clima: boolean; texto: string };

export type ResumenPrecio = {
  /** Precio efectivo por tienda; null = sin dato. */
  precios: Record<string, number | null>;
  /** Tiendas cuyo precio está desactualizado → días desde que se vio; pudo haber cambiado. */
  viejos: Record<string, number>;
  /** Tienda más barata, sobre la que se calculan las etiquetas. */
  mejor: {
    tienda: string;
    precio: number;
    estado: string;
    fecha?: string | null;
  } | null;
  etiquetas: Etiqueta[];
  /** % contra el promedio de los 7 días anteriores en la tienda más barata. */
  cambio: number | null;
  /** El precio más barato es de hoy (las etiquetas ↑/↓ pulsan una vez). */
  deHoy: boolean;
  /** Texto literal de la causa climática más reciente de los últimos 7 días (SIPSA). */
  causa: string | null;
};

export type ProductoCatalogo = ResumenPrecio & {
  id: string;
  nombre: string;
  grupo: string;
  unidad: string;
  emoji: string | null;
  /** Mínimo diario de los últimos 30 días; solo si está en fluctuación. */
  serie: number[];
};

export type Catalogo = {
  tiendas: TiendaCatalogo[];
  productos: ProductoCatalogo[];
};

/** Precios por tienda, la más barata, sus etiquetas y la causa climática de un producto. */
function resumir(
  p: { id: string; frecuencia: string },
  tiendas: string[],
  efectivo: Map<string, Efectivo>,
  previos: Map<string, number[]>,
  causas: Causa[],
  hoy: string,
): ResumenPrecio {
  const precios: Record<string, number | null> = {};
  const viejos: Record<string, number> = {};
  let mejor: ResumenPrecio["mejor"] = null;
  for (const t of tiendas) {
    const e = efectivo.get(`${p.id}|${t}`);
    precios[t] = e?.precio ?? null;
    if (
      e?.precio != null &&
      e.fecha &&
      desactualizado(e.fecha, hoy, p.frecuencia as Frecuencia)
    )
      viejos[t] = diasEntre(e.fecha, hoy);
    if (e?.precio != null && (!mejor || e.precio < mejor.precio))
      mejor = {
        tienda: t,
        precio: e.precio,
        estado: e.estado ?? "real",
        fecha: e.fecha ?? null,
      };
  }
  const causa =
    causas
      .filter((c) => c.es_clima)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.texto ?? null;
  if (!mejor)
    return {
      precios,
      viejos,
      mejor,
      etiquetas: ["sin_dato"],
      cambio: null,
      deHoy: false,
      causa,
    };
  const e = efectivo.get(`${p.id}|${mejor.tienda}`);
  const antes = previos.get(`${p.id}|${mejor.tienda}`) ?? [];
  const suma = antes.reduce((a, b) => a + b, 0);
  return {
    precios,
    viejos,
    mejor,
    etiquetas: etiquetas({
      precio: mejor.precio,
      estado: mejor.estado,
      fuente: e?.fuente,
      revisar: e?.revisar ?? false,
      fecha: e?.fecha ?? hoy,
      frecuencia: p.frecuencia as Frecuencia,
      hoy,
      previos: antes,
      causas,
    }),
    cambio: antes.length
      ? Math.round(((mejor.precio * antes.length) / suma - 1) * 100)
      : null,
    deHoy: e?.fecha === hoy,
    causa,
  };
}

const agrupar = <T, K>(filas: T[], clave: (f: T) => K) => {
  const m = new Map<K, T[]>();
  for (const f of filas) m.set(clave(f), [...(m.get(clave(f)) ?? []), f]);
  return m;
};

/** Precios de los 7 días anteriores a hoy por producto|tienda (para ↑/↓). */
function previosDe(
  filas: {
    producto_id: string | null;
    tienda_id: string | null;
    precio: number | null;
  }[],
) {
  const m = new Map<string, number[]>();
  for (const h of filas) {
    const clave = `${h.producto_id}|${h.tienda_id}`;
    if (h.precio != null) m.set(clave, [...(m.get(clave) ?? []), h.precio]);
  }
  return m;
}

const COLUMNAS_EFECTIVO =
  "producto_id, tienda_id, precio, estado, fecha, fuente, revisar";

/** Los 144 productos con su precio efectivo por tienda, etiquetas y fluctuación. */
export async function catalogo(): Promise<Catalogo> {
  await connection();
  const hoy = hoyBogota();
  const db = await clienteServidor();
  const [productos, tiendas, efectivos, historial, minimos, causas] =
    await Promise.all([
      db
        .from("productos")
        .select("id, nombre, grupo, unidad, emoji, frecuencia")
        .order("nombre"),
      db.from("tiendas").select("id, nombre, color").order("nombre"),
      todas(
        (d, h) =>
          db
            .from("precio_efectivo")
            .select(COLUMNAS_EFECTIVO)
            .order("producto_id")
            .order("tienda_id")
            .range(d, h),
        "precio_efectivo",
      ),
      todas(
        (d, h) =>
          db
            .from("precios_historial")
            .select("producto_id, tienda_id, precio")
            .gte("fecha", restarDias(hoy, 7))
            .lt("fecha", hoy)
            .not("precio", "is", null)
            .order("id")
            .range(d, h),
        "precios_historial",
      ),
      todas(
        (d, h) =>
          db
            .from("historial_minimo")
            .select("producto_id, fecha, precio")
            .gte("fecha", restarDias(hoy, 30))
            .order("producto_id")
            .order("fecha")
            .range(d, h),
        "historial_minimo",
      ),
      todas(
        (d, h) =>
          db
            .from("clima_causas")
            .select("producto_id, fecha, es_clima, texto")
            .gte("fecha", restarDias(hoy, 7))
            .order("producto_id")
            .order("fecha")
            .range(d, h),
        "clima_causas",
      ),
    ]);
  for (const r of [productos, tiendas])
    if (r.error) throw new Error(r.error.message);

  const efectivo = new Map(
    efectivos.map((e) => [`${e.producto_id}|${e.tienda_id}`, e]),
  );
  const previos = previosDe(historial);
  const causasDe = agrupar(causas, (c) => c.producto_id);
  const seriesDe = agrupar(
    minimos.filter((m) => m.producto_id && m.fecha && m.precio != null),
    (m) => m.producto_id,
  );
  const ids = (tiendas.data ?? []).map((t) => t.id);

  return {
    tiendas: tiendas.data ?? [],
    productos: (productos.data ?? []).map((p) => {
      const serie = (seriesDe.get(p.id) ?? []).map((m) => ({
        fecha: m.fecha as string,
        precio: m.precio as number,
      }));
      return {
        ...p,
        ...resumir(p, ids, efectivo, previos, causasDe.get(p.id) ?? [], hoy),
        serie: enFluctuacion(serie, hoy) ? serie.map((m) => m.precio) : [],
      };
    }),
  };
}

export type Detalle = {
  producto: ProductoCatalogo;
  tiendas: TiendaCatalogo[];
  /** Por tienda: fecha → precio, últimos 30 días. */
  historial: { fecha: string; [tienda: string]: number | string }[];
  /** Estado del precio efectivo por tienda (real, anotado, estimado…), para `data-origen`. */
  origen: Record<string, string | null>;
};

/** Todo lo de un producto para la hoja de detalle; null si no existe. */
export async function detalle(id: string): Promise<Detalle | null> {
  await connection();
  const hoy = hoyBogota();
  const db = await clienteServidor();
  const [producto, tiendas, efectivos, historial, causas] = await Promise.all([
    db
      .from("productos")
      .select("id, nombre, grupo, unidad, emoji, frecuencia")
      .eq("id", id)
      .maybeSingle(),
    db.from("tiendas").select("id, nombre, color").order("nombre"),
    db.from("precio_efectivo").select(COLUMNAS_EFECTIVO).eq("producto_id", id),
    // ≤ 10 tiendas × 31 días: por debajo del tope de 1000.
    db
      .from("precios_historial")
      .select("producto_id, tienda_id, fecha, precio")
      .eq("producto_id", id)
      .gte("fecha", restarDias(hoy, 30))
      .not("precio", "is", null)
      .order("fecha"),
    db
      .from("clima_causas")
      .select("producto_id, fecha, es_clima, texto")
      .eq("producto_id", id)
      .gte("fecha", restarDias(hoy, 7)),
  ]);
  for (const r of [producto, tiendas, efectivos, historial, causas])
    if (r.error) throw new Error(r.error.message);
  if (!producto.data) return null;

  const p = producto.data;
  const ids = (tiendas.data ?? []).map((t) => t.id);
  const efectivo = new Map(
    (efectivos.data ?? []).map((e) => [`${e.producto_id}|${e.tienda_id}`, e]),
  );
  const filas = historial.data ?? [];
  const previos = previosDe(
    filas.filter((h) => h.fecha >= restarDias(hoy, 7) && h.fecha < hoy),
  );
  const porFecha = new Map<string, Detalle["historial"][number]>();
  for (const h of filas) {
    const punto = porFecha.get(h.fecha) ?? { fecha: h.fecha };
    if (h.precio != null && h.tienda_id) punto[h.tienda_id] = h.precio;
    porFecha.set(h.fecha, punto);
  }

  return {
    producto: {
      ...p,
      ...resumir(p, ids, efectivo, previos, causas.data ?? [], hoy),
      serie: [],
    },
    tiendas: tiendas.data ?? [],
    historial: [...porFecha.values()],
    origen: Object.fromEntries(
      ids.map((t) => [t, efectivo.get(`${p.id}|${t}`)?.estado ?? null]),
    ),
  };
}

export type Usuario = { id: string; email: string };

/** Usuario de la sesión según los claims del JWT (nunca `getSession()`). Una vez por petición. */
export const usuario = cache(async (): Promise<Usuario | null> => {
  // getClaims lee la hora para validar el JWT: solo en tiempo de petición.
  await connection();
  const db = await clienteServidor();
  const { data } = await db.auth.getClaims();
  if (!data?.claims.sub) return null;
  return { id: data.claims.sub, email: String(data.claims.email ?? "") };
});

export type AlertaHoy = { id: number; mensaje: string; monto: number };

/** Lista guardada y alertas no leídas de hoy del usuario con sesión. RLS filtra por usuario. */
export async function datosSesion(): Promise<{
  lista: Record<string, number> | null;
  listas: ListaGuardada[];
  alertas: AlertaHoy[];
}> {
  await connection();
  const db = await clienteServidor();
  const [lista, alertas, guardadas] = await Promise.all([
    db.from("listas").select("items").maybeSingle(),
    db
      .from("alertas")
      .select("id, mensaje, monto")
      .eq("leida", false)
      .gte("creada", `${hoyBogota()}T00:00:00-05:00`),
    db
      .from("listas_guardadas")
      .select("nombre, items, tienda_preferida, actualizada"),
  ]);
  for (const r of [lista, alertas, guardadas])
    if (r.error) throw new Error(r.error.message);
  return {
    lista: (lista.data?.items as Record<string, number> | undefined) ?? null,
    listas: (guardadas.data ?? []).map((l) => ({
      nombre: l.nombre,
      items: l.items as Record<string, number>,
      tienda_preferida: l.tienda_preferida ?? "d1",
      actualizada: l.actualizada,
    })),
    alertas: (alertas.data ?? []).map((a) => ({ ...a, monto: a.monto ?? 0 })),
  };
}

export type AlertaFila = {
  id: number;
  tipo: string;
  mensaje: string;
  monto: number;
  creada: string;
  leida: boolean;
};

/** Alertas del usuario (las 100 más recientes, por monto) y su ahorro mínimo. RLS filtra por usuario. */
export async function alertasUsuario(): Promise<{
  alertas: AlertaFila[];
  umbral: number;
}> {
  await connection();
  const db = await clienteServidor();
  const [alertas, pref] = await Promise.all([
    db
      .from("alertas")
      .select("id, tipo, mensaje, monto, creada, leida")
      .order("creada", { ascending: false })
      .limit(100),
    db.from("preferencias_notif").select("umbral_ahorro").maybeSingle(),
  ]);
  for (const r of [alertas, pref])
    if (r.error) throw new Error(r.error.message);
  return {
    alertas: ordenarAlertas(
      (alertas.data ?? []).map((a) => ({ ...a, monto: a.monto ?? 0 })),
    ),
    umbral: pref.data?.umbral_ahorro ?? 1000,
  };
}

export type FilaAnotados = {
  id: string;
  nombre: string;
  emoji: string | null;
  unidad: string;
  grupo: string;
  /** Precio efectivo y su origen por tienda (real, anotado, estimado…). */
  celdas: Record<string, { precio: number | null; estado: string | null }>;
};

/** Tabla de /anotados: todos los productos × todas las tiendas, incluidas las manuales. */
export async function tablaAnotados(): Promise<{
  tiendas: (TiendaCatalogo & { manual: boolean })[];
  filas: FilaAnotados[];
}> {
  await connection();
  const db = await clienteServidor();
  const [productos, tiendas, efectivos] = await Promise.all([
    db
      .from("productos")
      .select("id, nombre, emoji, unidad, grupo")
      .order("nombre"),
    db.from("tiendas").select("id, nombre, color, manual").order("nombre"),
    todas(
      (d, h) =>
        db
          .from("precio_efectivo")
          .select("producto_id, tienda_id, precio, estado")
          .order("producto_id")
          .order("tienda_id")
          .range(d, h),
      "precio_efectivo",
    ),
  ]);
  for (const r of [productos, tiendas])
    if (r.error) throw new Error(r.error.message);
  const porProducto = agrupar(efectivos, (e) => e.producto_id);
  return {
    tiendas: tiendas.data ?? [],
    filas: (productos.data ?? []).map((p) => ({
      ...p,
      celdas: Object.fromEntries(
        (porProducto.get(p.id) ?? []).map((e) => [
          e.tienda_id,
          { precio: e.precio, estado: e.estado },
        ]),
      ),
    })),
  };
}
