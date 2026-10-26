import { describe, expect, it } from "vitest";
import {
  alertaMercadoCompleto,
  alertaSubida,
  alertasFuenteCaida,
  alertasMasBarato,
  ordenarAlertas,
} from "@/lib/alertas/reglas";

const tiendas = ["exito", "d1", "euro"];
const hoy = "2026-10-26";
const previos = [1000, 1000, 1000, 1000, 1000, 1000, 1000];

describe("mas_barato", () => {
  it("salta con ≥10 % y monto ≥ umbral; monto = diferencia × cantidad", () => {
    const precios = { arroz: { exito: 5000, d1: 4500, euro: 4800 } };
    const [alerta, ...resto] = alertasMasBarato(
      { arroz: 2 },
      precios,
      "exito",
      tiendas,
    );
    expect(resto).toHaveLength(0);
    expect(alerta).toMatchObject({
      tipo: "mas_barato",
      producto_id: "arroz",
      tienda_id: "d1",
      monto: 1000,
    });
  });
  it("no salta por debajo del 10 %", () => {
    const precios = { arroz: { exito: 5000, d1: 4501, euro: 4800 } };
    expect(
      alertasMasBarato({ arroz: 10 }, precios, "exito", tiendas),
    ).toHaveLength(0);
  });
  it("no salta si el monto no llega al umbral", () => {
    const precios = { arroz: { exito: 5000, d1: 4500, euro: 4800 } };
    expect(
      alertasMasBarato({ arroz: 1 }, precios, "exito", tiendas, 1000),
    ).toHaveLength(0);
  });
});

describe("mercado_completo", () => {
  const lista = { arroz: 1, leche: 1 };
  it("salta si otra tienda completa es ≥5 % más barata", () => {
    const precios = {
      arroz: { exito: 5000, d1: 4800, euro: 5000 },
      leche: { exito: 5000, d1: 4700, euro: 5000 },
    };
    expect(
      alertaMercadoCompleto(lista, precios, "exito", tiendas),
    ).toMatchObject({
      tipo: "mercado_completo",
      tienda_id: "d1",
      monto: 500,
    });
  });
  it("no salta por debajo del 5 % ni si la otra tienda está incompleta", () => {
    const casi = {
      arroz: { exito: 5000, d1: 4800, euro: 5000 },
      leche: { exito: 5000, d1: 4800, euro: 5000 },
    };
    expect(alertaMercadoCompleto(lista, casi, "exito", tiendas)).toBeNull();
    const incompleta = {
      arroz: { exito: 5000, d1: 1000, euro: 5000 },
      leche: { exito: 5000, d1: null, euro: 5000 },
    };
    expect(
      alertaMercadoCompleto(lista, incompleta, "exito", tiendas),
    ).toBeNull();
  });
});

describe("subida y caro_por_clima", () => {
  it("subida con ≥15 % sobre el promedio de los 7 previos", () => {
    expect(alertaSubida("papa", "exito", 1150, previos, [], hoy)).toMatchObject(
      {
        tipo: "subida",
        monto: 150,
      },
    );
    expect(alertaSubida("papa", "exito", 1149, previos, [], hoy)).toBeNull();
  });
  it("caro_por_clima si además hay causa climática en 7 días", () => {
    const causas = [{ fecha: "2026-10-24", es_clima: true }];
    expect(
      alertaSubida("papa", "exito", 1200, previos, causas, hoy)?.tipo,
    ).toBe("caro_por_clima");
  });
});

describe("fuente_caida", () => {
  it("fallo o ≥3 días sin ultimo_ok", () => {
    const caidas = alertasFuenteCaida(
      [
        { tienda_id: "exito", estado: "ok", ultimo_ok: "2026-10-26" },
        { tienda_id: "d1", estado: "fallo", ultimo_ok: "2026-10-26" },
        { tienda_id: "euro", estado: "parcial", ultimo_ok: "2026-10-23" },
        { tienda_id: "carulla", estado: "ok", ultimo_ok: "2026-10-24" },
        { tienda_id: "ara", estado: null, ultimo_ok: null },
      ],
      hoy,
    );
    expect(caidas.map((a) => a.tienda_id)).toEqual(["d1", "euro", "ara"]);
    expect(caidas.every((a) => a.tipo === "fuente_caida")).toBe(true);
  });
});

it("ordena por monto de mayor a menor", () => {
  expect(ordenarAlertas([{ monto: 1 }, { monto: 30 }, { monto: 5 }])).toEqual([
    { monto: 30 },
    { monto: 5 },
    { monto: 1 },
  ]);
});
