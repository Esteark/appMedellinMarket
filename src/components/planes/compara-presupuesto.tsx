"use client";

import { useLista } from "@/components/carrito/use-lista";
import { ESC, RUBROS, rubroDe } from "@/data/planes";
import type { ProductoCatalogo } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import { optimoDividido } from "@/lib/precios/lista";

/** Tu lista (comprando dividido, a precios de hoy) frente al presupuesto mensual del hogar. */
export function ComparaPresupuesto({
  productos,
  tiendas,
}: {
  productos: Pick<ProductoCatalogo, "id" | "grupo" | "precios">[];
  tiendas: string[];
}) {
  const [lista] = useLista();
  if (!Object.keys(lista).length)
    return (
      <p className="text-sm text-muted-foreground" data-testid="sin-lista">
        Tu lista está vacía: agrégale productos o carga el plan de abajo para
        compararla con el presupuesto.
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
  const presupuesto = RUBROS.map(([nombre, tope]) => ({
    nombre,
    tope,
    gasto: porRubro.get(nombre) ?? 0,
  }));
  const fuera = [...porRubro].filter(([n]) => !RUBROS.some(([r]) => r === n));

  return (
    <div className="flex flex-col gap-3" data-testid="compara">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1.5 pr-3 font-medium">Rubro</th>
              <th className="px-3 text-right font-medium">Presupuesto</th>
              <th className="px-3 text-right font-medium">Tu lista</th>
              <th className="pl-3 text-right font-medium">Diferencia</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {presupuesto.map((r) => (
              <tr key={r.nombre} className="border-t">
                <td className="py-1.5 pr-3">{r.nombre}</td>
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
            {fuera.map(([nombre, gasto]) => (
              <tr key={nombre} className="border-t">
                <td className="py-1.5 pr-3">{nombre} (sin presupuesto)</td>
                <td className="px-3 text-right">—</td>
                <td className="px-3 text-right">{pesos(gasto)}</td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        Total de tu lista dividida: <b>{pesos(optimo.total)}</b>
        {optimo.faltantes.length > 0 && (
          <span className="text-muted-foreground">
            {" "}
            (sin precio: {optimo.faltantes.length} productos)
          </span>
        )}
      </p>
      <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
        {Object.values(ESC).map((e) => (
          <li key={e.n}>
            {e.n}: {pesos(e.t)} al mes
          </li>
        ))}
      </ul>
    </div>
  );
}
