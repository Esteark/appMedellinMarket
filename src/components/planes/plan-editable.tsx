"use client";

import { useState } from "react";
import type { ProductoCatalogo } from "@/lib/datos";
import { PlanExtras } from "./plan-extras";
import { type EstadoGuardado, usePlan } from "./plan-provider";

type Producto = Pick<ProductoCatalogo, "id" | "nombre" | "emoji" | "unidad">;

const TEXTO: Record<EstadoGuardado, string> = {
  cuenta: "Guardado en tu cuenta",
  dispositivo: "Guardado en este dispositivo",
  guardando: "Guardando…",
  sin_guardar: "Sin guardar",
};

const PASO =
  "grid size-9 place-items-center rounded-[10px] border bg-background text-lg disabled:opacity-35";

/** Ítems del plan con stepper, productos propios, nota y «Volver al sugerido», con la banda de guardado. */
export function PlanEditable({ productos }: { productos: Producto[] }) {
  const { tipo, config, estado, cambiar, volverAlSugerido } = usePlan();
  const [confirmando, setConfirmando] = useState(false);
  const [agregar, setAgregar] = useState("");
  const porId = new Map(productos.map((p) => [p.id, p]));
  const libres = productos.filter((p) => !(p.id in config.items));

  const poner = (id: string, q: number) => {
    const items = { ...config.items };
    if (q <= 0) delete items[id];
    else items[id] = Math.min(999, q);
    cambiar({ items });
  };

  return (
    <div className="flex flex-col gap-3" data-testid="plan-editable">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          role="status"
          data-testid="estado-guardado"
          className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
        >
          {TEXTO[estado]}
        </p>
        {confirmando ? (
          <span className="flex items-center gap-1.5 text-sm">
            ¿Volver al plan sugerido?
            <button
              type="button"
              onClick={() => {
                volverAlSugerido();
                setConfirmando(false);
              }}
              className="rounded-[10px] bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground"
            >
              Sí, volver
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-[10px] border px-3 py-1 text-sm font-medium"
            >
              No
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="text-sm font-medium text-muted-foreground underline underline-offset-2"
          >
            Volver al sugerido
          </button>
        )}
      </div>
      <ul
        className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3"
        data-testid={`items-${tipo === "hogar" ? "hogar" : "semana"}`}
      >
        {Object.entries(config.items).map(([id, q]) => {
          const p = porId.get(id);
          return (
            <li key={id} className="flex items-center gap-2">
              <span aria-hidden="true">{p?.emoji ?? "•"}</span>
              <span className="min-w-0 flex-1 truncate">{p?.nombre ?? id}</span>
              <button
                type="button"
                aria-label={`Quitar uno de ${p?.nombre ?? id}`}
                onClick={() => poner(id, q - 1)}
                className={PASO}
              >
                −
              </button>
              <span className="min-w-[2ch] text-center tabular-nums">{q}</span>
              <button
                type="button"
                aria-label={`Agregar uno de ${p?.nombre ?? id}`}
                disabled={q >= 999}
                onClick={() => poner(id, q + 1)}
                className={PASO}
              >
                +
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={agregar}
          onChange={(e) => setAgregar(e.target.value)}
          aria-label="Producto del catálogo para agregar al plan"
          className="h-10 min-w-0 flex-1 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
        >
          <option value="">Agregar producto del catálogo…</option>
          {libres.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!agregar || Object.keys(config.items).length >= 200}
          onClick={() => {
            poner(agregar, 1);
            setAgregar("");
          }}
          className="h-10 rounded-[10px] border bg-background px-3 text-sm font-medium disabled:opacity-35"
        >
          Agregar
        </button>
      </div>
      <PlanExtras />
    </div>
  );
}
