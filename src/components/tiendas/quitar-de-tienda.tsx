"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { quitarDeTienda } from "@/app/tiendas/acciones";
import { avisar } from "@/lib/avisos";
import { claveAviso } from "@/lib/importar/factura";

const boton = "rounded-[10px] border px-2.5 py-1 text-xs";

/** «Quitar de esta tienda» con confirmación en línea: pone `activo = false`, no borra precios ni historial. */
export function QuitarDeTienda({
  producto,
  tienda,
}: {
  producto: { id: string; nombre: string };
  tienda: { id: string; nombre: string };
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const quitar = async () => {
    setEnviando(true);
    try {
      const r = await quitarDeTienda({
        producto: producto.id,
        tienda: tienda.id,
      });
      if (!r.ok) return avisar(claveAviso(r.error));
      avisar("producto_quitado_de_tienda", {
        nombre: producto.nombre,
        tienda: tienda.nombre,
      });
      router.refresh();
    } catch {
      avisar("sin_conexion");
    } finally {
      setEnviando(false);
      setConfirmando(false);
    }
  };

  if (!confirmando)
    return (
      <button
        type="button"
        className={boton}
        onClick={() => setConfirmando(true)}
      >
        Quitar de esta tienda
      </button>
    );
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-xs">¿Quitar de {tienda.nombre}?</span>
      <button
        type="button"
        className={boton}
        disabled={enviando}
        onClick={quitar}
      >
        Sí, quitar
      </button>
      <button
        type="button"
        className={boton}
        onClick={() => setConfirmando(false)}
      >
        No
      </button>
    </span>
  );
}
