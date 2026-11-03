"use client";

import type { ProductoCatalogo } from "@/lib/datos";
import { pesos } from "@/lib/formato";
import { faltantesDe, type ProductoElegido } from "@/lib/importar/decidir";
import { UNIDADES } from "@/lib/importar/factura";
import type { FilaRevision, ModoFila } from "@/lib/importar/tipos";
import { RUBROS_SUGERIDOS } from "@/lib/presupuesto/defaults";
import { DecisionFila } from "./decision-fila";

const campo = "w-full rounded-[10px] border bg-card px-2 py-1.5 text-sm";

const ETIQUETA: Record<ModoFila, string> = {
  crear: "producto nuevo",
  existente: "ya existe",
  solo_gasto: "solo gasto",
};

type Props = {
  f: FilaRevision;
  /** Línea de la primera fila del mismo producto, tienda y fecha; la fila repetida no trae sus propios controles. */
  repiteDe?: number;
  conSesion: boolean;
  productos: ProductoCatalogo[];
  seleccionada: boolean;
  onSeleccion: (v: boolean) => void;
  onFila: (parche: Partial<FilaRevision>) => void;
  onDecidir: (modo: ModoFila, producto?: ProductoElegido) => void;
  onQuitar: () => void;
};

export function FilaFactura(p: Props) {
  const { f } = p;
  const faltantes = faltantesDe(f);
  return (
    <fieldset
      id={`fila-${f.linea}`}
      tabIndex={-1}
      className="grid gap-2 rounded-[12px] border p-2.5 sm:grid-cols-6"
    >
      <legend className="px-1 text-xs text-muted-foreground">
        Línea {f.linea}
        {p.conSesion && ` · ${ETIQUETA[f.modo]}`}
        {f.duda && " · con duda"}
        {!f.duda && faltantes.length > 0 && " · por completar"}
      </legend>
      {(f.duda || faltantes.length > 0) && (
        <p role="status" className="text-xs text-warn-ink sm:col-span-6">
          {f.duda && (
            <>
              <strong>Pregunta:</strong> {f.duda}{" "}
            </>
          )}
          {faltantes.length > 0 && (
            <>Falta {faltantes.join(", ")}: corrígelo o quita la fila.</>
          )}
        </p>
      )}
      {p.repiteDe !== undefined ? (
        <p className="text-sm sm:col-span-3">
          <strong>{f.producto}</strong>
          <span className="block text-xs text-muted-foreground">
            Misma decisión que la línea {p.repiteDe}
          </span>
        </p>
      ) : (
        <>
          <label className="flex items-center gap-2 text-xs sm:col-span-6">
            <input
              type="checkbox"
              className="size-6"
              checked={p.seleccionada}
              onChange={(e) => p.onSeleccion(e.target.checked)}
            />
            Elegir esta línea para una acción masiva
          </label>
          <input
            aria-label="Producto"
            className={`${campo} sm:col-span-3`}
            value={f.producto}
            onChange={(e) => p.onFila({ producto: e.target.value })}
          />
        </>
      )}
      <input
        aria-label="Cantidad"
        inputMode="decimal"
        className={campo}
        value={f.cantidad}
        onChange={(e) =>
          p.onFila({ cantidad: Number(e.target.value.replace(",", ".")) || 0 })
        }
      />
      <input
        aria-label="Precio total"
        inputMode="numeric"
        className={campo}
        value={f.precioTotal}
        onChange={(e) =>
          p.onFila({
            precioTotal: Number(e.target.value.replace(/\D/g, "")) || 0,
          })
        }
      />
      <p className="self-center text-xs text-muted-foreground tabular-nums">
        {f.cantidad > 0 ? `${pesos(f.precioTotal / f.cantidad)} c/u` : "—"}
      </p>
      {p.conSesion && p.repiteDe === undefined && (
        <DecisionFila
          f={f}
          productos={p.productos}
          onDecidir={p.onDecidir}
          onFila={p.onFila}
        />
      )}
      <select
        aria-label="Rubro"
        className={`${campo} sm:col-span-2`}
        value={f.rubro}
        onChange={(e) => p.onFila({ rubro: e.target.value })}
      >
        {RUBROS_SUGERIDOS.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <select
        aria-label="Unidad"
        className={campo}
        value={f.unidad}
        onChange={(e) => p.onFila({ unidad: e.target.value })}
      >
        {UNIDADES.map((u) => (
          <option key={u}>{u}</option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-xs sm:col-span-2">
        <input
          type="checkbox"
          checked={f.promocion}
          onChange={(e) => p.onFila({ promocion: e.target.checked })}
        />
        Promoción
      </label>
      {p.conSesion && f.modo !== "solo_gasto" && (
        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={f.publicarPrecio}
            onChange={(e) => p.onFila({ publicarPrecio: e.target.checked })}
          />
          Publicar precio
        </label>
      )}
      <button
        type="button"
        className="rounded-[10px] border px-2 py-1 text-xs sm:col-span-2 [@media(pointer:coarse)]:min-h-11"
        onClick={p.onQuitar}
      >
        Quitar fila
      </button>
    </fieldset>
  );
}
