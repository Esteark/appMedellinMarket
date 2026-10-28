"use client";

import { useEffect, useRef } from "react";
import {
  guardarPresupuestoMensual,
  obtenerPresupuestoMensual,
} from "@/app/presupuesto/acciones";
import { avisar } from "@/lib/avisos";
import {
  leerPresupuestoDieta,
  leerPresupuestoHogar,
} from "@/lib/presupuesto/almacenamiento";

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
    const rubros = leerPresupuestoHogar() ?? leerPresupuestoDieta();
    if (!rubros || rubros.length === 0) return;
    void obtenerPresupuestoMensual(mes).then((r) => {
      if (!r.ok) return;
      if (Array.isArray(r.rubros) && r.rubros.length > 0) return;
      void guardarPresupuestoMensual(mes, rubros).then((res) => {
        if (res.ok) avisar("presupuesto_fusionado");
      });
    });
  }, []);

  return null;
}
