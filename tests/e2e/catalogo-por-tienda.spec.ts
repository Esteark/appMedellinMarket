import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

async function crearCuenta(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-cat-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

test("sin sesión no hay «Agregar producto» en la Canasta ni en Anotados", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("agregar-producto")).toHaveCount(0);
  await page.goto("/anotados");
  await expect(page.getByTestId("agregar-producto")).toHaveCount(0);
});

test("con sesión: la Canasta abre «Agregar producto» con la tienda del chip activo", async ({
  page,
}) => {
  await crearCuenta(page);
  await page.goto("/");
  await page
    .getByTestId("chips-tiendas")
    .getByRole("button", { name: "PriceSmart", exact: true })
    .click();
  await page.getByTestId("agregar-producto").click();
  const hoja = page.getByTestId("agregar-a-tienda");
  await expect(hoja.getByLabel("Tienda")).toHaveValue("pricesmart");
  // La papaya solo la sigue La Minorista: se ofrece para PriceSmart y dice dónde está.
  await hoja.getByLabel("Buscar producto para agregar").fill("papaya");
  await expect(hoja.getByTestId("candidato-papaya")).toContainText(
    "También en La Minorista",
  );
});

test("con sesión: Anotados no deja anotar donde la tienda no sigue el producto y ofrece agregarlo", async ({
  page,
}) => {
  const producto = `E2E Anot ${Date.now()}`;
  await crearCuenta(page);
  await page.goto("/tiendas");
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre").fill(producto);
  await page.getByRole("checkbox", { name: "La Minorista" }).check();
  await page.getByRole("button", { name: "Guardar" }).click();
  // Esperar a que la hoja se cierre: navegar antes cancelaría la acción.
  await expect(page.getByRole("button", { name: "Guardar" })).toHaveCount(0);

  await page.goto("/anotados");
  await page.getByLabel("Buscar producto", { exact: true }).fill(producto);
  const fila = page.getByRole("row").filter({ hasText: producto });
  // Solo La Minorista lo sigue: en las demás tiendas la celda queda fuera.
  await expect(fila.locator('[data-testid^="celda-"]')).toHaveCount(1);
  expect(
    await fila.locator('[data-testid^="fuera-"]').count(),
  ).toBeGreaterThanOrEqual(1);

  await page.getByTestId("agregar-producto").click();
  const hoja = page.getByTestId("agregar-a-tienda");
  await hoja.getByLabel("Tienda").selectOption("pricesmart");
  await hoja.getByLabel("Buscar producto para agregar").fill(producto);
  await hoja.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar" }).first().click();
  await expect(fila.locator('[data-testid^="celda-"]')).toHaveCount(2);
});

test("un producto propio de un plan guarda el ícono elegido", async ({
  page,
}) => {
  await page.goto("/hogar");
  const propios = page.getByRole("group", { name: "Productos propios" });
  await propios.getByLabel("Nombre del producto propio").fill("Velas");
  await propios.getByLabel("Precio estimado del producto propio").fill("3000");
  await propios.getByRole("button", { name: "Elegir ícono" }).click();
  await propios.getByLabel("Buscar ícono").fill("vela");
  await propios.getByRole("button", { name: "vela" }).click();
  await propios.getByRole("button", { name: "Agregar propio" }).click();
  await expect(propios).toContainText("🕯️ Velas");
  await page.reload();
  await expect(
    page.getByRole("group", { name: "Productos propios" }),
  ).toContainText("🕯️ Velas");
});
