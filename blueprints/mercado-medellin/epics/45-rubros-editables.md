# Epic 45: Rubros del plan editables

> Después de este epic, en Hogar y en Dieta la persona agrega, renombra, quita y reordena los rubros del plan, y le asigna a cada uno los grupos de producto que cuenta; la comparación con la lista reparte el gasto como ella lo definió.

| | |
|---|---|
| **Epic id** | `45-rubros-editables` |
| **Tasks** | `E45-T1` … `E45-T4` |
| **Depends on** | `44-catalogo-por-tienda` (orden de construcción), pasos 29, 40 y 43 |
| **Unlocks** | nada |

Fuente de detalle: `blueprint.md` paso 45. **Gate:** `pnpm typecheck && pnpm lint && pnpm test`. Sin migración y sin dependencias nuevas.

## Tareas

### E45-T1 — Modelo de rubros y esquema · `paso-45a`
`src/lib/planes/rubros.ts` (puro) con agregar, renombrar, quitar, mover, asignar grupo, `rubroDeProducto` y los grupos de fábrica; `configPlan` gana `orden` y `grupos` opcionales y tolerantes.

### E45-T2 — La comparación usa los rubros del plan · `paso-45b`
`ComparaPresupuesto` reparte el gasto con `rubroDeProducto(config, p)`; `gruposDeProductos()` para conocer los grupos del catálogo.

### E45-T3 — Editor de rubros · `paso-45c`
`presupuesto-editable.tsx` partido en `rubro-fila.tsx`, `rubro-nuevo.tsx` y `rubro-grupos.tsx`: agregar, renombrar, quitar con «Deshacer», ↑ ↓ y chips de grupos, más los avisos nuevos.

### E45-T4 — E2E y documentación · `paso-45d`
`tests/e2e/rubros.spec.ts` (Hogar y Dieta, con y sin sesión, axe y móvil 390 px) y `CLAUDE.md` con la nueva fuente única.
