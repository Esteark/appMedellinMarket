"use client";

import { useState } from "react";
import type { FilaBarrio } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Props = {
  fila: FilaBarrio;
  alCorregir: () => void;
  alQuitar: () => void;
};

/** Un producto del catálogo de barrio: precio anotado (o «sin dato»), fecha, ✎ y «Quitar» con confirmación en línea. */
export function FilaBarrioItem({ fila: f, alCorregir, alQuitar }: Props) {
  const [confirmando, setConfirmando] = useState(false);
  return (
    <li
      data-testid={`barrio-${f.id}`}
      data-estado={
        f.precio == null ? "sin_dato" : f.porActualizar ? "actualizar" : "ok"
      }
      className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm"
    >
      <span aria-hidden="true">{f.emoji ?? "•"}</span>
      <span className="min-w-0 flex-1">
        <span className="font-medium">{f.nombre}</span>
        <span className="ml-1.5 text-xs text-muted-foreground">{f.unidad}</span>
      </span>
      {f.precio == null ? (
        <span className="text-muted-foreground" data-testid="barrio-precio">
          sin dato
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span
            data-testid="barrio-precio"
            className="font-semibold text-anot-ink tabular-nums"
          >
            {pesos(f.precio)}
          </span>
          <span
            className={cn(
              "text-xs tabular-nums",
              f.porActualizar
                ? "font-medium text-warn-ink"
                : "text-muted-foreground",
            )}
          >
            {f.fecha}
            {f.porActualizar && " · actualizar"}
          </span>
        </span>
      )}
      <button
        type="button"
        aria-label={`Anotar precio de ${f.nombre}`}
        onClick={alCorregir}
        className="grid size-9 place-items-center rounded-[10px] border bg-background"
      >
        ✎
      </button>
      {confirmando ? (
        <span className="flex items-center gap-1.5 text-xs">
          ¿Quitar? Sus precios se conservan.
          <button
            type="button"
            onClick={() => {
              setConfirmando(false);
              alQuitar();
            }}
            className="font-semibold text-up-ink"
          >
            Sí, quitar
          </button>
          <button type="button" onClick={() => setConfirmando(false)}>
            No
          </button>
        </span>
      ) : (
        <button
          type="button"
          aria-label={`Quitar ${f.nombre} del catálogo`}
          onClick={() => setConfirmando(true)}
          className="text-xs font-medium text-muted-foreground underline underline-offset-2"
        >
          Quitar
        </button>
      )}
    </li>
  );
}
