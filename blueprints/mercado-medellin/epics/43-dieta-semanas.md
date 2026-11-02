# Epic 43: Dieta planeada semana a semana

> Después de este epic `/dieta` tiene un planificador de 4 a 5 semanas con desayuno, almuerzo y cena, todo editable; las compras de cada semana se calculan del plan, se pueden cargar como lista y se comparan con los rubros. Las tablas fijas del PDF desaparecen.

| | |
|---|---|
| **Epic id** | `43-dieta-semanas` |
| **Tasks** | `E43-T1` … `E43-T5` |
| **Depends on** | `40-hogar-editable` |
| **Unlocks** | nada |

Fuente de detalle: `blueprint.md` paso 43. **Gate:** `pnpm typecheck && pnpm lint && pnpm test`. Sin migración y sin dependencias nuevas.

## Tareas

### E43-T1 — Modelo de semanas en `configPlan` · `paso-43a`
`semanas` opcional (4 a 5, 7 días, tres comidas y despensa) y operaciones puras en `src/lib/planes/semanas.ts`; un plan sin `semanas` sigue siendo válido.

### E43-T2 — Compras y costo derivados · `paso-43b`
`comprasDeSemana`, `costoDeCompras` (sin precio → «sin dato», nunca estimado) y `comprasDelMes` en `src/lib/planes/compras.ts`.

### E43-T3 — Planificador semanal editable · `paso-43c`
Pestañas de semana, tres comidas por día, «Repetir en todos los días», despensa, «Traer la lista base», «Agregar/Quitar semana 5» y avisos nuevos.

### E43-T4 — Compras de la semana y comparación · `paso-43d`
Panel «Compras de la semana N» con total animado, «Usar como mi lista» y «Sumar»; `compara-presupuesto` usa `comprasDelMes`.

### E43-T5 — Limpiar `/dieta` y E2E · `paso-43e`
Se borran `dieta-tablas.tsx` y el aviso fijo; «Consejos» plegable; pgTAP ampliado; `tests/e2e/dieta-semanas.spec.ts` con y sin sesión, axe y móvil 390 px.
