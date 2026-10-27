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

export type Barra = {
  nombre: string;
  valor: number;
  color: string;
  /** Total con algún precio desactualizado: barra más tenue. */
  vieja?: boolean;
  /** A la tienda le faltan productos de la lista: el total es parcial. */
  parcial?: boolean;
  /** Tienda elegida en los chips del catálogo. */
  elegida?: boolean;
};

const sinMovimiento = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      data-testid="grafico-barras"
      data-barras={datos.length}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={datos}
          layout="vertical"
          margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
        >
          {/* Rayas del color de la tienda: las parciales (les faltan productos) no se confunden con las tenues (precio viejo). */}
          <defs>
            {datos.map((d, i) =>
              d.parcial ? (
                <pattern
                  key={d.nombre}
                  id={`rayas-${i}`}
                  width="7"
                  height="7"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect width="3.5" height="7" fill={d.color} />
                </pattern>
              ) : null,
            )}
          </defs>
          <XAxis type="number" tick={EJE} tickFormatter={milesCortos} />
          <YAxis type="category" dataKey="nombre" width={128} tick={EJE} />
          <Tooltip {...TOOLTIP} cursor={{ fill: "var(--secondary)" }} />
          <Bar
            dataKey="valor"
            name="Total"
            radius={[0, 6, 6, 0]}
            isAnimationActive={!sinMovimiento()}
            animationDuration={400}
          >
            {datos.map((d, i) => (
              <Cell
                key={d.nombre}
                fill={d.parcial ? `url(#rayas-${i})` : d.color}
                fillOpacity={d.vieja ? 0.55 : 1}
                stroke={d.elegida ? "var(--foreground)" : "none"}
                strokeWidth={d.elegida ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
