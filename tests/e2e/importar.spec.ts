import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

const csv = (nombre: string) =>
  readFileSync(`tests/importar/${nombre}`, "utf-8");
const digitos = (s: string | null) => Number((s ?? "").replace(/\D/g, ""));

async function abrirImportar(page: Page) {
  await page.goto("/presupuesto");
  await page.getByRole("button", { name: "Importar factura" }).click();
}

async function pegarYRevisar(page: Page, texto: string) {
  await page.getByTestId("importar-texto").fill(texto);
  await page.getByRole("button", { name: "Revisar" }).click();
}

async function crearCuenta(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

/** Con sesión la revisión espera la respuesta de la base antes de dejar guardar. */
async function guardarRevisado(page: Page) {
  await expect(page.getByText("Publicar los precios para todos")).toBeVisible();
  // La casilla solo aparece si hay tiendas o productos que no existen todavía.
  const confirmar = page.getByLabel(/confirmo que se creen/);
  if (await confirmar.isVisible()) await confirmar.check();
  await page.getByRole("button", { name: "Guardar importación" }).click();
}

test("una fila con precio 0 o tienda vacía bloquea el guardado hasta corregirla o quitarla", async ({
  page,
}) => {
  await abrirImportar(page);
  const conDudas = [
    "producto,cantidad,precio_total,tienda,fecha,duda",
    "Arroz 500 g,1,0,D1,2026-10-30,¿El precio era 3.200?",
    "Leche entera 1 L,1,4500,D1,2026-10-30,",
    "Pan tajado 500 g,1,3200,,2026-10-30,¿En qué tienda lo compraste?",
  ].join("\n");
  await pegarYRevisar(page, conDudas);

  await expect(
    page.getByRole("status").filter({ hasText: "¿El precio era 3.200?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Completa o quita 2 filas" }),
  ).toBeVisible();
  const guardar = page.getByRole("button", { name: "Guardar importación" });
  await expect(guardar).toBeDisabled();

  // Corregir el precio deja una sola fila incompleta.
  await page.getByLabel("Precio total").first().fill("3200");
  await expect(
    page.getByRole("status").filter({ hasText: "Completa o quita 1 fila" }),
  ).toBeVisible();
  await expect(guardar).toBeDisabled();

  // Quitar la fila sin tienda desbloquea el guardado.
  await page.getByRole("button", { name: "Quitar fila" }).last().click();
  await expect(guardar).toBeEnabled();
  await guardar.click();
  await expect(page.getByTestId("importar-resultado")).toContainText(
    "en este dispositivo",
  );

  const guardados = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith("mercado-medellin:gastos:"))
      .flatMap(
        (k) =>
          JSON.parse(localStorage.getItem(k) ?? "[]") as {
            origen: string;
            descripcion: string;
          }[],
      ),
  );
  expect(guardados.filter((g) => g.origen === "importado")).toHaveLength(2);
  expect(guardados.map((g) => g.descripcion)).not.toContain("Pan tajado 500 g");
});

test("un .xlsx se rechaza con 'guárdalo como CSV' y no se lee", async ({
  page,
}) => {
  await abrirImportar(page);
  await page.getByTestId("importar-archivo").setInputFiles({
    name: "factura.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from("no es un csv"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "guárdalo como CSV" }),
  ).toBeVisible();
  await expect(page.getByTestId("importar-texto")).toHaveValue("");
});

test("con sesión: dos grupos, edición, guardar, repetir, deshacer y volver a importar", async ({
  page,
}) => {
  await crearCuenta(page);
  await abrirImportar(page);
  await pegarYRevisar(page, csv("varias-tiendas.csv"));

  await expect(page.getByTestId("grupo-importacion")).toHaveCount(2);
  const primero = page.getByTestId("grupo-importacion").first();
  expect(digitos(await primero.locator("strong").textContent())).toBe(16650);

  // Editar el precio de una fila y el rubro de otra se refleja en el resumen.
  await page.getByLabel("Precio total").first().fill("13000");
  expect(digitos(await primero.locator("strong").textContent())).toBe(16900);
  await page.getByLabel("Rubro").nth(1).selectOption("Bebidas");
  await expect(page.getByLabel("Rubro").nth(1)).toHaveValue("Bebidas");

  await guardarRevisado(page);
  await expect(page.getByTestId("importar-resultado")).toContainText(
    "Importación lista",
  );
  await expect(page.getByTestId("importar-resultado")).toContainText(
    "4 gastos guardados",
  );

  // La tienda nueva ya está en el catálogo compartido.
  await page.goto("/anotados");
  await expect(page.getByText("Plaza Minorista").first()).toBeVisible();

  // Repetir el mismo archivo con la misma fecha se bloquea.
  await abrirImportar(page);
  await pegarYRevisar(page, csv("varias-tiendas.csv"));
  await guardarRevisado(page);
  await expect(
    page.getByRole("status").filter({ hasText: "ya se importó" }),
  ).toBeVisible();

  // Deshacer el lote repone todo y deja volver a importar el mismo archivo.
  await page.getByRole("button", { name: "Volver" }).click();
  await page.getByTestId("importar-texto").fill(csv("d1.csv"));
  await page.getByRole("button", { name: "Revisar" }).click();
  await guardarRevisado(page);
  await expect(page.getByTestId("importar-resultado")).toContainText(
    "Importación lista",
  );
  await page.getByRole("button", { name: "Deshacer importación" }).click();
  await page.getByRole("button", { name: "Sí, deshacer este lote" }).click();
  await expect(page.getByTestId("importar-resultado")).toContainText(
    "Importación deshecha",
  );

  await page.getByRole("button", { name: "Importar otra factura" }).click();
  await pegarYRevisar(page, csv("d1.csv"));
  await guardarRevisado(page);
  await expect(page.getByTestId("importar-resultado")).toContainText(
    "Importación lista",
  );
});

test("sin sesión: la importación queda en el dispositivo y no toca el catálogo", async ({
  page,
}) => {
  await abrirImportar(page);
  await pegarYRevisar(page, csv("barrio.csv"));
  await expect(
    page.getByText("Sin sesión: solo se guardan tus gastos"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guardar importación" }).click();
  await expect(page.getByTestId("importar-resultado")).toContainText(
    "en este dispositivo",
  );

  const guardados = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith("mercado-medellin:gastos:"))
      .flatMap(
        (k) =>
          JSON.parse(localStorage.getItem(k) ?? "[]") as { origen: string }[],
      ),
  );
  expect(guardados.filter((g) => g.origen === "importado")).toHaveLength(2);

  await page.goto("/anotados");
  await expect(page.getByText("Tienda de Don Pedro")).toHaveCount(0);
});

test("al iniciar sesión se suben los gastos importados sin sesión", async ({
  page,
}) => {
  await abrirImportar(page);
  await pegarYRevisar(page, csv("barrio.csv"));
  await page.getByRole("button", { name: "Guardar importación" }).click();
  await expect(page.getByTestId("importar-resultado")).toContainText(
    "en este dispositivo",
  );

  await crearCuenta(page);
  await expect(
    page.getByRole("status").filter({ hasText: "Subimos 2 gastos" }),
  ).toBeVisible();
  const pendientes = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith("mercado-medellin:gastos:"))
      .flatMap(
        (k) => JSON.parse(localStorage.getItem(k) ?? "[]") as { id: string }[],
      )
      .filter((g) => g.id.startsWith("local-")),
  );
  expect(pendientes).toHaveLength(0);
});
