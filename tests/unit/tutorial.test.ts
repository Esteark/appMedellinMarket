import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLAVE_TUTORIAL,
  leerProgreso,
  marcarVisto,
  reiniciar,
} from "@/lib/tutorial/almacenamiento";
import {
  claveDeRuta,
  esRutaDeAuth,
  PASOS_GENERAL,
  PASOS_PANTALLA,
  pasosPara,
} from "@/lib/tutorial/pasos";
import { colocar } from "@/lib/tutorial/posicion";

// Sin jsdom (no se agregan dependencias): un localStorage mínimo en memoria.
beforeEach(() => {
  const datos = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    clear: () => datos.clear(),
  });
});

describe("progreso del tutorial", () => {
  it("sin clave o con JSON corrupto es «no visto»", () => {
    expect(leerProgreso().general).toBe(false);
    localStorage.setItem(CLAVE_TUTORIAL, "{no es json");
    expect(leerProgreso()).toEqual({
      version: 1,
      general: false,
      pantallas: [],
    });
    localStorage.setItem(
      CLAVE_TUTORIAL,
      JSON.stringify({ version: 9, general: true }),
    );
    expect(leerProgreso().general).toBe(false);
  });

  it("marcarVisto es idempotente", () => {
    marcarVisto("general");
    marcarVisto("general");
    marcarVisto("/hogar");
    marcarVisto("/hogar");
    expect(leerProgreso()).toEqual({
      version: 1,
      general: true,
      pantallas: ["/hogar"],
    });
  });

  it("reiniciar borra la marca", () => {
    marcarVisto("general");
    reiniciar();
    expect(leerProgreso().general).toBe(false);
    expect(localStorage.getItem(CLAVE_TUTORIAL)).toBeNull();
  });
});

describe("pasos", () => {
  const todos = [...PASOS_GENERAL, ...Object.values(PASOS_PANTALLA).flat()];

  it("el general no repite ids y cada paso trae título, texto y objetivo", () => {
    const ids = PASOS_GENERAL.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of todos) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.titulo.trim().length).toBeGreaterThan(0);
      expect(p.texto.trim().length).toBeGreaterThan(0);
      expect(p.objetivo.trim().length).toBeGreaterThan(0);
    }
  });

  it("cada pantalla cubierta tiene su recorrido y /producto/[id] sirve para cualquier producto", () => {
    expect(claveDeRuta("/producto/aguacate")).toBe("/producto/[id]");
    expect(claveDeRuta("/anotados/")).toBe("/anotados");
    expect(pasosPara("pantalla", "/anotados/barrio")[0].objetivo).toBe(
      "barrio-progreso",
    );
    expect(pasosPara("pantalla", "/ruta-desconocida")).toBe(PASOS_GENERAL);
  });

  it("no hay tutorial en las rutas de autenticación", () => {
    for (const r of [
      "/ingresar",
      "/registro",
      "/recuperar",
      "/nueva-clave",
      "/auth/confirmar",
    ])
      expect(esRutaDeAuth(r)).toBe(true);
    for (const r of ["/", "/hogar", "/anotados/barrio"])
      expect(esRutaDeAuth(r)).toBe(false);
  });
});

describe("colocar la tarjeta", () => {
  const caja = (top: number, bottom: number) => ({
    left: 100,
    top,
    right: 300,
    bottom,
  });

  it("va debajo del objetivo si cabe, arriba si no, y fija abajo en móvil", () => {
    const debajo = colocar(caja(50, 100), 320, 160, 1280, 800);
    expect(debajo.abajo).toBe(false);
    expect(debajo.top).toBeGreaterThan(100); // nunca tapa el objetivo
    const arriba = colocar(caja(600, 780), 320, 160, 1280, 800);
    expect(arriba.top + 160).toBeLessThan(600);
    expect(colocar(caja(50, 100), 320, 160, 390, 800).abajo).toBe(true);
  });
});
