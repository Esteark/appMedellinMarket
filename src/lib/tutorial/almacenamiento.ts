// Progreso del tutorial en este dispositivo. No toca Supabase. Todo en try/catch: sin almacenamiento
// (modo privado) el tutorial no se abre solo, pero la bombilla sigue funcionando.

export const CLAVE_TUTORIAL = "mercado-medellin:tutorial:v1";

export type Progreso = {
  version: 1;
  general: boolean;
  /** Claves de pantalla ya vistas (ver `claveDeRuta`). */
  pantallas: string[];
};

const VACIO: Progreso = { version: 1, general: false, pantallas: [] };

/** JSON corrupto, de otra versión o sin clave → «no visto». */
export function leerProgreso(): Progreso {
  try {
    const crudo = localStorage.getItem(CLAVE_TUTORIAL);
    if (!crudo) return VACIO;
    const p = JSON.parse(crudo) as Partial<Progreso> | null;
    if (!p || p.version !== 1 || !Array.isArray(p.pantallas)) return VACIO;
    return {
      version: 1,
      general: p.general === true,
      pantallas: p.pantallas.filter((x): x is string => typeof x === "string"),
    };
  } catch {
    return VACIO;
  }
}

/** Idempotente. `"general"` o la clave de una pantalla. */
export function marcarVisto(que: "general" | (string & {})): void {
  const p = leerProgreso();
  const siguiente: Progreso =
    que === "general"
      ? { ...p, general: true }
      : { ...p, pantallas: [...new Set([...p.pantallas, que])] };
  try {
    localStorage.setItem(CLAVE_TUTORIAL, JSON.stringify(siguiente));
  } catch {
    // ignorar
  }
}

export function reiniciar(): void {
  try {
    localStorage.removeItem(CLAVE_TUTORIAL);
  } catch {
    // ignorar
  }
}

/** Sin almacenamiento no se abre solo: no habría cómo recordar que ya se vio. */
export function almacenamientoDisponible(): boolean {
  try {
    localStorage.setItem(`${CLAVE_TUTORIAL}:prueba`, "1");
    localStorage.removeItem(`${CLAVE_TUTORIAL}:prueba`);
    return true;
  } catch {
    return false;
  }
}
