"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTutorial } from "@/components/tutorial/proveedor";
import { type ClaveTip, TIPS } from "@/lib/avisos";

const CLAVE_ULTIMO = "mercado-medellin:tips:last-shown";
const CLAVE_HOY = "mercado-medellin:tips:count";
const CLAVE_SILENCIAR = "mercado-medellin:tips:silenciar";
const RETARDO_MS = 90000;
const COOLDOWN_HORAS = 12;
const MAX_POR_DIA = 1;

function hoyStr() {
  return new Date().toISOString().slice(0, 10);
}

function silenciado(): boolean {
  try {
    return localStorage.getItem(CLAVE_SILENCIAR) === "1";
  } catch {
    return false;
  }
}

function puedeMostrar(): boolean {
  if (silenciado()) return false;
  try {
    const ultimo = localStorage.getItem(CLAVE_ULTIMO);
    if (ultimo) {
      const diff = Date.now() - Number(ultimo);
      if (diff < COOLDOWN_HORAS * 3600_000) return false;
    }
    const crudo = localStorage.getItem(CLAVE_HOY);
    if (crudo) {
      const p = JSON.parse(crudo) as { fecha: string; count: number };
      if (p.fecha === hoyStr() && p.count >= MAX_POR_DIA) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function marcarMostrado() {
  try {
    localStorage.setItem(CLAVE_ULTIMO, String(Date.now()));
    const crudo = localStorage.getItem(CLAVE_HOY);
    const p = crudo
      ? (JSON.parse(crudo) as { fecha: string; count: number })
      : { fecha: hoyStr(), count: 0 };
    localStorage.setItem(
      CLAVE_HOY,
      JSON.stringify({
        fecha: hoyStr(),
        count: p.fecha === hoyStr() ? p.count + 1 : 1,
      }),
    );
  } catch {
    // ignorar
  }
}

export function TipsNoInvasivos() {
  const pathname = usePathname();
  // Mientras el tutorial está abierto o ya se completó, no se repite la ayuda con tips.
  const { activo, completado } = useTutorial();
  const sinTips = activo || completado;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mostradoRef = useRef(false);
  const [tip, setTip] = useState<ClaveTip | null>(null);
  const cont = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!tip || !cont.current) return;
      let reducir = false;
      if (typeof window !== "undefined") {
        reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      }
      if (reducir) return;
      gsap.fromTo(
        cont.current,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.28, ease: "power2.out" },
      );
    },
    { dependencies: [tip], scope: cont },
  );

  useEffect(() => {
    if (sinTips || mostradoRef.current) return;
    let reducir = false;
    if (typeof window !== "undefined") {
      reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    if (reducir) return;
    if (silenciado()) return;
    if (!puedeMostrar()) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (mostradoRef.current) return;
      if (silenciado()) return;
      if (!puedeMostrar()) return;
      const rutas: Array<[RegExp, ClaveTip]> = [
        [/^\/presupuesto/, "presupuesto_historico"],
        [/^\/hogar|^\/dieta/, "presupuesto_cuadrar"],
      ];
      for (const [re, clave] of rutas) {
        if (re.test(pathname)) {
          mostradoRef.current = true;
          setTip(clave);
          marcarMostrado();
          return;
        }
      }
      if (pathname === "/") {
        mostradoRef.current = true;
        setTip("presupuesto_agregar_producto");
        marcarMostrado();
      }
    }, RETARDO_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname, sinTips]);

  if (!tip || sinTips || typeof document === "undefined") return null;
  const t = TIPS[tip];
  const silenciar = () => {
    try {
      localStorage.setItem(CLAVE_SILENCIAR, "1");
    } catch {
      // ignorar
    }
    cerrar();
  };

  const cerrar = () => {
    if (!cont.current) {
      setTip(null);
      return;
    }
    let reducir = false;
    if (typeof window !== "undefined") {
      reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    if (reducir) {
      setTip(null);
      return;
    }
    gsap.to(cont.current, {
      x: 40,
      opacity: 0,
      duration: 0.18,
      ease: "power1.in",
      onComplete: () => setTip(null),
    });
  };

  return createPortal(
    <div
      ref={cont}
      role="status"
      aria-live="polite"
      className={`aviso aviso-${t.tipo} fixed right-3 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-[65] flex flex-col gap-1.5 max-w-[360px]`}
      style={{
        background: "var(--card)",
        color: "var(--foreground)",
        borderRadius: 14,
        padding: "10px 12px",
        boxShadow: "0 12px 32px rgb(15 23 42 / 0.16)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span className="aviso-icono" aria-hidden>
          {t.emoji}
        </span>
        <span className="aviso-texto">{t.texto}</span>
        <button
          type="button"
          className="aviso-cerrar"
          aria-label="Cerrar"
          onClick={cerrar}
        >
          ×
        </button>
      </div>
      <button
        type="button"
        onClick={silenciar}
        className="self-end text-xs text-muted-foreground"
      >
        No mostrar más sugerencias
      </button>
    </div>,
    document.body,
  );
}
