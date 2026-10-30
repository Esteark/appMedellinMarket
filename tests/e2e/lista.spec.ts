import { expect, test } from "./ayuda";

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
  await page.evaluate(() => localStorage.removeItem("mercado-medellin:lista"));
  await page.reload();
  for (const id of PRODUCTOS)
    await expect(
      page
        .getByTestId(`tarjeta-${id}`)
        .getByRole("button", { name: /^Quitar/ }),
    ).toBeEnabled();

  // El menú de la cuenta cierra la sesión.
  await page.getByTestId("usuario").click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  await expect(page.getByTestId("usuario")).toHaveCount(0);
});
