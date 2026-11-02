# Epic 40: Hogar editable desde el primer campo y presupuestos guardados

> Después de este epic la pestaña Hogar abre con los montos editables, anima el total y el reparto, muestra un solo desglose y permite guardar varios presupuestos con nombre (en la cuenta con sesión, en el dispositivo sin ella).

| | |
|---|---|
| **Epic id** | `40-hogar-editable` |
| **Tasks** | `E40-T1` … `E40-T4` |
| **Depends on** | `23-presupuesto-real` (paso 29) |
| **Unlocks** | nada |

Fuente de detalle: `blueprint.md` paso 40 y §5 y §7. **Gate:** `pnpm typecheck && pnpm lint && pnpm test`. Los tags siguen el esquema `paso-NN` con sufijo de letra.

## Tareas

### E40-T1 — Migración `planes_guardados` y lectura de las copias · `paso-40a`
Tabla `planes_guardados` con `nombre_clave` generada, RLS por usuario y `revoke`/`grant`; pgTAP; `planGuardado` devuelve el plan activo y sus copias en paralelo; `pnpm gen:tipos`.

### E40-T2 — Lógica pura de guardados y sincronización · `paso-40b`
`src/lib/planes/guardados.ts` (validar, normalizar, recortar a 20, fusionar por nombre y huella) y `sincronizarPlanes(tipo, planes)` con zod y upsert por `user_id,tipo,nombre_clave`.

### E40-T3 — Pestaña Hogar sin ruido y montos animados · `paso-40c`
Orden resumen → rubros → guardados → productos → comparación; se retira `HogarTablas`; `ValorAnimado` con GSAP; `rubroDe` alineado con los 11 rubros; la comparación usa `config.rubros`.

### E40-T4 — Guardar, cargar y eliminar presupuestos con nombre · `paso-40d`
`MisPresupuestos` en un `<details>`, CRUD en `PlanProvider`, avisos y E2E `tests/e2e/planes-guardados.spec.ts` con y sin sesión.
