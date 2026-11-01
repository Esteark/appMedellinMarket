import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/cargando";
import { VistaTiendas } from "@/components/tiendas/vista";
import { catalogoTiendas, productosGestion, usuario } from "@/lib/datos";

export const metadata: Metadata = { title: "Tiendas y productos" };

async function Datos() {
  const [tiendas, productos, u] = await Promise.all([
    catalogoTiendas(),
    productosGestion(),
    usuario(),
  ]);
  return (
    <VistaTiendas tiendas={tiendas} productos={productos} conSesion={!!u} />
  );
}

export default function Tiendas() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold">Tiendas y productos</h1>
      <p className="text-sm text-muted-foreground">
        El catálogo es de todos: lo que crees, edites o fusiones aquí lo ven
        todas las personas. Nada se borra; los duplicados se fusionan.
      </p>
      <Suspense
        fallback={
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Spinner />
            Cargando tiendas…
          </p>
        }
      >
        <Datos />
      </Suspense>
    </main>
  );
}
