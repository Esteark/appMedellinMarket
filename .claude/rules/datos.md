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
- Lectura pública (`anon`): tiendas, productos, precios_actuales, precios_historial, corridas, tienda_estado, anotados, clima_causas, precios_manuales_historial, **catalogo_tienda**, contexto_mercado y las vistas `precio_efectivo`, `historial_minimo` y `serie_pronostico`. `producto_fuente` solo service role.
- `catalogo_tienda` es el catálogo de Tienda/Carnicería de barrio: `anon` solo lee; `authenticated` inserta y actualiza (con `autor = auth.uid()`), nunca borra. "Quitar" es `activo = false` para conservar precios e historial. No guarda precios: cada precio entra por `corregir_precio('barrio', …)`.
- `listas`, `listas_guardadas`, `planes_usuario`, `preferencias_notif`: solo el dueño. `alertas`: el dueño lee y solo puede cambiar `leida`.
- La corrección de precio se escribe con la función `corregir_precio` y se quita con `quitar_correccion` (security invoker; tocan `anotados` y `precios_manuales_historial` en una transacción), nunca con un upsert o delete directo desde la app.
- Alertas: `alertas.tipo` incluye `precio_manual_vencido` (barrio), generada solo para productos del catálogo que están en la lista activa del usuario y llevan >14 días (diaria) o >30 (semanal) sin precio manual.
- Tiendas retiradas (Éxito, Carulla, Euro, Ara, Ísimo): no se crean filas nuevas para ellas. La migración del paso 31 borra de hijas a padre y `scripts/migrar.ts` filtra con `TIENDAS_RETIRADAS` en tiendas, precios, historial, anotados, fuentes y estado. Nunca resucitarlas.
- Vistas siempre `with (security_invoker = true)`.
- PostgREST corta en 1000 filas: pagina con `.range(desde, hasta)` toda lectura que pueda superarlas (`precio_efectivo` ya tiene más de 1000).
- Conteos con `select("*", { count: "exact", head: true })`, nunca descargando filas.
- `src/lib/supabase/tipos.ts` se regenera con `pnpm gen:tipos` tras cada migración; nunca a mano.
- `scripts/migrar.ts` es idempotente (upsert por clave natural); correrlo dos veces deja los mismos conteos.
