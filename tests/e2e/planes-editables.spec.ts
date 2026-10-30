import type { Page } from "@playwright/test";
import { esperarContenido, expect, test } from "./ayuda";

const PERSONAS = "¿Entre cuántas personas?";

async function registrar(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

test("sin sesión, cambiar el plan y recargar lo conserva", async ({ page }) => {
  await page.goto("/hogar");
  await esperarContenido(page);
  await page.waitForLoadState("networkidle");
  await page.getByLabel(PERSONAS).fill("3");
  await expect(page.getByTestId("estado-guardado")).toHaveText(
    "Guardado en este dispositivo",
  );
  await page.reload();
  await esperarContenido(page);
  await esperarContenido(page);
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel(PERSONAS)).toHaveValue("3");

  // Los ítems tienen stepper y «Volver al sugerido» confirma antes de borrar.
  await page.getByRole("button", { name: "Volver al sugerido" }).click();
  await page.getByRole("button", { name: "Sí, volver" }).click();
  await expect(page.getByLabel(PERSONAS)).toHaveValue("6");
});

test("con sesión, el plan se guarda en la cuenta y vuelve aunque se borre el dispositivo", async ({
  page,
}) => {
  await registrar(page);
  await page.goto("/dieta");
  await esperarContenido(page);
  await page.waitForLoadState("networkidle");
  await page.getByLabel(PERSONAS).fill("4");
  await expect(page.getByTestId("estado-guardado")).toHaveText(
    "Guardado en tu cuenta",
  );
  await page.evaluate(() =>
    localStorage.removeItem("mercado-medellin:plan:dieta"),
  );
  await page.reload();
  await esperarContenido(page);
  await expect(page.getByLabel(PERSONAS)).toHaveValue("4");
});

test("un plan local más nuevo que el de la cuenta aparece como restaurado y se puede deshacer", async ({
  page,
}) => {
  await registrar(page);
  await page.goto("/hogar");
  await esperarContenido(page);
  await page.waitForLoadState("networkidle");
  await page.getByLabel(PERSONAS).fill("4");
  await expect(page.getByTestId("estado-guardado")).toHaveText(
    "Guardado en tu cuenta",
  );
  // Un cambio hecho sin conexión: local más reciente que lo que hay en la cuenta.
  await page.evaluate(() => {
    const k = "mercado-medellin:plan:hogar";
    const plan = JSON.parse(localStorage.getItem(k) ?? "{}");
    plan.personas = 9;
    plan.actualizada = new Date(Date.now() + 60_000).toISOString();
    localStorage.setItem(k, JSON.stringify(plan));
  });
  await page.reload();
  await esperarContenido(page);
  await expect(
    page.getByRole("status").filter({ hasText: "Restauramos el plan Hogar" }),
  ).toBeVisible();
  await expect(page.getByLabel(PERSONAS)).toHaveValue("9");
  await page.getByRole("button", { name: "Deshacer" }).click();
  await expect(page.getByLabel(PERSONAS)).toHaveValue("4");
});
