"use client";

import { useEffect } from "react";
import { sincronizarListas } from "@/app/listas/acciones";
import { avisar } from "@/lib/avisos";
import {
  fusionarListas,
  guardarLocales,
  type ListaGuardada,
  leerLocales,
} from "@/lib/listas/guardadas";

const huella = (ls: ListaGuardada[]) =>
  ls
    .map((l) => `${l.nombre.trim().toLowerCase()}@${l.actualizada}`)
    .sort()
    .join("|");

/** Con sesión: al entrar, fusiona las listas del dispositivo con las de la cuenta (gana la más reciente). */
export function SincronizarListas({ nube }: { nube: ListaGuardada[] }) {
  const clave = huella(nube);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `clave` resume `nube`
  useEffect(() => {
    const locales = leerLocales();
    const unidas = fusionarListas(locales, nube);
    guardarLocales(unidas);
    if (huella(unidas) === clave) return;
    sincronizarListas(unidas)
      .then((r) => {
        if (r.ok && locales.length)
          avisar("listas_fusionadas", { n: unidas.length });
      })
      .catch(() => avisar("sin_conexion"));
  }, [clave]);

  return null;
}
