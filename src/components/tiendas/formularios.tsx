"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  crearProducto,
  crearTienda,
  renombrarTienda,
} from "@/app/tiendas/acciones";
import { EmojiSelector } from "@/components/emoji-selector";
import { Hoja } from "@/components/hoja";
import { avisar } from "@/lib/avisos";
import { claveAviso } from "@/lib/importar/factura";

const campo = "w-full rounded-[10px] border bg-card px-2 py-1.5 text-sm";
const boton =
  "rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60";

export type Formulario =
  | { tipo: "tienda" }
  | { tipo: "renombrar"; id: string; nombre: string }
  | { tipo: "producto"; tiendaInicial?: string };

type Props = {
  formulario: Formulario;
  grupos: string[];
  /** Tiendas que se pueden marcar al crear un producto. */
  tiendas: { id: string; nombre: string }[];
  alCerrar: () => void;
};

/** Hoja de formulario para crear una tienda, renombrarla o crear un producto. */
export function HojaFormulario({
  formulario,
  grupos,
  tiendas,
  alCerrar,
}: Props) {
  const router = useRouter();
  const titulo = useId();
  const [nombre, setNombre] = useState(
    formulario.tipo === "renombrar" ? formulario.nombre : "",
  );
  const [grupo, setGrupo] = useState("Otros");
  const [unidad, setUnidad] = useState("kg");
  const [frecuencia, setFrecuencia] = useState("semanal");
  const [emoji, setEmoji] = useState("");
  const [marcadas, setMarcadas] = useState<string[]>(
    formulario.tipo === "producto" && formulario.tiendaInicial
      ? [formulario.tiendaInicial]
      : [],
  );
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    try {
      const r =
        formulario.tipo === "tienda"
          ? await crearTienda(nombre)
          : formulario.tipo === "renombrar"
            ? await renombrarTienda(formulario.id, nombre)
            : await crearProducto({
                nombre,
                grupo,
                unidad,
                frecuencia,
                emoji,
                tiendas: marcadas,
              });
      if (!r.ok) return avisar(claveAviso(r.error));
      if (formulario.tipo === "tienda") avisar("tienda_creada", { nombre });
      else if (formulario.tipo === "renombrar")
        avisar("tienda_renombrada", { nombre });
      else if ("existente" in r && r.existente)
        avisar("producto_existente_agregado", {
          nombre,
          tienda: tiendas
            .filter((t) => marcadas.includes(t.id))
            .map((t) => t.nombre)
            .join(", "),
        });
      else avisar("producto_creado", { nombre });
      alCerrar();
      router.refresh();
    } catch {
      avisar("sin_conexion");
    } finally {
      setEnviando(false);
    }
  };

  const esProducto = formulario.tipo === "producto";
  return (
    <Hoja titulo={titulo} alCerrar={alCerrar}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
        className="flex flex-col gap-3"
      >
        <h2 id={titulo} className="pr-20 text-lg font-bold">
          {formulario.tipo === "tienda" && "Nueva tienda"}
          {formulario.tipo === "renombrar" && "Renombrar tienda"}
          {esProducto && "Nuevo producto"}
        </h2>
        <label className="text-sm">
          Nombre
          <input
            required
            minLength={2}
            maxLength={esProducto ? 120 : 60}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={campo}
          />
        </label>
        {esProducto && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-sm">
              Grupo
              <input
                list="grupos-tiendas"
                value={grupo}
                onChange={(e) => setGrupo(e.target.value)}
                className={campo}
              />
              <datalist id="grupos-tiendas">
                {grupos.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </label>
            <label className="text-sm">
              Unidad
              <input
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className={campo}
              />
            </label>
            <label className="text-sm">
              Frecuencia
              <select
                value={frecuencia}
                onChange={(e) => setFrecuencia(e.target.value)}
                className={campo}
              >
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal</option>
              </select>
            </label>
            <div className="text-sm sm:col-span-2">
              Ícono (opcional)
              <EmojiSelector valor={emoji} onChange={setEmoji} />
            </div>
          </div>
        )}
        {esProducto && (
          <fieldset className="flex flex-col gap-1.5 text-sm">
            <legend className="mb-1">Tiendas donde se vende</legend>
            {tiendas.map((t) => (
              <label key={t.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={marcadas.includes(t.id)}
                  onChange={(e) =>
                    setMarcadas((m) =>
                      e.target.checked
                        ? [...m, t.id]
                        : m.filter((x) => x !== t.id),
                    )
                  }
                />
                {t.nombre}
              </label>
            ))}
            {marcadas.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Marca al menos una tienda.
              </p>
            )}
          </fieldset>
        )}
        <button
          type="submit"
          disabled={enviando || (esProducto && marcadas.length === 0)}
          className={boton}
        >
          {enviando ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </Hoja>
  );
}
