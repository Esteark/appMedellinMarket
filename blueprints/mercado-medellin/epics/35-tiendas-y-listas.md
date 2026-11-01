# Epic 35: Gestión de tiendas y carga de listas desde texto

> Después de este epic existe `/tiendas` para administrar y fusionar el catálogo, y se pueden cargar listas de mercado desde un CSV generado con un prompt.

| | |
|---|---|
| **Epic id** | `35-tiendas-y-listas` |
| **Tasks** | `E35-T1` … `E35-T7` |
| **Depends on** | `34-importacion-y-catalogo` |
| **Unlocks** | nada |

Fuente de detalle: `blueprint.md` pasos 35 (fusión y `/tiendas`) y 36 (cargar lista desde texto).

## Stack y comandos

Los mismos del epic 34. **Gate:** `pnpm typecheck && pnpm lint && pnpm test`. Supabase local arriba.

## Tareas

### E35-T1 — Migrar la fusión de productos duplicados · `paso-35a` · p1
`supabase/migrations/<ts>_fusionar_productos.sql` (tabla `fusiones_productos`, función `fusionar_productos`) con pgTAP `fusion.test.sql` y `tiendas.test.sql`.

### E35-T2 — Lógica de fusión y acciones de /tiendas · `paso-35b` · p1
`src/lib/tiendas/fusion.ts` (puro), `src/app/tiendas/acciones.ts` (zod: tienda 2–60, producto 2–120), claves de aviso y `datos.ts`.

### E35-T3 — Pantalla /tiendas con edición y diálogo de fusión · `paso-35c` · p1
`page.tsx`, `vista.tsx`, `tabla-productos.tsx`, `dialogo-fusion.tsx` y el enlace «Tiendas» en el encabezado. Nunca un botón «Borrar». Cada componente ≤ 250 líneas.

### E35-T4 — Probar de punta a punta /tiendas y la fusión · `paso-35d` · p1
`tests/e2e/tiendas.spec.ts`; `pnpm migrar` sigue en `precios=432 tiendas=5`.

### E35-T5 — Leer el CSV de una lista y convertir unidades · `paso-36a` · p1
`src/lib/importar/lista.ts` y `prompt-lista.ts` (puros). Contrato `lista,producto,cantidad,unidad,nota`; `lb` = 500 g; el ítem es `ceil(pedido / cantidad_base)`; «aprox.» solo viaja en la nota. Prompt en `prompts/importar-lista.md`.

### E35-T6 — Cargar lista desde texto en /listas · `paso-36b` · p1
`cargar-lista.tsx` con revisión por sección, `registrarAliasLista`, claves de aviso y un paso `cargar-lista` en el tutorial. Reusa `leerLocales`/`guardarLocales`/`persistir` del paso 28.

### E35-T7 — Probar de punta a punta la carga de listas · `paso-36c` · p1
`tests/e2e/cargar-lista.spec.ts`: cargar → revisar → usar como lista activa → guardar en dispositivo y en cuenta → nombre repetido → alias recordado.
