import type { Paso } from "@/lib/tutorial/pasos";

/** El elemento real que explica un paso (`data-tour`); null si esta pantalla no lo tiene. */
export const objetivoDe = (p: Paso) =>
  document.querySelector<HTMLElement>(`[data-tour="${p.objetivo}"]`);

/** Primer paso desde `desde` (hacia `dir`) cuyo objetivo existe; -1 si ninguno. */
export function resolver(pasos: Paso[], desde: number, dir: 1 | -1): number {
  for (let k = desde; k >= 0 && k < pasos.length; k += dir)
    if (objetivoDe(pasos[k])) return k;
  return -1;
}
