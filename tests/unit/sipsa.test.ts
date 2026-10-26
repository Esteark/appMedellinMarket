import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  esClima,
  fechasCandidatas,
  leerBoletin,
  minorista,
  PRODUCTOS,
  sinAcentos,
  sufijoFecha,
} from "@/corrida/adaptadores/sipsa";
import type { Consulta } from "@/corrida/tipos";
import { contextoPrueba, fetchFalso } from "../helpers/fetch-falso";

// El boletín capturado es del día de la captura.
const { fecha: CAPTURA } = JSON.parse(
  readFileSync("tests/fixtures/sipsa/capturado.json", "utf8"),
) as { fecha: string };

const ctx = (hoy = CAPTURA) => ({
  ...contextoPrueba(fetchFalso("sipsa").fetch),
  hoy,
});

const kilo = (producto_id: string): Consulta => ({
  producto_id,
  unidad_base: "g",
  cantidad_base: 1000,
  termino: null,
  sku: null,
  url: null,
});

describe("clasificador de clima", () => {
  it("una frase con lluvias es clima", () => {
    expect(
      esClima(
        "El precio subió por las fuertes lluvias en las zonas de cultivo de Marinilla.",
      ),
    ).toBe(true);
  });
  it("menor oferta sin término climático no es clima", () => {
    expect(
      esClima("El alza obedeció a la menor oferta que llegó desde Sonsón."),
    ).toBe(false);
  });
  it("ignora mayúsculas y acentos", () => {
    expect(esClima("Por la SEQUÍA y el Fenómeno de La Niña")).toBe(true);
  });
});

describe("fechas del boletín", () => {
  it("día con dos dígitos y mes abreviado en español", () => {
    expect(sufijoFecha("2026-10-05")).toBe("05oct2026");
    expect(sufijoFecha("2026-01-31")).toBe("31ene2026");
  });
  it("hoy y hasta 3 días atrás", () => {
    expect(fechasCandidatas("2026-11-02")).toEqual([
      "2026-11-02",
      "2026-11-01",
      "2026-10-31",
      "2026-10-30",
    ]);
  });
});

describe("boletín SIPSA real", () => {
  it("precios en $/kg de Medellín, sin n.d.", async () => {
    const boletin = await leerBoletin(ctx());
    expect(boletin?.fecha).toBe(CAPTURA);
    const precios = boletin?.precios ?? {};
    expect(Object.keys(precios).length).toBeGreaterThan(15);
    for (const precio of Object.values(precios)) {
      expect(Number.isInteger(precio) && precio > 0).toBe(true);
    }
  });

  it("el adaptador devuelve el $/kg con la fecha del boletín", async () => {
    const c = ctx();
    const boletin = await leerBoletin(c);
    const [producto, porKg] = Object.entries(boletin?.precios ?? {})[0];
    expect(await minorista.buscar(kilo(producto), c)).toMatchObject({
      producto_id: producto,
      precio: porKg,
      fecha: CAPTURA,
      sku: null,
    });
  });

  it("null si el producto no es por peso", async () => {
    const c = ctx();
    const [producto] = Object.keys((await leerBoletin(c))?.precios ?? {});
    expect(
      await minorista.buscar(
        { ...kilo(producto), unidad_base: "u", cantidad_base: 1 },
        c,
      ),
    ).toBeNull();
  });

  it("si hoy no hay boletín, usa el más nuevo de hasta 3 días atrás", async () => {
    const dosDiasDespues = new Date(Date.parse(CAPTURA) + 2 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect((await leerBoletin(ctx(dosDiasDespues)))?.fecha).toBe(CAPTURA);
  });

  it("causas: frases literales de Medellín con el producto nombrado", async () => {
    const causas = (await leerBoletin(ctx()))?.causas ?? [];
    expect(causas.length).toBeGreaterThan(0);
    for (const c of causas) {
      expect(c.texto).toMatch(/Medell[ií]n/);
      expect(c.fecha).toBe(CAPTURA);
      expect(c.fuente_url).toMatch(/bol-SIPSADiario-.+\.pdf$/);
      expect(c.es_clima).toBe(esClima(c.texto));
      expect(c.texto.length).toBeLessThanOrEqual(600);
      // Una sola frase: no arrastra el título ni la frase de la sección siguiente.
      expect(c.texto.slice(0, -1)).not.toMatch(/\.\s+[A-ZÁÉÍÓÚÑ]|-{5,}/);
      // La frase nombra el producto al que se le atribuye.
      const nombres = Object.entries(PRODUCTOS)
        .filter(([, id]) => id === c.producto_id)
        .map(([nombre]) => nombre);
      expect(nombres.some((n) => sinAcentos(c.texto).includes(n))).toBe(true);
    }
  });
});
