const sinAcentos = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Primera coincidencia gana. Proteínas, Tubérculos y Gourmet no se llaman como su rubro.
const REGLAS: [clave: string, rubro: string][] = [
  ["proteina", "Carnes"],
  ["carne", "Carnes"],
  ["tubercul", "Verduras"],
  ["verdura", "Verduras"],
  ["gourmet", "Despensa"],
  ["despensa", "Despensa"],
  ["grano", "Granos"],
  ["fruta", "Frutas"],
  ["lacteo", "Lácteos"],
  ["leche", "Lácteos"],
  ["pan", "Panadería"],
  ["aseo", "Aseo"],
  ["bebida", "Bebidas"],
  ["mecato", "Mecato"],
  ["snack", "Mecato"],
];

/** Rubro del presupuesto para un grupo del catálogo; `Otros` solo si nada coincide. */
export function grupoARubro(grupo: string): string {
  const g = sinAcentos(grupo);
  return REGLAS.find(([clave]) => g.includes(clave))?.[1] ?? "Otros";
}
