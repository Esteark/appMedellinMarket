"use client";

import { type ReactNode, useState } from "react";
import { type ErrorRubro, textoErrorRubro } from "@/lib/planes/rubros";

const MAX_MONTO = 10_000_000;
const boton = "rounded-[10px] border px-2.5 py-1 text-xs";

type Props = {
  nombre: string;
  monto: number;
  primero: boolean;
  ultimo: boolean;
  /** «Otros»: no se renombra ni se quita. */
  fijo: boolean;
  resumen: string;
  onMonto: (monto: number) => void;
  onMover: (delta: 1 | -1) => void;
  onRenombrar: (nuevo: string) => ErrorRubro | null;
  onQuitar: () => void;
  /** Los chips de grupos; aparecen al pulsar «Grupos». */
  children: ReactNode;
};

/** Un rubro: nombre, monto, subir/bajar, renombrar, quitar con confirmación y sus grupos. */
export function RubroFila(props: Props) {
  const { nombre, monto, primero, ultimo, fijo, resumen } = props;
  const [modo, setModo] = useState<"ver" | "renombrar" | "quitar">("ver");
  const [nuevo, setNuevo] = useState(nombre);
  const [error, setError] = useState<ErrorRubro | null>(null);
  const [grupos, setGrupos] = useState(false);

  const renombrar = () => {
    const e = props.onRenombrar(nuevo);
    setError(e);
    if (!e) setModo("ver");
  };

  return (
    <li
      data-testid={`rubro-${nombre}`}
      className="flex flex-col gap-2 border-t py-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        {modo === "renombrar" ? (
          <form
            className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              renombrar();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault(); // quien escucha Esc en `document` lo respeta
                e.stopPropagation();
                setModo("ver");
                setError(null);
              }
            }}
          >
            <input
              aria-label={`Nuevo nombre de ${nombre}`}
              value={nuevo}
              maxLength={40}
              onChange={(e) => setNuevo(e.target.value)}
              className="h-9 min-w-0 flex-1 rounded-[10px] border border-input bg-background px-2 text-base sm:text-sm"
            />
            <button type="submit" className={boton}>
              Guardar
            </button>
            <button
              type="button"
              className={boton}
              onClick={() => {
                setModo("ver");
                setError(null);
              }}
            >
              Cancelar
            </button>
          </form>
        ) : (
          <span className="min-w-0 flex-1 truncate font-medium">{nombre}</span>
        )}
        <span className="flex items-center gap-1">
          <span className="text-muted-foreground">$</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={MAX_MONTO}
            step={1000}
            value={monto}
            onChange={(e) => {
              const n = Number(e.target.value);
              props.onMonto(
                Number.isFinite(n)
                  ? Math.min(MAX_MONTO, Math.max(0, Math.round(n)))
                  : 0,
              );
            }}
            aria-label={`Presupuesto de ${nombre}`}
            className="w-32 rounded-[10px] border border-input bg-background px-2 py-1 text-right tabular-nums sm:w-40"
          />
        </span>
      </div>

      {error && (
        <p role="alert" className="text-xs text-up-ink">
          {textoErrorRubro(error)}
        </p>
      )}

      {modo === "quitar" ? (
        <p className="flex flex-wrap items-center gap-1.5 text-sm">
          ¿Quitar «{nombre}»? Sus grupos pasarán a «Otros».
          <button
            type="button"
            className={boton}
            onClick={() => {
              props.onQuitar();
              setModo("ver");
            }}
          >
            Sí, quitar
          </button>
          <button
            type="button"
            className={boton}
            onClick={() => setModo("ver")}
          >
            No
          </button>
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            className={boton}
            aria-label={`Subir ${nombre}`}
            disabled={primero}
            onClick={() => props.onMover(-1)}
          >
            ↑
          </button>
          <button
            type="button"
            className={boton}
            aria-label={`Bajar ${nombre}`}
            disabled={ultimo}
            onClick={() => props.onMover(1)}
          >
            ↓
          </button>
          {!fijo && (
            <>
              <button
                type="button"
                className={boton}
                onClick={() => {
                  setNuevo(nombre);
                  setModo("renombrar");
                }}
              >
                Renombrar
              </button>
              <button
                type="button"
                className={boton}
                aria-label={`Quitar ${nombre}`}
                onClick={() => setModo("quitar")}
              >
                Quitar
              </button>
            </>
          )}
          {!fijo && (
            <button
              type="button"
              aria-expanded={grupos}
              className={boton}
              onClick={() => setGrupos((g) => !g)}
            >
              Grupos
            </button>
          )}
          <span className="text-xs text-muted-foreground">{resumen}</span>
        </div>
      )}
      {!fijo && grupos && props.children}
    </li>
  );
}
