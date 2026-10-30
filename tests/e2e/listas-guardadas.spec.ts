import { expect, type Page, test } from "@playwright/test";

const agregar = (page: Page, id: string, veces = 1) =>
  (async () => {
    for (let i = 0; i < veces; i++)
      await page
        .getByTestId(`tarjeta-${id}`)
        .getByRole("button", { name: /^Agregar/ })
        .click();
  })();

async function guardar(page: Page, nombre: string) {
  await page.getByTestId("guardar-lista").click();
  await page.getByLabel("Nombre de la lista").fill(nombre);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: `«${nombre}» guardada` }),
  ).toBeVisible();
}

test("sin sesión: guardar dos listas, recargar, cargarlas y sumar sin bajar cantidades", async ({
  page,
}) => {
  await page.goto("/");
  await agregar(page, "aceite", 2);
  await guardar(page, "Quincena");
  // Vaciar y armar otra con menos aceite.
  await page.getByRole("button", { name: "Vaciar lista" }).click();
  await agregar(page, "arroz");
  await agregar(page, "aceite");
  await guardar(page, "Fiesta");

  await page.goto("/listas");
  await page.reload();
  await expect(page.getByTestId("lista-guardada-Quincena")).toBeVisible();
  await expect(page.getByTestId("lista-guardada-Fiesta")).toBeVisible();

  // Cargar repone las cantidades de «Quincena» (2 de aceite) y no deja el arroz.
  await page
    .getByTestId("lista-guardada-Quincena")
    .getByRole("button", { name: "Cargar" })
    .click();
  await page.goto("/");
  await expect(
    page.getByTestId("tarjeta-aceite").getByLabel(/^Quitar/),
  ).toBeEnabled();
  await expect(
    page.getByTestId("tarjeta-arroz").getByLabel(/^Quitar/),
  ).toBeDisabled();

  // Sumar «Fiesta» (1 de aceite, 1 de arroz): el aceite se queda en 2.
  await page.goto("/listas");
  await page
    .getByTestId("lista-guardada-Fiesta")
    .getByRole("button", { name: "Sumar a mi lista" })
    .click();
  await page.goto("/");
  await expect(
    page.getByTestId("tarjeta-aceite").getByLabel(/^Quitar/),
  ).toBeEnabled();
  await expect(page.getByTestId("tarjeta-aceite")).toContainText("2");
  await expect(
    page.getByTestId("tarjeta-arroz").getByLabel(/^Quitar/),
  ).toBeEnabled();
});

test("un nombre repetido no pisa la lista guardada", async ({ page }) => {
  await page.goto("/");
  await agregar(page, "aceite");
  await guardar(page, "Quincena");
  await page.getByTestId("guardar-lista").click();
  await page.getByLabel("Nombre de la lista").fill("  quincena ");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Ya tienes una lista" }),
  ).toBeVisible();
});

test("al iniciar sesión se fusionan las listas del dispositivo con la cuenta", async ({
  page,
}) => {
  await page.goto("/");
  await agregar(page, "aceite");
  await guardar(page, "Quincena");
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Unimos tus listas" }),
  ).toBeVisible();
  await page.goto("/listas");
  await expect(page.getByTestId("lista-guardada-Quincena")).toBeVisible();
});
