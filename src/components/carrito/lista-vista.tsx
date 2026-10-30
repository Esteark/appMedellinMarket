"use client";

import { useMemo, useState } from "react";
import { BotonGuardar } from "@/components/listas/boton-guardar";
import type { ProductoCatalogo, TiendaCatalogo } from "@/lib/datos";
import type { Lista } from "@/lib/precios/lista";
import { type ModoLista, SIN_PRECIO, seccionar } from "@/lib/precios/secciones";
import { cn } from "@/lib/utils";
import { DescargarPdf } from "./descargar-pdf";
import { ListaSeccion } from "./lista-seccion";

const MODOS: [ModoLista, string][] = [
  ["tienda", "Por tienda"],
  ["grupo", "Por grupo"],
  ["todo", "Todo"],
];

// Con más ítems que estos, solo la primera sección arranca abierta.
const PLEGAR_DESDE = 12;

type Props = {
  lista: Lista;
  productos: ProductoCatalogo[];
  tiendas: TiendaCatalogo[];
  alVaciar: () => void;
};

/** La lista agrupada como se compra: por tienda (óptimo dividido), por grupo o plana. */
export function ListaVista({ lista, productos, tiendas, alVaciar }: Props) {
  const [modo, setModo] = useState<ModoLista>("tienda");
  // Secciones que la persona abrió o plegó a mano; el resto sigue la regla por defecto.
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const porId = useMemo(
    () => new Map(productos.map((p) => [p.id, p])),
    [productos],
  );
  const secciones = useMemo(
    () =>
      seccionar(
        modo,
        lista,
        productos,
        Object.fromEntries(productos.map((p) => [p.id, p.precios])),
        tiendas.map((t) => t.id),
      ),
    [modo, lista, productos, tiendas],
  );
  const muchos = Object.keys(lista).length > PLEGAR_DESDE;
  const titulo = (clave: string) =>
    clave === SIN_PRECIO
      ? "Sin precio"
      : modo === "tienda"
        ? (tiendas.find((t) => t.id === clave)?.nombre ?? clave)
        : clave;
  const abierta = (clave: string, i: number) =>
    manual[`${modo}:${clave}`] ?? (!muchos || i === 0);

  return (
    <div data-tour="lista" className="flex flex-col gap-2.5">
      <fieldset className="grid grid-cols-3 gap-0.5 rounded-[10px] bg-secondary p-0.5 text-xs font-semibold">
        <legend className="sr-only">Cómo ver la lista</legend>
        {MODOS.map(([id, texto]) => (
          <button
            key={id}
            type="button"
            aria-pressed={modo === id}
            onClick={() => setModo(id)}
            className={cn(
              "h-8 rounded-lg",
              modo === id
                ? "bg-card shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {texto}
          </button>
        ))}
      </fieldset>
      <div className="flex flex-col gap-2" data-testid="lista-secciones">
        {secciones.map((s, i) => (
          <ListaSeccion
            key={`${modo}:${s.clave}`}
            seccion={s}
            titulo={titulo(s.clave)}
            abierta={abierta(s.clave, i)}
            alAlternar={() =>
              setManual((m) => ({
                ...m,
                [`${modo}:${s.clave}`]: !abierta(s.clave, i),
              }))
            }
            porId={porId}
            plana={modo === "todo"}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DescargarPdf lista={lista} productos={productos} tiendas={tiendas} />
        <BotonGuardar lista={lista} />
        <button
          type="button"
          onClick={alVaciar}
          className="text-sm font-medium text-up-ink"
        >
          Vaciar lista
        </button>
      </div>
    </div>
  );
}
