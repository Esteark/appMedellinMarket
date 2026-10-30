"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { dibujar } from "@/lib/animaciones";
import { pesos } from "@/lib/formato";
import type { Motivo, Pronostico } from "@/lib/precios/pronostico";

gsap.registerPlugin(useGSAP);

const MOTIVOS: Record<Motivo, string> = {
  tendencia_sube: "Viene subiendo",
  tendencia_baja: "Viene bajando",
  clima: "Clima reportado por SIPSA esta semana",
  ipc_alto: "IPC de alimentos alto",
  poca_serie: "Poco historial",
  sin_contexto: "Sin contexto DANE",
  cambio_reciente: "Cambio fuerte reciente",
};
const TITULO = {
  sube: "Podría subir",
  baja: "Podría bajar",
  estable: "Se mantendría estable",
} as const;

/** Trazo del último precio hacia el esperado (7 pasos) en un viewBox de 200 × 56. */
function trazo(p: Pronostico) {
  const todos = [p.ultimo, ...p.puntos, p.rango.min, p.rango.max];
  const min = Math.min(...todos);
  const rango = Math.max(...todos) - min || 1;
  const y = (v: number) => 52 - ((v - min) / rango) * 48;
  return [p.ultimo, ...p.puntos]
    .map((v, i) => `${i ? "L" : "M"}${4 + (i * 192) / 7},${y(v)}`)
    .join(" ");
}

/** «Próximos 7 días»: dirección, probabilidad, rango y confianza. Estimación estadística, no un precio. */
export function BloquePronostico({
  pronostico: p,
}: {
  pronostico: Pronostico;
}) {
  const raiz = useRef<HTMLElement>(null);
  // 10 · El trazo se dibuja de izquierda a derecha.
  useGSAP(
    () => {
      const linea = raiz.current?.querySelector<SVGPathElement>(".linea");
      if (linea) dibujar([linea]);
    },
    { scope: raiz },
  );

  return (
    <section
      ref={raiz}
      data-testid="pronostico"
      aria-labelledby="pronostico-titulo"
      className="flex flex-col gap-2 rounded-xl border bg-card px-3.5 py-3"
    >
      <h3
        id="pronostico-titulo"
        className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
      >
        Próximos 7 días · estimación estadística
      </h3>
      <p className="text-base font-semibold">
        {TITULO[p.direccion]} · {p.probabilidad} % de probabilidad
      </p>
      <p className="text-sm">
        Rango esperado:{" "}
        <span className="font-semibold tabular-nums">
          {pesos(p.rango.min)} – {pesos(p.rango.max)}
        </span>{" "}
        · confianza {p.confianza}
      </p>
      <svg
        viewBox="0 0 200 56"
        className="block h-auto w-full"
        aria-hidden="true"
      >
        <path
          className="linea"
          d={trazo(p)}
          fill="none"
          stroke={
            p.direccion === "sube"
              ? "var(--up)"
              : p.direccion === "baja"
                ? "var(--save)"
                : "var(--muted-foreground)"
          }
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {p.motivos.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 text-xs">
          {p.motivos.map((m) => (
            <li key={m} className="rounded-full bg-secondary px-2 py-0.5">
              {MOTIVOS[m]}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        Estimación estadística, no un precio. Usa el historial, el clima de
        SIPSA y el IPC de alimentos del DANE.
      </p>
    </section>
  );
}
