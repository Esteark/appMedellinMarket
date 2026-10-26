import { Suspense } from "react";
import { HojaDetalle } from "@/components/detalle/hoja-detalle";
import {
  CargandoDetalle,
  VistaDetalle,
} from "@/components/detalle/vista-detalle";

/** Navegando desde el catálogo, el detalle se abre como hoja encima de él. */
export default function ProductoEnHoja({
  params,
}: PageProps<"/producto/[id]">) {
  return (
    <HojaDetalle>
      <Suspense fallback={<CargandoDetalle />}>
        <VistaDetalle params={params} />
      </Suspense>
    </HojaDetalle>
  );
}
