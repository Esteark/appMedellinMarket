"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { anotar, quitarAnotado } from "@/app/anotados/acciones";
import { BotonEnviar } from "@/components/cargando";
import { Hoja } from "@/components/hoja";
import { avisar, textoAviso } from "@/lib/avisos";
import { pesos } from "@/lib/formato";

type Props = {
  producto: { id: string; nombre: string };
  tiendas: { id: string; nombre: string }[];
  tiendaInicial: string;
  /** Precio efectivo por tienda, para precargar el campo. */
  precios: Record<string, number | null>;
  /** Tienda cuyo precio efectivo es una corrección a mano (se puede quitar). */
  corregidaEn: string | null;
  alCerrar: () => void;
};

const ERRORES: Record<string, string> = {
  invalido: textoAviso("anotado_invalido"),
  ajeno: "Solo puedes quitar los precios que corregiste tú.",
  sin_sesion: textoAviso("sesion_expirada"),
};

/** Hoja para corregir a mano el precio de un producto en una tienda (global y con autor). */
export function CorregirPrecio(props: Props) {
  const { producto, tiendas, precios } = props;
  const router = useRouter();
  const titulo = useId();
  const [tienda, setTienda] = useState(props.tiendaInicial);
  const [error, setError] = useState<string | null>(null);
  const nombre = tiendas.find((t) => t.id === tienda)?.nombre ?? tienda;

  const correr = async (
    accion: typeof anotar,
    datos: FormData,
    alTerminar: () => void,
  ) => {
    try {
      const r = await accion(datos);
      if (!r.ok) {
        setError(ERRORES[r.error] ?? `No se pudo guardar: ${r.error}`);
        if (r.error === "invalido") avisar("anotado_invalido");
        if (r.error === "sin_sesion") avisar("sesion_expirada");
        return;
      }
      alTerminar();
      props.alCerrar();
      router.refresh();
    } catch {
      avisar("sin_conexion");
    }
  };

  return (
    <Hoja titulo={titulo} alCerrar={props.alCerrar}>
      <form
        action={(d) =>
          correr(anotar, d, () => {
            const n = Number(String(d.get("precio")).replace(/[.\s$]/g, ""));
            avisar("precio_corregido", { precio: pesos(n), tienda: nombre });
          })
        }
        className="flex flex-col gap-3"
      >
        <h2 id={titulo} className="pr-20 text-lg font-bold">
          Corregir precio · {producto.nombre}
        </h2>
        <p className="text-sm text-muted-foreground">
          Queda como corregido a mano, con tu nombre y la fecha de hoy. El
          precio automático no se borra.
        </p>
        <input type="hidden" name="producto" value={producto.id} />
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tienda
          <select
            name="tienda"
            value={tienda}
            onChange={(e) => setTienda(e.target.value)}
            className="h-10 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
          >
            {tiendas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Precio
          <input
            key={tienda}
            name="precio"
            inputMode="numeric"
            required
            defaultValue={precios[tienda] ?? ""}
            aria-invalid={!!error}
            className="h-10 rounded-[10px] border border-input bg-background px-2 text-right text-base tabular-nums sm:text-sm"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-up-ink">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <BotonEnviar className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Guardar
          </BotonEnviar>
          {props.corregidaEn === tienda && (
            <button
              type="submit"
              formAction={(d) =>
                correr(quitarAnotado, d, () => avisar("correccion_quitada"))
              }
              className="rounded-[10px] px-3 py-2 text-sm font-medium text-up-ink underline underline-offset-2"
            >
              Quitar corrección
            </button>
          )}
        </div>
      </form>
    </Hoja>
  );
}
