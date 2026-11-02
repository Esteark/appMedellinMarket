import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/cargando";
import { BotonesPlan } from "@/components/planes/botones-plan";
import { ComparaPresupuesto } from "@/components/planes/compara-presupuesto";
import { Semanas } from "@/components/planes/dieta/semanas";
import { MisPresupuestos } from "@/components/planes/mis-presupuestos";
import { PlanConDatos } from "@/components/planes/plan-con-datos";
import { PlanEditable } from "@/components/planes/plan-editable";
import { PresupuestoConGrupos } from "@/components/planes/presupuesto-con-grupos";
import { RepartoInteractivo } from "@/components/planes/reparto-interactivo";
import { Consejos } from "@/components/planes/tabla";
import { PLANES } from "@/data/planes";
import { catalogo } from "@/lib/datos";

export const metadata: Metadata = { title: "Dieta · Mercado Medellín" };

async function Datos() {
  const { productos, tiendas } = await catalogo();
  const idsTienda = tiendas.map((t) => t.id);
  return (
    <>
      <Semanas productos={productos} tiendas={idsTienda} />
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
          Equivalencias usadas: 10 limones ≈ 1 kg; la cebolla “morada y blanca”
          se reparte mitad y mitad. Las cantidades con decimales suben al entero
          siguiente.
        </p>
        <details>
          <summary className="cursor-pointer text-sm font-semibold">
            {PLANES.semana.nombre}
          </summary>
          <div className="mt-2">
            <PlanEditable productos={productos} />
          </div>
        </details>
      </section>
      <ComparaPresupuesto productos={productos} tiendas={idsTienda} />
    </>
  );
}

export default function Dieta() {
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
        <PlanConDatos tipo="dieta">
          <RepartoInteractivo />
          <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5 transition-all duration-200 motion-reduce:transition-none">
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
          <details className="rounded-[14px] border bg-card px-3.5 py-2.5">
            <summary className="cursor-pointer text-sm font-semibold">
              Consejos para comprar
            </summary>
            <div className="mt-2 grid gap-5 sm:grid-cols-2">
              <Consejos
                titulo="Dónde comprar"
                items={[
                  "Verduras y frutas: Plaza Minorista o galerías del barrio, hasta 30 % más barato.",
                  "Huevos, yogurt, pastas, maicitos: D1.",
                  "Carnes: carnicería de confianza, comparando precio por kg.",
                  "Leguminosas a granel: naturistas o tienda del barrio.",
                ]}
              />
              <Consejos
                titulo="Ahorros puntuales"
                items={[
                  "Olla grande de lentejas o garbanzos el domingo, dura 4–5 días.",
                  "Queso costeño duro (~$12.000/250 g) en vez de parmesano.",
                  "Pasta de ajo casera: 2 cabezas + 3 cdas de aceite + sal, ~$4.000 vs $10.000.",
                  "Aguacate verde para madurar en casa; cilantro en vaso con agua; lechuga en papel absorbente.",
                ]}
              />
            </div>
          </details>
        </PlanConDatos>
      </Suspense>
    </main>
  );
}
