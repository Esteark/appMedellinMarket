// Portado de data/origen/constantes-artifact.js (copia literal del artifact, 22-oct-2026).
// Las cantidades son por plan; las fraccionarias (cebolla 1,75, pimentón 3,5) se redondean hacia
// arriba al cargarlas, porque la lista guarda enteros.

export type Plan = { nombre: string; items: Record<string, number> };
export type IdPlan = "semana" | "mes" | "hogar";

export const PLANES: Record<IdPlan, Plan> = {
  semana: {
    nombre: "Lista base de la semana (dieta 5 personas)",
    items: {
      huevos: 4,
      lechuga: 9,
      pepino: 5,
      tomate: 4,
      cebolla: 1.75,
      cebolla_morada: 1.75,
      pimenton: 3.5,
      apio: 1,
      zanahoria: 1,
      aguacate: 4,
      pina: 1,
      mango: 1,
      cilantro: 1,
      cebollin: 1,
      limon: 1,
      ajo: 2,
      papa: 3,
      pollo: 3,
      res_desmechar: 1,
      molida: 1,
      cerdo: 1,
      maicitos: 2,
      pasta: 5,
      leche: 4,
      yogur_griego: 2,
      frijol: 2,
      lenteja: 4,
    },
  },
  mes: {
    nombre: "Plan del mes (dieta 5 personas)",
    items: {
      huevos: 16,
      lechuga: 36,
      pepino: 20,
      tomate: 16,
      cebolla: 7,
      cebolla_morada: 7,
      pimenton: 14,
      apio: 4,
      zanahoria: 4,
      papa: 12,
      cilantro: 4,
      cebollin: 4,
      ajo: 8,
      limon: 4,
      aguacate: 16,
      pina: 4,
      mango: 4,
      pollo: 12,
      res_desmechar: 4,
      molida: 4,
      cerdo: 4,
      atun: 4,
      leche: 16,
      yogur_griego: 8,
      parmesano: 1,
      queso_crema: 2,
      frijol: 8,
      lenteja: 16,
      garbanzo: 3,
      pasta: 20,
      maicitos: 8,
      sal: 2,
      miel: 1,
      pasta_ajo: 3,
      paprika: 2,
      hierbas: 3,
      soya: 2,
      mayonesa: 1,
      mostaza: 1,
    },
  },
  hogar: {
    nombre: "Mercado sugerido del mes (hogar 6 personas)",
    items: {
      huevos: 20,
      yogur_griego: 17,
      leche_polvo: 2,
      leche: 2,
      pollo: 10,
      molida: 4,
      cerdo: 4,
      papa: 12,
      pimenton: 8,
      cebolla: 6,
      cebolla_morada: 4,
      tomate: 12,
      pepino: 8,
      cilantro: 4,
      espinaca: 4,
      tomate_arbol: 6,
      uva_isabelina: 4,
      guayaba: 4,
      pina: 4,
      ajo: 8,
      aguacate: 8,
      lechuga: 12,
      aceite_oliva: 2,
      arroz: 2,
      arepa: 8,
      soya: 1,
      hierbas: 2,
      paprika: 1,
    },
  },
};

/**
 * Rubro del presupuesto al que pertenece un producto. Usa los mismos nombres
 * que los rubros editables del plan (`PRESUPUESTO_SUGERIDO_HOGAR`), para que la
 * comparación de la lista nunca invente una categoría distinta.
 */
export function rubroDe(p: { id: string; grupo: string }): string {
  if (p.id === "huevos") return "Carnes";
  if (p.grupo === "Proteínas") return "Carnes";
  if (p.grupo === "Lácteos") return "Lácteos";
  if (["Verduras", "Tubérculos"].includes(p.grupo)) return "Verduras";
  if (p.grupo === "Frutas") return "Frutas";
  if (p.grupo === "Granos") return "Granos";
  if (p.grupo === "Panadería") return "Panadería";
  if (p.grupo === "Despensa") return "Despensa";
  if (p.grupo === "Aseo") return "Aseo";
  if (p.grupo === "Bebidas") return "Bebidas";
  if (p.grupo === "Mecato") return "Mecato";
  return "Otros";
}
