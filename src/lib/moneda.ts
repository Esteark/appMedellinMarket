/** Tope de cualquier campo de dinero (coincide con el monto máximo de un gasto). */
export const MAX_MONEDA = 50_000_000;

/** Solo dígitos, sin ceros a la izquierda; una coma decimal corta lo que sigue (los pesos son enteros). */
export function soloDigitos(texto: string): string {
  const entera = texto.split(",")[0];
  return entera.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

/** Entero de lo escrito, limitado a `MAX_MONEDA`; `null` si no hay ningún dígito. */
export function aNumero(texto: string): number | null {
  const d = soloDigitos(texto);
  if (!d) return null;
  return Math.min(Number(d), MAX_MONEDA);
}

/** Agrupa una cadena de dígitos con punto, como el peso colombiano: "3000" → "3.000". */
export function conMiles(digitos: string): string {
  return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Dónde queda el cursor tras dar formato: después del mismo dígito que tenía a su izquierda.
 * `anterior` es el texto del campo justo después de teclear (con su cursor) y `nuevo` el ya formateado.
 */
export function posicionTrasFormato(
  anterior: string,
  cursor: number,
  nuevo: string,
): number {
  const aLaIzquierda = anterior.slice(0, cursor).replace(/\D/g, "").length;
  if (aLaIzquierda === 0) return 0;
  let vistos = 0;
  for (let i = 0; i < nuevo.length; i++) {
    if (/\d/.test(nuevo[i])) vistos++;
    if (vistos === aLaIzquierda) return i + 1;
  }
  return nuevo.length;
}
