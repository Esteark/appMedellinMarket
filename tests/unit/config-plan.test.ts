import { describe, expect, it } from "vitest";
import {
  type ConfigPlan,
  configPlan,
  fusionarPlan,
  planSugerido,
} from "@/lib/planes/config";

const base = planSugerido("hogar", "2026-10-30T10:00:00-05:00");
const con = (c: Partial<ConfigPlan>) => ({ ...base, ...c });

describe("config del plan", () => {
  it("el plan sugerido es válido", () => {
    expect(configPlan.safeParse(base).success).toBe(true);
    expect(
      configPlan.safeParse(planSugerido("dieta", base.actualizada)).success,
    ).toBe(true);
  });

  it.each([
    ["personas 0", con({ personas: 0 })],
    ["personas 21", con({ personas: 21 })],
    ["nota de 1001", con({ nota: "x".repeat(1001) })],
    [
      "51 rubros",
      con({
        rubros: Object.fromEntries(
          Array.from({ length: 51 }, (_, i) => [`r${i}`, 1]),
        ),
      }),
    ],
    ["cantidad 1000", con({ items: { arroz: 1000 } })],
    [
      "51 propios",
      con({
        propios: Array.from({ length: 51 }, (_, i) => ({
          nombre: `p${i}`,
          precio: 1,
        })),
      }),
    ],
    ["versión 2", { ...base, version: 2 }],
  ])("rechaza %s", (_, c) => {
    expect(configPlan.safeParse(c).success).toBe(false);
  });

  it("fusionarPlan: gana la más reciente", () => {
    const vieja = con({
      personas: 3,
      actualizada: "2026-10-01T10:00:00-05:00",
    });
    const nueva = con({
      personas: 7,
      actualizada: "2026-10-02T10:00:00-05:00",
    });
    expect(fusionarPlan(vieja, nueva)?.config.personas).toBe(7);
    expect(fusionarPlan(nueva, vieja)).toMatchObject({ origen: "local" });
  });

  it("fusionarPlan: conserva el local si la nube viene vacía o corrupta", () => {
    expect(fusionarPlan(base, null)).toMatchObject({ origen: "local" });
    expect(fusionarPlan(base, { version: 9 })).toMatchObject({
      origen: "local",
    });
    expect(fusionarPlan(null, base)).toMatchObject({ origen: "nube" });
    expect(fusionarPlan(null, "basura")).toBeNull();
  });
});
