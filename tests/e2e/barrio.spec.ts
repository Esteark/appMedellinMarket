import { expect, test } from "@playwright/test";

test("sin sesión, la tienda de barrio empieza sin precios y el lápiz invita a ingresar", async ({
  page,
}) => {
  await page.goto("/anotados/barrio");
  await expect(page.getByTestId("barrio-progreso")).toContainText(
    "0/41 con precio",
  );
  await expect(
    page.getByTestId("barrio-pollo").getByTestId("barrio-precio"),
  ).toHaveText("sin dato");
  await page
    .getByRole("button", { name: /^Anotar precio de/ })
    .first()
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Inicia sesión para anotar" }),
  ).toBeVisible();

  // /anotados enlaza a la vista con el mismo progreso.
  await page.goto("/anotados");
  await expect(page.getByTestId("enlace-barrio")).toContainText(
    "0/41 con precio",
  );
});

test("con sesión: anotar un precio, recargar, quitarlo y agregar o quitar un producto", async ({
  page,
}) => {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  await page.goto("/anotados/barrio");
  await page.waitForLoadState("networkidle");
  const fila = page.getByTestId("barrio-pollo");
  await fila.getByRole("button", { name: /^Anotar precio de/ }).click();
  const hoja = page.getByRole("dialog");
  await hoja.getByLabel("Precio").fill("12000");
  await hoja.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByTestId("barrio-progreso")).toContainText(
    "1/41 con precio",
  );
  await expect(fila.getByTestId("barrio-precio")).not.toHaveText("sin dato");

  await page.reload();
  await expect(page.getByTestId("barrio-progreso")).toContainText(
    "1/41 con precio",
  );

  // Quitar la corrección vuelve a «sin dato» (limpia de paso lo que dejó la prueba).
  await fila.getByRole("button", { name: /^Anotar precio de/ }).click();
  await page.getByRole("button", { name: "Quitar corrección" }).click();
  await expect(page.getByTestId("barrio-progreso")).toContainText(
    "0/41 con precio",
  );
  await expect(fila.getByTestId("barrio-precio")).toHaveText("sin dato");

  // Agregar sube el total y quitar lo baja, sin borrar la fila.
  await page
    .getByLabel("Producto para agregar al catálogo de barrio")
    .selectOption("aguacate");
  await page.getByRole("button", { name: "Agregar producto" }).click();
  await expect(page.getByTestId("barrio-progreso")).toContainText(
    "0/42 con precio",
  );
  const nueva = page.getByTestId("barrio-aguacate");
  await nueva.getByRole("button", { name: /^Quitar/ }).click();
  await nueva.getByRole("button", { name: "Sí, quitar" }).click();
  await expect(page.getByTestId("barrio-progreso")).toContainText(
    "0/41 con precio",
  );
});
