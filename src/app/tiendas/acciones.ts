"use server";

import { z } from "zod";
import { usuario } from "@/lib/datos";
import { clienteServidor } from "@/lib/supabase/server";
import { validarFusion } from "@/lib/tiendas/fusion";
import { unidadBase } from "@/lib/unidades";

type Falla = { ok: false; error: string };

/** Errores que lanza Postgres con `raise exception`; coinciden con claves de `avisos.ts`. */
const ERRORES_BASE: Record<string, string> = {
  limite_tiendas: "limite_tiendas",
  limite_productos: "limite_productos",
  nombre_invalido: "nombre_invalido",
  mismo_producto: "fusion_no_permitida",
  producto_no_existe: "fusion_sin_datos",
  sin_sesion: "sin_sesion",
  tiendas_invalidas: "catalogo_error",
  tienda_inexistente: "catalogo_error",
  producto_inexistente: "catalogo_error",
};

/** Nunca devuelve `error.message` crudo: o es una clave conocida o `importacion_error`. */
function traducir(mensaje: string): string {
  const clave = Object.keys(ERRORES_BASE).find((k) => mensaje.includes(k));
  return clave ? ERRORES_BASE[clave] : "importacion_error";
}

const nombreTienda = z.string().trim().min(2).max(60);
const nombreProducto = z.string().trim().min(2).max(120);
const id = z.string().trim().min(1).max(80);

const esquemaProducto = z.object({
  nombre: nombreProducto,
  grupo: z.string().trim().min(1).max(40),
  unidad: z.string().trim().min(1).max(40),
  frecuencia: z.enum(["diaria", "semanal"]),
  emoji: z.string().trim().max(8).nullable().optional(),
  /** Tiendas que seguirán el producto; «Nuevo producto» exige al menos una en el formulario. */
  tiendas: z.array(id).max(10).default([]),
});

async function sesion() {
  return (await usuario())
    ? null
    : ({ ok: false, error: "sin_sesion" } as Falla);
}

export async function crearTienda(
  nombre: unknown,
): Promise<{ ok: true; id: string } | Falla> {
  const sinSesion = await sesion();
  if (sinSesion) return sinSesion;
  const p = nombreTienda.safeParse(nombre);
  if (!p.success) return { ok: false, error: "nombre_invalido" };
  const db = await clienteServidor();
  // `crear_tienda` es idempotente: para avisar del repetido hay que mirar antes.
  const { data: normalizado } = await db.rpc("normalizar_nombre", {
    p_texto: p.data,
  });
  const { data: existe } = await db
    .from("tiendas")
    .select("id")
    .eq("nombre_norm", normalizado ?? p.data)
    .maybeSingle();
  if (existe) return { ok: false, error: "tienda_nombre_repetido" };
  const { data, error } = await db.rpc("crear_tienda", { p_nombre: p.data });
  if (error || !data)
    return { ok: false, error: traducir(error?.message ?? "") };
  // La tienda se crea a mano desde `/tiendas`, no desde una factura.
  await db
    .from("tiendas")
    .update({ origen: "manual", nota: null })
    .eq("id", data);
  return { ok: true, id: data };
}

export async function renombrarTienda(
  tienda: unknown,
  nombre: unknown,
): Promise<{ ok: true } | Falla> {
  const sinSesion = await sesion();
  if (sinSesion) return sinSesion;
  const i = id.safeParse(tienda);
  const n = nombreTienda.safeParse(nombre);
  if (!i.success || !n.success) return { ok: false, error: "nombre_invalido" };
  const db = await clienteServidor();
  const { error } = await db
    .from("tiendas")
    .update({ nombre: n.data })
    .eq("id", i.data);
  if (error)
    return {
      ok: false,
      error:
        error.code === "23505" ? "tienda_nombre_repetido" : "importacion_error",
    };
  return { ok: true };
}

/** Crea un producto (o reutiliza el de ese nombre) y lo agrega a las tiendas indicadas. */
export async function crearProducto(
  entrada: unknown,
): Promise<{ ok: true; id: string; existente: boolean } | Falla> {
  const sinSesion = await sesion();
  if (sinSesion) return sinSesion;
  const p = esquemaProducto.safeParse(entrada);
  if (!p.success) return { ok: false, error: "nombre_invalido" };
  const db = await clienteServidor();
  const { data, error } = await db.rpc("crear_producto", {
    p_nombre: p.data.nombre,
    p_grupo: p.data.grupo,
    p_frecuencia: p.data.frecuencia,
  });
  if (error || !data)
    return { ok: false, error: traducir(error?.message ?? "") };
  // `crear_producto` devuelve el existente si el nombre ya estaba. Solo se completa un producto de esta
  // persona que aún no se revisó (origen «compra»): el de otra persona o el sembrado no se pisa. Se marca
  // «manual» al final, después de agregarlo a las tiendas: si algo falla antes, reintentar lo completa.
  const u = await usuario();
  const { data: fila } = await db
    .from("productos")
    .select("creado_por, origen")
    .eq("id", data)
    .maybeSingle();
  const nuevo = !!u && fila?.creado_por === u.id && fila.origen === "compra";
  if (p.data.tiendas.length) {
    const r = await agregar(data, p.data.tiendas);
    if (!r.ok) return r;
  }
  if (nuevo) {
    const { error: falla } = await db
      .from("productos")
      .update({
        unidad: p.data.unidad,
        ...unidadBase(p.data.unidad),
        emoji: p.data.emoji || null,
        origen: "manual",
        revisado: true,
      })
      .eq("id", data)
      .eq("origen", "compra");
    if (falla) return { ok: false, error: traducir(falla.message) };
  }
  return { ok: true, id: data, existente: !nuevo };
}

