import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
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

/** Agrega un gasto manual y devuelve la fila de la tabla. */
async function agregarGastoManual(page: Page, monto: string, nota: string) {
  await abrirFormulario(page);
  await page.getByLabel("Monto total").pressSequentially(monto);
  await page.getByLabel("Nota / detalle").fill(nota);
  await page.getByRole("button", { name: "Agregar gasto" }).last().click();
  const fila = page
    .getByTestId("tabla-gastos")
    .getByRole("row")
    .filter({ hasText: nota });
  await expect(fila).toBeVisible();
  return fila;
}

const tabla = (page: Page) => page.getByTestId("tabla-gastos");

test.describe("tabla de gastos editable", () => {
  test("sin sesión: editar monto, rubro y nota en la fila y recargar lo conserva", async ({
    page,
  }) => {
    const nota = `gasto ${Date.now()}`;
    const fila = await agregarGastoManual(page, "3000", nota);
    await fila.getByRole("button", { name: /^Editar / }).click();

    // La fila se vuelve campos; el monto lleva puntos.
    const t = tabla(page);
    await expect(t.getByLabel("Monto", { exact: true })).toHaveValue("3.000");
    await t.getByLabel("Monto", { exact: true }).fill("");
    await t.getByLabel("Monto", { exact: true }).pressSequentially("45000");
    await expect(t.getByLabel("Monto", { exact: true })).toHaveValue("45.000");
    await t.getByLabel("Rubro", { exact: true }).selectOption("Aseo");
    await t.getByLabel("Nota", { exact: true }).fill(`${nota} editado`);
    await t.getByRole("button", { name: "Guardar" }).click();

    const editada = t.getByRole("row").filter({ hasText: `${nota} editado` });
    await expect(editada).toContainText("Aseo");
    await expect(editada).toContainText("45.000");
    await page.reload();
    await page.getByRole("button", { name: "Agregar gasto" }).first().click();
    const recargada = tabla(page)
      .getByRole("row")
      .filter({ hasText: `${nota} editado` });
    await expect(recargada).toContainText("Aseo");
    await expect(recargada).toContainText("45.000");
  });

  test("Esc cancela sin guardar y Enter guarda", async ({ page }) => {
    const nota = `gasto ${Date.now()}`;
    const fila = await agregarGastoManual(page, "8000", nota);
    await fila.getByRole("button", { name: /^Editar / }).click();
    const t = tabla(page);
    await t.getByLabel("Nota", { exact: true }).fill("no se guarda");
    await t.getByLabel("Nota", { exact: true }).press("Escape");
    await expect(t.getByRole("row").filter({ hasText: nota })).toBeVisible();
    await expect(t.getByText("no se guarda")).toHaveCount(0);

    await t
      .getByRole("row")
      .filter({ hasText: nota })
      .getByRole("button", { name: /^Editar / })
      .click();
    await t.getByLabel("Nota", { exact: true }).fill(`${nota} con enter`);
    await t.getByLabel("Nota", { exact: true }).press("Enter");
    await expect(
      t.getByRole("row").filter({ hasText: `${nota} con enter` }),
    ).toBeVisible();
  });

  test("cambiar la fecha al mes anterior lo saca de la tabla del mes", async ({
    page,
  }) => {
    const nota = `gasto ${Date.now()}`;
    const fila = await agregarGastoManual(page, "1200", nota);
    const ahora = new Date();
    const anterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 15);
    const mes = `${anterior.getFullYear()}-${String(anterior.getMonth() + 1).padStart(2, "0")}`;
    await fila.getByRole("button", { name: /^Editar / }).click();
    await tabla(page).getByLabel("Fecha").fill(`${mes}-15`);
    await tabla(page).getByRole("button", { name: "Guardar" }).click();
    await expect(
      tabla(page).getByRole("row").filter({ hasText: nota }),
    ).toHaveCount(0);
    // El gasto quedó guardado en el mes nuevo.
    const guardado = await page.evaluate(
      (m) => localStorage.getItem(`mercado-medellin:gastos:${m}`),
      mes,
    );
    expect(guardado).toContain(nota);
  });

  test("un valor inválido se dice junto a la fila y no se guarda", async ({
    page,
  }) => {
    const nota = `gasto ${Date.now()}`;
    const fila = await agregarGastoManual(page, "5000", nota);
    await fila.getByRole("button", { name: /^Editar / }).click();
    await tabla(page).getByLabel("Cantidad").fill("-3");
    await tabla(page).getByRole("button", { name: "Guardar" }).click();
    await expect(tabla(page).getByRole("alert")).toContainText(
      "No se pudo guardar",
    );
    await tabla(page).getByRole("button", { name: "Cancelar" }).click();
    await expect(
      tabla(page).getByRole("row").filter({ hasText: nota }),
    ).toContainText("5.000");
  });

  test("con sesión: el cambio llega a la cuenta y vuelve al recargar", async ({
    page,
  }) => {
    await page.goto("/registro");
    await page.getByLabel("Correo").fill(`e2e-gas-${Date.now()}@ejemplo.test`);
    await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByTestId("usuario")).toBeVisible();

    const nota = `gasto ${Date.now()}`;
    await agregarGastoManual(page, "7000", nota);
    // Esperar a que el gasto exista en la cuenta (id de servidor, no `local-…`).
    await expect
      .poll(
        async () => {
          await page.reload();
          await page
            .getByRole("button", { name: "Agregar gasto" })
            .first()
            .click();
          const id = await tabla(page)
            .getByRole("row")
            .filter({ hasText: nota })
            .getAttribute("data-testid");
          return id?.startsWith("gasto-local-") === false;
        },
        { timeout: 20_000 },
      )
      .toBe(true);

    const filaServidor = tabla(page).getByRole("row").filter({ hasText: nota });
    await filaServidor.getByRole("button", { name: /^Editar / }).click();
    await tabla(page).getByLabel("Cantidad").fill("2.5");
    await tabla(page).getByLabel("Descripción").fill("compra grande");
    await tabla(page).getByRole("button", { name: "Guardar" }).click();
    await expect(
      tabla(page).getByRole("row").filter({ hasText: "compra grande" }),
    ).toContainText("×2.5");

    // Se borra el almacenamiento del dispositivo: lo editado vuelve de la cuenta.
    await page.evaluate(() => {
      for (const k of Object.keys(localStorage))
        if (k.startsWith("mercado-medellin:gastos:"))
          localStorage.removeItem(k);
    });
    await page.reload();
    await page.getByRole("button", { name: "Agregar gasto" }).first().click();
    await expect(
      tabla(page).getByRole("row").filter({ hasText: "compra grande" }),
    ).toContainText("×2.5");
  });
});

