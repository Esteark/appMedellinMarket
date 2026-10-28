import { describe, expect, it } from "vitest";
import {
  acumuladoPorRubro,
  compararPresupuestadoVsGastado,
  esperadoHastaHoy,
  porcentajeUsado,
  proyeccionFinMes,
  restante,
} from "@/lib/presupuesto/calculos";

describe("presupuesto/calculos", () => {
  it("acumula por rubro solo del mes", () => {
    const mapa = acumuladoPorRubro(
      [
        { id: "1", mes: "2026-10", rubro: "Carnes", monto: 100000 } as any,
        { id: "2", mes: "2026-09", rubro: "Carnes", monto: 50000 } as any,
        { id: "3", mes: "2026-10", rubro: "Granos", monto: 20000 } as any,
      ],
      "2026-10",
    );
    expect(mapa.get("Carnes")).toBe(100000);
    expect(mapa.get("Granos")).toBe(20000);
  });

  it("calcula porcentajes y restante", () => {
    expect(porcentajeUsado(50000, 100000)).toBe(50);
    expect(porcentajeUsado(0, 100000)).toBe(0);
    expect(restante(50000, 100000)).toBe(50000);
    expect(restante(150000, 100000)).toBe(0);
  });

  it("esperado hasta hoy proporcional", () => {
    expect(esperadoHastaHoy(310000, "2026-10-10", "2026-10")).toBe(100000);
    expect(esperadoHastaHoy(0, "2026-10-10", "2026-10")).toBe(0);
  });

  it("proyección a fin de mes", () => {
    expect(proyeccionFinMes(100000, 10, 31)).toBe(310000);
    expect(proyeccionFinMes(50000, 0, 31)).toBe(0);
  });

  it("resumen completo", () => {
    const { resumen } = compararPresupuestadoVsGastado(
      [
        { rubro: "Carnes", monto: 200000, orden: 0 },
        { rubro: "Granos", monto: 100000, orden: 1 },
      ],
      [
        { mes: "2026-10", rubro: "Carnes", monto: 80000 } as any,
        { mes: "2026-10", rubro: "Granos", monto: 40000 } as any,
      ],
      "2026-10-10",
      "2026-10",
    );
    expect(resumen.presupuestado).toBe(300000);
    expect(resumen.gastado).toBe(120000);
    expect(resumen.porcentajeUsado).toBe(40);
    expect(resumen.diasTranscurridos).toBe(10);
    expect(resumen.diasDelMes).toBe(31);
  });
});
