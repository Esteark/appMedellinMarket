import type { Page } from "@playwright/test";
import { esperarContenido, expect, test } from "./ayuda";

const CSV = [
  "lista,producto,cantidad,unidad,nota",
  "1 semana,Aguacate hass,3,kg,entre 6 y 8 unidades",
  "1 semana,Aceite de girasol,2,l,",
  "1 semana,Papas varias,4,kg,Capira",
  "2 semanas,Aguacate hass,5,kg,",
].join("\n");

async function cargar(page: Page) {
  await page.goto("/listas");
  await page.getByTestId("lista-texto").fill(CSV);
  await page.getByRole("button", { name: "Revisar" }).click();
}

const toast = (page: Page, texto: string) =>
  page.getByRole("status").filter({ hasText: texto });

test("sin sesión: revisar, usar como mi lista, guardar en el dispositivo, repetir nombre y recordar el alias", async ({
  page,
}) => {
  await cargar(page);
  await expect(page.getByTestId("seccion-1 semana")).toBeVisible();
  await expect(page.getByTestId("seccion-2 semanas")).toBeVisible();
  // Lo exacto se empareja solo; lo que no, queda sin producto hasta que la persona elige.
  await expect(
    page.getByLabel("Producto de Aguacate hass").first(),
  ).toHaveValue("aguacate");
  await expect(page.getByLabel("Producto de Papas varias")).toHaveValue("");
  await page.getByLabel("Producto de Papas varias").selectOption("ahuyama");

  const semana = page.getByTestId("seccion-1 semana");
  await semana.getByRole("button", { name: "Usar como mi lista" }).click();
  await expect(toast(page, "es ahora tu lista")).toBeVisible();

  await page.goto("/");
  await expect(page.getByTestId("tarjeta-aguacate")).toContainText("3");
  await expect(page.getByTestId("tarjeta-ahuyama")).toContainText("4");
  // El total por tienda del carrito se calcula con lo cargado.
  const total = await page.getByTestId("total").first().textContent();
  expect(Number((total ?? "").replace(/\D/g, ""))).toBeGreaterThan(0);

  // Guardar en el dispositivo y repetir el nombre.
  await cargar(page);
  await page
    .getByTestId("seccion-1 semana")
    .getByRole("button", { name: "Guardar", exact: true })
    .click();
  await expect(toast(page, "guardada")).toBeVisible();
  const guardadas = await page.evaluate(() =>
    (
      JSON.parse(localStorage.getItem("mercado-medellin:listas") ?? "{}")
        .listas ?? []
    ).map((l: { nombre: string }) => l.nombre),
  );
  expect(guardadas).toContain("1 semana");
  await page
    .getByTestId("seccion-1 semana")
    .getByRole("button", { name: "Guardar", exact: true })
    .click();
  await expect(toast(page, "Ya tienes una lista")).toBeVisible();

  // La segunda vez, «Papas varias» ya sabe a qué producto corresponde.
  await cargar(page);
  await expect(page.getByLabel("Producto de Papas varias")).toHaveValue(
    "ahuyama",
  );
});

test("con sesión: la lista guardada se ve desde otro navegador con la misma cuenta", async ({
  page,
  browser,
}, testInfo) => {
  const correo = `e2e-${Date.now()}@ejemplo.test`;
  const clave = "clave-e2e-segura";
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel(/^Contraseña/).fill(clave);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();

  await cargar(page);
  await page
    .getByTestId("seccion-2 semanas")
    .getByRole("button", { name: "Guardar", exact: true })
    .click();
  await expect(toast(page, "«2 semanas» guardada")).toBeVisible();

  const otro = await browser.newContext({
    storageState: testInfo.project.use.storageState,
  });
  const pagina = await otro.newPage();
  await pagina.goto("/ingresar");
  await pagina.getByLabel("Correo").fill(correo);
  await pagina.getByLabel(/^Contraseña/).fill(clave);
  await pagina.getByRole("button", { name: "Ingresar" }).click();
  await expect(pagina.getByTestId("usuario")).toBeVisible();
  await pagina.goto("/listas");
  await esperarContenido(pagina);
  await expect(pagina.getByTestId("lista-guardada-2 semanas")).toBeVisible();
  await otro.close();
});
