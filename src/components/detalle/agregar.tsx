"use client";

import { useRef } from "react";
import { useLista } from "@/components/carrito/use-lista";
import { volar } from "@/lib/animaciones";

/** "Agregar a mi lista" desde la hoja: misma lista que el catálogo (el emoji vuela al carrito). */
export function Agregar({ id, emoji }: { id: string; emoji: string }) {
  const [lista, cambiar] = useLista();
  const origen = useRef<HTMLSpanElement>(null);
  const cantidad = lista[id] ?? 0;
  return (
    <button
      type="button"
      onClick={() => {
        cambiar(id, 1);
        const carrito = document.querySelector("[data-carrito-icono]");
        if (origen.current && carrito) volar(origen.current, carrito);
      }}
      className="flex items-center justify-center gap-2 rounded-xl bg-primary p-3 font-semibold text-primary-foreground"
    >
      <span ref={origen} aria-hidden="true">
        {emoji}
      </span>
      Agregar a mi lista
      {cantidad > 0 && <span className="tabular-nums">({cantidad})</span>}
    </button>
  );
}
