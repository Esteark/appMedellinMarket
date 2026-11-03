import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

/**
 * La factura real de 59 líneas, con nombres, tiendas y códigos únicos por corrida: los e2e crean datos permanentes
 * en la base compartida y un nombre repetido emparejaría con lo que creó la corrida anterior.
 */
function facturaUnica(ts: number) {
  const lineas = readFileSync("tests/importar/factura-larga.csv", "utf-8")
    .split("\n")
    .map((l) => l.replace(/\r$/, ""))
    .filter((l) => l.trim());
  const datos = lineas.slice(2).map((l) => l.split(","));
  const filas = datos.map(([producto, cant, precio, tienda, fecha, codigo]) => [
    `${producto} e2e${ts}`,
    cant,
    precio,
    `${tienda} E2E ${ts}`,
    fecha,
    codigo ? `${codigo}${ts}` : "",
  ]);
  return {
    texto: [...lineas.slice(0, 2), ...filas.map((f) => f.join(","))].join("\n"),
    productos: datos.map((d) => d[0]),
    codigos: datos.map((d) => (d[5] ? `${d[5]}${ts}` : "")),
  };
}

async function abrirImportar(page: Page) {
  await page.goto("/presupuesto");
  await page.getByRole("button", { name: "Importar factura" }).click();
}

async function crearCuenta(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

async function revisar(page: Page, texto: string) {
  await page.getByTestId("importar-texto").fill(texto);
  await page.getByRole("button", { name: "Revisar" }).click();
  // Con sesión la revisión espera la respuesta de la base antes de dejar guardar.
  await expect(page.getByText("Publicar los precios para todos")).toBeVisible();
}

async function guardar(page: Page) {
  const confirmar = page.getByLabel(/confirmo que se creen/);
  if (await confirmar.isVisible()) await confirmar.check();
  await page.getByRole("button", { name: "Guardar importación" }).click();
}

test("la factura larga crea los productos nuevos, deja uno como solo gasto y no se repite", async ({
  page,
}) => {
  const { texto, productos, codigos } = facturaUnica(Date.now());
  await crearCuenta(page);
  await abrirImportar(page);
  await revisar(page, texto);

  const resumen = page.getByTestId("resumen-factura");
  await expect(resumen).toContainText(`${productos.length} líneas`);
  await expect(resumen).toContainText("Productos nuevos hoy");

  // «Bolsa Recicla» no es un producto: nace como solo gasto sin que nadie lo pida.
  await expect(
    page.getByRole("button", { name: /^Solo gasto \(1\)$/ }),
  ).toBeVisible();
  // Pasar una línea más a solo gasto: su producto no se crea.
  const primera = page.getByRole("group", { name: /^Línea/ }).first();
  await primera.getByRole("button", { name: "Solo gasto" }).click();
  await expect(
    page.getByRole("button", { name: /^Solo gasto \(2\)$/ }),
  ).toBeVisible();

  await guardar(page);
  const salida = page.getByTestId("importar-resultado");
  await expect(salida).toContainText("Importación lista");
  await expect(salida).toContainText(`${productos.length} gastos guardados`);
  // Un producto es el conjunto de líneas que comparten nombre normalizado o código de barras («Pan Tajado» y
  // «Pan Tajado Ma» traen el mismo código; «Aromatica Sur» trae dos códigos con un solo nombre).
  const norma = (p: string) =>
    p
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  const claves = productos.map((p, i) =>
    [`n:${norma(p)}`, codigos[i] && `c:${codigos[i]}`].filter(Boolean),
  ) as string[][];
  const grupos: Set<string>[] = [];
  for (const ks of claves) {
    const tocan = grupos.filter((g) => ks.some((k) => g.has(k)));
    const unido = new Set([...ks, ...tocan.flatMap((g) => [...g])]);
    for (const g of tocan) grupos.splice(grupos.indexOf(g), 1);
    grupos.push(unido);
  }
  // Los dos productos que no se crean: el primero (pasado a solo gasto) y la bolsa.
  const esperados = grupos.length - 2;
  await expect(salida).toContainText(`${esperados} productos nuevos`);

  // El mismo archivo con la misma fecha se bloquea.
  await page.getByRole("button", { name: "Importar otra factura" }).click();
  await revisar(page, texto);
  await guardar(page);
  await expect(
    page.getByRole("status").filter({ hasText: "ya se importó" }),
  ).toBeVisible();
});

test("la revisión de la factura larga pasa axe y no desborda en 390 px", async ({
  page,
}) => {
  const AxeBuilder = (await import("@axe-core/playwright")).default;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  const { texto } = facturaUnica(Date.now());
  await crearCuenta(page);
  await abrirImportar(page);
  await revisar(page, texto);
  await expect(page.getByTestId("barra-guardar")).toBeVisible();

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const graves = violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    graves.map((v) => ({ id: v.id, nodos: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
});
