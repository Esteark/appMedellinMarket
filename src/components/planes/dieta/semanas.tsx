"use client";

import { useState } from "react";
import { avisar } from "@/lib/avisos";
import {
  agregarSemana,
  conSemanas,
  MAX_SEMANAS,
  MIN_SEMANAS,
  quitarSemana,
} from "@/lib/planes/semanas";
import type { Precios } from "@/lib/precios/lista";
import { usePlan } from "../plan-provider";
import { ComprasSemana } from "./compras-semana";
import type { ProductoPlan } from "./lista-comida";
import { SemanaEditor } from "./semana-editor";

const CHIP = "rounded-full px-3 py-1.5 text-sm font-medium border";

/** Planificador de 4 a 5 semanas; cada una con desayuno, almuerzo, cena y despensa. */
export function Semanas({
  productos,
  precios,
  tiendas,
}: {
  productos: ProductoPlan[];
  precios: Precios;
  tiendas: string[];
}) {
  const { config, cambiar } = usePlan();
  const [sel, setSel] = useState(0);
  const [quitando, setQuitando] = useState(false);
  const semanas = config.semanas;

  if (!semanas)
    return (
      <section className="flex flex-col gap-2 rounded-[14px] border bg-card p-3.5">
        <h2 className="text-lg font-bold">Planear las semanas</h2>
        <p className="text-sm text-muted-foreground">
          Arma qué se come cada día (desayuno, almuerzo y cena) y de ahí salen
          las compras de cada semana.
        </p>
        <button
          type="button"
          onClick={() => cambiar({ semanas: conSemanas(config).semanas })}
          className="self-start rounded-[10px] bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
        >
          Empezar el planificador
        </button>
      </section>
    );

  const i = Math.min(sel, semanas.length - 1);
  const agregar = () => {
    const n = agregarSemana(config);
    if (!n) return;
    cambiar({ semanas: n.semanas });
    setSel(semanas.length);
    avisar("semana_agregada", { n: semanas.length + 1 });
  };
  const quitar = () => {
    const n = quitarSemana(config);
    if (!n) return;
    cambiar({ semanas: n.semanas });
    setSel(Math.min(i, semanas.length - 2));
    setQuitando(false);
    avisar("semana_quitada", { n: semanas.length });
  };

  return (
    <section
      data-testid="planificador"
      className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5"
    >
      <h2 className="text-lg font-bold">Planear las semanas</h2>
      <fieldset className="flex min-w-0 flex-wrap items-center gap-1.5">
        <legend className="sr-only">Semana</legend>
        {semanas.map((_, k) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: las semanas se identifican por su posición
            key={k}
            type="button"
            aria-pressed={i === k}
            onClick={() => {
              setSel(k);
              setQuitando(false);
            }}
            className={`${CHIP} ${i === k ? "border-primary bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            Semana {k + 1}
          </button>
        ))}
        {semanas.length < MAX_SEMANAS && (
          <button
            type="button"
            onClick={agregar}
            className={`${CHIP} bg-background`}
          >
            Agregar semana {semanas.length + 1}
          </button>
        )}
        {semanas.length > MIN_SEMANAS &&
          (quitando ? (
            <span className="flex items-center gap-1.5 text-sm">
              ¿Quitar la semana {semanas.length}?
              <button
                type="button"
                onClick={quitar}
                className="rounded-[10px] bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
              >
                Sí, quitar
              </button>
              <button
                type="button"
                onClick={() => setQuitando(false)}
                className="rounded-[10px] border bg-background px-3 py-1.5 text-sm font-medium"
              >
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setQuitando(true)}
              className="text-sm font-medium text-muted-foreground underline underline-offset-2"
            >
              Quitar semana {semanas.length}
            </button>
          ))}
      </fieldset>
      <SemanaEditor semana={semanas[i]} indice={i} productos={productos} />
      <ComprasSemana
        semana={semanas[i]}
        indice={i}
        productos={productos}
        precios={precios}
        tiendas={tiendas}
      />
    </section>
  );
}
