"use client";

import { useEffect, useState } from "react";
import { reemplazarLista, useOrigen } from "@/components/carrito/use-lista";
import { avisar } from "@/lib/avisos";
import {
  actualizarLista,
  type ListaGuardada,
  leerLocales,
  MAX_ITEMS,
  MAX_LISTAS,
  normalizarNombre,
} from "@/lib/listas/guardadas";
import { cambiado } from "@/lib/listas/origen";
import type { Lista } from "@/lib/precios/lista";
import { persistir } from "./almacen";

const BOTON =
  "rounded-[10px] border bg-background px-3 py-1.5 text-sm font-medium";

/**
 * Guarda la lista activa. Con nombre nuevo crea una lista (nunca pisa una que ya tiene ese nombre);
 * si la lista salió de una guardada, también puede guardar los cambios sobre esa.
 */
export function BotonGuardar({ lista }: { lista: Lista }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [guardadas, setGuardadas] = useState<ListaGuardada[]>([]);
  const origen = useOrigen();
  // Se lee tras hidratar y en cada cambio de la lista: el servidor no ve localStorage.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `lista` y `origen` solo disparan la relectura
  useEffect(() => setGuardadas(leerLocales()), [lista, origen]);
  const deOrigen = origen
    ? guardadas.find(
        (l) => normalizarNombre(l.nombre) === normalizarNombre(origen),
      )
    : undefined;
  const sinGuardar = !!deOrigen && cambiado(lista, deOrigen.items);

  const guardar = async () => {
    const limpio = nombre.trim();
    if (!limpio || limpio.length > 60) return;
    if (Object.keys(lista).length > MAX_ITEMS) return avisar("limite_listas");
    const locales = leerLocales();
    if (
      locales.some(
        (l) => normalizarNombre(l.nombre) === normalizarNombre(limpio),
      )
    )
      return avisar("nombre_repetido");
    if (locales.length >= MAX_LISTAS) return avisar("limite_listas");
    await persistir([
      ...locales,
      {
        nombre: limpio,
        items: lista,
        tienda_preferida: "d1",
        actualizada: new Date().toISOString(),
      },
    ]);
    // La recién guardada pasa a ser el origen: se puede seguir editando y guardar sobre ella.
    reemplazarLista(lista, limpio);
    avisar("lista_guardada", { nombre: limpio });
    setNombre("");
    setAbierto(false);
  };

  const guardarCambios = async () => {
    if (!deOrigen || Object.keys(lista).length > MAX_ITEMS)
      return avisar("limite_listas");
    await persistir(
      leerLocales().map((l) =>
        l.nombre === deOrigen.nombre ? actualizarLista(l, lista) : l,
      ),
    );
    setGuardadas(leerLocales());
    avisar("lista_actualizada", { nombre: deOrigen.nombre });
  };

  if (!abierto)
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {deOrigen && (
          <>
            <span
              data-testid="lista-origen"
              className="text-xs text-muted-foreground"
            >
              Viene de «{deOrigen.nombre}»
              {sinGuardar && " · cambios sin guardar"}
            </span>
            <button
              type="button"
              data-testid="guardar-cambios"
              disabled={!sinGuardar}
              onClick={() => void guardarCambios()}
              className={`${BOTON} disabled:opacity-60`}
            >
              Guardar cambios en «{deOrigen.nombre}»
            </button>
          </>
        )}
        <button
          type="button"
          data-tour="boton-guardar"
          data-testid="guardar-lista"
          onClick={() => setAbierto(true)}
          className={BOTON}
        >
          {deOrigen ? "Guardar como nueva" : "Guardar lista"}
        </button>
      </div>
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void guardar();
      }}
      className="flex flex-wrap items-center gap-1.5"
    >
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        maxLength={60}
        required
        // biome-ignore lint/a11y/noAutofocus: la persona acaba de pulsar "Guardar lista"
        autoFocus
        aria-label="Nombre de la lista"
        placeholder="Nombre de la lista"
        className="h-9 min-w-0 flex-1 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
      />
      <button
        type="submit"
        className="rounded-[10px] bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
      >
        Guardar
      </button>
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className={`${BOTON} font-medium`}
      >
        Cancelar
      </button>
    </form>
  );
}
