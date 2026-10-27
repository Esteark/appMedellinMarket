import { Suspense } from "react";
import { catalogo } from "@/lib/datos";
import { Catalogo } from "./catalogo";

async function Datos({ grupos }: { grupos: string[] }) {
  const { productos, tiendas } = await catalogo();
  return <Catalogo productos={productos} tiendas={tiendas} grupos={grupos} />;
}

function Esqueleto() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-2.5 px-4 pt-4 sm:grid-cols-3">
      {Array.from({ length: 8 }, (_, i) => `marcador-${i}`).map((clave) => (
        <div
          key={clave}
          className="h-56 animate-pulse rounded-[14px] border bg-card"
        />
      ))}
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
