"use client";

import dynamic from "next/dynamic";
import type { Detalle, TiendaCatalogo } from "@/lib/datos";

// Recharts solo se descarga al abrir un detalle.
const GraficoHistorial = dynamic(
  () => import("@/components/graficos/grafico-historial"),
  {
    ssr: false,
    loading: () => <div className="h-52" />,
  },
);

export function Historial(props: {
  datos: Detalle["historial"];
  tiendas: TiendaCatalogo[];
  viejos: Record<string, number>;
}) {
  return <GraficoHistorial {...props} />;
}
