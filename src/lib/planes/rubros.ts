import { normalizarNombre } from "@/lib/importar/emparejar";
import type { Lista } from "@/lib/precios/lista";
import { RUBROS_SUGERIDOS } from "@/lib/presupuesto/defaults";
import type { ConfigPlan } from "./config";

export const OTROS = "Otros";
export const MAX_RUBROS = 50;
export const MAX_NOMBRE_RUBRO = 40;
export const MAX_GRUPOS_POR_RUBRO = 30;

/** Grupos que cuenta cada rubro de fábrica; reproduce `rubroDe` de `src/data/planes.ts`. «Otros» recibe el resto. */
export const GRUPOS_DE_FABRICA: Record<string, string[]> = {
  Carnes: ["Proteínas"],
  Lácteos: ["Lácteos"],
  Verduras: ["Verduras", "Tubérculos"],
  Frutas: ["Frutas"],
  Granos: ["Granos"],
  Panadería: ["Panadería"],
  Despensa: ["Despensa"],
  Aseo: ["Aseo"],
  Bebidas: ["Bebidas"],
  Mecato: ["Mecato"],
};

export type ErrorRubro =
  | "nombre_invalido"
  | "repetido"
  | "reservado"
  | "limite"
  | "no_existe";

export type ResultadoRubro =
  | { ok: true; config: ConfigPlan }
  | { ok: false; error: ErrorRubro };

/** Como `ResultadoRubro`, y `desde` dice de qué rubro salió el grupo asignado (si estaba en otro). */
export type ResultadoGrupo =
  | { ok: true; config: ConfigPlan; desde: string | null }
  | { ok: false; error: ErrorRubro };

const falla = (error: ErrorRubro): { ok: false; error: ErrorRubro } => ({
  ok: false,
  error,
});

/** Orden efectivo: lo que eligió la persona y, después, el resto en el orden sugerido de fábrica. */
export function rubrosOrdenados(config: ConfigPlan): string[] {
  const existen = new Set(Object.keys(config.rubros));
  const salida: string[] = [];
  for (const r of config.orden ?? [])
    if (existen.has(r) && !salida.includes(r)) salida.push(r);
  const sugerido = (r: string) => {
    const i = (RUBROS_SUGERIDOS as readonly string[]).indexOf(r);
    return i < 0 ? RUBROS_SUGERIDOS.length : i;
  };
  const resto = [...existen]
    .filter((r) => !salida.includes(r))
    .sort((a, b) => sugerido(a) - sugerido(b));
  return [...salida, ...resto];
}

/** Grupos de producto que cuenta un rubro; «Otros» no tiene: recibe todo lo que nadie cuenta. */
export function gruposDe(config: ConfigPlan, rubro: string): string[] {
  if (rubro === OTROS) return [];
  return config.grupos?.[rubro] ?? GRUPOS_DE_FABRICA[rubro] ?? [];
}

/** Valida y recorta un nombre de rubro; `null` si no sirve. */
function limpiar(nombre: string): string | null {
  const n = nombre.trim().replace(/\s+/g, " ");
  return n.length >= 2 && n.length <= MAX_NOMBRE_RUBRO ? n : null;
}

const choca = (config: ConfigPlan, nombre: string, salvo?: string) =>
  Object.keys(config.rubros).some(
    (r) => r !== salvo && normalizarNombre(r) === normalizarNombre(nombre),
  );

/** Agrega un rubro al final con ese monto y sin grupos; rechaza repetidos, «Otros» y pasar de 50. */
export function agregarRubro(
  config: ConfigPlan,
  nombre: string,
  monto = 0,
): ResultadoRubro {
  const n = limpiar(nombre);
  if (!n) return falla("nombre_invalido");
  if (normalizarNombre(n) === normalizarNombre(OTROS))
    return falla("reservado");
  if (choca(config, n)) return falla("repetido");
  if (Object.keys(config.rubros).length >= MAX_RUBROS) return falla("limite");
  const orden = [...rubrosOrdenados(config), n];
  return {
    ok: true,
    config: {
      ...config,
      rubros: { ...config.rubros, [n]: monto },
      orden,
      // Vacío a propósito: un rubro nuevo no hereda los grupos de fábrica de un nombre que ya se quitó.
      grupos: { ...config.grupos, [n]: [] },
    },
  };
}

/** Cambia el nombre conservando monto, posición y grupos; «Otros» no se renombra. */
export function renombrarRubro(
  config: ConfigPlan,
  de: string,
  a: string,
): ResultadoRubro {
  if (!(de in config.rubros)) return falla("no_existe");
  if (de === OTROS) return falla("reservado");
  const n = limpiar(a);
  if (!n) return falla("nombre_invalido");
  if (normalizarNombre(n) === normalizarNombre(OTROS))
    return falla("reservado");
  if (choca(config, n, de)) return falla("repetido");
  if (n === de) return { ok: true, config };
  const { [de]: monto, ...otros } = config.rubros;
  const { [de]: _viejos, ...grupos } = config.grupos ?? {};
  return {
    ok: true,
    config: {
      ...config,
      rubros: { ...otros, [n]: monto },
      orden: rubrosOrdenados(config).map((r) => (r === de ? n : r)),
      // Se escriben los grupos efectivos: el nombre nuevo no tiene valores de fábrica que heredar.
      grupos: { ...grupos, [n]: gruposDe(config, de) },
    },
  };
}

