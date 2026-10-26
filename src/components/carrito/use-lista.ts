"use client";

import { useSyncExternalStore } from "react";
import { avisar } from "@/lib/avisos";
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
let sinAlmacenamiento = false;
const oyentes = new Set<() => void>();
const notificar = () => {
  for (const o of oyentes) o();
};

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  // Otra pestaña cambió la lista.
  const alAlmacenar = (e: StorageEvent) => {
    if (e.key !== CLAVE) return;
    actual = leer();
    notificar();
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

/** La lista actual fuera de un render (el primer render tras hidratar ve la vacía del servidor). */
export const leerLista = foto;

/** Reemplaza la lista entera (fusión con la guardada, vaciar, deshacer). */
export function reemplazarLista(lista: Lista) {
  actual = lista;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Modo privado o almacenamiento lleno: la lista vive solo en memoria.
    if (!sinAlmacenamiento) avisar("almacenamiento_no_disponible");
    sinAlmacenamiento = true;
  }
  notificar();
}

export function cambiarLista(id: string, delta: number) {
  const lista = { ...foto() };
  const q = Math.max(0, (lista[id] ?? 0) + delta);
  if (q) lista[id] = q;
  else delete lista[id];
  reemplazarLista(lista);
}

/** Lista del dispositivo; con sesión, `SincronizarLista` la refleja en la tabla `listas`. */
export function useLista() {
  const lista = useSyncExternalStore(suscribir, foto, () => VACIA);
  return [lista, cambiarLista] as const;
}
