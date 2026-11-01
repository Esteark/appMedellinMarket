export const MAX_LISTAS = 20;
export const MAX_ITEMS = 200;
export const CLAVE_LISTAS = "mercado-medellin:listas";

export type Items = Record<string, number>;
export type ListaGuardada = {
  nombre: string;
  items: Items;
  tienda_preferida: string;
  /** ISO; decide qué copia gana al fusionar. */
  actualizada: string;
};

/** Misma regla que `nombre_clave` en la base: sin espacios en los bordes y sin mayúsculas. */
export const normalizarNombre = (nombre: string) => nombre.trim().toLowerCase();

/** Quita las más viejas hasta dejar `max`. */
export function recortarALimite(
  listas: ListaGuardada[],
  max = MAX_LISTAS,
): ListaGuardada[] {
  return [...listas]
    .sort((a, b) => b.actualizada.localeCompare(a.actualizada))
    .slice(0, max);
}

/** Une las del dispositivo con las de la nube por nombre; gana la `actualizada` más reciente. */
export function fusionarListas(
  locales: ListaGuardada[],
  nube: ListaGuardada[],
): ListaGuardada[] {
  const porClave = new Map<string, ListaGuardada>();
  for (const l of [...nube, ...locales]) {
    const clave = normalizarNombre(l.nombre);
    const previa = porClave.get(clave);
    if (!previa || l.actualizada > previa.actualizada) porClave.set(clave, l);
  }
  return recortarALimite([...porClave.values()]);
}

/** Cargar reemplaza la lista activa por la guardada. */
export const cargar = (guardada: ListaGuardada): Items => ({
  ...guardada.items,
});

/** Sumar fusiona con `max` por producto: nunca baja una cantidad. */
export function sumar(actual: Items, guardada: ListaGuardada): Items {
  const resultado = { ...actual };
  for (const [id, n] of Object.entries(guardada.items))
    resultado[id] = Math.max(resultado[id] ?? 0, n);
  return resultado;
}

export function leerLocales(): ListaGuardada[] {
  try {
    const crudo = localStorage.getItem(CLAVE_LISTAS);
    if (!crudo) return [];
    const p = JSON.parse(crudo) as { version?: number; listas?: unknown };
    return p.version === 1 && Array.isArray(p.listas)
      ? (p.listas as ListaGuardada[])
      : [];
  } catch {
    return [];
  }
}

export function guardarLocales(listas: ListaGuardada[]) {
  try {
    localStorage.setItem(
      CLAVE_LISTAS,
      JSON.stringify({ version: 1, listas: recortarALimite(listas) }),
    );
  } catch {
    // sin almacenamiento: la lista vive solo en esta sesión
  }
}

/** Sube o baja la cantidad de un producto de la lista sin salirse de 1–999. */
export function ajustarItem(items: Items, id: string, delta: number): Items {
  if (!(id in items)) return items;
  return { ...items, [id]: Math.min(999, Math.max(1, items[id] + delta)) };
}

export function quitarItem(items: Items, id: string): Items {
  return Object.fromEntries(Object.entries(items).filter(([k]) => k !== id));
}

/** Agrega un producto con cantidad 1; `null` si la lista ya tiene `MAX_ITEMS`. Si ya estaba, no cambia nada. */
export function agregarItem(items: Items, id: string): Items | null {
  if (id in items) return items;
  return Object.keys(items).length >= MAX_ITEMS ? null : { ...items, [id]: 1 };
}

/** Misma lista con otros productos; el nombre no cambia y `actualizada` decide quién gana al sincronizar. */
export function actualizarLista(
  lista: ListaGuardada,
  items: Items,
): ListaGuardada {
  return { ...lista, items, actualizada: new Date().toISOString() };
}

/** Mismos productos con las mismas cantidades, sin importar el orden. */
export function mismosItems(a: Items, b: Items): boolean {
  const ks = Object.keys(a);
  return ks.length === Object.keys(b).length && ks.every((k) => a[k] === b[k]);
}
