"use client";

import { RUBROS_SUGERIDOS } from "@/lib/presupuesto/defaults";
import type { PresupuestoRubro } from "@/lib/presupuesto/tipos";
import { usePlan } from "./plan-provider";
import { ValorAnimado } from "./valor-animado";

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

const MAX_MONTO = 10_000_000;

export function PresupuestoEditable() {
  const { config, cambiar } = usePlan();
  const rubros = comoLista(config.rubros);
  const total = rubros.reduce((t, r) => t + r.monto, 0);

  const poner = (rubro: string, valor: string) => {
    const n = Number(valor);
    const monto = Number.isFinite(n)
      ? Math.min(MAX_MONTO, Math.max(0, Math.round(n)))
      : 0;
    cambiar({ rubros: { ...config.rubros, [rubro]: monto } });
  };

  return (
    <div className="flex flex-col gap-3" data-testid="presupuesto-editable">
      <div>
        <h2 className="text-lg font-bold">Rubros del plan</h2>
        <p className="text-xs text-muted-foreground">
          Escribe el monto de cada rubro. Es el plan que quieres gastar; los
          gastos reales se registran en Presupuesto.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1.5 pr-3 font-medium">Rubro</th>
              <th className="px-3 text-right font-medium">
                Presupuesto mensual
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rubros.map((r, idx) => (
              <tr
                key={r.rubro}
                className="border-t transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none"
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <td className="py-1.5 pr-3">{r.rubro}</td>
                <td className="px-3 py-1 text-right">
                  <span className="flex items-center justify-end gap-1">
                    <span className="text-muted-foreground">$</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={MAX_MONTO}
                      step={1000}
                      value={r.monto}
                      onChange={(e) => poner(r.rubro, e.target.value)}
                      aria-label={`Presupuesto de ${r.rubro}`}
                      className="w-32 rounded-[10px] border border-input bg-background px-2 py-1 text-right tabular-nums sm:w-40"
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td className="py-2 pr-3 font-semibold">Total del plan</td>
              <td className="px-3 py-2 text-right text-lg font-bold">
                <ValorAnimado valor={total} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
