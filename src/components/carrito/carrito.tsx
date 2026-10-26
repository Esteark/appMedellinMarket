"use client";

import { useGSAP } from "@gsap/react";
import { type Ref, useMemo, useRef, useState } from "react";
import { GraficosLista } from "@/components/graficos/graficos-lista";
import { Hoja } from "@/components/hoja";
import { contar } from "@/lib/animaciones";
import { avisar } from "@/lib/avisos";
import type { ProductoCatalogo, TiendaCatalogo } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import {
  type Lista,
  mejorTiendaCompleta,
  optimoDividido,
  totalesPorTienda,
} from "@/lib/precios/lista";
import { reemplazarLista } from "./use-lista";

type Props = {
  lista: Lista;
  productos: ProductoCatalogo[];
  tiendas: TiendaCatalogo[];
  icono: Ref<HTMLDivElement>;
};

/** Barra inferior en móvil; columna lateral sticky de 340 px desde 900 px. */
export function Carrito({ lista, productos, tiendas, icono }: Props) {
  const porId = useMemo(
    () => new Map(productos.map((p) => [p.id, p])),
    [productos],
  );
  const { total, ahorro, nota, items, unidades } = useMemo(() => {
    const precios = Object.fromEntries(productos.map((p) => [p.id, p.precios]));
    const ids = tiendas.map((t) => t.id);
    const optimo = optimoDividido(lista, precios, ids);
    const mejor = mejorTiendaCompleta(totalesPorTienda(lista, precios, ids));
    const unidades = Object.values(lista).reduce((a, b) => a + b, 0);
    const nombre = (id: string) =>
      tiendas.find((t) => t.id === id)?.nombre ?? id;
    return {
      total: mejor?.total ?? optimo.total,
      ahorro: mejor ? mejor.total - optimo.total : 0,
      nota: !unidades
        ? "Agrega productos para comparar"
        : mejor
          ? `Todo en ${nombre(mejor.tienda)}, la más barata completa`
          : "Ninguna tienda tiene todo: total dividiendo",
      items: Object.entries(lista).map(([id, q]) => ({
        id,
        q,
        tienda: optimo.tiendaDe[id]
          ? nombre(optimo.tiendaDe[id])
          : "sin precio",
      })),
      unidades,
    };
  }, [lista, productos, tiendas]);

  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [graficos, setGraficos] = useState(false);
  const vaciar = () => {
    const antes = lista;
    reemplazarLista({});
    setHojaAbierta(false);
    avisar(
      "lista_vaciada",
      {},
      {
        texto: "Deshacer",
        alPulsar: () => reemplazarLista(antes),
      },
    );
  };
  const detalleLista = items.length > 0 && (
    <>
      <ul className="flex flex-col gap-1.5 text-sm">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between gap-2">
            <span className="truncate">
              {porId.get(i.id)?.emoji} {porId.get(i.id)?.nombre ?? i.id} × {i.q}
            </span>
            <span className="flex-none text-muted-foreground">{i.tienda}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={vaciar}
        className="self-start text-sm font-medium text-up-ink"
      >
        Vaciar lista
      </button>
    </>
  );

  // 2 · Total y ahorro cuentan hasta el nuevo valor.
  const mostrado = useRef({ total: 0, ahorro: 0 });
  const totalEl = useRef<HTMLElement>(null);
  const ahorroEl = useRef<HTMLElement>(null);
  useGSAP(() => {
    contar(mostrado.current, { total, ahorro }, () => {
      if (totalEl.current)
        totalEl.current.textContent = pesos(mostrado.current.total);
      if (ahorroEl.current)
        ahorroEl.current.textContent = pesos(mostrado.current.ahorro);
    });
  }, [total, ahorro]);

  return (
    <aside
      aria-label="Mi lista"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card px-4 py-2.5 shadow-[0_-10px_30px_rgb(15_23_42/0.14)] min-[900px]:sticky min-[900px]:top-4 min-[900px]:bottom-auto min-[900px]:self-start min-[900px]:rounded-[14px] min-[900px]:border min-[900px]:shadow-none"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            ref={icono}
            data-carrito-icono
            aria-hidden="true"
            className="relative grid size-[42px] flex-none place-items-center rounded-xl bg-secondary text-xl"
          >
            🛒
            <b className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-save px-1 text-[11.5px] text-white tabular-nums">
              {unidades}
            </b>
          </div>
          <div className="flex min-w-0 flex-col">
            <strong
              ref={totalEl}
              className="text-lg font-semibold tabular-nums"
              data-testid="total"
            >
              {pesos(0)}
            </strong>
            <span className="truncate text-xs text-muted-foreground">
              {nota}
            </span>
          </div>
        </div>
        <div className="flex-none rounded-xl bg-save-bg px-2.5 py-1.5 text-right text-xs text-save-ink">
          <span>Ahorro dividiendo</span>
          <b
            ref={ahorroEl}
            className="block text-base tabular-nums"
            data-testid="ahorro"
          >
            {pesos(0)}
          </b>
        </div>
      </div>
      {items.length > 0 && (
        <button
          type="button"
          onClick={() => setHojaAbierta(true)}
          className="mt-2 w-full rounded-[10px] border py-1.5 text-sm font-medium min-[900px]:hidden"
        >
          Ver mi lista y gráficos
        </button>
      )}
      {items.length > 0 && (
        <div className="mt-3 hidden flex-col gap-3 border-t pt-3 min-[900px]:flex">
          {detalleLista}
          <button
            type="button"
            aria-expanded={graficos}
            onClick={() => setGraficos((g) => !g)}
            className="self-start text-sm font-medium text-anot-ink"
          >
            {graficos ? "Ocultar gráficos" : "Ver gráficos"}
          </button>
          {graficos && (
            <GraficosLista
              lista={lista}
              productos={productos}
              tiendas={tiendas}
            />
          )}
        </div>
      )}
      {hojaAbierta && (
        <Hoja titulo="lista-titulo" alCerrar={() => setHojaAbierta(false)}>
          <h2 id="lista-titulo" className="text-[19px] font-semibold">
            Mi lista
          </h2>
          {detalleLista}
          <GraficosLista
            lista={lista}
            productos={productos}
            tiendas={tiendas}
          />
        </Hoja>
      )}
    </aside>
  );
}
