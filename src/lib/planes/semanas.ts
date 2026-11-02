import { z } from "zod";
import type { ConfigPlan } from "./config";

export const COMIDAS = ["desayuno", "almuerzo", "cena"] as const;
export type Comida = (typeof COMIDAS)[number];
export const MIN_SEMANAS = 4;
export const MAX_SEMANAS = 5;

const cantidades = (max: number) =>
  z
    .record(
      z.string().regex(/^[a-z0-9_-]{1,60}$/),
      z.number().int().min(1).max(999),
    )
    .refine((c) => Object.keys(c).length <= max);

const dia = z.object({
  desayuno: cantidades(40),
  almuerzo: cantidades(40),
  cena: cantidades(40),
});

export const semana = z.object({
  /** Lunes a domingo. */
  dias: z.array(dia).length(7),
  /** Compras de la semana que no son de una comida (aseo, especias, lista base). */
  despensa: cantidades(80),
});
export type Semana = z.infer<typeof semana>;
export type Cantidades = Semana["despensa"];

export const semanas = z.array(semana).min(MIN_SEMANAS).max(MAX_SEMANAS);

export const semanaVacia = (): Semana => ({
  dias: Array.from({ length: 7 }, () => ({
    desayuno: {},
    almuerzo: {},
    cena: {},
  })),
  despensa: {},
});

/** Un plan sin semanas pasa a tener las 4 mínimas, vacías; si ya las tiene, no cambia. */
export function conSemanas(config: ConfigPlan): ConfigPlan {
  if (config.semanas) return config;
  return {
    ...config,
    semanas: Array.from({ length: MIN_SEMANAS }, semanaVacia),
  };
}

/** Agrega la semana 5; `null` si el plan no tiene semanas o ya llegó al tope. */
export function agregarSemana(config: ConfigPlan): ConfigPlan | null {
  const s = config.semanas;
  if (!s || s.length >= MAX_SEMANAS) return null;
  return { ...config, semanas: [...s, semanaVacia()] };
}

/** Quita solo la última; `null` si no hay semanas o ya está en el mínimo. */
export function quitarSemana(config: ConfigPlan): ConfigPlan | null {
  const s = config.semanas;
  if (!s || s.length <= MIN_SEMANAS) return null;
  return { ...config, semanas: s.slice(0, -1) };
}

/** Copia una comida de `dia` (0 = lunes) a los otros seis días; las demás comidas no cambian. */
export function repetirEnTodosLosDias(
  s: Semana,
  dia: number,
  comida: Comida,
): Semana {
  const origen = s.dias[dia]?.[comida];
  if (!origen) return s;
  return {
    ...s,
    dias: s.dias.map((d) => ({ ...d, [comida]: { ...origen } })),
  };
}

/** Mismos productos con las mismas cantidades, sin importar el orden en que se agregaron. */
export function mismasCantidades(a: Cantidades, b: Cantidades): boolean {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
}

/** Suma la lista base (`items`) a la despensa de la semana `indice` sin pisar lo que ya puso; `null` si no existe o no cabe. */
export function traerListaBase(
  config: ConfigPlan,
  indice: number,
): ConfigPlan | null {
  const s = config.semanas?.[indice];
  if (!config.semanas || !s) return null;
  const despensa = { ...config.items, ...s.despensa };
  if (!semana.safeParse({ ...s, despensa }).success) return null;
  return {
    ...config,
    semanas: config.semanas.map((x, i) =>
      i === indice ? { ...s, despensa } : x,
    ),
  };
}
