import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

async function crearCuenta(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-cat-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

test("sin sesión no hay «Agregar producto» en la Canasta ni en Anotados", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("agregar-producto")).toHaveCount(0);
  await page.goto("/anotados");
  await expect(page.getByTestId("agregar-producto")).toHaveCount(0);
});

test("con sesión: la Canasta abre «Agregar producto» con la tienda del chip activo", async ({
  page,
}) => {
  await crearCuenta(page);
  await page.goto("/");
  await page
    .getByTestId("chips-tiendas")
    .getByRole("button", { name: "PriceSmart", exact: true })
    .click();
  await page.getByTestId("agregar-producto").click();
  const hoja = page.getByTestId("agregar-a-tienda");
  await expect(hoja.getByLabel("Tienda")).toHaveValue("pricesmart");
  // La papaya solo la sigue La Minorista: se ofrece para PriceSmart y dice dónde está.
  await hoja.getByLabel("Buscar producto para agregar").fill("papaya");
  await expect(hoja.getByTestId("candidato-papaya")).toContainText(
    "También en La Minorista",
  );
});

test("con sesión: Anotados no deja anotar donde la tienda no sigue el producto y ofrece agregarlo", async ({
  page,
}) => {
  const producto = `E2E Anot ${Date.now()}`;
  await crearCuenta(page);
  await page.goto("/tiendas");
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre").fill(producto);
  await page.getByRole("checkbox", { name: "La Minorista" }).check();
  await page.getByRole("button", { name: "Guardar" }).click();
  // Esperar a que la hoja se cierre: navegar antes cancelaría la acción.
  await expect(page.getByRole("button", { name: "Guardar" })).toHaveCount(0);

  await page.goto("/anotados");
  await page.getByLabel("Buscar producto", { exact: true }).fill(producto);
  const fila = page.getByRole("row").filter({ hasText: producto });
  // Solo La Minorista lo sigue: en las demás tiendas la celda queda fuera.
  await expect(fila.locator('[data-testid^="celda-"]')).toHaveCount(1);
  expect(
    await fila.locator('[data-testid^="fuera-"]').count(),
  ).toBeGreaterThanOrEqual(1);

  await page.getByTestId("agregar-producto").click();
  const hoja = page.getByTestId("agregar-a-tienda");
  await hoja.getByLabel("Tienda").selectOption("pricesmart");
  await hoja.getByLabel("Buscar producto para agregar").fill(producto);
  await hoja.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar" }).first().click();
  await expect(fila.locator('[data-testid^="celda-"]')).toHaveCount(2);
});

test("un producto propio de un plan guarda el ícono elegido", async ({
  page,
}) => {
  await page.goto("/hogar");
  const propios = page.getByRole("group", { name: "Productos propios" });
  await propios.getByLabel("Nombre del producto propio").fill("Velas");
  await propios.getByLabel("Precio estimado del producto propio").fill("3000");
  await propios.getByRole("button", { name: "Elegir ícono" }).click();
  await propios.getByLabel("Buscar ícono").fill("vela");
  await propios.getByRole("button", { name: "vela" }).click();
  await propios.getByRole("button", { name: "Agregar propio" }).click();
  await expect(propios).toContainText("🕯️ Velas");
  await page.reload();
  await expect(
    page.getByRole("group", { name: "Productos propios" }),
  ).toContainText("🕯️ Velas");
});

const verTienda = (page: Page, id: string) =>
  page
    .getByTestId(`tienda-${id}`)
    .getByRole("button", { name: "Ver precios" })
    .click();

/** Crea un producto solo en una tienda y le anota un precio desde /anotados. */
async function productoConPrecio(
  page: Page,
  nombre: string,
  tienda: { etiqueta: string; id: string },
  precio: number,
) {
  await page.goto("/tiendas");
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre").fill(nombre);
  await page.getByRole("checkbox", { name: tienda.etiqueta }).check();
  await page.getByRole("button", { name: "Guardar" }).click();
  // Esperar a que la hoja se cierre: navegar antes cancelaría la acción.
  await expect(page.getByRole("button", { name: "Guardar" })).toHaveCount(0);
  await anotar(page, nombre, tienda.id, precio);
}

async function anotar(
  page: Page,
  nombre: string,
  tiendaId: string,
  precio: number,
) {
  await page.goto("/anotados");
  await page.getByLabel("Buscar producto", { exact: true }).fill(nombre);
  await page
    .getByRole("row")
    .filter({ hasText: nombre })
    .locator(`[data-testid^="celda-"][data-testid$="-${tiendaId}"]`)
    .click();
  await page.getByLabel(/^Precio de /).fill(String(precio));
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByLabel(/^Precio de /)).toHaveCount(0);
}

