import { type Lista, optimoDividido, type Precios } from "@/lib/precios/lista";
import { COMIDAS, type Semana } from "./semanas";

/** Suma por producto todas las comidas de los 7 días más la despensa. */
export function comprasDeSemana(s: Semana): Lista {
  const total: Lista = {};
  const sumar = (c: Record<string, number>) => {
    for (const [id, n] of Object.entries(c)) total[id] = (total[id] ?? 0) + n;
  };
  for (const d of s.dias) for (const c of COMIDAS) sumar(d[c]);
  sumar(s.despensa);
  return total;
}

/** Suma de las compras de todas las semanas; `{}` si el plan no tiene semanas. */
export function comprasDelMes(semanas: Semana[] | undefined): Lista {
  const total: Lista = {};
  for (const s of semanas ?? [])
    for (const [id, n] of Object.entries(comprasDeSemana(s)))
      total[id] = (total[id] ?? 0) + n;
  return total;
}

export type LineaCompra = {
  id: string;
  cantidad: number;
  tienda: string | null;
  /** `null` = sin precio en ninguna tienda: no se estima ni entra al total. */
  costo: number | null;
};

export type CostoCompras = {
  lineas: LineaCompra[];
  total: number;
  sinPrecio: number;
};

/** Cada producto a su precio más barato de hoy (mismo criterio que el óptimo dividido de la lista). */
export function costoDeCompras(
  compras: Lista,
  precios: Precios,
  tiendas: string[],
): CostoCompras {
  const optimo = optimoDividido(compras, precios, tiendas);
  const lineas = Object.entries(compras).map(([id, cantidad]) => {
    const tienda = optimo.tiendaDe[id] ?? null;
    const precio = tienda ? precios[id]?.[tienda] : null;
    return {
      id,
      cantidad,
      tienda,
      costo: precio != null ? precio * cantidad : null,
    };
  });
  return { lineas, total: optimo.total, sinPrecio: optimo.faltantes.length };
}
