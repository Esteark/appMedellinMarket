import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListaAlertas } from "@/components/alertas/lista";
import { FormUmbral } from "@/components/alertas/umbral";
import { Spinner } from "@/components/cargando";
import { alertasUsuario, usuario } from "@/lib/datos";

export const metadata: Metadata = { title: "Alertas · Mercado Medellín" };

async function Datos() {
  const u = await usuario();
  if (!u)
    return (
      <p className="rounded-xl bg-anot-bg px-3.5 py-2.5 text-sm text-anot-ink">
        <Link
          href="/ingresar"
          className="font-semibold underline underline-offset-2"
        >
          Inicia sesión
        </Link>{" "}
        para ver tus alertas de precios.
      </p>
    );
  const { alertas, umbral } = await alertasUsuario();
  return (
    <>
      <ListaAlertas alertas={alertas} />
      <FormUmbral umbral={umbral} />
    </>
  );
}

export default function Alertas() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold">Alertas</h1>
      <Suspense
        fallback={
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Spinner />
            Cargando alertas…
          </p>
        }
      >
        <Datos />
      </Suspense>
    </main>
  );
}
