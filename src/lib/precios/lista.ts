/** Lista de la familia: id de producto → cantidad. */
export type Lista = Record<string, number>;
/** Precio efectivo por producto y tienda; `null` o ausente = sin dato. */
export type Precios = Record<string, Record<string, number | null | undefined>>;

export type TotalTienda = {
  tienda: string;
  total: number;
  faltantes: string[];
};

export function totalesPorTienda(
  lista: Lista,
  precios: Precios,
  tiendas: string[],
): TotalTienda[] {
  return tiendas.map((tienda) => {
    let total = 0;
    const faltantes: string[] = [];
    for (const [id, cantidad] of Object.entries(lista)) {
      const precio = precios[id]?.[tienda];
      if (precio == null) faltantes.push(id);
      else total += precio * cantidad;
    }
    return { tienda, total, faltantes };
  });
}

export type FilaTienda = TotalTienda & { completa: boolean };

/**
 * Todas las tiendas que tienen precio para algo de la lista, para compararlas en un gráfico.
 * Primero las completas (de la más barata); luego las incompletas, con menos faltantes primero.
 * El total de una incompleta es parcial: solo suma lo que sí tiene. Las que no tienen precio
 * para ningún producto de la lista se omiten.
 */
export function compararTiendas(
  lista: Lista,
  precios: Precios,
  tiendas: string[],
): FilaTienda[] {
  const cantidad = Object.keys(lista).length;
  return totalesPorTienda(lista, precios, tiendas)
    .filter((t) => t.faltantes.length < cantidad)
    .map((t) => ({ ...t, completa: t.faltantes.length === 0 }))
    .sort(
      (a, b) =>
        Number(b.completa) - Number(a.completa) ||
        a.faltantes.length - b.faltantes.length ||
        a.total - b.total,
    );
}

/** La más barata entre las tiendas que tienen todos los productos; `null` si ninguna. */
export function mejorTiendaCompleta(
  totales: TotalTienda[],
): TotalTienda | null {
  let mejor: TotalTienda | null = null;
  for (const t of totales) {
    if (t.faltantes.length === 0 && (!mejor || t.total < mejor.total))
      mejor = t;
  }
  return mejor;
}

export type Optimo = {
  total: number;
  /** id de producto → tienda más barata */
  tiendaDe: Record<string, string>;
  /** productos sin precio en ninguna tienda */
  faltantes: string[];
};

/** Cada producto en su tienda más barata. */
export function optimoDividido(
  lista: Lista,
  precios: Precios,
  tiendas: string[],
): Optimo {
  const optimo: Optimo = { total: 0, tiendaDe: {}, faltantes: [] };
  for (const [id, cantidad] of Object.entries(lista)) {
    let mejor: { tienda: string; precio: number } | null = null;
    for (const tienda of tiendas) {
      const precio = precios[id]?.[tienda];
      if (precio != null && (!mejor || precio < mejor.precio))
        mejor = { tienda, precio };
    }
    if (!mejor) optimo.faltantes.push(id);
    else {
      optimo.tiendaDe[id] = mejor.tienda;
      optimo.total += mejor.precio * cantidad;
    }
  }
  return optimo;
}

/** Mejor tienda completa − óptimo dividido; `null` si no hay tienda completa. */
export function ahorro(
  lista: Lista,
  precios: Precios,
  tiendas: string[],
): number | null {
  const mejor = mejorTiendaCompleta(totalesPorTienda(lista, precios, tiendas));
  return mejor
    ? mejor.total - optimoDividido(lista, precios, tiendas).total
    : null;
}
