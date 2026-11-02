"use client";

import { useState } from "react";
import type { ProductoCatalogo } from "@/lib/datos";
import type { Cantidades } from "@/lib/planes/semanas";

export type ProductoPlan = Pick<ProductoCatalogo, "id" | "nombre" | "emoji">;

const PASO =
  "grid size-9 place-items-center rounded-[10px] border bg-background text-lg disabled:opacity-35";

/** Productos y cantidades de una comida (o de la despensa), con stepper y selector del catálogo. */
export function ListaComida({
  nombre,
  cantidades,
  productos,
  max,
  onChange,
}: {
  nombre: string;
  cantidades: Cantidades;
  productos: ProductoPlan[];
  max: number;
  onChange: (c: Cantidades) => void;
}) {
  const [agregar, setAgregar] = useState("");
  const porId = new Map(productos.map((p) => [p.id, p]));
  const libres = productos.filter((p) => !(p.id in cantidades));
  const lleno = Object.keys(cantidades).length >= max;

  const poner = (id: string, q: number) => {
    const nueva = { ...cantidades };
    if (q <= 0) delete nueva[id];
    else nueva[id] = Math.min(999, q);
    onChange(nueva);
  };

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5 text-sm">
        {Object.entries(cantidades).map(([id, q]) => {
          const p = porId.get(id);
          return (
            <li key={id} className="flex items-center gap-2">
              <span aria-hidden="true">{p?.emoji ?? "•"}</span>
              <span className="min-w-0 flex-1 truncate">{p?.nombre ?? id}</span>
              <button
                type="button"
                aria-label={`Quitar uno de ${p?.nombre ?? id} en ${nombre}`}
                onClick={() => poner(id, q - 1)}
                className={PASO}
              >
                −
              </button>
              <span className="min-w-[2ch] text-center tabular-nums">{q}</span>
              <button
                type="button"
                aria-label={`Agregar uno de ${p?.nombre ?? id} en ${nombre}`}
                disabled={q >= 999}
                onClick={() => poner(id, q + 1)}
                className={PASO}
              >
                +
              </button>
            </li>
          );
        })}
        {Object.keys(cantidades).length === 0 && (
          <li className="text-xs text-muted-foreground">Sin productos.</li>
        )}
      </ul>
      <div className="flex gap-1.5">
        <select
          value={agregar}
          onChange={(e) => setAgregar(e.target.value)}
          aria-label={`Producto para agregar a ${nombre}`}
          className="h-10 min-w-0 flex-1 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
        >
          <option value="">Agregar producto…</option>
          {libres.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!agregar || lleno}
          aria-label={`Agregar a ${nombre}`}
          onClick={() => {
            poner(agregar, 1);
            setAgregar("");
          }}
          className="h-10 rounded-[10px] border bg-background px-3 text-sm font-medium disabled:opacity-35"
        >
          Agregar
        </button>
      </div>
      {lleno && (
        <p className="text-xs text-muted-foreground">
          Máximo {max} productos en {nombre}.
        </p>
      )}
    </div>
  );
}
