import { expect, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// Buzón de Supabase local (Mailpit, puerto de [local_smtp] en supabase/config.toml).
const BUZON = "http://127.0.0.1:54324";
const CLAVE = "clave-e2e-segura";

const admin = () =>
  createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

/** Enlace a /auth/confirmar del último correo enviado a `correo` (espera a que llegue). */
async function enlaceDelCorreo(correo: string) {
  let enlace = "";
  await expect
    .poll(
      async () => {
        const lista = await fetch(
          `${BUZON}/api/v1/search?query=${encodeURIComponent(`to:${correo}`)}`,
        ).then((r) => r.json());
        const id = lista.messages?.[0]?.ID;
        if (!id) return "";
        const mensaje = await fetch(`${BUZON}/api/v1/message/${id}`).then((r) =>
          r.json(),
        );
        const html = String(mensaje.HTML ?? "").replaceAll("&amp;", "&");
        enlace =
          html.match(/https?:\/\/[^"'\s<]*\/auth\/confirmar\?[^"'\s<]*/)?.[0] ??
          "";
        return enlace;
      },
      { message: "el correo con el enlace no llegó al buzón" },
    )
    .not.toBe("");
  return enlace;
}

async function ingresarCon(page: Page, correo: string, clave: string) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(correo);
  await page.getByLabel(/^Contraseña/).fill(clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

test("recuperar contraseña: el correo trae un enlace con token_hash y la clave nueva sirve para ingresar", async ({
  page,
}) => {
  const correo = `e2e-${Date.now()}@ejemplo.test`;
  const db = admin();
  let usuario = "";
  try {
    const creado = await db.auth.admin.createUser({
      email: correo,
      password: CLAVE,
      email_confirm: true,
    });
    usuario = creado.data.user?.id ?? "";
    expect(usuario).not.toBe("");

    await page.goto("/recuperar");
    await page.getByLabel("Correo").fill(correo);
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(
      page
        .getByText("Si el correo está registrado, te enviamos un enlace.")
        .first(),
    ).toBeVisible();

    const enlace = await enlaceDelCorreo(correo);
    // Va directo a la app (no al /auth/v1/verify de Supabase) y no depende de PKCE.
    expect(new URL(enlace).pathname).toBe("/auth/confirmar");
    expect(enlace).toContain("token_hash=");
    expect(enlace).toContain("type=recovery");

    await page.goto(enlace);
    await expect(page).toHaveURL(/\/nueva-clave$/);
    await page.getByLabel(/^Contraseña/).fill("otra-clave-segura-2");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page.getByTestId("usuario")).toBeVisible();

    // La clave vieja ya no sirve; la nueva sí.
    await page.getByTestId("usuario").click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
    await ingresarCon(page, correo, CLAVE);
    await expect(
      page.getByText("Correo o contraseña incorrectos.").first(),
    ).toBeVisible();
    await ingresarCon(page, correo, "otra-clave-segura-2");
    await expect(page.getByTestId("usuario")).toBeVisible();
  } finally {
    if (usuario) await db.auth.admin.deleteUser(usuario);
  }
});

test("confirmar registro: un token_hash válido abre la sesión y avisa; uno inválido o repetido explica qué hacer", async ({
  page,
}) => {
  const correo = `e2e-${Date.now()}@ejemplo.test`;
  const db = admin();
  let usuario = "";
  try {
    const { data, error } = await db.auth.admin.generateLink({
      type: "signup",
      email: correo,
      password: CLAVE,
    });
    expect(error).toBeNull();
    usuario = data.user?.id ?? "";
    const hash = data.properties?.hashed_token;

    await page.goto(
      `/auth/confirmar?token_hash=${hash}&type=signup&siguiente=/`,
    );
    await expect(page.getByTestId("usuario")).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "Correo confirmado" }),
    ).toBeVisible();

    // El mismo enlace por segunda vez ya no sirve.
    await page.getByTestId("usuario").click();
    await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
    await expect(page.getByRole("link", { name: "Ingresar" })).toBeVisible();
    await page.goto(
      `/auth/confirmar?token_hash=${hash}&type=signup&siguiente=/`,
    );
    await expect(page).toHaveURL(/\/ingresar\?error=enlace$/);
    await expect(page.getByText("ya se usó o expiró")).toBeVisible();
  } finally {
    if (usuario) await db.auth.admin.deleteUser(usuario);
  }
});

test("el enlace con code (PKCE) abierto en otro navegador explica que use el mismo", async ({
  page,
}) => {
  await page.goto("/auth/confirmar?code=00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/\/ingresar\?error=navegador$/);
  await expect(page.getByText("mismo navegador")).toBeVisible();
});

test("/nueva-clave sin sesión no muestra el formulario y lleva a pedir otro enlace", async ({
  page,
}) => {
  await page.goto("/nueva-clave");
  await expect(page.getByTestId("sin-enlace")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Guardar contraseña" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Pedir un enlace nuevo" }).click();
  await expect(page).toHaveURL(/\/recuperar$/);
});
