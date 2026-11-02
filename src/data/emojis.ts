// `src/data` no importa de `lib`: la normalización de búsqueda vive aquí.
const normal = (s: string) =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

export type EmojiItem = { e: string; n: string };
export type CategoriaEmoji = { id: string; nombre: string; items: EmojiItem[] };

/** Emojis de mercado por categoría; `n` es el nombre en español que busca el selector. */
export const CATEGORIAS_EMOJI: CategoriaEmoji[] = [
  {
    id: "frutas",
    nombre: "Frutas",
    items: [
      { e: "🍎", n: "manzana roja" },
      { e: "🍏", n: "manzana verde" },
      { e: "🍐", n: "pera" },
      { e: "🍊", n: "naranja mandarina" },
      { e: "🍋", n: "limon" },
      { e: "🍌", n: "banano platano" },
      { e: "🍉", n: "sandia" },
      { e: "🍇", n: "uva" },
      { e: "🍓", n: "fresa" },
      { e: "🫐", n: "mora arandano" },
      { e: "🍈", n: "melon" },
      { e: "🍒", n: "cereza" },
      { e: "🍑", n: "durazno melocoton" },
      { e: "🥭", n: "mango" },
      { e: "🍍", n: "pina" },
      { e: "🥥", n: "coco" },
      { e: "🥝", n: "kiwi" },
      { e: "🥑", n: "aguacate" },
    ],
  },
  {
    id: "verduras",
    nombre: "Verduras",
    items: [
      { e: "🍅", n: "tomate" },
      { e: "🍆", n: "berenjena" },
      { e: "🥔", n: "papa patata" },
      { e: "🥕", n: "zanahoria" },
      { e: "🌽", n: "maiz mazorca" },
      { e: "🌶️", n: "aji picante" },
      { e: "🫑", n: "pimenton" },
      { e: "🥒", n: "pepino" },
      { e: "🥬", n: "lechuga repollo acelga" },
      { e: "🥦", n: "brocoli" },
      { e: "🧄", n: "ajo" },
      { e: "🧅", n: "cebolla" },
      { e: "🍄", n: "champinon hongo" },
      { e: "🫛", n: "arveja habichuela" },
      { e: "🌿", n: "cilantro hierba perejil" },
      { e: "🍠", n: "batata yuca" },
    ],
  },
  {
    id: "carnes",
    nombre: "Carnes y pescado",
    items: [
      { e: "🥩", n: "carne res corte" },
      { e: "🍖", n: "costilla carne hueso" },
      { e: "🍗", n: "pollo muslo" },
      { e: "🥓", n: "tocino bacon" },
      { e: "🌭", n: "salchicha" },
      { e: "🍔", n: "hamburguesa carne molida" },
      { e: "🐟", n: "pescado" },
      { e: "🍤", n: "camaron" },
      { e: "🦐", n: "camaron langostino" },
      { e: "🦑", n: "calamar" },
      { e: "🐷", n: "cerdo" },
      { e: "🐄", n: "res vaca" },
    ],
  },
  {
    id: "lacteos",
    nombre: "Lácteos y huevos",
    items: [
      { e: "🥛", n: "leche" },
      { e: "🧀", n: "queso" },
      { e: "🧈", n: "mantequilla" },
      { e: "🥚", n: "huevo huevos" },
      { e: "🍳", n: "huevo frito" },
      { e: "🍦", n: "helado" },
      { e: "🥣", n: "yogurt cereal" },
    ],
  },
  {
    id: "panaderia",
    nombre: "Panadería y granos",
    items: [
      { e: "🍞", n: "pan" },
      { e: "🥖", n: "baguette pan frances" },
      { e: "🥐", n: "croissant" },
      { e: "🫓", n: "arepa pan plano" },
      { e: "🥨", n: "pretzel galleta" },
      { e: "🥞", n: "panqueque" },
      { e: "🍚", n: "arroz" },
      { e: "🍝", n: "pasta espagueti" },
      { e: "🍜", n: "fideos sopa" },
      { e: "🫘", n: "frijol lenteja garbanzo" },
      { e: "🌾", n: "trigo avena harina" },
      { e: "🥜", n: "mani nuez" },
      { e: "🍪", n: "galleta" },
      { e: "🎂", n: "torta ponque" },
    ],
  },
  {
    id: "despensa",
    nombre: "Despensa y bebidas",
    items: [
      { e: "🫒", n: "aceite oliva" },
      { e: "🧂", n: "sal" },
      { e: "🍯", n: "miel panela" },
      { e: "🍬", n: "dulce azucar" },
      { e: "🍫", n: "chocolate" },
      { e: "☕", n: "cafe" },
      { e: "🍵", n: "te aromatica" },
      { e: "🧃", n: "jugo" },
      { e: "🥤", n: "gaseosa bebida" },
      { e: "💧", n: "agua" },
      { e: "🍺", n: "cerveza" },
      { e: "🍷", n: "vino" },
      { e: "🥫", n: "atun enlatado lata conserva" },
      { e: "🍿", n: "crispetas" },
      { e: "🍟", n: "papas fritas mecato" },
    ],
  },
  {
    id: "hogar",
    nombre: "Aseo y hogar",
    items: [
      { e: "🧼", n: "jabon" },
      { e: "🧽", n: "esponja" },
      { e: "🧴", n: "champu crema locion" },
      { e: "🧻", n: "papel higienico" },
      { e: "🪥", n: "cepillo dientes" },
      { e: "🧹", n: "escoba" },
      { e: "🪣", n: "balde" },
      { e: "🕯️", n: "vela" },
      { e: "🛒", n: "mercado compra" },
      { e: "🐶", n: "mascota perro" },
      { e: "🐱", n: "mascota gato" },
    ],
  },
];

/** Todos los emojis del catálogo, sin repetir. */
export const TODOS_EMOJI: EmojiItem[] = [
  ...new Map(
    CATEGORIAS_EMOJI.flatMap((c) => c.items).map((i) => [i.e, i]),
  ).values(),
];

/** Filtra por nombre ignorando tildes y mayúsculas; sin texto devuelve todos. */
export function buscarEmojis(texto: string): EmojiItem[] {
  const q = normal(texto);
  if (!q) return TODOS_EMOJI;
  return TODOS_EMOJI.filter((i) => normal(i.n).includes(q));
}

/** Un ícono libre: hasta 8 caracteres (visibles) y sin espacios al borde. */
export function limpiarEmoji(texto: string): string {
  return [...texto.trim()].slice(0, 8).join("");
}
