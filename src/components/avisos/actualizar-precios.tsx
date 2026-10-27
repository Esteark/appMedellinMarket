"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { actualizarPrecios } from "@/app/acciones";
import { Spinner } from "@/components/cargando";
import { avisar, siguienteEstado } from "@/lib/avisos";

const CLAVE = "mercado-medellin:actualizando";
type Seguimiento = { inicio: number; desde: string | null };

function leer(): Seguimiento | null {
  try {
    return JSON.parse(sessionStorage.getItem(CLAVE) ?? "null");
  } catch {
    return null;
  }
}
function escribir(s: Seguimiento | null) {
  try {
    if (s) sessionStorage.setItem(CLAVE, JSON.stringify(s));
    else sessionStorage.removeItem(CLAVE);
  } catch {
    // Sin sessionStorage el seguimiento no sobrevive a recargar; sigue en memoria.
  }
}

/** Dentro del banner rojo. Dispara la corrida y la sigue con /api/salud sin bloquear la app. */
export function ActualizarPrecios({ conSesion }: { conSesion: boolean }) {
  const router = useRouter();
  const [seg, setSeg] = useState<Seguimiento | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => setSeg(leer()), []);

  useEffect(() => {
    if (!seg) return;
    let t: ReturnType<typeof setInterval> | undefined;
    const terminar = () => {
      escribir(null);
      setSeg(null);
    };
    const revisar = async () => {
      try {
        const r = await fetch("/api/salud", { cache: "no-store" });
        const s = (await r.json()) as {
          ultimaCorrida: string | null;
          fuentesOk: number;
          fuentesTotal: number;
          caidas: string[];
        };
        const estado = siguienteEstado(seg, s.ultimaCorrida, Date.now());
        if (estado === "ok") {
          if (s.caidas?.length)
            avisar("actualizacion_parcial", { tiendas: s.caidas.join(", ") });
          else
            avisar("actualizacion_ok", {
              ok: s.fuentesOk,
              total: s.fuentesTotal,
            });
          terminar();
          router.refresh();
        } else if (estado === "tarda") {
          avisar("actualizacion_tarda");
          terminar();
        }
      } catch {
        // Un sondeo perdido no importa: se reintenta en 20 s.
      }
    };
    const programar = () => {
      clearInterval(t);
      if (document.visibilityState !== "visible") return;
      void revisar();
      t = setInterval(revisar, 20_000);
    };
    programar();
    document.addEventListener("visibilitychange", programar);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", programar);
    };
  }, [seg, router]);

  if (!conSesion)
    return (
      <Link
        href="/ingresar"
        className="font-semibold underline underline-offset-2"
      >
        Inicia sesión para actualizar
      </Link>
    );

  const ocupado = enviando || !!seg;
  const pulsar = async () => {
    setEnviando(true);
    try {
      const r = await actualizarPrecios();
      if (!r.ok)
        avisar(
          r.error === "sin_sesion" ? "sesion_expirada" : "actualizacion_fallo",
        );
      else if (r.fresco) {
        avisar("actualizacion_no_necesaria");
        router.refresh();
      } else {
        avisar(r.enCurso ? "actualizacion_en_curso" : "actualizacion_iniciada");
        const nuevo = { inicio: Date.now(), desde: r.desde };
        escribir(nuevo);
        setSeg(nuevo);
      }
    } catch {
      avisar(navigator.onLine ? "actualizacion_fallo" : "sin_conexion");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <button
      type="button"
      onClick={pulsar}
      disabled={ocupado}
      aria-busy={ocupado}
      data-testid="actualizar-precios"
      className="inline-flex min-h-8 items-center gap-2 rounded-[10px] border border-up-ink px-3 font-semibold disabled:opacity-70"
    >
      {ocupado && <Spinner />}
      {ocupado
        ? "Actualizando… puede tardar unos minutos"
        : "Actualizar precios"}
    </button>
  );
}
