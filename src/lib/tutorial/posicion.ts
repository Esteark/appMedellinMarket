// Dónde va la tarjeta del tutorial respecto del objetivo. Puro: recibe medidas, no toca el DOM.

export const MARGEN = 12;
export const RELLENO = 6;
const ANCHO_MOVIL = 640;

export type Caja = { left: number; top: number; right: number; bottom: number };
export type Pos = {
  left: number;
  top: number;
  /** Desde dónde entra la tarjeta (px): el lado más cercano al objetivo. */
  dx: number;
  dy: number;
  /** En móvil (o sin espacio) la tarjeta va fija abajo. */
  abajo: boolean;
};

const ABAJO: Pos = { left: MARGEN, top: 0, dx: 0, dy: 24, abajo: true };

/** Debajo, arriba, a la derecha o a la izquierda según el espacio; nunca tapa el objetivo. */
export function colocar(
  r: Caja,
  ancho: number,
  alto: number,
  W: number,
  H: number,
): Pos {
  if (W < ANCHO_MOVIL) return ABAJO;
  const izq = Math.min(Math.max(r.left, MARGEN), W - ancho - MARGEN);
  const lado = Math.max(MARGEN, Math.min(r.top, H - alto - MARGEN));
  if (r.bottom + MARGEN + alto <= H - MARGEN)
    return {
      left: izq,
      top: r.bottom + RELLENO + MARGEN,
      dx: 0,
      dy: 8,
      abajo: false,
    };
  if (r.top - MARGEN - alto >= MARGEN)
    return {
      left: izq,
      top: r.top - RELLENO - MARGEN - alto,
      dx: 0,
      dy: -8,
      abajo: false,
    };
  if (r.right + MARGEN + ancho <= W - MARGEN)
    return {
      left: r.right + RELLENO + MARGEN,
      top: lado,
      dx: 8,
      dy: 0,
      abajo: false,
    };
  if (r.left - MARGEN - ancho >= MARGEN)
    return {
      left: r.left - RELLENO - MARGEN - ancho,
      top: lado,
      dx: -8,
      dy: 0,
      abajo: false,
    };
  return ABAJO;
}
