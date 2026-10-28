# Épico 23: Presupuesto real (Hogar/Dieta editables + `/presupuesto`)

## Objetivo

Convertir Hogar/Dieta en presupuestos editables y añadir seguimiento de gastos reales con gráficas, desfases y aprendizajes.

## Estado
- [x] Completado

## Pasos

### 23.0 Preparación
- [x] Crear epic
- [x] Añadir pestaña "Presupuesto" a la navegación
- [x] Crear carpetas base

### 23.1 Schema + Tipos
- [x] Migración `presupuestos_mensuales` y `gastos_reales` + RLS
- [x] Tipos puros en `src/lib/presupuesto/tipos.ts`
- [x] Generar tipos de Supabase

### 23.2 Lógica pura
- [x] `calculos.ts`, `desfases.ts`, `aprendizajes.ts`, `utils.ts`
- [x] Tests unitarios

### 23.3 Hacer Hogar/Dieta editables
- [x] Modal/Hoja "Cuadrar presupuesto"
- [x] Persistencia localStorage + sesión
- [x] Integrar en `/hogar` y `/dieta` con animaciones

### 23.4 Ruta `/presupuesto` base
- [x] Página con selector de mes
- [x] Resumen, agregar gasto, seguimiento por rubro
- [x] Server actions

### 23.5 Gráficas + desfases
- [x] Gráficas con indicadores visuales
- [x] Indicadores visuales de desfase
- [x] Animaciones respetando `prefers-reduced-motion`

### 23.6 Aprendizajes + integración final
- [x] Aprendizajes/situaciones automáticos
- [x] Fusión al iniciar sesión
- [x] Tests unitarios
- [x] Gate completo

### 23.7 Mejoras implementadas
- [x] 23.7.0 Animación al abrir panel de notificaciones (actualizar-precios)
- [x] 23.7.1 Animaciones en secciones de Hogar/Dieta al cargar/editar
- [x] 23.7.2 Mejorar "Agregar gasto" en `/presupuesto`: permitir anotar por producto con buscador + agregar producto nuevo, cantidad, precio por unidad/total, agrupar por grupo, autocompletar desde catálogo
- [x] 23.7.3 Asociar gastos con productos del catálogo cuando sea posible

### 23.8 Histórico de presupuesto + gráficas de evolución
- [x] 23.8.0 Crear migración `presupuestos_cierres` (`user_id`, `mes`, `total_presupuestado`, `total_gastado`, `ahorro`, `por_rubro` jsonb, `created_at`) con RLS por usuario + tipos
- [x] 23.8.1 Lógica pura `generarSnapshotCierre` (solo datos reales) + tests
- [x] 23.8.2 Almacenamiento local + acciones DB para cierres
- [ ] 23.8.3 Pestaña "Histórico" en `/presupuesto` con comparativa mes a mes
- [ ] 23.8.4 Gráficas de evolución con Recharts (barras/línea) por mes y rubro

### 23.9 Animaciones en notificaciones al aparecer
- [ ] Animar entradas/salidas del `Toaster` al aparecer (slide/fade) con GSAP o CSS, respetando `prefers-reduced-motion`
- [ ] Pulir animación del panel de notificaciones al abrir/cerrar
- [ ] Ajustes en `.aviso` de `globals.css` sin romper layout móvil

### 23.10 Notificaciones laterales no invasivas con retardo
- [ ] Añadir segundo `Toaster` en `bottom-right` o stack propio para "tips/sugerencias"
- [ ] Catálogo cerrado de tips en `src/lib/avisos.ts` (sin inventar mensajes)
- [ ] Reglas de aparición con retardo prudencial (tiempo en app / cambio de ruta) y máximo 1 activo
- [ ] Cooldown con `localStorage` + opcional `preferencias_notif` para silenciar
- [ ] Animación slide-in desde derecha, dismissible, respeta `prefers-reduced-motion`
- [ ] Comprobar no solapamiento con carrito/barra móvil

## Criterio de hecho

- [x] Se puede editar presupuesto por rubro en Hogar/Dieta
- [x] Se pueden agregar gastos manuales y ver acumulado vs presupuestado
- [x] Hay gráficas de desfase y proyección
- [x] Aparece sección "Aprendizajes / Situaciones del mes" con insights generados
- [x] Funciona sin sesión (localStorage) y con sesión (Supabase)
- [ ] Se puede ver histórico mensual con gráficas de evolución y comparativa
- [ ] Notificaciones/toasts aparecen con animación fluida al mostrarse
- [ ] Pueden aparecer sugerencias laterales no invasivas tras retardo con cooldown
- [ ] Gate verde: `pnpm typecheck && pnpm lint && pnpm test` (build OK)
