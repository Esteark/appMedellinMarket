import type { Page } from "@playwright/test";
import { esperarContenido, expect, test } from "./ayuda";

const digitos = (s: string | null) => Number((s ?? "").replace(/\D/g, ""));
/** Precio de una fila: se quita la fecha AAAA-MM-DD que va junto al monto. */
const precioDe = (texto: string | null) =>
  digitos((texto ?? "").replace(/\d{4}-\d{2}-\d{2}/, ""));

async function crearCuenta(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

/** Importa un CSV como si lo hiciera la persona: crea tienda y productos "por revisar". */
async function importar(page: Page, csv: string) {
  await page.goto("/presupuesto");
  await page.getByRole("button", { name: "Importar factura" }).click();
  await page.getByTestId("importar-texto").fill(csv);
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

test("lista las tiendas sembradas y el enlace del encabezado funciona en móvil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("link", { name: "Tiendas", exact: true }).click();
  await expect(page).toHaveURL(/\/tiendas$/);
  await expect(
    page.getByRole("heading", { name: "Tiendas y productos" }),
  ).toBeVisible();

  // Las 5 sembradas (4 de la carga + barrio); puede haber más si otras pruebas crearon tiendas.
  expect(await page.getByTestId(/^tienda-/).count()).toBeGreaterThanOrEqual(5);
  await expect(page.getByTestId("tienda-d1")).toBeVisible();
  await expect(page.getByTestId("tienda-barrio")).toBeVisible();
  // Sin sesión se ve todo, pero no se puede crear ni fusionar.
  await expect(
    page.getByRole("button", { name: "Nueva tienda" }),
  ).toBeDisabled();
});

test("con sesión: crear tienda y producto los muestra a todos, y /anotados oculta la tienda sin precios", async ({
  page,
  browser,
}, testInfo) => {
  const ts = Date.now();
  const tienda = `E2E Tienda Vacia ${ts}`;
  const producto = `E2E Producto Nuevo ${ts}`;
  await crearCuenta(page);
  await page.goto("/tiendas");

  await page.getByRole("button", { name: "Nueva tienda" }).click();
  await page.getByLabel("Nombre").fill(tienda);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByTestId(`tienda-e2e-tienda-vacia-${ts}`)).toBeVisible();

  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre").fill(producto);
  await page.getByRole("checkbox", { name: "D1", exact: true }).check();
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.getByLabel("Buscar producto").fill(String(ts));
  await expect(fila(page, producto)).toBeVisible();

  // Otro navegador, sin sesión: el catálogo es global.
  const otro = await browser.newContext({
    storageState: testInfo.project.use.storageState,
  });
  const pagina = await otro.newPage();
  await pagina.goto("/tiendas");
  await esperarContenido(pagina);
  await expect(
    pagina.getByTestId(`tienda-e2e-tienda-vacia-${ts}`),
  ).toBeVisible();
  await pagina.getByLabel("Buscar producto").fill(String(ts));
  await expect(fila(pagina, producto)).toBeVisible();
  await otro.close();

  // Una tienda manual sin ningún precio no agrega una columna vacía a /anotados.
  await page.goto("/anotados");
  await expect(page.getByText(tienda)).toHaveCount(0);
});

test("con sesión: un producto por revisar sale del filtro al darle grupo, y fusionar mueve su precio", async ({
  page,
}) => {
  const ts = Date.now();
  const tienda = `E2E Tienda ${ts}`;
  const origen = `E2E Origen ${ts}`;
  const destino = `E2E Destino ${ts}`;
  const filaOrigen = page.getByTestId(`producto-p-e2e-origen-${ts}`);
  await crearCuenta(page);
  await importar(
    page,
    [
      "producto,cantidad,precio_total,tienda,fecha",
      `${origen},1,3000,${tienda},2026-10-30`,
      `${destino},1,5000,${tienda},2026-10-29`,
    ].join("\n"),
  );

  await page.goto("/tiendas");
  await page
    .getByTestId(`tienda-e2e-tienda-${ts}`)
    .getByRole("button", { name: "Ver precios" })
    .click();
  await page.getByLabel("Buscar producto").fill(String(ts));

  // Los productos nacidos de la factura están "Por revisar"; darle grupo lo saca del filtro.
  await page.getByLabel(/^Solo por revisar/).check();
  await expect(filaOrigen.getByTestId("por-revisar")).toBeVisible();
  await filaOrigen.getByRole("button", { name: "Editar" }).click();
  await filaOrigen.getByLabel("Grupo").fill("Despensa");
  await filaOrigen.getByRole("button", { name: "Guardar" }).click();
  await expect(filaOrigen).toHaveCount(0);
  // Un producto que sí va en «Otros» sale del filtro con «Marcar revisado».
  await fila(page, destino)
    .getByRole("button", { name: "Marcar revisado" })
    .click();
  await expect(fila(page, destino)).toHaveCount(0);
  await page.getByLabel(/^Solo por revisar/).uncheck();
  await expect(filaOrigen).toBeVisible();
  expect(
    precioDe(await fila(page, destino).getByRole("cell").nth(3).textContent()),
  ).toBe(5000);

  // Fusionar el origen en el destino: el precio más reciente pasa y el origen desaparece.
  await filaOrigen.getByRole("button", { name: "Fusionar" }).click();
  const dialogo = page.getByTestId("dialogo-fusion");
  await dialogo.getByLabel("Producto destino").selectOption({ label: destino });
  const fusionar = dialogo.getByRole("button", {
    name: "Fusionar",
    exact: true,
  });
  await expect(fusionar).toBeDisabled();
  await dialogo.getByLabel(/Para confirmar/).fill(origen);
  await fusionar.click();

  await expect(
    page.getByRole("status").filter({ hasText: "Fusionamos" }),
  ).toBeVisible();
  await expect(filaOrigen).toHaveCount(0);
  await expect
    .poll(async () =>
      precioDe(
        await fila(page, destino).getByRole("cell").nth(3).textContent(),
      ),
    )
    .toBe(3000);
});

