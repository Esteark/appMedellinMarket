"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  agregarProducto,
  quitarProducto,
} from "@/app/anotados/barrio/acciones";
import { CorregirPrecio } from "@/components/precios/corregir-precio";
import { GRUPOS_BARRIO } from "@/data/barrio";
import { avisar } from "@/lib/avisos";
import type { FilaBarrio } from "@/lib/datos";
import { FilaBarrioItem } from "./fila-barrio";

type Props = {
  filas: FilaBarrio[];
  disponibles: { id: string; nombre: string; grupo: string }[];
  conSesion: boolean;
};

const BARRIO = { id: "barrio", nombre: "Tienda/Carnicería de barrio" };

/** Vista propia de la tienda de barrio: todo a mano, sin precios de referencia. */
export function Barrio({ filas, disponibles, conSesion }: Props) {
  const router = useRouter();
  const [editando, setEditando] = useState<FilaBarrio | null>(null);
  const [nuevo, setNuevo] = useState("");

  const conPrecio = filas.filter((f) => f.precio != null).length;
  const vencidos = filas.filter((f) => f.porActualizar).length;
  const pct = filas.length ? Math.round((conPrecio / filas.length) * 100) : 0;

  const pedirSesion = () =>
    avisar(
      "anotar_sin_sesion",
      {},
      { texto: "Ingresar", alPulsar: () => router.push("/ingresar") },
    );

  const agregar = async () => {
    if (!conSesion) return pedirSesion();
    const p = disponibles.find((d) => d.id === nuevo);
    if (!p) return;
    const r = await agregarProducto(p.id);
    if (!r.ok) return avisar("sesion_expirada");
    avisar("barrio_producto_agregado", { producto: p.nombre });
    setNuevo("");
    router.refresh();
  };

  const quitar = async (f: FilaBarrio) => {
    if (!conSesion) return pedirSesion();
    const r = await quitarProducto(f.id);
    if (!r.ok) return avisar("sesion_expirada");
    avisar("barrio_producto_quitado", { producto: f.nombre });
    router.refresh();
  };

  // Los cuatro grupos de siempre y, si agregaron algo de otro grupo, ese grupo al final.
  const grupos: string[] = [...GRUPOS_BARRIO];
  for (const f of filas) if (!grupos.includes(f.grupo)) grupos.push(f.grupo);

  return (
    <div className="flex flex-col gap-4">
      <section
        data-tour="barrio-progreso"
        aria-label="Progreso"
        className="flex flex-col gap-1.5"
      >
        <p data-testid="barrio-progreso" className="text-sm font-semibold">
          {conPrecio}/{filas.length} con precio · {vencidos} por actualizar
        </p>
        <div
          role="progressbar"
          aria-valuenow={conPrecio}
          aria-valuemin={0}
          aria-valuemax={filas.length}
          aria-label="Productos con precio"
          className="h-2 overflow-hidden rounded-full bg-secondary"
        >
          <div className="h-full bg-anot" style={{ width: `${pct}%` }} />
        </div>
      </section>
      {grupos.map((g) => {
        const delGrupo = filas.filter((f) => f.grupo === g);
        if (!delGrupo.length) return null;
        return (
          <section
            key={g}
            className="flex flex-col rounded-[14px] border bg-card px-3.5 py-2"
          >
            <h2 className="pt-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {g}
            </h2>
            <ul className="divide-y">
              {delGrupo.map((f) => (
                <FilaBarrioItem
                  key={f.id}
                  fila={f}
                  alCorregir={() =>
                    conSesion ? setEditando(f) : pedirSesion()
                  }
                  alQuitar={() => quitar(f)}
                />
              ))}
            </ul>
          </section>
        );
      })}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          aria-label="Producto para agregar al catálogo de barrio"
          className="h-10 min-w-0 flex-1 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
        >
          <option value="">Agregar producto del catálogo…</option>
          {disponibles.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!nuevo}
          onClick={agregar}
          className="h-10 rounded-[10px] border bg-background px-3 text-sm font-medium disabled:opacity-35"
        >
          Agregar producto
        </button>
      </div>
      {editando && (
        <CorregirPrecio
          producto={editando}
          tiendas={[BARRIO]}
          tiendaInicial="barrio"
          precios={{ barrio: editando.precio }}
          corregidaEn={editando.precio != null ? "barrio" : null}
          alCerrar={() => setEditando(null)}
        />
      )}
    </div>
  );
}
