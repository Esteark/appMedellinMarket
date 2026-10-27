"use client";

import { type ReactNode, useCallback, useLayoutEffect, useRef } from "react";
import { abrirHoja, arrastrable, cerrarHoja } from "@/lib/animaciones";

type Props = {
  /** id del título que nombra el diálogo. */
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
};

/** Hoja inferior modal: se cierra arrastrando el asa, con "Cerrar", con Escape o tocando el fondo. */
export function Hoja({ titulo, alCerrar, children }: Props) {
  const hoja = useRef<HTMLElement>(null);
  const fondo = useRef<HTMLButtonElement>(null);
  const asa = useRef<HTMLDivElement>(null);
  const botonCerrar = useRef<HTMLButtonElement>(null);
  const cerrando = useRef(false);
  // El padre pasa un alCerrar nuevo en cada render (p. ej. cuando llegan los datos del
  // Suspense); si fuera dependencia, la animación de entrada se reiniciaría: el parpadeo.
  const alCerrarActual = useRef(alCerrar);
  alCerrarActual.current = alCerrar;

  const cerrar = useCallback(() => {
    if (cerrando.current) return;
    cerrando.current = true;
    const fin = () => alCerrarActual.current();
    if (hoja.current && fondo.current)
      cerrarHoja(hoja.current, fondo.current, fin);
    else fin();
  }, []);

  // Layout effect: la hoja se coloca abajo antes del primer pintado, sin un cuadro visible arriba.
  useLayoutEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    if (hoja.current && fondo.current) abrirHoja(hoja.current, fondo.current);
    botonCerrar.current?.focus();
    let vivo = true;
    let deshacer: (() => void) | undefined;
    if (hoja.current && asa.current)
      arrastrable(hoja.current, asa.current, cerrar).then((f) => {
        if (vivo) deshacer = f;
        else f();
      });
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    document.addEventListener("keydown", tecla);
    return () => {
      vivo = false;
      deshacer?.();
      document.removeEventListener("keydown", tecla);
      previo?.focus();
    };
  }, [cerrar]);

  return (
    <>
      <button
        ref={fondo}
        type="button"
        tabIndex={-1}
        aria-label="Cerrar"
        onClick={cerrar}
        className="fixed inset-0 z-50 cursor-default bg-foreground/40"
      />
      <section
        ref={hoja}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titulo}
        className="fixed inset-x-0 bottom-0 z-[51] mx-auto flex max-h-[88vh] max-w-[560px] flex-col gap-3.5 overflow-auto rounded-t-[18px] bg-card px-4 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-foreground [@media(max-height:500px)]:max-h-[96vh]"
      >
        <div
          ref={asa}
          aria-hidden="true"
          className="flex cursor-grab touch-none justify-center py-1.5"
        >
          <span className="h-[5px] w-11 rounded-full bg-border" />
        </div>
        <button
          ref={botonCerrar}
          type="button"
          onClick={cerrar}
          className="absolute top-3 right-4 rounded-[10px] border bg-background px-3 py-1.5 text-sm font-medium"
        >
          Cerrar
        </button>
        {children}
      </section>
    </>
  );
}
