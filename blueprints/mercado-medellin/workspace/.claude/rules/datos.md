---
paths:
  - "supabase/**"
  - "scripts/migrar.ts"
  - "src/lib/supabase/**"
  - "src/lib/datos.ts"
---

# Datos y Supabase

- Una sola herramienta de migraciones: la CLI de Supabase. Nunca cambios de esquema desde el dashboard.
- Toda tabla tiene RLS activado, políticas explícitas y `grant`/`revoke` explícitos para `anon` y `authenticated`.
- Lectura pública (`anon`): tiendas, productos, precios_actuales, precios_historial, corridas, tienda_estado, anotados, clima_causas y la vista `precio_efectivo`. `producto_fuente` solo service role.
- `listas`, `preferencias_notif`: solo el dueño. `alertas`: el dueño lee y solo puede cambiar `leida`.
- Vistas siempre `with (security_invoker = true)`.
- PostgREST corta en 1000 filas: pagina con `.range(desde, hasta)` toda lectura que pueda superarlas (`precio_efectivo` ya tiene más de 1000).
- Conteos con `select("*", { count: "exact", head: true })`, nunca descargando filas.
- `src/lib/supabase/tipos.ts` se regenera con `pnpm gen:tipos` tras cada migración; nunca a mano.
- `scripts/migrar.ts` es idempotente (upsert por clave natural); correrlo dos veces deja los mismos conteos.
