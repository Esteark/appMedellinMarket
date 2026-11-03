import { pesos } from "@/lib/formato";
import type { PresupuestoRubro } from "@/lib/presupuesto/tipos";

/** Cuántos meses hacia atrás se busca un presupuesto para heredar. */
export const MESES_ATRAS = 12;

/** De dónde salen los montos que se muestran: el mes ya los tiene, se copiaron de un mes anterior o son los de antes. */
export type OrigenPresupuesto = "mes" | "heredado" | "inicial";

export type CambioPresupuesto = {
  rubro: string;
  monto_anterior: number | null;
  monto_nuevo: number | null;
};

/** `2026-01` → `2025-12`. */
export function mesAnterior(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, "0")}`;
}

/**
 * Los montos de un mes: los suyos si ya los tiene; si no, los del mes anterior más reciente que tenga (hasta
 * `MESES_ATRAS` meses atrás); si no hay ninguno, `inicial` (lo que había en el dispositivo o los rubros sugeridos).
 * No muta lo que recibe.
 */
export function presupuestoDelMes(p: {
  mes: string;
  delMes: PresupuestoRubro[] | null | undefined;
  anteriores: Record<string, PresupuestoRubro[] | null | undefined>;
  inicial: PresupuestoRubro[];
}): { rubros: PresupuestoRubro[]; origen: OrigenPresupuesto; desde?: string } {
  const copia = (r: PresupuestoRubro[]) => r.map((x) => ({ ...x }));
  if (p.delMes?.length) return { rubros: copia(p.delMes), origen: "mes" };
  let m = p.mes;
  for (let i = 0; i < MESES_ATRAS; i++) {
    m = mesAnterior(m);
    const r = p.anteriores[m];
    if (r?.length) return { rubros: copia(r), origen: "heredado", desde: m };
  }
  return { rubros: copia(p.inicial), origen: "inicial" };
}

/** «Carnes: $500.000 → $600.000», «Carnes: nuevo $600.000» o «Carnes: quitado ($600.000)». */
export function describirCambio(
  c: CambioPresupuesto,
  formato: (n: number) => string = pesos,
): string {
  if (c.monto_anterior === null && c.monto_nuevo !== null)
    return `${c.rubro}: nuevo ${formato(c.monto_nuevo)}`;
  if (c.monto_nuevo === null)
    return `${c.rubro}: quitado (${formato(c.monto_anterior ?? 0)})`;
  return `${c.rubro}: ${formato(c.monto_anterior ?? 0)} → ${formato(c.monto_nuevo)}`;
}
