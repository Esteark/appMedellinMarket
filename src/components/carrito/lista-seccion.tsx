"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { plegar } from "@/lib/animaciones";
import type { ProductoCatalogo } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import type { Seccion } from "@/lib/precios/secciones";
import { cn } from "@/lib/utils";
import { cambiarLista } from "./use-lista";

type Props = {
  seccion: Seccion;
  titulo: string;
  abierta: boolean;
  alAlternar: () => void;
  porId: Map<string, ProductoCatalogo>;
  /** En "Todo" no hay encabezado que plegar. */
  plana?: boolean;
};

const paso =
  "grid size-7 place-items-center rounded-full border bg-background hover:bg-secondary";

/** Sección plegable de la lista: encabezado con subtotal y filas con su stepper. */
export function ListaSeccion({
  seccion,
  titulo,
  abierta,
  alAlternar,
  porId,
  plana,
}: Props) {
  const cuerpo = useRef<HTMLUListElement>(null);
  const primera = useRef(true);
  // Solo el valor inicial va al atributo: después `plegar` maneja `hidden` y React no lo pisa.
  const ocultoAlInicio = useRef(!abierta).current;

  useLayoutEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    if (cuerpo.current) plegar(cuerpo.current, abierta);
  }, [abierta]);

  const filas = (
    <ul
      ref={cuerpo}
      hidden={plana ? false : ocultoAlInicio}
      id={`seccion-${seccion.clave}`}
      className="flex flex-col overflow-hidden"
    >
      {seccion.filas.map((f) => {
        const p = porId.get(f.id);
        return (
          <li
            key={f.id}
            data-testid="fila-lista"
            className="flex min-h-12 items-center gap-2 border-t py-1 text-sm first:border-t-0"
          >
            <span className="min-w-0 flex-1 line-clamp-2 leading-tight">
              {p?.emoji} {p?.nombre ?? f.id}
            </span>
            <span className="flex flex-none items-center gap-1.5 tabular-nums">
              <button
                type="button"
                aria-label={`Quitar uno de ${p?.nombre ?? f.id}`}
                onClick={() => cambiarLista(f.id, -1)}
                className={paso}
              >
                <Minus aria-hidden="true" className="size-3.5" />
              </button>
              <span className="min-w-5 text-center font-medium">
                {f.cantidad}
              </span>
              <button
                type="button"
                aria-label={`Agregar uno de ${p?.nombre ?? f.id}`}
                onClick={() => cambiarLista(f.id, 1)}
                className={paso}
              >
                <Plus aria-hidden="true" className="size-3.5" />
              </button>
            </span>
            <span className="w-20 flex-none text-right text-muted-foreground tabular-nums">
              {f.precio == null ? "sin precio" : pesos(f.precio * f.cantidad)}
            </span>
          </li>
        );
      })}
    </ul>
  );
  if (plana) return filas;

  return (
    <section
      data-testid="seccion-lista"
      data-clave={seccion.clave}
      className="rounded-xl border"
    >
      <button
        type="button"
        aria-expanded={abierta}
        aria-controls={`seccion-${seccion.clave}`}
        onClick={alAlternar}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm"
      >
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 flex-none transition-transform duration-150 motion-reduce:transition-none",
            !abierta && "-rotate-90",
          )}
        />
        <span className="min-w-0 flex-1 truncate font-semibold">{titulo}</span>
        <span className="flex-none text-xs text-muted-foreground">
          {seccion.filas.length}{" "}
          {seccion.filas.length === 1 ? "producto" : "productos"}
        </span>
        <b className="w-20 flex-none text-right tabular-nums">
          {pesos(seccion.total)}
        </b>
      </button>
      <div className="px-3 pb-1">{filas}</div>
    </section>
  );
}
