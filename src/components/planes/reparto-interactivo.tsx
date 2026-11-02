"use client";

import { useState } from "react";
import { usePlan } from "./plan-provider";
import { ValorAnimado } from "./valor-animado";

const TARJETA =
  "rounded-[12px] border bg-background/60 p-3 transition-all duration-200 motion-reduce:transition-none";

const entero = (v: string, max = 20) =>
  Math.min(max, Math.max(1, Number(v) || 1));

const ESTADO = {
  cuenta: "Guardado en tu cuenta",
  dispositivo: "Guardado en este dispositivo",
  guardando: "Guardando…",
  sin_guardar: "Sin guardar",
} as const;

/** Resumen editable del plan: personas, aportantes y los tres montos que cambian con los rubros. */
export function RepartoInteractivo() {
  const { tipo, config, estado, cambiar, volverAlSugerido } = usePlan();
  const { personas } = config;
  const aportantes = config.aportantes ?? 1;
  const total = Object.values(config.rubros).reduce((t, v) => t + v, 0);
  const porPersona = Math.round(total / personas);
  const porAportante = Math.round(total / aportantes);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5 transition-all duration-200 motion-reduce:transition-none">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">
            {tipo === "hogar"
              ? "Presupuesto del hogar"
              : "Plan de mercado · dieta"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {tipo === "hogar"
              ? "Ajusta personas, aportantes y rubros: todo se recalcula al instante."
              : "Ajusta personas y rubros: todo se recalcula al instante."}
          </p>
        </div>
        <p
          role="status"
          data-testid="estado-guardado"
          className="rounded-full bg-secondary px-3 py-1 text-xs font-medium"
        >
          {ESTADO[estado]}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          ¿Entre cuántas personas?
          <input
            type="number"
            min={1}
            max={20}
            value={personas}
            onChange={(e) => cambiar({ personas: entero(e.target.value) })}
            className="mt-1 w-28 rounded-[10px] border border-input bg-background px-2 py-1.5 tabular-nums"
          />
        </label>
        {tipo === "hogar" && (
          <label className="text-sm">
            ¿Cuántos aportantes?
            <input
              type="number"
              min={1}
              max={20}
              value={aportantes}
              onChange={(e) => cambiar({ aportantes: entero(e.target.value) })}
              className="mt-1 w-28 rounded-[10px] border border-input bg-background px-2 py-1.5 tabular-nums"
            />
          </label>
        )}
        {confirmando ? (
          <span className="flex items-center gap-1.5 text-sm">
            ¿Volver al plan sugerido?
            <button
              type="button"
              onClick={() => {
                volverAlSugerido();
                setConfirmando(false);
              }}
              className="rounded-[10px] bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
            >
              Sí, volver
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-[10px] border bg-background px-3 py-1.5 text-sm font-medium"
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

      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className={TARJETA}>
          <p className="text-xs text-muted-foreground">
            Total mes · presupuesto del plan
          </p>
          <p className="text-xl font-bold tabular-nums">
            <ValorAnimado valor={total} />
          </p>
          <p className="text-xs text-muted-foreground">Suma de tus rubros</p>
        </div>
        <div className={TARJETA}>
          <p className="text-xs text-muted-foreground">
            Entre {personas} personas toca dividir
          </p>
          <p className="text-xl font-bold tabular-nums">
            <ValorAnimado valor={porPersona} />
          </p>
          <p className="text-xs text-muted-foreground">
            A cada uno le corresponde al mes
          </p>
        </div>
        <div className={TARJETA}>
          <p className="text-xs text-muted-foreground">
            {tipo === "hogar"
              ? `Aporte por trabajador (${aportantes})`
              : "Por persona / por semana"}
          </p>
          <p className="text-xl font-bold tabular-nums">
            <ValorAnimado
              valor={
                tipo === "hogar" ? porAportante : Math.round(porPersona / 4.33)
              }
            />
          </p>
          <p className="text-xs text-muted-foreground">
            {tipo === "hogar" ? "Al mes por aportante" : "Equivalente semanal"}
          </p>
        </div>
      </div>
    </section>
  );
}
