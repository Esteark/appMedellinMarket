import { pesos } from "@/lib/formato";

// Recharts pinta SVG: los colores van como var(--token) para respetar claro/oscuro.
export const EJE = { fontSize: 11, fill: "var(--muted-foreground)" };
export const TOOLTIP = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--foreground)",
  },
  formatter: (v: unknown) => pesos(Number(v)),
};
export const milesCortos = (v: number) =>
  v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);
