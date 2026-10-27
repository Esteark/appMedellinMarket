import { expect, test } from "@playwright/test";

test("el gráfico de total por tienda reacciona a la tienda elegida en los chips", async ({
  page,
}) => {
  await page.goto("/");
  for (const id of ["aceite", "aguacate"])
    await page
      .getByTestId(`tarjeta-${id}`)
      .getByRole("button", { name: /^Agregar/ })
      .click();

  await page.getByRole("button", { name: "Ver gráficos" }).click();
  const grafico = page.getByTestId("grafico-barras");
  await expect(grafico).toBeVisible();
  // Todas las tiendas con algún precio de la lista, no solo las que lo tienen todo.
  expect(
    Number(await grafico.getAttribute("data-barras")),
  ).toBeGreaterThanOrEqual(2);
  await expect(grafico).not.toHaveAttribute("aria-label", /resaltada/);

  const chips = page.getByTestId("chips-tiendas");
  await chips.getByRole("button", { name: "Euro" }).click();
  await expect(grafico).toHaveAttribute("aria-label", /resaltada: Euro/);
  await chips.getByRole("button", { name: "D1" }).click();
  await expect(grafico).toHaveAttribute("aria-label", /resaltada: D1/);
  await chips.getByRole("button", { name: "Más barato" }).click();
  await expect(grafico).not.toHaveAttribute("aria-label", /resaltada/);
});