const enCanasta = async (page: Page, nombre: string, chip: string) => {
  await page.goto("/");
  await page.getByLabel("Buscar producto").fill(nombre);
  await page
    .getByTestId("chips-tiendas")
    .getByRole("button", { name: chip, exact: true })
    .click();
  return page.getByTestId("rejilla").getByText(nombre);
};

test("un producto de una sola tienda no sale en la otra (pestaña y chip) hasta agregarlo", async ({
  page,
}) => {
  const nombre = `E2E Una Tienda ${Date.now()}`;
  await crearCuenta(page);
  await productoConPrecio(
    page,
    nombre,
    { etiqueta: "La Minorista", id: "minorista" },
    2500,
  );

  await expect(await enCanasta(page, nombre, "La Minorista")).toBeVisible();
  await expect(await enCanasta(page, nombre, "PriceSmart")).toHaveCount(0);
  await page.goto("/tiendas");
  await verTienda(page, "pricesmart");
  await page.getByLabel("Buscar producto", { exact: true }).fill(nombre);
  await expect(page.getByRole("row").filter({ hasText: nombre })).toHaveCount(
    0,
  );

  // Agregarlo a PriceSmart y anotarle precio lo muestra en las dos.
  await page.getByTestId("agregar-a-esta-tienda").click();
  const hoja = page.getByTestId("agregar-a-tienda");
  await hoja.getByLabel("Buscar producto para agregar").fill(nombre);
  await hoja.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar" }).first().click();
  await anotar(page, nombre, "pricesmart", 2600);
  await expect(await enCanasta(page, nombre, "PriceSmart")).toBeVisible();
  await expect(await enCanasta(page, nombre, "La Minorista")).toBeVisible();
});

test("quitar un producto de una tienda lo saca de allí pero conserva su precio", async ({
  page,
}) => {
  const nombre = `E2E Quitar ${Date.now()}`;
  await crearCuenta(page);
  await productoConPrecio(
    page,
    nombre,
    { etiqueta: "La Minorista", id: "minorista" },
    3100,
  );
  await expect(await enCanasta(page, nombre, "La Minorista")).toBeVisible();

  await page.goto("/tiendas");
  await verTienda(page, "minorista");
  await page.getByLabel("Buscar producto", { exact: true }).fill(nombre);
  const fila = page.getByRole("row").filter({ hasText: nombre });
  await fila.getByRole("button", { name: "Quitar de esta tienda" }).click();
  await fila.getByRole("button", { name: "Sí, quitar" }).click();
  // El aviso confirma que la acción terminó; sin otra tienda queda como «Sin tienda».
  await expect(page.getByText(/salió de/)).toBeVisible();
  await expect(fila.getByTestId("sin-tienda")).toBeVisible();
  await expect(await enCanasta(page, nombre, "La Minorista")).toHaveCount(0);

  // El anotado sigue: al volver a agregarlo, el precio reaparece sin anotarlo de nuevo.
  await page.goto("/tiendas");
  await verTienda(page, "minorista");
  await page.getByTestId("agregar-a-esta-tienda").click();
  const hoja = page.getByTestId("agregar-a-tienda");
  await hoja.getByLabel("Buscar producto para agregar").fill(nombre);
  await hoja.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar" }).first().click();
  await expect(await enCanasta(page, nombre, "La Minorista")).toBeVisible();
  await expect(
    page.getByTestId("rejilla").locator("[data-minimo]").first(),
  ).toContainText("3.100");
});

test("/tiendas: axe sin violaciones serias ni críticas y sin desplazamiento horizontal en 390 px", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await crearCuenta(page);
  await page.goto("/tiendas");
  await expect(page.getByTestId("agregar-a-esta-tienda")).toBeVisible();
  const sinDesborde = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
  expect(await sinDesborde()).toBe(true);

  const graves = async () =>
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => ({ id: v.id, nodos: v.nodes.map((n) => n.target) }));
  expect(await graves()).toEqual([]);

  // También con la hoja de agregar abierta.
  await page.getByTestId("agregar-a-esta-tienda").click();
  await expect(page.getByTestId("agregar-a-tienda")).toBeVisible();
  expect(await graves()).toEqual([]);
});
