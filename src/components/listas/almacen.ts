"use client";

import { sincronizarListas } from "@/app/listas/acciones";
import { avisar } from "@/lib/avisos";
import { guardarLocales, type ListaGuardada } from "@/lib/listas/guardadas";

/** Guarda en el dispositivo y, si hay sesión, deja la nube igual. Sin sesión no hay nada que hacer. */
export async function persistir(listas: ListaGuardada[]) {
  guardarLocales(listas);
  try {
    const r = await sincronizarListas(listas);
    if (!r.ok && r.error !== "sin_sesion") avisar("lista_no_guardada");
  } catch {
    avisar(navigator.onLine ? "lista_no_guardada" : "sin_conexion");
  }
}
