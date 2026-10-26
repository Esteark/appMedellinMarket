# Mercado Medellín — instrucciones para agentes

Compara precios de mercado en tiendas de Medellín: web pública (Next.js) + corrida diaria en GitHub Actions + Supabase.

## Comandos

| Tarea | Comando |
|---|---|
| Instalar | `pnpm install --frozen-lockfile` |
| Desarrollo | `pnpm dev` |
| Build + humo | `pnpm build` · `pnpm humo` |
| Typecheck / lint | `pnpm typecheck` · `pnpm lint` |
| Pruebas | `pnpm test` · `pnpm test:e2e` |
| Supabase local | `pnpm exec supabase start` · `pnpm exec supabase db reset` · `pnpm exec supabase test db` |
| Datos | `pnpm env:local` · `pnpm migrar` · `pnpm gen:tipos` |
| Corrida | `pnpm corrida` · `pnpm corrida --ayuda` |

**Gate:** `pnpm typecheck && pnpm lint && pnpm test`.

## Innegociables

1. La service role key solo existe en `src/corrida/admin.ts`, `scripts/` y los secrets de GitHub.
2. Una corrida que falla no pasa en silencio: excepción → exit 1 y correo al admin.
3. Respetar robots.txt, User-Agent propio, ≥1 s entre peticiones por tienda; nunca captchas ni logins.
4. Fixtures de `tests/fixtures/` solo capturados con `pnpm capturar`, nunca a mano.
5. Nunca commitear secretos, `.env.local` ni salida de build; nunca editar `tipos.ts` ni una migración aplicada.
6. Nunca marcar una tarea como hecha con un gate en rojo.

Arquitectura, fronteras y tokens de diseño: `CLAUDE.md` en este directorio (fuente de verdad).
