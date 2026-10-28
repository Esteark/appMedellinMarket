"use client";

import { useState } from "react";
import { Hoja } from "@/components/hoja";
import { avisar } from "@/lib/avisos";
import { pesos } from "@/lib/formato";
import { RUBROS_SUGERIDOS } from "@/lib/presupuesto/defaults";
import type { PresupuestoRubro } from "@/lib/presupuesto/tipos";

type Props = {
  titulo: string;
  rubrosIniciales: PresupuestoRubro[];
  sugeridos: Record<string, number>;
  alGuardar: (rubros: PresupuestoRubro[]) => void;
  alCerrar: () => void;
};

export function CuadrarPresupuesto({
  titulo,
  rubrosIniciales,
  sugeridos,
  alGuardar,
  alCerrar,
}: Props) {
  const [rubros, setRubros] = useState<PresupuestoRubro[]>(
    rubrosIniciales.length > 0
      ? [...rubrosIniciales].sort((a, b) => a.orden - b.orden)
      : RUBROS_SUGERIDOS.map((r, i) => ({
          rubro: r,
          monto: sugeridos[r] ?? 0,
          orden: i,
        })),
  );

  const total = rubros.reduce((s, r) => s + (Number(r.monto) || 0), 0);

  const actualizar = (idx: number, monto: number) => {
    setRubros((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, monto: Math.max(0, monto) } : r)),
    );
  };

  const agregarRubro = () => {
    setRubros((prev) => [
      ...prev,
      { rubro: "Otros", monto: 0, orden: prev.length },
    ]);
  };

  const cambiarNombre = (idx: number, rubro: string) => {
    setRubros((prev) => prev.map((r, i) => (i === idx ? { ...r, rubro } : r)));
  };

  const guardar = () => {
    const normalizados = rubros
      .filter((r) => r.rubro.trim().length > 0)
      .map((r, i) => ({
        ...r,
        monto: Math.max(0, Number(r.monto) || 0),
        orden: i,
      }));
    alGuardar(normalizados);
    avisar("presupuesto_guardado");
    alCerrar();
  };

  const restaurar = () => {
    setRubros(
      RUBROS_SUGERIDOS.map((r, i) => ({
        rubro: r,
        monto: sugeridos[r] ?? 0,
        orden: i,
      })),
    );
    avisar("presupuesto_restaurado");
  };

  return (
    <Hoja titulo={`presupuesto-${titulo}`} alCerrar={alCerrar}>
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-bold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">
            Ajusta el presupuesto por rubro. Se guarda en este dispositivo.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1.5 pr-2 font-medium">Rubro</th>
                <th className="px-2 text-right font-medium">Monto ($)</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rubros.map((r, idx) => (
                <tr key={`${r.rubro}-${r.orden}`} className="border-t">
                  <td className="py-1.5 pr-2">
                    <input
                      className="w-full rounded-[10px] border bg-background px-2 py-1"
                      value={r.rubro}
                      onChange={(e) => cambiarNombre(idx, e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      className="w-32 rounded-[10px] border bg-background px-2 py-1 text-right"
                      value={r.monto}
                      onChange={(e) => actualizar(idx, Number(e.target.value))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t">
                <td className="py-1.5 pr-2 font-semibold">Total</td>
                <td className="px-2 py-1.5 text-right font-semibold">
                  {pesos(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={agregarRubro}
            className="rounded-[10px] border px-3 py-1.5 text-sm"
          >
            Agregar rubro
          </button>
          <button
            type="button"
            onClick={restaurar}
            className="rounded-[10px] border px-3 py-1.5 text-sm"
          >
            Restaurar sugerido
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-[10px] border px-3 py-1.5 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            className="rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          >
            Guardar
          </button>
        </div>
      </div>
    </Hoja>
  );
}
