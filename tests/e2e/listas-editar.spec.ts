import type { Page } from "@playwright/test";
import { esperarContenido, expect, test } from "./ayuda";

const CLAVE = "clave-e2e-segura";

/** Arma en el catálogo una lista con 2 de aceite y 1 de arroz y la guarda con ese nombre. */
async function crearLista(page: Page, nombre: string) {
  await page.goto("/");
  const agregar = (id: string) =>
    page
      .getByTestId(`tarjeta-${id}`)
      .getByRole("button", { name: /^Agregar/ })
      .click();
  await agregar("aceite");
  await agregar("aceite");
  await agregar("arroz");
  await page.getByTestId("guardar-lista").click();
  await page.getByLabel("Nombre de la lista").fill(nombre);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(
    page.getByRole("status").filter({ hasText: `«${nombre}» guardada` }),
  ).toBeVisible();
}

async function abrir(page: Page, nombre: string) {
  await page.goto("/listas");
  await esperarContenido(page);
  const tarjeta = page.getByTestId(`lista-guardada-${nombre}`);
  await tarjeta.getByRole("button", { name: "Ver productos" }).click();
  return tarjeta;
}

const cantidad = (tarjeta: ReturnType<Page["getByTestId"]>, producto: string) =>
  tarjeta
    .getByRole("listitem")
    .filter({ hasText: producto })
    .locator("span.tabular-nums");

test("sin sesión: ver, editar, guardar y descartar los productos de una lista", async ({
  page,
}) => {
  await crearLista(page, "Quincena");
  const tarjeta = await abrir(page, "Quincena");

  const contenido = tarjeta.getByTestId("contenido-lista");
  await expect(contenido.getByRole("listitem")).toHaveCount(2);
  await expect(cantidad(contenido, "Aceite de girasol")).toHaveText("2");

  // Sin cambios no hay nada que guardar ni descartar.
  await expect(
    contenido.getByRole("button", { name: "Guardar cambios" }),
  ).toBeDisabled();

  // Subir una cantidad, quitar un producto y agregar otro.
  await contenido
    .getByRole("button", { name: "Una unidad más de Aceite de girasol" })
    .click();
  await contenido
    .getByRole("button", { name: "Quitar Arroz de la lista" })
    .click();
  await contenido
    .getByLabel("Agregar producto", { exact: true })
    .selectOption({ label: "Aguacate hass" });
  await contenido.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "«Quincena» actualizada" }),
  ).toBeVisible();

  // Recargar conserva el cambio.
  const recargada = await abrir(page, "Quincena");
  const c2 = recargada.getByTestId("contenido-lista");
  await expect(cantidad(c2, "Aceite de girasol")).toHaveText("3");
  await expect(
    c2.getByRole("listitem").filter({ hasText: "Aguacate hass" }),
  ).toBeVisible();
  await expect(
    c2.getByRole("listitem").filter({ hasText: "Arroz" }),
  ).toHaveCount(0);

  // Descartar deja la lista como estaba.
  await c2
    .getByRole("button", { name: "Una unidad más de Aceite de girasol" })
    .click();
  await expect(cantidad(c2, "Aceite de girasol")).toHaveText("4");
  await c2.getByRole("button", { name: "Descartar" }).click();
  await expect(cantidad(c2, "Aceite de girasol")).toHaveText("3");
});

test("con sesión: el cambio se ve desde otro navegador con la misma cuenta", async ({
  page,
  browser,
}, testInfo) => {
  const correo = `e2e-${Date.now()}@ejemplo.test`;
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel(/^Contraseña/).fill(CLAVE);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  await crearLista(page, "Fiesta");
  const tarjeta = await abrir(page, "Fiesta");
  const contenido = tarjeta.getByTestId("contenido-lista");
  await contenido
    .getByRole("button", { name: "Una unidad más de Aceite de girasol" })
    .click();
  await contenido.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "«Fiesta» actualizada" }),
  ).toBeVisible();

  const otro = await browser.newContext({
    storageState: testInfo.project.use.storageState,
  });
  const pagina = await otro.newPage();
  await pagina.goto("/ingresar");
  await pagina.getByLabel("Correo").fill(correo);
  await pagina.getByLabel(/^Contraseña/).fill(CLAVE);
  await pagina.getByRole("button", { name: "Ingresar" }).click();
  await expect(pagina.getByTestId("usuario")).toBeVisible();
  const remota = await abrir(pagina, "Fiesta");
  await expect(
    cantidad(remota.getByTestId("contenido-lista"), "Aceite de girasol"),
  ).toHaveText("3");
  await otro.close();
});

test("guardar cambios desde la lista principal sobre la lista de origen", async ({
  page,
}) => {
  await crearLista(page, "Quincena");
  const origen = page.getByTestId("lista-origen");
  const guardarCambios = page.getByTestId("guardar-cambios");

  // «Guardar como nueva» deja la recién guardada como origen, sin cambios pendientes.
  await expect(origen).toContainText("Viene de «Quincena»");
  await expect(origen).not.toContainText("cambios sin guardar");
  await expect(guardarCambios).toBeDisabled();

  // Cargar «Quincena» desde /listas y cambiar una cantidad en el catálogo.
  await page.goto("/listas");
  await esperarContenido(page);
  await page
    .getByTestId("lista-guardada-Quincena")
    .getByRole("button", { name: "Cargar" })
    .click();
  await page.goto("/");
  await expect(origen).toContainText("Viene de «Quincena»");
  await page
    .getByTestId("tarjeta-aceite")
    .getByRole("button", { name: /^Agregar/ })
    .click();
  await expect(origen).toContainText("cambios sin guardar");
  await expect(guardarCambios).toBeEnabled();

  // Guardar sobre la misma lista: el cambio se ve en /listas.
  await guardarCambios.click();
  await expect(
    page.getByRole("status").filter({ hasText: "«Quincena» actualizada" }),
  ).toBeVisible();
  await expect(origen).not.toContainText("cambios sin guardar");
  const tarjeta = await abrir(page, "Quincena");
  await expect(
    cantidad(tarjeta.getByTestId("contenido-lista"), "Aceite de girasol"),
  ).toHaveText("3");

  // Vaciar la lista quita el origen.
  await page.goto("/");
  await page.getByRole("button", { name: "Vaciar lista" }).click();
  await expect(origen).toHaveCount(0);

  // Si la lista de origen se elimina, solo queda «Guardar como nueva» (que vuelve a llamarse «Guardar lista»).
  await page.goto("/listas");
  await esperarContenido(page);
  await page
    .getByTestId("lista-guardada-Quincena")
    .getByRole("button", { name: "Cargar" })
    .click();
  await page
    .getByTestId("lista-guardada-Quincena")
    .getByRole("button", { name: "Eliminar" })
    .click();
  await page.goto("/");
  await expect(origen).toHaveCount(0);
  await expect(guardarCambios).toHaveCount(0);
  await expect(page.getByTestId("guardar-lista")).toHaveText("Guardar lista");
});
