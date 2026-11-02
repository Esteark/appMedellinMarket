"use client";

import { fusionar } from "@/components/avisos/sincronizar-lista";
import { leerLista, reemplazarLista } from "@/components/carrito/use-lista";
import { avisar } from "@/lib/avisos";
import type { ProductoCatalogo } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import {
  comprasDeSemana,
  costoDeCompras,
  paraLista,
} from "@/lib/planes/compras";
import type { Semana } from "@/lib/planes/semanas";
import type { Precios } from "@/lib/precios/lista";
import { ValorAnimado } from "../valor-animado";
import type { ProductoPlan } from "./lista-comida";

const BOTON = "h-10 rounded-[10px] border px-4 text-sm font-semibold";

/** Lo que se compra en una semana (suma de sus comidas y despensa) a su precio más barato de hoy. */
export function ComprasSemana({
  semana,
  indice,
  productos,
  tiendas,
}: {
  semana: Semana;
  indice: number;
  productos: (ProductoPlan & Pick<ProductoCatalogo, "precios">)[];
  tiendas: string[];
}) {
  const compras = comprasDeSemana(semana);
  const precios: Precios = Object.fromEntries(
    productos.map((p) => [p.id, p.precios]),
  );
  const { lineas, total, sinPrecio } = costoDeCompras(
    compras,
    precios,
    tiendas,
  );
  const porId = new Map(productos.map((p) => [p.id, p]));
  const plan = `Compras de la semana ${indice + 1}`;

  const usar = () => {
    const previa = leerLista();
    const { lista, recortado } = paraLista(compras);
    reemplazarLista(lista, null);
    if (recortado) avisar("lista_recortada");
    avisar(
      "plan_usado",
      { plan, n: lineas.length },
      { texto: "Deshacer", alPulsar: () => reemplazarLista(previa) },
    );
  };
  const sumar = () => {
    const previa = leerLista();
    const { lista: nueva, recortado } = paraLista(fusionar(previa, compras));
    reemplazarLista(nueva);
    if (recortado) avisar("lista_recortada");
    avisar("plan_sumado", {
      plan,
      n: Object.keys(nueva).filter((id) => nueva[id] !== previa[id]).length,
    });
  };

  return (
    <div
      data-testid="compras-semana"
      className="flex flex-col gap-2 rounded-[12px] border bg-background p-3"
    >
      <h3 className="text-base font-bold">{plan}</h3>
      {lineas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Esta semana aún no tiene productos.
        </p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm tabular-nums">
          {lineas.map((l) => (
            <li key={l.id} className="flex items-center gap-2">
              <span aria-hidden="true">{porId.get(l.id)?.emoji ?? "•"}</span>
              <span className="min-w-0 flex-1 truncate">
                {porId.get(l.id)?.nombre ?? l.id}
              </span>
              <span className="text-muted-foreground">×{l.cantidad}</span>
              <span className="w-24 text-right">
                {l.costo == null ? "sin dato" : pesos(l.costo)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="flex justify-between border-t pt-2 text-sm font-semibold">
        <span>Total estimado a precios de hoy</span>
        <ValorAnimado valor={total} />
      </p>
      {sinPrecio > 0 && (
        <p className="text-xs text-muted-foreground">
          Sin precio: {sinPrecio} {sinPrecio === 1 ? "producto" : "productos"}{" "}
          (no entran al total).
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!lineas.length}
          onClick={usar}
          className={`${BOTON} border-transparent bg-primary text-primary-foreground disabled:opacity-35`}
        >
          Usar como mi lista
        </button>
        <button
          type="button"
          disabled={!lineas.length}
          onClick={sumar}
          className={`${BOTON} bg-card disabled:opacity-35`}
        >
          Sumar a mi lista
        </button>
      </div>
    </div>
  );
}
