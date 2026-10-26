import { notFound } from "next/navigation";
import { detalle } from "@/lib/datos";
import { Detalle } from "./detalle";

/** Lee el producto de la URL y lo muestra; 404 si no existe. Va dentro de un Suspense. */
export async function VistaDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const datos = await detalle(id);
  if (!datos) notFound();
  return <Detalle datos={datos} />;
}

export function CargandoDetalle() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-secondary" />
      <div className="h-40 animate-pulse rounded-lg bg-secondary" />
    </div>
  );
}
