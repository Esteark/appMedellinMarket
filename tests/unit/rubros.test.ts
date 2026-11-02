import { describe, expect, it } from "vitest";
import { rubroDe } from "@/data/planes";
import { type ConfigPlan, configPlan, planSugerido } from "@/lib/planes/config";
import {
  agregarRubro,
  asignarGrupo,
  gastoPorRubro,
  moverRubro,
  quitarGrupo,
  quitarRubro,
  renombrarRubro,
  rubroDeProducto,
  rubrosOrdenados,
} from "@/lib/planes/rubros";

const base = planSugerido("hogar", "2026-11-02T10:00:00-05:00");

/** Aplica un resultado esperado como exitoso y devuelve el plan nuevo. */
function ok(r: { ok: boolean; config?: ConfigPlan; error?: string }) {
  if (!r.ok || !r.config) throw new Error(`falló: ${r.error}`);
  return r.config;
}

describe("agregarRubro", () => {
  it("lo agrega al final con su monto y sin grupos", () => {
    const c = ok(agregarRubro(base, "  Mascotas ", 50000));
    expect(c.rubros.Mascotas).toBe(50000);
    expect(rubrosOrdenados(c).at(-1)).toBe("Mascotas");
    expect(c.grupos?.Mascotas).toEqual([]);
  });

  it("rechaza repetido sin tildes ni mayúsculas, «Otros», vacío, largo y el rubro 51", () => {
    expect(agregarRubro(base, "CARNES")).toEqual({
      ok: false,
      error: "repetido",
    });
    expect(agregarRubro(base, "Lacteos")).toEqual({
      ok: false,
      error: "repetido",
    });
    expect(agregarRubro(base, "otros")).toEqual({
      ok: false,
      error: "reservado",
    });
    expect(agregarRubro(base, "   ")).toEqual({
      ok: false,
      error: "nombre_invalido",
    });
    expect(agregarRubro(base, "x".repeat(41))).toEqual({
      ok: false,
      error: "nombre_invalido",
    });
    let c = base;
    for (let i = Object.keys(c.rubros).length; i < 50; i++)
      c = ok(agregarRubro(c, `Rubro ${i}`));
    expect(Object.keys(c.rubros)).toHaveLength(50);
    expect(agregarRubro(c, "Uno más")).toEqual({ ok: false, error: "limite" });
  });

  it("un nombre de fábrica que se quitó vuelve sin los grupos de fábrica", () => {
    const sin = ok(quitarRubro(base, "Aseo"));
    const con = ok(agregarRubro(sin, "Aseo"));
    expect(rubroDeProducto(con, { id: "jabon", grupo: "Aseo" })).toBe("Otros");
  });
});

describe("renombrarRubro", () => {
  it("conserva monto, posición y grupos", () => {
    const c = ok(renombrarRubro(base, "Carnes", "Proteína"));
    expect(c.rubros.Proteína).toBe(base.rubros.Carnes);
    expect("Carnes" in c.rubros).toBe(false);
    expect(rubrosOrdenados(c).indexOf("Proteína")).toBe(
      rubrosOrdenados(base).indexOf("Carnes"),
    );
    expect(rubroDeProducto(c, { id: "pollo", grupo: "Proteínas" })).toBe(
      "Proteína",
    );
  });

  it("no renombra «Otros» ni acepta un nombre repetido o inexistente", () => {
    expect(renombrarRubro(base, "Otros", "Varios")).toEqual({
      ok: false,
      error: "reservado",
    });
    expect(renombrarRubro(base, "Carnes", "granos")).toEqual({
      ok: false,
      error: "repetido",
    });
    expect(renombrarRubro(base, "Nada", "Algo")).toEqual({
      ok: false,
      error: "no_existe",
    });
  });
});

describe("quitarRubro", () => {
  it("borra monto, posición y grupos, y sus productos pasan a «Otros»", () => {
    const c = ok(quitarRubro(base, "Carnes"));
    expect("Carnes" in c.rubros).toBe(false);
    expect(rubrosOrdenados(c)).not.toContain("Carnes");
    expect(rubroDeProducto(c, { id: "pollo", grupo: "Proteínas" })).toBe(
      "Otros",
    );
    expect(rubroDeProducto(c, { id: "huevos", grupo: "Lácteos" })).toBe(
      "Otros",
    );
  });

  it("no quita «Otros»", () => {
    expect(quitarRubro(base, "Otros")).toEqual({
      ok: false,
      error: "reservado",
    });
  });
});

describe("moverRubro", () => {
  it("cambia el orden y este sobrevive a un viaje por JSON", () => {
    const antes = rubrosOrdenados(base);
    const c = ok(moverRubro(base, antes[2], -1));
    const despues = rubrosOrdenados(c);
    expect(despues[1]).toBe(antes[2]);
    expect(despues[2]).toBe(antes[1]);
    // jsonb reordena las claves de `rubros`; el orden vive en `orden`.
    const viaje = JSON.parse(
      JSON.stringify({
        ...c,
        rubros: Object.fromEntries(Object.entries(c.rubros).sort()),
      }),
    ) as ConfigPlan;
    expect(rubrosOrdenados(viaje)).toEqual(despues);
  });

  it("en los extremos no cambia nada", () => {
    const orden = rubrosOrdenados(base);
    const primero = ok(moverRubro(base, orden[0], -1));
    expect(rubrosOrdenados(primero)).toEqual(orden);
    const ultimo = ok(moverRubro(base, orden[orden.length - 1], 1));
    expect(rubrosOrdenados(ultimo)).toEqual(orden);
  });
});

