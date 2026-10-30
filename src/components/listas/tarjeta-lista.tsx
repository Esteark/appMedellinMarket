"use client";

import { useState } from "react";
import type { ListaGuardada } from "@/lib/listas/guardadas";

type Props = {
  lista: ListaGuardada;
  alCargar: () => void;
  alSumar: () => void;
  alRenombrar: (nuevo: string) => void;
  alDuplicar: () => void;
  alEliminar: () => void;
  alExportar: () => void;
};

const BOTON =
  "rounded-[10px] border bg-background px-3 py-1.5 text-sm font-medium";

/** Una lista guardada con sus acciones. */
export function TarjetaLista(p: Props) {
  const { lista } = p;
  const [renombrando, setRenombrando] = useState(false);
  const [nuevo, setNuevo] = useState(lista.nombre);
  const n = Object.keys(lista.items).length;

  return (
    <li
      data-testid={`lista-guardada-${lista.nombre}`}
      className="flex flex-col gap-2.5 rounded-[14px] border bg-card p-3.5"
    >
      {renombrando ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            p.alRenombrar(nuevo);
            setRenombrando(false);
          }}
          className="flex flex-wrap gap-1.5"
        >
          <input
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            maxLength={60}
            required
            // biome-ignore lint/a11y/noAutofocus: la persona acaba de pulsar "Renombrar"
            autoFocus
            aria-label={`Nuevo nombre de ${lista.nombre}`}
            className="h-9 min-w-0 flex-1 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
          />
          <button type="submit" className={BOTON}>
            Guardar nombre
          </button>
          <button
            type="button"
            onClick={() => setRenombrando(false)}
            className={BOTON}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <div>
          <h2 className="text-base font-semibold">{lista.nombre}</h2>
          <p className="text-xs text-muted-foreground">
            {n} {n === 1 ? "producto" : "productos"} · actualizada{" "}
            {lista.actualizada.slice(0, 10)}
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={p.alCargar} className={BOTON}>
          Cargar
        </button>
        <button type="button" onClick={p.alSumar} className={BOTON}>
          Sumar a mi lista
        </button>
        <button
          type="button"
          onClick={() => setRenombrando(true)}
          className={BOTON}
        >
          Renombrar
        </button>
        <button type="button" onClick={p.alDuplicar} className={BOTON}>
          Duplicar
        </button>
        <button type="button" onClick={p.alExportar} className={BOTON}>
          Exportar JSON
        </button>
        <button
          type="button"
          onClick={p.alEliminar}
          className="rounded-[10px] px-3 py-1.5 text-sm font-medium text-up-ink"
        >
          Eliminar
        </button>
      </div>
    </li>
  );
}
