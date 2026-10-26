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
