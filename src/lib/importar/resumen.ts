import { normalizarNombre } from "./emparejar";
import type { ModoFila } from "./tipos";

/** Lo mínimo de una línea para resumir y repartir el cupo. */
export type FilaParaResumen = {
  producto: string;
  tienda: string;
  fecha: string;
  modo: ModoFila;
};

export type ResumenFactura = {
  lineas: number;
  /** Líneas que repiten otra del mismo producto, tienda y fecha: se muestran y se deciden juntas. */
  repetidas: number;
  existentes: number;
  /** Productos distintos que se crearían (la base los cuenta por nombre normalizado). */
  nuevos: number;
  soloGasto: number;
  tiendas: number;
  cupo: {
    limite: number;
    usados: number;
    queda: number;
    necesita: number;
    alcanza: boolean;
  };
};

/** Clave de la línea repetida: mismo producto, tienda y fecha. */
export const claveRepetida = (
  f: Pick<FilaParaResumen, "producto" | "tienda" | "fecha">,
) => `${normalizarNombre(f.producto)}|${normalizarNombre(f.tienda)}|${f.fecha}`;

const nuevosDistintos = (filas: FilaParaResumen[]) =>
  new Set(
    filas
      .filter((f) => f.modo === "crear")
      .map((f) => normalizarNombre(f.producto)),
  );

/** El resumen que ve la persona antes de revisar fila por fila. */
export function resumirFactura(
  filas: FilaParaResumen[],
  cupo: { limite: number; usados: number },
): ResumenFactura {
  const necesita = nuevosDistintos(filas).size;
  const queda = Math.max(0, cupo.limite - cupo.usados);
  return {
    lineas: filas.length,
    repetidas: filas.length - new Set(filas.map(claveRepetida)).size,
    existentes: filas.filter((f) => f.modo === "existente").length,
    nuevos: necesita,
    soloGasto: filas.filter((f) => f.modo === "solo_gasto").length,
    tiendas: new Set(filas.map((f) => normalizarNombre(f.tienda))).size,
    cupo: { ...cupo, queda, necesita, alcanza: necesita <= queda },
  };
}

/**
 * «Crear hasta el cupo y el resto solo gasto»: se queda por crear el primer `queda` de productos distintos (en
 * el orden de la factura) y las demás líneas nuevas pasan a solo gasto. Las líneas del mismo producto comparten
 * suerte. No toca las que ya eran existentes o solo gasto, ni modifica la lista recibida.
 */
export function repartirCupo<T extends FilaParaResumen>(
  filas: T[],
  queda: number,
): T[] {
  const dentro = new Set<string>();
  for (const f of filas) {
    const n = normalizarNombre(f.producto);
    if (f.modo === "crear" && dentro.size < queda) dentro.add(n);
  }
  return filas.map((f) =>
    f.modo === "crear" && !dentro.has(normalizarNombre(f.producto))
      ? { ...f, modo: "solo_gasto" as const }
      : f,
  );
}

export { nuevosDistintos };
