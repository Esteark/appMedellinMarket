import { test as base, expect, type Page } from "@playwright/test";

export { expect };

/**
 * Tras cargar una página, React deja el contenido que llega por streaming en un `<div hidden id="S:n">`
 * unos ~400 ms antes de mostrarlo. Mientras tanto un localizador estricto ve el contenido dos veces
 * (la copia oculta y la real): esperar a que esa copia desaparezca evita falsos fallos.
 */
export async function esperarContenido(page: Page) {
  await page.waitForFunction(() => !document.querySelector('[id^="S:"]'));
}

/** `test` de Playwright con `goto` y `reload` que esperan a que el contenido real esté en pantalla. */
export const test = base.extend({
  page: async ({ page }, use) => {
    for (const metodo of ["goto", "reload"] as const) {
      const original = page[metodo].bind(page) as (
        ...args: unknown[]
      ) => Promise<unknown>;
      // biome-ignore lint/suspicious/noExplicitAny: se conserva la firma original de Playwright
      (page as any)[metodo] = async (...args: unknown[]) => {
        const respuesta = await original(...args);
        await esperarContenido(page).catch(() => {});
        return respuesta;
      };
    }
    await use(page);
  },
});
