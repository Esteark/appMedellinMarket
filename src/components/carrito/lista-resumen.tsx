import { pesos } from "@/lib/formato";

/** Total, ahorro y número de productos; se queda arriba mientras se desplaza la lista de la hoja. */
export function ListaResumen({
  productos,
  total,
  ahorro,
}: {
  productos: number;
  total: number;
  ahorro: number;
}) {
  return (
    <div
      data-testid="lista-resumen"
      className="sticky top-0 z-10 -mx-4 flex items-center justify-between gap-3 border-b bg-card px-4 py-2 text-sm"
    >
      <span className="text-muted-foreground">
        {productos} {productos === 1 ? "producto" : "productos"}
      </span>
      <span className="flex items-center gap-3 tabular-nums">
        <b>{pesos(total)}</b>
        <span className="rounded-lg bg-save-bg px-2 py-0.5 text-xs text-save-ink">
          Ahorro {pesos(ahorro)}
        </span>
      </span>
    </div>
  );
}