describe("asignarGrupo y rubroDeProducto", () => {
  it("un grupo pertenece a un solo rubro: asignarlo lo saca del anterior y lo dice", () => {
    const c0 = ok(agregarRubro(base, "Mascotas", 50000));
    const r = asignarGrupo(c0, "Mascotas", "Mecato");
    if (!r.ok) throw new Error("debía poder");
    expect(r.desde).toBe("Mecato");
    expect(rubroDeProducto(r.config, { id: "papas", grupo: "Mecato" })).toBe(
      "Mascotas",
    );
    // «Mecato» ya no cuenta ese grupo.
    expect(rubroDeProducto(r.config, { id: "galleta", grupo: "Mecato" })).toBe(
      "Mascotas",
    );
  });

  it("quitar un grupo lo manda a «Otros»", () => {
    const c = ok(quitarGrupo(base, "Verduras", "Tubérculos"));
    expect(rubroDeProducto(c, { id: "papa", grupo: "Tubérculos" })).toBe(
      "Otros",
    );
    expect(rubroDeProducto(c, { id: "tomate", grupo: "Verduras" })).toBe(
      "Verduras",
    );
  });

  it("no asigna a «Otros» ni a un rubro que no existe", () => {
    expect(asignarGrupo(base, "Otros", "Mecato")).toEqual({
      ok: false,
      error: "reservado",
    });
    expect(asignarGrupo(base, "Nada", "Mecato")).toEqual({
      ok: false,
      error: "no_existe",
    });
  });

  it("sin personalizar reparte igual que rubroDe, huevos incluidos", () => {
    const grupos = [
      "Proteínas",
      "Lácteos",
      "Verduras",
      "Tubérculos",
      "Frutas",
      "Granos",
      "Panadería",
      "Despensa",
      "Aseo",
      "Bebidas",
      "Mecato",
      "Gourmet",
      "Inventado",
    ];
    for (const grupo of grupos) {
      const p = { id: "x", grupo };
      expect(rubroDeProducto(base, p)).toBe(rubroDe(p));
    }
    const huevos = { id: "huevos", grupo: "Lácteos" };
    expect(rubroDeProducto(base, huevos)).toBe(rubroDe(huevos));
  });

  it("con dos rubros que cuentan el mismo grupo gana el primero en el orden", () => {
    const c = {
      ...base,
      grupos: { Carnes: ["Mecato"], Mecato: ["Mecato"] },
    } satisfies Partial<ConfigPlan> as ConfigPlan;
    expect(rubroDeProducto(c, { id: "x", grupo: "Mecato" })).toBe("Carnes");
  });
});

describe("esquema del plan", () => {
  it("un plan sin orden ni grupos sigue siendo válido", () => {
    expect(configPlan.safeParse(base).success).toBe(true);
  });

  it("unos campos dañados se descartan sin perder los rubros", () => {
    const r = configPlan.safeParse({
      ...base,
      orden: [1, 2, 3],
      grupos: { Carnes: "no es una lista" },
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.orden).toBeUndefined();
    expect(r.data.grupos).toBeUndefined();
    expect(r.data.rubros).toEqual(base.rubros);
  });
});

describe("pureza", () => {
  it("ninguna función muta su entrada", () => {
    const foto = JSON.stringify(base);
    agregarRubro(base, "Mascotas", 1000);
    renombrarRubro(base, "Carnes", "Proteína");
    quitarRubro(base, "Carnes");
    moverRubro(base, "Frutas", -1);
    asignarGrupo(base, "Carnes", "Mecato");
    quitarGrupo(base, "Verduras", "Verduras");
    expect(JSON.stringify(base)).toBe(foto);
  });
});

describe("gastoPorRubro", () => {
  const productos = [
    { id: "papas", grupo: "Mecato", precios: { d1: 5000, otra: 6000 } },
    { id: "pollo", grupo: "Proteínas", precios: { d1: 8000, otra: 7000 } },
    { id: "trufa", grupo: "Gourmet", precios: { d1: 20000, otra: null } },
    { id: "sin", grupo: "Frutas", precios: { d1: null, otra: null } },
  ];
  const lista = { papas: 2, pollo: 1, trufa: 1, sin: 3 };
  // Óptimo dividido ya calculado: cada producto en su tienda más barata (sin precio, ninguna).
  const tiendaDe = { papas: "d1", pollo: "otra", trufa: "d1" };

  it("sin personalizar reparte como siempre", () => {
    const g = gastoPorRubro(base, productos, lista, tiendaDe);
    expect(g.get("Mecato")).toBe(10000);
    expect(g.get("Carnes")).toBe(7000);
    expect(g.get("Otros")).toBe(20000);
    expect(g.has("Frutas")).toBe(false);
  });

  it("un rubro nuevo con el grupo Mecato recibe ese gasto y Mecato ya no", () => {
    const c0 = ok(agregarRubro(base, "Mascotas", 50000));
    const r = asignarGrupo(c0, "Mascotas", "Mecato");
    if (!r.ok) throw new Error("debía poder");
    const g = gastoPorRubro(r.config, productos, lista, tiendaDe);
    expect(g.get("Mascotas")).toBe(10000);
    expect(g.has("Mecato")).toBe(false);
  });

  it("lo que ningún rubro cuenta va a «Otros»", () => {
    const c = ok(quitarRubro(base, "Carnes"));
    const g = gastoPorRubro(c, productos, lista, tiendaDe);
    expect(g.has("Carnes")).toBe(false);
    expect(g.get("Otros")).toBe(27000);
  });

  it("la suma repartida es la misma sin importar los rubros", () => {
    const suma = (m: Map<string, number>) =>
      [...m.values()].reduce((a, b) => a + b, 0);
    const c = ok(quitarRubro(base, "Carnes"));
    expect(suma(gastoPorRubro(c, productos, lista, tiendaDe))).toBe(
      suma(gastoPorRubro(base, productos, lista, tiendaDe)),
    );
  });
});
