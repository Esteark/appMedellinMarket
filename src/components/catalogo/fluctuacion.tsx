"use client";

import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRef } from "react";
import { CargandoEnlace } from "@/components/cargando";
import { Deslizador } from "@/components/deslizador";
import { dibujar } from "@/lib/animaciones";
import type { ProductoCatalogo } from "@/lib/datos";
import { Etiqueta } from "./etiqueta";

/** Línea de la serie en un viewBox de ancho × alto, con 4 px de margen. */
function trazo(serie: number[], ancho: number, alto: number) {
  const min = Math.min(...serie);
  const rango = Math.max(...serie) - min || 1;
  return serie
    .map((v, i) => {
      const x = 4 + (i * (ancho - 8)) / (serie.length - 1);
      const y = alto - 4 - ((v - min) / rango) * (alto - 8);
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join("");
}

/** "En fluctuación": productos con ±15 % en 7 días o mucha variación en 30. 5 · La línea se dibuja. */
export function Fluctuacion({ productos }: { productos: ProductoCatalogo[] }) {
  const fila = useRef<HTMLDivElement>(null);
  useGSAP(
    () =>
      dibujar(
        Array.from(
          fila.current?.querySelectorAll<SVGPathElement>(".linea") ?? [],
        ),
      ),
    { scope: fila, dependencies: [productos] },
  );
  if (!productos.length) return null;

  return (
    <section
      aria-labelledby="fluctuacion-titulo"
      className="flex flex-col gap-2.5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="fluctuacion-titulo" className="text-base font-semibold">
          En fluctuación
        </h2>
        <span className="text-xs text-muted-foreground">
          ±15 % en 7 días o mucha variación en 30, precio más bajo del día
        </span>
      </div>
      <div ref={fila}>
        <Deslizador className="gap-2.5 pb-1">
          {productos.map((p) => {
            const sube = p.serie[p.serie.length - 1] >= p.serie[0];
            return (
              <Link
                key={p.id}
                href={`/producto/${p.id}`}
                scroll={false}
                className="flex w-[230px] flex-none flex-col gap-1.5 rounded-[14px] border bg-card p-3"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span aria-hidden="true" className="text-xl">
                    {p.emoji}
                  </span>
                  {p.nombre}
                  <CargandoEnlace className="ml-auto text-muted-foreground" />
                </span>
                <span className="flex min-h-5 flex-wrap gap-1">
                  {p.etiquetas
                    .filter(
                      (e) => e === "sube" || e === "baja" || e === "clima",
                    )
                    .map((e) => (
                      <Etiqueta
                        key={e}
                        tipo={e}
                        cambio={p.cambio}
                        deHoy={p.deHoy}
                      />
                    ))}
                </span>
                <svg
                  viewBox="0 0 200 44"
                  className="block h-auto w-full"
                  aria-hidden="true"
                >
                  <path
                    className="linea"
                    d={trazo(p.serie, 200, 44)}
                    fill="none"
                    stroke={sube ? "var(--up)" : "var(--save)"}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {p.causa
                    ? `Causa según SIPSA (DANE): ${p.causa}`
                    : "Causa no reportada"}
                </span>
              </Link>
            );
          })}
        </Deslizador>
      </div>
    </section>
  );
}
