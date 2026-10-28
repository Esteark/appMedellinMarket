import type {
  GastoReal,
  PresupuestoRubro,
  ResumenMes,
} from "@/lib/presupuesto/tipos";
import { diasDelMes, diasTranscurridos } from "@/lib/presupuesto/utils";

export function acumuladoPorRubro(gastos: GastoReal[], mes: string) {
  const mapa = new Map<string, number>();
  for (const g of gastos) {
    if (g.mes !== mes) continue;
    mapa.set(g.rubro, (mapa.get(g.rubro) ?? 0) + g.monto);
  }
  return mapa;
}

export function porcentajeUsado(
  gastado: number,
  presupuestado: number,
): number {
  if (presupuestado <= 0) return 0;
  return Math.round((gastado / presupuestado) * 100);
}

export function restante(gastado: number, presupuestado: number): number {
  return Math.max(0, presupuestado - gastado);
}

export function esperadoHastaHoy(
  presupuestado: number,
  hoy: string,
  mes: string,
): number {
  if (presupuestado <= 0) return 0;
  const dMes = diasDelMes(mes);
  const dHoy = diasTranscurridos(hoy, mes);
  if (dHoy <= 0) return 0;
  return Math.round((presupuestado / dMes) * dHoy);
}

export function proyeccionFinMes(
  gastado: number,
  diasTranscurridosCount: number,
  diasMes: number,
): number {
  if (diasTranscurridosCount <= 0) return 0;
  return Math.round((gastado / diasTranscurridosCount) * diasMes);
}

export function compararPresupuestadoVsGastado(
  presupuestos: PresupuestoRubro[],
  gastos: GastoReal[],
  hoy: string,
  mes: string,
): { resumen: ResumenMes; porRubro: Map<string, number> } {
  const porRubro = acumuladoPorRubro(gastos, mes);
  let presupuestado = 0;
  for (const p of presupuestos) {
    if (!p.monto || p.monto <= 0) continue;
    presupuestado += p.monto;
  }
  let gastado = 0;
  for (const v of porRubro.values()) gastado += v;
  const dMes = diasDelMes(mes);
  const dHoy = diasTranscurridos(hoy, mes);
  const porcentaje = porcentajeUsado(gastado, presupuestado);
  const proyeccion = proyeccionFinMes(gastado, dHoy, dMes);
  const resumen: ResumenMes = {
    mes,
    presupuestado,
    gastado,
    restante: restante(gastado, presupuestado),
    porcentajeUsado: porcentaje,
    proyeccionFinMes: proyeccion,
    diasTranscurridos: dHoy,
    diasDelMes: dMes,
  };
  return { resumen, porRubro };
}
