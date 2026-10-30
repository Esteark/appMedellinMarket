"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { encenderBombilla } from "@/lib/animaciones";
import { avisar } from "@/lib/avisos";
import { esRutaDeAuth } from "@/lib/tutorial/pasos";
import { useTutorial } from "./proveedor";

gsap.registerPlugin(useGSAP);

/** Ayuda siempre a mano: abajo a la izquierda, lejos de «Guardar lista» y de la barra del carrito. */
export function Bombilla() {
  const { ruta, abrir, reiniciar, terminados } = useTutorial();
  const [menu, setMenu] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const brillo = useRef<HTMLSpanElement>(null);
  const previos = useRef(terminados);

  // 12 · Se enciende una vez cada vez que se termina un recorrido.
  const { contextSafe } = useGSAP();
  useEffect(() => {
    if (terminados === previos.current) return;
    previos.current = terminados;
    if (boton.current)
      contextSafe(encenderBombilla)(boton.current, brillo.current);
  }, [terminados, contextSafe]);

  useEffect(() => {
    if (!menu) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu(false);
      boton.current?.focus();
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [menu]);

  if (!ruta || esRutaDeAuth(ruta)) return null;
  const elegir = (accion: () => void) => () => {
    setMenu(false);
    accion();
  };
  const OPCION =
    "w-full rounded-[10px] px-3 py-2 text-left text-sm font-medium hover:bg-secondary";

  return (
    <div
      data-tour="bombilla"
      className="fixed left-5 z-40 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-[calc(1.25rem+env(safe-area-inset-bottom))]"
    >
      {menu && (
        <div
          role="menu"
          aria-label="Ayuda"
          className="absolute bottom-14 left-0 flex w-52 flex-col gap-0.5 rounded-[14px] border bg-card p-1.5 shadow-[0_12px_32px_rgb(15_23_42/0.18)]"
        >
          <button
            type="button"
            role="menuitem"
            className={OPCION}
            onClick={elegir(() => abrir("pantalla"))}
          >
            Ver esta pantalla
          </button>
          <button
            type="button"
            role="menuitem"
            className={OPCION}
            onClick={elegir(() => abrir("general"))}
          >
            Tutorial general
          </button>
          <button
            type="button"
            role="menuitem"
            className={OPCION}
            onClick={elegir(() => {
              reiniciar();
              avisar("tutorial_reiniciado");
            })}
          >
            Reiniciar tutorial
          </button>
          <button
            type="button"
            role="menuitem"
            className={OPCION}
            onClick={() => {
              setMenu(false);
              boton.current?.focus();
            }}
          >
            Cerrar
          </button>
        </div>
      )}
      <button
        ref={boton}
        type="button"
        aria-label="Ayuda y tutorial"
        aria-haspopup="menu"
        aria-expanded={menu}
        onClick={() => setMenu((m) => !m)}
        className="relative grid size-12 place-items-center rounded-full border bg-card text-xl shadow-[0_6px_18px_rgb(15_23_42/0.18)]"
      >
        <span
          ref={brillo}
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-warn-bg opacity-0"
        />
        <span aria-hidden="true" className="relative">
          💡
        </span>
      </button>
    </div>
  );
}
