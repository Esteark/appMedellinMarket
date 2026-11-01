import type { FilaRevision } from "./tipos";

export type Grupo = {
  clave: string;
  tienda: string;
  fecha: string;
  indices: number[];
};

/** Agrupa por tienda + fecha conservando el orden del archivo. */
export function agrupar(filas: FilaRevision[], fechaLote: string): Grupo[] {
  const m = new Map<string, Grupo>();
  filas.forEach((f, i) => {
    const fecha = f.fecha || fechaLote;
    const clave = `${f.tienda}|${fecha}`;
    const g = m.get(clave) ?? { clave, tienda: f.tienda, fecha, indices: [] };
    g.indices.push(i);
    m.set(clave, g);
  });
  return [...m.values()];
}

/** Avisa si la suma de líneas se aparta del total impreso en más de 1 % o de 500 pesos. */
export function noCuadra(suma: number, impreso: number): boolean {
  const dif = Math.abs(suma - impreso);
  return dif > 500 || dif > impreso * 0.01;
}
