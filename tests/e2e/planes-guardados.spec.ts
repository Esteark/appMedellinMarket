import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

const RESUMEN = "Mis presupuestos guardados";

async function abrirPresupuestos(page: Page) {
  await page.locator("summary").filter({ hasText: RESUMEN }).click();
}

async function registrar(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-plan-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

test("sin sesión, guardar, cargar y eliminar un presupuesto con nombre", async ({
  page,
}) => {
  await page.goto("/hogar");
  await abrirPresupuestos(page);

  const nombre = page.getByLabel("Guardar el presupuesto actual como");
  await nombre.fill("Quincena");
  await page.getByRole("button", { name: "Guardar actual" }).click();
  await expect(page.locator("summary").filter({ hasText: RESUMEN })).toHaveText(
    `${RESUMEN} (1)`,
  );

  await page.getByLabel("Presupuesto de Carnes").fill("500000");
  await page.getByRole("button", { name: "Cargar" }).click();
  await expect(page.getByLabel("Presupuesto de Carnes")).toHaveValue("400000");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "«Quincena» es ahora tu presupuesto activo." }),
  ).toBeVisible();

  await page.reload();
  await abrirPresupuestos(page);
  await expect(page.locator("summary").filter({ hasText: RESUMEN })).toHaveText(
    `${RESUMEN} (1)`,
  );
  await expect(page.getByRole("option", { name: /Quincena/ })).toBeAttached();

  await page.getByRole("button", { name: "Eliminar" }).click();
  await expect(page.locator("summary").filter({ hasText: RESUMEN })).toHaveText(
    `${RESUMEN} (0)`,
  );
  await expect(page.getByText("Todavía no has guardado copias.")).toBeVisible();
});

test("con sesión, el presupuesto guardado vuelve aunque se borre el dispositivo", async ({
  page,
}) => {
  await registrar(page);
  await page.goto("/hogar");
  await abrirPresupuestos(page);

  await page.getByLabel("Presupuesto de Carnes").fill("600000");
  await page
    .getByLabel("Guardar el presupuesto actual como")
    .fill("Con visitas");
  await page.getByRole("button", { name: "Guardar actual" }).click();
  await expect(page.locator("summary").filter({ hasText: RESUMEN })).toHaveText(
    `${RESUMEN} (1)`,
  );
  await page.waitForLoadState("networkidle");

  await page.evaluate(() => {
    localStorage.removeItem("mercado-medellin:planes:hogar");
    localStorage.removeItem("mercado-medellin:plan:hogar");
  });
  await page.reload();
  await abrirPresupuestos(page);

  await expect(page.locator("summary").filter({ hasText: RESUMEN })).toHaveText(
    `${RESUMEN} (1)`,
  );
  await page.getByRole("button", { name: "Cargar" }).click();
  await expect(page.getByLabel("Presupuesto de Carnes")).toHaveValue("600000");
});
