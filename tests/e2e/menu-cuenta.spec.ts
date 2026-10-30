import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

async function registrarse(page: Page) {
  await page.goto("/registro");
  await page.getByLabel("Correo").fill(`e2e-${Date.now()}@ejemplo.test`);
  await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByTestId("usuario")).toBeVisible();
}

test("el menú de cuenta entra animado, Escape lo cierra y devuelve el foco, y salir cierra la sesión", async ({
  page,
}) => {
  await registrarse(page);
  const icono = page.getByTestId("usuario");
  const menu = page.getByRole("menu");

  await icono.click();
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("animation-name", "menu-entra");

  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(icono).toBeFocused();

  await icono.click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/\?aviso=sesion_cerrada|\/$/);
  await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
  await expect(page.getByTestId("usuario")).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: "Sesión cerrada" }),
  ).toBeVisible();
});

test("con movimiento reducido el menú aparece y desaparece sin animación", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await registrarse(page);
  await page.getByTestId("usuario").click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(menu).toHaveCSS("animation-name", "none");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
});
