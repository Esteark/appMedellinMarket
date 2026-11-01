import { normalizarNombre } from "@/lib/importar/emparejar";

export type ProductoFusion = { id: string; nombre: string };

/** Claves de `avisos.ts` para los dos motivos por los que una fusión ni se intenta. */
export type ErrorFusion = "fusion_sin_datos" | "fusion_no_permitida";

/** Una fusión necesita dos ids distintos y no vacíos; la base lo vuelve a comprobar. */
export function validarFusion(
  origen: string,
  destino: string,
): { ok: true } | { ok: false; error: ErrorFusion } {
  if (!origen.trim() || !destino.trim())
    return { ok: false, error: "fusion_sin_datos" };
  if (origen === destino) return { ok: false, error: "fusion_no_permitida" };
  return { ok: true };
}

/** Lo que se le muestra a la persona antes de confirmar. */
export function textoFusion(origen: string, destino: string): string {
  return `Todo lo de «${origen}» (precios, historial, gastos, catálogo, alias, listas y planes) pasa a «${destino}», y «${origen}» se borra del catálogo. No se deshace sola.`;
}

const palabras = (nombre: string) =>
  new Set(
    normalizarNombre(nombre)
      .split(" ")
      .filter((p) => p.length >= 3),
  );

/**
 * Sugerencias para fusionar `producto`: primero el mismo nombre normalizado y luego los que
 * más palabras comparten. Son solo sugerencias; el emparejamiento de facturas sigue siendo exacto.
 */
export function candidatosFusion(
  producto: ProductoFusion,
  productos: ProductoFusion[],
  max = 5,
): ProductoFusion[] {
  const norm = normalizarNombre(producto.nombre);
  const propias = palabras(producto.nombre);
  return productos
    .filter((p) => p.id !== producto.id)
    .map((p) => ({
      p,
      igual: normalizarNombre(p.nombre) === norm,
      comunes: [...palabras(p.nombre)].filter((w) => propias.has(w)).length,
    }))
    .filter((c) => c.igual || c.comunes > 0)
    .sort(
      (a, b) =>
        Number(b.igual) - Number(a.igual) ||
        b.comunes - a.comunes ||
        a.p.nombre.localeCompare(b.p.nombre),
    )
    .slice(0, max)
    .map((c) => c.p);
}
