import type { ErrorCsv, FilaCsv, LecturaCsv } from "./tipos";

export const MAX_FILAS = 500;
export const MAX_BYTES = 1024 * 1024;

const COLUMNAS = [
  "producto",
  "cantidad",
  "precio_total",
  "tienda",
  "fecha",
  "codigo",
];

const sinAcentos = (t: string) =>
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

function numero(texto: string, coma: boolean): number | null {
  const t = texto.trim();
  if (!(coma ? /^\d+([.,]\d+)?$/ : /^\d+(\.\d+)?$/).test(t)) return null;
  return Number(t.replace(",", "."));
}

function fechaValida(f: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return false;
  const d = new Date(`${f}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(f);
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
  let columnas = 0;
  let datos = 0;

  for (let i = 0; i < lineas.length; i++) {
    const numeroLinea = i + 1;
    const cruda = lineas[i].trim();
    if (!cruda || cruda.startsWith("```")) continue;

    if (cruda.startsWith("#")) {
      const total = /^#\s*TOTAL\s*=\s*(\d+)/i.exec(cruda);
      if (total) salida.total = Number(total[1]);
      else if (/^#\s*DUDOSA:/i.test(cruda))
        salida.notas.push(cruda.replace(/^#\s*DUDOSA:\s*/i, ""));
      else if (/^#\s*ERROR:/i.test(cruda))
        error(numeroLinea, cruda.replace(/^#\s*ERROR:\s*/i, ""));
      continue;
    }

    if (columnas === 0) {
      delimitador =
        cruda.split(";").length > cruda.split(",").length ? ";" : ",";
      const cabecera = dividir(cruda, delimitador).map(sinAcentos);
      const valida =
        cabecera.length >= 4 &&
        cabecera.length <= COLUMNAS.length &&
        cabecera.every((c, k) => c === COLUMNAS[k]);
      if (!valida) {
        error(numeroLinea, "cabecera_invalida");
        return salida;
      }
      columnas = cabecera.length;
      continue;
    }

    if (++datos > MAX_FILAS) {
      error(numeroLinea, "demasiadas_filas");
      return salida;
    }

    const campos = dividir(cruda, delimitador);
    if (campos.length !== columnas) {
      error(numeroLinea, "columnas_distintas");
      continue;
    }
    const [producto, cant, total, tienda, fecha = "", codigo = ""] = campos;
    const coma = delimitador === ";";
    const cantidad = numero(cant, coma);
    const precioTotal = numero(total, coma);
    if (!producto || producto.length > 120)
      error(numeroLinea, "producto_invalido");
    else if (!tienda || tienda.length > 60)
      error(numeroLinea, "tienda_invalida");
    else if (cantidad === null || cantidad < 0.001 || cantidad > 9999)
      error(numeroLinea, "cantidad_invalida");
    else if (
      precioTotal === null ||
      precioTotal < 1 ||
      precioTotal > 50_000_000
    )
      error(numeroLinea, "precio_invalido");
    else if (fecha && !fechaValida(fecha)) error(numeroLinea, "fecha_invalida");
    else
      salida.filas.push({
        linea: numeroLinea,
        producto,
        cantidad,
        precioTotal,
        tienda,
        fecha,
        // Un código con formato raro no bloquea la fila: simplemente no sirve para emparejar.
        codigo: /^[0-9A-Za-z-]{4,40}$/.test(codigo) ? codigo : "",
      } satisfies FilaCsv);
  }

  if (columnas === 0 && salida.errores.length === 0) error(1, "archivo_vacio");
  return salida;
}

export type { ErrorCsv };
