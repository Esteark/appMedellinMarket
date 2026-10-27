"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const comportamiento = (): ScrollBehavior =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";

type Props = {
  children: ReactNode;
  /** Clases de la fila (gap, padding). */
  className?: string;
  /** Selector del hijo que se centra al montar (la pestaña activa). */
  centrar?: string;
  "data-testid"?: string;
};

/** Fila horizontal: scroll-snap, degradado donde hay más contenido y flechas solo con ratón. */
export function Deslizador({ children, className, centrar, ...resto }: Props) {
  const fila = useRef<HTMLDivElement>(null);
  const [mas, setMas] = useState({ izq: false, der: false });

  useEffect(() => {
    const el = fila.current;
    if (!el) return;
    if (centrar) {
      const hijo = el.querySelector<HTMLElement>(centrar);
      if (hijo)
        el.scrollLeft =
          hijo.offsetLeft - (el.clientWidth - hijo.offsetWidth) / 2;
    }
    const medir = () =>
      setMas({
        izq: el.scrollLeft > 1,
        der: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      });
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    // Con teclado, la opción enfocada entra en vista.
    const alEnfocar = (e: FocusEvent) => {
      if (e.target instanceof HTMLElement && e.target !== el)
        e.target.scrollIntoView({
          inline: "nearest",
          block: "nearest",
          behavior: comportamiento(),
        });
    };
    el.addEventListener("focusin", alEnfocar);
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => {
      el.removeEventListener("scroll", medir);
      el.removeEventListener("focusin", alEnfocar);
      observador.disconnect();
    };
  }, [centrar]);

  const mover = (sentido: 1 | -1) => {
    const el = fila.current;
    if (el)
      el.scrollBy({
        left: sentido * el.clientWidth * 0.8,
        behavior: comportamiento(),
      });
  };

  const flecha = (sentido: 1 | -1) => {
    const visible = sentido < 0 ? mas.izq : mas.der;
    return (
      <button
        type="button"
        tabIndex={-1}
        aria-label={sentido < 0 ? "Ver anteriores" : "Ver siguientes"}
        data-flecha={sentido < 0 ? "izq" : "der"}
        onClick={() => mover(sentido)}
        className={cn(
          "absolute top-1/2 z-10 hidden size-8 -translate-y-1/2 place-items-center rounded-full border bg-card text-lg shadow-sm",
          sentido < 0 ? "left-0" : "right-0",
          visible && "raton:grid",
        )}
      >
        {sentido < 0 ? "‹" : "›"}
      </button>
    );
  };

  return (
    <div className="relative min-w-0">
      <div
        ref={fila}
        {...resto}
        className={cn(
          "relative flex snap-x snap-proximity overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:snap-start",
          className,
        )}
      >
        {children}
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent transition-opacity",
          mas.izq ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent transition-opacity",
          mas.der ? "opacity-100" : "opacity-0",
        )}
      />
      {flecha(-1)}
      {flecha(1)}
    </div>
  );
}
