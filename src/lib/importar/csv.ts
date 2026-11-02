import type { ErrorCsv, FilaCsv, LecturaCsv } from "./tipos";

export const MAX_FILAS = 500;
export const MAX_BYTES = 1024 * 1024;

/** Nombres que puede traer la cabecera sin que la carga se caiga. */
const ALIAS: Record<string, string> = {
  producto: "producto",
  descripcion: "producto",
  detalle: "producto",
  articulo: "producto",
  item: "producto",
  cantidad: "cantidad",
  cant: "cantidad",
  unidades: "cantidad",
  precio_total: "precio_total",
  precio: "precio_total",
  total: "precio_total",
  valor: "precio_total",
  subtotal: "precio_total",
  tienda: "tienda",
  almacen: "tienda",
  negocio: "tienda",
  comercio: "tienda",
  fecha: "fecha",
  fecha_compra: "fecha",
  dia: "fecha",
  codigo: "codigo",
  codigo_barras: "codigo",
  barras: "codigo",
  ean: "codigo",
  sku: "codigo",
  duda: "duda",
  pregunta: "duda",
  nota: "duda",
  observacion: "duda",
  aviso: "duda",
};

const REQUERIDAS = ["producto", "cantidad", "precio_total", "tienda"];

export const sinAcentos = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function dividir(linea: string, delimitador: string): string[] {
  const campos: string[] = [];
  let actual = "";
  let entreComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else entreComillas = !entreComillas;
    } else if (c === delimitador && !entreComillas) {
      campos.push(actual.trim());
      actual = "";
    } else actual += c;
  }
  campos.push(actual.trim());
  return campos;
}

/** Elige el separador con más apariciones: `,`, `;` o tabulador. */
export function detectarDelimitador(linea: string): string {
  const cuenta = (d: string) => linea.split(d).length - 1;
  const coma = cuenta(",");
  const puntoYComa = cuenta(";");
  const tab = cuenta("\t");
  if (puntoYComa > coma && puntoYComa >= tab) return ";";
  if (tab > coma && tab > puntoYComa) return "\t";
  return ",";
}

