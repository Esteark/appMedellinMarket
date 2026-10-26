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
