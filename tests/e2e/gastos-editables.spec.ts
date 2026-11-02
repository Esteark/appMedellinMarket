import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

async function abrirFormulario(page: Page) {
  await page.goto("/presupuesto");
  await page.getByRole("button", { name: "Agregar gasto" }).first().click();
}

const caret = (campo: ReturnType<Page["getByLabel"]>) =>
  campo.evaluate((el) => (el as HTMLInputElement).selectionStart);

/** Montos guardados en el dispositivo (sin formato) de todos los meses. */
const montosGuardados = (page: Page) =>
  page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith("mercado-medellin:gastos:"))
      .flatMap((k) =>
        (
          JSON.parse(localStorage.getItem(k) ?? "[]") as { monto: number }[]
        ).map((g) => g.monto),
      ),
  );

test.describe("campo de moneda en /presupuesto", () => {
  test("escribir 3000 muestra 3.000 y se guarda 3000", async ({ page }) => {
    await abrirFormulario(page);
    const monto = page.getByLabel("Monto total");
    await monto.pressSequentially("3000");
    await expect(monto).toHaveValue("3.000");

    await page.getByRole("button", { name: "Agregar gasto" }).last().click();
    await expect(monto).toHaveValue("");
    expect(await montosGuardados(page)).toContain(3000);
    await expect(page.getByRole("cell", { name: "$ 3.000" })).toBeVisible();
  });

  test("las decenas, centenas y millones llevan sus puntos", async ({
    page,
  }) => {
    await abrirFormulario(page);
    const monto = page.getByLabel("Monto total");
    for (const [escrito, visto] of [
      ["30000", "30.000"],
      ["300000", "300.000"],
      ["1250000", "1.250.000"],
    ] as const) {
      await monto.fill("");
      await monto.pressSequentially(escrito);
      await expect(monto).toHaveValue(visto);
    }
    // Pegar con formato o sin él da lo mismo, y una letra no entra.
    await monto.fill("$ 1.250.000");
    await expect(monto).toHaveValue("1.250.000");
    await monto.fill("12ab3");
    await expect(monto).toHaveValue("123");
    // El tope es de 50.000.000.
    await monto.fill("999999999");
    await expect(monto).toHaveValue("50.000.000");
  });

  test("escribir en medio no manda el cursor al final", async ({ page }) => {
    await abrirFormulario(page);
    const monto = page.getByLabel("Monto total");
    await monto.pressSequentially("3000");
    await monto.press("Home");
    await monto.press("ArrowRight");
    await monto.press("5");
    await expect(monto).toHaveValue("35.000");
    expect(await caret(monto)).toBe(2);
    // Una letra no cambia el valor ni mueve el cursor.
    await monto.press("x");
    await expect(monto).toHaveValue("35.000");
    expect(await caret(monto)).toBe(2);
  });

  test("precio por unidad × cantidad calcula el monto con formato", async ({
    page,
  }) => {
    await abrirFormulario(page);
    await page.getByLabel("Cantidad").fill("2.5");
    // La cantidad de unidades no lleva puntos de miles y admite decimales.
    await expect(page.getByLabel("Cantidad")).toHaveValue("2.5");
    await page
      .getByLabel("Precio por unidad", { exact: true })
      .pressSequentially("2000");
    await expect(
      page.getByLabel("Precio por unidad", { exact: true }),
    ).toHaveValue("2.000");
    await expect(page.getByLabel("Monto total")).toHaveValue("5.000");
  });

  test("precio total al cambiar a total", async ({ page }) => {
    await abrirFormulario(page);
    await page.getByRole("button", { name: "Cambiar a total" }).click();
    await page
      .getByLabel("Precio total", { exact: true })
      .pressSequentially("12500");
    await expect(page.getByLabel("Precio total", { exact: true })).toHaveValue(
      "12.500",
    );
    await expect(page.getByLabel("Monto total")).toHaveValue("12.500");
  });

  test("el presupuesto por rubro del seguimiento lleva puntos y se guarda como entero", async ({
    page,
  }) => {
    await page.goto("/presupuesto");
    await page.getByRole("button", { name: "Seguimiento por rubro" }).click();
    const carnes = page.getByLabel("Presupuesto de Carnes");
    await carnes.fill("");
    await carnes.pressSequentially("200000");
    await expect(carnes).toHaveValue("200.000");
    await page.reload();
    await page.getByRole("button", { name: "Seguimiento por rubro" }).click();
    await expect(page.getByLabel("Presupuesto de Carnes")).toHaveValue(
      "200.000",
    );
  });
});
