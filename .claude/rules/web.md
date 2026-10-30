---

paths:
- "src/app/**"
- "src/components/**"
- "src/proxy.ts"

---

# Web (Next.js 16)

- Server components por defecto; `"use client"` solo en la hoja interactiva (catálogo, carrito, hoja de detalle, campana, gráficos, tabla de anotados).
- Toda lectura de datos en un componente async envuelto en `<Suspense fallback={...}>`. Nada de `export const dynamic` ni `revalidate`. Route handlers que leen la base: `await connection()` primero.
- Sesión: `src/lib/supabase/server.ts` (`createServerClient` con `cookies: { getAll, setAll }`). En servidor la identidad sale de `supabase.auth.getClaims()`, nunca de `getSession()`.
- `src/proxy.ts` exporta `async function proxy` (no `middleware.ts`).
- Mutaciones = server actions que validan con zod y devuelven `{ ok: true } | { ok: false, error: string }`.
- Sin sesión la lista vive en `localStorage` (siempre dentro de try/catch); con sesión en la tabla `listas`.
- Las listas con nombre viven en `listas_guardadas` (local `mercado-medellin:listas`) y el plan editable en `planes_usuario` (local `mercado-medellin:plan:{hogar|dieta}`). Los rubros del plan no se mezclan con `presupuestos_mensuales`.
- El pronóstico se muestra como rango con probabilidad y confianza, rotulado "estimación estadística": nunca como un precio ni dentro de totales, óptimo, alertas o PDF.
- `/anotados/barrio` es la vista propia de Tienda/Carnicería: progreso "N/41 con precio · M por actualizar", agrupada por Proteínas, Lácteos, Panadería y Despensa. La etiqueta de vencimiento es `actualizar` (14 días diaria / 30 semanal), nunca `desactualizado`, y enlaza a esa vista. Sin precio se muestra "sin dato", jamás un estimado.
- El tutorial (`src/components/tutorial/`) se muestra una vez por dispositivo (`mercado-medellin:tutorial:v1`), se salta con `Esc` o "Saltar", atrapa el foco y no aparece en `/ingresar`, `/registro`, `/recuperar`, `/nueva-clave` ni `/auth/*`. El botón de bombilla va abajo a la izquierda (48 px, 20 px del borde, por encima de `env(safe-area-inset-bottom)`) para no chocar con "Guardar lista" abajo a la derecha ni con la barra del carrito.
- Mientras el tutorial está abierto o completado, `TipsNoInvasivos` no muestra tips. Con `prefers-reduced-motion: reduce` el foco y la tarjeta cambian sin animación. Los pasos se buscan por `data-tour`; si el objetivo no existe, el paso se salta.
- Colores solo por token (`bg-card`, `text-muted-foreground`, `bg-save-bg`…), nunca hex en componentes.
- Cada animación usa los helpers de `src/lib/animaciones.ts`, que respetan `prefers-reduced-motion`.
- Arrastrar la hoja inferior siempre tiene alternativa: botón "Cerrar" visible (WCAG 2.5.7).
- Nunca más de un gráfico Recharts montado por vista: pestañas que montan uno a la vez.
- Notificaciones: solo con `avisar(clave)` de `src/lib/avisos.ts` (catálogo del paso 14 del blueprint); nunca un texto de toast suelto ni un toast como único lugar de la información. Nada de overlays que bloqueen la app mientras algo carga: el estado de carga va dentro del botón que lo inició.
- Selectores estables para e2e: `data-testid`, y `data-origen` / `data-minimo` en las celdas de precio (blueprint §6).
