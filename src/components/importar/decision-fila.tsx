"use client";

import { useMemo, useState } from "react";
import { EmojiSelector } from "@/components/emoji-selector";
import { SelectorProducto } from "@/components/selector-producto";
import { GRUPOS_DE_PRODUCTO } from "@/data/grupos";
import type { ProductoCatalogo } from "@/lib/datos";
import type { ProductoElegido } from "@/lib/importar/decidir";
import { sugerirExistente } from "@/lib/importar/sugerir";
import type { FilaRevision, ModoFila } from "@/lib/importar/tipos";
import { grupoARubro } from "@/lib/presupuesto/rubros";
import { cn } from "@/lib/utils";

const OPCIONES: { modo: ModoFila; texto: string }[] = [
  { modo: "crear", texto: "Crear producto" },
  { modo: "existente", texto: "Ya existe" },
  { modo: "solo_gasto", texto: "Solo gasto" },
];

type Props = {
  f: FilaRevision;
  productos: ProductoCatalogo[];
  onDecidir: (modo: ModoFila, producto?: ProductoElegido) => void;
  onFila: (parche: Partial<FilaRevision>) => void;
};

const elegido = (p: ProductoCatalogo): ProductoElegido => ({
  id: p.id,
  grupo: p.grupo,
  unidad: p.unidad,
});

/** Qué se hace con la línea: crear el producto, usar uno que ya existe o solo registrar el gasto. */
export function DecisionFila({ f, productos, onDecidir, onFila }: Props) {
  const [buscando, setBuscando] = useState(false);
  const sugeridos = useMemo(
    () => (f.modo === "crear" ? sugerirExistente(f.producto, productos) : []),
    [f.modo, f.producto, productos],
  );
  const grupos = GRUPOS_DE_PRODUCTO.includes(f.grupo)
    ? GRUPOS_DE_PRODUCTO
    : [...GRUPOS_DE_PRODUCTO, f.grupo];

  return (
    <div className="flex flex-col gap-2 sm:col-span-6">
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="sr-only">Qué hacer con la línea {f.linea}</legend>
        {OPCIONES.map((o) => (
          <button
            key={o.modo}
            type="button"
            aria-pressed={f.modo === o.modo}
            onClick={() =>
              o.modo === "existente" && f.modo !== "existente"
                ? setBuscando(true)
                : onDecidir(o.modo)
            }
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium [@media(pointer:coarse)]:min-h-11",
              f.modo === o.modo
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-secondary",
            )}
          >
            {o.texto}
          </button>
        ))}
      </fieldset>
      {sugeridos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sugeridos.map((s) => {
            const p = productos.find((x) => x.id === s.id);
            return (
              p && (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onDecidir("existente", elegido(p))}
                  className="rounded-full border border-anot bg-anot-bg px-3 py-1 text-xs text-anot-ink [@media(pointer:coarse)]:min-h-11"
                >
                  ¿Será {p.emoji} {p.nombre}?
                </button>
              )
            );
          })}
        </div>
      )}
      {(f.modo === "existente" || buscando) && (
        <label
          htmlFor={`prod-${f.linea}`}
          className="text-xs text-muted-foreground"
        >
          Producto del catálogo
          <SelectorProducto
            id={`prod-${f.linea}`}
            valor={f.productoId ?? ""}
            productos={productos}
            textoVacio="Elige un producto"
            onChange={(id) => {
              const p = productos.find((x) => x.id === id);
              if (!p) return;
              setBuscando(false);
              onDecidir("existente", elegido(p));
            }}
          />
        </label>
      )}
      {f.modo === "crear" && (
        <div className="flex flex-wrap items-end gap-3">
          <EmojiSelector
            valor={f.emoji ?? ""}
            onChange={(e) => onFila({ emoji: e || null })}
          />
          <label className="text-xs text-muted-foreground">
            Grupo
            <select
              aria-label="Grupo del producto"
              className="block rounded-[10px] border bg-card px-2 py-1.5 text-sm"
              value={f.grupo}
              onChange={(e) =>
                onFila({
                  grupo: e.target.value,
                  rubro: grupoARubro(e.target.value),
                })
              }
            >
              {grupos.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
