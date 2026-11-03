import { pesos } from "@/lib/formato";
import { DIAS_MIN_PROYECCION } from "@/lib/presupuesto/calculos";
import type { ResumenMes } from "@/lib/presupuesto/tipos";

/** Proyección de fin de mes; sin ella («—») mientras haya menos de `DIAS_MIN_PROYECCION` días de datos. */
export function TarjetaProyeccion({ resumen }: { resumen: ResumenMes }) {
  const p = resumen.proyeccionFinMes;
  return (
    <div className="rounded-[12px] border p-2.5">
      <p className="text-xs text-muted-foreground">Proyección fin de mes</p>
      <p className="text-lg font-bold tabular-nums">
        {p === null ? "—" : pesos(p)}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {p === null
          ? `Se calcula desde el día ${DIAS_MIN_PROYECCION} (van ${resumen.diasTranscurridos})`
          : `Gastado ÷ ${resumen.diasTranscurridos} días × ${resumen.diasDelMes} del mes (ritmo actual)`}
      </p>
    </div>
  );
}
