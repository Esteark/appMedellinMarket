export type UnidadBase = "g" | "ml" | "u";

const FACTOR: Record<string, [UnidadBase, number]> = {
  kg: ["g", 1000],
  g: ["g", 1],
  l: ["ml", 1000],
  ml: ["ml", 1],
};

/** Deriva unidad_base y cantidad_base del texto `unidad` de un producto (blueprint §4). */
export function unidadBase(unidad: string): {
  unidad_base: UnidadBase;
  cantidad_base: number;
} {
  const texto = unidad.replace(",", ".");
  // El multipack va antes que la regex simple, que en "6 × 330 ml" solo vería "330 ml".
  const pack = texto.match(/(\d+)\s*[×x]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i);
  const simple = texto.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i);
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
