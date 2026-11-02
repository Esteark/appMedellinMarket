"use client";

import { useState } from "react";
import { pesos } from "@/lib/formato";
import { MAX_GUARDADOS } from "@/lib/planes/guardados";
import { usePlan } from "./plan-provider";

const total = (rubros: Record<string, number>) =>
  Object.values(rubros).reduce((t, v) => t + v, 0);

/**
 * Copias con nombre del presupuesto. Sin sesión viven en el dispositivo; con
 * sesión también en la cuenta. Cargar una la vuelve el plan activo.
 */
export function MisPresupuestos() {
  const { guardados, guardarComo, cargarGuardado, eliminarGuardado } =
    usePlan();
  const [nombre, setNombre] = useState("");
  const [elegido, setElegido] = useState("");

  const seleccion = guardados.some((g) => g.nombre === elegido)
    ? elegido
    : (guardados[0]?.nombre ?? "");

  return (
    <details className="rounded-[14px] border bg-card p-3.5">
      <summary className="cursor-pointer text-sm font-semibold">
        Mis presupuestos guardados ({guardados.length})
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Guarda copias con nombre para comparar escenarios. Con sesión quedan
          en tu cuenta; sin sesión, en este dispositivo.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!nombre.trim()) return;
            guardarComo(nombre);
            setNombre("");
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
            Guardar el presupuesto actual como
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={60}
              placeholder="Ej. Octubre, quincena, con visitas…"
              className="h-10 min-w-0 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={!nombre.trim()}
            className="h-10 rounded-[10px] border bg-background px-3 text-sm font-medium disabled:opacity-35"
          >
            Guardar actual
          </button>
        </form>

        {guardados.length > 0 ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
              Presupuestos guardados
              <select
                value={seleccion}
                onChange={(e) => setElegido(e.target.value)}
                className="h-10 min-w-0 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
              >
                {guardados.map((g) => (
                  <option key={g.nombre} value={g.nombre}>
                    {g.nombre} · {pesos(total(g.config.rubros))}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => cargarGuardado(seleccion)}
              className="h-10 rounded-[10px] border bg-background px-3 text-sm font-medium"
            >
              Cargar
            </button>
            <button
              type="button"
              onClick={() => eliminarGuardado(seleccion)}
              className="h-10 rounded-[10px] border bg-background px-3 text-sm font-medium text-up-ink"
            >
              Eliminar
            </button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no has guardado copias.
          </p>
        )}

        <p className="text-xs text-muted-foreground tabular-nums">
          {guardados.length}/{MAX_GUARDADOS}
        </p>
      </div>
    </details>
  );
}
