import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/cargando";
import { BotonesPlan } from "@/components/planes/botones-plan";
import { ComparaPresupuesto } from "@/components/planes/compara-presupuesto";
import { HogarTablas } from "@/components/planes/hogar-tablas";
import { PlanConDatos } from "@/components/planes/plan-con-datos";
import { PlanEditable } from "@/components/planes/plan-editable";
import { PresupuestoEditable } from "@/components/planes/presupuesto-editable";
import { RepartoInteractivo } from "@/components/planes/reparto-interactivo";
import { catalogo } from "@/lib/datos";

export const metadata: Metadata = { title: "Hogar · Mercado Medellín" };

async function Datos() {
  const { productos, tiendas } = await catalogo();
  return (
    <>
      <section className="flex flex-col gap-2 rounded-[14px] border bg-card p-3.5">
        <h2 className="text-lg font-bold">Tu lista vs. el presupuesto</h2>
        <ComparaPresupuesto
          productos={productos}
          tiendas={tiendas.map((t) => t.id)}
        />
      </section>
      <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5">
        <div>
          <h2 className="text-lg font-bold">Mercado sugerido del mes</h2>
          <p className="text-sm text-muted-foreground">
            El plan no trae cantidades de verduras: estas se calcularon para que
            sumen cerca de $110.000 por semana. Ajústalas en la lista después de
            cargarlas.
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
          <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5 transition-all duration-200 motion-reduce:transition-none">
            <PresupuestoEditable />
          </section>
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
          <HogarTablas />
        </PlanConDatos>
      </Suspense>
    </main>
  );
}