/** Quita el rubro con su monto, posición y grupos; sus grupos quedan sin dueño y cuentan en «Otros». */
export function quitarRubro(
  config: ConfigPlan,
  nombre: string,
): ResultadoRubro {
  if (!(nombre in config.rubros)) return falla("no_existe");
  if (nombre === OTROS) return falla("reservado");
  const { [nombre]: _monto, ...rubros } = config.rubros;
  const { [nombre]: _grupos, ...grupos } = config.grupos ?? {};
  return {
    ok: true,
    config: {
      ...config,
      rubros,
      orden: rubrosOrdenados(config).filter((r) => r !== nombre),
      grupos,
    },
  };
}

/** Sube (-1) o baja (+1) un rubro una posición; en los extremos no cambia nada. */
export function moverRubro(
  config: ConfigPlan,
  nombre: string,
  delta: 1 | -1,
): ResultadoRubro {
  const orden = rubrosOrdenados(config);
  const i = orden.indexOf(nombre);
  if (i < 0) return falla("no_existe");
  const j = i + delta;
  if (j < 0 || j >= orden.length) return { ok: true, config };
  [orden[i], orden[j]] = [orden[j], orden[i]];
  return { ok: true, config: { ...config, orden } };
}

/** Un grupo pertenece a un solo rubro: asignarlo lo saca del que lo tenía y dice de cuál. */
export function asignarGrupo(
  config: ConfigPlan,
  rubro: string,
  grupo: string,
): ResultadoGrupo {
  if (!(rubro in config.rubros)) return falla("no_existe");
  if (rubro === OTROS) return falla("reservado");
  const g = grupo.trim();
  if (!g || g.length > MAX_NOMBRE_RUBRO) return falla("nombre_invalido");
  if (gruposDe(config, rubro).includes(g)) {
    return { ok: true, config, desde: null };
  }
  if (gruposDe(config, rubro).length >= MAX_GRUPOS_POR_RUBRO)
    return falla("limite");
  let desde: string | null = null;
  const grupos: Record<string, string[]> = { ...config.grupos };
  for (const r of Object.keys(config.rubros)) {
    const propios = gruposDe(config, r);
    if (r !== rubro && propios.includes(g)) {
      desde = r;
      grupos[r] = propios.filter((x) => x !== g);
    }
  }
  grupos[rubro] = [...gruposDe(config, rubro), g];
  return { ok: true, config: { ...config, grupos }, desde };
}

/** Deja de contar un grupo en ese rubro; sus productos pasan a «Otros». */
export function quitarGrupo(
  config: ConfigPlan,
  rubro: string,
  grupo: string,
): ResultadoRubro {
  if (!(rubro in config.rubros)) return falla("no_existe");
  return {
    ok: true,
    config: {
      ...config,
      grupos: {
        ...config.grupos,
        [rubro]: gruposDe(config, rubro).filter((x) => x !== grupo),
      },
    },
  };
}

/** El huevo cuenta como «Proteínas» (hoy `rubroDe` lo manda a Carnes por su id). */
export const grupoEfectivo = (p: { id: string; grupo: string }) =>
  p.id === "huevos" ? "Proteínas" : p.grupo;

/** Rubro del plan al que cuenta un producto: el primero (en orden) que cuenta su grupo, o «Otros». */
export function rubroDeProducto(
  config: ConfigPlan,
  p: { id: string; grupo: string },
): string {
  const g = grupoEfectivo(p);
  for (const r of rubrosOrdenados(config))
    if (r !== OTROS && gruposDe(config, r).includes(g)) return r;
  return OTROS;
}

/** Lo gastado por rubro: cada producto de la lista, a su precio en la tienda del óptimo dividido, en el rubro que le toca. */
export function gastoPorRubro(
  config: ConfigPlan,
  productos: {
    id: string;
    grupo: string;
    precios: Record<string, number | null>;
  }[],
  lista: Lista,
  tiendaDe: Record<string, string>,
): Map<string, number> {
  const gasto = new Map<string, number>();
  for (const p of productos) {
    const cantidad = lista[p.id] ?? 0;
    const tienda = tiendaDe[p.id];
    const precio = tienda ? p.precios[tienda] : null;
    if (!cantidad || precio == null) continue;
    const rubro = rubroDeProducto(config, p);
    gasto.set(rubro, (gasto.get(rubro) ?? 0) + precio * cantidad);
  }
  return gasto;
}

/** Qué decirle a la persona cuando una operación de rubros se rechaza. */
export function textoErrorRubro(error: ErrorRubro): string {
  switch (error) {
    case "nombre_invalido":
      return "Escribe un nombre de 2 a 40 caracteres.";
    case "repetido":
      return "Ya tienes un rubro con ese nombre.";
    case "reservado":
      return "«Otros» es el rubro de lo que nadie cuenta: no se agrega, renombra ni quita.";
    case "limite":
      return "Ya hay 50 rubros: quita uno para agregar otro.";
    case "no_existe":
      return "Ese rubro ya no existe.";
  }
}
