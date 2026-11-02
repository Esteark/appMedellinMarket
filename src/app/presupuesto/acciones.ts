"use server";

import { z } from "zod";
import { usuario } from "@/lib/datos";
import type {
  ResultadoDeshacer,
  ResultadoImportacion,
} from "@/lib/importar/tipos";
import { clienteServidor } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

/** Errores que lanza Postgres con `raise exception`; coinciden con claves del catálogo de avisos. */
const ERRORES_IMPORTACION = [
  "importacion_duplicada",
  "limite_tiendas",
  "limite_productos",
  "nombre_invalido",
  "precio_fuera_de_rango",
  "sin_sesion",
] as const;

/** Nunca devuelve `error.message` crudo: o es una clave conocida o es `importacion_error`. */
function claveDeError(mensaje: string): string {
  return (
    ERRORES_IMPORTACION.find((c) => mensaje.includes(c)) ?? "importacion_error"
  );
}

const esquemaRubro = z.object({
  rubro: z.string().min(1).max(60),
  monto: z.number().int().min(0).max(10_000_000),
  orden: z.number().int().min(0).max(100),
});

const esquemaPresupuesto = z
  .array(esquemaRubro)
  .max(50)
  .refine((r) => r.length > 0, "Debe haber al menos un rubro");

const fechaIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (f) => new Date(`${f}T00:00:00Z`).toISOString().startsWith(f),
    "Fecha inválida",
  );

const esquemaGasto = z
  .object({
    fecha: fechaIso,
    mes: z.string().regex(/^\d{4}-\d{2}$/),
    rubro: z.string().min(1).max(60),
    monto: z.number().int().min(0).max(50_000_000),
    origen: z.enum([
      "manual",
      "desde_lista",
      "plan_hogar",
      "plan_dieta",
      "importado",
    ]),
    nota: z.string().max(200).nullable().optional(),
    tienda_id: z.string().nullable().optional(),
    producto_id: z.string().nullable().optional(),
    cantidad: z.number().positive().max(9999).nullable().optional(),
    descripcion: z.string().max(200).nullable().optional(),
  })
  // El mes siempre sale de la fecha del gasto, no del mes abierto en pantalla.
  .transform((g) => ({ ...g, mes: g.fecha.slice(0, 7) }));

const esquemaFilaCompra = z.object({
  producto: z.string().trim().min(1).max(120),
  tienda: z.string().trim().min(1).max(60),
  cantidad: z.number().min(0.001).max(9999),
  precio_total: z.number().int().min(1).max(50_000_000),
  fecha: z.union([fechaIso, z.literal("")]).optional(),
  codigo: z.string().max(40).optional(),
  rubro: z.string().max(60).optional(),
  unidad: z.string().max(10).optional(),
  publicar_precio: z.boolean().optional(),
  promocion: z.boolean().optional(),
});

const esquemaFilasCompra = z.array(esquemaFilaCompra).min(1).max(500);

const esquemaImportacion = z.object({
  fecha: fechaIso,
  archivo: z.string().max(120).optional(),
  publicar: z.boolean(),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  filas: esquemaFilasCompra,
});

