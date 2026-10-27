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

/** Misma forma que el detalle (título, barras, gráfico, botón): la hoja no salta al llegar los datos. */
export function CargandoDetalle() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="flex items-start gap-3 pr-20">
        <div className="size-10 flex-none animate-pulse rounded-lg bg-secondary" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-6 w-2/3 animate-pulse rounded-lg bg-secondary" />
          <div className="h-4 w-1/2 animate-pulse rounded-lg bg-secondary" />
        </div>
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-secondary" />
      <div className="h-4 w-1/3 animate-pulse rounded-lg bg-secondary" />
      <div className="h-52 animate-pulse rounded-lg bg-secondary" />
      <div className="h-11 animate-pulse rounded-[10px] bg-secondary" />
    </div>
  );
}
