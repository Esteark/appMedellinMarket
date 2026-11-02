import { expect, test } from "./ayuda";

test("el presupuestado sale de los montos por rubro y la unidad admite texto libre y chips", async ({
  page,
}) => {
  await page.goto("/presupuesto");
  await page.getByRole("button", { name: "Seguimiento por rubro" }).click();
  await page.getByLabel("Presupuesto de Carnes").fill("200000");
  await page.getByRole("button", { name: "Resumen", exact: true }).click();
  await expect(page.getByText("200.000").first()).toBeVisible();
  await expect(page.getByText(/Gastado ÷ \d+ días × \d+/)).toBeVisible();

  await page.getByRole("button", { name: "Agregar gasto" }).first().click();
  await page.getByLabel(/^Unidad/).fill("racimo");
  await expect(page.getByLabel(/^Unidad/)).toHaveValue("racimo");
  await page.getByRole("button", { name: "0.5", exact: true }).click();
  await expect(page.getByLabel("Cantidad")).toHaveValue("0.5");
});
