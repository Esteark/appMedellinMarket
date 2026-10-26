import type { UnidadBase } from "@/lib/unidades";

type Medida = { unidad_base: UnidadBase; cantidad_base: number };

/**
 * Lleva el precio de un hallazgo a la presentación del producto: precio × cantidad del
 * producto / cantidad del hallazgo, redondeado a la centena si hubo conversión.
 * `null` si las unidades no son la misma (no se puede convertir: nunca se inventa).
 */
export function normalizar(
  precio: number,
  producto: Medida,
  hallazgo: Medida,
): number | null {
  if (
    producto.unidad_base !== hallazgo.unidad_base ||
    hallazgo.cantidad_base <= 0
  )
    return null;
  if (producto.cantidad_base === hallazgo.cantidad_base)
    return Math.round(precio);
  return (
    Math.round(
      (precio * producto.cantidad_base) / hallazgo.cantidad_base / 100,
    ) * 100
  );
}
