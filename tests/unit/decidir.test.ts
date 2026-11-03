import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { leerCsv } from "@/lib/importar/csv";
import {
  aplicarModo,
  conVistaPrevia,
  cumpleFiltro,
  decidir,
  estaCompleta,
  faltantesDe,
  jefasDe,
  lineasJuntas,
} from "@/lib/importar/decidir";
import { aPayload, aRevision } from "@/lib/importar/factura";

const csv = leerCsv(
  readFileSync("tests/importar/factura-larga.csv", "utf-8"),
).filas;
const catalogo = [{ id: "coco", nombre: "Coco", grupo: "Frutas", unidad: "u" }];
const filas = csv.map((f) => aRevision(f, catalogo));
const de = (producto: string) => {
  const i = filas.findIndex((f) => f.producto === producto);
  if (i < 0) throw new Error(`no está: ${producto}`);
  return i;
};
const LECHE = "Leche Colanta 1000ml Entera B";

describe("aRevision con la factura real", () => {
  it("propone la decisión de cada línea: existe, crear o solo gasto", () => {
    expect(filas[de("Coco")]).toMatchObject({
      modo: "existente",
      productoId: "coco",
      nuevo: false,
    });
    expect(filas[de(LECHE)]).toMatchObject({ modo: "crear", nuevo: true });
    expect(filas[de("Bolsa Recicla")]).toMatchObject({
      modo: "solo_gasto",
      publicarPrecio: false,
      nuevo: false,
    });
    expect(filas.filter((f) => f.modo === "solo_gasto")).toHaveLength(1);
    expect(filas.filter((f) => f.modo === "existente")).toHaveLength(1);
  });

  it("los productos nuevos traen ícono, grupo y unidad propuestos; lo que existe no", () => {
    expect(filas[de(LECHE)]).toMatchObject({
      emoji: "🥛",
      grupo: "Lácteos",
      unidad: "l",
      cantidadBase: 1,
      rubro: "Lácteos",
    });
    expect(filas[de("C/Cerdo Pierna Trasera")]).toMatchObject({
      unidad: "kg",
      grupo: "Proteínas",
      rubro: "Carnes",
    });
    expect(filas[de("Coco")].emoji).toBeNull();
  });

  it("ninguna línea nace sin decisión ni como manual", () => {
    for (const f of filas) {
      expect(["existente", "crear", "solo_gasto"]).toContain(f.modo);
      expect(f.modoManual).toBe(false);
    }
  });
});

describe("aplicarModo", () => {
  it("existente liga el producto elegido y toma su grupo y unidad", () => {
    const f = aplicarModo(filas[de(LECHE)], "existente", {
      id: "leche",
      grupo: "Lácteos",
      unidad: "l",
    });
    expect(f).toMatchObject({
      modo: "existente",
      modoManual: true,
      productoId: "leche",
      nuevo: false,
      publicarPrecio: true,
      emoji: null,
      unidad: "l",
    });
  });

  it("existente sin producto no cambia nada", () => {
    const f = filas[de("Coco")];
    expect(aplicarModo(f, "existente")).toEqual(f);
  });

  it("solo gasto no crea producto ni publica precio", () => {
    const f = aplicarModo(filas[de(LECHE)], "solo_gasto");
    expect(f).toMatchObject({
      modo: "solo_gasto",
      productoId: null,
      nuevo: false,
      publicarPrecio: false,
    });
  });

  it("de solo gasto a crear vuelve a proponer la ficha desde el nombre", () => {
    const bolsa = aplicarModo(filas[de("Bolsa Recicla")], "crear");
    expect(bolsa).toMatchObject({
      modo: "crear",
      nuevo: true,
      publicarPrecio: true,
      modoManual: true,
    });
    const arroz = aplicarModo(
      aplicarModo(filas[de("Arroz Federal 2500g Alto Rend")], "solo_gasto"),
      "crear",
    );
    expect(arroz).toMatchObject({
      emoji: "🍚",
      grupo: "Granos",
      unidad: "g",
      cantidadBase: 2500,
    });
  });

  it("no muta la línea recibida", () => {
    const f = filas[de("Coco")];
    const antes = JSON.stringify(f);
    aplicarModo(f, "solo_gasto");
    expect(JSON.stringify(f)).toBe(antes);
  });
});

