import { describe, expect, it } from "vitest";
import { diasEntre, hoyBogota } from "@/lib/fecha";

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