test("cada pestaña muestra solo los productos que esa tienda sigue", async ({
  page,
}) => {
  await page.goto("/tiendas");
  // La papaya solo tiene precio en La Minorista: no está en el catálogo de PriceSmart.
  await page
    .getByTestId("tienda-minorista")
    .getByRole("button", { name: "Ver precios" })
    .click();
  await expect(fila(page, "Papaya")).toHaveCount(1);
  await page
    .getByTestId("tienda-pricesmart")
    .getByRole("button", { name: "Ver precios" })
    .click();
  await expect(fila(page, "Papaya")).toHaveCount(0);
  await expect(fila(page, "Papa pastusa")).toHaveCount(1);
});

test("con sesión: elegir un ícono en el selector lo guarda y lo muestra; Esc lo cierra", async ({
  page,
}) => {
  const producto = `E2E Con Icono ${Date.now()}`;
  await crearCuenta(page);
  await page.goto("/tiendas");
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre").fill(producto);
  await page.getByRole("checkbox", { name: "D1", exact: true }).check();

  await page.getByRole("button", { name: "Elegir ícono" }).click();
  const selector = page.getByTestId("selector-emoji");
  await selector.getByLabel("Buscar ícono").fill("PIÑA");
  await expect(selector.getByRole("button", { name: "pina" })).toBeVisible();
  await selector.getByRole("button", { name: "pina" }).click();
  await expect(selector).toHaveCount(0);

  await page.getByRole("button", { name: "Cambiar ícono" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("selector-emoji")).toHaveCount(0);

  await page.getByRole("button", { name: "Guardar" }).click();
  await page.getByLabel("Buscar producto").fill(producto);
  await expect(fila(page, producto)).toContainText("🍍");
});

test("con sesión: un producto de una sola tienda se agrega a otra y se quita sin borrar la fila", async ({
  page,
}) => {
  const producto = `E2E Solo Minorista ${Date.now()}`;
  await crearCuenta(page);
  await page.goto("/tiendas");
  const ver = (id: string) =>
    page
      .getByTestId(`tienda-${id}`)
      .getByRole("button", { name: "Ver precios" })
      .click();

  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre").fill(producto);
  // «Guardar» exige al menos una tienda.
  await expect(page.getByRole("button", { name: "Guardar" })).toBeDisabled();
  await page.getByRole("checkbox", { name: "La Minorista" }).check();
  await page.getByRole("button", { name: "Guardar" }).click();

  await ver("minorista");
  await page.getByLabel("Buscar producto", { exact: true }).fill(producto);
  await expect(fila(page, producto)).toBeVisible();
  await ver("pricesmart");
  await expect(fila(page, producto)).toHaveCount(0);

  // Agregarlo a PriceSmart desde su pestaña.
  await page.getByTestId("agregar-a-esta-tienda").click();
  const hoja = page.getByTestId("agregar-a-tienda");
  await hoja.getByLabel("Buscar producto para agregar").fill(producto);
  await expect(hoja.getByText("También en La Minorista")).toBeVisible();
  await hoja.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar" }).first().click();
  await expect(fila(page, producto)).toBeVisible();

  // Quitarlo de PriceSmart con confirmación; sigue en La Minorista.
  await fila(page, producto)
    .getByRole("button", { name: "Quitar de esta tienda" })
    .click();
  await fila(page, producto)
    .getByRole("button", { name: "Sí, quitar" })
    .click();
  await expect(fila(page, producto)).toHaveCount(0);
  await ver("minorista");
  await expect(fila(page, producto)).toBeVisible();
});

test("sin sesión no hay acciones para agregar ni quitar de una tienda", async ({
  page,
}) => {
  await page.goto("/tiendas");
  await expect(page.getByTestId("agregar-a-esta-tienda")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Quitar de esta tienda" }),
  ).toHaveCount(0);
});

test("con sesión: crear un producto con un nombre que ya existe lo reutiliza y lo suma a la otra tienda", async ({
  page,
}) => {
  const producto = `E2E Reuso ${Date.now()}`;
  await crearCuenta(page);
  await page.goto("/tiendas");
  const crear = async (tienda: string) => {
    await page.getByRole("button", { name: "Nuevo producto" }).click();
    await page.getByLabel("Nombre").fill(producto);
    await page.getByRole("checkbox", { name: tienda, exact: true }).check();
    await page.getByRole("button", { name: "Guardar" }).click();
  };
  await crear("D1");
  await crear("La Minorista");

  for (const id of ["d1", "minorista"]) {
    await page
      .getByTestId(`tienda-${id}`)
      .getByRole("button", { name: "Ver precios" })
      .click();
    await page.getByLabel("Buscar producto", { exact: true }).fill(producto);
    await expect(fila(page, producto)).toHaveCount(1);
  }
});
