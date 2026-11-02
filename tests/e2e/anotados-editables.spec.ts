import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

async function crearCuenta(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-ae-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

/** Importa una factura de una tienda nueva con un producto nuevo: ambos aparecen en Anotados con precio. */
async function importar(page: Page, producto: string, tienda: string) {
  await page.goto("/presupuesto");
  await page.getByRole("button", { name: "Importar factura" }).click();
  await page
    .getByTestId("importar-texto")
    .fill(
      [
        "producto,cantidad,precio_total,tienda,fecha",
        `${producto},1,3000,${tienda},2026-10-30`,
      ].join("\n"),
    );
  await page.getByRole("button", { name: "Revisar" }).click();
  await expect(page.getByText("Publicar los precios para todos")).toBeVisible();
  await page.getByLabel(/confirmo que se creen/).check();
  await page.getByRole("button", { name: "Guardar importación" }).click();
  await expect(page.getByTestId("importar-resultado")).toContainText(
    "Importación lista",
  );
}

const fila = (page: Page, nombre: string) =>
  page.getByRole("row").filter({ hasText: nombre });

test("sin sesión no hay botones para editar productos ni tiendas en Anotados", async ({
  page,
}) => {
  await page.goto("/anotados");
  await expect(page.getByTestId("tabla-anotados")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Editar / })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Renombrar / })).toHaveCount(
    0,
  );
});

test("con sesión: editar el nombre, el ícono, el grupo y la unidad de un producto en la tabla", async ({
  page,
}) => {
  const ts = Date.now();
  const producto = `E2E Anot Prod ${ts}`;
  await crearCuenta(page);
  await importar(page, producto, `E2E Anot Tienda ${ts}`);

  await page.goto("/anotados");
  await page.getByLabel("Buscar producto", { exact: true }).fill(String(ts));
  await fila(page, producto)
    .getByRole("button", { name: /^Editar / })
    .click();

  // Esc cancela sin guardar.
  const edicion = page.getByTestId(/^edicion-/);
  await edicion.getByLabel("Nombre").fill("no se guarda");
  await edicion.getByLabel("Nombre").press("Escape");
  await expect(edicion).toHaveCount(0);
  await expect(fila(page, producto)).toBeVisible();

  // Editar todo: nombre, ícono, grupo, unidad y frecuencia.
  await fila(page, producto)
    .getByRole("button", { name: /^Editar / })
    .click();
  await edicion.getByLabel("Nombre").fill(`${producto} editado`);
  await edicion.getByRole("button", { name: "Elegir ícono" }).click();
  await edicion.getByLabel("Buscar ícono").fill("piña");
  await edicion.getByRole("button", { name: "pina" }).click();
  await edicion.getByLabel("Grupo").fill("Mecato");
  await edicion.getByLabel("Unidad").fill("kg");
  await edicion.getByLabel("Frecuencia").selectOption("diaria");
  await edicion.getByRole("button", { name: "Guardar" }).click();

  const editada = fila(page, `${producto} editado`);
  await expect(editada).toContainText("🍍");
  await expect(editada).toContainText("kg");

  // Lo editado queda en el catálogo: recargar y verlo también en /tiendas.
  await page.reload();
  await page.getByLabel("Buscar producto", { exact: true }).fill(String(ts));
  await expect(fila(page, `${producto} editado`)).toContainText("🍍");
  await page.goto("/tiendas");
  await page
    .getByTestId(`tienda-e2e-anot-tienda-${ts}`)
    .getByRole("button", { name: "Ver precios" })
    .click();
  await page.getByLabel("Buscar producto", { exact: true }).fill(String(ts));
  await expect(fila(page, `${producto} editado`)).toContainText("Mecato");
});

test("con sesión: renombrar una tienda desde su encabezado y rechazar un nombre repetido", async ({
  page,
}) => {
  const ts = Date.now();
  const tienda = `E2E Anot Tienda ${ts}`;
  await crearCuenta(page);
  await importar(page, `E2E Anot Prod ${ts}`, tienda);

  await page.goto("/anotados");
  const tabla = page.getByTestId("tabla-anotados");
  await tabla.getByRole("button", { name: `Renombrar ${tienda}` }).click();

  // Un nombre que ya existe (sin tildes ni mayúsculas) se rechaza junto al encabezado.
  await tabla.getByLabel(`Nuevo nombre de ${tienda}`).fill("d1");
  await tabla.getByRole("button", { name: "Guardar" }).click();
  await expect(tabla.getByRole("alert")).toContainText("Ya existe una tienda");

  await tabla
    .getByLabel(`Nuevo nombre de ${tienda}`)
    .fill(`${tienda} renombrada`);
  await tabla.getByRole("button", { name: "Guardar" }).click();
  await expect(
    tabla.getByRole("columnheader", {
      name: new RegExp(`${tienda} renombrada`),
    }),
  ).toBeVisible();

  // Se ve también en /tiendas.
  await page.goto("/tiendas");
  await expect(
    page.getByTestId(/^tienda-/).filter({ hasText: `${tienda} renombrada` }),
  ).toBeVisible();
});

test("la tabla de Anotados con una fila abierta pasa axe y no desborda en 390 px", async ({
  page,
}) => {
  const AxeBuilder = (await import("@axe-core/playwright")).default;
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  const ts = Date.now();
  await crearCuenta(page);
  await importar(page, `E2E Anot Axe ${ts}`, `E2E Anot Tienda ${ts}`);
  await page.goto("/anotados");
  await page.getByLabel("Buscar producto", { exact: true }).fill(String(ts));
  await fila(page, `E2E Anot Axe ${ts}`)
    .getByRole("button", { name: /^Editar / })
    .click();
  await expect(page.getByTestId(/^edicion-/)).toBeVisible();

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
