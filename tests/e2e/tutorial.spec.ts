import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./ayuda";

// Estado limpio: la configuración global marca el tutorial como visto para no estorbar al resto.
test.use({ storageState: { cookies: [], origins: [] } });

const CLAVE = "mercado-medellin:tutorial:v1";
const dialogo = (p: import("@playwright/test").Page) =>
  p.getByTestId("tutorial");

test("la primera visita abre el tutorial, Siguiente avanza, Esc lo cierra y recargar no lo repite", async ({
  page,
}) => {
  await page.goto("/");
  await expect(dialogo(page)).toBeVisible();
  const contador = page.getByTestId("tutorial-contador");
  await expect(contador).toContainText("Paso 1 de");
  // La pantalla se oscurece alrededor del foco.
  await expect(page.getByTestId("tutorial-foco")).toHaveCSS(
    "box-shadow",
    /rgba\(15, 23, 42, 0\.55\)/,
  );
  await dialogo(page).getByRole("button", { name: "Siguiente" }).click();
  await expect(contador).toContainText("Paso 2 de");

  await page.keyboard.press("Escape");
  await expect(dialogo(page)).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(1500);
  await expect(dialogo(page)).toHaveCount(0);
});

test("la bombilla repite el tutorial, lo reinicia y ?tutorial=1 lo abre aunque ya esté visto", async ({
  page,
}) => {
  await page.goto("/");
  await expect(dialogo(page)).toBeVisible();
  await dialogo(page).getByRole("button", { name: "Saltar" }).click();
  await expect(dialogo(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Ayuda y tutorial" }).click();
  await page.getByRole("menuitem", { name: "Tutorial general" }).click();
  await expect(dialogo(page)).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Ayuda y tutorial" }).click();
  await page.getByRole("menuitem", { name: "Reiniciar tutorial" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Tutorial reiniciado" }),
  ).toBeVisible();
  expect(await page.evaluate((k) => localStorage.getItem(k), CLAVE)).toBeNull();
  await page.reload();
  await expect(dialogo(page)).toBeVisible();

  // Ya visto de nuevo, pero ?tutorial=1 lo abre igual.
  await page.keyboard.press("Escape");
  await page.goto("/?tutorial=1");
  await expect(dialogo(page)).toBeVisible();
});

test("en las pantallas de autenticación no aparece ni el tutorial ni la bombilla", async ({
  page,
}) => {
  await page.goto("/ingresar");
  await page.waitForTimeout(1500);
  await expect(dialogo(page)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ayuda y tutorial" }),
  ).toHaveCount(0);
});

test("accesibilidad: el foco no sale de la tarjeta, Esc devuelve el foco y axe no reporta nada grave", async ({
  page,
}) => {
  await page.goto("/");
  await expect(dialogo(page)).toBeVisible();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[data-testid="tutorial"]'),
      ),
    ).toBe(true);
  }
  const graves = (
    await new AxeBuilder({ page }).include('[data-testid="tutorial"]').analyze()
  ).violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(graves).toEqual([]);

  await page.keyboard.press("Escape");
  await expect(dialogo(page)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Ayuda y tutorial" }),
  ).toBeFocused();
});

test("con movimiento reducido los pasos cambian igual", async ({ browser }) => {
  const contexto = await browser.newContext({ reducedMotion: "reduce" });
  const page = await contexto.newPage();
  await page.goto("http://127.0.0.1:3100/");
  await expect(dialogo(page)).toBeVisible();
  await dialogo(page).getByRole("button", { name: "Siguiente" }).click();
  await expect(page.getByTestId("tutorial-contador")).toContainText(
    "Paso 2 de",
  );
  await contexto.close();
});
