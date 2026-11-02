import {
  aCantidad,
  detectarDelimitador,
  dividir,
  MAX_BYTES,
  normalizarCabecera,
} from "./csv";
import type { ErrorCsv } from "./tipos";

export const UNIDADES_LISTA = ["kg", "g", "lb", "l", "ml", "u"] as const;
export type UnidadLista = (typeof UNIDADES_LISTA)[number];

export type FilaLista = {
  linea: number;
  producto: string;
  cantidad: number;
  unidad: UnidadLista;
  nota: string;
  /** Pregunta sobre esta fila cuando algo no quedó claro; vacía si está completa. */
  duda: string;
};
export type ListaLeida = { nombre: string; filas: FilaLista[] };
export type LecturaLista = {
  listas: ListaLeida[];
  errores: ErrorCsv[];
  /** Líneas `# DUDOSA: …` que dejó la IA para el archivo completo. */
  notas: string[];
};

const ALIAS: Record<string, string> = {
  lista: "lista",
  seccion: "lista",
  periodo: "lista",
  grupo: "lista",
  producto: "producto",
  articulo: "producto",
  item: "producto",
  descripcion: "producto",
  cantidad: "cantidad",
  cant: "cantidad",
  unidad: "unidad",
  unidad_medida: "unidad",
  medida: "unidad",
  nota: "nota",
  notas: "nota",
  detalle: "nota",
  observacion: "nota",
  comentario: "nota",
  duda: "duda",
  pregunta: "duda",
  aviso: "duda",
};

const UNIDADES: Record<string, UnidadLista> = {
  kg: "kg",
  kgs: "kg",
  kilo: "kg",
  kilos: "kg",
  kilogramo: "kg",
  kilogramos: "kg",
  g: "g",
  gr: "g",
  grs: "g",
  gramo: "g",
  gramos: "g",
  lb: "lb",
  lbs: "lb",
  libra: "lb",
  libras: "lb",
  l: "l",
  lt: "l",
  lts: "l",
  litro: "l",
  litros: "l",
  ml: "ml",
  mililitro: "ml",
  mililitros: "ml",
  u: "u",
  un: "u",
  und: "u",
  unds: "u",
  unidad: "u",
  unidades: "u",
  docena: "u",
  docenas: "u",
};

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
  const notas: string[] = [];
  const error = (linea: number, mensaje: string) =>
    errores.push({ linea, mensaje });
  if (new TextEncoder().encode(texto).length > MAX_BYTES) {
    error(0, "archivo_muy_grande");
    return { listas: [], errores, notas };
  }
  const filas: (FilaLista & { lista: string })[] = [];
  let delimitador = ",";
  let mapa: string[] | null = null;
  const lineas = texto
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n");

  for (const [i, cruda] of lineas.map((l) => l.trim()).entries()) {
    if (!cruda || cruda.startsWith("```")) continue;
    const linea = i + 1;

    if (cruda.startsWith("#")) {
      if (/^#\s*DUDOSA:/i.test(cruda))
        notas.push(cruda.replace(/^#\s*DUDOSA:\s*/i, ""));
      else if (/^#\s*ERROR:/i.test(cruda))
        error(linea, cruda.replace(/^#\s*ERROR:\s*/i, ""));
      continue;
    }

    if (!mapa) {
      delimitador = detectarDelimitador(cruda);
      const m = dividir(cruda, delimitador).map(
        (c) => ALIAS[normalizarCabecera(c)] ?? "",
      );
      const usadas = m.filter(Boolean);
      const valida =
        usadas.includes("producto") && new Set(usadas).size === usadas.length;
      if (!valida) {
        error(linea, "cabecera_invalida");
        return { listas: [], errores, notas };
      }
      mapa = m;
      continue;
    }

    if (filas.length >= MAX_FILAS) {
      error(linea, "demasiadas_filas");
      break;
    }

    const campos = dividir(cruda, delimitador);
    const columnas = mapa;
    const valor = (columna: string) => {
      const k = columnas.indexOf(columna);
      return k >= 0 ? (campos[k] ?? "") : "";
    };

    let producto = valor("producto").trim();
    if (!producto) {
      error(linea, "producto_invalido");
      continue;
    }
    const dudas: string[] = [];
    if (producto.length > 120) {
      producto = producto.slice(0, 120);
      dudas.push("El nombre era muy largo y se recortó.");
    }

    const textoCantidad = valor("cantidad").trim();
    let cantidad = textoCantidad ? aCantidad(textoCantidad) : 1;
    if (cantidad === null) {
      cantidad = 1;
      dudas.push(`No entendí la cantidad «${textoCantidad}»; asumí 1.`);
    }

    const textoUnidad = valor("unidad").trim();
    let unidad = textoUnidad ? UNIDADES[normalizarCabecera(textoUnidad)] : "u";
    if (!unidad) {
      unidad = "u";
      dudas.push(`No entendí la unidad «${textoUnidad}»; asumí u.`);
    }

    // La docena es una forma coloquial de doce unidades, no una unidad aparte.
    if (normalizarCabecera(textoUnidad).startsWith("docena")) {
      cantidad *= 12;
      unidad = "u";
    }

    if (!(cantidad > 0 && cantidad <= 9999)) {
      cantidad = 1;
      dudas.push(
        `La cantidad «${textoCantidad}» está fuera de rango; asumí 1.`,
      );
    }

    const textoDuda = valor("duda").trim();
    if (textoDuda) dudas.push(textoDuda);

    filas.push({
      linea,
      lista: valor("lista").trim(),
      producto,
      cantidad,
      unidad,
      nota: valor("nota").trim(),
      duda: dudas.join(" ").trim(),
    });
  }

  if (!mapa && errores.length === 0) error(1, "archivo_vacio");
  const listas = agruparPorLista(filas);
  if (listas.length > MAX_LISTAS) error(0, "demasiadas_listas");
  return { listas, errores, notas };
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
