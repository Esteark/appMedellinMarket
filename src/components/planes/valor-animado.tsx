"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { pesos } from "@/lib/formato";

/**
 * Muestra un monto y lo anima cuando cambia (sin tocar el valor final si el
 * dispositivo pide menos movimiento). El primer render coincide con el del
 * servidor para no romper la hidratación.
 */
export function ValorAnimado({
  valor,
  className,
}: {
  valor: number;
  className?: string;
}) {
  const [mostrado, setMostrado] = useState(valor);
  const actual = useRef(valor);

  useEffect(() => {
    const reducir =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducir || actual.current === valor) {
      actual.current = valor;
      setMostrado(valor);
      return;
    }
    const estado = { n: actual.current };
    const tween = gsap.to(estado, {
      n: valor,
      duration: 0.45,
      ease: "power2.out",
      onUpdate() {
        actual.current = estado.n;
        setMostrado(estado.n);
      },
      onComplete() {
        actual.current = valor;
        setMostrado(valor);
      },
    });
    return () => {
      tween.kill();
    };
  }, [valor]);

  return (
    <span className={className} title={pesos(valor)}>
      {pesos(mostrado)}
    </span>
  );
}
