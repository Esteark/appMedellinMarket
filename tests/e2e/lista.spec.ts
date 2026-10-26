import { expect, test } from "@playwright/test";

const PRODUCTOS = ["aceite", "aguacate"];

test("la lista local se une a la cuenta al registrarse y sobrevive sin localStorage", async ({
  page,
}) => {
  await page.goto("/");
  for (const id of PRODUCTOS)
    await page
      .getByTestId(`tarjeta-${id}`)
      .getByRole("button", { name: /^Agregar/ })
      .click();

  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByTestId("usuario")).toBeVisible();
  // El toast sale después de guardar en `listas`.
  await expect(
    page.getByRole("status").filter({ hasText: "Unimos la lista" }),
  ).toBeVisible();

  // Sin la copia local, la lista tiene que volver desde la base.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  for (const id of PRODUCTOS)
    await expect(
      page
        .getByTestId(`tarjeta-${id}`)
        .getByRole("button", { name: /^Quitar/ }),
    ).toBeEnabled();
});
