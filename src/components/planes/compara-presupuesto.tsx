"use client";

import { useLista } from "@/components/carrito/use-lista";
import { rubroDe } from "@/data/planes";
import type { ProductoCatalogo } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import { comprasDelMes } from "@/lib/planes/compras";
import { optimoDividido } from "@/lib/precios/lista";
import { usePlan } from "./plan-provider";
import { ValorAnimado } from "./valor-animado";

type Fila = { nombre: string; tope: number; gasto: number };

/** Tu lista (comprando dividido, a precios de hoy) frente a los rubros editables del plan. */
export function ComparaPresupuesto({
  productos,
  tiendas,
}: {
  productos: Pick<ProductoCatalogo, "id" | "grupo" | "precios">[];
  tiendas: string[];
}) {
  const [listaActiva] = useLista();
  const { config } = usePlan();
  // Con semanas planeadas se compara el plan del mes, no la lista del dispositivo.
  // Si las semanas aún están vacías se sigue comparando la lista, que es lo que la persona cargó.
  const mes = comprasDelMes(config.semanas);
  const conSemanas = Object.keys(mes).length > 0;
  const lista = conSemanas ? mes : listaActiva;

  if (!Object.keys(lista).length)
    return (
      <p
        className="rounded-[14px] border border-dashed bg-card p-4 text-sm text-muted-foreground"
        data-testid="sin-lista"
      >
        Tu lista está vacía. Carga el plan de arriba o arma las semanas para
        compararlo con tus rubros.
      </p>
    );

  const precios = Object.fromEntries(productos.map((p) => [p.id, p.precios]));
  const optimo = optimoDividido(lista, precios, tiendas);
  const porRubro = new Map<string, number>();
  for (const p of productos) {
    const tienda = optimo.tiendaDe[p.id];
    const precio = tienda ? p.precios[tienda] : null;
    if (precio != null)
      porRubro.set(
        rubroDe(p),
        (porRubro.get(rubroDe(p)) ?? 0) + precio * (lista[p.id] ?? 0),
      );
  }

  const nombres = [
    ...Object.keys(config.rubros),
    ...[...porRubro.keys()].filter((n) => !(n in config.rubros)),
  ];
  const filas: Fila[] = nombres
    .map((nombre) => ({
      nombre,
      tope: config.rubros[nombre] ?? 0,
      gasto: porRubro.get(nombre) ?? 0,
    }))
    .filter((f) => f.tope > 0 || f.gasto > 0);
  const totalPlan = filas.reduce((t, f) => t + f.tope, 0);
  const totalLista = optimo.total;

  return (
    <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5">
      <div>
        <h2 className="text-lg font-bold">
          {conSemanas ? "Compras del mes" : "Tu lista"} vs. el presupuesto
        </h2>
        <p className="text-xs text-muted-foreground">
          Comprando dividido en las tiendas con mejor precio de hoy.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="compara">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1.5 pr-3 font-medium">Rubro</th>
              <th className="px-3 text-right font-medium">Presupuesto</th>
              <th className="px-3 text-right font-medium">
                {conSemanas ? "Compras" : "Tu lista"}
              </th>
              <th className="pl-3 text-right font-medium">Diferencia</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {filas.map((r) => (
              <tr key={r.nombre} className="border-t">
                <td className="py-1.5 pr-3">
                  {r.nombre}
                  {r.tope === 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      (sin presupuesto)
                    </span>
                  )}
                </td>
                <td className="px-3 text-right">{pesos(r.tope)}</td>
                <td className="px-3 text-right">{pesos(r.gasto)}</td>
                <td
                  className={
                    r.gasto > r.tope
                      ? "pl-3 text-right text-up-ink"
                      : "pl-3 text-right text-save-ink"
                  }
                >
                  {r.gasto > r.tope ? "+" : "−"}
                  {pesos(Math.abs(r.gasto - r.tope))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t font-semibold">
              <td className="py-2 pr-3">Total</td>
              <td className="px-3 py-2 text-right">
                <ValorAnimado valor={totalPlan} />
              </td>
              <td className="px-3 py-2 text-right">
                <ValorAnimado valor={totalLista} />
              </td>
              <td
                className={
                  totalLista > totalPlan
                    ? "pl-3 py-2 text-right text-up-ink"
                    : "pl-3 py-2 text-right text-save-ink"
                }
              >
                {totalLista > totalPlan ? "+" : "−"}
                <ValorAnimado valor={Math.abs(totalLista - totalPlan)} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {optimo.faltantes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Sin precio: {optimo.faltantes.length}{" "}
          {optimo.faltantes.length === 1 ? "producto" : "productos"}.
        </p>
      )}
    </section>
  );
}