async function agregar(
  producto: string,
  tiendas: string[],
): Promise<{ ok: true } | Falla> {
  const db = await clienteServidor();
  const { error } = await db.rpc("agregar_a_tienda", {
    p_producto: producto,
    p_tiendas: tiendas,
  });
  return error ? { ok: false, error: traducir(error.message) } : { ok: true };
}

/** Agrega un producto que ya existe al catálogo de una o varias tiendas (o lo reactiva). */
export async function agregarATienda(
  entrada: unknown,
): Promise<{ ok: true } | Falla> {
  const sinSesion = await sesion();
  if (sinSesion) return sinSesion;
  const p = z
    .object({ producto: id, tiendas: z.array(id).min(1).max(10) })
    .safeParse(entrada);
  if (!p.success) return { ok: false, error: "catalogo_error" };
  return agregar(p.data.producto, p.data.tiendas);
}

/** Quitar es `activo = false`: la fila, los precios y el historial se quedan. */
export async function quitarDeTienda(
  entrada: unknown,
): Promise<{ ok: true } | Falla> {
  const sinSesion = await sesion();
  if (sinSesion) return sinSesion;
  const p = z.object({ producto: id, tienda: id }).safeParse(entrada);
  if (!p.success) return { ok: false, error: "catalogo_error" };
  const db = await clienteServidor();
  const { error } = await db.rpc("quitar_de_tienda", {
    p_producto: p.data.producto,
    p_tienda: p.data.tienda,
  });
  return error ? { ok: false, error: traducir(error.message) } : { ok: true };
}

export async function editarProducto(
  producto: unknown,
  cambios: unknown,
): Promise<{ ok: true } | Falla> {
  const sinSesion = await sesion();
  if (sinSesion) return sinSesion;
  const i = id.safeParse(producto);
  const c = esquemaProducto.omit({ tiendas: true }).safeParse(cambios);
  if (!i.success || !c.success) return { ok: false, error: "nombre_invalido" };
  const db = await clienteServidor();
  const { data: actual } = await db
    .from("productos")
    .select("unidad")
    .eq("id", i.data)
    .maybeSingle();
  // Si cambia la unidad también cambia la base con la que se normalizan los precios.
  const base =
    actual?.unidad === c.data.unidad ? {} : unidadBase(c.data.unidad);
  const { error } = await db
    .from("productos")
    .update({
      ...c.data,
      emoji: c.data.emoji || null,
      ...base,
      // Asignarle un grupo real a un producto "Por revisar" lo da por revisado.
      ...(c.data.grupo !== "Otros" ? { revisado: true } : {}),
    })
    .eq("id", i.data);
  return error ? { ok: false, error: "importacion_error" } : { ok: true };
}

export async function marcarRevisado(
  producto: unknown,
): Promise<{ ok: true } | Falla> {
  const sinSesion = await sesion();
  if (sinSesion) return sinSesion;
  const i = id.safeParse(producto);
  if (!i.success) return { ok: false, error: "fusion_sin_datos" };
  const db = await clienteServidor();
  const { error } = await db
    .from("productos")
    .update({ revisado: true })
    .eq("id", i.data);
  return error ? { ok: false, error: "importacion_error" } : { ok: true };
}

export type ConteosFusion = {
  precios: number;
  historial: number;
  manuales: number;
  anotados: number;
  gastos: number;
  catalogo: number;
  alias: number;
  codigos: number;
};

export async function fusionarProductos(
  origen: unknown,
  destino: unknown,
): Promise<({ ok: true } & ConteosFusion) | Falla> {
  const sinSesion = await sesion();
  if (sinSesion) return sinSesion;
  const o = id.safeParse(origen);
  const d = id.safeParse(destino);
  const v = validarFusion(o.success ? o.data : "", d.success ? d.data : "");
  if (!v.ok || !o.success || !d.success)
    return { ok: false, error: v.ok ? "fusion_sin_datos" : v.error };
  const db = await clienteServidor();
  const { data, error } = await db.rpc("fusionar_productos", {
    p_origen: o.data,
    p_destino: d.data,
  });
  if (error) return { ok: false, error: traducir(error.message) };
  return { ok: true, ...(data as ConteosFusion) };
}
