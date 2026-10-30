import {
  type ConfigPlan,
  leerConfig,
  planSugerido,
  type TipoPlan,
} from "./config";

const clave = (tipo: TipoPlan) => `mercado-medellin:plan:${tipo}`;
const SEMANA_MS = 7 * 24 * 3600 * 1000;

const leerJson = (k: string): unknown => {
  try {
    const crudo = localStorage.getItem(k);
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
};

export function leerPlanLocal(tipo: TipoPlan): ConfigPlan | null {
  return leerConfig(leerJson(clave(tipo)));
}

export function guardarPlanLocal(tipo: TipoPlan, config: ConfigPlan) {
  try {
    localStorage.setItem(clave(tipo), JSON.stringify(config));
  } catch {
    // sin almacenamiento: el plan vive solo en esta pestaña
  }
}

/** Lo que se reemplaza al fusionar queda una semana, por si hay que volver. */
export function respaldarPlan(tipo: TipoPlan, config: ConfigPlan) {
  try {
    localStorage.setItem(
      `${clave(tipo)}:respaldo`,
      JSON.stringify({ hasta: Date.now() + SEMANA_MS, config }),
    );
  } catch {
    // ignorar
  }
}

export function leerRespaldo(tipo: TipoPlan): ConfigPlan | null {
  const r = leerJson(`${clave(tipo)}:respaldo`) as {
    hasta?: number;
    config?: unknown;
  } | null;
  return r?.hasta && r.hasta > Date.now() ? leerConfig(r.config) : null;
}

/**
 * Primer arranque: arma el plan con lo que había en `reparto:{tipo}` (personas, aportantes) y
 * `presupuesto:{tipo}` (rubros). Solo lee: esas claves no se borran, `/presupuesto` sigue usando la suya.
 */
export function migrarLegado(tipo: TipoPlan, ahora: string): ConfigPlan | null {
  const reparto = leerJson(`mercado-medellin:reparto:${tipo}`) as {
    personas?: number;
    aportantes?: number;
  } | null;
  const presupuesto = leerJson(`mercado-medellin:presupuesto:${tipo}`) as {
    rubros?: { rubro: string; monto: number }[];
  } | null;
  if (!reparto && !presupuesto?.rubros) return null;
  const base = planSugerido(tipo, ahora);
  const rubros = presupuesto?.rubros?.length
    ? Object.fromEntries(presupuesto.rubros.map((r) => [r.rubro, r.monto]))
    : base.rubros;
  return (
    leerConfig({
      ...base,
      personas: reparto?.personas ?? base.personas,
      ...(tipo === "hogar" && {
        aportantes: reparto?.aportantes ?? base.aportantes,
      }),
      rubros,
    }) ?? null
  );
}
