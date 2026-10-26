import ExcelJS from "exceljs";
import { extractText, getDocumentProxy } from "unpdf";
import { normalizar } from "@/corrida/normalizar";
import { permitido } from "@/corrida/robots";
import type { Adaptador, Consulta, Contexto, Hallazgo } from "@/corrida/tipos";

const BASE = "https://www.dane.gov.co/files/operaciones/SIPSA";
const MESES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

/** Nombre SIPSA (normalizado) → producto. Solo los que se venden por kg en la app. */
export const PRODUCTOS: Record<string, string> = {
  ahuyama: "ahuyama",
  "arveja verde en vaina": "arveja_verde",
  "cebolla cabezona blanca": "cebolla",
  habichuela: "habichuela",
  "pepino cohombro": "pepino",
  pimenton: "pimenton",
  remolacha: "remolacha",
  tomate: "tomate",
  zanahoria: "zanahoria",
  aguacate: "aguacate",
  banano: "banano",
  guayaba: "guayaba",
  // shortcut: se toma el Tahití como "limón"; si la familia compra el común, cambiar aquí.
  "limon tahiti": "limon",
  lulo: "lulo",
  mandarina: "mandarina",
  "mango tommy": "mango",
  "manzana royal gala": "manzana",
  maracuya: "maracuya",
  "mora de castilla": "mora",
  naranja: "naranja",
  "papaya maradol": "papaya",
  "tomate de arbol": "tomate_arbol",
  arracacha: "arracacha",
  "papa negra": "papa",
  "papa criolla": "papa_criolla",
  "platano harton verde": "platano",
  yuca: "yuca",
};

