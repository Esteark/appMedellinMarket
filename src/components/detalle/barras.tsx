"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { crecer } from "@/lib/animaciones";
import type { TiendaCatalogo } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Props = {
  tiendas: TiendaCatalogo[];
  precios: Record<string, number | null>;
  origen: Record<string, string | null>;
  mejor: string | null;
};

/** Precio por tienda en barras; la más barata en verde. 5 · Las barras crecen. */
export function Barras({ tiendas, precios, origen, mejor }: Props) {
  const lista = useRef<HTMLUListElement>(null);
  useGSAP(() => crecer(".relleno"), { scope: lista });
  const max = Math.max(1, ...Object.values(precios).filter((v) => v != null));

  return (
    <ul
      ref={lista}
      className="flex flex-col gap-2"
      aria-label="Precio por tienda"
    >
      {tiendas.map((t) => {
        const precio = precios[t.id];
        return (
          <li
            key={t.id}
            className="grid grid-cols-[110px_minmax(0,1fr)_84px] items-center gap-2.5 text-[13.5px]"
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 flex-none rounded-full"
                style={{ backgroundColor: t.color }}
              />
              <span className="truncate">{t.nombre}</span>
            </span>
            {precio == null ? (
              <span className="col-span-2 text-muted-foreground">sin dato</span>
            ) : (
              <>
                <span className="h-2.5 overflow-hidden rounded-md bg-secondary">
                  <span
                    className={cn(
                      "relleno block h-full rounded-md",
                      t.id === mejor ? "bg-save" : "bg-muted-foreground/45",
                    )}
                    style={{ width: `${((precio / max) * 100).toFixed(1)}%` }}
                  />
                </span>
                <span
                  className="text-right font-semibold tabular-nums"
                  data-origen={origen[t.id] ?? undefined}
                  data-minimo={t.id === mejor || undefined}
                >
                  {pesos(precio)}
                </span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
