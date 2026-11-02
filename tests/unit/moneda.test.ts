import { describe, expect, it } from "vitest";
import {
  aNumero,
  conMiles,
  MAX_MONEDA,
  posicionTrasFormato,
  soloDigitos,
} from "@/lib/moneda";

describe("soloDigitos", () => {
  it("quita signo de pesos, puntos, espacios y letras", () => {
    expect(soloDigitos("$ 1.250.000")).toBe("1250000");
    expect(soloDigitos("12abc 3")).toBe("123");
    expect(soloDigitos("sin números")).toBe("");
  });

  it("una coma decimal corta lo que sigue: los pesos son enteros", () => {
    expect(soloDigitos("3.000,50")).toBe("3000");
    expect(soloDigitos("1500,9")).toBe("1500");
  });

  it("sin ceros a la izquierda, pero un solo cero se conserva", () => {
    expect(soloDigitos("007")).toBe("7");
    expect(soloDigitos("0")).toBe("0");
    expect(soloDigitos("000")).toBe("0");
  });
});

describe("conMiles", () => {
  it("agrupa de a tres con punto", () => {
    expect(conMiles("3000")).toBe("3.000");
    expect(conMiles("30000")).toBe("30.000");
    expect(conMiles("300000")).toBe("300.000");
    expect(conMiles("1250000")).toBe("1.250.000");
  });

  it("no toca los números cortos ni la cadena vacía", () => {
    expect(conMiles("")).toBe("");
    expect(conMiles("7")).toBe("7");
    expect(conMiles("999")).toBe("999");
  });
});

describe("aNumero", () => {
  it("vacío o sin dígitos es null", () => {
    expect(aNumero("")).toBeNull();
    expect(aNumero("$ ")).toBeNull();
  });

  it("devuelve el entero de lo escrito, pegado con formato o sin él", () => {
    expect(aNumero("3000")).toBe(3000);
    expect(aNumero("$ 1.250.000")).toBe(1250000);
    expect(aNumero("1250000")).toBe(1250000);
  });

  it("se limita a 50 000 000", () => {
    expect(aNumero("999999999")).toBe(MAX_MONEDA);
    expect(aNumero("50000000")).toBe(50_000_000);
  });
});

describe("posicionTrasFormato", () => {
  it("al escribir en medio, el cursor sigue tras el mismo dígito", () => {
    // Se veía "3.000", el cursor estaba tras "3." y se tecleó un 5 → "3.5000".
    const nuevo = conMiles("35000");
    expect(nuevo).toBe("35.000");
    expect(posicionTrasFormato("3.5000", 3, nuevo)).toBe(2);
  });

  it("al borrar un dígito en medio se queda donde estaba", () => {
    // Se veía "35.000", Retroceso tras el 5 → "3.000".
    expect(posicionTrasFormato("3.000", 1, conMiles("3000"))).toBe(1);
  });

  it("al borrar un punto no salta", () => {
    // Se veía "35.000", Retroceso sobre el punto → "35000", cursor tras "35".
    expect(posicionTrasFormato("35000", 2, conMiles("35000"))).toBe(2);
  });

  it("al escribir al final, el cursor queda al final", () => {
    const nuevo = conMiles("12345");
    expect(posicionTrasFormato("1.2345", 6, nuevo)).toBe(nuevo.length);
  });

  it("sin dígitos a la izquierda, el cursor va al inicio", () => {
    expect(posicionTrasFormato("$ 3000", 1, "3.000")).toBe(0);
  });
});
