# Epic 46: Gastos editables y dinero con formato de pesos

> Después de este epic, en `/presupuesto` cada gasto (manual o llegado de una factura) se edita en la propia fila de la tabla, y todos los campos de dinero muestran los puntos de miles mientras se escribe (3000 se ve 3.000) sin cambiar lo que se guarda.

| | |
|---|---|
| **Epic id** | `46-gastos-editables` |
| **Tasks** | `E46-T1` … `E46-T5` |
| **Depends on** | pasos 23 y 34 (el orden de construcción va después del epic 45; no comparten código) |
| **Unlocks** | nada |

Fuente de detalle: `blueprint.md` paso 46. **Gate:** `pnpm typecheck && pnpm lint && pnpm test`. Sin migración y sin dependencias nuevas.

## Tareas

### E46-T1 — Formato de pesos y campo de moneda · `paso-46a`
`src/lib/moneda.ts` (puro: `soloDigitos`, `conMiles`, `aNumero`, `posicionTrasFormato`) y `campo-moneda.tsx`; pruebas unitarias.

### E46-T2 — Aplicar el campo de moneda en `/presupuesto` · `paso-46b`
Precio por unidad, precio total, monto total y presupuesto por rubro del seguimiento usan `CampoMoneda`; lo guardado sigue siendo un entero.

### E46-T3 — Ampliar `editarGasto` · `paso-46c`
La acción acepta producto, cantidad y descripción; prueba de integración con Supabase local.

### E46-T4 — Tabla de gastos editable · `paso-46d`
`tabla-gastos.tsx` y `fila-gasto.tsx` salen de `presupuesto-cliente.tsx`; edición en línea con sesión y sin ella, y cambio de mes.

### E46-T5 — E2E y documentación · `paso-46e`
`tests/e2e/gastos-editables.spec.ts` (con y sin sesión, tras importar una factura, axe y móvil 390 px) y `CLAUDE.md`.
