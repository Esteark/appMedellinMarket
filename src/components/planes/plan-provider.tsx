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
import { guardarPlan, sincronizarPlanes } from "@/app/planes/acciones";
import { avisar } from "@/lib/avisos";
import {
  type ConfigPlan,
  fusionarPlan,
  planSugerido,
  type TipoPlan,
} from "@/lib/planes/config";
import {
  fusionarGuardados,
  guardarGuardadosLocal,
  huellaGuardados,
  leerGuardados,
  leerGuardadosLocal,
  MAX_GUARDADOS,
  normalizarNombre,
  type PlanGuardado,
  recortarGuardados,
} from "@/lib/planes/guardados";
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
  guardados: PlanGuardado[];
  /** Aplica un cambio parcial y lo guarda (dispositivo al instante, cuenta a los 800 ms). */
  cambiar: (
    parcial: Partial<Omit<ConfigPlan, "version" | "actualizada">>,
  ) => void;
  volverAlSugerido: () => void;
  /** Guarda una copia con nombre del plan actual; si el nombre ya existe, la reemplaza. */
  guardarComo: (nombre: string) => void;
  cargarGuardado: (nombre: string) => void;
  eliminarGuardado: (nombre: string) => void;
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
  /** Presupuestos guardados de la cuenta (crudo: se validan al fusionar). */
  guardadosNube: unknown;
  children: ReactNode;
};

export function PlanProvider({
  tipo,
  conSesion,
  nube,
  guardadosNube,
  children,
}: Props) {
  const [config, setConfig] = useState(() =>
    planSugerido(tipo, "2026-01-01T00:00:00Z"),
  );
  const [estado, setEstado] = useState<EstadoGuardado>("dispositivo");
  const [guardados, setGuardados] = useState<PlanGuardado[]>([]);
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

  const persistirGuardados = useCallback(
    async (planes: PlanGuardado[]) => {
      const recortados = recortarGuardados(planes);
      guardarGuardadosLocal(tipo, recortados);
      setGuardados(recortados);
      if (!conSesion) return;
      try {
        const r = await sincronizarPlanes(tipo, recortados);
        if (!r.ok && r.error !== "sin_sesion") avisar("plan_no_guardado");
      } catch {
        avisar(navigator.onLine ? "plan_no_guardado" : "sin_conexion");
      }
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

  // Presupuestos guardados: lo del dispositivo se une con lo de la cuenta.
  // biome-ignore lint/correctness/useExhaustiveDependencies: arranca una vez por plan y sesión
  useEffect(() => {
    const locales = leerGuardadosLocal(tipo);
    const enNube = leerGuardados(guardadosNube);
    const unidos = fusionarGuardados(locales, enNube);
    guardarGuardadosLocal(tipo, unidos);
    setGuardados(unidos);
    if (!conSesion || huellaGuardados(unidos) === huellaGuardados(enNube))
      return;
    sincronizarPlanes(tipo, unidos)
      .then((r) => {
        if (r.ok) {
          if (locales.length) avisar("planes_fusionados", { n: unidos.length });
        } else avisar("plan_no_guardado");
      })
      .catch(() => avisar("sin_conexion"));
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
      guardados,
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
      guardarComo: (nombre) => {
        const limpio = nombre.trim();
        if (!limpio || limpio.length > 60) return avisar("nombre_invalido");
        const clave = normalizarNombre(limpio);
        const existe = guardados.some(
          (p) => normalizarNombre(p.nombre) === clave,
        );
        if (!existe && guardados.length >= MAX_GUARDADOS)
          return avisar("limite_planes");
        const ahora = new Date().toISOString();
        const copia: PlanGuardado = {
          nombre: limpio,
          config: { ...config, actualizada: ahora },
          actualizada: ahora,
        };
        void persistirGuardados([
          copia,
          ...guardados.filter((p) => normalizarNombre(p.nombre) !== clave),
        ]);
        avisar("plan_guardado", { nombre: limpio });
      },
      cargarGuardado: (nombre) => {
        const clave = normalizarNombre(nombre);
        const p = guardados.find((g) => normalizarNombre(g.nombre) === clave);
        if (!p) return;
        aplicar({ ...p.config, actualizada: new Date().toISOString() });
        avisar("plan_cargado", { nombre: p.nombre });
      },
      eliminarGuardado: (nombre) => {
        const clave = normalizarNombre(nombre);
        const p = guardados.find((g) => normalizarNombre(g.nombre) === clave);
        if (!p) return;
        void persistirGuardados(
          guardados.filter((g) => normalizarNombre(g.nombre) !== clave),
        );
        avisar(
          "plan_eliminado",
          { nombre: p.nombre },
          {
            texto: "Deshacer",
            alPulsar: () => void persistirGuardados([...guardados, p]),
          },
        );
      },
    }),
    [tipo, config, estado, guardados, aplicar, persistirGuardados],
  );

  return <Contexto value={valor}>{children}</Contexto>;
}
