"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { editarProducto } from "@/app/tiendas/acciones";
import { EmojiSelector } from "@/components/emoji-selector";
import { avisar, textoAviso } from "@/lib/avisos";
import type { FilaAnotados } from "@/lib/datos";
import { claveAviso } from "@/lib/importar/factura";

const CAMPO =
  "mt-1 w-full rounded-[10px] border border-input bg-background px-2 py-1.5 text-base sm:text-sm";

/** Un producto abierto para editar en la propia tabla de Anotados: nombre, ícono, grupo, unidad y frecuencia. */
export function EdicionProductoAnotados({
  fila,
  grupos,
  columnas,
  alCancelar,
}: {
  fila: FilaAnotados;
  grupos: string[];
  columnas: number;
  alCancelar: () => void;
}) {
  const router = useRouter();
  const [campos, setCampos] = useState({
    nombre: fila.nombre,
    emoji: fila.emoji ?? "",
    grupo: fila.grupo,
    unidad: fila.unidad,
    frecuencia: fila.frecuencia,
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const poner = (parcial: Partial<typeof campos>) =>
    setCampos((c) => ({ ...c, ...parcial }));
  const id = (campo: string) => `${campo}-${fila.id}`;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await editarProducto(fila.id, {
        nombre: campos.nombre,
        grupo: campos.grupo,
        unidad: campos.unidad,
        frecuencia: campos.frecuencia,
        emoji: campos.emoji || null,
      });
      if (!r.ok) return setError(textoAviso(claveAviso(r.error)));
      avisar("producto_editado");
      router.refresh();
      alCancelar();
    } catch {
      setError(textoAviso("sin_conexion"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <tr className="border-b bg-secondary/40" data-testid={`edicion-${fila.id}`}>
      <td colSpan={columnas} className="p-2">
        {/* Pegado a la izquierda: la tabla es más ancha que la pantalla y el formulario no debe irse con ella. */}
        <form
          noValidate
          onSubmit={guardar}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              alCancelar();
            }
          }}
          className="sticky left-2 flex w-[min(34rem,calc(100vw-3.5rem))] flex-col gap-2 text-sm"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={id("nombre")}>Nombre</label>
              <input
                id={id("nombre")}
                required
                minLength={2}
                maxLength={120}
                value={campos.nombre}
                onChange={(e) => poner({ nombre: e.target.value })}
                className={CAMPO}
              />
            </div>
            <div className="sm:col-span-2">
              Ícono
              <EmojiSelector
                valor={campos.emoji}
                onChange={(emoji) => poner({ emoji })}
              />
            </div>
            <div>
              <label htmlFor={id("grupo")}>Grupo</label>
              <input
                id={id("grupo")}
                list={id("grupos")}
                value={campos.grupo}
                onChange={(e) => poner({ grupo: e.target.value })}
                className={CAMPO}
              />
              <datalist id={id("grupos")}>
                {grupos.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor={id("unidad")}>Unidad</label>
              <input
                id={id("unidad")}
                value={campos.unidad}
                onChange={(e) => poner({ unidad: e.target.value })}
                className={CAMPO}
              />
            </div>
            <div>
              <label htmlFor={id("frecuencia")}>Frecuencia</label>
              <select
                id={id("frecuencia")}
                value={campos.frecuencia}
                onChange={(e) => poner({ frecuencia: e.target.value })}
                className={CAMPO}
              >
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal</option>
              </select>
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
              onClick={alCancelar}
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