test("con sesión: tras importar una factura se edita el producto y la cantidad de un gasto importado", async ({
  page,
}) => {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-imp-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  // Importar la factura de D1 (3 gastos de 2026-10-30).
  await page.goto("/presupuesto");
  await page.getByRole("button", { name: "Importar factura" }).click();
  await page
    .getByTestId("importar-texto")
    .fill(readFileSync("tests/importar/d1.csv", "utf-8"));
  await page.getByRole("button", { name: "Revisar" }).click();
  await expect(page.getByText("Publicar los precios para todos")).toBeVisible();
  const confirmar = page.getByLabel(/confirmo que se creen/);
  if (await confirmar.isVisible()) await confirmar.check();
  await page.getByRole("button", { name: "Guardar importación" }).click();
  await expect(page.getByTestId("importar-resultado")).toContainText(
    "Importación lista",
  );

  // Abajo quedan los gastos del mes de la factura, con su cantidad.
  const verOctubre = async () => {
    await page.goto("/presupuesto");
    await page.getByRole("button", { name: "Agregar gasto" }).first().click();
    await page.locator('input[type="month"]').fill("2026-10");
  };
  await verOctubre();
  const fila = tabla(page).getByRole("row").filter({ hasText: "×3" });
  await expect(fila).toHaveCount(1);
  await fila.getByRole("button", { name: /^Editar / }).click();

  await tabla(page).getByLabel("Producto").selectOption("arroz");
  await tabla(page).getByLabel("Cantidad").fill("4");
  await tabla(page).getByRole("button", { name: "Guardar" }).click();
  const editada = tabla(page).getByRole("row").filter({ hasText: "×4" });
  await expect(editada).toContainText("Arroz");

  // Lo editado vuelve de la cuenta al recargar.
  await verOctubre();
  const recargada = tabla(page).getByRole("row").filter({ hasText: "×4" });
  await expect(recargada).toContainText("Arroz");
  await expect(
    tabla(page).getByRole("row").filter({ hasText: "×3" }),
  ).toHaveCount(0);
});

test("/presupuesto con una fila en edición: axe sin violaciones serias ni críticas y sin desplazamiento horizontal en 390 px", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  const fila = await agregarGastoManual(page, "9000", `gasto ${Date.now()}`);
  await fila.getByRole("button", { name: /^Editar / }).click();
  await expect(tabla(page).getByLabel("Monto", { exact: true })).toBeVisible();

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
