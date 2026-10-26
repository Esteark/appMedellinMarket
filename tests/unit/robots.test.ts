import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsearRobots, permitido, permitidoPor } from "@/corrida/robots";
import { USER_AGENT_POR_DEFECTO } from "@/corrida/tipos";
import { contextoPrueba } from "../helpers/fetch-falso";

describe("robots.txt de D1 (capturado)", () => {
  const reglas = parsearRobots(
    readFileSync("tests/fixtures/vtex/robots.txt", "utf8"),
    USER_AGENT_POR_DEFECTO,
  );
  it("permite la API de búsqueda y las páginas /p", () => {
    expect(
      permitidoPor(
        reglas,
        "/api/catalog_system/pub/products/search?ft=ajo&_from=0&_to=4",
      ),
    ).toBe(true);
    expect(permitidoPor(reglas, "/ajo-malla-3-und-100g-12002709/p")).toBe(true);
  });
  it("prohíbe /busca/ y los parámetros bloqueados en cualquier parte", () => {
    expect(permitidoPor(reglas, "/busca/ajo")).toBe(false);
    expect(permitidoPor(reglas, "/ajo?sc=1")).toBe(false);
  });
});

describe("semántica de robots", () => {
  const texto = [
    "User-agent: *",
    "Disallow: /privado",
    "Allow: /privado/abierto$",
    "",
    "User-agent: OtroBot",
    "Disallow: /",
  ].join("\n");
  const reglas = parsearRobots(texto, USER_AGENT_POR_DEFECTO);
  it("usa el grupo * si no hay uno propio, y no el de otro bot", () => {
    expect(permitidoPor(reglas, "/cualquier")).toBe(true);
    expect(permitidoPor(reglas, "/privado/x")).toBe(false);
  });
  it("gana la regla más larga y $ ancla el final", () => {
    expect(permitidoPor(reglas, "/privado/abierto")).toBe(true);
    expect(permitidoPor(reglas, "/privado/abierto/mas")).toBe(false);
  });
  it("un grupo propio reemplaza al de *", () => {
    const propio = parsearRobots(
      `${texto}\n\nUser-agent: MercadoMedellinBot\nDisallow: /api/`,
      USER_AGENT_POR_DEFECTO,
    );
    expect(permitidoPor(propio, "/privado/x")).toBe(true);
    expect(permitidoPor(propio, "/api/x")).toBe(false);
  });
});

describe("permitido según la respuesta de robots.txt", () => {
  const con = (respuesta: () => Response) =>
    contextoPrueba((async () => respuesta()) as unknown as typeof fetch);
  it("404 = todo permitido", async () => {
    expect(
      await permitido(
        "https://a.co/x",
        con(() => new Response("", { status: 404 })),
      ),
    ).toBe(true);
  });
  it("5xx o error de red = no se pide nada", async () => {
    expect(
      await permitido(
        "https://a.co/x",
        con(() => new Response("", { status: 503 })),
      ),
    ).toBe(false);
    const caido = contextoPrueba((async () => {
      throw new Error("sin red");
    }) as unknown as typeof fetch);
    expect(await permitido("https://a.co/x", caido)).toBe(false);
  });
});
