import { esperadoHastaHoy, proyeccionFinMes } from "@/lib/presupuesto/calculos";
import type { EstadoDesfase, FilaDesfase } from "@/lib/presupuesto/tipos";
import { diasDelMes, diasTranscurridos } from "@/lib/presupuesto/utils";

export function calcularDesfases(
  filas: {
    rubro: string;
    presupuestado: number;
    gastado: number;
  }[],
  hoy: string,
  mes: string,
): FilaDesfase[] {
  const dMes = diasDelMes(mes);
  const dHoy = diasTranscurridos(hoy, mes);
  const resultado: FilaDesfase[] = [];
  for (const f of filas) {
    if (f.presupuestado <= 0 && f.gastado <= 0) continue;
    const esperado = esperadoHastaHoy(f.presupuestado, hoy, mes);
    const proyeccion = proyeccionFinMes(f.gastado, dHoy, dMes);
    const porcentajeUsado =
      f.presupuestado <= 0
        ? 0
        : Math.round((f.gastado / f.presupuestado) * 100);
    let desfasePct = 0;
    if (esperado > 0) {
      desfasePct = Math.round(((f.gastado - esperado) / esperado) * 100);
    } else if (f.gastado > 0) {
      desfasePct = 100;
    }
    let estado: EstadoDesfase = "al_dia";
    if (desfasePct > 10) estado = "desfasado";
    else if (desfasePct < -10) estado = "ahorrando";
    else if (porcentajeUsado > 100) estado = "desfasado";
    else if (porcentajeUsado < 70 && dHoy > 5) estado = "ahorrando";
    resultado.push({
      rubro: f.rubro,
      presupuestado: f.presupuestado,
      gastado: f.gastado,
      esperadoHastaHoy: esperado,
      proyeccion,
      porcentajeUsado,
      desfasePct,
      estado,
    });
  }
  return resultado.sort((a, b) => b.desfasePct - a.desfasePct);
}

export function mensajeDesfase(fila: FilaDesfase): string {
  if (fila.estado === "desfasado") {
    if (fila.proyeccion > fila.presupuestado && fila.presupuestado > 0) {
      const dif = fila.proyeccion - fila.presupuestado;
      return `Vas por encima del ritmo. Proyección: +$${dif.toLocaleString("es-CO")} al fin de mes.`;
    }
    if (fila.desfasePct > 0) {
      return `Desfasado +${fila.desfasePct}% frente al esperado a hoy.`;
    }
    return `Por encima del presupuesto (${fila.porcentajeUsado}%).`;
  }
  if (fila.estado === "ahorrando") {
    if (fila.desfasePct < 0) {
      return `Ahorrando ${Math.abs(fila.desfasePct)}% frente al esperado a hoy.`;
    }
    return `Por debajo del presupuesto (${fila.porcentajeUsado}%).`;
  }
  return "Al día con lo esperado.";
}
