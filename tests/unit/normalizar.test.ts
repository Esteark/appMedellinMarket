import { describe, expect, it } from "vitest";
import { normalizar } from "@/corrida/normalizar";

describe("normalizar", () => {
  it("misma presentación: precio tal cual", () => {
    expect(
      normalizar(
        8900,
        { unidad_base: "ml", cantidad_base: 1000 },
        { unidad_base: "ml", cantidad_base: 1000 },
      ),
    ).toBe(8900);
  });
  it("con conversión redondea a la centena", () => {
    // 1990 por 500 g → 1 kg = 3980 → 4000
    expect(
      normalizar(
        1990,
        { unidad_base: "g", cantidad_base: 1000 },
        { unidad_base: "g", cantidad_base: 500 },
      ),
    ).toBe(4000);
  });
  it("null si la unidad es distinta", () => {
    expect(
      normalizar(
        1990,
        { unidad_base: "g", cantidad_base: 1000 },
        { unidad_base: "ml", cantidad_base: 1000 },
      ),
    ).toBeNull();
    expect(
      normalizar(
        1990,
        { unidad_base: "u", cantidad_base: 1 },
        { unidad_base: "g", cantidad_base: 500 },
      ),
    ).toBeNull();
  });
});
