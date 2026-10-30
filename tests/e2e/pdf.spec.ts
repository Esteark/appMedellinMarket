import { readFileSync } from "node:fs";
import { expect, test } from "./ayuda";

test("Descargar PDF baja lista-mercado-<fecha>.pdf con un PDF de verdad", async ({
  page,
}) => {
  await page.goto("/");
  // Sin productos no hay lista, y por tanto tampoco botón.
  await expect(page.getByTestId("descargar-pdf")).toHaveCount(0);
  for (const id of ["aceite", "aguacate", "pollo"])
    await page
      .getByTestId(`tarjeta-${id}`)
      .getByRole("button", { name: /^Agregar/ })
      .click();

  const [descarga] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("descargar-pdf").click(),
  ]);
  expect(descarga.suggestedFilename()).toMatch(
    /^lista-mercado-\d{4}-\d{2}-\d{2}\.pdf$/,
  );
  const ruta = await descarga.path();
  const bytes = readFileSync(ruta);
  expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(1500);
  // El botón vuelve a quedar disponible (sin spinner pegado).
  await expect(page.getByTestId("descargar-pdf")).toBeEnabled();
});
