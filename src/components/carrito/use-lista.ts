"use client";

import { useCallback, useEffect, useState } from "react";
import type { Lista } from "@/lib/precios/lista";

const CLAVE = "mercado-medellin:lista";

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

function guardar(lista: Lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Modo privado o almacenamiento lleno: la lista vive solo en memoria.
  }
}

/** Lista sin sesión: en localStorage (la de sesión llega en el paso 14). */
export function useLista() {
  const [lista, setLista] = useState<Lista>({});
  useEffect(() => setLista(leer()), []);
  const cambiar = useCallback((id: string, delta: number) => {
    setLista((antes) => {
      const lista = { ...antes };
      const q = Math.max(0, (lista[id] ?? 0) + delta);
      if (q) lista[id] = q;
      else delete lista[id];
      guardar(lista);
      return lista;
    });
  }, []);
  return [lista, cambiar] as const;
}
