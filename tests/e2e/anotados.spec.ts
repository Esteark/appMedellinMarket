import { expect, test } from "@playwright/test";

const CELDA = "celda-aceite-d1";
const ANOTADO = 8500; // menor que el automático de D1 (8.900) y de hoy

const digitos = (s: string | null) => Number((s ?? "").replace(/\D/g, ""));

test("un anotado menor y más reciente reemplaza al automático y se ve en azul", async ({
  page,
}) => {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  await page.goto("/anotados");
  await page.getByTestId(CELDA).click();
  await page
    .getByLabel(/^Precio de Aceite de girasol en D1/)
    .fill(String(ANOTADO));
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Precio anotado" }),
  ).toBeVisible();
  const celda = page.getByTestId(CELDA);
  await expect(celda).toHaveAttribute("data-origen", "anotado");
  await expect(celda).toHaveAttribute("data-minimo", "true");

  await page.goto("/");
  const precio = page.getByTestId("tarjeta-aceite").locator("[data-minimo]");
  await expect(precio).toHaveAttribute("data-origen", "anotado");
  expect(digitos(await precio.textContent())).toBe(ANOTADO);
  // --anot-ink en modo claro (#1D4ED8).
  await expect(precio).toHaveCSS("color", "rgb(29, 78, 216)");

  // Limpieza: el autor puede revertir su anotado y vuelve el automático.
  await page.goto("/anotados");
  await page.getByTestId(CELDA).click();
  await page.getByRole("button", { name: "Quitar anotado" }).click();
  await expect(page.getByTestId(CELDA)).not.toHaveAttribute(
    "data-origen",
    "anotado",
  );
});

test("sin sesión, pulsar una celda invita a ingresar y no abre el editor", async ({
  page,
}) => {
  await page.goto("/anotados");
  await page.getByTestId(CELDA).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Inicia sesión para anotar" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar" })).toHaveCount(0);
});
