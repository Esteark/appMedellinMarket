"use client";

import { useEffect, useRef } from "react";
import { guardarLista } from "@/app/acciones";
import {
  leerLista,
  reemplazarLista,
  useLista,
} from "@/components/carrito/use-lista";
import { avisar } from "@/lib/avisos";
import type { Lista } from "@/lib/precios/lista";

/** Máximo por producto: no se pierde nada de ninguna de las dos listas. */
export function fusionar(a: Lista, b: Lista): Lista {
  const r = { ...b };
  for (const [id, q] of Object.entries(a)) r[id] = Math.max(q, r[id] ?? 0);
  return r;
}

const igual = (a: Lista, b: Lista) =>
  JSON.stringify(Object.entries(a).sort()) ===
  JSON.stringify(Object.entries(b).sort());

async function guardar(lista: Lista) {
  try {
    const r = await guardarLista(lista);
    if (r.ok) return true;
    avisar(r.error === "sin_sesion" ? "sesion_expirada" : "lista_no_guardada");
  } catch {
    avisar(navigator.onLine ? "lista_no_guardada" : "sin_conexion");
  }
  return false;
}

/** Con sesión: fusiona la lista del dispositivo con la guardada y guarda cada cambio (800 ms). */
export function SincronizarLista({ guardada }: { guardada: Lista }) {
  const [lista] = useLista();
  /** Lo último que está (o va camino de estar) en la base; null hasta fusionar. */
  const enBase = useRef<Lista | null>(null);
  const clave = JSON.stringify(guardada);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `clave` resume `guardada`
  useEffect(() => {
    const local = leerLista();
    const unida = fusionar(local, guardada);
    enBase.current = guardada;
    if (!igual(unida, local)) reemplazarLista(unida);
    if (!Object.keys(local).length || igual(unida, guardada)) return;
    enBase.current = unida;
    void guardar(unida).then((ok) => {
      if (ok) avisar("lista_fusionada", { n: Object.keys(unida).length });
      else enBase.current = guardada;
    });
  }, [clave]);

  useEffect(() => {
    const previa = enBase.current;
    if (!previa || igual(lista, previa)) return;
    const t = setTimeout(() => {
      enBase.current = lista;
      // Si falla, el próximo cambio vuelve a intentarlo (lo dice el texto de lista_no_guardada).
      void guardar(lista).then((ok) => {
        if (!ok) enBase.current = previa;
      });
    }, 800);
    return () => clearTimeout(t);
  }, [lista]);

  return null;
}
