import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/cargando";
import { PresupuestoCliente } from "@/components/presupuesto/presupuesto-cliente";
import { catalogo } from "@/lib/datos";

export const metadata: Metadata = { title: "Presupuesto · Mercado Medellín" };

async function PresupuestoDatos() {
  const { productos } = await catalogo();
  return <PresupuestoCliente productos={productos} />;
}

export default function PresupuestoPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 pt-4 pb-10">
      <div>
        <h1 className="text-xl font-bold">Presupuesto real</h1>
        <p className="text-sm text-muted-foreground">
          Seguimiento de presupuestado vs gastado por mes. Funciona sin sesión
          en este dispositivo.
        </p>
      </div>
      <Suspense
        fallback={
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Spinner />
            Cargando catálogo…
          </p>
        }
      >
        <PresupuestoDatos />
      </Suspense>
    </main>
  );
}
