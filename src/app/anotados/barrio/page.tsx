import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Barrio } from "@/components/anotados/barrio";
import { Spinner } from "@/components/cargando";
import { catalogoBarrio, usuario } from "@/lib/datos";

export const metadata: Metadata = {
  title: "Tienda de barrio · Mercado Medellín",
};

async function Datos() {
  const [{ filas, disponibles }, u] = await Promise.all([
    catalogoBarrio(),
    usuario(),
  ]);
  return <Barrio filas={filas} disponibles={disponibles} conSesion={!!u} />;
}

export default function PaginaBarrio() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 pt-4 pb-10">
      <Link href="/anotados" className="text-sm font-medium text-anot-ink">
        ← Anotados
      </Link>
      <h1 className="text-xl font-bold">Tienda/Carnicería de barrio</h1>
      <p className="text-sm text-muted-foreground">
        Esta tienda no tiene consulta automática: todos sus precios los anotas
        tú, con tu nombre y la fecha. Si un producto no tiene precio, dice «sin
        dato»; nunca mostramos un precio de referencia.
      </p>
      <Suspense
        fallback={
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Spinner />
            Cargando el catálogo…
          </p>
        }
      >
        <Datos />
      </Suspense>
    </main>
  );
}
