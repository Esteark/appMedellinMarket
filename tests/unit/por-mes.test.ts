import { beforeEach, describe, expect, it } from "vitest";
import {
  guardarPresupuestoMes,
  leerPresupuestoMes,
  leerPresupuestosAnteriores,
} from "@/lib/presupuesto/almacenamiento";
import {
  describirCambio,
  mesAnterior,
  presupuestoDelMes,
} from "@/lib/presupuesto/por-mes";

const r = (rubro: string, monto: number, orden = 0) => ({
  rubro,
  monto,
  orden,
});
const inicial = [r("Carnes", 0)];

describe("mesAnterior", () => {
  it("resta un mes y cruza el año", () => {
    expect(mesAnterior("2026-11")).toBe("2026-10");
    expect(mesAnterior("2026-01")).toBe("2025-12");
    expect(mesAnterior("2026-10")).toBe("2026-09");
  });
});

describe("presupuestoDelMes", () => {
  it("usa los montos del mes si ya los tiene", () => {
    const x = presupuestoDelMes({
      mes: "2026-11",
      delMes: [r("Carnes", 600000)],
      anteriores: { "2026-10": [r("Carnes", 500000)] },
      inicial,
    });
    expect(x).toMatchObject({ origen: "mes", rubros: [r("Carnes", 600000)] });
  });

  it("hereda del mes anterior más reciente con datos, saltando meses vacíos", () => {
    const x = presupuestoDelMes({
      mes: "2026-12",
      delMes: null,
      anteriores: { "2026-11": [], "2026-10": [r("Carnes", 500000)] },
      inicial,
    });
    expect(x).toMatchObject({ origen: "heredado", desde: "2026-10" });
    expect(x.rubros).toEqual([r("Carnes", 500000)]);
  });

  it("hereda cruzando de año", () => {
    const x = presupuestoDelMes({
      mes: "2026-02",
      delMes: undefined,
      anteriores: { "2025-12": [r("Aseo", 60000)] },
      inicial,
    });
    expect(x).toMatchObject({ origen: "heredado", desde: "2025-12" });
  });

  it("no mira más de 12 meses atrás", () => {
    const x = presupuestoDelMes({
      mes: "2026-11",
      delMes: null,
      anteriores: { "2025-10": [r("Carnes", 1)] },
      inicial,
    });
    expect(x.origen).toBe("inicial");
  });

  it("sin nada devuelve lo inicial", () => {
    const x = presupuestoDelMes({
      mes: "2026-11",
      delMes: null,
      anteriores: {},
      inicial,
    });
    expect(x).toMatchObject({ origen: "inicial", rubros: inicial });
  });

  it("no muta sus entradas y devuelve copias", () => {
    const anterior = [r("Carnes", 500000)];
    const antes = JSON.stringify(anterior);
    const x = presupuestoDelMes({
      mes: "2026-11",
      delMes: null,
      anteriores: { "2026-10": anterior },
      inicial,
    });
    x.rubros[0].monto = 1;
    expect(JSON.stringify(anterior)).toBe(antes);
  });
});

describe("describirCambio", () => {
  const f = (n: number) => `$${n}`;
  it("cubre cambio, nuevo y quitado", () => {
    expect(
      describirCambio(
        { rubro: "Carnes", monto_anterior: 5, monto_nuevo: 6 },
        f,
      ),
    ).toBe("Carnes: $5 → $6");
    expect(
      describirCambio(
        { rubro: "Carnes", monto_anterior: null, monto_nuevo: 6 },
        f,
      ),
    ).toBe("Carnes: nuevo $6");
    expect(
      describirCambio(
        { rubro: "Carnes", monto_anterior: 6, monto_nuevo: null },
        f,
      ),
    ).toBe("Carnes: quitado ($6)");
  });
});

describe("almacenamiento local por mes", () => {
  beforeEach(() => {
    const datos = new Map<string, string>();
    Object.defineProperty(globalThis, "window", {
      value: {},
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => datos.get(k) ?? null,
        setItem: (k: string, v: string) => void datos.set(k, v),
      },
    });
  });

  it("guarda y lee cada mes por separado", () => {
    guardarPresupuestoMes("2026-10", [r("Carnes", 500000)]);
    guardarPresupuestoMes("2026-11", [r("Carnes", 600000)]);
    expect(leerPresupuestoMes("2026-10")).toEqual([r("Carnes", 500000)]);
    expect(leerPresupuestoMes("2026-11")).toEqual([r("Carnes", 600000)]);
    expect(leerPresupuestoMes("2026-12")).toBeNull();
  });

  it("lista lo guardado de los 12 meses anteriores", () => {
    guardarPresupuestoMes("2026-10", [r("Carnes", 500000)]);
    const x = leerPresupuestosAnteriores("2026-11");
    expect(Object.keys(x)).toHaveLength(12);
    expect(x["2026-10"]).toEqual([r("Carnes", 500000)]);
    expect(x["2026-09"]).toBeNull();
  });
});
