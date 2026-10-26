"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EJE, milesCortos, TOOLTIP } from "./estilo";

export type Barra = { nombre: string; valor: number; color: string };

/** Barras horizontales (total por tienda y gasto por grupo). */
export default function GraficoBarras({
  datos,
  etiqueta,
}: {
  datos: Barra[];
  etiqueta: string;
}) {
  return (
    <div
      className="w-full"
      style={{ height: Math.max(120, datos.length * 30) }}
      role="img"
      aria-label={etiqueta}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
        >
          <XAxis type="number" tick={EJE} tickFormatter={milesCortos} />
          <YAxis type="category" dataKey="nombre" width={92} tick={EJE} />
          <Tooltip {...TOOLTIP} cursor={{ fill: "var(--secondary)" }} />
          <Bar
            dataKey="valor"
            name="Total"
            radius={[0, 6, 6, 0]}
            isAnimationActive={false}
          >
            {datos.map((d) => (
              <Cell key={d.nombre} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
