import { describe, expect, it } from "vitest";
import { configPlan, planSugerido } from "@/lib/planes/config";
import {
  agregarSemana,
  conSemanas,
  quitarSemana,
  repetirEnTodosLosDias,
  type Semana,
  semanaVacia,
  traerListaBase,
} from "@/lib/planes/semanas";

const base = planSugerido("dieta", "2026-11-02T10:00:00-05:00");
const con = (n: number) => ({
  ...base,
  semanas: Array.from({ length: n }, semanaVacia),
});

describe("semanas del plan", () => {
  it("un plan sin semanas sigue siendo válido", () => {
    expect(configPlan.safeParse(base).success).toBe(true);
  });

  it("acepta 4 y 5 semanas y rechaza 3 y 6", () => {
    expect(configPlan.safeParse(con(4)).success).toBe(true);
    expect(configPlan.safeParse(con(5)).success).toBe(true);
    expect(configPlan.safeParse(con(3)).success).toBe(false);
    expect(configPlan.safeParse(con(6)).success).toBe(false);
  });

  it("rechaza un día de menos y una cantidad 0", () => {
    const corta: Semana = {
      ...semanaVacia(),
      dias: semanaVacia().dias.slice(1),
    };
    expect(
      configPlan.safeParse({ ...con(4), semanas: [corta, ...con(3).semanas] })
        .success,
    ).toBe(false);
    const cero = semanaVacia();
    cero.dias[0].almuerzo = { arroz: 0 };
    expect(
      configPlan.safeParse({ ...con(4), semanas: [cero, ...con(3).semanas] })
        .success,
    ).toBe(false);
  });

  it("conSemanas crea 4 vacías y no cambia un plan que ya las tiene", () => {
    expect(conSemanas(base).semanas).toHaveLength(4);
    const c = con(5);
    expect(conSemanas(c)).toBe(c);
  });

  it("agregar falla con 5, quitar falla con 4 y ninguna muta", () => {
    expect(agregarSemana(con(5))).toBeNull();
    expect(quitarSemana(con(4))).toBeNull();
    expect(agregarSemana(base)).toBeNull();
    const c4 = con(4);
    const c5 = agregarSemana(c4);
    expect(c5?.semanas).toHaveLength(5);
    expect(c4.semanas).toHaveLength(4);
    expect(quitarSemana(c5 as typeof c4)?.semanas).toHaveLength(4);
  });

  it("repetir copia la comida a los 7 días sin tocar las otras", () => {
    const s = semanaVacia();
    s.dias[0].almuerzo = { arroz: 2 };
    s.dias[3].cena = { pollo: 1 };
    const antes = JSON.stringify(s);
    const r = repetirEnTodosLosDias(s, 0, "almuerzo");
    expect(r.dias.every((d) => d.almuerzo.arroz === 2)).toBe(true);
    expect(r.dias[3].cena).toEqual({ pollo: 1 });
    expect(r.dias[1].desayuno).toEqual({});
    expect(JSON.stringify(s)).toBe(antes);
    r.dias[1].almuerzo.arroz = 9;
    expect(r.dias[2].almuerzo.arroz).toBe(2);
  });

  it("traerListaBase copia items a la despensa de esa semana", () => {
    const c = con(4);
    const r = traerListaBase({ ...c, items: { arroz: 3 } }, 1);
    expect(r?.semanas?.[1].despensa).toEqual({ arroz: 3 });
    expect(r?.semanas?.[0].despensa).toEqual({});
    expect(traerListaBase(c, 9)).toBeNull();
    expect(traerListaBase(base, 0)).toBeNull();
  });
});
