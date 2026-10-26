/** Fecha de hoy en Bogotá como "AAAA-MM-DD" (en-CA ya formatea así). */
export function hoyBogota(ahora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
  }).format(ahora);
}

/** Días enteros de `desde` a `hasta` (ambos "AAAA-MM-DD"); negativo si `desde` es posterior. */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / 86_400_000);
}

const ZONA = "America/Bogota";

/** "hoy 6:06 a. m.", "ayer 6:06 a. m." o "22 oct 6:06 a. m." para un instante ISO, en Bogotá. */
export function cuando(iso: string, ahora: Date = new Date()): string {
  const instante = new Date(iso);
  const dias = diasEntre(hoyBogota(instante), hoyBogota(ahora));
  const dia =
    dias === 0
      ? "hoy"
      : dias === 1
        ? "ayer"
        : new Intl.DateTimeFormat("es-CO", {
            timeZone: ZONA,
            day: "numeric",
            month: "short",
          }).format(instante);
  const hora = new Intl.DateTimeFormat("es-CO", {
    timeZone: ZONA,
    hour: "numeric",
    minute: "2-digit",
  }).format(instante);
  return `${dia} ${hora}`;
}
