"use client";

import { useState } from "react";
import { pesos } from "@/lib/formato";
import { usePlan } from "./plan-provider";

const MAX_PROPIOS = 50;
const MAX_NOTA = 1000;

/** Productos propios (nombre + precio estimado, tope 50) y la nota del plan (tope 1000). */
export function PlanExtras() {
  const { config, cambiar } = usePlan();
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const valor = Number(precio.replace(/[.\s$]/g, ""));
  const valido =
    nombre.trim().length > 0 &&
    nombre.trim().length <= 60 &&
    Number.isInteger(valor) &&
    valor >= 0 &&
    valor <= 10_000_000 &&
    config.propios.length < MAX_PROPIOS &&
    !config.propios.some(
      (p) => p.nombre.toLowerCase() === nombre.trim().toLowerCase(),
    );

  return (
    <>
      <fieldset className="flex flex-col gap-2 rounded-[12px] border p-3">
        <legend className="px-1 text-sm font-semibold">
          Productos propios
        </legend>
        {config.propios.map((p, i) => (
          <div
            key={p.nombre}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
            <span className="tabular-nums">{pesos(p.precio)}</span>
            <button
              type="button"
              aria-label={`Quitar ${p.nombre}`}
              onClick={() =>
                cambiar({ propios: config.propios.filter((_, j) => j !== i) })
              }
              className="text-sm font-medium text-up-ink"
            >
              Quitar
            </button>
          </div>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!valido) return;
            cambiar({
              propios: [
                ...config.propios,
                { nombre: nombre.trim(), precio: valor },
              ],
            });
            setNombre("");
            setPrecio("");
          }}
          className="flex flex-wrap gap-1.5"
        >
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={60}
            placeholder="Nombre"
            aria-label="Nombre del producto propio"
            className="h-9 min-w-0 flex-1 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
          />
          <input
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            inputMode="numeric"
            placeholder="Precio estimado"
            aria-label="Precio estimado del producto propio"
            className="h-9 w-36 rounded-[10px] border border-input bg-background px-2 text-right text-base tabular-nums sm:text-sm"
          />
          <button
            type="submit"
            disabled={!valido}
            className="h-9 rounded-[10px] border bg-background px-3 text-sm font-medium disabled:opacity-35"
          >
            Agregar propio
          </button>
        </form>
        <p className="text-xs text-muted-foreground">
          {config.propios.length}/{MAX_PROPIOS}. Son estimaciones tuyas: no
          entran en la comparación de precios.
        </p>
      </fieldset>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Nota del plan
        <textarea
          value={config.nota}
          onChange={(e) => cambiar({ nota: e.target.value.slice(0, MAX_NOTA) })}
          rows={3}
          className="rounded-[10px] border border-input bg-background px-2 py-1.5 text-base font-normal sm:text-sm"
        />
        <span className="text-xs font-normal text-muted-foreground tabular-nums">
          {config.nota.length}/{MAX_NOTA}
        </span>
      </label>
    </>
  );
}
