import Link from "next/link";
import { CargandoEnlace } from "@/components/cargando";
import type { ProductoCatalogo, TiendaCatalogo } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { Etiqueta } from "./etiqueta";

type Props = {
  producto: ProductoCatalogo;
  tienda: TiendaCatalogo | undefined;
  /** Tienda elegida en los chips; sin ella se muestra la más barata. */
  precio: number | null;
  esMejor: boolean;
  cantidad: number;
  onCambiar: (delta: number, emoji: Element | null) => void;
};

export function Tarjeta({
  producto: p,
  tienda,
  precio,
  esMejor,
  cantidad,
  onCambiar,
}: Props) {
  return (
    <article
      data-testid={`tarjeta-${p.id}`}
      className={cn(
        "tarjeta flex min-w-0 flex-col rounded-[14px] border bg-card",
        cantidad > 0 && "border-save",
      )}
    >
      <Link
        href={`/producto/${p.id}`}
        scroll={false}
        className="relative flex flex-col gap-0.5 rounded-t-[14px] px-3 pt-3 pb-1.5"
      >
        <CargandoEnlace className="absolute top-3 right-3 text-muted-foreground" />
        <span
          data-emoji
          className="w-max text-3xl leading-tight"
          aria-hidden="true"
        >
          {p.emoji ?? "🛒"}
        </span>
        <h3 className="mt-0.5 text-sm leading-tight font-semibold">
          {p.nombre}
        </h3>
        <span className="text-xs text-muted-foreground">{p.unidad}</span>
        {precio == null ? (
          <span className="mt-1 text-sm text-muted-foreground">Sin precio</span>
        ) : (
          <span
            className="mt-1 text-[17px] font-semibold tabular-nums"
            data-origen={esMejor ? p.mejor?.estado : undefined}
            data-minimo={esMejor || undefined}
          >
            {pesos(precio)}
          </span>
        )}
        {tienda && precio != null && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: tienda.color }}
              aria-hidden="true"
            />
            {tienda.nombre}
          </span>
        )}
        <div className="flex min-h-5 flex-wrap gap-1">
          {esMejor &&
            p.etiquetas.map((e) => (
              <Etiqueta key={e} tipo={e} cambio={p.cambio} deHoy={p.deHoy} />
            ))}
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-1.5 px-2.5 pt-1.5 pb-2.5">
        <button
          type="button"
          aria-label={`Quitar ${p.nombre}`}
          disabled={cantidad === 0}
          onClick={() => onCambiar(-1, null)}
          className="grid size-9 place-items-center rounded-[10px] border bg-background text-lg disabled:opacity-35"
        >
          −
        </button>
        <span
          className="min-w-[2ch] text-center font-semibold tabular-nums"
          aria-live="polite"
        >
          {cantidad}
        </span>
        <button
          type="button"
          aria-label={`Agregar ${p.nombre}`}
          onClick={(e) =>
            onCambiar(
              1,
              e.currentTarget
                .closest("article")
                ?.querySelector("[data-emoji]") ?? null,
            )
          }
          className="grid size-9 place-items-center rounded-[10px] border bg-background text-lg"
        >
          +
        </button>
      </div>
    </article>
  );
}
