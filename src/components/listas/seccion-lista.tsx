"use client";

import type { FilaLista } from "@/lib/importar/lista";

export type Producto = { id: string; nombre: string; unidad: string };
export type Fila = {
  f: FilaLista;
  productoId: string;
  item: number;
  aviso: boolean;
};
export type Seccion = { nombre: string; guardar: string; filas: Fila[] };

const campo = "rounded-[10px] border bg-card px-2 py-1 text-sm";
const boton = "rounded-[10px] border px-3 py-1.5 text-sm";

type Props = {
  sec: Seccion;
  productos: Producto[];
  confirmando: boolean;
  onElegir: (i: number, id: string) => void;
  onItem: (i: number, item: number) => void;
  onNombre: (nombre: string) => void;
  onUsar: () => void;
  onSumar: () => void;
  onGuardar: () => void;
};

/** Una sección de la lista cargada: cada línea con su producto y cantidad, y las tres salidas. */
export function SeccionLista({ sec, productos, confirmando, ...a }: Props) {
  return (
    <div
      data-testid={`seccion-${sec.nombre}`}
      className="flex flex-col gap-2 rounded-[12px] border p-2.5"
    >
      <h3 className="font-semibold">{sec.nombre}</h3>
      {sec.filas.map((r, i) => (
        <div
          key={r.f.linea}
          className="grid gap-1.5 sm:grid-cols-[1fr_1fr_5rem]"
        >
          <p className="self-center text-sm">
            {r.f.producto}{" "}
            <span className="text-xs text-muted-foreground">
              {r.f.cantidad} {r.f.unidad}
              {r.f.nota && ` · ${r.f.nota}`}
            </span>
          </p>
          <select
            aria-label={`Producto de ${r.f.producto}`}
            className={campo}
            value={r.productoId}
            onChange={(e) => a.onElegir(i, e.target.value)}
          >
            <option value="">Omitir</option>
            <option value="__nuevo__">+ Crear «{r.f.producto}»</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <input
            aria-label={`Cantidad de ${r.f.producto}`}
            type="number"
            min={1}
            max={999}
            className={campo}
            value={r.item}
            onChange={(e) =>
              a.onItem(
                i,
                Math.max(1, Math.min(999, Number(e.target.value) || 1)),
              )
            }
          />
          {r.aviso && (
            <p className="text-xs text-warn-ink sm:col-span-3">
              Unidad distinta a la del producto: fija la cantidad a mano.
            </p>
          )}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={boton} onClick={a.onUsar}>
          {confirmando ? "Confirmar: reemplaza mi lista" : "Usar como mi lista"}
        </button>
        <button type="button" className={boton} onClick={a.onSumar}>
          Sumar a mi lista
        </button>
        <input
          aria-label={`Nombre para guardar ${sec.nombre}`}
          maxLength={60}
          className={campo}
          value={sec.guardar}
          onChange={(e) => a.onNombre(e.target.value)}
        />
        <button type="button" className={boton} onClick={a.onGuardar}>
          Guardar
        </button>
      </div>
    </div>
  );
}
