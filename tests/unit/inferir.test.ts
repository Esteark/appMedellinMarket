import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leerCsv } from "@/lib/importar/csv";
import { normalizarNombre } from "@/lib/importar/emparejar";
import { inferirProducto } from "@/lib/importar/inferir";

const factura = leerCsv(
  readFileSync("tests/importar/factura-larga.csv", "utf-8"),
);
const filas = factura.filas;
const distintos = new Map(filas.map((f) => [normalizarNombre(f.producto), f]));
const de = (producto: string) => {
  const f = filas.find((x) => x.producto === producto);
  if (!f) throw new Error(`no está en la factura: ${producto}`);
  return inferirProducto(f.producto, f.cantidad);
};

describe("la factura de prueba", () => {
  it("se lee completa: 59 líneas, 52 productos distintos, sin errores", () => {
    expect(factura.errores).toEqual([]);
    expect(filas).toHaveLength(59);
    expect(distintos.size).toBe(52);
  });
});

describe("inferirProducto: unidad y tamaño", () => {
  it("una cantidad con decimales es peso: kg", () => {
    const porPeso = filas.filter((f) => f.cantidad % 1 !== 0);
    expect(porPeso.length).toBeGreaterThanOrEqual(8);
    for (const f of porPeso)
      expect(inferirProducto(f.producto, f.cantidad)).toMatchObject({
        unidad: "kg",
        cantidadBase: 1,
      });
  });

  it("el tamaño del nombre sale de la medida: 2500g → g 2500; 1000g → kg 1", () => {
    expect(de("Arroz Federal 2500g Alto Rend")).toMatchObject({
      unidad: "g",
      cantidadBase: 2500,
    });
    expect(de("Harina Pan 1000g Blanca")).toMatchObject({
      unidad: "kg",
      cantidadBase: 1,
    });
    expect(de("Leche Colanta 1000ml Entera B")).toMatchObject({
      unidad: "l",
      cantidadBase: 1,
    });
  });

  it("un nombre sin medida legible es una unidad", () => {
    expect(de("Coco")).toMatchObject({ unidad: "u", cantidadBase: 1 });
    // «900ml6und» es un paquete de 6: no se parte, se cuenta como una unidad.
    expect(de("Leche El Zarzal 900ml6und")).toMatchObject({
      unidad: "u",
      cantidadBase: 1,
    });
  });
});

describe("inferirProducto: ícono y grupo", () => {
  it("reconoce las palabras de uso común con su grupo del catálogo", () => {
    expect(de("Leche Colanta 1000ml Entera B")).toMatchObject({
      emoji: "🥛",
      grupo: "Lácteos",
    });
    expect(de("C/Cerdo Pierna Trasera")).toMatchObject({ grupo: "Proteínas" });
    expect(de("Pechuga Campesina Refrig")).toMatchObject({
      emoji: "🍗",
      grupo: "Proteínas",
    });
    expect(de("Arroz Federal 2500g Alto Rend")).toMatchObject({
      emoji: "🍚",
      grupo: "Granos",
    });
    expect(de("Panela El Trece 960g18und")).toMatchObject({
      emoji: "🍯",
      grupo: "Despensa",
    });
    expect(de("Det Fab 1000g Ultra")).toMatchObject({ grupo: "Aseo" });
    expect(de("Cebolla de huevo")).toMatchObject({
      emoji: "🧅",
      grupo: "Verduras",
    });
    expect(de("Coco")).toMatchObject({ emoji: "🥥", grupo: "Frutas" });
  });

  it("una palabra con prioridad gana: papas fritas son mecato, no tubérculo", () => {
    expect(inferirProducto("Papas Fritas Margarita", 1)).toMatchObject({
      grupo: "Mecato",
      emoji: "🍟",
    });
    expect(inferirProducto("Papa pastusa", 1)).toMatchObject({
      grupo: "Tubérculos",
    });
    expect(inferirProducto("Ajo Granulado", 2)).toMatchObject({
      grupo: "Despensa",
    });
    expect(inferirProducto("Ajo", 1)).toMatchObject({ grupo: "Verduras" });
  });

  it("entiende el singular y el plural", () => {
    expect(inferirProducto("Galletas", 1).grupo).toBe("Mecato");
    expect(inferirProducto("Galleta", 1).grupo).toBe("Mecato");
  });

  it("lo que no reconoce queda sin ícono y en «Otros»: no inventa", () => {
    expect(inferirProducto("Gustazo 220", 4)).toMatchObject({
      emoji: null,
      grupo: "Otros",
    });
    expect(inferirProducto("Xyzw Qwerty", 1)).toMatchObject({
      emoji: null,
      grupo: "Otros",
    });
  });

  it("propone ícono y grupo para al menos 45 de los 52 productos distintos", () => {
    const con = [...distintos.values()].filter((f) => {
      const i = inferirProducto(f.producto, f.cantidad);
      return i.emoji !== null && i.grupo !== "Otros";
    });
    expect(con.length).toBeGreaterThanOrEqual(45);
    // Los que no reconoce quedan completos: sin ícono y en «Otros», nunca a medias.
    for (const f of distintos.values()) {
      const i = inferirProducto(f.producto, f.cantidad);
      expect(i.emoji === null).toBe(i.grupo === "Otros");
    }
  });
});

describe("inferirProducto: lo que no es un producto", () => {
  it("marca la bolsa de reciclaje y ninguna otra línea de la factura", () => {
    const no = filas.filter(
      (f) => inferirProducto(f.producto, f.cantidad).noEsProducto,
    );
    expect(no.map((f) => f.producto)).toEqual(["Bolsa Recicla"]);
  });

  it("domicilio, propina y descuento tampoco son productos; una bolsa de basura sí", () => {
    for (const n of [
      "Domicilio",
      "Propina voluntaria",
      "Descuento especial",
      "Cargo por envío",
    ])
      expect(inferirProducto(n, 1).noEsProducto).toBe(true);
    expect(inferirProducto("Bolsas de basura x30", 1).noEsProducto).toBe(false);
  });
});
