"use client";

import { pesos } from "@/lib/formato";
import { UNIDADES } from "@/lib/importar/factura";
import { agrupar, type Grupo, noCuadra } from "@/lib/importar/grupos";
import type { FilaRevision } from "@/lib/importar/tipos";
import { RUBROS_SUGERIDOS } from "@/lib/presupuesto/defaults";

const campo = "w-full rounded-[10px] border bg-card px-2 py-1.5 text-sm";

type Props = {
  filas: FilaRevision[];
  fechaLote: string;
  conSesion: boolean;
  publicar: boolean;
  totales: Record<string, string>;
  notas: string[];
  confirmaNuevos: boolean;
  guardando: boolean;
  incompletas: number;
  onFila: (i: number, parche: Partial<FilaRevision>) => void;
  onGrupo: (g: Grupo, parche: { tienda?: string; fecha?: string }) => void;
  onQuitar: (i: number) => void;
  onPublicar: (v: boolean) => void;
  onTotal: (clave: string, v: string) => void;
  onConfirma: (v: boolean) => void;
  onActualizar: () => void;
  onGuardar: () => void;
  onVolver: () => void;
};

export function RevisionFactura(p: Props) {
  const grupos = agrupar(p.filas, p.fechaLote);
  const nuevos =
    p.conSesion &&
    p.publicar &&
    p.filas.some((f) => f.nuevo || f.tiendaId === null);

  return (
    <section data-testid="importar-revision" className="flex flex-col gap-3">
      {p.notas.length > 0 && (
        <ul
          role="status"
          className="rounded-[12px] border bg-warn-bg p-2.5 text-sm text-warn-ink"
        >
          {p.notas.map((n) => (
            <li key={n}>Dudosa: {n}</li>
          ))}
        </ul>
      )}
      {p.conSesion ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={p.publicar}
            onChange={(e) => p.onPublicar(e.target.checked)}
          />
          Publicar los precios para todos (cambia totales y mejor tienda)
        </label>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sin sesión: solo se guardan tus gastos en este dispositivo. Inicia
          sesión para actualizar el catálogo.
        </p>
      )}
      {grupos.map((g) => {
        const suma = g.indices.reduce((s, i) => s + p.filas[i].precioTotal, 0);
        const impreso = Number(p.totales[g.clave]);
        return (
          <div
            key={p.filas[g.indices[0]].linea}
            data-testid="grupo-importacion"
            className="flex flex-col gap-2 rounded-[14px] border bg-card p-3.5"
          >
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="text-xs text-muted-foreground">
                Tienda
                <input
                  className={campo}
                  value={g.tienda}
                  onChange={(e) => p.onGrupo(g, { tienda: e.target.value })}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Fecha
                <input
                  type="date"
                  className={campo}
                  value={g.fecha}
                  onChange={(e) => p.onGrupo(g, { fecha: e.target.value })}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Total impreso (opcional)
                <input
                  inputMode="numeric"
                  className={campo}
                  value={p.totales[g.clave] ?? ""}
                  onChange={(e) =>
                    p.onTotal(g.clave, e.target.value.replace(/\D/g, ""))
                  }
                />
              </label>
            </div>
            <p className="text-sm tabular-nums">
              Suma de líneas: <strong>{pesos(suma)}</strong>
              {impreso > 0 && noCuadra(suma, impreso) && (
                <span role="alert" className="ml-2 text-warn-ink">
                  No cuadra con el total impreso ({pesos(impreso)}).
                </span>
              )}
            </p>
            {g.indices.map((i) => {
              const f = p.filas[i];
              const faltantes = [
                !f.producto.trim() && "producto",
                !f.tienda.trim() && "tienda",
                f.cantidad < 0.001 && "cantidad",
                f.precioTotal < 1 && "precio",
              ].filter(Boolean) as string[];
              return (
                <fieldset
                  key={f.linea}
                  className="grid gap-2 rounded-[12px] border p-2.5 sm:grid-cols-6"
                >
                  <legend className="px-1 text-xs text-muted-foreground">
                    Línea {f.linea}
                    {p.conSesion && f.nuevo && " · producto nuevo"}
                    {f.duda && " · con duda"}
                    {!f.duda && faltantes.length > 0 && " · por completar"}
                  </legend>
                  {(f.duda || faltantes.length > 0) && (
                    <p
                      role="status"
                      className="text-xs text-warn-ink sm:col-span-6"
                    >
                      {f.duda && (
                        <>
                          <strong>Pregunta:</strong> {f.duda}{" "}
                        </>
                      )}
                      {faltantes.length > 0 && (
                        <>
                          Falta {faltantes.join(", ")}: corrígelo o quita la
                          fila.
                        </>
                      )}
                    </p>
                  )}
                  <input
                    aria-label="Producto"
                    className={`${campo} sm:col-span-3`}
                    value={f.producto}
                    onChange={(e) => p.onFila(i, { producto: e.target.value })}
                  />
                  <input
                    aria-label="Cantidad"
                    inputMode="decimal"
                    className={campo}
                    value={f.cantidad}
                    onChange={(e) =>
                      p.onFila(i, {
                        cantidad: Number(e.target.value.replace(",", ".")) || 0,
                      })
                    }
                  />
                  <input
                    aria-label="Precio total"
                    inputMode="numeric"
                    className={campo}
                    value={f.precioTotal}
                    onChange={(e) =>
                      p.onFila(i, {
                        precioTotal:
                          Number(e.target.value.replace(/\D/g, "")) || 0,
                      })
                    }
                  />
                  <p className="self-center text-xs text-muted-foreground tabular-nums">
                    {f.cantidad > 0
                      ? `${pesos(f.precioTotal / f.cantidad)} c/u`
                      : "—"}
                  </p>
                  <select
                    aria-label="Rubro"
                    className={`${campo} sm:col-span-2`}
                    value={f.rubro}
                    onChange={(e) => p.onFila(i, { rubro: e.target.value })}
                  >
                    {RUBROS_SUGERIDOS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Unidad"
                    className={campo}
                    value={f.unidad}
                    onChange={(e) => p.onFila(i, { unidad: e.target.value })}
                  >
                    {UNIDADES.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={f.promocion}
                      onChange={(e) =>
                        p.onFila(i, { promocion: e.target.checked })
                      }
                    />
                    Promoción
                  </label>
                  {p.conSesion && (
                    <label className="flex items-center gap-1.5 text-xs">
                      <input
                        type="checkbox"
                        checked={f.publicarPrecio}
                        onChange={(e) =>
                          p.onFila(i, { publicarPrecio: e.target.checked })
                        }
                      />
                      Publicar precio
                    </label>
                  )}
                  <button
                    type="button"
                    className="rounded-[10px] border px-2 py-1 text-xs sm:col-span-2"
                    onClick={() => p.onQuitar(i)}
                  >
                    Quitar fila
                  </button>
                </fieldset>
              );
            })}
          </div>
        );
      })}
      {nuevos && (
        <label className="flex items-start gap-2 rounded-[12px] border bg-anot-bg p-2.5 text-sm text-anot-ink">
          <input
            type="checkbox"
            checked={p.confirmaNuevos}
            onChange={(e) => p.onConfirma(e.target.checked)}
          />
          Hay tiendas o productos que no existen en el catálogo; confirmo que se
          creen (se verán para todos).
        </label>
      )}
      {p.incompletas > 0 && (
        <p role="status" className="text-sm text-warn-ink">
          Completa o quita {p.incompletas}{" "}
          {p.incompletas === 1 ? "fila" : "filas"} antes de guardar.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={p.onVolver}
          className="rounded-[10px] border px-3 py-1.5 text-sm"
        >
          Volver
        </button>
        {p.conSesion && (
          <button
            type="button"
            onClick={p.onActualizar}
            className="rounded-[10px] border px-3 py-1.5 text-sm"
          >
            Actualizar revisión
          </button>
        )}
        <button
          type="button"
          disabled={
            p.guardando ||
            p.filas.length === 0 ||
            p.incompletas > 0 ||
            (nuevos && !p.confirmaNuevos)
          }
          onClick={p.onGuardar}
          className="rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
        >
          {p.guardando ? "Guardando…" : "Guardar importación"}
        </button>
      </div>
    </section>
  );
}
