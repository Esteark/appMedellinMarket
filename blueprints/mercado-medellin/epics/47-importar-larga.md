# Epic 47: Importar facturas largas sin fricción

> Después de este epic, importar una factura de decenas de líneas es revisar un resumen y decidir por excepción: lo que ya existe solo registra el gasto, lo nuevo se crea con ícono, grupo y unidad propuestos, lo que no es producto queda como solo gasto, y el tope diario es de 200 productos nuevos.

| | |
|---|---|
| **Epic id** | `47-importar-larga` |
| **Tasks** | `E47-T1` … `E47-T6` |
| **Depends on** | pasos 34 y 44 |
| **Unlocks** | nada |

Fuente de detalle: `blueprint.md` paso 47. **Gate:** `pnpm typecheck && pnpm lint && pnpm test`. Una migración y sin dependencias nuevas.

## Tareas

### E47-T1 — Inferencia de ícono, grupo y unidad · `paso-47a`
`src/data/palabras-producto.ts` e `inferir.ts` (puros), y la factura real como entrada de prueba.

### E47-T2 — Sugerencias seguras y resumen con cupo · `paso-47b`
`sugerir.ts` y `resumen.ts` (puros): sugerencias por subconjunto de palabras, resumen y `repartirCupo`.

### E47-T3 — Migración: tope de 200 y productos con ficha · `paso-47c`
`crear_producto` a 200 e `importar_compra` con `emoji`, `grupo` y `cantidad_base`; `cupoDeProductos()`; pgTAP.

### E47-T4 — Modelo de la revisión · `paso-47d`
`FilaRevision` con `modo`, `emoji`, `grupo` y `cantidadBase`; `aRevision`, líneas repetidas juntas y `aPayload`.

### E47-T5 — Pantalla de revisión · `paso-47e`
Partir `revision.tsx` y `importar-factura.tsx`: resumen con cupo, filtros y acciones masivas, filas con decisión y sugerencia, y barra de guardado.

### E47-T6 — E2E con la factura real y documentación · `paso-47f`
`tests/e2e/importar-larga.spec.ts`, axe en 390 px y `CLAUDE.md`.
