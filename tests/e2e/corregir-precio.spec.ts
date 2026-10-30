import { expect, test } from "./ayuda";

const digitos = (s: string | null) => Number((s ?? "").replace(/\D/g, ""));

test("sin sesión, el lápiz de la tarjeta invita a ingresar", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByTestId("tarjeta-aceite")
    .getByRole("button", { name: /^Corregir precio/ })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Inicia sesión para anotar" }),
  ).toBeVisible();
});

test("con sesión, corregir un precio lo marca como corregido a mano y quitarlo vuelve al automático", async ({
  page,
}) => {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  await page.goto("/");
  const tarjeta = page.getByTestId("tarjeta-aceite");
  await tarjeta.getByRole("button", { name: /^Corregir precio/ }).click();
  const hoja = page.getByRole("dialog");
  await hoja.getByLabel("Tienda").selectOption("d1");
  await hoja.getByLabel("Precio").fill("7000");
  await hoja.getByRole("button", { name: "Guardar" }).click();

  await expect(tarjeta.getByTestId("corregido")).toContainText(
    "corregido a mano",
  );
  expect(digitos(await tarjeta.locator("[data-minimo]").textContent())).toBe(
    7000,
  );

  await tarjeta.getByRole("button", { name: /^Corregir precio/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Quitar corrección" })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Quitaste tu corrección" }),
  ).toBeVisible();
  await expect(tarjeta.getByTestId("corregido")).toHaveCount(0);
});
