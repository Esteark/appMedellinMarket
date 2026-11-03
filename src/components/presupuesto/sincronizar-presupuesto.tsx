"use client";

import { useEffect, useRef } from "react";
import {
  guardarPresupuestoMensual,
  obtenerPresupuestoMensual,
} from "@/app/presupuesto/acciones";
import { avisar } from "@/lib/avisos";
import {
  guardarPresupuestoMes,
  leerPresupuestoDieta,
  leerPresupuestoHogar,
  leerPresupuestoMes,
  leerPresupuestosAnteriores,
} from "@/lib/presupuesto/almacenamiento";
import { presupuestoDelMes } from "@/lib/presupuesto/por-mes";

function mesActual(): string {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const bogota = new Date(utc + -5 * 3600000);
  return bogota.toISOString().slice(0, 7);
}

export function SincronizarPresupuesto() {
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    const mes = mesActual();
    // Lo que ya hay en este dispositivo para el mes (o, la primera vez, lo de antes de tener un presupuesto por mes).
    // Lo heredado de otro mes no se sube: se guarda cuando la persona lo edita.
    const x = presupuestoDelMes({
      mes,
      delMes: leerPresupuestoMes(mes),
      anteriores: leerPresupuestosAnteriores(mes),
      inicial: leerPresupuestoHogar() ?? leerPresupuestoDieta() ?? [],
    });
    if (x.origen === "heredado" || x.rubros.length === 0) return;
    void obtenerPresupuestoMensual(mes).then((r) => {
      if (!r.ok) return;
      if (Array.isArray(r.rubros) && r.rubros.length > 0) return;
      void guardarPresupuestoMensual(mes, x.rubros).then((res) => {
        if (!res.ok) return;
        guardarPresupuestoMes(mes, x.rubros);
        avisar("presupuesto_fusionado");
      });
    });
  }, []);

  return null;
}
