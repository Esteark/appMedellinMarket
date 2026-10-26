import { describe, expect, it } from "vitest";
import { cuando, diasEntre, hoyBogota } from "@/lib/fecha";

describe("fecha", () => {
  it("hoyBogota usa la zona de Bogotá (UTC−5), no UTC", () => {
    // 03:00 UTC del 27 = 22:00 del 26 en Bogotá
    expect(hoyBogota(new Date("2026-10-27T03:00:00Z"))).toBe("2026-10-26");
    expect(hoyBogota(new Date("2026-10-27T05:00:00Z"))).toBe("2026-10-27");
  });
  it("diasEntre", () => {
    expect(diasEntre("2026-10-22", "2026-10-26")).toBe(4);
    expect(diasEntre("2026-10-26", "2026-10-22")).toBe(-4);
    expect(diasEntre("2026-09-30", "2026-10-01")).toBe(1);
  });
});

describe("cuando", () => {
  // 11:06 UTC = 6:06 a. m. en Bogotá. Solo se afirma el prefijo: el formato de hora es del runtime.
  const corrida = "2026-10-22T11:06:00Z";
  it("hoy y ayer según el día en Bogotá, no en UTC", () => {
    expect(cuando(corrida, new Date("2026-10-23T04:00:00Z"))).toMatch(/^hoy /);
    expect(cuando(corrida, new Date("2026-10-23T06:00:00Z"))).toMatch(/^ayer /);
  });
  it("más atrás muestra la fecha", () => {
    expect(cuando(corrida, new Date("2026-10-26T12:00:00Z"))).not.toMatch(
      /^(hoy|ayer) /,
    );
  });
});
