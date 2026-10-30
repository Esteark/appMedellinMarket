"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { anotar, quitarAnotado } from "@/app/anotados/acciones";
import { BotonEnviar } from "@/components/cargando";
import { avisar, textoAviso } from "@/lib/avisos";
import { pesos } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Props = {
  producto: { id: string; nombre: string };
  tienda: { id: string; nombre: string };
  precio: number | null;
  estado: string | null;
  /** Es el precio más bajo de la fila: va resaltado en azul. */
  minimo: boolean;
  conSesion: boolean;
  editando: boolean;
  alEditar: () => void;
  alCerrar: () => void;
};

type Accion = (
  d: FormData,
) => Promise<{ ok: true } | { ok: false; error: string }>;

const ERRORES: Record<string, string> = {
  invalido: textoAviso("anotado_invalido"),
  ajeno: "Solo puedes quitar los precios que anotaste tú.",
  sin_sesion: textoAviso("sesion_expirada"),
};

/** Una celda producto × tienda: muestra el precio efectivo y, al pulsarla, permite anotar uno. */
export function Celda(props: Props) {
  const { producto, tienda, precio, estado, minimo, conSesion } = props;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const correr = async (
    accion: Accion,
    datos: FormData,
    alTerminar: () => void,
  ) => {
    try {
      const r = await accion(datos);
      if (!r.ok) {
        // El error queda junto al campo; el toast lo refuerza.
        setError(ERRORES[r.error] ?? `No se pudo guardar: ${r.error}`);
        if (r.error === "invalido") avisar("anotado_invalido");
        if (r.error === "sin_sesion") avisar("sesion_expirada");
        return;
      }
      setError(null);
      alTerminar();
      props.alCerrar();
      router.refresh();
    } catch {
      avisar("sin_conexion");
    }
  };

  if (!props.editando)
    return (
      <button
        type="button"
        data-testid={`celda-${producto.id}-${tienda.id}`}
        data-origen={estado ?? undefined}
        data-minimo={minimo || undefined}
        aria-label={`${producto.nombre} en ${tienda.nombre}: ${precio == null ? "sin precio" : pesos(precio)}${estado === "anotado" ? " (anotado)" : ""}. Anotar precio`}
        onClick={() => {
          if (conSesion) return props.alEditar();
          avisar(
            "anotar_sin_sesion",
            {},
            { texto: "Ingresar", alPulsar: () => router.push("/ingresar") },
          );
        }}
        className={cn(
          "w-full rounded-lg px-2 py-1.5 text-right whitespace-nowrap tabular-nums hover:bg-secondary",
          minimo && "bg-anot-bg font-semibold text-anot-ink hover:bg-anot-bg",
          precio == null && "text-muted-foreground",
        )}
      >
        {precio == null ? "—" : pesos(precio)}
        {estado === "anotado" && (
          <span aria-hidden="true" className="ml-1 text-xs" title="Anotado">
            ✎
          </span>
        )}
      </button>
    );

  return (
    <form
      action={(d) =>
        correr(anotar, d, () => {
          const n = Number(String(d.get("precio")).replace(/[.\s$]/g, ""));
          avisar("precio_corregido", {
            precio: pesos(n),
            tienda: tienda.nombre,
          });
        })
      }
      onKeyDown={(e) => {
        if (e.key === "Escape") props.alCerrar();
      }}
      className="flex min-w-44 flex-col gap-1.5 rounded-lg border border-anot bg-card p-2 text-left"
    >
      <input type="hidden" name="producto" value={producto.id} />
      <input type="hidden" name="tienda" value={tienda.id} />
      <input
        name="precio"
        inputMode="numeric"
        // biome-ignore lint/a11y/noAutofocus: el usuario acaba de pulsar la celda para editarla
        autoFocus
        required
        defaultValue={precio ?? ""}
        aria-label={`Precio de ${producto.nombre} en ${tienda.nombre}`}
        aria-invalid={!!error}
        className="h-9 rounded-[10px] border border-input bg-background px-2 text-right text-base tabular-nums sm:text-sm"
      />
      {error && (
        <p role="alert" className="text-xs text-up-ink">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5 text-xs">
        <BotonEnviar className="rounded-lg bg-primary px-2.5 py-1 font-semibold text-primary-foreground">
          Guardar
        </BotonEnviar>
        <button
          type="button"
          onClick={props.alCerrar}
          className="rounded-lg border px-2.5 py-1 font-medium"
        >
          Cancelar
        </button>
        {estado === "anotado" && (
          <button
            type="submit"
            formAction={(d) => correr(quitarAnotado, d, () => {})}
            className="rounded-lg px-1.5 py-1 font-medium text-up-ink underline underline-offset-2"
          >
            Quitar anotado
          </button>
        )}
      </div>
    </form>
  );
}
