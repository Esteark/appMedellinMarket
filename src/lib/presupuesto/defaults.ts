export const RUBROS_SUGERIDOS = [
  "Carnes",
  "Granos",
  "Verduras",
  "Frutas",
  "Lácteos",
  "Panadería",
  "Despensa",
  "Aseo",
  "Bebidas",
  "Mecato",
  "Otros",
] as const;

export const PRESUPUESTO_SUGERIDO_HOGAR: Record<string, number> = {
  Carnes: 400000,
  Granos: 250000,
  Verduras: 300000,
  Frutas: 150000,
  Lácteos: 150000,
  Panadería: 70000,
  Despensa: 120000,
  Aseo: 60000,
  Bebidas: 50000,
  Mecato: 40000,
  Otros: 43000,
};

export const PRESUPUESTO_SUGERIDO_DIETA: Record<string, number> = {
  Carnes: 250000,
  Granos: 150000,
  Verduras: 150000,
  Frutas: 80000,
  Lácteos: 70000,
  Panadería: 40000,
  Despensa: 40000,
  Aseo: 0,
  Bebidas: 20000,
  Mecato: 0,
  Otros: 0,
};
