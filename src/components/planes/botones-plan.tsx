"use client";

import { leerLista, reemplazarLista } from "@/components/carrito/use-lista";
import { type IdPlan, PLANES } from "@/data/planes";
import { avisar } from "@/lib/avisos";
import { aplicarPlan } from "@/lib/precios/planes";
import { cn } from "@/lib/utils";
import { usePlanOpcional } from "./plan-provider";

export type AccionPlan = {
  plan: IdPlan;
  modo: "reemplazar" | "sumar";
  texto: string;
  primaria?: boolean;
};

/** Cargan un plan en la lista del dispositivo (con sesión, `SincronizarLista` la guarda). */
export function BotonesPlan({
  acciones,
  ids,
}: {
  acciones: AccionPlan[];
  /** Ids del catálogo: lo que no esté ahí no se agrega. */
  ids: string[];
}) {
  const editable = usePlanOpcional();
  function pulsar({ plan, modo }: AccionPlan) {
    const previa = leerLista();
    // El plan base de Hogar y el de la semana de Dieta salen de lo que la persona editó.
    const propio =
      (plan === "hogar" && editable?.tipo === "hogar") ||
      (plan === "semana" && editable?.tipo === "dieta");
    const items =
      propio && editable ? editable.config.items : PLANES[plan].items;
    const nueva = aplicarPlan(previa, items, modo, new Set(ids));
    reemplazarLista(nueva);
    const datos = { plan: PLANES[plan].nombre };
    if (modo === "sumar")
      avisar("plan_sumado", {
        ...datos,
        n: Object.keys(nueva).filter((id) => nueva[id] !== previa[id]).length,
      });
    else
      avisar(
        "plan_usado",
        { ...datos, n: Object.keys(nueva).length },
        { texto: "Deshacer", alPulsar: () => reemplazarLista(previa) },
      );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {acciones.map((a) => (
        <button
          key={`${a.plan}-${a.modo}`}
          type="button"
          data-testid={`plan-${a.plan}-${a.modo}`}
          onClick={() => pulsar(a)}
          className={cn(
            "h-10 rounded-[10px] border px-4 text-sm font-semibold",
            a.primaria
              ? "border-transparent bg-primary text-primary-foreground"
              : "bg-card hover:bg-secondary",
          )}
        >
          {a.texto}
        </button>
      ))}
    </div>
  );
}
