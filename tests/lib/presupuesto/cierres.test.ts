import { describe, expect, it } from "vitest";
import { generarSnapshotCierre } from "@/lib/presupuesto/cierres";

describe("generarSnapshotCierre", () => {
  it("calcula snapshot con solo datos reales", () => {
    const snap = generarSnapshotCierre(
      "2026-10",
      [
        { rubro: "Carnes", monto: 400000, orden: 0 },
        { rubro: "Granos", monto: 250000, orden: 1 },
      ],
      [
        {
          id: "1",
          user_id: "u",
          fecha: "2026-10-05",
          mes: "2026-10",
          rubro: "Carnes",
          monto: 150000,
          tienda_id: null,
          producto_id: null,
          origen: "manual",
          nota: null,
          created_at: "2026-10-05T00:00:00Z",
        },
        {
          id: "2",
          user_id: "u",
          fecha: "2026-09-10",
          mes: "2026-09",
          rubro: "Carnes",
          monto: 50000,
          tienda_id: null,
          producto_id: null,
          origen: "manual",
          nota: null,
          created_at: "2026-09-10T00:00:00Z",
        },
      ],
    );
    expect(snap.mes).toBe("2026-10");
    expect(snap.total_presupuestado).toBe(650000);
    expect(snap.total_gastado).toBe(150000);
    expect(snap.ahorro).toBe(500000);
    expect(
      snap.por_rubro.find((r) => r.rubro === "Carnes")?.porcentajeUsado,
    ).toBe(38);
  });
});
