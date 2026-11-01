import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  leerOrigenActual,
  reemplazarLista,
} from "@/components/carrito/use-lista";
import { mismosItems } from "@/lib/listas/guardadas";
import {
  CLAVE_ORIGEN,
  cambiado,
  guardarOrigen,
  leerOrigen,
} from "@/lib/listas/origen";

function almacenamiento(roto = false) {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => {
      if (roto) throw new Error("sin almacenamiento");
      return m.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (roto) throw new Error("sin almacenamiento");
      m.set(k, v);
    },
    removeItem: (k: string) => void m.delete(k),
  };
}

describe("origen de la lista activa", () => {
  beforeEach(() => vi.stubGlobal("localStorage", almacenamiento()));
  afterEach(() => vi.unstubAllGlobals());

  it("guardar y leer el origen; null lo borra", () => {
    expect(leerOrigen()).toBeNull();
    guardarOrigen("Quincena");
    expect(leerOrigen()).toBe("Quincena");
    guardarOrigen(null);
    expect(leerOrigen()).toBeNull();
  });

  it("sin almacenamiento devuelve null sin lanzar", () => {
    vi.stubGlobal("localStorage", almacenamiento(true));
    expect(leerOrigen()).toBeNull();
    expect(() => guardarOrigen("X")).not.toThrow();
  });

  it("un valor vacío cuenta como sin origen", () => {
    localStorage.setItem(CLAVE_ORIGEN, "   ");
    expect(leerOrigen()).toBeNull();
  });

  it("cargar una guardada fija el origen; editar la conserva; vaciar o reemplazar por otra la borra", () => {
    reemplazarLista({ a: 1 }, "Quincena");
    expect(leerOrigenActual()).toBe("Quincena");
    reemplazarLista({ a: 2 });
    expect(leerOrigenActual()).toBe("Quincena");
    reemplazarLista({ a: 1 }, "Fiesta");
    expect(leerOrigenActual()).toBe("Fiesta");
    reemplazarLista({ b: 1 }, null);
    expect(leerOrigenActual()).toBeNull();
    reemplazarLista({ a: 1 }, "Quincena");
    reemplazarLista({});
    expect(leerOrigenActual()).toBeNull();
    expect(leerOrigen()).toBeNull();
  });
});

describe("cambiado", () => {
  it("ignora el orden de los productos", () => {
    expect(cambiado({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(false);
    expect(mismosItems({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it("detecta una cantidad distinta, un producto de más o de menos", () => {
    expect(cambiado({ a: 2 }, { a: 1 })).toBe(true);
    expect(cambiado({ a: 1, b: 1 }, { a: 1 })).toBe(true);
    expect(cambiado({ a: 1 }, { a: 1, b: 1 })).toBe(true);
  });
});
