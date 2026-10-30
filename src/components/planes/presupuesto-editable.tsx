"use client";

import { useState } from "react";
import { CuadrarPresupuesto } from "@/components/presupuesto/cuadrar-presupuesto";
import {
  PRESUPUESTO_SUGERIDO_DIETA,
  PRESUPUESTO_SUGERIDO_HOGAR,
  RUBROS_SUGERIDOS,
} from "@/lib/presupuesto/defaults";
import type { PresupuestoRubro } from "@/lib/presupuesto/tipos";
import { usePlan } from "./plan-provider";

/** Rubros del plan en el orden sugerido; los que agregó la persona van al final. */
function comoLista(rubros: Record<string, number>): PresupuestoRubro[] {
  const orden = (r: string) => {
    const i = (RUBROS_SUGERIDOS as readonly string[]).indexOf(r);
    return i < 0 ? RUBROS_SUGERIDOS.length : i;
  };
  return Object.entries(rubros)
    .sort(([x], [y]) => orden(x) - orden(y))
    .map(([rubro, monto], i) => ({ rubro, monto, orden: i }));
}

export function PresupuestoEditable() {
  const { tipo, config, cambiar } = usePlan();
  const [abierto, setAbierto] = useState(false);
  const rubros = comoLista(config.rubros);

  const guardar = (nuevos: PresupuestoRubro[]) =>
    cambiar({
      rubros: Object.fromEntries(nuevos.map((r) => [r.rubro, r.monto])),
    });

  const sugeridos =
    tipo === "hogar" ? PRESUPUESTO_SUGERIDO_HOGAR : PRESUPUESTO_SUGERIDO_DIETA;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">Presupuesto del plan</h2>
          <p className="text-xs text-muted-foreground">
            Es el plan que quieres gastar; no se mezcla con lo que registras en
            Presupuesto.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="rounded-[10px] border bg-background px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
        >
          Cuadrar presupuesto
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1.5 pr-3 font-medium">Rubro</th>
              <th className="px-3 text-right font-medium">Presupuesto</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rubros
              .filter((r) => r.monto > 0 || rubros.length <= 12)
              .map((r, idx) => (
                <tr
                  key={`${r.rubro}-${r.orden}`}
                  className="border-t transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none"
                  style={{ animationDelay: `${idx * 20}ms` }}
                >
                  <td className="py-1.5 pr-3">{r.rubro}</td>
                  <td className="px-3 text-right">
                    ${r.monto.toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {abierto && (
        <CuadrarPresupuesto
          titulo={`Presupuesto ${tipo === "hogar" ? "del hogar" : "dieta"}`}
          rubrosIniciales={rubros}
          sugeridos={sugeridos}
          alGuardar={guardar}
          alCerrar={() => setAbierto(false)}
        />
      )}
    </>
  );
}
