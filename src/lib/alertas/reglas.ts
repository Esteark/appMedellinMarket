import { diasEntre } from "@/lib/fecha";
import {
  climaReciente,
  type Frecuencia,
  porActualizar,
  tendencia,
} from "@/lib/precios/etiquetas";
import {
  type Lista,
  mejorTiendaCompleta,
  type Precios,
  totalesPorTienda,
} from "@/lib/precios/lista";

export type TipoAlerta =
  | "mas_barato"
  | "mercado_completo"
  | "subida"
  | "caro_por_clima"
  | "fuente_caida"
  | "precio_manual_vencido";

export type AlertaNueva = {
  tipo: TipoAlerta;
  producto_id: string | null;
  tienda_id: string | null;
  monto: number;
  mensaje: string;
};

/**
 * precio_manual_vencido: un ítem de la lista que está en el catálogo activo de barrio no tiene precio
 * manual o su fecha pasó de 14 días (diaria) / 30 (semanal). Los del catálogo que no están en la lista no cuentan.
 */
export function alertasBarrioVencido(
  lista: Lista,
  catalogo: Set<string>,
  ultimaFecha: Map<string, string>,
  frecuencia: Map<string, Frecuencia>,
  hoy: string,
): AlertaNueva[] {
  const alertas: AlertaNueva[] = [];
  for (const id of Object.keys(lista)) {
    if (!catalogo.has(id)) continue;
    const fecha = ultimaFecha.get(id);
    if (fecha && !porActualizar(fecha, hoy, frecuencia.get(id) ?? "diaria"))
      continue;
    alertas.push({
      tipo: "precio_manual_vencido",
      producto_id: id,
      tienda_id: "barrio",
      monto: 0,
      mensaje: fecha
        ? `${id} lleva días sin actualizarse en la tienda de barrio`
        : `${id} no tiene precio en la tienda de barrio`,
    });
  }
  return alertas;
}

/**
 * mas_barato: otra tienda es ≥10 % más barata que la preferida y el ahorro
 * (diferencia × cantidad, que es el monto) es ≥ umbral_ahorro.
 */
export function alertasMasBarato(
  lista: Lista,
  precios: Precios,
  preferida: string,
  tiendas: string[],
  umbral = 1000,
): AlertaNueva[] {
  const alertas: AlertaNueva[] = [];
  for (const [id, cantidad] of Object.entries(lista)) {
    const enPreferida = precios[id]?.[preferida];
    if (enPreferida == null) continue;
    let mejor: { tienda: string; precio: number } | null = null;
    for (const tienda of tiendas) {
      const precio = precios[id]?.[tienda];
      if (
        tienda !== preferida &&
        precio != null &&
        (!mejor || precio < mejor.precio)
      )
        mejor = { tienda, precio };
    }
    if (!mejor) continue;
    const diferencia = enPreferida - mejor.precio;
    const monto = diferencia * cantidad;
    if (diferencia * 100 >= enPreferida * 10 && monto >= umbral) {
      alertas.push({
        tipo: "mas_barato",
        producto_id: id,
        tienda_id: mejor.tienda,
        monto,
        mensaje: `${id} sale más barato en ${mejor.tienda}`,
      });
    }
  }
  return alertas;
}

/** mercado_completo: otra tienda completa sale ≥5 % más barata que la preferida completa. */
export function alertaMercadoCompleto(
  lista: Lista,
  precios: Precios,
  preferida: string,
  tiendas: string[],
): AlertaNueva | null {
  const totales = totalesPorTienda(lista, precios, tiendas);
  const enPreferida = totales.find((t) => t.tienda === preferida);
  if (!enPreferida || enPreferida.faltantes.length > 0) return null;
  const mejor = mejorTiendaCompleta(
    totales.filter((t) => t.tienda !== preferida),
  );
  if (!mejor) return null;
  const diferencia = enPreferida.total - mejor.total;
  if (diferencia * 100 < enPreferida.total * 5) return null;
  return {
    tipo: "mercado_completo",
    producto_id: null,
    tienda_id: mejor.tienda,
    monto: diferencia,
    mensaje: `El mercado completo sale más barato en ${mejor.tienda}`,
  };
}

/**
 * subida: el precio supera en ≥15 % el promedio de los 7 puntos previos. Si además hay una
 * causa climática en los últimos 7 días, sale como caro_por_clima (la más específica).
 */
export function alertaSubida(
  producto_id: string,
  tienda_id: string,
  actual: number,
  previos: number[],
  causas: { fecha: string; es_clima: boolean }[],
  hoy: string,
): AlertaNueva | null {
  if (tendencia(actual, previos) !== "sube") return null;
  const promedio = previos.reduce((a, b) => a + b, 0) / previos.length;
  const clima = climaReciente(causas, hoy);
  return {
    tipo: clima ? "caro_por_clima" : "subida",
    producto_id,
    tienda_id,
    monto: Math.round(actual - promedio),
    mensaje: clima
      ? `${producto_id} subió en ${tienda_id}; causa según DANE (SIPSA): clima`
      : `${producto_id} subió en ${tienda_id}`,
  };
}

/** fuente_caida: tienda automática en fallo o con ≥3 días sin ultimo_ok. Solo para el admin. */
export function alertasFuenteCaida(
  estados: {
    tienda_id: string;
    estado: string | null;
    ultimo_ok: string | null;
  }[],
  hoy: string,
): AlertaNueva[] {
  return estados
    .filter(
      (e) =>
        e.estado === "fallo" ||
        !e.ultimo_ok ||
        diasEntre(e.ultimo_ok, hoy) >= 3,
    )
    .map((e) => ({
      tipo: "fuente_caida" as const,
      producto_id: null,
      tienda_id: e.tienda_id,
      monto: 0,
      mensaje: `La fuente ${e.tienda_id} está caída`,
    }));
}

/** Orden de presentación: por monto, de mayor a menor. */
export function ordenarAlertas<T extends { monto: number }>(alertas: T[]): T[] {
  return [...alertas].sort((a, b) => b.monto - a.monto);
}
