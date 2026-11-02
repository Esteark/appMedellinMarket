import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

const RUTAS = ["/hogar", "/dieta"] as const;

const orden = (page: Page) =>
  page
    .locator('li[data-testid^="rubro-"]')
    .evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-testid")?.replace("rubro-", "")),
    );

for (const ruta of RUTAS) {
  test.describe(`rubros editables en ${ruta}`, () => {
    test("agregar, asignar un grupo, renombrar y reordenar; todo se conserva al recargar", async ({
      page,
    }) => {
      await page.goto(ruta);
      const editable = page.getByTestId("presupuesto-editable");

      // Agregar un rubro con su monto: va al final y suma al total.
      await editable.getByLabel("Nombre del rubro nuevo").fill("Mascotas");
      await editable.getByLabel("Monto del rubro nuevo").fill("50000");
      await editable.getByRole("button", { name: "Agregar rubro" }).click();
      const fila = page.getByTestId("rubro-Mascotas");
      await expect(fila).toBeVisible();
      await expect(fila.getByLabel("Presupuesto de Mascotas")).toHaveValue(
        "50000",
      );
      expect((await orden(page)).at(-1)).toBe("Mascotas");

      // Un nombre repetido (sin tildes ni mayúsculas) se rechaza junto al campo.
      await editable.getByLabel("Nombre del rubro nuevo").fill("lacteos");
      await editable.getByRole("button", { name: "Agregar rubro" }).click();
      await expect(editable.getByRole("alert")).toContainText("Ya tienes");

      // Marcar el grupo Mecato lo saca de «Mecato» y lo dice.
      await fila.getByRole("button", { name: "Grupos" }).click();
      await fila.getByRole("button", { name: /^Mecato/ }).click();
      await expect(
        page.getByText("pasó de «Mecato» a «Mascotas»"),
      ).toBeVisible();
      await expect(
        fila.getByRole("button", { name: /^Mecato/ }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(fila).toContainText("Cuenta: Mecato");

      // Renombrar conserva monto y grupos.
      await fila.getByRole("button", { name: "Renombrar" }).click();
      await fila.getByLabel("Nuevo nombre de Mascotas").fill("Animales");
      await fila.getByRole("button", { name: "Guardar" }).click();
      const renombrada = page.getByTestId("rubro-Animales");
      await expect(renombrada).toBeVisible();
      await expect(
        renombrada.getByLabel("Presupuesto de Animales"),
      ).toHaveValue("50000");
      await expect(renombrada).toContainText("Cuenta: Mecato");

      // Subir con ↑ cambia el orden y sobrevive a recargar.
      const antes = await orden(page);
      await renombrada.getByRole("button", { name: "Subir Animales" }).click();
      const despues = await orden(page);
      expect(despues.indexOf("Animales")).toBe(antes.indexOf("Animales") - 1);
      await page.waitForTimeout(300);
      await page.reload();
      expect(await orden(page)).toEqual(despues);
      await expect(page.getByTestId("rubro-Animales")).toContainText(
        "Cuenta: Mecato",
      );
    });

    test("quitar un rubro de fábrica pide confirmación y «Deshacer» lo restaura", async ({
      page,
    }) => {
      await page.goto(ruta);
      const campo = page.getByLabel("Presupuesto de Carnes");
      const monto = await campo.inputValue();
      const posicion = (await orden(page)).indexOf("Carnes");

      await page.getByRole("button", { name: "Quitar Carnes" }).click();
      await expect(page.getByText("¿Quitar «Carnes»?")).toBeVisible();
      // «No» cancela sin quitar.
      await page.getByRole("button", { name: "No", exact: true }).click();
      await expect(page.getByTestId("rubro-Carnes")).toBeVisible();

      await page.getByRole("button", { name: "Quitar Carnes" }).click();
      await page.getByRole("button", { name: "Sí, quitar" }).click();
      await expect(page.getByTestId("rubro-Carnes")).toHaveCount(0);
      // «Otros» no se renombra ni se quita.
      await expect(
        page.getByRole("button", { name: "Quitar Otros" }),
      ).toHaveCount(0);

      await page.getByRole("button", { name: "Deshacer" }).click();
      await expect(page.getByTestId("rubro-Carnes")).toBeVisible();
      await expect(campo).toHaveValue(monto);
      expect((await orden(page)).indexOf("Carnes")).toBe(posicion);
    });
  });
}
