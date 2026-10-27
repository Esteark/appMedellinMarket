import { type Lista, optimoDividido, type Precios } from "./lista";

export type ModoLista = "tienda" | "grupo" | "todo";

export type FilaSeccion = {
  id: string;
  cantidad: number;
  /** Precio unitario en la tienda más barata del producto; `null` si ninguna tiene precio. */
  precio: number | null;
};

export type Seccion = {
  /** id de tienda, nombre de grupo, `sin_precio` o `todo`. */
  clave: string;
  filas: FilaSeccion[];
  /** Suma de precio × cantidad de las filas con precio. */
  total: number;
};

export const SIN_PRECIO = "sin_precio";

/**
 * La lista agrupada para mostrarla: por tienda (comprando dividido, cada producto en su tienda
 * más barata), por grupo, o plana. Las secciones van de mayor a menor total; "sin precio" al final.
 */
export function seccionar(
  modo: ModoLista,
  lista: Lista,
  productos: { id: string; grupo: string }[],
  precios: Precios,
  tiendas: string[],
): Seccion[] {
  const { tiendaDe } = optimoDividido(lista, precios, tiendas);
  const grupoDe = new Map(productos.map((p) => [p.id, p.grupo]));
  const secciones = new Map<string, Seccion>();
  for (const [id, cantidad] of Object.entries(lista)) {
    const tienda = tiendaDe[id];
    const precio = tienda ? (precios[id]?.[tienda] ?? null) : null;
    const clave =
      modo === "todo"
        ? "todo"
        : modo === "tienda"
          ? (tienda ?? SIN_PRECIO)
          : (grupoDe.get(id) ?? "Otros");
    const s = secciones.get(clave) ?? { clave, filas: [], total: 0 };
    s.filas.push({ id, cantidad, precio });
    if (precio != null) s.total += precio * cantidad;
    secciones.set(clave, s);
  }
  return [...secciones.values()].sort(
    (a, b) =>
      Number(a.clave === SIN_PRECIO) - Number(b.clave === SIN_PRECIO) ||
      b.total - a.total,
  );
}
