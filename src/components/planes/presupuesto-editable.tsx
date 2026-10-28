"use client";

import { useEffect, useState } from "react";
import { CuadrarPresupuesto } from "@/components/presupuesto/cuadrar-presupuesto";
import {
  guardarPresupuestoDieta,
  guardarPresupuestoHogar,
  leerPresupuestoDieta,
  leerPresupuestoHogar,
} from "@/lib/presupuesto/almacenamiento";
import {
  PRESUPUESTO_SUGERIDO_DIETA,
  PRESUPUESTO_SUGERIDO_HOGAR,
  RUBROS_SUGERIDOS,
} from "@/lib/presupuesto/defaults";
import type { PresupuestoRubro } from "@/lib/presupuesto/tipos";

type Props = {
  tipo: "hogar" | "dieta";
};

function inicializar(tipo: "hogar" | "dieta"): PresupuestoRubro[] {
  const sugeridos =
    tipo === "hogar" ? PRESUPUESTO_SUGERIDO_HOGAR : PRESUPUESTO_SUGERIDO_DIETA;
  const guardado =
    typeof window !== "undefined"
      ? tipo === "hogar"
        ? leerPresupuestoHogar()
        : leerPresupuestoDieta()
      : null;
  if (guardado && guardado.length > 0) return guardado;
  return RUBROS_SUGERIDOS.map((r, i) => ({
    rubro: r,
    monto: sugeridos[r] ?? 0,
    orden: i,
  }));
}

export function PresupuestoEditable({ tipo }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [rubros, setRubros] = useState<PresupuestoRubro[]>([]);

  useEffect(() => {
    setRubros(inicializar(tipo));
  }, [tipo]);

  const guardar = (nuevos: PresupuestoRubro[]) => {
    setRubros(nuevos);
    if (tipo === "hogar") guardarPresupuestoHogar(nuevos);
    else guardarPresupuestoDieta(nuevos);
  };

  const sugeridos =
    tipo === "hogar" ? PRESUPUESTO_SUGERIDO_HOGAR : PRESUPUESTO_SUGERIDO_DIETA;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Presupuesto</h2>
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="rounded-[10px] border bg-background px-3 py-1.5 text-sm font-medium"
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
              .map((r) => (
                <tr key={`${r.rubro}-${r.orden}`} className="border-t">
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
