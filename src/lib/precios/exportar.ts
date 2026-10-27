import type { ProductoCatalogo } from "@/lib/datos";
import type { Lista } from "./lista";
import { SIN_PRECIO, seccionar } from "./secciones";

export type FilaPdf = {
  producto: string;
  cantidad: number;
  /** Precio unitario en esa tienda; `null` si ninguna tiene precio. */
  precio: number | null;
  subtotal: number | null;
  /** Precio anotado a mano o desactualizado: puede haber cambiado. */
  marca: boolean;
};

export type TablaPdf = { tienda: string; filas: FilaPdf[]; subtotal: number };

export type DatosPdf = {
  /** Una tabla por tienda (comprando dividido), de mayor a menor subtotal. */
  tablas: TablaPdf[];
  /** Productos que ninguna tienda tiene: van aparte, sin precio inventado. */
  sinPrecio: FilaPdf[];
  total: number;
  hayMarcas: boolean;
};

type Producto = Pick<
  ProductoCatalogo,
  "id" | "nombre" | "unidad" | "grupo" | "precios" | "viejos" | "mejor"
>;

/** Lo que lleva el PDF de la lista de mercado, sin formato: números y textos del catálogo. */
export function datosPdf(
  lista: Lista,
  productos: Producto[],
  tiendas: { id: string; nombre: string }[],
): DatosPdf {
  const porId = new Map(productos.map((p) => [p.id, p]));
  const secciones = seccionar(
    "tienda",
    lista,
    productos,
    Object.fromEntries(productos.map((p) => [p.id, p.precios])),
    tiendas.map((t) => t.id),
  );
  const fila = (
    f: { id: string; cantidad: number; precio: number | null },
    tienda: string,
  ): FilaPdf => {
    const p = porId.get(f.id);
    return {
      producto: p ? `${p.nombre} (${p.unidad})` : f.id,
      cantidad: f.cantidad,
      precio: f.precio,
      subtotal: f.precio == null ? null : f.precio * f.cantidad,
      marca:
        f.precio != null &&
        (tienda in (p?.viejos ?? {}) ||
          (p?.mejor?.tienda === tienda && p.mejor.estado === "anotado")),
    };
  };

  const tablas: TablaPdf[] = [];
  let sinPrecio: FilaPdf[] = [];
  for (const s of secciones) {
    if (s.clave === SIN_PRECIO) {
      sinPrecio = s.filas.map((f) => fila(f, s.clave));
      continue;
    }
    tablas.push({
      tienda: tiendas.find((t) => t.id === s.clave)?.nombre ?? s.clave,
      filas: s.filas.map((f) => fila(f, s.clave)),
      subtotal: s.total,
    });
  }
  return {
    tablas,
    sinPrecio,
    total: tablas.reduce((a, t) => a + t.subtotal, 0),
    hayMarcas: tablas.some((t) => t.filas.some((f) => f.marca)),
  };
}
