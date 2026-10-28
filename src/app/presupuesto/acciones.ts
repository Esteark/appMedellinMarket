"use server";

import { z } from "zod";
import { usuario } from "@/lib/datos";
import { clienteServidor } from "@/lib/supabase/server";

type Resultado = { ok: true } | { ok: false; error: string };

const esquemaRubro = z.object({
  rubro: z.string().min(1).max(60),
  monto: z.number().int().min(0).max(10_000_000),
  orden: z.number().int().min(0).max(100),
});

const esquemaPresupuesto = z
  .array(esquemaRubro)
  .max(50)
  .refine((r) => r.length > 0, "Debe haber al menos un rubro");

const esquemaGasto = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mes: z.string().regex(/^\d{4}-\d{2}$/),
  rubro: z.string().min(1).max(60),
  monto: z.number().int().min(0).max(10_000_000),
  origen: z.enum(["manual", "desde_lista", "plan_hogar", "plan_dieta"]),
  nota: z.string().max(200).nullable().optional(),
  tienda_id: z.string().nullable().optional(),
  producto_id: z.string().nullable().optional(),
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
