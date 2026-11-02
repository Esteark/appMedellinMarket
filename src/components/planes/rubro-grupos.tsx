"use client";

import { avisar } from "@/lib/avisos";
import {
  asignarGrupo,
  gruposDe,
  quitarGrupo,
  rubrosOrdenados,
} from "@/lib/planes/rubros";
import { cn } from "@/lib/utils";
import { usePlan } from "./plan-provider";

/** Los grupos de producto que cuenta un rubro, como chips que se marcan y desmarcan. */
export function RubroGrupos({
  rubro,
  grupos,
}: {
  rubro: string;
  grupos: string[];
}) {
  const { config, cambiar } = usePlan();
  const propios = gruposDe(config, rubro);
  // Quién cuenta hoy cada grupo (el primero en el orden de los rubros).
  const dueño = new Map<string, string>();
  for (const r of rubrosOrdenados(config))
    for (const g of gruposDe(config, r)) if (!dueño.has(g)) dueño.set(g, r);

  const alternar = (g: string) => {
    if (propios.includes(g)) {
      const r = quitarGrupo(config, rubro, g);
      if (r.ok) cambiar({ grupos: r.config.grupos });
      return;
    }
    const r = asignarGrupo(config, rubro, g);
    if (!r.ok) return;
    cambiar({ grupos: r.config.grupos });
    if (r.desde)
      avisar("rubro_grupo_movido", { grupo: g, desde: r.desde, a: rubro });
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="text-xs text-muted-foreground">
        Productos que cuenta este rubro (por grupo)
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {grupos.map((g) => {
          const activo = propios.includes(g);
          const otro = dueño.get(g);
          return (
            <button
              key={g}
              type="button"
              aria-pressed={activo}
              onClick={() => alternar(g)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                activo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-secondary",
              )}
            >
              {g}
              {!activo && otro && (
                <span className="font-normal opacity-70"> · en {otro}</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Lo que ningún rubro cuenta va a «Otros». Un grupo cuenta en un solo
        rubro: al marcarlo aquí sale del otro.
      </p>
    </fieldset>
  );
}
