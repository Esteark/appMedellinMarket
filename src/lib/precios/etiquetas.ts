import { diasEntre } from "@/lib/fecha";

export type Frecuencia = "diaria" | "semanal";
export type Etiqueta =
  | "sube"
  | "baja"
  | "clima"
  | "sin_dato"
  | "anotado"
  | "estimado"
  | "mayorista"
  | "revisar"
  | "desactualizado";

/**
 * ↑/↓: precio actual contra el promedio de los previos (los 7 días anteriores), umbral ±15 %
 * inclusivo. Se compara en enteros (actual·100·n vs suma·115) porque en coma flotante
 * 115/100 − 1 da 0,1499… y el borde exacto fallaría.
 */
export function tendencia(
  actual: number,
  previos: number[],
): "sube" | "baja" | null {
  if (previos.length === 0) return null;
  const suma = previos.reduce((a, b) => a + b, 0);
  const escalado = actual * 100 * previos.length;
  if (escalado >= suma * 115) return "sube";
  if (escalado <= suma * 85) return "baja";
  return null;
}

/** Desactualizado cuando hoy − fecha > (1 si diaria · 7 si semanal) + 3 días. */
export function desactualizado(
  fecha: string,
  hoy: string,
  frecuencia: Frecuencia,
): boolean {
  return diasEntre(fecha, hoy) > (frecuencia === "diaria" ? 1 : 7) + 3;
}

/** Hay una causa climática (es_clima) en los últimos 7 días. */
export function climaReciente(
  causas: { fecha: string; es_clima: boolean }[],
  hoy: string,
): boolean {
  return causas.some((c) => {
    const dias = diasEntre(c.fecha, hoy);
    return c.es_clima && dias >= 0 && dias <= 7;
  });
}

/**
 * En fluctuación: cambio ≥15 % entre el primer y el último punto de los últimos 7 días,
 * o coeficiente de variación ≥ 0.12 en los últimos 30 días. `serie` = puntos con precio.
 */
export function enFluctuacion(
  serie: { fecha: string; precio: number }[],
  hoy: string,
): boolean {
  const ventana = (dias: number) =>
    serie
      .filter((p) => {
        const d = diasEntre(p.fecha, hoy);
        return d >= 0 && d <= dias;
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((p) => p.precio);

  const semana = ventana(7);
  if (semana.length >= 2) {
    const primero = semana[0];
    const ultimo = semana[semana.length - 1];
    if (Math.abs(ultimo - primero) * 100 >= primero * 15) return true;
  }

  const mes = ventana(30);
  if (mes.length < 2) return false;
  const media = mes.reduce((a, b) => a + b, 0) / mes.length;
  const varianza = mes.reduce((a, b) => a + (b - media) ** 2, 0) / mes.length;
  return Math.sqrt(varianza) / media >= 0.12;
}

export type EntradaEtiquetas = {
  precio: number | null;
  estado: string;
  fuente?: string | null;
  revisar?: boolean;
  fecha: string;
  frecuencia: Frecuencia;
  hoy: string;
  previos?: number[];
  causas?: { fecha: string; es_clima: boolean }[];
};

/** Todas las etiquetas de un precio efectivo, en orden de presentación. */
export function etiquetas(e: EntradaEtiquetas): Etiqueta[] {
  if (e.precio == null || e.estado === "sin_dato") return ["sin_dato"];
  const salida: Etiqueta[] = [];
  const t = tendencia(e.precio, e.previos ?? []);
  if (t) salida.push(t);
  if (climaReciente(e.causas ?? [], e.hoy)) salida.push("clima");
  if (e.estado === "anotado") salida.push("anotado");
  if (e.estado === "estimado") salida.push("estimado");
  if (e.fuente?.startsWith("SIPSA")) salida.push("mayorista");
  if (e.revisar) salida.push("revisar");
  if (desactualizado(e.fecha, e.hoy, e.frecuencia))
    salida.push("desactualizado");
  return salida;
}
