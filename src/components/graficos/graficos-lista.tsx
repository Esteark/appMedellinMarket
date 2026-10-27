"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { COLOR_GRUPO } from "@/data/grupos";
import type { ProductoCatalogo, TiendaCatalogo } from "@/lib/datos";
import {
  compararTiendas,
  type Lista,
  optimoDividido,
} from "@/lib/precios/lista";
import { cn } from "@/lib/utils";

// Recharts solo se descarga cuando se abre un gráfico.
const GraficoBarras = dynamic(() => import("./grafico-barras"), {
  ssr: false,
  loading: () => <div className="h-32" />,
});

type Props = {
  lista: Lista;
  productos: ProductoCatalogo[];
  tiendas: TiendaCatalogo[];
  /** Tienda elegida en los chips del catálogo; se resalta en el gráfico. */
  elegida?: string | null;
};

/** Total por tienda y gasto por grupo de la lista: pestañas que montan un gráfico a la vez. */
export function GraficosLista({ lista, productos, tiendas, elegida }: Props) {
  const [pestana, setPestana] = useState<"tiendas" | "grupos">("tiendas");
  const { porTienda, porGrupo } = useMemo(() => {
    const precios = Object.fromEntries(productos.map((p) => [p.id, p.precios]));
    const ids = tiendas.map((t) => t.id);
    const porTienda = compararTiendas(lista, precios, ids).map((t) => {
      const tienda = tiendas.find((x) => x.id === t.tienda);
      // Algún producto de la lista tiene en esta tienda un precio que puede haber cambiado.
      const vieja = productos.some(
        (p) => lista[p.id] && p.viejos[t.tienda] != null,
      );
      const faltan = t.faltantes.length;
      return {
        nombre: `${tienda?.nombre ?? t.tienda}${vieja ? " ⏱" : ""}${faltan ? ` · faltan ${faltan}` : ""}`,
        valor: t.total,
        color: tienda?.color ?? "var(--muted-foreground)",
        vieja,
        parcial: faltan > 0,
        elegida: t.tienda === elegida,
      };
    });
    const optimo = optimoDividido(lista, precios, ids);
    const gasto = new Map<string, number>();
    for (const p of productos) {
      const tienda = optimo.tiendaDe[p.id];
      const precio = tienda ? p.precios[tienda] : null;
      if (precio != null)
        gasto.set(
          p.grupo,
          (gasto.get(p.grupo) ?? 0) + precio * (lista[p.id] ?? 0),
        );
    }
    const porGrupo = [...gasto]
      .sort((a, b) => b[1] - a[1])
      .map(([grupo, valor]) => ({
        nombre: grupo,
        valor,
        color: COLOR_GRUPO[grupo] ?? "var(--muted-foreground)",
      }));
    return { porTienda, porGrupo };
  }, [lista, productos, tiendas, elegida]);

  if (!Object.keys(lista).length) return null;
  return (
    <section aria-label="Gráficos de la lista" className="flex flex-col gap-2">
      <div role="tablist" aria-label="Gráficos" className="flex gap-1 border-b">
        {(
          [
            ["tiendas", "Total por tienda"],
            ["grupos", "Gasto por grupo"],
          ] as const
        ).map(([id, texto]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className={cn(
              "-mb-px border-b-2 px-2 py-1.5 text-xs font-semibold",
              pestana === id
                ? "border-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            {texto}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {pestana === "tiendas" ? (
          porTienda.length ? (
            <>
              <GraficoBarras
                datos={porTienda}
                etiqueta={`Total de la lista por tienda${
                  elegida
                    ? `, resaltada: ${tiendas.find((t) => t.id === elegida)?.nombre ?? elegida}`
                    : ""
                }`}
              />
              {porTienda.some((t) => t.parcial) && (
                <p className="text-xs text-muted-foreground">
                  Las barras rayadas son tiendas a las que les faltan productos
                  de tu lista: su total es parcial y no sirve para comparar.
                </p>
              )}
              {porTienda.some((t) => t.vieja) && (
                <p className="text-xs text-warn-ink">
                  ⏱ Tiendas con precios desactualizados en tu lista: el total
                  puede haber cambiado.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Ninguna tienda tiene precios para los productos de tu lista.
            </p>
          )
        ) : (
          <GraficoBarras
            datos={porGrupo}
            etiqueta="Gasto de la lista por grupo, comprando dividido"
          />
        )}
      </div>
    </section>
  );
}
