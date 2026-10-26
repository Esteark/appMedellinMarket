import Link from "next/link";
import { Suspense } from "react";
import {
  CargandoDetalle,
  VistaDetalle,
} from "@/components/detalle/vista-detalle";

/** Entrada directa (enlace compartido o recarga): el detalle como página. */
export default function Producto({ params }: PageProps<"/producto/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-4 py-4">
      <Link href="/" className="text-sm text-muted-foreground">
        ← Volver al catálogo
      </Link>
      <Suspense fallback={<CargandoDetalle />}>
        <VistaDetalle params={params} />
      </Suspense>
    </main>
  );
}
