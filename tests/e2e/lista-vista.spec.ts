import { expect, type Page, test } from "@playwright/test";

const PRODUCTOS = [
  "aceite",
  "aguacate",
  "pollo",
  "arroz",
  "leche",
  "huevos",
  "papa",
  "tomate",
  "cebolla",
  "azucar",
  "sal",
  "cafe",
  "pasta",
  "mantequilla",
  "atun",
];

const digitos = (s: string | null) => Number((s ?? "").replace(/\D/g, ""));

async function llenarLista(page: Page) {
  await page.goto("/");
  for (const id of PRODUCTOS)
    await page
      .getByTestId(`tarjeta-${id}`)
      .getByRole("button", { name: /^Agregar/ })
      .click();
}

test("la lista por tienda suma el total, se pliega y conserva las cantidades al cambiar de vista", async ({
  page,
}) => {
  await llenarLista(page);
  const secciones = page.getByTestId("seccion-lista");
  const n = await secciones.count();
  expect(n).toBeGreaterThanOrEqual(2);

  // Los subtotales suman el óptimo dividido: total de una sola tienda − ahorro.
  let suma = 0;
  for (const s of await secciones.all())
    suma += digitos(await s.locator("button b").textContent());
  // El total y el ahorro del encabezado cuentan hasta su valor (0,5 s): se espera a que terminen.
  await expect
    .poll(async () => {
      const total = digitos(await page.getByTestId("total").textContent());
      const ahorro = digitos(await page.getByTestId("ahorro").textContent());
      return total - ahorro;
    })
    .toBe(suma);

  // 15 ítems > 12: solo la primera sección arranca abierta.
  const cabecera = (i: number) => secciones.nth(i).locator("> button");
  await expect(cabecera(0)).toHaveAttribute("aria-expanded", "true");
  await expect(cabecera(1)).toHaveAttribute("aria-expanded", "false");
  await expect(secciones.nth(1).getByTestId("fila-lista").first()).toBeHidden();

  await cabecera(1).click();
  await expect(cabecera(1)).toHaveAttribute("aria-expanded", "true");
  await expect(
    secciones.nth(1).getByTestId("fila-lista").first(),
  ).toBeVisible();
  await cabecera(1).click();
  await expect(cabecera(1)).toHaveAttribute("aria-expanded", "false");
  await expect(secciones.nth(1).getByTestId("fila-lista").first()).toBeHidden();

  // Por grupo y Todo conservan los 15 productos.
  const vista = page.getByRole("group", { name: "Cómo ver la lista" });
  await vista.getByRole("button", { name: "Por grupo" }).click();
  await expect(secciones.first()).toBeVisible();
  await vista.getByRole("button", { name: "Todo" }).click();
  await expect(page.getByTestId("fila-lista")).toHaveCount(PRODUCTOS.length);
  await expect(page.getByTestId("seccion-lista")).toHaveCount(0);

  // El stepper de una fila cambia la cantidad.
  const fila = page.getByTestId("fila-lista").first();
  await fila.getByRole("button", { name: /^Agregar uno/ }).click();
  await expect(fila).toContainText("2");
});

test.describe("móvil", () => {
  test.use({ viewport: { width: 360, height: 740 }, hasTouch: true });

  test("en la hoja el resumen sigue visible al desplazar y no hay desplazamiento horizontal", async ({
    page,
  }) => {
    await llenarLista(page);
    await page.getByTestId("abrir-lista").click();
    const hoja = page.getByRole("dialog");
    await expect(hoja).toBeVisible();
    await hoja.getByRole("button", { name: "Todo" }).click();

    await hoja.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    const resumen = page.getByTestId("lista-resumen");
    const caja = await resumen.boundingBox();
    const dialogo = await hoja.boundingBox();
    expect(caja && dialogo).toBeTruthy();
    // Pegado al borde superior de la hoja (8 px de relleno), aunque la lista se desplazó hasta el fondo.
    expect(Math.abs((caja?.y ?? 0) - (dialogo?.y ?? 0))).toBeLessThan(12);

    const ancho = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      window.innerWidth,
    ]);
    expect(ancho[0]).toBeLessThanOrEqual(ancho[1]);
  });
});
