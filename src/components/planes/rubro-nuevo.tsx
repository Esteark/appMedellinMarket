"use client";

import { useState } from "react";
import { avisar } from "@/lib/avisos";
import {
  agregarRubro,
  nombreLimpio,
  textoErrorRubro,
} from "@/lib/planes/rubros";
import { usePlan } from "./plan-provider";

const MAX_MONTO = 10_000_000;

/** «Agregar rubro»: nombre y monto; entra al final y sin grupos (se los asigna la persona). */
export function RubroNuevo() {
  const { config, cambiar } = usePlan();
  const [nombre, setNombre] = useState("");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);

  const agregar = () => {
    const n = Math.min(MAX_MONTO, Math.max(0, Math.round(Number(monto) || 0)));
    const r = agregarRubro(config, nombre, n);
    if (!r.ok) return setError(textoErrorRubro(r.error));
    cambiar({
      rubros: r.config.rubros,
      orden: r.config.orden,
      grupos: r.config.grupos,
    });
    avisar("rubro_agregado", { nombre: nombreLimpio(nombre) ?? nombre });
    setNombre("");
    setMonto("");
    setError(null);
  };

  return (
    <form
      data-testid="rubro-nuevo"
      onSubmit={(e) => {
        e.preventDefault();
        agregar();
      }}
      className="flex flex-col gap-1.5 rounded-[12px] border p-3"
    >
      <p className="text-sm font-semibold">Agregar un rubro</p>
      <div className="flex flex-wrap gap-1.5">
        <input
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setError(null);
          }}
          maxLength={40}
          placeholder="Nombre (ej: Mascotas)"
          aria-label="Nombre del rubro nuevo"
          className="h-9 min-w-0 flex-1 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
        />
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_MONTO}
          step={1000}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Monto"
          aria-label="Monto del rubro nuevo"
          className="h-9 w-36 rounded-[10px] border border-input bg-background px-2 text-right text-base tabular-nums sm:text-sm"
        />
        <button
          type="submit"
          disabled={nombre.trim().length < 2}
          className="h-9 rounded-[10px] border bg-background px-3 text-sm font-medium disabled:opacity-35"
        >
          Agregar rubro
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-up-ink">
          {error}
        </p>
      )}
    </form>
  );
}
