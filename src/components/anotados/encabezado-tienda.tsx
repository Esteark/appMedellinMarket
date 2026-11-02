"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { renombrarTienda } from "@/app/tiendas/acciones";
import { avisar, textoAviso } from "@/lib/avisos";
import { claveAviso } from "@/lib/importar/factura";

type Tienda = { id: string; nombre: string; color: string; manual: boolean };

/** Cabecera de una tienda en la tabla de Anotados; con sesión se le puede cambiar el nombre en el sitio. */
export function EncabezadoTienda({
  tienda,
  conSesion,
}: {
  tienda: Tienda;
  conSesion: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(tienda.nombre);
  const [error, setError] = useState<string | null>(null);

  const cerrar = () => {
    setEditando(false);
    setError(null);
  };
  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    if (nombre.trim() === tienda.nombre) return cerrar();
    try {
      const r = await renombrarTienda(tienda.id, nombre);
      if (!r.ok) return setError(textoAviso(claveAviso(r.error)));
      avisar("tienda_renombrada", { nombre: nombre.trim() });
      router.refresh();
      cerrar();
    } catch {
      setError(textoAviso("sin_conexion"));
    }
  };

  return (
    <>
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="size-2 rounded-full"
          style={{ backgroundColor: tienda.color }}
        />
        {editando ? (
          <form
            noValidate
            onSubmit={guardar}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                cerrar();
              }
            }}
            className="flex items-center gap-1"
          >
            <input
              aria-label={`Nuevo nombre de ${tienda.nombre}`}
              value={nombre}
              maxLength={60}
              onChange={(e) => {
                setNombre(e.target.value);
                setError(null);
              }}
              className="h-8 w-32 rounded-[10px] border border-input bg-background px-2 text-base font-normal sm:text-sm"
            />
            <button
              type="submit"
              className="rounded-[10px] border px-2 py-1 text-xs"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={cerrar}
              className="rounded-[10px] border px-2 py-1 text-xs"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            {tienda.nombre}
            {conSesion && (
              <button
                type="button"
                aria-label={`Renombrar ${tienda.nombre}`}
                onClick={() => {
                  setNombre(tienda.nombre);
                  setEditando(true);
                }}
                className="rounded-[10px] px-1 text-xs text-muted-foreground hover:bg-secondary"
              >
                ✎
              </button>
            )}
          </>
        )}
      </span>
      {error && (
        <span
          role="alert"
          className="block text-[10.5px] font-normal text-up-ink"
        >
          {error}
        </span>
      )}
      {tienda.manual && (
        <span className="block text-[10.5px] font-normal">solo anotados</span>
      )}
    </>
  );
}
