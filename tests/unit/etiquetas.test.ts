import { describe, expect, it } from "vitest";
import {
  climaReciente,
  desactualizado,
  enFluctuacion,
  etiquetas,
  tendencia,
} from "@/lib/precios/etiquetas";

const previos = [100, 100, 100, 100, 100, 100, 100];

describe("tendencia ↑/↓ en el borde exacto de ±15 %", () => {
  it("+15 % exacto es sube; justo debajo no", () => {
    expect(tendencia(115, previos)).toBe("sube");
    expect(tendencia(114, previos)).toBeNull();
  });
  it("−15 % exacto es baja; justo encima no", () => {
    expect(tendencia(85, previos)).toBe("baja");
    expect(tendencia(86, previos)).toBeNull();
  });
  it("sin previos no hay tendencia", () => {
    expect(tendencia(500, [])).toBeNull();
  });
});

describe("desactualizado", () => {
  const hoy = "2026-10-26";
  it("diaria: más de 4 días", () => {
    expect(desactualizado("2026-10-22", hoy, "diaria")).toBe(false); // 4 días
    expect(desactualizado("2026-10-21", hoy, "diaria")).toBe(true); // 5 días
  });
  it("semanal: más de 10 días", () => {
    expect(desactualizado("2026-10-16", hoy, "semanal")).toBe(false); // 10 días
    expect(desactualizado("2026-10-15", hoy, "semanal")).toBe(true); // 11 días
  });
});

describe("clima y fluctuación", () => {
  const hoy = "2026-10-26";
  it("clima solo si es_clima y en los últimos 7 días", () => {
    expect(climaReciente([{ fecha: "2026-10-19", es_clima: true }], hoy)).toBe(
      true,
    );
    expect(climaReciente([{ fecha: "2026-10-18", es_clima: true }], hoy)).toBe(
      false,
    );
    expect(climaReciente([{ fecha: "2026-10-25", es_clima: false }], hoy)).toBe(
      false,
    );
  });
  it("cambio ≥15 % en 7 días", () => {
    const serie = [
      { fecha: "2026-10-20", precio: 1000 },
      { fecha: "2026-10-26", precio: 1150 },
    ];
    expect(enFluctuacion(serie, hoy)).toBe(true);
  });
  it("precio estable no fluctúa", () => {
    const serie = Array.from({ length: 30 }, (_, i) => ({
      fecha: `2026-10-${String(i + 1).padStart(2, "0")}`,
      precio: 1000 + (i % 2) * 10,
    }));
    expect(enFluctuacion(serie, hoy)).toBe(false);
  });
  it("CV ≥ 0.12 en 30 días aunque la última semana esté quieta", () => {
    const serie = [
      { fecha: "2026-10-01", precio: 700 },
      { fecha: "2026-10-05", precio: 1300 },
      { fecha: "2026-10-20", precio: 1000 },
      { fecha: "2026-10-26", precio: 1000 },
    ];
    expect(enFluctuacion(serie, hoy)).toBe(true);
  });
});

describe("etiquetas", () => {
  const base = {
    fecha: "2026-10-26",
    hoy: "2026-10-26",
    frecuencia: "diaria" as const,
  };
  it("sin dato tapa todo lo demás", () => {
    expect(etiquetas({ ...base, precio: null, estado: "sin_dato" })).toEqual([
      "sin_dato",
    ]);
  });
  it("anotado, mayorista, revisar y ↑ juntos", () => {
    expect(
      etiquetas({
        ...base,
        precio: 115,
        estado: "anotado",
        fuente: "SIPSA (mayorista)",
        revisar: true,
        previos,
      }),
    ).toEqual(["sube", "anotado", "mayorista", "revisar"]);
  });
  it("estimado y desactualizado", () => {
    expect(
      etiquetas({
        ...base,
        precio: 100,
        estado: "estimado",
        fecha: "2026-10-01",
      }),
    ).toEqual(["estimado", "desactualizado"]);
  });
});
