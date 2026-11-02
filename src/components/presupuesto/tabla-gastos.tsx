"use client";

import { useState } from "react";
import type { GastoReal } from "@/lib/presupuesto/tipos";
import { type CambiosGasto, FilaGasto } from "./fila-gasto";

type Props = {
  gastos: GastoReal[];
  productos: { id: string; nombre: string; emoji: string | null }[];
  tiendas: { id: string; nombre: string }[];
  rubros: string[];
  /** Devuelve el texto del error, o `null` si se guardó. */
  onEditar: (gasto: GastoReal, cambios: CambiosGasto) => Promise<string | null>;
  onEliminar: (id: string) => void;
};

/** Gastos del mes; cada fila se edita en su lugar (una a la vez). */
export function TablaGastos({
  gastos,
  productos,
  tiendas,
  rubros,
  onEditar,
  onEliminar,
}: Props) {
  const [editando, setEditando] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="tabla-gastos">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="py-1.5 pr-2 font-medium">Fecha</th>
            <th className="px-2 font-medium">Producto</th>
            <th className="px-2 font-medium">Rubro</th>
            <th className="px-2 font-medium">Tienda</th>
            <th className="px-2 text-right font-medium">Monto</th>
            <th className="px-2 font-medium">Detalle</th>
            <th className="pl-2" />
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {gastos.map((g) => (
            <FilaGasto
              key={g.id}
              gasto={g}
              productos={productos}
              tiendas={tiendas}
              rubros={rubros}
              editando={editando === g.id}
              alEditar={() => setEditando(g.id)}
              alCancelar={() => setEditando(null)}
              alGuardar={async (cambios) => {
                const falla = await onEditar(g, cambios);
                if (!falla) setEditando(null);
                return falla;
              }}
              alEliminar={() => onEliminar(g.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
