import { Suspense } from "react";
import { Spinner } from "@/components/cargando";
import { catalogo } from "@/lib/datos";
import { Catalogo } from "./catalogo";

async function Datos({ grupos }: { grupos: string[] }) {
  const { productos, tiendas } = await catalogo();
  return <Catalogo productos={productos} tiendas={tiendas} grupos={grupos} />;
}

/** Mientras llegan los precios: aviso con spinner y tarjetas con la forma de las reales. */
function Esqueleto() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pt-4">
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Spinner />
        Cargando precios…
      </p>
      <div className="h-10 animate-pulse rounded-[10px] bg-secondary lg:mr-[364px]" />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:pr-[364px]">
        {Array.from({ length: 6 }, (_, i) => `marcador-${i}`).map((clave) => (
          <div
            key={clave}
            className="flex h-56 flex-col gap-2 rounded-[14px] border bg-card p-3"
          >
            <div className="size-9 animate-pulse rounded-lg bg-secondary" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-secondary" />
            <div className="mt-auto h-9 animate-pulse rounded-[10px] bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Título estático + catálogo de esos grupos en Suspense. */
export function VistaCatalogo({
  titulo,
  grupos,
}: {
  titulo: string;
  grupos: string[];
}) {
  return (
    <main className="flex flex-1 flex-col">
      <h1 className="mx-auto w-full max-w-6xl px-4 pt-4 text-xl font-bold">
        {titulo}
      </h1>
      <Suspense fallback={<Esqueleto />}>
        <Datos grupos={grupos} />
      </Suspense>
    </main>
  );
}
