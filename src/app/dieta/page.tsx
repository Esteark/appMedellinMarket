import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/cargando";
import { BotonesPlan } from "@/components/planes/botones-plan";
import { DietaTablas } from "@/components/planes/dieta-tablas";
import { PlanItems } from "@/components/planes/plan-items";
import { PresupuestoEditable } from "@/components/planes/presupuesto-editable";
import { PLANES } from "@/data/planes";
import { catalogo } from "@/lib/datos";

export const metadata: Metadata = { title: "Dieta · Mercado Medellín" };

async function Datos() {
  const { productos } = await catalogo();
  return (
    <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5">
      <h2 className="text-lg font-bold">Cargar el plan en tu lista</h2>
      <BotonesPlan
        ids={productos.map((p) => p.id)}
        acciones={[
          {
            plan: "semana",
            modo: "reemplazar",
            texto: "Lista base de la semana",
            primaria: true,
          },
          { plan: "mes", modo: "reemplazar", texto: "Plan del mes completo" },
          {
            plan: "semana",
            modo: "sumar",
            texto: "Sumar lista base a mi lista",
          },
        ]}
      />
      <p className="text-xs text-muted-foreground">
        Equivalencias usadas: 10 limones ≈ 1 kg; la cebolla “morada y blanca” se
        reparte mitad y mitad. Las cantidades con decimales suben al entero
        siguiente.
      </p>
      <details>
        <summary className="cursor-pointer text-sm font-semibold">
          {PLANES.semana.nombre}
        </summary>
        <div className="mt-2">
          <PlanItems plan="semana" productos={productos} />
        </div>
      </details>
    </section>
  );
}

export default function Dieta() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 pt-4 pb-10">
      <div>
        <h1 className="text-xl font-bold">
          Plan de mercado · dieta familia de 5
        </h1>
        <p className="text-sm text-muted-foreground">
          Ensaladas diarias, cenas, desayunos y proteínas. Tope objetivo
          $800.000 – $1.000.000 al mes. Los costos con precios de hoy salen del
          comparador.
        </p>
      </div>
      <p className="rounded-xl bg-warn-bg px-3.5 py-2.5 text-sm text-warn-ink">
        Los totales semanales del PDF están por debajo de lo que suman sus
        propios artículos: la lista de verduras de cada semana suma $79.000, o
        sea $316.000 al mes y no $234.000.
      </p>
      <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5">
        <PresupuestoEditable tipo="dieta" />
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
      <DietaTablas />
    </main>
  );
}
