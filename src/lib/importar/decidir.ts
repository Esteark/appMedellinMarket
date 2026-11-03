import { grupoARubro } from "@/lib/presupuesto/rubros";
import { UNIDADES } from "./factura";
import { inferirProducto } from "./inferir";
import { claveRepetida } from "./resumen";
import type { FilaRevision, ModoFila } from "./tipos";

/** El producto existente que la persona eligió para una línea. */
export type ProductoElegido = { id: string; grupo: string; unidad: string };

/**
 * Cambia lo que se hace con una línea y deja coherentes los campos que dependen de ello: `existente` liga el producto
 * elegido, `crear` propone ícono, grupo y unidad a partir del nombre, y `solo_gasto` no crea producto ni publica
 * precio. La decisión queda como «manual»: la vista previa del servidor ya no la cambia.
 */
export function aplicarModo(
  f: FilaRevision,
  modo: ModoFila,
  producto?: ProductoElegido,
): FilaRevision {
  const base = { ...f, modo, modoManual: true };
  if (modo === "existente") {
    if (!producto) return { ...base, modo: f.modo, modoManual: f.modoManual };
    return {
      ...base,
      productoId: producto.id,
      nuevo: false,
      publicarPrecio: true,
      emoji: null,
      grupo: producto.grupo,
      rubro: grupoARubro(producto.grupo),
      unidad: UNIDADES.includes(producto.unidad) ? producto.unidad : f.unidad,
      cantidadBase: 1,
    };
  }
  if (modo === "solo_gasto")
    return { ...base, productoId: null, nuevo: false, publicarPrecio: false };
  // crear: si venía de otra decisión, se vuelve a proponer la ficha desde el nombre
  const inf =
    f.modo === "crear" ? null : inferirProducto(f.producto, f.cantidad);
  return {
    ...base,
    productoId: null,
    nuevo: true,
    publicarPrecio: true,
    ...(inf && {
      emoji: inf.emoji,
      grupo: inf.grupo,
      rubro: grupoARubro(inf.grupo),
      unidad: inf.unidad,
      cantidadBase: inf.cantidadBase,
    }),
  };
}

/** Índices de las líneas que comparten producto, tienda y fecha, en el orden del archivo; la primera manda. */
export function lineasJuntas(filas: FilaRevision[]): number[][] {
  const m = new Map<string, number[]>();
  filas.forEach((f, i) => {
    const k = claveRepetida({ ...f, fecha: f.fecha });
    m.set(k, [...(m.get(k) ?? []), i]);
  });
  return [...m.values()];
}

/** Aplica una decisión a una línea y a todas las que se repiten con ella (mismo producto, tienda y fecha). */
export function decidir(
  filas: FilaRevision[],
  i: number,
  modo: ModoFila,
  producto?: ProductoElegido,
): FilaRevision[] {
  const juntas = new Set(lineasJuntas(filas).find((g) => g.includes(i)) ?? [i]);
  return filas.map((f, k) =>
    juntas.has(k) ? aplicarModo(f, modo, producto) : f,
  );
}

/** Lo que devuelve `previsualizar_compra` para una línea. */
export type VistaPrevia = {
  tienda_id: string | null;
  producto_id: string | null;
  producto_nuevo: boolean;
  grupo: string;
};

/**
 * Pone en la línea lo que halló el servidor (tienda, y producto si coincide por código, alias o nombre). Lo que la
 * persona decidió a mano no se toca; el resto se corrige con lo que sabe el servidor.
 */
export function conVistaPrevia(f: FilaRevision, v: VistaPrevia): FilaRevision {
  const base = { ...f, tiendaId: v.tienda_id };
  if (f.modoManual) return base;
  if (v.producto_id)
    return {
      ...base,
      productoId: v.producto_id,
      nuevo: false,
      modo: "existente",
      publicarPrecio: true,
      emoji: null,
      grupo: v.grupo,
      rubro: grupoARubro(v.grupo),
    };
  // El servidor no la conoce: si el cliente creía que sí, se vuelve a proponer como nueva o como solo gasto.
  if (f.modo === "existente") {
    const inf = inferirProducto(f.producto, f.cantidad);
    return {
      ...aplicarModo(f, inf.noEsProducto ? "solo_gasto" : "crear"),
      modoManual: false,
      tiendaId: v.tienda_id,
    };
  }
  return base;
}
