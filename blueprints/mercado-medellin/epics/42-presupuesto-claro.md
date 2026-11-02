# Epic 42: Presupuesto claro

> Después de este epic `/presupuesto` deja claro de dónde sale «Presupuestado» (campo por rubro en «Seguimiento por rubro») y «Proyección fin de mes» (ritmo lineal), y «Agregar gasto» ofrece unidades y cantidades predefinidas sin perder el texto libre.

| | |
|---|---|
| **Epic id** | `42-presupuesto-claro` |
| **Tasks** | `E42-T1` |
| **Depends on** | `23-presupuesto-real` |

Fuente de detalle: `blueprint.md` paso 42. **Gate:** `pnpm typecheck && pnpm lint && pnpm test`.

### E42-T1 · `paso-42`
Campo numérico por rubro, leyendas de origen, `<datalist>` de unidades y chips de cantidad; E2E `presupuesto-claro.spec.ts`.
