"use client";

import { useState } from "react";
import { avisar } from "@/lib/avisos";
import {
  type Cantidades,
  COMIDAS,
  type Comida,
  repetirEnTodosLosDias,
  type Semana,
  traerListaBase,
} from "@/lib/planes/semanas";
import { usePlan } from "../plan-provider";
import { ListaComida, type ProductoPlan } from "./lista-comida";

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const TITULO: Record<Comida, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
};
const CHIP = "rounded-full px-3 py-1.5 text-sm font-medium border";
const activo = "bg-primary text-primary-foreground border-primary";

const igual = (a: Cantidades, b: Cantidades) =>
  JSON.stringify(a) === JSON.stringify(b);

/** Una semana: día, tres comidas y la despensa. En móvil se ve una comida a la vez. */
export function SemanaEditor({
  semana,
  indice,
  productos,
}: {
  semana: Semana;
  indice: number;
  productos: ProductoPlan[];
}) {
  const { config, cambiar } = usePlan();
  const [dia, setDia] = useState(0);
  const [movil, setMovil] = useState<Comida>("almuerzo");
  const [confirmar, setConfirmar] = useState<Comida | null>(null);

  const guardar = (nueva: Semana) =>
    cambiar({
      semanas: config.semanas?.map((s, i) => (i === indice ? nueva : s)),
    });
  const poner = (c: Comida, cant: Cantidades) =>
    guardar({
      ...semana,
      dias: semana.dias.map((d, i) => (i === dia ? { ...d, [c]: cant } : d)),
    });
  const repetir = (c: Comida) => {
    guardar(repetirEnTodosLosDias(semana, dia, c));
    avisar("comida_repetida", { comida: TITULO[c] });
    setConfirmar(null);
  };
  const pisaria = (c: Comida) =>
    semana.dias.some(
      (d, i) =>
        i !== dia &&
        Object.keys(d[c]).length > 0 &&
        !igual(d[c], semana.dias[dia][c]),
    );
  const conLista = traerListaBase(config, indice);

  return (
    <div className="flex flex-col gap-3" data-testid={`semana-${indice + 1}`}>
      <fieldset className="flex min-w-0 flex-wrap gap-1.5">
        <legend className="sr-only">Día</legend>
        {DIAS.map((n, i) => (
          <button
            key={n}
            type="button"
            aria-pressed={dia === i}
            onClick={() => {
              setDia(i);
              setConfirmar(null);
            }}
            className={`${CHIP} ${dia === i ? activo : "bg-secondary"}`}
          >
            {n}
          </button>
        ))}
      </fieldset>
      <fieldset className="flex min-w-0 gap-1.5 sm:hidden">
        <legend className="sr-only">Comida</legend>
        {COMIDAS.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={movil === c}
            onClick={() => setMovil(c)}
            className={`${CHIP} ${movil === c ? activo : "bg-secondary"}`}
          >
            {TITULO[c]}
          </button>
        ))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        {COMIDAS.map((c) => (
          <fieldset
            key={c}
            data-testid={`comida-${c}`}
            className={`min-w-0 flex-col gap-2 rounded-[12px] border p-3 ${movil === c ? "flex" : "hidden sm:flex"}`}
          >
            <legend className="px-1 text-sm font-semibold">
              {TITULO[c]} · {DIAS[dia]}
            </legend>
            <ListaComida
              nombre={`${TITULO[c]} del ${DIAS[dia].toLowerCase()}`}
              cantidades={semana.dias[dia][c]}
              productos={productos}
              max={40}
              onChange={(cant) => poner(c, cant)}
            />
            {confirmar === c ? (
              <span className="flex flex-wrap items-center gap-1.5 text-sm">
                Otros días tienen datos. ¿Reemplazarlos?
                <button
                  type="button"
                  onClick={() => repetir(c)}
                  className="rounded-[10px] bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
                >
                  Sí, reemplazar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmar(null)}
                  className="rounded-[10px] border bg-background px-3 py-1.5 text-sm font-medium"
                >
                  No
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={Object.keys(semana.dias[dia][c]).length === 0}
                onClick={() => (pisaria(c) ? setConfirmar(c) : repetir(c))}
                className="self-start text-sm font-medium text-muted-foreground underline underline-offset-2 disabled:opacity-35"
              >
                Repetir en todos los días
              </button>
            )}
          </fieldset>
        ))}
      </div>
      <fieldset className="flex min-w-0 flex-col gap-2 rounded-[12px] border p-3">
        <legend className="px-1 text-sm font-semibold">
          Despensa de la semana
        </legend>
        <p className="text-xs text-muted-foreground">
          Lo que compras esa semana y no es de una comida: aseo, especias, la
          lista base.
        </p>
        <ListaComida
          nombre="la despensa"
          cantidades={semana.despensa}
          productos={productos}
          max={80}
          onChange={(despensa) => guardar({ ...semana, despensa })}
        />
        <button
          type="button"
          disabled={!conLista || Object.keys(config.items).length === 0}
          onClick={() => conLista && cambiar({ semanas: conLista.semanas })}
          className="self-start text-sm font-medium text-muted-foreground underline underline-offset-2 disabled:opacity-35"
        >
          Traer la lista base
        </button>
      </fieldset>
    </div>
  );
}
