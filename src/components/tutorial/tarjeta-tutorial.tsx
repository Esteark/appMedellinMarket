"use client";

import type { KeyboardEvent, Ref } from "react";
import type { Paso } from "@/lib/tutorial/pasos";
import { MARGEN, type Pos } from "@/lib/tutorial/posicion";

type Props = {
  ref: Ref<HTMLDivElement>;
  pos: Pos | null;
  paso: Paso | null;
  n: number;
  total: number;
  esUltimo: boolean;
  hayAnterior: boolean;
  alAnterior: () => void;
  alSiguiente: () => void;
  alSaltar: () => void;
  alCerrar: () => void;
  alTeclear: (e: KeyboardEvent) => void;
};

/** La tarjeta de texto: título, explicación, «Paso N de M» y los botones del recorrido. */
export function TarjetaTutorial(p: Props) {
  const { pos } = p;
  return (
    <div
      ref={p.ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-titulo"
      data-testid="tutorial"
      tabIndex={-1}
      onKeyDown={p.alTeclear}
      className="fixed z-[72] flex w-[min(320px,calc(100vw-24px))] flex-col gap-2 rounded-[14px] border bg-card p-3.5 text-foreground shadow-[0_12px_32px_rgb(15_23_42/0.25)]"
      style={
        pos?.abajo
          ? {
              left: MARGEN,
              right: MARGEN,
              width: "auto",
              bottom: "calc(12px + env(safe-area-inset-bottom))",
            }
          : {
              left: pos?.left ?? MARGEN,
              top: pos?.top ?? MARGEN,
              opacity: pos ? undefined : 0,
            }
      }
    >
      <div className="flex items-start justify-between gap-2">
        <h2 id="tutorial-titulo" className="text-base font-semibold">
          {p.paso?.titulo}
        </h2>
        <button
          type="button"
          aria-label="Cerrar tutorial"
          onClick={p.alCerrar}
          className="-mt-1 -mr-1 grid size-8 place-items-center rounded-[10px] text-lg text-muted-foreground"
        >
          ×
        </button>
      </div>
      <p className="text-sm">{p.paso?.texto}</p>
      <p
        data-testid="tutorial-contador"
        className="text-xs text-muted-foreground tabular-nums"
      >
        Paso {p.n} de {p.total}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={p.alAnterior}
          disabled={!p.hayAnterior}
          className="rounded-[10px] border bg-background px-3 py-1.5 text-sm font-medium disabled:opacity-35"
        >
          Anterior
        </button>
        <button
          type="button"
          data-siguiente
          onClick={p.alSiguiente}
          className="rounded-[10px] bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
        >
          {p.esUltimo ? "Terminar" : "Siguiente"}
        </button>
        <button
          type="button"
          onClick={p.alSaltar}
          className="ml-auto text-sm font-medium text-muted-foreground underline underline-offset-2"
        >
          Saltar
        </button>
      </div>
    </div>
  );
}
