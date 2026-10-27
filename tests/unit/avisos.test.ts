import { describe, expect, it } from "vitest";
import {
  AVISOS,
  debeResumir,
  LIMITE_SEGUIMIENTO_MS,
  seleccionarResumen,
  siguienteEstado,
  textoAviso,
} from "@/lib/avisos";

describe("avisos", () => {
  it("toda clave tiene tipo, emoji y texto no vacíos", () => {
    for (const [clave, a] of Object.entries(AVISOS)) {
      expect(a.tipo, clave).toMatch(/^(exito|info|aviso|error)$/);
      expect(a.texto.trim(), clave).not.toBe("");
      expect(a.emoji.trim(), clave).not.toBe("");
    }
  });

  it("textoAviso rellena los marcadores", () => {
    expect(textoAviso("lista_fusionada", { n: 4 })).toContain("(4 productos)");
  });

  it("debeResumir solo la primera vez del día", () => {
    expect(debeResumir(null, "2026-10-26")).toBe(true);
    expect(debeResumir("2026-10-25", "2026-10-26")).toBe(true);
    expect(debeResumir("2026-10-26", "2026-10-26")).toBe(false);
  });

  it("seleccionarResumen: máximo 3 y el resto aparte", () => {
    expect(seleccionarResumen([1, 2])).toEqual({ mostrar: [1, 2], resto: 0 });
    expect(seleccionarResumen([1, 2, 3, 4, 5])).toEqual({
      mostrar: [1, 2, 3],
      resto: 2,
    });
  });

  it("siguienteEstado: ok con corrida nueva, tarda a los 20 min", () => {
    const seg = { inicio: 0, desde: "2026-10-25T11:00:00Z" };
    expect(siguienteEstado(seg, "2026-10-25T11:00:00Z", 60_000)).toBe(
      "esperando",
    );
    expect(siguienteEstado(seg, "2026-10-26T15:00:00Z", 60_000)).toBe("ok");
    expect(
      siguienteEstado(seg, "2026-10-25T11:00:00Z", LIMITE_SEGUIMIENTO_MS),
    ).toBe("tarda");
    expect(siguienteEstado({ inicio: 0, desde: null }, null, 1)).toBe(
      "esperando",
    );
    expect(
      siguienteEstado({ inicio: 0, desde: null }, "2026-10-26T15:00:00Z", 1),
    ).toBe("ok");
  });
});

describe("textoAviso", () => {
  it("no deja doble punto cuando el dato termina en punto", () => {
    expect(
      textoAviso("datos_viejos", { cuando: "ayer 6:06 a. m." }),
    ).not.toContain("..");
  });
});
