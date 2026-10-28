import { describe, expect, it } from "vitest";
import { calcularDesfases, mensajeDesfase } from "@/lib/presupuesto/desfases";

describe("presupuesto/desfases", () => {
  it("marca desfasado cuando va por encima del esperado", () => {
    const filas = calcularDesfases(
      [{ rubro: "Carnes", presupuestado: 310000, gastado: 150000 }],
      "2026-10-10",
      "2026-10",
    );
    expect(filas[0].estado).toBe("desfasado");
    expect(filas[0].esperadoHastaHoy).toBe(100000);
    expect(filas[0].desfasePct).toBeGreaterThan(0);
  });

  it("marca ahorrando cuando va por debajo", () => {
    const filas = calcularDesfases(
      [{ rubro: "Aseo", presupuestado: 31000, gastado: 5000 }],
      "2026-10-10",
      "2026-10",
    );
    expect(filas[0].estado).toBe("ahorrando");
  });

  it("genera mensaje", () => {
    const filas = calcularDesfases(
      [{ rubro: "Carnes", presupuestado: 310000, gastado: 150000 }],
      "2026-10-10",
      "2026-10",
    );
    const msg = mensajeDesfase(filas[0]);
    expect(msg.length > 0).toBe(true);
    expect(msg).toMatch(/Desfasado|ritmo|proyección/i);
  });
});
