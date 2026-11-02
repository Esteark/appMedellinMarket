import { describe, expect, it } from "vitest";
import { planSugerido } from "@/lib/planes/config";
import {
  fusionarGuardados,
  huellaGuardados,
  leerGuardado,
  leerGuardados,
  MAX_GUARDADOS,
  normalizarNombre,
  type PlanGuardado,
  recortarGuardados,
} from "@/lib/planes/guardados";

const base = planSugerido("hogar", "2026-11-02T10:00:00-05:00");
const plan = (nombre: string, actualizada: string): PlanGuardado => ({
  nombre,
  config: { ...base, actualizada },
  actualizada,
});

describe("presupuestos guardados", () => {
  it("normaliza el nombre igual que la base", () => {
    expect(normalizarNombre("  Octubre  ")).toBe("octubre");
  });

  it("descarta filas crudas incompletas o con config inválida", () => {
    expect(leerGuardado({ nombre: "Octubre", config: base })).toBeNull();
    expect(
      leerGuardado({
        nombre: "   ",
        config: base,
        actualizada: base.actualizada,
      }),
    ).toBeNull();
    expect(
      leerGuardado({
        nombre: "x".repeat(61),
        config: base,
        actualizada: base.actualizada,
      }),
    ).toBeNull();
    expect(
      leerGuardado({
        nombre: "Octubre",
        config: { version: 9 },
        actualizada: base.actualizada,
      }),
    ).toBeNull();
    expect(
      leerGuardados([
        { nombre: "Octubre", config: base, actualizada: base.actualizada },
        "basura",
      ]),
    ).toHaveLength(1);
  });

  it("fusiona por nombre (sin mayúsculas ni espacios) y gana la más reciente", () => {
    const local = plan(" Octubre ", "2026-11-02T10:00:00-05:00");
    const nube = plan("octubre", "2026-11-01T10:00:00-05:00");
    expect(fusionarGuardados([local], [nube])).toMatchObject([
      { nombre: " Octubre ", actualizada: local.actualizada },
    ]);
    expect(fusionarGuardados([], [nube])).toHaveLength(1);
  });

  it("recorta al tope y ordena por fecha descendente", () => {
    const planes = Array.from({ length: MAX_GUARDADOS + 3 }, (_, i) =>
      plan(
        `p${i}`,
        `2026-11-${String((i % 28) + 1).padStart(2, "0")}T10:00:00-05:00`,
      ),
    );
    const recortados = recortarGuardados(planes);
    expect(recortados).toHaveLength(MAX_GUARDADOS);
    expect(recortados[0].actualizada >= recortados[1].actualizada).toBe(true);
  });

  it("la huella no depende del orden", () => {
    const a = plan("Octubre", "2026-11-02T10:00:00-05:00");
    const b = plan("Noviembre", "2026-11-03T10:00:00-05:00");
    expect(huellaGuardados([a, b])).toBe(huellaGuardados([b, a]));
  });
});
