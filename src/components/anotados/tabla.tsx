"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FilaAnotados, TiendaCatalogo } from "@/lib/datos";
import { Celda } from "./celda";

const normal = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

type Props = {
  tiendas: (TiendaCatalogo & { manual: boolean })[];
  filas: FilaAnotados[];
  conSesion: boolean;
};

/** Producto × tienda con el mínimo en azul; ancha: se desliza con la columna de producto fija. */
export function TablaAnotados({ tiendas, filas, conSesion }: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const visibles = useMemo(() => {
    const q = normal(busqueda.trim());
    return q ? filas.filter((f) => normal(f.nombre).includes(q)) : filas;
  }, [filas, busqueda]);

  return (
    <div data-tour="anotados-tabla" className="flex flex-col gap-3">
      {!conSesion && (
        <p className="rounded-xl bg-anot-bg px-3.5 py-2.5 text-sm text-anot-ink">
          Cualquiera puede ver estos precios.{" "}
          <Link
            href="/ingresar"
            className="font-semibold underline underline-offset-2"
          >
            Inicia sesión
          </Link>{" "}
          para anotar los que veas en la tienda.
        </p>
      )}
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar producto"
        aria-label="Buscar producto"
        className="h-10 rounded-[10px] border border-input bg-card px-3 text-base sm:text-sm"
      />
      {/* Alto máximo: así la fila de tiendas y la columna de producto quedan fijas al desplazar. */}
      <div className="max-h-[75vh] overflow-auto rounded-[14px] border bg-card">
        <table
          className="w-full border-collapse text-sm"
          data-testid="tabla-anotados"
        >
          <caption className="sr-only">
            Precio de cada producto por tienda; el más bajo de cada fila va en
            azul
          </caption>
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th
                scope="col"
                className="sticky top-0 left-0 z-30 bg-card px-3 py-2.5 text-left font-semibold"
              >
                Producto
              </th>
              {tiendas.map((t) => (
                <th
                  key={t.id}
                  scope="col"
                  className="sticky top-0 z-20 bg-card px-2 py-2.5 text-right font-semibold whitespace-nowrap shadow-[inset_0_-1px_0_var(--border)]"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="size-2 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    {t.nombre}
                  </span>
                  {t.manual && (
                    <span className="block text-[10.5px] font-normal">
                      solo anotados
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => {
              const precios = Object.values(f.celdas)
                .map((c) => c.precio)
                .filter((p): p is number => p != null);
              const minimo = precios.length ? Math.min(...precios) : null;
              return (
                <tr key={f.id} className="border-b last:border-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-44 bg-card px-3 py-1.5 text-left font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">{f.emoji}</span>
                      <span className="min-w-0">
                        <span className="block truncate">{f.nombre}</span>
                        <span className="block text-xs font-normal text-muted-foreground">
                          {f.unidad}
                        </span>
                      </span>
                    </span>
                  </th>
                  {tiendas.map((t) => {
                    const c = f.celdas[t.id];
                    const clave = `${f.id}|${t.id}`;
                    return (
                      <td key={t.id} className="px-1 py-1 align-top">
                        <Celda
                          producto={f}
                          tienda={t}
                          precio={c?.precio ?? null}
                          estado={c?.estado ?? null}
                          minimo={c?.precio != null && c.precio === minimo}
                          conSesion={conSesion}
                          editando={editando === clave}
                          alEditar={() => setEditando(clave)}
                          alCerrar={() => setEditando(null)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {visibles.length === 0 && (
          <p className="p-6 text-center text-muted-foreground">
            Ningún producto coincide con la búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}
