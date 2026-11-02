"use client";

import type { ErrorCsv } from "@/lib/importar/tipos";
import { PanelPrompt } from "./prompt";

type Props = {
  texto: string;
  fechaLote: string;
  mensaje: string;
  errores: ErrorCsv[];
  onTexto: (t: string) => void;
  onFecha: (f: string) => void;
  onArchivo: (f: File) => void;
  onRevisar: () => void;
};

/** Primera pantalla: el CSV llega por archivo o pegado; nada se sube a ningún servidor. */
export function OrigenFactura(p: Props) {
  const soloCabecera = p.errores.every(
    (e) => e.mensaje === "cabecera_invalida",
  );
  return (
    <section
      data-testid="importar-origen"
      className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5"
    >
      <h2 className="text-lg font-bold">Importar factura</h2>
      <PanelPrompt />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: zona de arrastre; el selector de archivo es la alternativa con teclado */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) p.onArchivo(f);
        }}
        className="flex flex-col gap-2 rounded-[12px] border border-dashed p-3 text-sm"
      >
        <label>
          Archivo .csv (arrástralo aquí o elígelo)
          <input
            type="file"
            accept=".csv,text/csv"
            data-testid="importar-archivo"
            className="mt-1 block w-full text-sm"
            onChange={(e) =>
              e.target.files?.[0] && p.onArchivo(e.target.files[0])
            }
          />
        </label>
        <label>
          …o pega el CSV
          <textarea
            data-testid="importar-texto"
            rows={8}
            value={p.texto}
            onChange={(e) => p.onTexto(e.target.value)}
            className="mt-1 w-full rounded-[10px] border bg-card p-2 font-mono text-xs"
          />
        </label>
      </div>
      <label className="text-sm">
        Fecha del lote (para filas sin fecha)
        <input
          type="date"
          value={p.fechaLote}
          onChange={(e) => p.onFecha(e.target.value)}
          className="ml-2 rounded-[10px] border px-2 py-1"
        />
      </label>
      {p.mensaje && (
        <p role="alert" className="text-sm text-up-ink">
          {p.mensaje}
        </p>
      )}
      {p.errores.length > 0 && (
        <ul
          role={soloCabecera ? "alert" : "status"}
          className={`text-sm ${soloCabecera ? "text-up-ink" : "text-warn-ink"}`}
        >
          {p.errores.slice(0, 8).map((e) => (
            <li key={`${e.linea}-${e.mensaje}`}>
              {e.linea === 0
                ? e.mensaje.replace(/_/g, " ")
                : `Línea ${e.linea}: ${e.mensaje.replace(/_/g, " ")}`}
            </li>
          ))}
          {!soloCabecera && (
            <li>
              Las filas con dudas se muestran en la revisión para corregirlas.
            </li>
          )}
        </ul>
      )}
      <div>
        <button
          type="button"
          disabled={!p.texto.trim()}
          onClick={p.onRevisar}
          className="rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
        >
          Revisar
        </button>
      </div>
    </section>
  );
}
