---
paths:
  - "src/corrida/**"
  - "scripts/**"
  - ".github/workflows/**"
---

# Corrida y adaptadores

- Todo adaptador implementa `Adaptador` de `src/corrida/tipos.ts` y recibe `fetch`, `esperar`, `hoy` y `pausaMs` por `Contexto`: nada de `fetch` global ni `new Date()` directo (así se prueba con fixtures).
- Antes de pedir una URL: el `robots.txt` del host lo permite para nuestro User-Agent. Si robots no se puede leer (error de red o 5xx) → no se pide nada a ese host; 404 = todo permitido.
- Por tienda: peticiones en serie con `await ctx.esperar(ctx.pausaMs)` después de cada una (1000 ms en producción). Tiendas en paralelo.
- Precio solo si `normalizar()` devuelve número; `null` = unidad no convertible → no hay hallazgo. Nunca inventar.
- Cambio > 35 % contra el último precio `real` → se publica con `revisar = true`.
- Sin hallazgo no se toca `precios_actuales`.
- SIPSA es mayorista: `fuente = "SIPSA (mayorista)"`, fecha real del boletín, y solo si es más nuevo que lo guardado.
- La corrida es idempotente: historial por (producto, tienda, fecha) con upsert; alertas no leídas del día se reemplazan.
- `scripts/corrida.ts`: exit 0 si terminó (aunque haya tiendas en fallo); exit 1 solo por excepción no controlada, después de intentar el correo al admin.
- Scripts: `import "./cargar-env";` es siempre el primer import.
