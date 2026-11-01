"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { crearProducto, fusionarProductos } from "@/app/tiendas/acciones";
import { Hoja } from "@/components/hoja";
import { avisar } from "@/lib/avisos";
import type { ProductoGestion } from "@/lib/datos";
import { claveAviso } from "@/lib/importar/factura";
import { candidatosFusion, textoFusion } from "@/lib/tiendas/fusion";

const campo = "w-full rounded-[10px] border bg-card px-2 py-1.5 text-sm";

type Props = {
  origen: ProductoGestion;
  productos: ProductoGestion[];
  alCerrar: () => void;
};

/** Fusiona `origen` en otro producto: pide el destino y que se escriba el nombre del origen. */
export function DialogoFusion({ origen, productos, alCerrar }: Props) {
  const router = useRouter();
  const titulo = useId();
  const [destino, setDestino] = useState("");
  const [nuevo, setNuevo] = useState<{ id: string; nombre: string } | null>(
    null,
  );
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [enviando, setEnviando] = useState(false);

  const candidatos = useMemo(
    () => candidatosFusion(origen, productos),
    [origen, productos],
  );
  const elegido =
    nuevo?.id === destino ? nuevo : productos.find((p) => p.id === destino);
  const confirmado = confirmacion.trim() === origen.nombre;

  const crearDestino = async () => {
    const r = await crearProducto({
      nombre: nombreNuevo,
      grupo: origen.grupo,
      unidad: origen.unidad,
      frecuencia: origen.frecuencia,
      emoji: origen.emoji,
    });
    if (!r.ok) return avisar(claveAviso(r.error));
    setNuevo({ id: r.id, nombre: nombreNuevo.trim() });
    setDestino(r.id);
  };

  const fusionar = async () => {
    setEnviando(true);
    try {
      const r = await fusionarProductos(origen.id, destino);
      if (!r.ok) return avisar(claveAviso(r.error));
      avisar("producto_fusionado", {
        origen: origen.nombre,
        destino: elegido?.nombre ?? destino,
      });
      alCerrar();
      router.refresh();
    } catch {
      avisar("sin_conexion");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Hoja titulo={titulo} alCerrar={alCerrar}>
      <div className="flex flex-col gap-3" data-testid="dialogo-fusion">
        <h2 id={titulo} className="pr-20 text-lg font-bold">
          Fusionar «{origen.nombre}»
        </h2>
        {candidatos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 text-sm">
            <span className="text-muted-foreground">Sugeridos:</span>
            {candidatos.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setDestino(c.id)}
                className={`rounded-full border px-2.5 py-1 ${destino === c.id ? "bg-primary text-primary-foreground" : ""}`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        )}
        <label className="text-sm">
          Producto destino
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className={campo}
          >
            <option value="">Elige uno…</option>
            {nuevo && <option value={nuevo.id}>{nuevo.nombre} (nuevo)</option>}
            {productos
              .filter((p) => p.id !== origen.id)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
          </select>
        </label>
        <div className="flex gap-2">
          <input
            aria-label="Nombre del destino nuevo"
            placeholder="¿No existe? Créalo aquí"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            className={campo}
          />
          <button
            type="button"
            disabled={nombreNuevo.trim().length < 2}
            onClick={crearDestino}
            className="rounded-[10px] border px-3 py-1.5 text-sm disabled:opacity-60"
          >
            Crear
          </button>
        </div>
        {elegido && (
          <p className="rounded-[12px] border bg-warn-bg p-2.5 text-sm text-warn-ink">
            {textoFusion(origen.nombre, elegido.nombre)}
          </p>
        )}
        <label className="text-sm">
          Para confirmar, escribe «{origen.nombre}»
          <input
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            className={campo}
          />
        </label>
        <button
          type="button"
          disabled={!destino || !confirmado || enviando}
          onClick={fusionar}
          className="rounded-[10px] bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
        >
          {enviando ? "Fusionando…" : "Fusionar"}
        </button>
      </div>
    </Hoja>
  );
}
