"use client";

import { type FormEvent, useState } from "react";
import { CampoMoneda } from "@/components/campo-moneda";
import { textoAviso } from "@/lib/avisos";
import type { ProductoCatalogo } from "@/lib/datos";
import type { GastoReal } from "@/lib/presupuesto/tipos";

export type CambiosGasto = {
  fecha: string;
  rubro: string;
  monto: number;
  tienda_id: string | null;
  producto_id: string | null;
  cantidad: number | null;
  descripcion: string | null;
  nota: string | null;
};

type Opcion = { id: string; nombre: string };

type Props = {
  gasto: GastoReal;
  productos: Pick<ProductoCatalogo, "id" | "nombre" | "emoji">[];
  tiendas: Opcion[];
  rubros: string[];
  alCancelar: () => void;
  /** Devuelve el texto del error, o `null` si se guardó. */
  alGuardar: (cambios: CambiosGasto) => Promise<string | null>;
};

const CAMPO =
  "mt-1 w-full rounded-[10px] border border-input bg-background px-2 py-1.5";

/** El gasto abierto para editar: todos sus campos en una fila que ocupa todo el ancho. */
export function EdicionGasto(props: Props) {
  const { gasto: g, productos, tiendas, rubros } = props;
  const producto = productos.find((p) => p.id === g.producto_id);
  const [campos, setCampos] = useState({
    fecha: g.fecha,
    productoId: g.producto_id ?? "",
    rubro: g.rubro,
    tiendaId: g.tienda_id ?? "",
    monto: String(g.monto),
    cantidad: g.cantidad != null ? String(g.cantidad) : "",
    descripcion: g.descripcion ?? "",
    nota: g.nota ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const poner = (parcial: Partial<typeof campos>) =>
    setCampos((c) => ({ ...c, ...parcial }));

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const monto = Number(campos.monto);
    const cantidad = campos.cantidad.trim() ? Number(campos.cantidad) : null;
    if (
      !campos.fecha ||
      !campos.rubro ||
      !Number.isInteger(monto) ||
      (cantidad !== null && !(cantidad > 0))
    )
      return setError(textoAviso("gasto_edicion_invalida"));
    setEnviando(true);
    const falla = await props.alGuardar({
      fecha: campos.fecha,
      rubro: campos.rubro,
      monto,
      tienda_id: campos.tiendaId || null,
      producto_id: campos.productoId || null,
      cantidad,
      descripcion: campos.descripcion.trim() || null,
      nota: campos.nota.trim() || null,
    });
    setEnviando(false);
    setError(falla);
  };

  const id = (campo: string) => `${campo}-${g.id}`;
  const opcionesRubro = rubros.includes(g.rubro)
    ? rubros
    : [...rubros, g.rubro];
  return (
    <tr className="border-t bg-secondary/40" data-testid={`gasto-${g.id}`}>
      <td colSpan={7} className="p-2">
        <form
          noValidate
          onSubmit={guardar}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              props.alCancelar();
            }
          }}
          className="flex flex-col gap-2"
        >
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <label htmlFor={id("fecha")}>Fecha</label>
              <input
                id={id("fecha")}
                type="date"
                required
                value={campos.fecha}
                onChange={(e) => poner({ fecha: e.target.value })}
                className={CAMPO}
              />
            </div>
            <div>
              <label htmlFor={id("producto")}>Producto</label>
              <select
                id={id("producto")}
                value={campos.productoId}
                onChange={(e) => poner({ productoId: e.target.value })}
                className={CAMPO}
              >
                <option value="">Manual (sin producto)</option>
                {g.producto_id && !producto && (
                  <option value={g.producto_id}>{g.producto_id}</option>
                )}
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={id("rubro")}>Rubro</label>
              <select
                id={id("rubro")}
                value={campos.rubro}
                onChange={(e) => poner({ rubro: e.target.value })}
                className={CAMPO}
              >
                {opcionesRubro.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={id("tienda")}>Tienda</label>
              <select
                id={id("tienda")}
                value={campos.tiendaId}
                onChange={(e) => poner({ tiendaId: e.target.value })}
                className={CAMPO}
              >
                <option value="">Sin tienda</option>
                {tiendas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={id("monto")}>Monto</label>
              <CampoMoneda
                id={id("monto")}
                value={campos.monto}
                onChange={(v) => poner({ monto: v })}
                className={`${CAMPO} min-w-0 flex-1`}
              />
            </div>
            <div>
              <label htmlFor={id("cantidad")}>Cantidad</label>
              <input
                id={id("cantidad")}
                type="number"
                min={0}
                step="any"
                value={campos.cantidad}
                onChange={(e) => poner({ cantidad: e.target.value })}
                className={CAMPO}
              />
            </div>
            <div>
              <label htmlFor={id("descripcion")}>Descripción</label>
              <input
                id={id("descripcion")}
                maxLength={200}
                value={campos.descripcion}
                onChange={(e) => poner({ descripcion: e.target.value })}
                className={CAMPO}
              />
            </div>
            <div>
              <label htmlFor={id("nota")}>Nota</label>
              <input
                id={id("nota")}
                maxLength={200}
                value={campos.nota}
                onChange={(e) => poner({ nota: e.target.value })}
                className={CAMPO}
              />
            </div>
          </div>
          {error && (
            <p role="alert" className="text-xs text-up-ink">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
            >
              {enviando ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={props.alCancelar}
              className="rounded-[10px] border px-3 py-1.5 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
