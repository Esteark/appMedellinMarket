import { expect, test } from "@playwright/test";

const CLAVE = "mercado-medellin:lista";
const guardada = (page: import("@playwright/test").Page) =>
  page.evaluate(
    (k) => Object.keys(JSON.parse(localStorage.getItem(k) ?? "{}")).length,
    CLAVE,
  );

test("Usar como mi lista carga los 28 ítems de Hogar y Deshacer los quita", async ({
  page,
}) => {
  await page.goto("/hogar");
  await expect(page.getByTestId("items-hogar").locator("li")).toHaveCount(28);
  await page.getByTestId("plan-hogar-reemplazar").click();
  const aviso = page.getByRole("status").filter({ hasText: "28 productos" });
  await expect(aviso).toBeVisible();
  expect(await guardada(page)).toBe(28);
  await expect(page.getByTestId("compara")).toBeVisible();

  await aviso.getByRole("button", { name: "Deshacer" }).click();
  expect(await guardada(page)).toBe(0);
  await expect(page.getByTestId("sin-lista")).toBeVisible();
});

test("Sumar a mi lista conserva lo que ya había", async ({ page }) => {
  await page.goto("/dieta");
  await page.getByTestId("plan-semana-reemplazar").click();
  const base = await guardada(page);
  expect(base).toBeGreaterThan(0);
  await page.getByTestId("plan-semana-sumar").click();
  expect(await guardada(page)).toBe(base);
  await expect(
    page.getByRole("status").filter({ hasText: "Sumamos" }),
  ).toBeVisible();
});
