# Epic 44: Catálogo por tienda

> Después de este epic cada tienda ofrece solo los productos de su catálogo; un producto nuevo se agrega a una o varias tiendas desde `/tiendas`, la Canasta o Anotados; el ícono se elige con un selector de emojis; y la lista del carrito muestra la tienda de cada producto en «Por grupo».

| | |
|---|---|
| **Epic id** | `44-catalogo-por-tienda` |
| **Tasks** | `E44-T1` … `E44-T6` |
| **Depends on** | `43-dieta-semanas` (orden de construcción), pasos 32, 34 y 35 |
| **Unlocks** | nada |

Fuente de detalle: `blueprint.md` paso 44. **Gate:** `pnpm typecheck && pnpm lint && pnpm test`. Una migración y sin dependencias nuevas.

## Tareas

### E44-T1 — Migración, siembra y funciones · `paso-44a`
`catalogo_tienda` sembrado para todas las tiendas con los productos que hoy tienen precio, vista `precio_catalogo`, `agregar_a_tienda`, `quitar_de_tienda`, y `corregir_precio` / `importar_compra` que reactivan el producto. Siembra también en `scripts/migrar.ts`. pgTAP nuevo.

### E44-T2 — Lectura por catálogo y tienda en el carrito · `paso-44b`
`catalogo()`, `productosGestion()` y `catalogoTiendas()` leen `precio_catalogo`; `ProductoGestion.tiendas`; `FilaSeccion.tienda` y el nombre de la tienda en las filas de «Por grupo» y «Todo».

### E44-T3 — Selector de emojis · `paso-44c`
`src/data/emojis.ts` y `emoji-selector.tsx` (categorías, buscador, campo libre, «Sin ícono»), usados en la hoja de producto y en la edición en línea de `/tiendas`.

### E44-T4 — Agregar y quitar productos por tienda en `/tiendas` · `paso-44d`
Acciones `agregarATienda` y `quitarDeTienda`, `crearProducto` con tiendas, hoja «Agregar a esta tienda», «Nuevo producto» con varias tiendas y pestañas que muestran solo el catálogo de la tienda.

### E44-T5 — Canasta, Anotados y el resto de flujos · `paso-44e`
Botón «Agregar producto» en la Canasta y en Anotados, tabla de Anotados por catálogo, y el selector de emoji en Barrio, los `propios` de los planes y la revisión de importaciones.

### E44-T6 — E2E y documentación · `paso-44f`
`tests/e2e/catalogo-por-tienda.spec.ts` (con y sin sesión, axe y móvil 390 px), `CLAUDE.md` con la nueva fuente única y un innegociable, y `pnpm exec supabase test db` en verde.
