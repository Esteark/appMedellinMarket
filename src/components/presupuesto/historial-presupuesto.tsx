"use client";

import { useEffect, useState } from "react";
import {
  type CambioHistorial,
  listarHistorialPresupuesto,
} from "@/app/presupuesto/acciones";
import { describirCambio } from "@/lib/presupuesto/por-mes";

/** Los cambios de monto del presupuesto de un mes: qué rubro, de cuánto a cuánto y cuándo. */
export function HistorialPresupuesto({
  mes,
  conSesion,
}: {
  mes: string;
  conSesion: boolean;
}) {
  const [cambios, setCambios] = useState<CambioHistorial[] | null>(null);

  useEffect(() => {
    if (!conSesion || !mes) return;
    let vivo = true;
    setCambios(null);
    void listarHistorialPresupuesto(mes).then((r) => {
      if (vivo) setCambios(r.ok ? r.cambios : []);
    });
    return () => {
      vivo = false;
    };
  }, [mes, conSesion]);

  return (
    <div data-testid="historial-presupuesto" className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Historial del presupuesto {mes}</h3>
      {!conSesion ? (
        <p className="text-sm text-muted-foreground">
          Inicia sesión para guardar el historial de tus presupuestos.
        </p>
      ) : cambios === null ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : cambios.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Este mes no tiene cambios guardados todavía.
        </p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm tabular-nums">
          {cambios.map((c) => (
            <li
              key={`${c.creado}-${c.rubro}-${c.monto_nuevo}`}
              className="flex flex-wrap justify-between gap-2 border-t pt-1"
            >
              <span>{describirCambio(c)}</span>
              <time
                dateTime={c.creado}
                className="text-xs text-muted-foreground"
              >
                {new Date(c.creado).toLocaleString("es-CO", {
                  timeZone: "America/Bogota",
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
