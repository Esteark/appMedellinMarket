export type UnidadBase = "g" | "ml" | "u";

const FACTOR: Record<string, [UnidadBase, number]> = {
  kg: ["g", 1000],
  g: ["g", 1],
  gr: ["g", 1],
  grs: ["g", 1],
  l: ["ml", 1000],
  lt: ["ml", 1000],
  ml: ["ml", 1],
};

/**
 * Deriva unidad_base y cantidad_base del texto `unidad` de un producto (blueprint §4).
 * También lee nombres de tienda ("Arroz 1.000 G", "450 Grs"), por eso acepta gr/grs/lt
 * y el punto de miles.
 */
export function unidadBase(unidad: string): {
  unidad_base: UnidadBase;
  cantidad_base: number;
} {
  // Punto de miles ("1.000 G") fuera antes de pasar la coma decimal a punto ("1,5 L").
  const texto = unidad
    .replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2")
    .replace(",", ".");
  const medida = "(kg|grs|gr|g|ml|lt|l)\\b";
  // El multipack va antes que la regex simple, que en "6 × 330 ml" solo vería "330 ml".
  const pack = texto.match(
    new RegExp(`(\\d+)\\s*[×x]\\s*(\\d+(?:\\.\\d+)?)\\s*${medida}`, "i"),
  );
  const simple = texto.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${medida}`, "i"),
  );
  if (pack) {
    const [base, factor] = FACTOR[pack[3].toLowerCase()];
    return {
      unidad_base: base,
      cantidad_base: Number(pack[1]) * Number(pack[2]) * factor,
    };
  }
  if (simple) {
    const [base, factor] = FACTOR[simple[2].toLowerCase()];
    return { unidad_base: base, cantidad_base: Number(simple[1]) * factor };
  }
  if (texto.trim().toLowerCase() === "kg")
    return { unidad_base: "g", cantidad_base: 1000 };
  return { unidad_base: "u", cantidad_base: 1 };
}
