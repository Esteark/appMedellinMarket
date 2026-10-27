import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("sin sesión se ven los precios", async ({ page }) => {
  await page.goto("/");
  const precio = page.getByTestId("tarjeta-aceite").locator("[data-minimo]");
  await expect(precio).toBeVisible();
  expect(await precio.textContent()).toMatch(/\d/);
  await expect(page.getByTestId("usuario")).toHaveCount(0);
});

// Cada ruta espera su contenido real: axe sobre el esqueleto no demostraría nada.
const RUTAS = [
  ["/", "tarjeta-aceite"],
  ["/anotados", "celda-aceite-d1"],
  ["/hogar", "items-hogar"],
  ["/dieta", "plan-semana-reemplazar"],
  ["/alertas", "alertas-ingresar"],
] as const;

for (const [ruta, listo] of RUTAS) {
  test(`accesibilidad en ${ruta}: sin violaciones serias ni críticas`, async ({
    page,
  }) => {
    // Sin animaciones: a media entrada la opacidad parcial falsea el contraste que mide axe.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(ruta);
    await expect(page.getByTestId(listo)).toBeVisible();
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const graves = violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    // Si falla, el mensaje dice qué regla y qué nodos.
    expect(
      graves.map((v) => ({ id: v.id, nodos: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  });
}