/** Minúsculas, sin acentos, sin "*" ni espacios repetidos. */
export function sinAcentos(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const CLIMA =
  /lluvia|lluvioso|invierno|ola invernal|verano|sequia|helada|clima|climatic|fenomeno de (la )?nina|el nino|temporal|inundaci/;

/** Clasificador de clima del blueprint §5: regex sin IA, sin mayúsculas ni acentos. */
export function esClima(frase: string): boolean {
  return CLIMA.test(sinAcentos(frase));
}

/** "2026-10-26" → "26oct2026" (día con dos dígitos, mes abreviado en español). */
export function sufijoFecha(fecha: string): string {
  const [a, m, d] = fecha.split("-");
  return `${d}${MESES[Number(m) - 1]}${a}`;
}

export function urlsBoletin(fecha: string) {
  const s = sufijoFecha(fecha);
  return {
    anexo: `${BASE}/anex-SIPSADiario-${s}.xlsx`,
    boletin: `${BASE}/bol-SIPSADiario-${s}.pdf`,
  };
}

/** Hoy y hasta 3 días atrás, del más nuevo al más viejo. */
export function fechasCandidatas(hoy: string): string[] {
  return [0, 1, 2, 3].map((d) =>
    new Date(Date.parse(hoy) - d * 86_400_000).toISOString().slice(0, 10),
  );
}

/** Precios $/kg de Medellín (Central Mayorista de Antioquia) por producto de la app. */
export async function preciosDeAnexo(
  datos: ArrayBuffer,
): Promise<Record<string, number>> {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(datos);
  const hoja = libro.worksheets[0];
  let columna = -1;
  const precios: Record<string, number> = {};
  hoja.eachRow((fila) => {
    const valores = fila.values as unknown[];
    if (columna < 0) {
      columna = valores.findIndex(
        (v) => typeof v === "string" && sinAcentos(v).startsWith("medellin"),
      );
      return;
    }
    const producto = PRODUCTOS[sinAcentos(String(valores[1] ?? ""))];
    const precio = valores[columna];
    if (producto && typeof precio === "number" && precio > 0)
      precios[producto] = Math.round(precio);
  });
  if (columna < 0)
    throw new Error("El anexo SIPSA no tiene columna de Medellín");
  return precios;
}

export type Causa = {
  producto_id: string;
  fecha: string;
  texto: string;
  es_clima: boolean;
  fuente_url: string;
};

/**
 * Frases del boletín que mencionan Medellín y un producto de la app. El texto se guarda literal.
 * Una frase que no nombra el producto ("esta fruta") no se atribuye: nunca se inventa una causa.
 */
export async function causasDeBoletin(
  datos: ArrayBuffer,
  fecha: string,
  fuente_url: string,
): Promise<Causa[]> {
  const pdf = await getDocumentProxy(new Uint8Array(datos));
  const { text } = await extractText(pdf, { mergePages: true });
  const nombres = Object.keys(PRODUCTOS);
  const causas: Causa[] = [];
  // Frase = hasta un punto seguido de espacio ("$4.423" no corta) o una línea de guiones,
  // para no pegar la última frase de una sección con el título de la siguiente.
  for (const frase of text
    .replace(/\s+/g, " ")
    .split(/(?<=\.)\s+|\s*-{5,}\s*/)) {
    // Las tablas de abastecimiento también nombran Medellín: se quedan fuera por largo.
    if (frase.length > 600 || !/medell[ií]n/i.test(frase)) continue;
    const normal = sinAcentos(frase);
    const presentes = nombres.filter((n) =>
      new RegExp(`\\b${n}\\b`).test(normal),
    );
    // "tomate" dentro de "tomate de arbol" no cuenta como tomate.
    for (const n of presentes.filter(
      (n) => !presentes.some((o) => o !== n && o.includes(n)),
    )) {
      causas.push({
        producto_id: PRODUCTOS[n],
        fecha,
        texto: frase,
        es_clima: esClima(frase),
        fuente_url,
      });
    }
  }
  return causas;
}

export type Boletin = {
  fecha: string;
  precios: Record<string, number>;
  causas: Causa[];
};

const cache = new WeakMap<Contexto, Promise<Boletin | null>>();

async function descargar(
  url: string,
  ctx: Contexto,
): Promise<ArrayBuffer | null> {
  if (!(await permitido(url, ctx))) return null;
  const res = await ctx.fetch(url, {
    headers: { "user-agent": ctx.userAgent },
  });
  await ctx.esperar(ctx.pausaMs);
  return res.ok ? res.arrayBuffer() : null;
}

/** El boletín más nuevo publicado (hoy o hasta 3 días atrás); uno por corrida. */
export function leerBoletin(ctx: Contexto): Promise<Boletin | null> {
  let boletin = cache.get(ctx);
  if (!boletin) {
    boletin = (async () => {
      for (const fecha of fechasCandidatas(ctx.hoy)) {
        const urls = urlsBoletin(fecha);
        const anexo = await descargar(urls.anexo, ctx);
        if (!anexo) continue;
        const pdf = await descargar(urls.boletin, ctx);
        return {
          fecha,
          precios: await preciosDeAnexo(anexo),
          causas: pdf ? await causasDeBoletin(pdf, fecha, urls.boletin) : [],
        };
      }
      return null;
    })();
    cache.set(ctx, boletin);
  }
  return boletin;
}

async function buscar(c: Consulta, ctx: Contexto): Promise<Hallazgo | null> {
  const boletin = await leerBoletin(ctx);
  const porKg = boletin?.precios[c.producto_id];
  if (!boletin || porKg == null) return null;
  const precio = normalizar(porKg, c, {
    unidad_base: "g",
    cantidad_base: 1000,
  });
  if (precio == null) return null;
  return {
    producto_id: c.producto_id,
    precio,
    sku: null,
    url: urlsBoletin(boletin.fecha).anexo,
    fecha: boletin.fecha,
  };
}

const CUBIERTOS = new Set(Object.values(PRODUCTOS));

export const minorista: Adaptador = {
  tienda: "minorista",
  cubre: (c) => CUBIERTOS.has(c.producto_id),
  buscar,
};
