# Épico 23: Presupuesto real (Hogar/Dieta editables + `/presupuesto`)

## Objetivo

Convertir Hogar/Dieta en presupuestos editables y añadir seguimiento de gastos reales con gráficas, desfases y aprendizajes.

## Estado
- [ ] Pendiente

## Pasos

### 23.0 Preparación
- [ ] Crear epic
- [ ] Añadir pestaña "Presupuesto" a la navegación
- [ ] Crear carpetas base

### 23.1 Schema + Tipos
- [ ] Migración `presupuestos_mensuales` y `gastos_reales` + RLS
- [ ] Tipos puros en `src/lib/presupuesto/tipos.ts`
- [ ] Generar tipos de Supabase

### 23.2 Lógica pura
- [ ] `calculos.ts`, `desfases.ts`, `aprendizajes.ts`, `utils.ts`
- [ ] Tests unitarios

### 23.3 Hacer Hogar/Dieta editables
- [ ] Modal/Hoja "Cuadrar presupuesto"
- [ ] Persistencia localStorage + sesión
- [ ] Integrar en `/hogar` y `/dieta`

### 23.4 Ruta `/presupuesto` base
- [ ] Página con selector de mes
- [ ] Resumen, agregar gasto, seguimiento por rubro
- [ ] Server actions

### 23.5 Gráficas + desfases
- [ ] Gráficas con Recharts
- [ ] Indicadores visuales de desfase
- [ ] Animaciones respetando `prefers-reduced-motion`

### 23.6 Aprendizajes + integración final
- [ ] Aprendizajes/situaciones automáticos
- [ ] Fusión al iniciar sesión
- [ ] Tests e2e
- [ ] Gate completo

## Criterio de hecho

- [ ] Se puede editar presupuesto por rubro en Hogar/Dieta
- [ ] Se pueden agregar gastos manuales y ver acumulado vs presupuestado
- [ ] Hay gráficas de desfase y proyección
- [ ] Aparece sección "Aprendizajes / Situaciones del mes" con insights generados
- [ ] Funciona sin sesión (localStorage) y con sesión (Supabase)
- [ ] Gate verde: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e`
