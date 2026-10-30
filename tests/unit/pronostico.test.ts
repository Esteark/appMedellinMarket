import { describe, expect, it } from "vitest";
import { restarDias } from "@/lib/fecha";
import {
  type Contexto,
  type Punto,
  pronosticar,
} from "@/lib/precios/pronostico";

const HOY = "2026-10-30";
const CTX: Contexto = { clima: 0, ipcMensual: 0.5, contextoDias: 20 };

/** `n` días terminando hoy; el precio del día i (0 = el más viejo) sale de `f`. */
const serie = (n: number, f: (i: number) => number): Punto[] =>
  Array.from({ length: n }, (_, i) => ({
    fecha: restarDias(HOY, n - 1 - i),
    precio: Math.round(f(i)),
  }));
const ruido = (i: number) => (i % 2 ? 0.004 : -0.004);

describe("pronosticar", () => {
  it("una serie que sube da «sube»", () => {
    const r = pronosticar(
      serie(40, (i) => 1000 * 1.012 ** i),
      CTX,
      HOY,
    );
    expect(r?.direccion).toBe("sube");
  });

  it("una serie que baja da «baja»", () => {
    const r = pronosticar(
      serie(40, (i) => 2000 * 0.988 ** i),
      CTX,
      HOY,
    );
    expect(r?.direccion).toBe("baja");
  });

  it("una plana con ruido da «estable» y el rango contiene el último precio", () => {
    const s = serie(50, (i) => 3000 * (1 + ruido(i)));
    const r = pronosticar(s, CTX, HOY);
    expect(r?.direccion).toBe("estable");
    expect(r?.rango.min).toBeLessThanOrEqual(r?.ultimo ?? 0);
    expect(r?.rango.max).toBeGreaterThanOrEqual(r?.ultimo ?? 0);
  });

  it("con 7 puntos no hay pronóstico", () => {
    expect(
      pronosticar(
        serie(7, () => 1000),
        CTX,
        HOY,
      ),
    ).toBeNull();
    expect(
      pronosticar(
        serie(8, () => 1000),
        CTX,
        HOY,
      ),
    ).not.toBeNull();
  });

  it("los puntos de hace más de 60 días no cuentan", () => {
    const viejos = serie(20, () => 1000).map((p) => ({
      ...p,
      fecha: restarDias(p.fecha, 100),
    }));
    expect(pronosticar(viejos, CTX, HOY)).toBeNull();
  });

  it("sin contexto la confianza no pasa de «media» y lo dice", () => {
    const s = serie(60, (i) => 3000 * (1 + ruido(i) / 4));
    expect(pronosticar(s, CTX, HOY)?.confianza).toBe("alta");
    for (const sin of [
      { ...CTX, ipcMensual: null, contextoDias: null },
      { ...CTX, contextoDias: 46 },
    ]) {
      const r = pronosticar(s, sin, HOY);
      expect(r?.confianza).toBe("media");
      expect(r?.motivos).toContain("sin_contexto");
    }
  });

  it("la probabilidad queda en [34, 92] y los motivos nunca pasan de 3", () => {
    const extremos = [
      serie(60, (i) => 1000 * 1.05 ** i),
      serie(60, (i) => 5000 * 0.95 ** i),
      serie(30, (i) => 3000 * (1 + ruido(i) * 20)),
    ];
    for (const s of extremos) {
      const r = pronosticar(
        s,
        { clima: 3, ipcMensual: 2, contextoDias: 10 },
        HOY,
      );
      expect(r?.probabilidad).toBeGreaterThanOrEqual(34);
      expect(r?.probabilidad).toBeLessThanOrEqual(92);
      expect(r?.motivos.length).toBeLessThanOrEqual(3);
      expect(r?.puntos).toHaveLength(7);
    }
  });

  it("el clima agranda el movimiento esperado y se anota como motivo", () => {
    const s = serie(40, (i) => 1000 * 1.01 ** i);
    const sin = pronosticar(s, CTX, HOY);
    const con = pronosticar(s, { ...CTX, clima: 2 }, HOY);
    expect(con?.motivos).toContain("clima");
    expect(con?.puntos[6]).toBeGreaterThanOrEqual(sin?.puntos[6] ?? 0);
  });

  it("una corrección de hoy es un punto más: por sí sola no cambia el signo", () => {
    const base = serie(40, (i) => 3000 * (1 + ruido(i)));
    const con = [...base.slice(0, -1), { ...base[39], precio: 2900 }];
    expect(pronosticar(con, CTX, HOY)?.direccion).toBe("estable");
  });
});
