"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { guardarPlan } from "@/app/planes/acciones";
import { avisar } from "@/lib/avisos";
import {
  type ConfigPlan,
  fusionarPlan,
  planSugerido,
  type TipoPlan,
} from "@/lib/planes/config";
import {
  guardarPlanLocal,
  leerPlanLocal,
  migrarLegado,
  respaldarPlan,
} from "@/lib/planes/local";

export type EstadoGuardado =
  | "cuenta"
  | "dispositivo"
  | "guardando"
  | "sin_guardar";

type Valor = {
  tipo: TipoPlan;
  config: ConfigPlan;
  estado: EstadoGuardado;
  /** Aplica un cambio parcial y lo guarda (dispositivo al instante, cuenta a los 800 ms). */
  cambiar: (
    parcial: Partial<Omit<ConfigPlan, "version" | "actualizada">>,
  ) => void;
  volverAlSugerido: () => void;
};

const Contexto = createContext<Valor | null>(null);

/** Para los que también viven fuera de un plan editable (p. ej. los botones del plan del mes). */
export const usePlanOpcional = () => useContext(Contexto);

export function usePlan() {
  const v = useContext(Contexto);
  if (!v) throw new Error("usePlan fuera de PlanProvider");
  return v;
}

const NOMBRE: Record<TipoPlan, string> = { hogar: "Hogar", dieta: "Dieta" };

type Props = {
  tipo: TipoPlan;
  conSesion: boolean;
  /** Lo que hay en la cuenta (crudo: se valida al fusionar). */
  nube: unknown;
  children: ReactNode;
};

export function PlanProvider({ tipo, conSesion, nube, children }: Props) {
  const [config, setConfig] = useState(() =>
    planSugerido(tipo, "2026-01-01T00:00:00Z"),
  );
  const [estado, setEstado] = useState<EstadoGuardado>("dispositivo");
  const listo = useRef(false);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  const subir = useCallback(
    async (c: ConfigPlan) => {
      if (!conSesion) return setEstado("dispositivo");
      setEstado("guardando");
      try {
        const r = await guardarPlan(tipo, c);
        if (r.ok) return setEstado("cuenta");
        avisar(
          r.error === "sin_sesion" ? "sesion_expirada" : "plan_no_guardado",
        );
      } catch {
        avisar(navigator.onLine ? "plan_no_guardado" : "sin_conexion");
      }
      setEstado("sin_guardar");
    },
    [conSesion, tipo],
  );

  // Arranque: dispositivo (o el legado de reparto/presupuesto) frente a la cuenta.
  // biome-ignore lint/correctness/useExhaustiveDependencies: arranca una vez por plan y sesión
  useEffect(() => {
    const ahora = new Date().toISOString();
    const guardado = leerPlanLocal(tipo);
    const migrado = guardado ? null : migrarLegado(tipo, ahora);
    const local = guardado ?? migrado ?? planSugerido(tipo, ahora);
    const tieneLocal = guardado !== null || migrado !== null;
    const f = conSesion ? fusionarPlan(tieneLocal ? local : null, nube) : null;
    const elegido = f?.config ?? local;
    if (f?.origen === "nube" && guardado) respaldarPlan(tipo, guardado);
    setConfig(elegido);
    guardarPlanLocal(tipo, elegido);
    listo.current = true;
    if (!conSesion) return;
    if (f?.origen === "local") {
      void subir(elegido);
      if (nube == null) avisar("plan_fusionado", { plan: NOMBRE[tipo] });
      else
        avisar(
          "plan_restaurado",
          { plan: NOMBRE[tipo] },
          {
            texto: "Deshacer",
            alPulsar: () => {
              const previa = fusionarPlan(null, nube)?.config;
              if (!previa) return;
              setConfig(previa);
              guardarPlanLocal(tipo, previa);
              void subir(previa);
            },
          },
        );
    } else setEstado(f ? "cuenta" : "dispositivo");
  }, [tipo, conSesion]);

  const aplicar = useCallback(
    (siguiente: ConfigPlan) => {
      setConfig(siguiente);
      guardarPlanLocal(tipo, siguiente);
      if (!conSesion) return;
      setEstado("guardando");
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => void subir(siguiente), 800);
    },
    [conSesion, subir, tipo],
  );
  useEffect(() => () => clearTimeout(temporizador.current), []);

  const valor = useMemo<Valor>(
    () => ({
      tipo,
      config,
      estado,
      cambiar: (parcial) => {
        if (!listo.current) return;
        aplicar({
          ...config,
          ...parcial,
          actualizada: new Date().toISOString(),
        });
      },
      volverAlSugerido: () => {
        if (listo.current)
          aplicar(planSugerido(tipo, new Date().toISOString()));
      },
    }),
    [tipo, config, estado, aplicar],
  );

  return <Contexto value={valor}>{children}</Contexto>;
}
