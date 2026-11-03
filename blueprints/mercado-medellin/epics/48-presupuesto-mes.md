# Epic 48: Presupuesto por rubro por mes, en la cuenta y con historial

> Después de este epic, los montos del seguimiento por rubro viven en la cuenta, son de cada mes (noviembre conserva los suyos), un mes nuevo arranca con los del mes anterior y cada cambio de monto queda en un historial.

| | |
|---|---|
| **Epic id** | `48-presupuesto-mes` |
| **Tasks** | `E48-T1` … `E48-T5` |
| **Depends on** | paso 46 |
| **Unlocks** | nada |

Fuente de detalle: `blueprint.md` paso 48. **Gate:** `pnpm typecheck && pnpm lint && pnpm test`. Una migración y sin dependencias nuevas.

## Tareas

### E48-T1 — Migración: historial y guardado atómico por mes · `paso-48a`
Tabla `presupuestos_historial` con RLS, disparador sobre `presupuestos_mensuales` y `guardar_presupuesto_mes`; pgTAP.

### E48-T2 — Lógica pura y almacenamiento local por mes · `paso-48b`
`por-mes.ts` (`mesAnterior`, `presupuestoDelMes`, `describirCambio`) y las funciones por mes de `almacenamiento.ts`.

### E48-T3 — Acciones del presupuesto por mes · `paso-48c`
`guardarPresupuestoMensual` sobre la función, `obtenerPresupuestosHasta`, `listarHistorialPresupuesto` y el aviso `presupuesto_no_guardado`; integración.

### E48-T4 — Pantalla: hook por mes, historial y sincronizador · `paso-48d`
`use-presupuesto-mes.ts`, `historial-presupuesto.tsx`, la nota de montos heredados y `presupuesto-cliente.tsx` sin crecer.

### E48-T5 — E2E y documentación · `paso-48e`
`tests/e2e/presupuesto-mes.spec.ts` y `CLAUDE.md`.
