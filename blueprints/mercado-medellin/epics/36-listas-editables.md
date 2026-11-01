# Epic 36: Listas editables y prompt de listas para más tipos

> Después de este epic se ve y se edita el contenido de cada lista guardada, se guardan cambios desde la lista principal y el prompt de listas acepta más tipos de listado.

| | |
|---|---|
| **Epic id** | `36-listas-editables` |
| **Tasks** | `E36-T1` … `E36-T7` |
| **Depends on** | `35-tiendas-y-listas` |
| **Unlocks** | nada |

Fuente de detalle: `blueprint.md` pasos 37, 38 y 39. **Gate:** `pnpm typecheck && pnpm lint && pnpm test`. Los tags siguen el esquema `paso-NN` con sufijo de letra.

## Tareas

### E36-T1 — Prompt de listas para varios tipos y lector tolerante · `paso-39a`
`prompts/importar-lista.md` con una sección «Casos», `prompt-lista.ts` y `lista.ts` (cantidad y unidad vacías valen `1 u`).

### E36-T2 — Funciones puras para editar una lista guardada · `paso-37a`
`ajustarItem`, `quitarItem`, `agregarItem` y `actualizarLista` en `src/lib/listas/guardadas.ts`.

### E36-T3 — Ver y editar los productos dentro de la tarjeta de lista · `paso-37b`
`contenido-lista.tsx`, «Ver productos» en `tarjeta-lista.tsx`, catálogo hasta `ListasGuardadas`, aviso `lista_actualizada` y paso del tutorial.

### E36-T4 — Probar de punta a punta la edición desde /listas · `paso-37c`
`tests/e2e/listas-editar.spec.ts`.

### E36-T5 — Recordar de qué lista guardada salió la lista activa · `paso-38a`
`src/lib/listas/origen.ts` (puro) y el marcador `mercado-medellin:lista-origen` en `use-lista.ts`.

### E36-T6 — Guardar cambios en la lista de origen desde la lista principal · `paso-38b`
«Guardar cambios en «X»», chip «Viene de» y «cambios sin guardar».

### E36-T7 — Probar de punta a punta guardar cambios desde la lista principal · `paso-38c`
Se amplía `tests/e2e/listas-editar.spec.ts`.
