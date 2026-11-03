import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

const digitos = (s: string) => Number(s.replace(/\D/g, ""));

/** Mes actual (hora de Bogotá, UTC-5) y el siguiente, como `AAAA-MM`. */
function meses() {
  const hoy = new Date(Date.now() - 5 * 3_600_000);
  const sig = new Date(
    Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 1),
  );
  const f = (d: Date) => d.toISOString().slice(0, 7);
  return { actual: f(hoy), siguiente: f(sig) };
}

async function seguimiento(page: Page) {
  await page.goto("/presupuesto");
  await page.getByRole("button", { name: "Seguimiento por rubro" }).click();
  return page.getByLabel("Presupuesto de Carnes");
}

test("el presupuesto por rubro es por mes, vive en la cuenta y deja historial", async ({
  page,
  browser,
}, testInfo) => {
  const correo = `e2e-${Date.now()}@ejemplo.test`;
  const clave = "clave-e2e-segura";
  const { actual, siguiente } = meses();
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel(/^Contraseña/).fill(clave);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  // Fijar un monto lo guarda; el historial lo muestra cuando llega a la cuenta (guarda con un breve retraso).
  let carnes = await seguimiento(page);
  await carnes.fill("600000");
  const historial = page.getByTestId("historial-presupuesto");
  await expect(async () => {
    // Salir y volver a la pestaña vuelve a pedir el historial.
    await page.getByRole("button", { name: "Resumen", exact: true }).click();
    await page.getByRole("button", { name: "Histórico", exact: true }).click();
    await expect(historial).toContainText("Carnes: nuevo", { timeout: 1000 });
  }).toPass();

  // Recargar conserva el monto.
  carnes = await seguimiento(page);
  await expect
    .poll(async () => digitos(await carnes.inputValue()))
    .toBe(600000);

  // Otro navegador sin nada guardado ve el mismo presupuesto: viene de la cuenta.
  const otro = await browser.newContext({
    storageState: testInfo.project.use.storageState,
  });
  const pagina = await otro.newPage();
  await pagina.goto("/ingresar");
  await pagina.getByLabel("Correo").fill(correo);
  await pagina.getByLabel(/^Contraseña/).fill(clave);
  await pagina.getByRole("button", { name: "Ingresar" }).click();
  await expect(pagina.getByTestId("usuario")).toBeVisible();
  const carnesOtro = await seguimiento(pagina);
  await expect
    .poll(async () => digitos(await carnesOtro.inputValue()))
    .toBe(600000);
  await otro.close();

  // Un mes sin presupuesto empieza con el del mes anterior, y editarlo no cambia el anterior.
  const mes = page.locator('input[type="month"]');
  await mes.fill(siguiente);
  await expect(page.getByTestId("nota-heredado")).toBeVisible();
  await expect
    .poll(async () => digitos(await carnes.inputValue()))
    .toBe(600000);
  await carnes.fill("700000");
  await expect(page.getByTestId("nota-heredado")).toHaveCount(0);
  await mes.fill(actual);
  await expect
    .poll(async () => digitos(await carnes.inputValue()))
    .toBe(600000);
  await mes.fill(siguiente);
  await expect
    .poll(async () => digitos(await carnes.inputValue()))
    .toBe(700000);
});
