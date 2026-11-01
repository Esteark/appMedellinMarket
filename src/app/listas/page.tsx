import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/cargando";
import { CargarLista } from "@/components/listas/cargar-lista";
import { ListasGuardadas } from "@/components/listas/listas-guardadas";
import { catalogo } from "@/lib/datos";

export const metadata: Metadata = { title: "Mis listas · Mercado Medellín" };

async function Cargar() {
  const { productos } = await catalogo();
  return (
    <CargarLista
      productos={productos.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        unidad: p.unidad,
      }))}
    />
  );
}

export default function Listas() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-4 pt-4 pb-10">
      <div>
        <h1 className="text-xl font-bold">Mis listas</h1>
        <p className="text-sm text-muted-foreground">
          Listas de mercado con nombre. Cárgalas para reemplazar tu lista o
          súmalas sin bajar cantidades. Con sesión se guardan también en tu
          cuenta.
        </p>
      </div>
      <div data-tour="listas">
        <ListasGuardadas />
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
        <Cargar />
      </Suspense>
    </main>
  );
}
