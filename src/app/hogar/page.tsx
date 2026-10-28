import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/cargando";
import { BotonesPlan } from "@/components/planes/botones-plan";
import { ComparaPresupuesto } from "@/components/planes/compara-presupuesto";
import { HogarTablas } from "@/components/planes/hogar-tablas";
import { PlanItems } from "@/components/planes/plan-items";
import { PresupuestoEditable } from "@/components/planes/presupuesto-editable";
import { catalogo } from "@/lib/datos";

export const metadata: Metadata = { title: "Hogar · Mercado Medellín" };

const KPIS = [
  ["Total mes · escenario medio", "$1.633.300", "Carnes en $400.000"],
  ["Aporte por trabajador", "$408.325", "4 trabajadores · ~$94.230/semana"],
  ["Huevos al mes", "600", "20 panales x30 · $300.000"],
];

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
        <PlanItems plan="hogar" productos={productos} />
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
      <div>
        <h1 className="text-xl font-bold">
          Presupuesto del hogar · 6 personas, 4 aportantes
        </h1>
        <p className="text-sm text-muted-foreground">
          Alta proteína y fibra. Carnes ajustadas de $375.000 a $400.000 al mes.
          Abajo comparas el presupuesto con tu lista de mercado y con los
          precios de hoy.
        </p>
      </div>
      <dl className="grid gap-2.5 sm:grid-cols-3">
        {KPIS.map(([titulo, valor, nota]) => (
          <div
            key={titulo}
            className="rounded-[14px] border bg-card p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none"
          >
            <dt className="text-xs text-muted-foreground">{titulo}</dt>
            <dd className="text-xl font-bold tabular-nums">{valor}</dd>
            <dd className="text-xs text-muted-foreground">{nota}</dd>
          </div>
        ))}
      </dl>
      <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5 transition-all duration-200 motion-reduce:transition-none">
        <PresupuestoEditable tipo="hogar" />
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
    </main>
  );
}
