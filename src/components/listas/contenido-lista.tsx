"use client";

import { useState } from "react";
import { avisar } from "@/lib/avisos";
import { normalizarNombre } from "@/lib/importar/emparejar";
import {
  agregarItem,
  ajustarItem,
  type Items,
  mismosItems,
  quitarItem,
} from "@/lib/listas/guardadas";

export type ProductoLista = {
  id: string;
  nombre: string;
  emoji: string | null;
};

const mini =
  "rounded-[10px] border bg-background px-2.5 py-1 text-sm font-medium";

type Props = {
  items: Items;
  productos: ProductoLista[];
  alGuardar: (items: Items) => void;
};

/** Productos de una lista guardada: cantidades, quitar y agregar sobre un borrador que se guarda o se descarta. */
export function ContenidoLista({ items, productos, alGuardar }: Props) {
  const [borrador, setBorrador] = useState<Items>(items);
  const [busqueda, setBusqueda] = useState("");
  const porId = new Map(productos.map((p) => [p.id, p]));
  const nombre = (id: string) => porId.get(id)?.nombre ?? "producto retirado";
  const filas = Object.keys(borrador).sort((a, b) =>
    nombre(a).localeCompare(nombre(b)),
  );
  const cambiado = !mismosItems(borrador, items);
  const q = normalizarNombre(busqueda);
  const candidatos = productos.filter(
    (p) =>
      !(p.id in borrador) && (!q || normalizarNombre(p.nombre).includes(q)),
  );

  const agregar = (id: string) => {
    const r = id ? agregarItem(borrador, id) : borrador;
    if (r === null) return avisar("limite_listas");
    setBorrador(r);
  };

  return (
    <div data-testid="contenido-lista" className="flex flex-col gap-2">
      <ul className="flex flex-col divide-y rounded-[12px] border">
        {filas.map((id) => (
          <li key={id} className="flex items-center gap-2 px-2.5 py-1.5">
            <span className="min-w-0 flex-1 truncate text-sm">
              {porId.get(id)?.emoji} {nombre(id)}
            </span>
            <button
              type="button"
              aria-label={`Una unidad menos de ${nombre(id)}`}
              onClick={() => setBorrador(ajustarItem(borrador, id, -1))}
              className={mini}
            >
              −
            </button>
            <span className="w-8 text-center text-sm tabular-nums">
              {borrador[id]}
            </span>
            <button
              type="button"
              aria-label={`Una unidad más de ${nombre(id)}`}
              onClick={() => setBorrador(ajustarItem(borrador, id, 1))}
              className={mini}
            >
              +
            </button>
            <button
              type="button"
              aria-label={`Quitar ${nombre(id)} de la lista`}
              onClick={() => setBorrador(quitarItem(borrador, id))}
              className="rounded-[10px] px-2 py-1 text-sm text-up-ink"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
      {filas.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Una lista guardada necesita al menos un producto; para vaciarla,
          elimínala.
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        <input
          type="search"
          aria-label="Buscar producto para agregar"
          placeholder="Buscar producto…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="h-9 min-w-0 flex-1 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
        />
        <select
          aria-label="Agregar producto"
          value=""
          onChange={(e) => agregar(e.target.value)}
          className="h-9 max-w-full rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
        >
          <option value="">Agregar producto…</option>
          {candidatos.slice(0, 60).map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={!cambiado || filas.length === 0}
          onClick={() => alGuardar(borrador)}
          className="rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
        >
          Guardar cambios
        </button>
        <button
          type="button"
          disabled={!cambiado}
          onClick={() => setBorrador(items)}
          className={`${mini} disabled:opacity-60`}
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
