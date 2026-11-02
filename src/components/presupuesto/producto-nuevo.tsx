"use client";

import { crearProducto } from "@/app/tiendas/acciones";
import { EmojiSelector } from "@/components/emoji-selector";

export type DatosProductoNuevo = {
  grupo: string;
  tiendaId: string;
  emoji: string;
};

export const PRODUCTO_NUEVO_VACIO: DatosProductoNuevo = {
  grupo: "Otros",
  tiendaId: "",
  emoji: "",
};

const CAMPO =
  "mt-1 w-full rounded-[10px] border border-input bg-background px-2 py-1.5";

/** Lo que falta para crear un producto de verdad desde «Agregar gasto»: grupo, tienda e ícono. */
export function ProductoNuevo({
  valor,
  onChange,
  grupos,
  tiendas,
  conSesion,
}: {
  valor: DatosProductoNuevo;
  onChange: (v: DatosProductoNuevo) => void;
  grupos: string[];
  tiendas: { id: string; nombre: string }[];
  conSesion: boolean;
}) {
  if (!conSesion)
    return (
      <p className="rounded-[10px] bg-anot-bg px-3 py-2 text-xs text-anot-ink sm:col-span-2">
        Sin sesión el producto nuevo queda solo como texto en la nota del gasto.
        Inicia sesión para crearlo en el catálogo y poder editarlo después.
      </p>
    );
  return (
    <div
      data-testid="producto-nuevo"
      className="grid gap-2.5 rounded-[10px] border p-2.5 text-sm sm:col-span-2 sm:grid-cols-2"
    >
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Se crea en el catálogo y queda ligado a este gasto. Después lo editas
        por completo en «Tiendas».
      </p>
      <div>
        <label htmlFor="producto-nuevo-grupo">Grupo</label>
        <select
          id="producto-nuevo-grupo"
          value={valor.grupo}
          onChange={(e) => onChange({ ...valor, grupo: e.target.value })}
          className={CAMPO}
        >
          {grupos.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="producto-nuevo-tienda">Tienda donde lo compraste</label>
        <select
          id="producto-nuevo-tienda"
          value={valor.tiendaId}
          onChange={(e) => onChange({ ...valor, tiendaId: e.target.value })}
          className={CAMPO}
        >
          <option value="">Elige la tienda…</option>
          {tiendas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        Ícono (opcional)
        <EmojiSelector
          valor={valor.emoji}
          onChange={(emoji) => onChange({ ...valor, emoji })}
        />
      </div>
    </div>
  );
}

/** Crea el producto (o reutiliza el de ese nombre) en la tienda elegida; sin tienda no se crea. */
export async function crearProductoDeGasto(
  nombre: string,
  unidad: string,
  d: DatosProductoNuevo,
): Promise<
  { ok: true; id: string; existente: boolean } | { ok: false; error: string }
> {
  if (!d.tiendaId) return { ok: false, error: "tienda_requerida" };
  return crearProducto({
    nombre,
    grupo: d.grupo,
    unidad: unidad.trim() || "u",
    frecuencia: "semanal",
    emoji: d.emoji || null,
    tiendas: [d.tiendaId],
  });
}
