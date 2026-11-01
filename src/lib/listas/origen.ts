import { type Items, mismosItems } from "./guardadas";

export const CLAVE_ORIGEN = "mercado-medellin:lista-origen";

/** Nombre de la lista guardada de la que salió la lista activa, o `null` si no viene de ninguna. */
export function leerOrigen(): string | null {
  try {
    const v = localStorage.getItem(CLAVE_ORIGEN)?.trim();
    return v ? v : null;
  } catch {
    return null;
  }
}

/** `null` borra el origen. Sin almacenamiento no pasa nada: el origen es solo una ayuda. */
export function guardarOrigen(nombre: string | null) {
  try {
    if (nombre) localStorage.setItem(CLAVE_ORIGEN, nombre);
    else localStorage.removeItem(CLAVE_ORIGEN);
  } catch {
    // modo privado o almacenamiento lleno
  }
}

/** La lista activa ya no es igual a la guardada de la que salió (el orden no cuenta). */
export const cambiado = (activa: Items, guardada: Items) =>
  !mismosItems(activa, guardada);
