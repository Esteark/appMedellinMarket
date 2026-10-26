"use client";

import { useSyncExternalStore } from "react";
import type { Lista } from "@/lib/precios/lista";

const CLAVE = "mercado-medellin:lista";
const VACIA: Lista = {};

/** Lo guardado puede venir de otra versión o editado a mano: solo cantidades enteras > 0. */
function leer(): Lista {
  try {
    const crudo: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? "{}");
    if (!crudo || typeof crudo !== "object") return {};
    return Object.fromEntries(
      Object.entries(crudo).filter(
        ([, q]) => Number.isInteger(q) && (q as number) > 0,
      ),
    ) as Lista;
  } catch {
    return {};
  }
}

// Un solo estado para toda la página (catálogo, carrito y hoja de detalle comparten la lista).
let actual: Lista | null = null;
const oyentes = new Set<() => void>();
const avisar = () => {
  for (const o of oyentes) o();
};

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  // Otra pestaña cambió la lista.
  const alAlmacenar = (e: StorageEvent) => {
    if (e.key !== CLAVE) return;
    actual = leer();
    avisar();
  };
  window.addEventListener("storage", alAlmacenar);
  return () => {
    oyentes.delete(oyente);
    window.removeEventListener("storage", alAlmacenar);
  };
}

const foto = () => {
  actual ??= leer();
  return actual;
};

export function cambiarLista(id: string, delta: number) {
  const lista = { ...foto() };
  const q = Math.max(0, (lista[id] ?? 0) + delta);
  if (q) lista[id] = q;
  else delete lista[id];
  actual = lista;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Modo privado o almacenamiento lleno: la lista vive solo en memoria.
  }
  avisar();
}

/** Lista sin sesión: en localStorage (la de sesión llega en el paso 14). */
export function useLista() {
  const lista = useSyncExternalStore(suscribir, foto, () => VACIA);
  return [lista, cambiarLista] as const;
}
