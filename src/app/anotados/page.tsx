import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TablaAnotados } from "@/components/anotados/tabla";
import { Spinner } from "@/components/cargando";
import { catalogoBarrio, tablaAnotados, usuario } from "@/lib/datos";

export const metadata: Metadata = { title: "Anotados · Mercado Medellín" };

async function Datos() {
  const [{ tiendas, filas }, u, barrio] = await Promise.all([
    tablaAnotados(),
    usuario(),
    catalogoBarrio(),
  ]);
  const conPrecio = barrio.filas.filter((f) => f.precio != null).length;
  const vencidos = barrio.filas.filter((f) => f.porActualizar).length;
  return (
    <>
      <Link
        href="/anotados/barrio"
        data-testid="enlace-barrio"
        className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-anot bg-anot-bg px-3.5 py-3 text-sm"
      >
        <span className="font-semibold text-anot-ink">
          Tienda/Carnicería de barrio: armar sus precios a mano →
        </span>
        <span className="tabular-nums text-anot-ink">
          {conPrecio}/{barrio.filas.length} con precio · {vencidos} por
          actualizar
        </span>
      </Link>
      <TablaAnotados tiendas={tiendas} filas={filas} conSesion={!!u} />
    </>
  );
}

export default function Anotados() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold">Precios anotados</h1>
      <p className="text-sm text-muted-foreground">
        ¿Viste un precio en la tienda? Anótalo: el anotado manda cuando es igual
        o más reciente que el automático. Las tiendas marcadas "solo anotados"
        no tienen consulta automática.
      </p>
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
    </main>
  );
}
