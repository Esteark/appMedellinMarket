"use client";

import { useTransition } from "react";
import { guardarUmbral } from "@/app/alertas/acciones";
import { Spinner } from "@/components/cargando";
import { avisar } from "@/lib/avisos";

/** Ahorro mínimo, en pesos, para que una alerta `mas_barato` salte. */
export function FormUmbral({ umbral }: { umbral: number }) {
  const [guardando, empezar] = useTransition();
  return (
    <form
      action={(datos) =>
        empezar(async () => {
          const r = await guardarUmbral(datos);
          if (r.ok) avisar("preferencias_guardadas");
        })
      }
      className="flex flex-col gap-2 rounded-[14px] border bg-card p-3.5"
    >
      <label htmlFor="umbral" className="text-sm font-semibold">
        Avisarme si el ahorro es de al menos
      </label>
      <div className="flex items-center gap-2">
        <span aria-hidden="true">$</span>
        <input
          id="umbral"
          name="umbral"
          type="number"
          inputMode="numeric"
          min={0}
          max={1000000}
          step={100}
          defaultValue={umbral}
          className="h-10 w-32 rounded-[10px] border border-input bg-background px-3 text-base tabular-nums"
        />
        <button
          type="submit"
          disabled={guardando}
          className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-70"
        >
          {guardando && <Spinner />}
          Guardar
        </button>
      </div>
    </form>
  );
}
