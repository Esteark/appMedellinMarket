import { z } from "zod";
import { PLANES } from "@/data/planes";
import {
  PRESUPUESTO_SUGERIDO_DIETA,
  PRESUPUESTO_SUGERIDO_HOGAR,
} from "@/lib/presupuesto/defaults";

export type TipoPlan = "hogar" | "dieta";

const id = z.string().regex(/^[a-z0-9_-]{1,60}$/);
const monto = z.number().int().min(0).max(10_000_000);

export const configPlan = z.object({
  version: z.literal(1),
  personas: z.number().int().min(1).max(20),
  /** Solo Hogar. */
  aportantes: z.number().int().min(1).max(20).optional(),
  rubros: z
    .record(z.string().min(1).max(40), monto)
    .refine((r) => Object.keys(r).length <= 50),
  items: z
    .record(id, z.number().int().min(1).max(999))
    .refine((i) => Object.keys(i).length <= 200),
  propios: z
    .array(
      z.object({ nombre: z.string().trim().min(1).max(60), precio: monto }),
    )
    .max(50),
  nota: z.string().max(1000),
  actualizada: z.iso.datetime({ offset: true }),
});
export type ConfigPlan = z.infer<typeof configPlan>;

/** El plan de fábrica: personas, rubros y productos de `src/data/planes.ts` (las fracciones suben al entero). */
export function planSugerido(tipo: TipoPlan, ahora: string): ConfigPlan {
  const items = tipo === "hogar" ? PLANES.hogar.items : PLANES.semana.items;
  return {
    version: 1,
    personas: tipo === "hogar" ? 6 : 5,
    ...(tipo === "hogar" && { aportantes: 4 }),
    rubros: {
      ...(tipo === "hogar"
        ? PRESUPUESTO_SUGERIDO_HOGAR
        : PRESUPUESTO_SUGERIDO_DIETA),
    },
    items: Object.fromEntries(
      Object.entries(items).map(([k, q]) => [k, Math.ceil(q)]),
    ),
    propios: [],
    nota: "",
    actualizada: ahora,
  };
}

/** JSON de otra versión o corrupto → null (se conserva lo local). */
export function leerConfig(crudo: unknown): ConfigPlan | null {
  const r = configPlan.safeParse(crudo);
  return r.success ? r.data : null;
}

/** Gana la `actualizada` más reciente; una copia ausente o corrupta nunca pisa a la otra. */
export function fusionarPlan(
  local: unknown,
  nube: unknown,
): { config: ConfigPlan; origen: "local" | "nube" } | null {
  const l = leerConfig(local);
  const n = leerConfig(nube);
  if (l && (!n || l.actualizada >= n.actualizada))
    return { config: l, origen: "local" };
  return n ? { config: n, origen: "nube" } : null;
}
