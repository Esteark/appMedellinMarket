import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { esperarContenido, expect, test } from "./ayuda";

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

const digitos = (t: string | null) => Number((t ?? "").replace(/\D/g, ""));

async function registrar(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-rub-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

/** Agrega «Mascotas» con $50.000 y le asigna el grupo Mecato. */
async function mascotasConMecato(page: Page) {
  const editable = page.getByTestId("presupuesto-editable");
  await editable.getByLabel("Nombre del rubro nuevo").fill("Mascotas");
  await editable.getByLabel("Monto del rubro nuevo").fill("50000");
  await editable.getByRole("button", { name: "Agregar rubro" }).click();
  const fila = page.getByTestId("rubro-Mascotas");
  await fila.getByRole("button", { name: "Grupos" }).click();
  await fila.getByRole("button", { name: /^Mecato/ }).click();
  await expect(fila).toContainText("Cuenta: Mecato");
}

for (const ruta of RUTAS) {
  test(`la comparación en ${ruta} cuenta el gasto de Mecato en «Mascotas»`, async ({
    page,
  }) => {
    // Un producto de Mecato en la lista del dispositivo.
    await page.goto("/antojos");
    await page
      .getByTestId("tarjeta-arequipe")
      .getByRole("button", { name: /^Agregar/ })
      .click();

    await page.goto(ruta);
    await mascotasConMecato(page);
    const tabla = page.getByTestId("compara");
    await expect(tabla).toBeVisible();
    const gasto = async (rubro: string) => {
      const celdas = tabla
        .getByRole("row")
        .filter({ hasText: rubro })
        .first()
        .getByRole("cell");
      return digitos(await celdas.nth(2).textContent());
    };
    await expect.poll(() => gasto("Mascotas")).toBeGreaterThan(0);
    // «Mecato» ya no cuenta el grupo: si su fila sigue (en Hogar tiene presupuesto), su gasto es $0.
    const filaMecato = tabla.getByRole("row").filter({ hasText: /^Mecato/ });
    if (await filaMecato.count())
      expect(
        digitos(await filaMecato.getByRole("cell").nth(2).textContent()),
      ).toBe(0);
  });
}

test("con sesión, rubros, orden y grupos vuelven de la cuenta aunque se borre el dispositivo", async ({
  page,
}) => {
  await registrar(page);
  await page.goto("/hogar");
  await esperarContenido(page);
  await page.waitForLoadState("networkidle");
  await mascotasConMecato(page);
  await page
    .getByTestId("rubro-Mascotas")
    .getByRole("button", { name: "Subir Mascotas" })
    .click();
  const antes = await orden(page);
  await expect(page.getByTestId("estado-guardado")).toHaveText(
    "Guardado en tu cuenta",
  );

  await page.evaluate(() =>
    localStorage.removeItem("mercado-medellin:plan:hogar"),
  );
  await page.reload();
  await esperarContenido(page);
  const fila = page.getByTestId("rubro-Mascotas");
  await expect(fila.getByLabel("Presupuesto de Mascotas")).toHaveValue("50000");
  await expect(fila).toContainText("Cuenta: Mecato");
  expect(await orden(page)).toEqual(antes);
});

for (const ruta of RUTAS) {
  test(`${ruta}: axe sin violaciones serias ni críticas y sin desplazamiento horizontal en 390 px`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(ruta);
    // Un rubro con sus grupos abiertos es la pantalla más cargada del editor.
    await page
      .getByTestId("rubro-Carnes")
      .getByRole("button", { name: "Grupos" })
      .click();
    await expect(
      page.getByText("Productos que cuenta este rubro"),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const graves = violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      graves.map((v) => ({ id: v.id, nodos: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  });
}
