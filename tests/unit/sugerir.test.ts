import { describe, expect, it } from "vitest";
import { significativas, sugerirExistente } from "@/lib/importar/sugerir";

// Catálogo parecido al de fábrica.
const catalogo = [
  { id: "leche", nombre: "Leche entera" },
  { id: "leche_sola", nombre: "Leche" },
  { id: "crema_leche", nombre: "Crema de leche" },
  { id: "arroz", nombre: "Arroz" },
  { id: "panela", nombre: "Panela" },
  { id: "cebolla_cab", nombre: "Cebolla cabezona" },
  { id: "harina_maiz", nombre: "Harina de maíz precocida" },
  { id: "huevos", nombre: "Huevos" },
  { id: "pasta", nombre: "Pasta spaghetti" },
  { id: "papa", nombre: "Papa pastusa" },
];
const ids = (nombre: string) =>
  sugerirExistente(nombre, catalogo).map((p) => p.id);

describe("significativas", () => {
  it("quita tildes, vacías, tamaños y presentaciones, y pasa a singular", () => {
    expect(significativas("Leche Colanta 1000ml Entera B")).toEqual(
      expect.arrayContaining(["leche", "colanta", "entera"]),
    );
    expect(significativas("Panela El Trece 960g18und")).not.toContain("el");
    expect(significativas("Galleta Dux 250g9paq Regula")).not.toContain("paq");
    expect(significativas("Papas Fritas")).toEqual(["papa", "frita"]);
  });
});

describe("sugerirExistente: solo si están todas las palabras del producto del catálogo", () => {
  it("sugiere Panela, Arroz y Leche entera para sus líneas", () => {
    expect(ids("Panela El Trece 960g18und")).toEqual(["panela"]);
    expect(ids("Arroz Federal 2500g Alto Rend")).toEqual(["arroz"]);
    expect(ids("Leche Colanta 1000ml Entera B")[0]).toBe("leche");
  });

  it("el más específico va primero y se acepta más de uno", () => {
    expect(ids("Leche Colanta 1000ml Entera B")).toEqual([
      "leche",
      "leche_sola",
    ]);
  });

  it("no sugiere «Crema de leche» para una leche común", () => {
    expect(ids("Leche El Zarzal 900ml6und")).not.toContain("crema_leche");
    expect(ids("Leche El Zarzal 900ml6und")).toEqual(["leche_sola"]);
  });

  it("no sugiere un producto al que le falta una palabra", () => {
    expect(ids("Cebolla de huevo")).toEqual([]);
    expect(ids("Harina Pan 1000g Blanca")).toEqual([]);
    expect(ids("Pasta Comarico 250g Tornillo")).toEqual([]);
  });

  it("entiende el plural y el singular", () => {
    expect(ids("Huevo Avinal 30und*1800g AA/R")).toEqual(["huevos"]);
    expect(ids("Papas pastusas")).toEqual(["papa"]);
  });

  it("devuelve como máximo 3 y no muta la lista recibida", () => {
    const grande = Array.from({ length: 6 }, (_, i) => ({
      id: `l${i}`,
      nombre: "Leche",
    }));
    const copia = JSON.stringify(grande);
    expect(sugerirExistente("Leche entera", grande)).toHaveLength(3);
    expect(JSON.stringify(grande)).toBe(copia);
  });

  it("una línea sin coincidencias no sugiere nada", () => {
    expect(ids("Gustazo 220")).toEqual([]);
    expect(ids("")).toEqual([]);
  });
});
