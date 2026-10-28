import { describe, expect, it } from "vitest";
import { generarAprendizajes } from "@/lib/presupuesto/aprendizajes";

describe("presupuesto/aprendizajes", () => {
  it("genera logros y situaciones con datos reales", () => {
    const aprendizajes = generarAprendizajes(
      {
        mes: "2026-10",
        presupuestado: 1000000,
        gastado: 400000,
        restante: 600000,
        porcentajeUsado: 40,
        proyeccionFinMes: 1240000,
        diasTranscurridos: 10,
        diasDelMes: 31,
      },
      [
        {
          rubro: "Carnes",
          presupuestado: 400000,
          gastado: 200000,
          esperadoHastaHoy: 129032,
          proyeccion: 620000,
          porcentajeUsado: 50,
          desfasePct: 55,
          estado: "desfasado",
        },
      ],
    );
    expect(aprendizajes.length).toBeGreaterThan(0);
    const tipos = aprendizajes.map((a) => a.tipo);
    expect(tipos.includes("situacion") || tipos.includes("oportunidad")).toBe(
      true,
    );
  });

  it("genera logro si va por debajo", () => {
    const aprendizajes = generarAprendizajes(
      {
        mes: "2026-10",
        presupuestado: 1000000,
        gastado: 200000,
        restante: 800000,
        porcentajeUsado: 20,
        proyeccionFinMes: 620000,
        diasTranscurridos: 10,
        diasDelMes: 31,
      },
      [],
    );
    expect(aprendizajes.some((a) => a.tipo === "logro")).toBe(true);
  });
});
