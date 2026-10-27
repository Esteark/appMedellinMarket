import { cn } from "@/lib/utils";

/** Tabla simple y desplazable; las columnas con `der` van alineadas a la derecha. */
export function Tabla({
  columnas,
  filas,
  total,
}: {
  columnas: { texto: string; der?: boolean }[];
  filas: (string | number)[][];
  /** Última fila resaltada (totales). */
  total?: (string | number)[];
}) {
  const todas = total ? [...filas, total] : filas;
  return (
    <div className="overflow-x-auto rounded-[14px] border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            {columnas.map((c) => (
              <th
                key={c.texto}
                className={cn("px-3 py-2 font-medium", c.der && "text-right")}
              >
                {c.texto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {todas.map((fila, i) => (
            <tr
              key={String(fila[0]) + String(fila[1])}
              className={cn(
                "border-t",
                total && i === todas.length - 1 && "bg-secondary font-semibold",
              )}
            >
              {fila.map((celda, j) => (
                <td
                  key={columnas[j]?.texto ?? j}
                  className={cn(
                    "px-3 py-2",
                    columnas[j]?.der && "text-right tabular-nums",
                  )}
                >
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lista de consejos con viñetas. */
export function Consejos({
  titulo,
  items,
}: {
  titulo: string;
  items: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="font-semibold">{titulo}</h3>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
