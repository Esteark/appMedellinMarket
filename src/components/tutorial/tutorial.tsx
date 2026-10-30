"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { abrirFoco, entrarTarjeta, moverFoco } from "@/lib/animaciones";
import { colocar, type Pos, RELLENO } from "@/lib/tutorial/posicion";
import { objetivoDe, resolver } from "./dom";
import { useTutorial } from "./proveedor";
import { TarjetaTutorial } from "./tarjeta-tutorial";

gsap.registerPlugin(useGSAP);

/** Recorrido guiado: oscurece la pantalla y deja iluminado solo el elemento que explica. */
export function Tutorial() {
  const { activo, pasos, cerrar } = useTutorial();
  const [i, setI] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [montado, setMontado] = useState(false);
  const foco = useRef<HTMLDivElement>(null);
  const tarjeta = useRef<HTMLDivElement>(null);
  const primero = useRef(true);
  const visto = useRef(false);
  useEffect(() => setMontado(true), []);

  // Al abrir: esperar a que exista el primer objetivo (las páginas cargan datos por Suspense).
  useEffect(() => {
    if (!activo) {
      setI(-1);
      setRect(null);
      primero.current = true;
      visto.current = false;
      return;
    }
    let intentos = 0;
    const t = setInterval(() => {
      const k = resolver(pasos, 0, 1);
      if (k >= 0) {
        clearInterval(t);
        setI(k);
      } else if (++intentos > 12) {
        clearInterval(t);
        cerrar(false); // nada que explicar aquí: que vuelva a intentarse otro día
      }
    }, 250);
    return () => clearInterval(t);
  }, [activo, pasos, cerrar]);

  // Esc cierra aunque el foco aún no haya llegado a la tarjeta (el resto de la página está inerte).
  const cierre = useRef<() => void>(() => {});
  useEffect(() => {
    if (!activo) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cierre.current();
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [activo]);

  // Hasta resolver el primer paso no hay nada que mostrar (ni bloquear).
  const listo = activo && i >= 0;

  // El resto de la página queda inerte y oculto para lectores mientras dura.
  useEffect(() => {
    if (!listo) return;
    const afectados = [...document.body.children].filter(
      (e) => e.id !== "tutorial-raiz",
    );
    for (const e of afectados) {
      e.setAttribute("inert", "");
      e.setAttribute("aria-hidden", "true");
    }
    return () => {
      for (const e of afectados) {
        e.removeAttribute("inert");
        e.removeAttribute("aria-hidden");
      }
    };
  }, [listo]);

  const medir = useCallback(() => {
    const el = i >= 0 ? objetivoDe(pasos[i]) : null;
    if (el) setRect(el.getBoundingClientRect());
  }, [i, pasos]);

  // Paso nuevo: centrar el objetivo y medirlo.
  useLayoutEffect(() => {
    if (!activo || i < 0) return;
    objetivoDe(pasos[i])?.scrollIntoView({ block: "center" });
    visto.current = true;
    medir();
  }, [activo, i, pasos, medir]);

  // Seguir al objetivo si la ventana cambia o se desplaza.
  useEffect(() => {
    if (!activo) return;
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [activo, medir]);

  // 11 · Foco que se abre y se desliza entre pasos; tarjeta que entra desde el lado cercano.
  const { contextSafe } = useGSAP({ scope: foco });
  useLayoutEffect(() => {
    if (!rect || !foco.current || !tarjeta.current) return;
    const x = rect.left - RELLENO;
    const y = rect.top - RELLENO;
    const p = colocar(
      rect,
      tarjeta.current.offsetWidth,
      tarjeta.current.offsetHeight,
      window.innerWidth,
      window.innerHeight,
    );
    setPos(p);
    if (primero.current) {
      gsap.set(foco.current, { x, y, transformOrigin: "50% 50%" });
      abrirFoco(foco.current);
      entrarTarjeta(tarjeta.current, p.dx, p.dy);
      primero.current = false;
    } else contextSafe(moverFoco)(foco.current, x, y);
    // eslint: se recalcula con cada medición
  }, [rect, contextSafe]);
  const ultimo = useRef(-2);
  useEffect(() => {
    // La tarjeta vuelve a entrar en cada paso, no en cada scroll.
    if (i === ultimo.current || !tarjeta.current || !pos) return;
    if (ultimo.current !== -2) entrarTarjeta(tarjeta.current, pos.dx, pos.dy);
    ultimo.current = i;
    tarjeta.current.querySelector<HTMLElement>("[data-siguiente]")?.focus();
  }, [i, pos]);
  useEffect(() => {
    if (!activo) ultimo.current = -2;
  }, [activo]);

  if (!montado || !listo) return null;
  const existentes = pasos.filter((p) => objetivoDe(p));
  const paso = i >= 0 ? pasos[i] : null;
  const n = paso ? existentes.indexOf(paso) + 1 : 0;
  const esUltimo = !!paso && resolver(pasos, i + 1, 1) < 0;
  const cerrarYa = () => cerrar(visto.current);
  cierre.current = cerrarYa;

  const siguiente = () => {
    const k = resolver(pasos, i + 1, 1);
    if (k < 0) return cerrar(true);
    setI(k);
  };
  const anterior = () => {
    const k = resolver(pasos, i - 1, -1);
    if (k >= 0) setI(k);
  };
  const teclas = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const botones = [
      ...(tarjeta.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled)",
      ) ?? []),
    ];
    if (!botones.length) return;
    const primeroB = botones[0];
    const ultimoB = botones[botones.length - 1];
    if (e.shiftKey && document.activeElement === primeroB) {
      e.preventDefault();
      ultimoB.focus();
    } else if (!e.shiftKey && document.activeElement === ultimoB) {
      e.preventDefault();
      primeroB.focus();
    }
  };

  return createPortal(
    <div id="tutorial-raiz">
      {/* Atrapa los clics: mientras dura, la página de atrás no se toca. */}
      <div className="fixed inset-0 z-[70]" aria-hidden="true" />
      <div
        ref={foco}
        aria-hidden="true"
        data-testid="tutorial-foco"
        className="pointer-events-none fixed top-0 left-0 z-[71] rounded-[14px] border-2 border-white shadow-[0_0_0_9999px_rgba(15,23,42,.55)]"
        style={{
          width: rect ? rect.width + RELLENO * 2 : 0,
          height: rect ? rect.height + RELLENO * 2 : 0,
          opacity: rect ? undefined : 0,
        }}
      />
      <TarjetaTutorial
        ref={tarjeta}
        pos={pos}
        paso={paso}
        n={n}
        total={existentes.length}
        esUltimo={esUltimo}
        hayAnterior={resolver(pasos, i - 1, -1) >= 0}
        alAnterior={anterior}
        alSiguiente={siguiente}
        alSaltar={() => cerrar(true)}
        alCerrar={cerrarYa}
        alTeclear={teclas}
      />
    </div>,
    document.body,
  );
}
