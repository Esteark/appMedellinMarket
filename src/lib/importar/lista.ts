import { dividir, MAX_BYTES } from "./csv";
import type { ErrorCsv } from "./tipos";

export const UNIDADES_LISTA = ["kg", "g", "lb", "l", "ml", "u"] as const;
export type UnidadLista = (typeof UNIDADES_LISTA)[number];

export type FilaLista = {
  linea: number;
  producto: string;
  cantidad: number;
  unidad: UnidadLista;
  nota: string;
};
export type ListaLeida = { nombre: string; filas: FilaLista[] };
export type LecturaLista = { listas: ListaLeida[]; errores: ErrorCsv[] };

const COLUMNAS = ["lista", "producto", "cantidad", "unidad", "nota"];
const MAX_FILAS = 200;
const MAX_LISTAS = 5;

/** Agrupa por sección conservando el orden; sin sección = «Lista importada». */
export function agruparPorLista(
  filas: (FilaLista & { lista: string })[],
): ListaLeida[] {
  const m = new Map<string, FilaLista[]>();
  for (const { lista, ...f } of filas) {
    const nombre = lista || "Lista importada";
    m.set(nombre, [...(m.get(nombre) ?? []), f]);
  }
  return [...m].map(([nombre, fs]) => ({ nombre, filas: fs }));
}

export function leerListaCsv(texto: string): LecturaLista {
  const errores: ErrorCsv[] = [];
  const error = (linea: number, mensaje: string) =>
    errores.push({ linea, mensaje });
  if (new TextEncoder().encode(texto).length > MAX_BYTES) {
    error(0, "archivo_muy_grande");
    return { listas: [], errores };
  }
  const filas: (FilaLista & { lista: string })[] = [];
  let delimitador = ",";
  let cabecera = false;
  const lineas = texto.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");

  for (const [i, cruda] of lineas.map((l) => l.trim()).entries()) {
    if (!cruda || cruda.startsWith("```") || cruda.startsWith("#")) continue;
    const linea = i + 1;
    if (!cabecera) {
      delimitador =
        cruda.split(";").length > cruda.split(",").length ? ";" : ",";
      const h = dividir(cruda, delimitador).map((c) =>
        c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(),
      );
      if (h.join() !== COLUMNAS.join()) {
        error(linea, "cabecera_invalida");
        return { listas: [], errores };
      }
      cabecera = true;
      continue;
    }
    if (filas.length >= MAX_FILAS) {
      error(linea, "demasiadas_filas");
      break;
    }
    const campos = dividir(cruda, delimitador);
    if (campos.length !== COLUMNAS.length) {
      error(linea, "columnas_distintas");
      continue;
    }
    const [lista, producto, cant, u, nota] = campos;
    // Una IA que deja la celda en blanco no debe romper la carga: sin cantidad es 1 y sin unidad, u.
    const cantidad = !cant
      ? 1
      : /^\d+([.,]\d+)?$/.test(cant)
        ? Number(cant.replace(",", "."))
        : NaN;
    const unidad = (u.toLowerCase() || "u") as UnidadLista;
    if (!producto || producto.length > 120) error(linea, "producto_invalido");
    else if (!(cantidad > 0 && cantidad <= 9999))
      error(linea, "cantidad_invalida");
    else if (!UNIDADES_LISTA.includes(unidad)) error(linea, "unidad_invalida");
    else filas.push({ linea, lista, producto, cantidad, unidad, nota });
  }
  if (!cabecera && errores.length === 0) error(1, "archivo_vacio");
  const listas = agruparPorLista(filas);
  if (listas.length > MAX_LISTAS) error(0, "demasiadas_listas");
  return { listas, errores };
}

const A_BASE = {
  kg: ["g", 1000],
  lb: ["g", 500],
  g: ["g", 1],
  l: ["ml", 1000],
  ml: ["ml", 1],
  u: ["u", 1],
} as const;

/** Cantidad pedida en la unidad base del catálogo (g, ml o u). */
export function aBase(cantidad: number, unidad: UnidadLista) {
  const [base, factor] = A_BASE[unidad];
  return { base, valor: cantidad * factor };
}

/**
 * Unidades de compra del producto para lo pedido: `ceil(pedido / cantidad_base)`.
 * Si pedido y producto son de familias distintas (peso contra unidades) no se adivina.
 */
export function itemDeProducto(
  producto: { unidad_base: string; cantidad_base: number },
  cantidad: number,
  unidad: UnidadLista,
): { ok: true; item: number } | { ok: false; error: "unidad_distinta" } {
  const { base, valor } = aBase(cantidad, unidad);
  if (base !== producto.unidad_base)
    return { ok: false, error: "unidad_distinta" };
  return {
    ok: true,
    item: Math.max(1, Math.ceil(valor / producto.cantidad_base)),
  };
}

const CLAVE_ALIAS = "mercado-medellin:alias-lista";

/** Cómo se escribió cada producto en cargas anteriores (nombre normalizado → id), en el dispositivo. */
export function leerAlias(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_ALIAS) ?? "{}");
  } catch {
    return {};
  }
}

export function guardarAlias(alias: Record<string, string>) {
  try {
    localStorage.setItem(CLAVE_ALIAS, JSON.stringify(alias));
  } catch {
    // sin almacenamiento: se vuelve a preguntar la próxima vez
  }
}

/** Unidad con la que se crea un producto nuevo a partir de una línea de la lista. */
export const unidadDeCompra = (u: UnidadLista) =>
  u === "u" ? "unidad" : u === "l" || u === "ml" ? "1 L" : "kg";
