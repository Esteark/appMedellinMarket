import type { Lista } from "./lista";

/**
 * Lista resultante de cargar un plan. `reemplazar` descarta la actual; `sumar` acumula cantidades.
 * Las cantidades fraccionarias suben al entero siguiente y los ids que no están en el catálogo
 * se omiten (nunca se inventa un producto).
 */
export function aplicarPlan(
  actual: Lista,
  items: Record<string, number>,
  modo: "reemplazar" | "sumar",
  catalogo: ReadonlySet<string>,
): Lista {
  const lista: Lista = modo === "sumar" ? { ...actual } : {};
  for (const [id, q] of Object.entries(items)) {
    const cantidad = Math.ceil(q);
    if (!catalogo.has(id) || !(cantidad > 0)) continue;
    lista[id] = (lista[id] ?? 0) + cantidad;
  }
  return lista;
}
