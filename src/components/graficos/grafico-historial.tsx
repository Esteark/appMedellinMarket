"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Detalle, TiendaCatalogo } from "@/lib/datos";
import { EJE, milesCortos, TOOLTIP } from "./estilo";

type Props = {
  datos: Detalle["historial"];
  tiendas: TiendaCatalogo[];
  viejos: Record<string, number>;
};

/** Historial de 30 días: una línea por tienda con datos; punteada si su precio está desactualizado. */
export default function GraficoHistorial({ datos, tiendas, viejos }: Props) {
  const conDatos = tiendas.filter((t) => datos.some((d) => d[t.id] != null));
  if (datos.length < 2)
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay historial suficiente.
      </p>
    );
  return (
    <div
      className="h-52 w-full"
      role="img"
      aria-label="Historial de precios de 30 días por tienda"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={datos}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="fecha"
            tick={EJE}
            tickFormatter={(f: string) => `${f.slice(8)}/${f.slice(5, 7)}`}
          />
          <YAxis width={40} tick={EJE} tickFormatter={milesCortos} />
          <Tooltip {...TOOLTIP} />
          {conDatos.map((t) => (
            <Line
              key={t.id}
              dataKey={t.id}
              name={
                viejos[t.id] != null
                  ? `${t.nombre} (⏱ desactualizado)`
                  : t.nombre
              }
              stroke={t.color}
              strokeWidth={2}
              strokeDasharray={viejos[t.id] != null ? "4 4" : undefined}
              strokeOpacity={viejos[t.id] != null ? 0.6 : 1}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
