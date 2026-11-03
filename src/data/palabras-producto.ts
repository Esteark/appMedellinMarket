/**
 * Palabras de un nombre de producto → ícono y grupo del catálogo. Sirve para proponer (nunca imponer) la ficha de
 * un producto nuevo al importar una factura. Las palabras van sin tildes y en minúscula; el singular basta (se
 * prueba también sin la «s» o «es» final). `prioridad` (por defecto 0) gana cuando coinciden varias palabras del
 * mismo nombre: «papas fritas» es Mecato aunque «papas» sea un tubérculo.
 */
export type PalabraProducto = {
  palabras: string[];
  emoji: string;
  grupo: string;
  prioridad?: number;
};

export const PALABRAS_PRODUCTO: PalabraProducto[] = [
  // Proteínas
  { palabras: ["huevo"], emoji: "🥚", grupo: "Proteínas" },
  {
    palabras: ["res", "carne", "molida", "lomo", "costilla", "solomo"],
    emoji: "🥩",
    grupo: "Proteínas",
  },
  {
    palabras: ["cerdo", "espinazo", "papada", "chuleta", "cabeza"],
    emoji: "🥩",
    grupo: "Proteínas",
  },
  { palabras: ["tocino"], emoji: "🥓", grupo: "Proteínas" },
  {
    palabras: ["pollo", "pechuga", "muslo", "pernil", "alita"],
    emoji: "🍗",
    grupo: "Proteínas",
  },
  {
    palabras: ["chorizo", "salchicha", "mortadela", "jamon"],
    emoji: "🌭",
    grupo: "Proteínas",
  },
  { palabras: ["atun", "sardina"], emoji: "🥫", grupo: "Proteínas" },
  {
    palabras: ["pescado", "tilapia", "trucha", "salmon"],
    emoji: "🐟",
    grupo: "Proteínas",
  },
  { palabras: ["higado"], emoji: "🥩", grupo: "Proteínas" },
  // Lácteos
  { palabras: ["leche", "kumis"], emoji: "🥛", grupo: "Lácteos" },
  { palabras: ["yogurt", "yogur"], emoji: "🥣", grupo: "Lácteos" },
  { palabras: ["queso", "quesito", "cuajada"], emoji: "🧀", grupo: "Lácteos" },
  { palabras: ["natilla"], emoji: "🍮", grupo: "Lácteos" },
  { palabras: ["mantequilla", "crema"], emoji: "🧈", grupo: "Lácteos" },
  // Granos
  { palabras: ["arroz"], emoji: "🍚", grupo: "Granos" },
  { palabras: ["lenteja", "garbanzo", "frijol"], emoji: "🫘", grupo: "Granos" },
  { palabras: ["harina", "avena"], emoji: "🌾", grupo: "Granos" },
  {
    palabras: [
      "pasta",
      "espagueti",
      "spaghetti",
      "fideo",
      "macarron",
      "tornillo",
    ],
    emoji: "🍝",
    grupo: "Granos",
  },
  { palabras: ["maiz", "maicito"], emoji: "🌽", grupo: "Granos" },
  { palabras: ["arepa"], emoji: "🫓", grupo: "Granos" },
  // Panadería
  {
    palabras: ["pan", "tostada", "pandebono", "almojabana"],
    emoji: "🍞",
    grupo: "Panadería",
  },
  {
    palabras: ["bizcocho", "bizcochito", "ponque", "torta", "muffin"],
    emoji: "🥐",
    grupo: "Panadería",
  },
  { palabras: ["bunuelo", "croissant"], emoji: "🥐", grupo: "Panadería" },
  // Despensa
  { palabras: ["aceite"], emoji: "🫒", grupo: "Despensa" },
  { palabras: ["sal"], emoji: "🧂", grupo: "Despensa" },
  { palabras: ["azucar"], emoji: "🍬", grupo: "Despensa" },
  { palabras: ["panela", "miel"], emoji: "🍯", grupo: "Despensa" },
  { palabras: ["cafe"], emoji: "☕", grupo: "Despensa" },
  { palabras: ["aromatica", "te"], emoji: "🍵", grupo: "Despensa" },
  { palabras: ["caldo", "sopa"], emoji: "🥣", grupo: "Despensa" },
  {
    palabras: ["canela", "comino", "color", "paprika", "pimienta", "oregano"],
    emoji: "🌿",
    grupo: "Despensa",
  },
  { palabras: ["granulado"], emoji: "🧄", grupo: "Despensa", prioridad: 1 },
  {
    palabras: ["mayonesa", "mostaza", "soya", "vinagre", "salsa"],
    emoji: "🥫",
    grupo: "Despensa",
  },
  { palabras: ["chocolate"], emoji: "🍫", grupo: "Despensa" },
  // Mecato
  {
    palabras: ["galleta", "saltin", "ducales", "dux", "saltin"],
    emoji: "🍪",
    grupo: "Mecato",
  },
  {
    palabras: ["chocolatina", "gomita", "bocadillo", "arequipe"],
    emoji: "🍬",
    grupo: "Mecato",
  },
  {
    palabras: ["fritas", "papitas", "chicharron"],
    emoji: "🍟",
    grupo: "Mecato",
    prioridad: 1,
  },
  { palabras: ["helado"], emoji: "🍦", grupo: "Mecato" },
  { palabras: ["mani"], emoji: "🥜", grupo: "Mecato" },
  // Bebidas
  { palabras: ["gaseosa", "cola"], emoji: "🥤", grupo: "Bebidas" },
  { palabras: ["jugo"], emoji: "🧃", grupo: "Bebidas" },
  { palabras: ["agua"], emoji: "💧", grupo: "Bebidas" },
  { palabras: ["cerveza"], emoji: "🍺", grupo: "Bebidas" },
  { palabras: ["vino"], emoji: "🍷", grupo: "Bebidas" },
  // Frutas
  { palabras: ["coco"], emoji: "🥥", grupo: "Frutas" },
  { palabras: ["manzana"], emoji: "🍎", grupo: "Frutas" },
  { palabras: ["banano", "guineo"], emoji: "🍌", grupo: "Frutas" },
  { palabras: ["naranja", "mandarina"], emoji: "🍊", grupo: "Frutas" },
  { palabras: ["limon"], emoji: "🍋", grupo: "Frutas" },
  { palabras: ["mango"], emoji: "🥭", grupo: "Frutas" },
  { palabras: ["pina"], emoji: "🍍", grupo: "Frutas" },
  {
    palabras: ["fresa", "mora", "uva", "lulo", "guayaba", "papaya", "maracuya"],
    emoji: "🍓",
    grupo: "Frutas",
  },
  { palabras: ["aguacate"], emoji: "🥑", grupo: "Frutas" },
  // Verduras
  { palabras: ["cebolla"], emoji: "🧅", grupo: "Verduras" },
  { palabras: ["tomate"], emoji: "🍅", grupo: "Verduras" },
  { palabras: ["zanahoria"], emoji: "🥕", grupo: "Verduras" },
  {
    palabras: ["lechuga", "repollo", "espinaca", "acelga"],
    emoji: "🥬",
    grupo: "Verduras",
  },
  { palabras: ["brocoli"], emoji: "🥦", grupo: "Verduras" },
  {
    palabras: ["pepino", "habichuela", "ahuyama", "remolacha"],
    emoji: "🥒",
    grupo: "Verduras",
  },
  { palabras: ["pimenton"], emoji: "🫑", grupo: "Verduras" },
  { palabras: ["ajo"], emoji: "🧄", grupo: "Verduras" },
  {
    palabras: ["apio", "cilantro", "cebollin"],
    emoji: "🌿",
    grupo: "Verduras",
  },
  { palabras: ["arveja"], emoji: "🫛", grupo: "Verduras" },
  { palabras: ["mazorca"], emoji: "🌽", grupo: "Verduras" },
  // Tubérculos
  {
    palabras: ["papa", "yuca", "arracacha", "platano"],
    emoji: "🥔",
    grupo: "Tubérculos",
  },
  // Aseo
  {
    palabras: [
      "jabon",
      "detergente",
      "det",
      "blanqueador",
      "cloro",
      "suavizante",
    ],
    emoji: "🧼",
    grupo: "Aseo",
  },
  {
    palabras: ["lavaloza", "loza", "esponja", "esponjilla"],
    emoji: "🧽",
    grupo: "Aseo",
  },
  {
    palabras: ["papel", "toalla", "protector", "panal", "servilleta"],
    emoji: "🧻",
    grupo: "Aseo",
  },
  {
    palabras: ["shampoo", "champu", "desodorante"],
    emoji: "🧴",
    grupo: "Aseo",
  },
  { palabras: ["dental", "cepillo"], emoji: "🪥", grupo: "Aseo" },
];
