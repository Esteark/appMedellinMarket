import { sinAcentos } from "./csv";

type ProductoSugerible = { id: string; nombre: string };

const VACIAS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "con",
  "sin",
  "para",
  "por",
  "y",
  "a",
  "en",
  "un",
  "una",
  "x",
]);
// Tamaños y presentaciones de recibo que no distinguen un producto de otro.
const PRESENTACION =
  /^(und|unds|unidad|unidades|paq|paquete|pqt|g|gr|grs|kg|ml|l|lt|litro|tacos|taco|reg|regular|rend|refrig)$/;

/** Singular simple: «papas» → «papa»; las palabras cortas («res») se dejan. */
const singular = (p: string) => (p.length > 3 ? p.replace(/s$/, "") : p);

/** Palabras que distinguen un producto: sin tildes, sin vacías, sin tamaños ni presentaciones. */
export function significativas(texto: string): string[] {
  const salida = new Set<string>();
  for (const p of sinAcentos(texto).split(/[^a-z]+/)) {
    if (p.length >= 2 && !VACIAS.has(p) && !PRESENTACION.test(p))
      salida.add(singular(p));
  }
  return [...salida];
}

/**
 * Productos del catálogo que podrían ser la misma cosa que una línea de factura, para que la persona lo confirme.
 * Regla segura: **todas** las palabras significativas del producto del catálogo aparecen en la línea, y la primera
 * palabra de la línea (el nombre del producto) es una de ellas. «Panela», «Arroz» y «Leche entera» sirven para sus
 * líneas; «Crema de leche» no sirve para una leche, porque «crema» no está; «Huevos» no sirve para «Cebolla de
 * huevo», porque la línea empieza por «cebolla». Máximo `max`, el más específico (más palabras) primero. Nunca se aplica sola.
 */
export function sugerirExistente(
  nombre: string,
  productos: ProductoSugerible[],
  max = 3,
): ProductoSugerible[] {
  const palabrasLinea = significativas(nombre);
  const linea = new Set(palabrasLinea);
  const cabeza = palabrasLinea[0];
  return productos
    .map((p) => ({ p, palabras: significativas(p.nombre) }))
    .filter(
      ({ palabras }) =>
        palabras.length > 0 &&
        palabras.includes(cabeza) &&
        palabras.every((w) => linea.has(w)),
    )
    .sort(
      (a, b) =>
        b.palabras.length - a.palabras.length ||
        a.p.nombre.length - b.p.nombre.length,
    )
    .slice(0, max)
    .map(({ p }) => p);
}
