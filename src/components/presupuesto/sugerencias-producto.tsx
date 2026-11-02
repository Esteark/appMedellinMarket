"use client";

import type { ProductoCatalogo } from "@/lib/datos";

/** Productos del catálogo que coinciden con lo que se escribe en «Agregar gasto». */
export function SugerenciasProducto({
  productos,
  onElegir,
}: {
  productos: ProductoCatalogo[];
  onElegir: (p: ProductoCatalogo) => void;
}) {
  return (
    <div className="sm:col-span-2 -mt-1 flex max-h-40 flex-col overflow-auto rounded-[10px] border">
      {productos.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onElegir(p)}
          className="flex items-center justify-between px-2 py-1.5 text-left text-sm hover:bg-muted"
        >
          <span>
            {p.nombre}{" "}
            <span className="text-muted-foreground">· {p.grupo}</span>
          </span>
          <span className="text-xs text-muted-foreground">{p.unidad}</span>
        </button>
      ))}
      {productos.length === 0 && (
        <p className="px-2 py-1.5 text-xs text-muted-foreground">
          Sin resultados. Puedes usar "Agregar producto nuevo".
        </p>
      )}
    </div>
  );
}
