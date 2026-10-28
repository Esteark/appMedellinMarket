import type {
  Aprendizaje,
  FilaDesfase,
  ResumenMes,
} from "@/lib/presupuesto/tipos";

export function generarAprendizajes(
  resumen: ResumenMes,
  desfases: FilaDesfase[],
): Aprendizaje[] {
  const aprendizajes: Aprendizaje[] = [];
  if (resumen.presupuestado <= 0) return aprendizajes;
  if (resumen.porcentajeUsado < 60 && resumen.diasTranscurridos > 10) {
    aprendizajes.push({
      tipo: "logro",
      titulo: "Vas con buen control",
      descripcion: `Llevas el ${resumen.porcentajeUsado}% del presupuesto con ${resumen.diasTranscurridos} días transcurridos.`,
    });
  }
  if (resumen.proyeccionFinMes > resumen.presupuestado) {
    const dif = resumen.proyeccionFinMes - resumen.presupuestado;
    aprendizajes.push({
      tipo: "situacion",
      titulo: "Proyección por encima del presupuesto",
      descripcion: `Si mantienes el ritmo actual, terminarías el mes ~$${dif.toLocaleString("es-CO")} por encima.`,
    });
  } else if (
    resumen.proyeccionFinMes < resumen.presupuestado &&
    resumen.diasTranscurridos > 5
  ) {
    const dif = resumen.presupuestado - resumen.proyeccionFinMes;
    aprendizajes.push({
      tipo: "logro",
      titulo: "Proyección por debajo del presupuesto",
      descripcion: `Si mantienes el ritmo actual, terminarías ~$${dif.toLocaleString("es-CO")} por debajo.`,
    });
  }
  const desfasados = desfases
    .filter((d) => d.estado === "desfasado" && d.presupuestado > 0)
    .sort((a, b) => b.desfasePct - a.desfasePct)
    .slice(0, 2);
  for (const d of desfasados) {
    aprendizajes.push({
      tipo: "oportunidad",
      titulo: `${d.rubro} va desfasado`,
      descripcion: `Llevas el ${d.porcentajeUsado}% presupuestado y vas ${d.desfasePct > 0 ? `+${d.desfasePct}%` : d.desfasePct}% frente al esperado a hoy.`,
    });
  }
  const ahorrando = desfases
    .filter((d) => d.estado === "ahorrando" && d.porcentajeUsado > 0)
    .slice(0, 1);
  for (const a of ahorrando) {
    aprendizajes.push({
      tipo: "logro",
      titulo: `Buen ritmo en ${a.rubro}`,
      descripcion: `Vas por debajo del ritmo esperado (${Math.abs(a.desfasePct)}% menos).`,
    });
  }
  if (resumen.diasTranscurridos >= 15 && resumen.porcentajeUsado < 40) {
    aprendizajes.push({
      tipo: "aprendizaje",
      titulo: "Revisa tus gastos recientes",
      descripcion:
        "Llevas pocos gastos anotados. Anota lo que compres para tener un seguimiento más real.",
    });
  }
  return aprendizajes;
}
