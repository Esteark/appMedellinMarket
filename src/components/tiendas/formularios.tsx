"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  crearProducto,
  crearTienda,
  renombrarTienda,
} from "@/app/tiendas/acciones";
import { Hoja } from "@/components/hoja";
import { avisar } from "@/lib/avisos";
import { claveAviso } from "@/lib/importar/factura";

const campo = "w-full rounded-[10px] border bg-card px-2 py-1.5 text-sm";
const boton =
  "rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60";

export type Formulario =
  | { tipo: "tienda" }
  | { tipo: "renombrar"; id: string; nombre: string }
  | { tipo: "producto" };

type Props = { formulario: Formulario; grupos: string[]; alCerrar: () => void };

/** Hoja de formulario para crear una tienda, renombrarla o crear un producto. */
export function HojaFormulario({ formulario, grupos, alCerrar }: Props) {
  const router = useRouter();
  const titulo = useId();
  const [nombre, setNombre] = useState(
    formulario.tipo === "renombrar" ? formulario.nombre : "",
  );
  const [grupo, setGrupo] = useState("Otros");
  const [unidad, setUnidad] = useState("kg");
  const [frecuencia, setFrecuencia] = useState("semanal");
  const [emoji, setEmoji] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    try {
      const r =
        formulario.tipo === "tienda"
          ? await crearTienda(nombre)
          : formulario.tipo === "renombrar"
            ? await renombrarTienda(formulario.id, nombre)
            : await crearProducto({ nombre, grupo, unidad, frecuencia, emoji });
      if (!r.ok) return avisar(claveAviso(r.error));
      if (formulario.tipo === "tienda") avisar("tienda_creada", { nombre });
      else if (formulario.tipo === "renombrar")
        avisar("tienda_renombrada", { nombre });
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
            <label className="text-sm">
              Emoji (opcional)
              <input
                maxLength={8}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className={campo}
              />
            </label>
          </div>
        )}
        <button type="submit" disabled={enviando} className={boton}>
          {enviando ? "Guardando…" : "Guardar"}
        </button>
      </form>
    </Hoja>
  );
}
