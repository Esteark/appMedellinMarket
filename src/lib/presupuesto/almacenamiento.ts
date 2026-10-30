import type {
  PresupuestoCierreSnapshot,
  PresupuestoRubro,
} from "@/lib/presupuesto/tipos";

const CLAVE_HOGAR = "mercado-medellin:presupuesto:hogar";
const CLAVE_DIETA = "mercado-medellin:presupuesto:dieta";
export const EVENTO_PRESUPUESTO = "mercado-medellin:presupuesto-cambio";
const CLAVE_CIERRES = "mercado-medellin:presupuesto:cierres";
const CLAVE_REPARTO_HOGAR = "mercado-medellin:reparto:hogar";
const CLAVE_REPARTO_DIETA = "mercado-medellin:reparto:dieta";

export type ConfigReparto = {
  personas: number;
  aportantes?: number;
  actualizado: string;
};

type Datos = {
  rubros: PresupuestoRubro[];
  actualizado: string;
};

function leer(clave: string): PresupuestoRubro[] | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = localStorage.getItem(clave);
    if (!crudo) return null;
    const p = JSON.parse(crudo) as Datos;
    if (!Array.isArray(p.rubros)) return null;
    return p.rubros;
  } catch {
    return null;
  }
}

function guardar(clave: string, rubros: PresupuestoRubro[]) {
  if (typeof window === "undefined") return;
  try {
    const datos: Datos = { rubros, actualizado: new Date().toISOString() };
    localStorage.setItem(clave, JSON.stringify(datos));
    window.dispatchEvent(new Event(EVENTO_PRESUPUESTO));
  } catch {
    // ignorar
  }
}

export function leerPresupuestoHogar(): PresupuestoRubro[] | null {
  return leer(CLAVE_HOGAR);
}

export function guardarPresupuestoHogar(rubros: PresupuestoRubro[]) {
  guardar(CLAVE_HOGAR, rubros);
}

export function leerPresupuestoDieta(): PresupuestoRubro[] | null {
  return leer(CLAVE_DIETA);
}

export function guardarPresupuestoDieta(rubros: PresupuestoRubro[]) {
  guardar(CLAVE_DIETA, rubros);
}

export function leerCierresLocal(): PresupuestoCierreSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = localStorage.getItem(CLAVE_CIERRES);
    if (!crudo) return [];
    const p = JSON.parse(crudo) as PresupuestoCierreSnapshot[];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

export function guardarCierresLocal(cierres: PresupuestoCierreSnapshot[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLAVE_CIERRES, JSON.stringify(cierres));
  } catch {
    // ignorar
  }
}

export function agregarCierreLocal(cierre: PresupuestoCierreSnapshot) {
  const actuales = leerCierresLocal();
  const filtrados = actuales.filter((c) => c.mes !== cierre.mes);
  guardarCierresLocal(
    [...filtrados, cierre].sort((a, b) => a.mes.localeCompare(b.mes)),
  );
}

export function leerReparto(tipo: "hogar" | "dieta"): ConfigReparto | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = localStorage.getItem(
      tipo === "hogar" ? CLAVE_REPARTO_HOGAR : CLAVE_REPARTO_DIETA,
    );
    if (!crudo) return null;
    const p = JSON.parse(crudo) as ConfigReparto;
    return typeof p.personas === "number" ? p : null;
  } catch {
    return null;
  }
}

export function guardarReparto(tipo: "hogar" | "dieta", cfg: ConfigReparto) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      tipo === "hogar" ? CLAVE_REPARTO_HOGAR : CLAVE_REPARTO_DIETA,
      JSON.stringify(cfg),
    );
  } catch {
    // ignorar
  }
}
