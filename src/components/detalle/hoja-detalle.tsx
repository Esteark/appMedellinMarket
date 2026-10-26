"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Hoja } from "@/components/hoja";

/** El detalle abierto desde el catálogo: cerrar = volver atrás (la URL /producto/[id] se comparte). */
export function HojaDetalle({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <Hoja titulo="detalle-titulo" alCerrar={() => router.back()}>
      {children}
    </Hoja>
  );
}