export async function guardarPresupuestoMensual(
  mes: string,
  rubros: unknown,
): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const parsed = esquemaPresupuesto.safeParse(rubros);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };
  const db = await clienteServidor();
  const filas = parsed.data.map((r) => ({
    user_id: u.id,
    mes,
    rubro: r.rubro,
    monto: r.monto,
    orden: r.orden,
  }));
  const { error } = await (
    db as unknown as {
      from: (t: string) => {
        upsert: (
          rows: unknown[],
          opts: { onConflict: string },
        ) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .from("presupuestos_mensuales")
    .upsert(filas, { onConflict: "user_id,mes,rubro" });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function obtenerPresupuestoMensual(
  mes: string,
): Promise<
  | { ok: true; rubros: { rubro: string; monto: number; orden: number }[] }
  | { ok: false; error: string }
> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const db = await clienteServidor();
  const { data, error } = await (
    db as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            eq: (
              col2: string,
              val2: string,
            ) => {
              order: (
                col: string,
                opts: { ascending: boolean },
              ) => Promise<{
                data: { rubro: string; monto: number; orden: number }[] | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
    }
  )
    .from("presupuestos_mensuales")
    .select("rubro, monto, orden")
    .eq("user_id", u.id)
    .eq("mes", mes)
    .order("orden", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, rubros: data ?? [] };
}

export async function agregarGasto(
  gasto: unknown,
): Promise<Resultado & { id?: string }> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const parsed = esquemaGasto.safeParse(gasto);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };
  const db = await clienteServidor();
  const { data, error } = await (
    db as unknown as {
      from: (t: string) => {
        insert: (row: unknown) => {
          select: (c: string) => {
            single: () => Promise<{
              data: { id: string } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    }
  )
    .from("gastos_reales")
    .insert({ user_id: u.id, ...parsed.data })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}

export async function listarGastos(
  mes: string,
): Promise<
  { ok: true; gastos: Record<string, unknown>[] } | { ok: false; error: string }
> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const db = await clienteServidor();
  const { data, error } = await (
    db as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            eq: (
              col2: string,
              val2: string,
            ) => {
              order: (
                col: string,
                opts: { ascending: boolean },
              ) => Promise<{
                data: Record<string, unknown>[] | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
    }
  )
    .from("gastos_reales")
    .select("*")
    .eq("user_id", u.id)
    .eq("mes", mes)
    .order("fecha", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, gastos: data ?? [] };
}

export async function eliminarGasto(id: string): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const db = await clienteServidor();
  const { error } = await (
    db as unknown as {
      from: (t: string) => {
        delete: () => {
          eq: (
            col: string,
            val: string,
          ) => {
            eq: (
              col2: string,
              val2: string,
            ) => Promise<{ error: { message: string } | null }>;
          };
        };
      };
    }
  )
    .from("gastos_reales")
    .delete()
    .eq("id", id)
    .eq("user_id", u.id);
  return error ? { ok: false, error: error.message } : { ok: true };
}

const esquemaCierre = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  total_presupuestado: z.number().int().min(0),
  total_gastado: z.number().int().min(0),
  ahorro: z.number().int(),
  por_rubro: z.array(
    z.object({
      rubro: z.string().min(1),
      presupuestado: z.number().int().min(0),
      gastado: z.number().int().min(0),
      porcentajeUsado: z.number().int().min(0),
    }),
  ),
});

export async function guardarCierrePresupuesto(
  snapshot: unknown,
): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const parsed = esquemaCierre.safeParse(snapshot);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };
  const db = await clienteServidor();
  const { error } = await (
    db as unknown as {
      from: (t: string) => {
        upsert: (
          rows: unknown,
          opts: { onConflict: string },
        ) => Promise<{ error: { message: string } | null }>;
      };
    }
  )
    .from("presupuestos_cierres")
    .upsert({ user_id: u.id, ...parsed.data }, { onConflict: "user_id,mes" });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function listarCierresPresupuesto(): Promise<
  | { ok: true; cierres: Record<string, unknown>[] }
  | { ok: false; error: string }
> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const db = await clienteServidor();
  const { data, error } = await (
    db as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            order: (
              col: string,
              opts: { ascending: boolean },
            ) => Promise<{
              data: Record<string, unknown>[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    }
  )
    .from("presupuestos_cierres")
    .select("*")
    .eq("user_id", u.id)
    .order("mes", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, cierres: data ?? [] };
}

type FilaCompra = z.infer<typeof esquemaFilaCompra>;

export type PrevisualizacionFila = {
  linea: number;
  tienda_texto: string;
  producto_texto: string;
  tienda_id: string | null;
  producto_id: string | null;
  producto_nombre: string | null;
  grupo: string;
  precio: number | null;
  tienda_nueva: boolean;
  producto_nuevo: boolean;
  aviso: string | null;
};

/** Qué tienda y qué producto se usarían, sin escribir nada. */
export async function previsualizarCompra(
  filas: unknown,
): Promise<
  { ok: true; filas: PrevisualizacionFila[] } | { ok: false; error: string }
> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const parsed = esquemaFilasCompra.safeParse(filas);
  if (!parsed.success) return { ok: false, error: "importacion_error" };
  const db = await clienteServidor();
  const { data, error } = await db.rpc("previsualizar_compra", {
    p_filas: parsed.data as FilaCompra[],
  });
  if (error) return { ok: false, error: claveDeError(error.message) };
  return { ok: true, filas: (data ?? []) as unknown as PrevisualizacionFila[] };
}

