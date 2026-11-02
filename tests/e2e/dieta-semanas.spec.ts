import { expect, test } from "./ayuda";

test("planificador: agregar a una comida, repetir en los 7 días, semana 5 y recargar", async ({
  page,
}) => {
  await page.goto("/dieta");
  await page.getByRole("button", { name: "Empezar el planificador" }).click();
  await expect(page.getByTestId("planificador")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Semana \d$/ })).toHaveCount(
    4,
  );

  const almuerzo = page.getByTestId("comida-almuerzo");
  await almuerzo
    .getByLabel(/^Producto para agregar a Almuerzo/)
    .selectOption({ index: 1 });
  await almuerzo.getByRole("button", { name: /^Agregar a Almuerzo/ }).click();
  await expect(
    almuerzo.getByRole("button", { name: /^Quitar uno de/ }),
  ).toHaveCount(1);

  // Sin datos en otros días no pide confirmación.
  await almuerzo
    .getByRole("button", { name: "Repetir en todos los días" })
    .click();
  await page.getByRole("button", { name: "Martes" }).click();
  await expect(
    almuerzo.getByRole("button", { name: /^Quitar uno de/ }),
  ).toHaveCount(1);

  // Con datos distintos en otro día sí pide confirmación.
  await almuerzo.getByRole("button", { name: /^Agregar uno de/ }).click();
  await page.getByRole("button", { name: "Lunes" }).click();
  await almuerzo
    .getByRole("button", { name: "Repetir en todos los días" })
    .click();
  await expect(page.getByText("Otros días tienen datos")).toBeVisible();
  await page.getByRole("button", { name: "Sí, reemplazar" }).click();

  // Semana 5: se agrega y se quita con confirmación; las 4 primeras no cambian.
  await page.getByRole("button", { name: "Agregar semana 5" }).click();
  await expect(
    page.getByRole("button", { name: "Semana 5", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Quitar semana 5" }).click();
  await page.getByRole("button", { name: "Sí, quitar" }).click();
  await expect(
    page.getByRole("button", { name: "Semana 5", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Agregar semana 5" }).click();

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Semana 5", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByTestId("comida-almuerzo")
      .getByRole("button", { name: /^Quitar uno de/ }),
  ).toHaveCount(1);
});

test("en móvil se ve una comida a la vez y no hay desplazamiento horizontal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dieta");
  await page.getByRole("button", { name: "Empezar el planificador" }).click();
  await expect(page.getByTestId("comida-almuerzo")).toBeVisible();
  await expect(page.getByTestId("comida-desayuno")).toBeHidden();
  await page.getByRole("button", { name: "Desayuno", exact: true }).click();
  await expect(page.getByTestId("comida-desayuno")).toBeVisible();
  const ancho = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(ancho).toBeLessThanOrEqual(0);
});

test("compras de la semana: usar como mi lista, sumar y comparar con los rubros", async ({
  page,
}) => {
  await page.goto("/dieta");
  await page.getByRole("button", { name: "Empezar el planificador" }).click();
  const almuerzo = page.getByTestId("comida-almuerzo");
  await almuerzo
    .getByLabel(/^Producto para agregar a Almuerzo/)
    .selectOption({ index: 1 });
  await almuerzo.getByRole("button", { name: /^Agregar a Almuerzo/ }).click();

  const compras = page.getByTestId("compras-semana");
  await expect(
    compras.getByRole("heading", { name: "Compras de la semana 1" }),
  ).toBeVisible();
  await compras.getByRole("button", { name: "Usar como mi lista" }).click();
  await compras.getByRole("button", { name: "Sumar a mi lista" }).click();

  // Con semanas, la comparación usa las compras del mes y no la lista.
  await expect(page.getByTestId("compara")).toBeVisible();
  await expect(page.getByTestId("sin-lista")).toHaveCount(0);
});