describe("líneas repetidas", () => {
  it("las 7 líneas repetidas se juntan por producto, tienda y fecha: 52 grupos", () => {
    const grupos = lineasJuntas(filas);
    expect(grupos).toHaveLength(52);
    expect(grupos.filter((g) => g.length > 1)).toHaveLength(7);
  });

  it("una decisión sobre una línea alcanza a las que se repiten con ella y a ninguna más", () => {
    const despues = decidir(filas, de("Harina Pan 1000g Blanca"), "solo_gasto");
    const harinas = despues.filter(
      (f) => f.producto === "Harina Pan 1000g Blanca",
    );
    expect(harinas).toHaveLength(2);
    for (const h of harinas) expect(h.modo).toBe("solo_gasto");
    expect(despues.filter((f) => f.modo === "solo_gasto")).toHaveLength(3);
    expect(despues.filter((f) => f.modo === "crear")).toHaveLength(
      filas.filter((f) => f.modo === "crear").length - 2,
    );
  });

  it("dos líneas del mismo producto en tiendas distintas no se juntan", () => {
    const dos = [
      { ...filas[de("Coco")], tienda: "A" },
      { ...filas[de("Coco")], tienda: "B" },
    ];
    expect(lineasJuntas(dos)).toEqual([[0], [1]]);
  });
});

describe("aPayload", () => {
  const payload = aPayload(filas);

  it("lleva una línea por gasto, también las repetidas", () => {
    expect(payload).toHaveLength(59);
  });

  it("un producto nuevo manda su ficha: ícono, grupo, unidad y tamaño", () => {
    const p = payload[de("Arroz Federal 2500g Alto Rend")];
    expect(p).toMatchObject({
      emoji: "🍚",
      grupo: "Granos",
      unidad: "g",
      cantidad_base: 2500,
      publicar_precio: true,
    });
    expect(p).not.toHaveProperty("producto_id");
  });

  it("un producto existente manda cuál es, y no manda ficha", () => {
    const p = payload[de("Coco")];
    expect(p).toMatchObject({ producto_id: "coco", publicar_precio: true });
    expect(p).not.toHaveProperty("grupo");
    expect(p).not.toHaveProperty("emoji");
  });

  it("solo gasto no publica precio y no manda ficha", () => {
    const p = payload[de("Bolsa Recicla")];
    expect(p).toMatchObject({ publicar_precio: false });
    expect(p).not.toHaveProperty("producto_id");
    expect(p).not.toHaveProperty("emoji");
  });

  it("redondea el precio", () => {
    const [p] = aPayload([{ ...filas[0], precioTotal: 12500.4 }]);
    expect(p.precio_total).toBe(12500);
  });
});

describe("conVistaPrevia", () => {
  const vista = (cambio: object) => ({
    tienda_id: "t1",
    producto_id: null as string | null,
    producto_nuevo: true,
    grupo: "Otros",
    ...cambio,
  });
  const conocido = {
    producto_id: "leche",
    producto_nuevo: false,
    grupo: "Lácteos",
  };

  it("si el servidor reconoce el producto, la línea pasa a existente", () => {
    const f = conVistaPrevia(filas[de(LECHE)], vista(conocido));
    expect(f).toMatchObject({
      modo: "existente",
      productoId: "leche",
      nuevo: false,
      tiendaId: "t1",
      rubro: "Lácteos",
    });
  });

  it("lo que la persona decidió a mano no se toca", () => {
    const decidida = aplicarModo(filas[de(LECHE)], "solo_gasto");
    const f = conVistaPrevia(decidida, vista(conocido));
    expect(f).toMatchObject({
      modo: "solo_gasto",
      productoId: null,
      tiendaId: "t1",
    });
  });

  it("si el cliente creía que existía y el servidor no la conoce, vuelve a proponerla", () => {
    const f = conVistaPrevia(filas[de("Coco")], vista({}));
    expect(f).toMatchObject({
      modo: "crear",
      nuevo: true,
      modoManual: false,
      tiendaId: "t1",
    });
  });

  it("una línea nueva que el servidor tampoco conoce solo recibe su tienda", () => {
    const antes = filas[de(LECHE)];
    expect(conVistaPrevia(antes, vista({}))).toEqual({
      ...antes,
      tiendaId: "t1",
    });
  });
});

describe("filtros y repetidas", () => {
  it("cada filtro cuenta lo que dice", () => {
    const n = (x: Parameters<typeof cumpleFiltro>[1]) =>
      filas.filter((f) => cumpleFiltro(f, x)).length;
    expect(n("todas")).toBe(59);
    expect(n("existente")).toBe(1);
    expect(n("solo_gasto")).toBe(1);
    expect(n("crear")).toBe(57);
  });

  it("por revisar incluye las incompletas y las que traen duda", () => {
    const sinPrecio = { ...filas[0], precioTotal: 0 };
    expect(estaCompleta(sinPrecio)).toBe(false);
    expect(faltantesDe(sinPrecio)).toEqual(["precio"]);
    expect(cumpleFiltro(sinPrecio, "revisar")).toBe(true);
    expect(cumpleFiltro({ ...filas[0], duda: "¿?" }, "revisar")).toBe(true);
    expect(cumpleFiltro(filas[0], "revisar")).toBe(false);
  });

  it("jefasDe apunta cada repetida a su primera línea", () => {
    const j = jefasDe(filas);
    expect(j.size).toBe(7);
    for (const [i, primera] of j) expect(primera).toBeLessThan(i);
  });
});
