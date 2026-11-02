"use client";

import { useRef } from "react";
import { avisar } from "@/lib/avisos";
import type { ConfigPlan } from "@/lib/planes/config";
import {
  gruposDe,
  moverRubro,
  nombreLimpio,
  OTROS,
  quitarRubro,
  renombrarRubro,
  restaurarRubro,
  rubrosOrdenados,
} from "@/lib/planes/rubros";
import { usePlan } from "./plan-provider";
import { RubroFila } from "./rubro-fila";
import { RubroGrupos } from "./rubro-grupos";
import { RubroNuevo } from "./rubro-nuevo";
import { ValorAnimado } from "./valor-animado";

/** Lo que cambia al editar rubros: sus montos, su orden y sus grupos. */
const soloRubros = (c: ConfigPlan) => ({
  rubros: c.rubros,
  orden: c.orden,
  grupos: c.grupos,
});

/** Rubros del plan: montos, orden, nombres y los grupos de producto que cuenta cada uno. */
export function PresupuestoEditable({ grupos }: { grupos: string[] }) {
  const { config, cambiar } = usePlan();
  // «Deshacer» corre más tarde: debe usar el plan de ese momento, no el de cuando se quitó el rubro.
  const cambiarActual = useRef(cambiar);
  cambiarActual.current = cambiar;
  const configActual = useRef(config);
  configActual.current = config;

  const nombres = rubrosOrdenados(config);
  const total = nombres.reduce((t, r) => t + config.rubros[r], 0);

  const resumen = (r: string) => {
    if (r === OTROS) return "Recibe lo que ningún rubro cuenta";
    const g = gruposDe(config, r);
    return g.length
      ? `Cuenta: ${g.join(", ")}`
      : "Sin grupos: no cuenta productos";
  };

  const mover = (r: string, delta: 1 | -1) => {
    const res = moverRubro(config, r, delta);
    if (res.ok) cambiar(soloRubros(res.config));
  };

  const renombrar = (de: string, a: string) => {
    const res = renombrarRubro(config, de, a);
    if (!res.ok) return res.error;
    if (res.config === config) return null;
    cambiar(soloRubros(res.config));
    avisar("rubro_renombrado", { de, a: nombreLimpio(a) ?? a });
    return null;
  };

  const quitar = (r: string) => {
    const previo = {
      nombre: r,
      monto: config.rubros[r],
      posicion: nombres.indexOf(r),
      grupos: gruposDe(config, r),
    };
    const res = quitarRubro(config, r);
    if (!res.ok) return;
    cambiar(soloRubros(res.config));
    avisar(
      "rubro_quitado",
      { nombre: r },
      {
        texto: "Deshacer",
        // Solo vuelve este rubro; lo que se editó después se conserva.
        alPulsar: () => {
          const vuelta = restaurarRubro(configActual.current, previo);
          if (vuelta.ok) cambiarActual.current(soloRubros(vuelta.config));
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-3" data-testid="presupuesto-editable">
      <div>
        <h2 className="text-lg font-bold">Rubros del plan</h2>
        <p className="text-xs text-muted-foreground">
          Escribe el monto de cada rubro, agrega los tuyos y elige qué grupos de
          productos cuenta cada uno. Es el plan que quieres gastar; los gastos
          reales se registran en Presupuesto.
        </p>
      </div>

      <ul className="tabular-nums">
        {nombres.map((r, i) => (
          <RubroFila
            key={r}
            nombre={r}
            monto={config.rubros[r]}
            primero={i === 0}
            ultimo={i === nombres.length - 1}
            fijo={r === OTROS}
            resumen={resumen(r)}
            onMonto={(monto) =>
              cambiar({ rubros: { ...config.rubros, [r]: monto } })
            }
            onMover={(d) => mover(r, d)}
            onRenombrar={(a) => renombrar(r, a)}
            onQuitar={() => quitar(r)}
          >
            <RubroGrupos rubro={r} grupos={grupos} />
          </RubroFila>
        ))}
      </ul>
      <p className="flex items-center justify-between border-t pt-2">
        <span className="font-semibold">Total del plan</span>
        <span className="text-lg font-bold tabular-nums">
          <ValorAnimado valor={total} />
        </span>
      </p>

      <RubroNuevo />
    </div>
  );
}
