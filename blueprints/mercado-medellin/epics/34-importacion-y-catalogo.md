# Epic 34: Importación de facturas y catálogo compartido

> Después de este epic se puede importar una factura en CSV, con tiendas y productos compartidos y la opción de deshacer el lote.

| | |
|---|---|
| **Epic id** | `34-importacion-y-catalogo` |
| **Tasks** | `E34-T1` … `E34-T6` |
| **Depends on** | pasos 1–33 ya construidos |
| **Unlocks** | `35-tiendas-y-listas` |

Fuente de detalle: `blueprint.md` paso 34 (SQL completo de la migración, contrato del CSV y reglas de §5). Este epic resume cada tarea; si algo no alcanza, el SQL y las reglas viven en el paso 34 y en §5 «Catálogo compartido» e «Importación de una factura».

## Stack y comandos

Next.js 16 · TypeScript · Supabase local · Vitest + Playwright · pnpm.

| Tarea | Comando |
|---|---|
| Typecheck / lint | `pnpm typecheck` · `pnpm lint` |
| Un test | `pnpm test <ruta>` |
| E2E | `pnpm test:e2e <ruta>` |
| Base local | `pnpm exec supabase start` · `pnpm exec supabase db reset` · `pnpm migrar` |
| RLS (pgTAP) | `pnpm exec supabase test db` |
| Tipos | `pnpm gen:tipos` |

**Gate:** `pnpm typecheck && pnpm lint && pnpm test`. Supabase local debe estar arriba. Los tags de checkpoint siguen el esquema del blueprint (`paso-NN`) con sufijo de letra por tarea.

## Tareas

### E34-T1 — Migrar catálogo compartido y funciones de importación · `paso-34a` · p0
Migración `supabase/migrations/<ts>_importar_compras.sql` con el SQL del paso 34, más `supabase/tests/importar_compras.test.sql`. No se edita ninguna migración aplicada.
- Files: `supabase/migrations/*_importar_compras.sql`, `supabase/tests/importar_compras.test.sql`, `src/lib/supabase/tipos.ts`
- Verify: ver `tasks.json`.

### E34-T2 — Leer el CSV de una factura y calcular su hash · `paso-34b` · p0
`tipos.ts`, `csv.ts`, `hash.ts` puros en `src/lib/importar/` y los CSV sintéticos `tests/importar/*.csv` (con cabecera `#` que dice que son de prueba).

### E34-T3 — Emparejar productos, rubros y prompt de factura · `paso-34c` · p0
`emparejar.ts` (código → alias de tienda → alias global → nombre normalizado; exacto, nunca por parecido), `prompt.ts` (`PROMPT_FACTURA`, igual a `prompts/importar-gastos.md`) y `rubros.ts` (`grupoARubro` corregido).

### E34-T4 — Acciones de servidor y almacenamiento de importaciones · `paso-34d` · p0
`previsualizarCompra`, `importarCompra`, `listarImportaciones`, `deshacerImportacion`, `editarGasto` con zod; almacenamiento local con try/catch; `catalogoTiendas()` paginado; claves de aviso nuevas.

### E34-T5 — Pestaña Importar factura en /presupuesto · `paso-34e` · p0
Componentes `importar-factura`, `revision`, `resultado`, `prompt` y la pestaña en `presupuesto-cliente.tsx`. Cada archivo ≤ 250 líneas. Solo `.csv`; nada se sube.

### E34-T6 — Probar de punta a punta la importación de facturas · `paso-34f` · p0
`tests/e2e/importar.spec.ts` con el flujo pegar → revisar → guardar → repetir → deshacer, y `pnpm migrar` sigue en `precios=432 tiendas=4`.
