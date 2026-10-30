"use client";

import { useEffect, useState } from "react";
import { pesos } from "@/lib/formato";
import {
  EVENTO_PRESUPUESTO,
  guardarReparto,
  leerPresupuestoDieta,
  leerPresupuestoHogar,
  leerReparto,
} from "@/lib/presupuesto/almacenamiento";
import {
  PRESUPUESTO_SUGERIDO_DIETA,
  PRESUPUESTO_SUGERIDO_HOGAR,
} from "@/lib/presupuesto/defaults";

type Props = {
  tipo: "hogar" | "dieta";
};

const DEFAULTS = {
  hogar: { personas: 6, aportantes: 4 },
  dieta: { personas: 5, aportantes: 5 },
};

function totalPresupuesto(tipo: "hogar" | "dieta"): number {
  const guardado =
    tipo === "hogar" ? leerPresupuestoHogar() : leerPresupuestoDieta();
  if (guardado?.length) return guardado.reduce((t, r) => t + r.monto, 0);
  const sug =
    tipo === "hogar" ? PRESUPUESTO_SUGERIDO_HOGAR : PRESUPUESTO_SUGERIDO_DIETA;
  return Object.values(sug).reduce((t, v) => t + v, 0);
}

export function RepartoInteractivo({ tipo }: Props) {
  const [personas, setPersonas] = useState(DEFAULTS[tipo].personas);
  const [aportantes, setAportantes] = useState(DEFAULTS.hogar.aportantes);
  const [totalSugerido, setTotal] = useState(() => totalPresupuesto(tipo));
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const g = leerReparto(tipo);
    if (g && g.personas > 0) setPersonas(g.personas);
    if (tipo === "hogar" && g?.aportantes && g.aportantes > 0)
      setAportantes(g.aportantes);
    setListo(true);
  }, [tipo]);

  // el presupuesto se edita en otro componente de la misma página
  useEffect(() => {
    const actualizar = () => setTotal(totalPresupuesto(tipo));
    actualizar();
    window.addEventListener(EVENTO_PRESUPUESTO, actualizar);
    return () => window.removeEventListener(EVENTO_PRESUPUESTO, actualizar);
  }, [tipo]);

  // no guardar antes de leer: los valores por defecto pisarían lo guardado
  useEffect(() => {
    if (!listo) return;
    guardarReparto(tipo, {
      personas,
      ...(tipo === "hogar" && { aportantes }),
      actualizado: new Date().toISOString(),
    });
  }, [listo, tipo, personas, aportantes]);

  const porPersona = personas > 0 ? Math.round(totalSugerido / personas) : 0;
  const porAportante =
    tipo === "hogar" && aportantes && aportantes > 0
      ? Math.round(totalSugerido / aportantes)
      : porPersona;

  const titulo =
    tipo === "hogar" ? "Presupuesto del hogar" : "Plan de mercado · dieta";
  const subtitulo =
    tipo === "hogar"
      ? "Alta proteína y fibra. Ajusta el número de personas y aportantes para ver el reparto al instante."
      : "Ensaladas diarias, cenas, desayunos y proteínas. Ajusta el número de personas para ver el reparto al instante.";

  return (
    <section className="flex flex-col gap-3 rounded-[14px] border bg-card p-3.5 transition-all duration-200 motion-reduce:transition-none">
      <div>
        <h1 className="text-xl font-bold">
          {titulo}
          {tipo === "hogar"
            ? ` · ${personas} personas, ${aportantes} aportantes`
            : ` · ${personas} personas`}
        </h1>
        <p className="text-sm text-muted-foreground">{subtitulo}</p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          ¿Entre cuántas personas?
          <input
            type="number"
            min={1}
            value={personas}
            onChange={(e) =>
              setPersonas(Math.max(1, Number(e.target.value) || 1))
            }
            className="mt-1 w-28 rounded-[10px] border px-2 py-1.5 tabular-nums"
          />
        </label>
        {tipo === "hogar" && (
          <label className="text-sm">
            ¿Cuántos aportantes?
            <input
              type="number"
              min={1}
              value={aportantes}
              onChange={(e) =>
                setAportantes(Math.max(1, Number(e.target.value) || 1))
              }
              className="mt-1 w-28 rounded-[10px] border px-2 py-1.5 tabular-nums"
            />
          </label>
        )}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-3">
        <div className="rounded-[12px] border p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none">
          <p className="text-xs text-muted-foreground">
            Total mes · presupuesto sugerido
          </p>
          <p className="text-xl font-bold tabular-nums">
            {pesos(totalSugerido)}
          </p>
          <p className="text-xs text-muted-foreground">
            Base: presupuesto sugerido por rubro
          </p>
        </div>
        <div className="rounded-[12px] border p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none">
          <p className="text-xs text-muted-foreground">
            Entre {personas} personas toca dividir
          </p>
          <p className="text-xl font-bold tabular-nums">{pesos(porPersona)}</p>
          <p className="text-xs text-muted-foreground">
            A cada uno le corresponde ~{pesos(porPersona)} al mes
          </p>
        </div>
        {tipo === "hogar" ? (
          <div className="rounded-[12px] border p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none">
            <p className="text-xs text-muted-foreground">
              Aporte por trabajador ({aportantes})
            </p>
            <p className="text-xl font-bold tabular-nums">
              {pesos(porAportante)}
            </p>
            <p className="text-xs text-muted-foreground">
              ~{pesos(Math.round(porAportante / 4.33))}/semana aprox.
            </p>
          </div>
        ) : (
          <div className="rounded-[12px] border p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none">
            <p className="text-xs text-muted-foreground">
              Por persona / por semana
            </p>
            <p className="text-xl font-bold tabular-nums">
              {pesos(Math.round(porPersona / 4.33))}
            </p>
            <p className="text-xs text-muted-foreground">
              Reparto semanal aproximado
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
