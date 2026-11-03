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
        { id: "1", mes: "2026-10", rubro: "Carnes", monto: 100000 } as never,
        { id: "2", mes: "2026-09", rubro: "Carnes", monto: 50000 } as never,
        { id: "3", mes: "2026-10", rubro: "Granos", monto: 20000 } as never,
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
    expect(proyeccionFinMes(50000, 0, 31)).toBeNull();
  });

  it("no proyecta con menos de 7 días: una compra grande del día 1 no se multiplica por 30", () => {
    expect(proyeccionFinMes(775114, 2, 30)).toBeNull();
    expect(proyeccionFinMes(775114, 6, 30)).toBeNull();
    expect(proyeccionFinMes(700000, 7, 30)).toBe(3000000);
  });

  it("resumen completo", () => {
    const { resumen } = compararPresupuestadoVsGastado(
      [
        { rubro: "Carnes", monto: 200000, orden: 0 },
        { rubro: "Granos", monto: 100000, orden: 1 },
      ],
      [
        { mes: "2026-10", rubro: "Carnes", monto: 80000 } as never,
        { mes: "2026-10", rubro: "Granos", monto: 40000 } as never,
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
