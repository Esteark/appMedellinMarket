"use client";

import { type InputHTMLAttributes, useLayoutEffect, useRef } from "react";
import {
  aNumero,
  conMiles,
  posicionTrasFormato,
  soloDigitos,
} from "@/lib/moneda";

type Props = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode" | "min" | "max" | "step"
> & {
  /** Cadena de dígitos sin formato ("3000"); vacía si no hay valor. */
  value: string;
  /** Recibe la cadena de dígitos sin formato, ya limitada al tope. */
  onChange: (digitos: string) => void;
};

/**
 * Campo de dinero: se escribe 3000 y se ve 3.000. Solo la pantalla lleva puntos; al estado y a la base
 * llegan los dígitos (un entero), nunca el texto con formato.
 */
export function CampoMoneda({ value, onChange, className, ...resto }: Props) {
  const campo = useRef<HTMLInputElement>(null);
  const cursor = useRef<number | null>(null);
  const mostrado = conMiles(soloDigitos(value));

  // React reescribe el valor y manda el cursor al final: se devuelve a donde estaba.
  useLayoutEffect(() => {
    const el = campo.current;
    if (el && cursor.current !== null && document.activeElement === el)
      el.setSelectionRange(cursor.current, cursor.current);
    cursor.current = null;
  });

  return (
    <span className="flex items-center gap-1">
      <span aria-hidden="true" className="text-muted-foreground">
        $
      </span>
      <input
        {...resto}
        ref={campo}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={mostrado}
        className={className}
        onChange={(e) => {
          const crudo = e.target.value;
          const n = aNumero(crudo);
          const limpio = n === null ? "" : String(n);
          cursor.current = posicionTrasFormato(
            crudo,
            e.target.selectionStart ?? crudo.length,
            conMiles(limpio),
          );
          onChange(limpio);
          // Si el valor no cambió (se tecleó una letra) no hay nueva pintura que lo corrija: se hace aquí.
          queueMicrotask(() => {
            const el = campo.current;
            const c = cursor.current;
            cursor.current = null;
            if (el && c !== null && document.activeElement === el)
              el.setSelectionRange(c, c);
          });
        }}
      />
    </span>
  );
}
