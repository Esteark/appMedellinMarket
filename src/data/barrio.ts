// Catálogo inicial de Tienda/Carnicería de barrio: qué productos se le siguen. NO trae precios: cada
// precio entra a mano con `corregir_precio('barrio', …)`. La migración 20261030170000 y `scripts/migrar.ts`
// siembran estos mismos ids en `catalogo_tienda`; este archivo es la copia legible para la UI y las pruebas.

export type GrupoBarrio = "Proteínas" | "Lácteos" | "Panadería" | "Despensa";

export const GRUPOS_BARRIO: GrupoBarrio[] = [
  "Proteínas",
  "Lácteos",
  "Panadería",
  "Despensa",
];

const por = (grupo: GrupoBarrio, ids: string[]) =>
  ids.map((id) => ({ id, grupo }));

/** En orden: el índice + 1 es `catalogo_tienda.orden`. */
export const CATALOGO_BARRIO = [
  ...por("Proteínas", [
    "atun",
    "cerdo",
    "chorizo",
    "costilla",
    "higado",
    "huevos",
    "jamon",
    "molida",
    "muslos",
    "pollo",
    "pollo_entero",
    "res_desmechar",
    "res_sudar",
    "salchicha",
    "sardinas",
    "tilapia",
    "tocino",
  ]),
  ...por("Lácteos", [
    "crema_leche",
    "kumis",
    "leche",
    "leche_deslactosada",
    "leche_polvo",
    "mantequilla",
    "parmesano",
    "queso",
    "queso_crema",
    "queso_mozzarella",
    "yogur",
    "yogur_griego",
  ]),
  ...por("Panadería", [
    "croissant",
    "muffin",
    "pan_frances",
    "pan_integral",
    "pan_tajado",
    "pandebono",
    "torta_chocolate",
  ]),
  ...por("Despensa", ["aceite", "azucar", "cafe", "panela", "sal"]),
].map((p, i) => ({ ...p, orden: i + 1 }));

/** Días sin precio manual antes de pedir que se actualice, según la frecuencia del producto. */
export const DIAS_ACTUALIZAR = { diaria: 14, semanal: 30 } as const;
