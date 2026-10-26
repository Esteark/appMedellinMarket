import { connection } from "next/server";
import { alertasFuenteCaida } from "@/lib/alertas/reglas";
import { hoyBogota, restarDias } from "@/lib/fecha";
import {
  type Etiqueta,
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

export type TiendaCatalogo = { id: string; nombre: string; color: string };

export type ProductoCatalogo = {
  id: string;
  nombre: string;
  grupo: string;
  unidad: string;
  emoji: string | null;
  /** Precio efectivo por tienda; null = sin dato. */
  precios: Record<string, number | null>;
  /** Tienda más barata, sobre la que se calculan las etiquetas. */
  mejor: { tienda: string; precio: number; estado: string } | null;
  etiquetas: Etiqueta[];
  /** % contra el promedio de los 7 días anteriores en la tienda más barata. */
  cambio: number | null;
  /** El precio más barato es de hoy (las etiquetas ↑/↓ pulsan una vez). */
  deHoy: boolean;
};

export type Catalogo = {
  tiendas: TiendaCatalogo[];
  productos: ProductoCatalogo[];
};

/** Los 144 productos con su precio efectivo en cada tienda y las etiquetas del más barato. */
export async function catalogo(): Promise<Catalogo> {
  await connection();
  const hoy = hoyBogota();
  const db = await clienteServidor();
  const [productos, tiendas, efectivos, historial, causas] = await Promise.all([
    db
      .from("productos")
      .select("id, nombre, grupo, unidad, emoji, frecuencia")
      .order("nombre"),
    db.from("tiendas").select("id, nombre, color").order("nombre"),
    todas(
      (d, h) =>
        db
          .from("precio_efectivo")
          .select(
            "producto_id, tienda_id, precio, estado, fecha, fuente, revisar",
          )
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
          .from("clima_causas")
          .select("producto_id, fecha, es_clima")
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
  const previos = new Map<string, number[]>();
  for (const h of historial) {
    const clave = `${h.producto_id}|${h.tienda_id}`;
    if (h.precio != null)
      previos.set(clave, [...(previos.get(clave) ?? []), h.precio]);
  }
  const causasDe = new Map<string, { fecha: string; es_clima: boolean }[]>();
  for (const c of causas)
    causasDe.set(c.producto_id, [...(causasDe.get(c.producto_id) ?? []), c]);

  const ids = (tiendas.data ?? []).map((t) => t.id);
  return {
    tiendas: tiendas.data ?? [],
    productos: (productos.data ?? []).map((p) => {
      const precios: Record<string, number | null> = {};
      let mejor: ProductoCatalogo["mejor"] = null;
      for (const t of ids) {
        const e = efectivo.get(`${p.id}|${t}`);
        precios[t] = e?.precio ?? null;
        if (e?.precio != null && (!mejor || e.precio < mejor.precio))
          mejor = { tienda: t, precio: e.precio, estado: e.estado ?? "real" };
      }
      if (!mejor)
        return {
          ...p,
          precios,
          mejor,
          etiquetas: ["sin_dato"],
          cambio: null,
          deHoy: false,
        };
      const e = efectivo.get(`${p.id}|${mejor.tienda}`);
      const antes = previos.get(`${p.id}|${mejor.tienda}`) ?? [];
      const suma = antes.reduce((a, b) => a + b, 0);
      return {
        ...p,
        precios,
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
          causas: causasDe.get(p.id) ?? [],
        }),
        cambio: antes.length
          ? Math.round(((mejor.precio * antes.length) / suma - 1) * 100)
          : null,
        deHoy: e?.fecha === hoy,
      };
    }),
  };
}
