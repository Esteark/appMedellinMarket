import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/cargando";
import { BotonesPlan } from "@/components/planes/botones-plan";
import { ComparaPresupuesto } from "@/components/planes/compara-presupuesto";
import { MisPresupuestos } from "@/components/planes/mis-presupuestos";
import { PlanConDatos } from "@/components/planes/plan-con-datos";
import { PlanEditable } from "@/components/planes/plan-editable";
import { PresupuestoConGrupos } from "@/components/planes/presupuesto-con-grupos";
import { RepartoInteractivo } from "@/components/planes/reparto-interactivo";
import { catalogo } from "@/lib/datos";

export const metadata: Metadata = { title: "Hogar · Mercado Medellín" };

async function Datos() {
  const { productos, tiendas } = await catalogo();
  return (
    <>
      <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5">
        <div>
          <h2 className="text-lg font-bold">Productos del plan</h2>
          <p className="text-xs text-muted-foreground">
            Ajusta las cantidades que necesita tu hogar. Después puedes cargar
            el plan completo en tu lista.
          </p>
        </div>
        <PlanEditable productos={productos} />
        <BotonesPlan
          ids={productos.map((p) => p.id)}
          acciones={[
            {
              plan: "hogar",
              modo: "reemplazar",
              texto: "Usar como mi lista",
              primaria: true,
            },
            { plan: "hogar", modo: "sumar", texto: "Sumar a mi lista" },
          ]}
        />
      </section>
      <ComparaPresupuesto
        productos={productos}
        tiendas={tiendas.map((t) => t.id)}
      />
    </>
  );
}

export default function Hogar() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 pt-4 pb-10">
      <Suspense
        fallback={
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Spinner />
            Cargando tu plan…
          </p>
        }
      >
        <PlanConDatos tipo="hogar">
          <RepartoInteractivo />
          <section
            data-tour="hogar-presupuesto"
            className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5 transition-all duration-200 motion-reduce:transition-none"
          >
            <PresupuestoConGrupos />
          </section>
          <MisPresupuestos />
          <Suspense
            fallback={
              <p
                role="status"
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Spinner />
                Cargando precios…
              </p>
            }
          >
            <Datos />
          </Suspense>
        </PlanConDatos>
      </Suspense>
    </main>
  );
}
