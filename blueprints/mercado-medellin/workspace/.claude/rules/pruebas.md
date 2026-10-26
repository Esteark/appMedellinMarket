---
paths:
  - "tests/**"
---

# Pruebas

- Unitarias en `tests/unit/*.test.ts` (sin red, sin base). Integración en `tests/integracion/*.test.ts` (Supabase local + `.env.local`). E2E en `tests/e2e/*.spec.ts` (Playwright).
- Las pruebas de integración crean sus propios usuarios con `auth.admin.createUser` (correo único por corrida) y los borran al final.
- Fixtures de sitios: solo los capturados por `pnpm capturar` en `tests/fixtures/`. Variantes (sin existencias, precio 0) se derivan en memoria del fixture.
- `fetch` falso: `tests/helpers/fetch-falso.ts`; sirve fixtures por URL y responde 404 al resto.
- Nada de `.skip` ni `.only` en código commiteado.
- Las aserciones afirman propiedades (tipo, monto, tienda, conteos derivados del export), nunca textos con formato de moneda o fecha del runtime.
- E2E: correos únicos por corrida (`e2e-<timestamp>@ejemplo.test`); Supabase local tiene la confirmación por correo desactivada.
- Los specs e2e no importan nada de `src/`.
