import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  type CatalogoEmparejar,
  emparejarProducto,
  emparejarTienda,
  normalizarNombre,
} from "@/lib/importar/emparejar";
import { PROMPT_FACTURA } from "@/lib/importar/prompt";
import { grupoARubro } from "@/lib/presupuesto/rubros";

const catalogo: CatalogoEmparejar = {
  productos: [
    { id: "p-leche", nombre: "Leche 1 L" },
    { id: "p-cafe", nombre: "Café molido" },
  ],
  aliasProducto: [
    { aliasNorm: "leche entera", tiendaId: "d1", productoId: "p-alias-d1" },
    { aliasNorm: "leche entera", tiendaId: null, productoId: "p-alias-global" },
  ],
  codigos: { "7702001234567": "p-codigo" },
};

describe("emparejarProducto", () => {
  it("el código de barras gana sobre el alias y el nombre", () => {
    const entrada = {
      producto: "Leche entera",
      tiendaId: "d1",
      codigo: "7702001234567",
    };
    expect(emparejarProducto(entrada, catalogo)).toBe("p-codigo");
  });

  it("alias de la tienda, luego alias global, luego nombre", () => {
    expect(
      emparejarProducto({ producto: "Leche entera", tiendaId: "d1" }, catalogo),
    ).toBe("p-alias-d1");
    expect(
      emparejarProducto(
        { producto: "Leche entera", tiendaId: "barrio" },
        catalogo,
      ),
    ).toBe("p-alias-global");
    expect(
      emparejarProducto({ producto: "Leche 1 L", tiendaId: "d1" }, catalogo),
    ).toBe("p-leche");
  });

  it("con y sin tilde o mayúsculas es el mismo producto", () => {
    expect(
      emparejarProducto({ producto: "CAFE  molido", tiendaId: null }, catalogo),
    ).toBe("p-cafe");
    expect(
      emparejarProducto({ producto: "Café Molido", tiendaId: null }, catalogo),
    ).toBe("p-cafe");
  });

  it("una presentación distinta es otro producto", () => {
    expect(
      emparejarProducto({ producto: "Leche 1.1 L", tiendaId: "d1" }, catalogo),
    ).toBeNull();
  });
});

describe("emparejarTienda y normalizarNombre", () => {
  const tiendas = {
    tiendas: [{ id: "olimpica", nombre: "Olímpica" }],
    alias: { "olimpica sa": "olimpica" },
  };

  it("normaliza igual que SQL", () => {
    expect(normalizarNombre("  Ñandú   ÁÉÍ ")).toBe("nandu aei");
  });

  it("empareja por alias y por nombre normalizado", () => {
    expect(emparejarTienda("OLIMPICA", tiendas)).toBe("olimpica");
    expect(emparejarTienda("Olímpica SA", tiendas)).toBe("olimpica");
    expect(emparejarTienda("Exito", tiendas)).toBeNull();
  });
});

describe("grupoARubro", () => {
  it("mapea los grupos que antes caían en Otros", () => {
    expect(grupoARubro("Proteínas")).toBe("Carnes");
    expect(grupoARubro("Tubérculos")).toBe("Verduras");
    expect(grupoARubro("Gourmet")).toBe("Despensa");
  });

  it("mapea el resto por nombre y deja Otros solo sin coincidencia", () => {
    for (const grupo of [
      "Granos",
      "Frutas",
      "Lácteos",
      "Panadería",
      "Despensa",
      "Aseo",
      "Bebidas",
      "Mecato",
      "Verduras",
    ])
      expect(grupoARubro(grupo)).toBe(grupo);
    expect(grupoARubro("Mascotas")).toBe("Otros");
  });
});

describe("PROMPT_FACTURA", () => {
  it("está contenido en prompts/importar-gastos.md", () => {
    const md = readFileSync(
      "blueprints/mercado-medellin/prompts/importar-gastos.md",
      "utf-8",
    ).replace(/\r\n/g, "\n");
    expect(md).toContain(PROMPT_FACTURA);
  });
});
