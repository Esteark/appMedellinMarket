import { type ConfigPlan, leerConfig, type TipoPlan } from "./config";

export const MAX_GUARDADOS = 20;

const clave = (tipo: TipoPlan) => `mercado-medellin:planes:${tipo}`;

export type PlanGuardado = {
  nombre: string;
  config: ConfigPlan;
  /** ISO; decide qué copia gana al fusionar. */
  actualizada: string;
};

/** Misma regla que `nombre_clave` en la base: sin espacios en los bordes y sin mayúsculas. */
export const normalizarNombre = (nombre: string) => nombre.trim().toLowerCase();

/** Valida una fila cruda (del dispositivo o de la nube); si falta algo, se descarta. */
export function leerGuardado(crudo: unknown): PlanGuardado | null {
  if (!crudo || typeof crudo !== "object") return null;
  const o = crudo as Record<string, unknown>;
  const nombre = typeof o.nombre === "string" ? o.nombre.trim() : "";
  const actualizada = typeof o.actualizada === "string" ? o.actualizada : "";
  const config = leerConfig(o.config);
  if (!nombre || nombre.length > 60 || !actualizada || !config) return null;
  return { nombre, config, actualizada };
}

export function leerGuardados(crudo: unknown): PlanGuardado[] {
  if (!Array.isArray(crudo)) return [];
  return crudo.flatMap((x) => {
    const p = leerGuardado(x);
    return p ? [p] : [];
  });
}

/** Quita los más viejos hasta dejar `max`. */
export function recortarGuardados(
  planes: PlanGuardado[],
  max = MAX_GUARDADOS,
): PlanGuardado[] {
  return [...planes]
    .sort((a, b) => b.actualizada.localeCompare(a.actualizada))
    .slice(0, max);
}

/** Une dispositivo y nube por nombre; gana la `actualizada` más reciente. */
export function fusionarGuardados(
  locales: PlanGuardado[],
  nube: PlanGuardado[],
): PlanGuardado[] {
  const porClave = new Map<string, PlanGuardado>();
  for (const p of [...nube, ...locales]) {
    const k = normalizarNombre(p.nombre);
    const previa = porClave.get(k);
    if (!previa || p.actualizada > previa.actualizada) porClave.set(k, p);
  }
  return recortarGuardados([...porClave.values()]);
}

/** Huella estable para saber si hace falta subir el conjunto completo. */
export const huellaGuardados = (planes: PlanGuardado[]) =>
  planes
    .map((p) => `${normalizarNombre(p.nombre)}@${p.actualizada}`)
    .sort()
    .join("|");

export function leerGuardadosLocal(tipo: TipoPlan): PlanGuardado[] {
  try {
    const crudo = localStorage.getItem(clave(tipo));
    if (!crudo) return [];
    const p = JSON.parse(crudo) as { version?: number; planes?: unknown };
    return p.version === 1 ? leerGuardados(p.planes) : [];
  } catch {
    return [];
  }
}

export function guardarGuardadosLocal(tipo: TipoPlan, planes: PlanGuardado[]) {
  try {
    localStorage.setItem(
      clave(tipo),
      JSON.stringify({ version: 1, planes: recortarGuardados(planes) }),
    );
  } catch {
    // sin almacenamiento: los presupuestos viven solo en esta pestaña
  }
}
