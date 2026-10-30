// Pronóstico a 7 días: estadística determinista sobre la serie propia. Sin red, sin IA/LLM.
// No es un precio: nunca entra en totales, óptimo dividido, alertas ni PDF, ni se guarda en tablas de precios.
import { diasEntre } from "@/lib/fecha";

export type Punto = { fecha: string; precio: number };
export type Direccion = "sube" | "baja" | "estable";
export type Confianza = "alta" | "media" | "baja";
export type Motivo =
  | "tendencia_sube"
  | "tendencia_baja"
  | "clima"
  | "ipc_alto"
  | "poca_serie"
  | "sin_contexto"
  | "cambio_reciente";

export type Contexto = {
  /** Días con causa climática en los últimos 7 días (SIPSA). */
  clima: number;
  /** Variación mensual del IPC de alimentos (%); null si no hay dato. */
  ipcMensual: number | null;
  /** Antigüedad de la última fila de `contexto_mercado`; null si no existe. */
  contextoDias: number | null;
};

export type Pronostico = {
  direccion: Direccion;
  /** % de que ocurra esa dirección, entre 34 y 92. */
  probabilidad: number;
  /** Rango del precio esperado (80 %), nunca un solo número. */
  rango: { min: number; max: number };
  confianza: Confianza;
  motivos: Motivo[];
  /** 7 pasos lineales desde el último precio hasta el esperado, para el trazo. */
  puntos: number[];
  ultimo: number;
};

const UMBRAL = 0.03;
const Z80 = 1.2816;
const MIN_PUNTOS = 8;
const CONTEXTO_MAX_DIAS = 45;

/** CDF de la normal estándar (Abramowitz-Stegun 7.1.26). */
function cdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

const acotar = (x: number, min: number, max: number) =>
  Math.min(max, Math.max(min, x));

/**
 * `puntos` en orden de fecha (mínimo diario entre tiendas, con las correcciones a mano).
 * Menos de 8 puntos en los últimos 60 días → null: sin historial no se inventa nada.
 */
export function pronosticar(
  puntos: Punto[],
  ctx: Contexto,
  hoy: string,
): Pronostico | null {
  const serie = puntos
    .filter((p) => p.precio > 0 && diasEntre(p.fecha, hoy) <= 60)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const n = serie.length;
  if (n < MIN_PUNTOS) return null;
  const logs = serie.map((p) => Math.log(p.precio));
  const ultimo = serie[n - 1].precio;

  // Volatilidad: desviación de los log-retornos de los últimos 28 días.
  const retornos: number[] = [];
  for (let i = 1; i < n; i++)
    if (diasEntre(serie[i].fecha, hoy) <= 28)
      retornos.push(logs[i] - logs[i - 1]);
  const media = retornos.reduce((s, r) => s + r, 0) / (retornos.length || 1);
  const varianza =
    retornos.length > 1
      ? retornos.reduce((s, r) => s + (r - media) ** 2, 0) /
        (retornos.length - 1)
      : 0;
  let sigma7 = Math.max(Math.sqrt(varianza), 0.005) * Math.sqrt(7);

  // Regresión logarítmica ponderada (más peso a lo reciente); x en días, así b es por día.
  const x0 = serie[0].fecha;
  let sw = 0;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  serie.forEach((p, i) => {
    const w = i + 1;
    const x = diasEntre(x0, p.fecha);
    sw += w;
    sx += w * x;
    sy += w * logs[i];
    sxx += w * x * x;
    sxy += w * x * logs[i];
  });
  const den = sw * sxx - sx * sx;
  const b = den === 0 ? 0 : (sw * sxy - sx * sy) / den;
  const tendencia = b * 7;

  const ultimos7 = serie.slice(-7).map((p) => p.precio);
  const prom7 = ultimos7.reduce((s, v) => s + v, 0) / ultimos7.length;
  const momento = Math.log(ultimo / prom7);

  const sinContexto =
    ctx.ipcMensual == null ||
    ctx.contextoDias == null ||
    ctx.contextoDias > CONTEXTO_MAX_DIAS;
  const derivaIPC = sinContexto ? 0 : ((ctx.ipcMensual ?? 0) * 7) / 30 / 100;

  let esperado = 0.6 * tendencia + 0.4 * momento + derivaIPC;
  if (ctx.clima > 0) {
    esperado *= 1.2;
    sigma7 *= 1.15;
  }
  esperado = acotar(esperado, Math.log(0.75), Math.log(1.25));

  const arriba = Math.log(1 + UMBRAL);
  const abajo = Math.log(1 - UMBRAL);
  const pSube = 1 - cdf((arriba - esperado) / sigma7);
  const pBaja = cdf((abajo - esperado) / sigma7);
  const direccion: Direccion =
    esperado > arriba ? "sube" : esperado < abajo ? "baja" : "estable";
  const p =
    direccion === "sube"
      ? pSube
      : direccion === "baja"
        ? pBaja
        : 1 - pSube - pBaja;
  const probabilidad = acotar(Math.round(p * 100), 34, 92);

  const min = acotar(
    ultimo * Math.exp(esperado - Z80 * sigma7),
    ultimo * 0.6,
    ultimo * 1.4,
  );
  const max = acotar(
    ultimo * Math.exp(esperado + Z80 * sigma7),
    ultimo * 0.6,
    ultimo * 1.4,
  );
  const meta = ultimo * Math.exp(esperado);

  let confianza: Confianza =
    n >= 45 && sigma7 <= 0.05
      ? "alta"
      : n >= 20 && sigma7 <= 0.1
        ? "media"
        : "baja";
  if (sinContexto && confianza === "alta") confianza = "media";

  const candidatos: [Motivo, boolean][] = [
    ["tendencia_sube", tendencia > UMBRAL],
    ["tendencia_baja", tendencia < -UMBRAL],
    ["clima", ctx.clima > 0],
    ["ipc_alto", !sinContexto && (ctx.ipcMensual ?? 0) >= 1],
    ["poca_serie", n < 20],
    ["sin_contexto", sinContexto],
    ["cambio_reciente", Math.abs(Math.log(ultimo / serie[n - 2].precio)) > 0.1],
  ];
  const motivos = candidatos
    .filter(([, v]) => v)
    .map(([m]) => m)
    .slice(0, 3);

  return {
    direccion,
    probabilidad,
    rango: { min: Math.round(min), max: Math.round(max) },
    confianza,
    motivos,
    puntos: Array.from({ length: 7 }, (_, i) =>
      Math.round(ultimo + ((meta - ultimo) * (i + 1)) / 7),
    ),
    ultimo,
  };
}
