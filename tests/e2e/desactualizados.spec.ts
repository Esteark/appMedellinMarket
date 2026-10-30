import { expect, test } from "./ayuda";

test("un precio anotado viejo avisa que puede haber cambiado y el encabezado enlaza las tiendas por anotados", async ({
  page,
}) => {
  // PriceSmart no tiene consulta automática: su precio solo cambia con anotados y queda viejo.
  await page.goto("/producto/aguacate");
  await expect(page.getByTestId("viejo-pricesmart")).toContainText(
    "puede haber cambiado",
  );

  const manuales = page.getByTestId("tiendas-manuales");
  await expect(manuales).toHaveAttribute("href", "/anotados");
  await expect(manuales).toContainText("tiendas por anotados");
});