export function normalizarCabecera(t: string): string {
  return sinAcentos(t)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Traduce la cabecera a los nombres internos; las columnas desconocidas quedan en "". */
export function mapaCabecera(campos: string[]): string[] {
  return campos.map((c) => ALIAS[normalizarCabecera(c)] ?? "");
}

/**
 * Cantidad tolerante: acepta `1/2`, `1 1/2`, `½`, `1,5`, `1.5`, `2 kg` y `x2`.
 * Devuelve `null` cuando no hay ningún número reconocible.
 */
export function aCantidad(texto: string): number | null {
  const s = texto.replace(/\u00a0/g, " ").trim();
  if (!s) return null;

  const unicode = /(\d+)?\s*([½¼¾])/.exec(s);
  if (unicode) {
    const base = unicode[1] ? Number(unicode[1]) : 0;
    const parte = unicode[2] === "½" ? 0.5 : unicode[2] === "¼" ? 0.25 : 0.75;
    return base + parte;
  }

  const mixta = /(\d+)\s+(\d+)\s*\/\s*(\d+)/.exec(s);
  if (mixta) return Number(mixta[1]) + Number(mixta[2]) / Number(mixta[3]);

  const fraccion = /(\d+)\s*\/\s*(\d+)/.exec(s);
  if (fraccion) return Number(fraccion[1]) / Number(fraccion[2]);

  const decimal = /(\d+(?:[.,]\d+)?)/.exec(s);
  return decimal ? Number(decimal[1].replace(",", ".")) : null;
}

/**
 * Precio tolerante con formato colombiano: `$12.500`, `12.500`, `12,500`,
 * `12.500,50` y `12500` dan el mismo número. Devuelve `null` si no hay cifras.
 */
export function aPrecio(texto: string): number | null {
  let s = texto
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/[^\d.,]/g, "");
  if (!s) return null;

  const comas = (s.match(/,/g) ?? []).length;
  const puntos = (s.match(/\./g) ?? []).length;
  if (comas && puntos) {
    const decimal = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const miles = decimal === "," ? "." : ",";
    s = s.split(miles).join("");
    if (decimal === ",") s = s.replace(",", ".");
  } else if (comas) {
    const partes = s.split(",");
    // "12,500" son miles; "12,50" son centavos.
    s =
      partes.length > 2 || partes[1].length === 3
        ? partes.join("")
        : partes.join(".");
  } else if (puntos) {
    const partes = s.split(".");
    // "12.500" son miles; "12500.50" conserva los centavos.
    if (partes.length > 2 || partes[1].length === 3) s = partes.join("");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function fechaDesde(anio: number, mes: number, dia: number): string | null {
  const d = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    d.getUTCFullYear() !== anio ||
    d.getUTCMonth() !== mes - 1 ||
    d.getUTCDate() !== dia
  )
    return null;
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Fecha tolerante: `AAAA-MM-DD`, `dd/mm/aaaa`, `dd-mm-aa` y con hora al final. */
export function aFechaIso(texto: string): string | null {
  const s = texto.trim().split(/[\sT]/)[0];
  if (!s) return "";

  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
  if (iso) return fechaDesde(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const dmy = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(s);
  if (dmy) {
    const corto = Number(dmy[3]);
    const anio = corto < 100 ? 2000 + corto : corto;
    // En Colombia se escribe dd/mm/aaaa.
    return fechaDesde(anio, Number(dmy[2]), Number(dmy[1]));
  }
  return null;
}

export function leerCsv(texto: string): LecturaCsv {
  const salida: LecturaCsv = { filas: [], total: null, notas: [], errores: [] };
  const error = (linea: number, mensaje: string) =>
    salida.errores.push({ linea, mensaje });

  if (new TextEncoder().encode(texto).length > MAX_BYTES) {
    error(0, "archivo_muy_grande");
    return salida;
  }

  const lineas = texto
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  let delimitador = ",";
  let mapa: string[] | null = null;
  let datos = 0;

  for (let i = 0; i < lineas.length; i++) {
    const numeroLinea = i + 1;
    const cruda = lineas[i].trim();
    if (!cruda || cruda.startsWith("```")) continue;

    if (cruda.startsWith("#")) {
      const total = /^#\s*TOTAL\s*=\s*([\d.,]+)/i.exec(cruda);
      if (total) {
        const n = aPrecio(total[1]);
        if (n !== null) salida.total = n;
      } else if (/^#\s*DUDOSA:/i.test(cruda))
        salida.notas.push(cruda.replace(/^#\s*DUDOSA:\s*/i, ""));
      else if (/^#\s*ERROR:/i.test(cruda))
        error(numeroLinea, cruda.replace(/^#\s*ERROR:\s*/i, ""));
      continue;
    }

    if (!mapa) {
      delimitador = detectarDelimitador(cruda);
      const m = mapaCabecera(dividir(cruda, delimitador));
      const usadas = m.filter(Boolean);
      const valida =
        REQUERIDAS.every((c) => usadas.includes(c)) &&
        new Set(usadas).size === usadas.length;
      if (!valida) {
        error(numeroLinea, "cabecera_invalida");
        return salida;
      }
      mapa = m;
      continue;
    }

    if (++datos > MAX_FILAS) {
      error(numeroLinea, "demasiadas_filas");
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
      // Sin nombre no hay nada que la persona pueda recuperar en la revisión.
      error(numeroLinea, "producto_invalido");
      continue;
    }
    const dudas: string[] = [];
    if (producto.length > 120) {
      producto = producto.slice(0, 120);
      dudas.push("El nombre era muy largo y se recortó.");
    }

    let tienda = valor("tienda").trim();
    if (!tienda) dudas.push("Falta la tienda: escríbela en la revisión.");
    else if (tienda.length > 60) {
      tienda = tienda.slice(0, 60);
      dudas.push("El nombre de la tienda se recortó.");
    }

    const textoCantidad = valor("cantidad").trim();
    let cantidad = textoCantidad ? aCantidad(textoCantidad) : 1;
    if (cantidad === null) {
      cantidad = 1;
      dudas.push(`No entendí la cantidad «${textoCantidad}»; asumí 1.`);
    } else if (cantidad < 0.001 || cantidad > 9999) {
      cantidad = 1;
      dudas.push(
        `La cantidad «${textoCantidad}» está fuera de rango; asumí 1.`,
      );
    }

    const textoPrecio = valor("precio_total").trim();
    let precioTotal = aPrecio(textoPrecio);
    if (precioTotal === null || precioTotal < 1) {
      precioTotal = 0;
      dudas.push(
        textoPrecio
          ? `No entendí el precio «${textoPrecio}»; corrígelo en la revisión.`
          : "Falta el precio; escríbelo en la revisión.",
      );
    } else if (precioTotal > 50_000_000) {
      precioTotal = 0;
      dudas.push("El precio es demasiado alto; corrígelo en la revisión.");
    }

    const textoFecha = valor("fecha").trim();
    const fecha = aFechaIso(textoFecha);
    if (fecha === null) {
      dudas.push(`No entendí la fecha «${textoFecha}»; quedó vacía.`);
    }

    const textoCodigo = valor("codigo").trim();
    const textoDuda = valor("duda").trim();
    if (textoDuda) dudas.push(textoDuda);

    salida.filas.push({
      linea: numeroLinea,
      producto,
      cantidad,
      precioTotal,
      tienda,
      fecha: fecha ?? "",
      // Un código con formato raro no bloquea la fila: simplemente no sirve para emparejar.
      codigo: /^[0-9A-Za-z-]{4,40}$/.test(textoCodigo) ? textoCodigo : "",
      duda: dudas.join(" ").trim(),
    } satisfies FilaCsv);
  }

  if (!mapa && salida.errores.length === 0) error(1, "archivo_vacio");
  return salida;
}

export type { ErrorCsv };
