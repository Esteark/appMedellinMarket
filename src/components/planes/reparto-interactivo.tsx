"use client";

import { pesos } from "@/lib/formato";
import { usePlan } from "./plan-provider";

const TARJETA =
  "rounded-[12px] border p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none";

const entero = (v: string) => Math.min(20, Math.max(1, Number(v) || 1));

/** Reparto del presupuesto del plan entre personas (y aportantes en Hogar); se recalcula al instante. */
export function RepartoInteractivo() {
  const { tipo, config, cambiar } = usePlan();
  const { personas } = config;
  const aportantes = config.aportantes ?? 1;
  const total = Object.values(config.rubros).reduce((t, v) => t + v, 0);
  const porPersona = Math.round(total / personas);
  const porAportante = Math.round(total / aportantes);

  const titulo =
    tipo === "hogar" ? "Presupuesto del hogar" : "Plan de mercado · dieta";
  const subtitulo =
    tipo === "hogar"
      ? "Alta proteína y fibra. Ajusta el número de personas y aportantes para ver el reparto al instante."
      : "Ensaladas diarias, cenas, desayunos y proteínas. Ajusta el número de personas para ver el reparto al instante.";

  return (
    <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5 transition-all duration-200 motion-reduce:transition-none">
      <div>
        <h1 className="text-xl font-bold">
          {titulo}
          {tipo === "hogar"
            ? ` · ${personas} personas, ${aportantes} aportantes`
            : ` · ${personas} personas`}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitulo}</p>
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
            className="mt-1 w-28 rounded-[10px] border px-2 py-1.5 tabular-nums"
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
              className="mt-1 w-28 rounded-[10px] border px-2 py-1.5 tabular-nums"
            />
          </label>
        )}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className={TARJETA}>
          <p className="text-xs text-muted-foreground">
            Total mes · presupuesto del plan
          </p>
          <p className="text-xl font-bold tabular-nums">{pesos(total)}</p>
          <p className="text-xs text-muted-foreground">Suma de tus rubros</p>
        </div>
        <div className={TARJETA}>
          <p className="text-xs text-muted-foreground">
            Entre {personas} personas toca dividir
          </p>
          <p className="text-xl font-bold tabular-nums">{pesos(porPersona)}</p>
          <p className="text-xs text-muted-foreground">
            A cada uno le corresponde ~{pesos(porPersona)} al mes
          </p>
        </div>
        <div className={TARJETA}>
          <p className="text-xs text-muted-foreground">
            {tipo === "hogar"
              ? `Aporte por trabajador (${aportantes})`
              : "Por persona / por semana"}
          </p>
          <p className="text-xl font-bold tabular-nums">
            {pesos(
              tipo === "hogar" ? porAportante : Math.round(porPersona / 4.33),
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            ~
            {pesos(
              Math.round((tipo === "hogar" ? porAportante : porPersona) / 4.33),
            )}
            /semana aprox.
          </p>
        </div>
      </div>
    </section>
  );
}
