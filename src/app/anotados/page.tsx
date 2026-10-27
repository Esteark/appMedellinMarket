import type { Metadata } from "next";
import { Suspense } from "react";
import { TablaAnotados } from "@/components/anotados/tabla";
import { Spinner } from "@/components/cargando";
import { tablaAnotados, usuario } from "@/lib/datos";

export const metadata: Metadata = { title: "Anotados · Mercado Medellín" };

async function Datos() {
  const [{ tiendas, filas }, u] = await Promise.all([
    tablaAnotados(),
    usuario(),
  ]);
  return <TablaAnotados tiendas={tiendas} filas={filas} conSesion={!!u} />;
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
