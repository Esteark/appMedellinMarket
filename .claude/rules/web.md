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
- Colores solo por token (`bg-card`, `text-muted-foreground`, `bg-save-bg`…), nunca hex en componentes.
- Cada animación usa los helpers de `src/lib/animaciones.ts`, que respetan `prefers-reduced-motion`.
- Arrastrar la hoja inferior siempre tiene alternativa: botón "Cerrar" visible (WCAG 2.5.7).
- Nunca más de un gráfico Recharts montado por vista: pestañas que montan uno a la vez.
- Notificaciones: solo con `avisar(clave)` de `src/lib/avisos.ts` (catálogo del paso 14 del blueprint); nunca un texto de toast suelto ni un toast como único lugar de la información. Nada de overlays que bloqueen la app mientras algo carga: el estado de carga va dentro del botón que lo inició.
- Selectores estables para e2e: `data-testid`, y `data-origen` / `data-minimo` en las celdas de precio (blueprint §6).
