"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  guardarPresupuestoMensual,
  obtenerPresupuestosHasta,
} from "@/app/presupuesto/acciones";
import { avisar } from "@/lib/avisos";
import {
  guardarPresupuestoDieta,
  guardarPresupuestoHogar,
  guardarPresupuestoMes,
  leerPresupuestoMes,
  leerPresupuestosAnteriores,
  rubrosIniciales,
} from "@/lib/presupuesto/almacenamiento";
import {
  type OrigenPresupuesto,
  presupuestoDelMes,
} from "@/lib/presupuesto/por-mes";
import type { PresupuestoRubro } from "@/lib/presupuesto/tipos";

/** Espera a que la persona deje de teclear: cada tecla no debe ser un cambio en el historial. */
const RETRASO_MS = 700;

type Origen = { origen: OrigenPresupuesto; desde?: string };

/**
 * El presupuesto por rubro de un mes. Se muestra primero lo del dispositivo y enseguida lo de la cuenta (la cuenta
 * manda). Al editar se guarda en el dispositivo al instante y, con sesión, en la cuenta tras `RETRASO_MS`.
 */
export function usePresupuestoMes(mes: string, version: number) {
  const [rubros, setRubros] = useState<PresupuestoRubro[]>([]);
  const [origen, setOrigen] = useState<Origen>({ origen: "inicial" });
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const pendiente = useRef<{
    mes: string;
    rubros: PresupuestoRubro[];
  } | null>(null);

  const enviar = useCallback(async () => {
    const p = pendiente.current;
    if (!p) return;
    pendiente.current = null;
    const r = await guardarPresupuestoMensual(p.mes, p.rubros);
    if (!r.ok && r.error !== "sin_sesion") avisar("presupuesto_no_guardado");
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `version` solo fuerza la recarga
  useEffect(() => {
    if (!mes) return;
    let vivo = true;
    const aplicar = (
      delMes: PresupuestoRubro[] | null | undefined,
      anteriores: Record<string, PresupuestoRubro[] | null | undefined>,
    ) => {
      const x = presupuestoDelMes({
        mes,
        delMes,
        anteriores,
        inicial: rubrosIniciales(),
      });
      setRubros(x.rubros);
      setOrigen({ origen: x.origen, desde: x.desde });
    };
    aplicar(leerPresupuestoMes(mes), leerPresupuestosAnteriores(mes));
    void obtenerPresupuestosHasta(mes).then((r) => {
      // Sin sesión no hay cuenta; con un cambio sin enviar, lo de la cuenta sería viejo.
      if (!vivo || !r.ok || pendiente.current) return;
      aplicar(r.meses[mes] ?? leerPresupuestoMes(mes), {
        ...leerPresupuestosAnteriores(mes),
        ...r.meses,
      });
    });
    return () => {
      vivo = false;
    };
  }, [mes, version]);

  const guardar = useCallback(
    (nuevos: PresupuestoRubro[]) => {
      setRubros(nuevos);
      setOrigen({ origen: "mes" });
      guardarPresupuestoMes(mes, nuevos);
      // Hogar y Dieta siguen leyendo estas claves.
      guardarPresupuestoHogar(nuevos);
      guardarPresupuestoDieta(nuevos);
      pendiente.current = { mes, rubros: nuevos };
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => void enviar(), RETRASO_MS);
    },
    [mes, enviar],
  );

  // Al salir de la pantalla no se pierde lo que falta por enviar.
  useEffect(
    () => () => {
      clearTimeout(temporizador.current);
      void enviar();
    },
    [enviar],
  );

  return { rubros, origen, guardar };
}
