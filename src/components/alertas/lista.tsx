"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { marcarLeidas } from "@/app/alertas/acciones";
import { Spinner } from "@/components/cargando";
import type { AlertaFila } from "@/lib/datos";
import { cuando } from "@/lib/fecha";
import { cn } from "@/lib/utils";

const EMOJI: Record<string, string> = {
  mas_barato: "💸",
  mercado_completo: "🛒",
  subida: "📈",
  caro_por_clima: "🌧️",
  fuente_caida: "⚠️",
  precio_manual_vencido: "🏷️",
};

/** Alertas del usuario: las 5 de mayor monto y un botón para ver el resto. */
export function ListaAlertas({ alertas }: { alertas: AlertaFila[] }) {
  const router = useRouter();
  const [todas, setTodas] = useState(false);
  const [leyendo, empezar] = useTransition();
  const noLeidas = alertas.filter((a) => !a.leida).length;
  const visibles = todas ? alertas : alertas.slice(0, 5);

  if (!alertas.length)
    return (
      <p className="text-sm text-muted-foreground" data-testid="sin-alertas">
        Todavía no tienes alertas. Te avisamos cuando un producto de tu lista
        esté más barato en otra tienda.
      </p>
    );
  return (
    <section aria-label="Tus alertas" className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {noLeidas} sin leer de {alertas.length}
        </span>
        {noLeidas > 0 && (
          <button
            type="button"
            disabled={leyendo}
            onClick={() =>
              empezar(async () => {
                await marcarLeidas();
                router.refresh();
              })
            }
            className="inline-flex items-center gap-1.5 font-medium text-anot-ink disabled:opacity-70"
          >
            {leyendo && <Spinner />}
            Marcar todas como leídas
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {visibles.map((a) => (
          <li
            key={a.id}
            data-testid="alerta"
            className={cn(
              "flex gap-3 rounded-[14px] border bg-card px-3.5 py-3 text-sm",
              !a.leida && "border-anot bg-anot-bg",
            )}
          >
            <span aria-hidden="true" className="text-lg">
              {EMOJI[a.tipo] ?? "🔔"}
            </span>
            <div className="flex flex-col gap-0.5">
              <span>{a.mensaje}</span>
              {a.tipo === "precio_manual_vencido" && (
                <Link
                  href="/anotados/barrio"
                  className="font-medium text-anot-ink underline underline-offset-2"
                >
                  Actualizar precios de barrio
                </Link>
              )}
              <span className="text-xs text-muted-foreground">
                {cuando(a.creada)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {alertas.length > 5 && (
        <button
          type="button"
          aria-expanded={todas}
          onClick={() => setTodas((t) => !t)}
          className="self-start text-sm font-medium text-anot-ink"
        >
          {todas ? "Ver menos" : `Ver todas (${alertas.length})`}
        </button>
      )}
    </section>
  );
}
