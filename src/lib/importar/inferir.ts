import {
  PALABRAS_PRODUCTO,
  type PalabraProducto,
} from "@/data/palabras-producto";
import { unidadBase } from "@/lib/unidades";
import { sinAcentos } from "./csv";

export type Inferencia = {
  /** `null` si ninguna palabra del nombre se reconoce: no se inventa un ícono. */
  emoji: string | null;
  /** Un grupo del catálogo; «Otros» si no se reconoce nada. */
  grupo: string;
  /** Una de `UNIDADES` de la revisión: u, kg, g, l, ml. */
  unidad: "u" | "kg" | "g" | "l" | "ml";
  cantidadBase: number;
  /** Bolsa de reciclaje, domicilio, descuento…: se registra el gasto y no se crea un producto. */
  noEsProducto: boolean;
};

const INDICE = new Map<string, PalabraProducto>();
for (const e of PALABRAS_PRODUCTO)
  for (const p of e.palabras) if (!INDICE.has(p)) INDICE.set(p, e);

const NO_PRODUCTO =
  /\b(recicla\w*|domicilio|propina|descuento|empaque|envio|cargo)\b/;

/** Palabras en minúscula y sin tildes; «900ml6und» se parte en «ml» y «und». */
const palabras = (nombre: string) =>
  sinAcentos(nombre)
    .split(/[^a-z]+/)
    .filter(Boolean);

const buscar = (palabra: string) =>
  INDICE.get(palabra) ??
  INDICE.get(palabra.replace(/(es|s)$/, "")) ??
  undefined;

/**
 * Propone la ficha de un producto nuevo a partir de cómo lo escribió la factura: ícono y grupo por las palabras
 * del nombre, y unidad y tamaño por el peso (una cantidad con decimales es peso: `kg`) o por la medida del nombre
 * («2500g» → g 2500). Es una propuesta que la persona confirma o corrige; lo que no reconoce lo deja vacío.
 */
export function inferirProducto(nombre: string, cantidad: number): Inferencia {
  const ps = palabras(nombre);
  let mejor: PalabraProducto | undefined;
  for (const p of ps) {
    const e = buscar(p);
    if (e && (!mejor || (e.prioridad ?? 0) > (mejor.prioridad ?? 0))) mejor = e;
  }

  const noEsProducto =
    NO_PRODUCTO.test(sinAcentos(nombre)) ||
    (ps[0] === "bolsa" && ps.length <= 2 && !ps.includes("basura"));

  const porPeso = cantidad % 1 !== 0;
  const medida = unidadBase(nombre);
  let unidad: Inferencia["unidad"] = "u";
  let cantidadBase = 1;
  if (porPeso) {
    unidad = "kg";
  } else if (medida.unidad_base === "g" || medida.unidad_base === "ml") {
    // 1000 g se dice «1 kg» y 1000 ml «1 l»; el resto se queda en g o ml con su tamaño.
    const entera = medida.cantidad_base % 1000 === 0;
    unidad =
      medida.unidad_base === "g" ? (entera ? "kg" : "g") : entera ? "l" : "ml";
    cantidadBase = entera ? medida.cantidad_base / 1000 : medida.cantidad_base;
  }

  return {
    emoji: mejor?.emoji ?? null,
    grupo: mejor?.grupo ?? "Otros",
    unidad,
    cantidadBase,
    noEsProducto,
  };
}
