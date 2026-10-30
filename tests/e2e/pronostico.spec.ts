import { expect, test } from "./ayuda";

test("una fruta muestra el chip del pronóstico y un producto de despensa no", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByTestId("tarjeta-aguacate").getByTestId("chip-pronostico"),
  ).toContainText("7 días");
  await expect(
    page.getByTestId("tarjeta-aceite").getByTestId("chip-pronostico"),
  ).toHaveCount(0);
});

test("el detalle dice «estimación estadística», muestra un rango y nunca un solo número", async ({
  page,
}) => {
  await page.goto("/producto/aguacate");
  const bloque = page.getByTestId("pronostico");
  await expect(bloque).toContainText("Estimación estadística, no un precio");
  await expect(bloque).toContainText("Rango esperado");
  await expect(bloque).toContainText("confianza");
  await page.goto("/producto/aceite");
  await expect(page.getByTestId("pronostico")).toHaveCount(0);
});
