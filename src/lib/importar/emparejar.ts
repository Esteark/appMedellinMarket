export type CatalogoEmparejar = {
  productos: { id: string; nombre: string }[];
  aliasProducto: {
    aliasNorm: string;
    tiendaId: string | null;
    productoId: string;
  }[];
  /** código de barras → id de producto */
  codigos: Record<string, string>;
};

export type TiendaEmparejar = {
  tiendas: { id: string; nombre: string }[];
  /** alias normalizado → id de tienda */
  alias: Record<string, string>;
};

/** Igual que `normalizar_nombre` en SQL: minúsculas, sin tildes ni ñ, espacios colapsados. */
export function normalizarNombre(texto: string): string {
  const de = "áàäâãéèëêíìïîóòöôõúùüûñç";
  const a = "aaaaaeeeeiiiiooooouuuunc";
  let salida = "";
  for (const c of texto.toLowerCase()) {
    const i = de.indexOf(c);
    salida += i >= 0 ? a[i] : c;
  }
  return salida.replace(/\s+/g, " ").trim();
}

/**
 * Misma regla que `emparejar_producto`: código de barras, alias de la tienda, alias global y
 * nombre normalizado, siempre exacto. "Leche 1 L" y "Leche 1.1 L" son productos distintos.
 */
export function emparejarProducto(
  entrada: { producto: string; tiendaId: string | null; codigo?: string },
  catalogo: CatalogoEmparejar,
): string | null {
  const codigo = entrada.codigo?.trim();
  const norm = normalizarNombre(entrada.producto);
  const alias = catalogo.aliasProducto.filter((a) => a.aliasNorm === norm);
  return (
    (codigo ? catalogo.codigos[codigo] : undefined) ??
    (entrada.tiendaId
      ? alias.find((a) => a.tiendaId === entrada.tiendaId)
      : undefined
    )?.productoId ??
    alias.find((a) => a.tiendaId === null)?.productoId ??
    catalogo.productos.find((p) => normalizarNombre(p.nombre) === norm)?.id ??
    null
  );
}

/** Alias de tienda primero, luego nombre normalizado, como `previsualizar_compra`. */
export function emparejarTienda(
  nombre: string,
  c: TiendaEmparejar,
): string | null {
  const norm = normalizarNombre(nombre);
  return (
    c.alias[norm] ??
    c.tiendas.find((t) => normalizarNombre(t.nombre) === norm)?.id ??
    null
  );
}