export async function importarCompra(
  entrada: unknown,
): Promise<
  ({ ok: true } & ResultadoImportacion) | { ok: false; error: string }
> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const parsed = esquemaImportacion.safeParse(entrada);
  if (!parsed.success) return { ok: false, error: "importacion_error" };
  const { fecha, archivo, publicar, hash, filas } = parsed.data;
  const db = await clienteServidor();
  const { data, error } = await db.rpc("importar_compra", {
    p_fecha: fecha,
    p_archivo: archivo ?? "factura.csv",
    p_publicar: publicar,
    p_filas: filas as FilaCompra[],
    p_hash: hash,
  });
  if (error) return { ok: false, error: claveDeError(error.message) };
  const r = data as {
    importacion_id: string;
    gastos: number;
    precios: number;
    tiendas_creadas: number;
    productos_creados: number;
    avisos: { linea: number; aviso: string }[];
  };
  return {
    ok: true,
    importacionId: r.importacion_id,
    gastos: r.gastos,
    precios: r.precios,
    tiendasCreadas: r.tiendas_creadas,
    productosCreados: r.productos_creados,
    avisos: r.avisos ?? [],
  };
}

export type LoteImportado = {
  id: string;
  fecha_lote: string;
  archivo: string | null;
  filas: number;
  total: number;
  creado: string;
  deshecho: string | null;
};

export async function listarImportaciones(): Promise<
  { ok: true; lotes: LoteImportado[] } | { ok: false; error: string }
> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const db = await clienteServidor();
  const { data, error } = await db
    .from("importaciones_gastos")
    .select("id, fecha_lote, archivo, filas, total, creado, deshecho")
    .order("creado", { ascending: false })
    .limit(50);
  if (error) return { ok: false, error: "importacion_error" };
  return { ok: true, lotes: (data ?? []) as LoteImportado[] };
}

export async function deshacerImportacion(
  id: unknown,
): Promise<({ ok: true } & ResultadoDeshacer) | { ok: false; error: string }> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "importacion_error" };
  const db = await clienteServidor();
  const { data, error } = await db.rpc("deshacer_importacion", {
    p_id: parsed.data,
  });
  if (error) return { ok: false, error: claveDeError(error.message) };
  const r = data as { restaurados: number; conservados: number };
  return { ok: true, restaurados: r.restaurados, conservados: r.conservados };
}

const esquemaEdicion = z.object({
  id: z.string().uuid(),
  fecha: fechaIso,
  rubro: z.string().min(1).max(60),
  monto: z.number().int().min(0).max(50_000_000),
  tienda_id: z.string().nullable().optional(),
  nota: z.string().max(200).nullable().optional(),
  producto_id: z.string().min(1).max(80).nullable().optional(),
  // `gastos_reales.cantidad` exige > 0; null la borra, ausente la deja como está.
  cantidad: z.number().gt(0).max(100_000).nullable().optional(),
  descripcion: z.string().max(200).nullable().optional(),
});

/**
 * Corrige un gasto propio: fecha, rubro, monto, tienda, nota, producto, cantidad y descripción.
 * El mes se recalcula con la fecha. Un campo ausente no se toca; `null` lo borra. Editar un gasto de
 * una factura no lo saca de su lote.
 */
export async function editarGasto(gasto: unknown): Promise<Resultado> {
  const u = await usuario();
  if (!u) return { ok: false, error: "sin_sesion" };
  const parsed = esquemaEdicion.safeParse(gasto);
  if (!parsed.success) return { ok: false, error: "gasto_edicion_invalida" };
  const { id, ...campos } = parsed.data;
  const db = await clienteServidor();
  const { data, error } = await db
    .from("gastos_reales")
    .update({ ...campos, mes: campos.fecha.slice(0, 7) })
    .eq("id", id)
    .eq("user_id", u.id)
    .select("id");
  // Un producto que no existe, una cantidad fuera de rango, etc. rebotan en la base.
  if (error) return { ok: false, error: "gasto_edicion_invalida" };
  // Sin filas: el gasto no existe o es de otra persona.
  if (!data?.length) return { ok: false, error: "ajeno" };
  return { ok: true };
}
