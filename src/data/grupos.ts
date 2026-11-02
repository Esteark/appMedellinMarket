/** Grupos de cada vista del catálogo (data/origen/constantes-artifact.js). */
export const BASICOS = [
  "Frutas",
  "Verduras",
  "Tubérculos",
  "Granos",
  "Panadería",
  "Proteínas",
  "Lácteos",
  "Despensa",
  "Aseo",
];
export const ANTOJOS = ["Mecato", "Bebidas", "Gourmet"];

/** Todos los grupos de fábrica, en el orden en que se muestran en español. */
export const GRUPOS_DE_PRODUCTO = [...BASICOS, ...ANTOJOS].sort((a, b) =>
  a.localeCompare(b, "es"),
);

/** Color de cada grupo en el gráfico de gasto (GCOL del artifact). */
export const COLOR_GRUPO: Record<string, string> = {
  Frutas: "#F97316",
  Verduras: "#16A34A",
  Tubérculos: "#A16207",
  Granos: "#EAB308",
  Proteínas: "#DC2626",
  Lácteos: "#3B82F6",
  Despensa: "#8B5CF6",
  Aseo: "#06B6D4",
  Panadería: "#D97706",
  Mecato: "#EC4899",
  Bebidas: "#0EA5E9",
  Gourmet: "#7C3AED",
};
