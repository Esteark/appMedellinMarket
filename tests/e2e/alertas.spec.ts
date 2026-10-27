import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// La alerta se inserta con la service role (como lo hace la corrida); el usuario es de la prueba.
const admin = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

test("una alerta nueva llega por Realtime a la campana y aparece en /alertas", async ({
  page,
}) => {
  const correo = `e2e-${Date.now()}@ejemplo.test`;
  const db = admin();
  let usuario = "";
  try {
    await page.goto("/registro");
    await page.getByLabel("Correo").fill(correo);
    await page.getByLabel(/^Contraseña/).fill("clave-e2e-segura");
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByTestId("usuario")).toBeVisible();
    await expect(page.getByTestId("campana")).toBeVisible();

    const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
    usuario = data.users.find((u) => u.email === correo)?.id ?? "";
    expect(usuario).not.toBe("");

    const mensaje = `Prueba e2e ${Date.now()}`;
    // Esperar a que el canal esté suscrito evita insertar antes de que alguien escuche.
    await page.waitForTimeout(1500);
    const { error } = await db.from("alertas").insert({
      user_id: usuario,
      tipo: "mas_barato",
      monto: 5000,
      mensaje,
    });
    expect(error).toBeNull();

    await expect(page.getByTestId("campana-n")).toHaveText("1");
    const aviso = page.getByRole("status").filter({ hasText: mensaje });
    await expect(aviso).toBeVisible();
    await aviso.getByRole("button", { name: "Ver" }).click();

    await expect(page).toHaveURL(/\/alertas$/);
    await expect(
      page.getByTestId("alerta").filter({ hasText: mensaje }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Marcar todas como leídas" })
      .click();
    await expect(page.getByTestId("campana-n")).toHaveCount(0);

    await page.getByLabel(/Avisarme si el ahorro/).fill("2500");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Preferencias guardadas" }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(/Avisarme si el ahorro/)).toHaveValue("2500");
  } finally {
    if (usuario) await db.auth.admin.deleteUser(usuario);
  }
});

test("sin sesión, /alertas invita a ingresar", async ({ page }) => {
  await page.goto("/alertas");
  await expect(
    page.getByRole("link", { name: "Inicia sesión", exact: true }),
  ).toBeVisible();
});
