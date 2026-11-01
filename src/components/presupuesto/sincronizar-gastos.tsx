"use client";

import { useEffect, useRef } from "react";
import { agregarGasto, listarGastos } from "@/app/presupuesto/acciones";
import { avisar } from "@/lib/avisos";
import {
  guardarGastosLocal,
  leerGastosLocal,
} from "@/lib/presupuesto/almacenamiento";
import type { GastoReal } from "@/lib/presupuesto/tipos";

const clave = (g: GastoReal) =>
  `${g.fecha}|${g.rubro}|${g.monto}|${g.descripcion ?? g.nota ?? ""}`;

/** Al iniciar sesión sube los gastos que solo estaban en el dispositivo (los que ya están en la cuenta no se repiten). */
export function SincronizarGastos() {
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    const meses = Object.keys(localStorage)
      .filter((k) => k.startsWith("mercado-medellin:gastos:"))
      .map((k) => k.split(":")[2]);
    void (async () => {
      let subidos = 0;
      for (const mes of meses) {
        const pendientes = leerGastosLocal(mes).filter((g) =>
          g.id.startsWith("local-"),
        );
        if (!pendientes.length) continue;
        const r = await listarGastos(mes);
        if (!r.ok) return; // sin sesión: se queda en el dispositivo
        const enNube = new Set((r.gastos as GastoReal[]).map(clave));
        const subidosMes: GastoReal[] = [];
        for (const g of pendientes.filter((p) => !enNube.has(clave(p)))) {
          const a = await agregarGasto({
            fecha: g.fecha,
            mes,
            rubro: g.rubro,
            monto: g.monto,
            origen: g.origen,
            nota: g.nota,
            producto_id: g.producto_id,
            cantidad: g.cantidad,
            descripcion: g.descripcion,
          });
          if (a.ok) subidosMes.push(g);
        }
        subidos += subidosMes.length;
        // Lo subido (o ya en la nube) sale de lo local; lo que falló se queda para reintentar.
        const fuera = new Set(subidosMes.map((g) => g.id));
        guardarGastosLocal(
          mes,
          leerGastosLocal(mes).filter(
            (g) =>
              !g.id.startsWith("local-") ||
              !(fuera.has(g.id) || enNube.has(clave(g))),
          ),
        );
      }
      if (subidos > 0) avisar("gastos_sincronizados", { n: subidos });
    })().catch(() => {});
  }, []);

  return null;
}
