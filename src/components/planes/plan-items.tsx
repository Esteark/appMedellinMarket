import { type IdPlan, PLANES } from "@/data/planes";
import type { ProductoCatalogo } from "@/lib/datos";

/** Productos y cantidades de un plan, con el nombre del catálogo. */
export function PlanItems({
  plan,
  productos,
}: {
  plan: IdPlan;
  productos: Pick<ProductoCatalogo, "id" | "nombre" | "emoji" | "unidad">[];
}) {
  const porId = new Map(productos.map((p) => [p.id, p]));
  return (
    <ul
      className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3"
      data-testid={`items-${plan}`}
    >
      {Object.entries(PLANES[plan].items).map(([id, q]) => {
        const p = porId.get(id);
        return (
          <li key={id} className="flex items-baseline gap-2">
            <span aria-hidden="true">{p?.emoji ?? "•"}</span>
            <span className="flex-1 truncate">{p?.nombre ?? id}</span>
            <span className="text-muted-foreground tabular-nums">
              ×{Math.ceil(q)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
