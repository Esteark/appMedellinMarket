"use client";

import { useState } from "react";
import { avisar } from "@/lib/avisos";
import {
  leerLocales,
  MAX_ITEMS,
  MAX_LISTAS,
  normalizarNombre,
} from "@/lib/listas/guardadas";
import type { Lista } from "@/lib/precios/lista";
import { persistir } from "./almacen";

/** Guarda la lista activa con nombre. No pisa una lista que ya tiene ese nombre. */
export function BotonGuardar({ lista }: { lista: Lista }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");

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
    avisar("lista_guardada", { nombre: limpio });
    setNombre("");
    setAbierto(false);
  };

  if (!abierto)
    return (
      <button
        type="button"
        data-tour="boton-guardar"
        data-testid="guardar-lista"
        onClick={() => setAbierto(true)}
        className="rounded-[10px] border bg-background px-3 py-1.5 text-sm font-medium"
      >
        Guardar lista
      </button>
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
        className="rounded-[10px] border px-3 py-1.5 text-sm font-medium"
      >
        Cancelar
      </button>
    </form>
  );
}
