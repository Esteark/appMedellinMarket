import type { Page } from "@playwright/test";
import { expect, test } from "./ayuda";

const VISTAS = [
  {
    nombre: "móvil 360×740",
    viewport: { width: 360, height: 740 },
    tactil: true,
    columnas: 2,
  },
  {
    nombre: "tableta 768×1024",
    viewport: { width: 768, height: 1024 },
    tactil: true,
    columnas: 3,
  },
  {
    nombre: "escritorio 1280×800",
    viewport: { width: 1280, height: 800 },
    tactil: false,
    columnas: 3,
  },
];

const columnas = (page: Page) =>
  page
    .getByTestId("rejilla")
    .evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
    );

for (const v of VISTAS) {
  test.describe(v.nombre, () => {
    test.use({ viewport: v.viewport, hasTouch: v.tactil, isMobile: v.tactil });

    for (const ruta of ["/", "/antojos"])
      test(`${ruta}: sin desplazamiento horizontal y ${v.columnas} columnas`, async ({
        page,
      }) => {
        await page.goto(ruta);
        await expect(page.getByTestId("rejilla")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
        expect(await columnas(page)).toBe(v.columnas);
      });

    test("flechas del deslizador y tamaño de los controles", async ({
      page,
    }) => {
      await page.goto("/");
      const chips = page.getByTestId("chips-grupos");
      await expect(chips).toBeVisible();
      const flechaDer = chips
        .locator("xpath=..")
        .locator('[data-flecha="der"]');

      if (!v.tactil) {
        await expect(flechaDer).toBeVisible();
        for (let i = 0; i < 10 && (await flechaDer.isVisible()); i++) {
          await flechaDer.click();
          await page.waitForTimeout(400);
        }
        await expect(chips.getByRole("button").last()).toBeInViewport();
        return;
      }

      await expect(page.locator("[data-flecha]:visible")).toHaveCount(0);
      const pequenos = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("button, a")]
          .filter((el) => el.checkVisibility())
          .map((el) => ({
            texto: el.textContent?.trim() || el.getAttribute("aria-label"),
            // offsetHeight: tamaño de layout, sin la escala de una animación de entrada (toasts).
            alto: el.offsetHeight,
          }))
          .filter((x) => x.alto > 0 && x.alto < 44),
      );
      expect(pequenos).toEqual([]);
      if (v.viewport.width === 360) {
        const tamano = await page
          .getByRole("searchbox", { name: "Buscar producto" })
          .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
        expect(tamano).toBeGreaterThanOrEqual(16);
      }
    });
  });
}
