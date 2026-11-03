"use client";

import type { Filtro } from "@/lib/importar/decidir";
import type { ModoFila } from "@/lib/importar/tipos";
import { cn } from "@/lib/utils";

const FILTROS: { id: Filtro; texto: string }[] = [
  { id: "todas", texto: "Todas" },
  { id: "crear", texto: "Nuevas" },
  { id: "existente", texto: "Existentes" },
  { id: "solo_gasto", texto: "Solo gasto" },
  { id: "revisar", texto: "Por revisar" },
];

const MASIVAS: { modo: ModoFila; texto: string }[] = [
  { modo: "crear", texto: "Crear producto" },
  { modo: "solo_gasto", texto: "Solo gasto" },
];

const boton =
  "rounded-[10px] border px-3 py-1.5 text-xs font-medium [@media(pointer:coarse)]:min-h-11";

type Props = {
  filtro: Filtro;
  conteos: Record<Filtro, number>;
  seleccionadas: number;
  onFiltro: (f: Filtro) => void;
  onSeleccionarVisibles: () => void;
  onLimpiar: () => void;
  onDecidirSeleccion: (modo: ModoFila) => void;
};

/** Filtros por lo que se hará con cada línea y acciones masivas sobre las filas elegidas. */
export function FiltrosFactura(p: Props) {
  return (
    <div className="flex flex-col gap-2">
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="sr-only">Filtrar las líneas</legend>
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={p.filtro === f.id}
            onClick={() => p.onFiltro(f.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium tabular-nums [@media(pointer:coarse)]:min-h-11",
              p.filtro === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-secondary",
            )}
          >
            {f.texto} ({p.conteos[f.id]})
          </button>
        ))}
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={p.onSeleccionarVisibles}
          className={boton}
        >
          Elegir las {p.conteos[p.filtro]} visibles
        </button>
        {p.seleccionadas > 0 && (
          <>
            <span role="status" className="text-xs tabular-nums">
              {p.seleccionadas} elegidas:
            </span>
            {MASIVAS.map((m) => (
              <button
                key={m.modo}
                type="button"
                onClick={() => p.onDecidirSeleccion(m.modo)}
                className={boton}
              >
                {m.texto}
              </button>
            ))}
            <button
              type="button"
              onClick={p.onLimpiar}
              className="text-xs underline underline-offset-2"
            >
              Quitar elección
            </button>
          </>
        )}
      </div>
    </div>
  );
}
