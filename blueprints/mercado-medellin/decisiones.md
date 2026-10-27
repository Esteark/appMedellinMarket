# Brief para blueprint-writer — Mercado Medellín

## Modo y rutas
- **Modo: BUNDLE** (18 pasos ≥ 12).
- Raíz del bundle (cwd del usuario): `C:\Users\Users\Documents\Claude\Proyectos\4.Proyectos varios\2.AppMercadoMed\blueprints\mercado-medellin\`
  - `blueprint.md`, `tasks.json`, `epics/NN-<nombre>.md`, `workspace/…`
- **YA EXISTEN y NO se reescriben** (datos, no prosa; el writer solo los referencia):
  - `workspace/data/export/productos.json` (144 docs `{id,nombre,grupo,unidad,emoji}`), `precios.json` (144 × 8 tiendas `{precio|null,fecha,fuente,estado}` — estados presentes: real, estimado, sin_dato), `historial.json` (`{<id>:{serie:[{fecha,estado,<tienda>:precio,...}]}}`, hasta 34 puntos por producto, estados simulado/real/estimado), `meta.json` (`{estado:{ultimaCorrida,fuentes,ultimoOk,notas}}`), `anotados.json` (`{}` — vacío hoy).
  - `workspace/data/origen/constantes-artifact.js` (TIENDAS, BASICOS, ANTOJOS, GRUPOS, GCOL, PLANES{semana,mes,hogar}, ESC, RUBROS, COLCHON, rubroOf, BASE, EXTRA, PROT — copia literal del artifact; se porta a `src/data/planes.ts`).
  - `workspace/data/origen/vistas-hogar-dieta.html` (marcado literal de las vistas Hogar y Dieta; fuente del contenido estático).
  - Estos archivos deben **excluirse** de Biome, tsc y vitest (`data/` en los ignore). Tras la copia viven en `<proyecto>/data/…`.
- Idioma de TODO el bundle: **español** (Colombia). Identificadores de código en español como en el documento del usuario (productos, precios, tiendas…).

## Proyecto
**Mercado Medellín** (slug `mercado-medellin`). Reescritura de un artifact de Claude (un HTML con Chart.js + base de datos de documentos + tarea programada diaria que ejecutaba Claude) a una app propia. Compara precios de 144 productos de mercado en 8 tiendas de Medellín (Éxito, Carulla, D1, Euro, La Minorista/SIPSA, Ara, Ísimo, PriceSmart) + 1 tienda manual (Tienda/Carnicería de barrio; Solofruver descartada el 27-oct-2026), arma la lista de mercado de la familia, calcula la mejor tienda y el óptimo dividido, genera alertas, muestra historial, y — nuevo — etiquetas ↑/↓, causa climática (texto del DANE/SIPSA) y una sección de productos en fluctuación. Usuario: una familia en Medellín (5–6 personas). Lectura pública sin sesión; registro abierto (no se va a compartir el enlace).

**Objetivo #1 del usuario:** que la base de datos se mantenga actualizada sola y que un fallo no pase en silencio.

## Forma, track, capacidades
- Forma primaria: `knowledge/shapes/automation-bot-integration.md` (la corrida diaria/semanal = scraper). Secundaria: web app de lectura pública (Next.js) — usar `knowledge/shapes/internal-tool.md` solo como referencia de UI densa; NO tiene roles, SSO, audit log ni exports (Non-Goals).
- Track: `knowledge/runtime-tracks/ts-node.md` (fallback de pines; manda el reporte de versiones de abajo).
- Capacidades a leer: `knowledge/capabilities/database.md`, `auth.md`, `deployment.md`, `observability.md`, `testing.md`, `frontend-architecture.md`, `styling.md`, `accessibility.md`, `api-design.md`.
- Revisado contra `knowledge/stack-compatibility.md`: ninguna fila conocida-mala aplica. Fila relevante: "Lean SaaS" (auth de plataforma = Supabase Auth, una sola fuente de sesión; NO Clerk). Una sola herramienta de migraciones: **Supabase CLI (SQL)**; el dashboard de Supabase es solo lectura para el esquema. Sin ORM.

## Stack aprobado (pines en la sección "Versiones verificadas" al final)
| Capa | Elección |
|---|---|
| Web | Next.js App Router + React + Tailwind v4 + shadcn (base radix) — Vercel |
| Datos | Supabase Postgres + RLS; migraciones SQL con Supabase CLI; tipos con `supabase gen types typescript --local > src/lib/supabase/tipos.ts` |
| Auth | Supabase Auth, email + contraseña, **registro abierto**, confirmación por correo activada; sesión con `@supabase/ssr` (cookies httpOnly) y `proxy.ts` (Next 16, NO middleware.ts) |
| Correo | SMTP de **Gmail con contraseña de aplicación** (cuenta del usuario) — configurado en Supabase Auth (confirmación + recuperar contraseña) y usado con `nodemailer` desde la corrida para el correo al admin |
| Corrida | **GitHub Actions** en repo **privado**: un workflow `.github/workflows/corrida.yml` con `schedule` `0 11 * * *` (diaria, 6:00 a.m. Bogotá) y `workflow_dispatch`; la corrida decide qué grupos tocan según el día (lunes = también semanales). Ejecuta `pnpm corrida` (tsx `scripts/corrida.ts`) con `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` como secrets |
| Scrapers | Node/TS: VTEX (Éxito, Carulla, D1), Euro (página `/p`, JSON embebido `ld+json`/`__STATE__` con `cheerio`), SIPSA (anexo `.xlsx` con lector xlsx + boletín PDF con extractor de texto), `zod` para validar respuestas |
| Gráficos | Recharts |
| Animación | GSAP + `@gsap/react` (`useGSAP`), plugin Draggable. Solo `transform`/`opacity`, 150–400 ms, todo bajo `gsap.matchMedia()` con `prefers-reduced-motion: reduce` → duración 0 |
| Pruebas | Vitest (unitarias + integración contra Supabase local), Playwright (3 flujos e2e) + `@axe-core/playwright` (accesibilidad) |
| Lint/format | Biome (config del scaffold `--biome`: 2 espacios) |

## Modelo de datos (§4) — esquema SQL base del usuario, con estos cambios decididos
Tablas: `tiendas`, `productos` (+ `unidad_base text check in ('g','ml','u')`, `cantidad_base numeric`, `frecuencia text check in ('diaria','semanal')`), `producto_fuente`, `precios_actuales` (+ `revisar boolean not null default false`), `precios_historial` (unique producto,tienda,fecha; índice producto,fecha desc), `corridas`, `tienda_estado`, `anotados`, `listas`, `alertas`, `preferencias_notif`, **`clima_causas`** (nueva: `producto_id`, `fecha date`, `texto text` literal del DANE, `es_clima boolean`, `fuente_url text`, PK producto_id+fecha). Enums `estado_precio ('real','estimado','sin_dato','simulado')`, `estado_fuente ('ok','parcial','fallo')`.
- **No hay tabla `revisiones`**: decisión del usuario = un cambio >35 % contra el último real **se publica** con `revisar=true` y la UI muestra la etiqueta "revisar".
- Vista `precio_efectivo` (regla de anotados del usuario, copiar tal cual del documento §6.3) con `security_invoker = true`.
- Frecuencia por grupo: **diaria** = Frutas, Verduras, Tubérculos, Proteínas, Lácteos, Granos, Panadería. **semanal** (lunes) = Despensa, Aseo, Mecato, Bebidas, Gourmet. Etiqueta "desactualizado" cuando `hoy - fecha > (1 si diaria, 7 si semanal) + 3` días.
- `unidad_base`/`cantidad_base` se derivan de `productos.unidad` en el script de migración con esta regla determinista (copiar como código): normalizar coma decimal; `/(\d+(?:[.,]\d+)?)\s*(kg|g|ml|L)\b/i` → kg→g×1000, L→ml×1000; `"kg"` sola → g 1000; `"6 × 330 ml"` → ml 1980; cualquier otra (unidad, cabeza, manojo, atado, paquete, caja, cubeta, "entera ~1 kg") → `u`, 1.
- Tiendas (9 desde el paso 20) — id, nombre, color, manual: exito Éxito #F5C400; carulla Carulla #0F7A3D; euro Euro #C8102E; minorista La Minorista #8B5E3C; d1 D1 #D62828; ara Ara #E85D04; isimo Ísimo #6A4C93; pricesmart PriceSmart #0060A9 (nota "Club de membresía · presentaciones grandes, precio llevado a la unidad del producto"); barrio Tienda/Carnicería #64748B manual.

### RLS (§6.2 del usuario + esto)
- Lectura pública (`anon` y `authenticated`, `for select using (true)`): tiendas, productos, precios_actuales, precios_historial, corridas, tienda_estado, anotados, clima_causas. `producto_fuente` NO es público (solo service_role).
- Escritura de todo lo anterior: solo service_role (sin políticas insert/update).
- `anotados`: insert/update para `authenticated` con `with check (autor = auth.uid())`; delete solo de filas propias.
- `listas`, `preferencias_notif`: solo el dueño (`auth.uid() = user_id`) para todo.
- `alertas`: select y update(leida) solo el dueño; insert solo service_role.
- Habilitar Realtime (publicación `supabase_realtime`) solo en `alertas`.

## Reglas de negocio (§5) — portar EXACTAS del documento del usuario
- `entry()` precio efectivo; `calcList` (total por tienda visible + faltantes; mejor tienda completa; óptimo dividido y ahorro).
- Alertas: mas_barato (≥10 % y ≥ umbral_ahorro, default 1000; monto = diferencia × cantidad), mercado_completo (≥5 %), subida (≥15 % sobre promedio de los 7 puntos previos), fuente_caida (admin: tienda en `fallo` o `ultimo_ok` ≥3 días). Ordenadas por monto; se muestran 5 + "ver todas".
- **Nuevo**: etiqueta ↑/↓ = precio actual vs promedio de los 7 días anteriores, umbral ±15 %. "En fluctuación" = |cambio 7 días| ≥15 % **o** coeficiente de variación de 30 días ≥ 0.12. Etiqueta 🌧️ clima cuando existe `clima_causas` con `es_clima=true` en los últimos 7 días. Alerta **caro_por_clima** = producto de la lista con subida ≥15 % y causa climática.
- Clasificador de clima (determinista, sin IA): regex insensible a mayúsculas/acentos sobre la frase de Medellín: `lluvia|lluvioso|invierno|ola invernal|verano|sequ[ií]a|helada|clima|clim[aá]tic|fen[oó]meno de (la )?ni[nñ]a|el ni[nñ]o|temporal|inundaci`. Texto guardado literal; la UI dice "Causa según DANE (SIPSA)" o "causa no reportada". Nunca se inventa una causa.
- SIPSA es precio **mayorista** → etiqueta "mayorista" en la UI. Solo se aplica si el boletín es más nuevo que el dato guardado; `fuente: "SIPSA (mayorista)"`, fecha real del boletín.

## La corrida (scripts/corrida.ts) — reglas del usuario §4 y §7
- Orden de prioridad: frescos → proteínas/lácteos/granos → despensa/panadería/aseo → mecato/bebidas/gourmet. Grupos semanales solo los lunes (o con `--todo`).
- Por tienda en paralelo, **dentro** de cada tienda secuencial con pausa ≥1 s entre peticiones, User-Agent propio `MercadoMedellinBot/1.0 (+uso familiar; contacto en README)`; respetar robots.txt (comprobar antes; Euro bloquea API, `?_q=` y `?page=`; Ísimo prohíbe todo → sin adaptador). Nunca saltar captchas/logins.
- VTEX: `GET https://www.{exito|carulla}.com/api/catalog_system/pub/products/search?ft=<termino>&_from=0&_to=4`; D1 `https://www.d1.com.co/api/...` con términos de una palabra (falla con espacios/`+`). Precio = `items[0].sellers[0].commertialOffer.Price`; descartar si `AvailableQuantity = 0` o precio 0. Guardar `skuId` en `producto_fuente.sku`; si existe, consultar `?fq=skuId:<sku>`.
- Euro: solo páginas `/p` guardadas en `producto_fuente.url`; extraer precio del `ld+json` (`offers.price`) o `__STATE__`.
- SIPSA: anexo `anex-SIPSADiario-<ddmmmaaaa>.xlsx` y boletín `bol-SIPSADiario-<ddmmmaaaa>.pdf` en `https://www.dane.gov.co/files/operaciones/SIPSA/` (meses en minúscula español abreviado: ene feb mar abr may jun jul ago sep oct nov dic). Probar hoy y hasta 3 días atrás. Del xlsx: filas de Medellín (Central Mayorista de Antioquia) → precio $/kg. Del PDF: frases que mencionen Medellín + producto → `clima_causas`.
- Normalización `normalizar()` del documento §7.3 (redondeo a centena si hubo conversión; `null` si unidad distinta).
- Validación: >35 % vs último real → se escribe con `revisar=true`. Sin hallazgo → no se toca `precios_actuales`. Nunca inventar.
- Escritura: upsert `precios_actuales` (estado 'real', fecha hoy Bogotá, fuente=url) + upsert `precios_historial` on conflict (producto,tienda,fecha) do update; al final insert `corridas` (inicio, fin, fuentes, conteos, notas) y upsert `tienda_estado` (ok si conteo > 50 % de productos activos de esa tienda en la corrida, parcial si >0, fallo si 0; `ultimo_ok` = hoy si ok/parcial).
- Después: calcular alertas por usuario con lista guardada (borrar no leídas del mismo tipo+producto del día antes de insertar — idempotente) y, si alguna tienda automática quedó en `fallo` o lleva ≥3 días sin `ultimo_ok`, o si la corrida lanzó excepción, enviar **un** correo al admin (`ADMIN_EMAIL`) vía nodemailer/Gmail SMTP. Si faltan las variables SMTP, registrar en consola y no fallar.
- La corrida es idempotente: correrla dos veces el mismo día deja el mismo estado (historial por fecha, alertas reemplazadas).
- Exit code: 0 si terminó (aunque haya tiendas en fallo); 1 solo si excepción no controlada (GitHub manda correo de workflow fallido).
- Adaptadores implementan la interfaz del documento §7.2. En pruebas se inyecta `fetch` falso que sirve **fixtures reales capturados** (`tests/fixtures/<tienda>/…`) — los captura un script `scripts/capturar-fixtures.ts` que el builder ejecuta con red en el paso del adaptador; nunca escritos a mano. Si un fixture no puede capturarse (sitio caído, boletín inexistente), el paso lo documenta y la prueba usa el último capturado.

## Web (vistas del documento §5 + nuevas)
Rutas: `/` Canasta familiar, `/antojos`, `/hogar`, `/dieta`, `/anotados`, `/alertas`, `/producto/[id]` (hoja/modal), `/ingresar`, `/registro`, `/recuperar`, `/api/salud` (JSON `{ok:true, ultimaCorrida, horasDesdeCorrida, fuentesOk}`; 200 siempre que la BD responda).
- Encabezado: "Actualizado: hoy 6:06 a. m.", puntos por tienda, "X/8 fuentes OK", tiendas con `ultimo_ok` ausente o ≥3 días; **banner rojo** si la última corrida tiene más de 26 h; campana con contador (Realtime en `alertas`, solo con sesión).
- Sin sesión: la lista vive en `localStorage` (try/catch). Con sesión: se guarda en `listas` (server action) y al iniciar sesión se fusiona la local.
- Hogar · 6 personas y Dieta · 5 personas: contenido estático portado de `data/origen/*` a `src/data/planes.ts` + componentes; botones "Usar como mi lista" / "Sumar a mi lista".
- Anotados: tabla editable producto × tienda (incluye manuales), el más bajo en azul, guarda con sesión (server action + zod: entero 100–10.000.000), sin sesión solo lectura con aviso "Inicia sesión para anotar".
- Gráficos (Recharts): total por tienda, historial de un producto 30 días, gasto por grupo. Nunca más de un gráfico pesado montado por vista (pestañas que montan uno a la vez).

## Sistema de diseño (aprobado por el usuario con un prototipo)
Prototipo aprobado: https://claude.ai/artifact/S6PbvgsR3xzoTTCZJGA7kg (referencia visual; el builder no depende de él — todo lo necesario está aquí).
Tokens (CSS variables en `src/app/globals.css` dentro de `@theme`/`:root`, con modo oscuro por `prefers-color-scheme` y `[data-theme]`):
- Claro: bg #FAFAF7, surface #FFFFFF, fg #0F172A, muted #5B6474, line #E5E7EB, chip #F1F2EC, chip-on #0F172A / chip-on-fg #FFFFFF; save #10B981 / ink #047857 / bg #E7F7F0; warn #F59E0B / #8A5300 / #FEF4DE; up #EF4444 / #B42318 / #FDECEC; anot #2563EB / #1D4ED8 / #E8EFFD; clima #0EA5E9 / #0369A1 / #E0F2FE.
- Oscuro: bg #0E1116, surface #161A21, fg #E7EAEE, muted #9AA3AF, line #2A303A, chip #1E232C, chip-on #E7EAEE / #0E1116; save #34D399 / #6EE7B7 / #0F2A20; warn #FBBF24 / #FCD34D / #2A2110; up #F87171 / #FCA5A5 / #2C1616; anot #60A5FA / #93C5FD / #132238; clima #38BDF8 / #7DD3FC / #0C2A3A.
- Tipografía Inter (next/font/google) 400/500/600/700; números `tabular-nums`; radio 14 px tarjetas, 10–12 px controles, chips 999 px.
- Grilla de catálogo 2 col (<760 px), 3 col (≥900), 4 col (≥1140); carrito lateral sticky 340 px ≥900, barra inferior + hoja en móvil.
- Colores de grupo (GCOL) para gráfico de gasto por grupo: los de `constantes-artifact.js`.
Animaciones (8, cada una con propósito; GSAP; `prefers-reduced-motion` → instantáneo):
1 agregar a la lista: el emoji vuela en arco al carrito (x lineal, y power1.out subida + power2.in bajada, escala 0.45, 0.55 s) + rebote del icono; 2 total y ahorro cuentan al nuevo valor (0.5 s, snap 100); 3 cascada de tarjetas al cargar/filtrar (y 10→0, opacity, 0.28 s, stagger 0.03); 4 hoja inferior (carrito/detalle) que se cierra arrastrando (Draggable type y, cierra si y>110 px); 5 barras por tienda crecen (scaleX 0→1, stagger 0.06) y mini gráfico se dibuja (stroke-dashoffset, 0.7 s); 6 subrayado de pestaña se desliza (0.3 s power3.out); 7 campana se sacude una vez al llegar alerta (rotation keyframes 0,-16,14,-10,6,0 en 0.6 s); 8 etiqueta ↑/↓ de cambio de hoy pulsa una vez (scale 1.18 yoyo).

## Non-Goals (§1)
Push web, Telegram/WhatsApp, resumen diario por correo, login con Google (se agrega después), Ara/Ísimo/PriceSmart automáticos (siguen por anotados), Rappi, folletos PDF, pantalla de aprobación de revisiones, IA/LLM en la corrida, roles/admin UI, exportes CSV, multi-idioma, app móvil nativa, PWA/offline.

## Riesgos (Gate B → §20)
1. Un sitio cambia o bloquea → adaptador devuelve 0 → estado `fallo`, correo `fuente_caida`, SKU guardado reduce fragilidad, fixtures en pruebas. (pasos de adaptadores + corrida)
2. GitHub Actions retrasa/salta un cron programado → banner rojo >26 h en la web + `/api/salud` + correo de GitHub en fallo; `workflow_dispatch` para correr a mano. Aceptado.
3. Errores de unidades (70 % de los errores) → `unidad_base/cantidad_base` obligatorios, `normalizar()` devuelve null si no es convertible, `revisar=true` >35 %.
4. Registro abierto → cualquiera con el enlace puede anotar; cada anotado guarda `autor`; aceptado.
5. Plan gratis de Supabase se pausa por inactividad → la corrida diaria hace peticiones externas a la API todos los días (cuenta como actividad); verificar en el panel tras la primera semana (checklist de lanzamiento).
6. Términos de uso de las tiendas → 1 consulta/producto/día, pausa ≥1 s, UA propio, robots.txt; Ísimo excluido.
7. Texto de SIPSA cambia de redacción → el clasificador solo marca clima con coincidencia explícita; si no, "causa no reportada".

## Build order propuesto (18 pasos; el writer puede ajustar tamaño, no alcance)
1. Scaffold Next.js + toolchain (Biome con `tailwindDirectives`, excluye `blueprints/`, `data/`, `supabase/.temp`), Vitest config, `.nvmrc`, `packageManager`, git init + commit inicial, ruta `/api/salud` stub que responde `{ok:true}` → `pnpm build && pnpm start` + curl 200 (entry point ejecutado en el paso 1).
2. Supabase local: `supabase init`, migración `0001_esquema.sql` (todas las tablas, enums, índices, vista, RLS, realtime) + prueba pgTAP `supabase/tests/rls.test.sql` (anon puede leer precios, no escribir; anon no ve producto_fuente; usuario solo ve su lista) → `supabase db reset && supabase test db`.
3. Script de migración `scripts/migrar.ts` (lee `data/export/*.json`, deriva unidad_base/cantidad_base/frecuencia, carga tiendas, productos, precios_actuales (1.152 filas = 144×8), producto_fuente (url de `fuente` si empieza por http), precios_historial, tienda_estado/corridas desde meta) + `pnpm gen:tipos`. Verify: script imprime y comprueba conteos; prueba de integración.
4. Lógica pura `src/lib/precios/efectivo.ts`, `src/lib/precios/lista.ts` (calcList), `src/lib/alertas/reglas.ts` (4 reglas + caro_por_clima + tendencia ↑/↓ + fluctuación) con pruebas unitarias.
5. `src/lib/normalizar.ts` + esquemas zod + adaptador VTEX (Éxito, Carulla, D1) + `scripts/capturar-fixtures.ts` + pruebas con fixtures.
6. Adaptador Euro (`/p`, robots) + pruebas.
7. Adaptador SIPSA (xlsx precios + PDF causas + clasificador clima) + pruebas.
8. Orquestador `scripts/corrida.ts`: selección por frecuencia, pausas, validación, escritura, corridas/tienda_estado; prueba de integración contra Supabase local con fetch falso (idempotencia: dos corridas = mismo estado).
9. Alertas por usuario + correo admin (nodemailer con transporte inyectable; en pruebas `jsonTransport`).
10. Workflow `.github/workflows/corrida.yml` (cron, dispatch, pnpm cache, secrets) + verificación estática.
11. Clientes Supabase (`server.ts`, `client.ts`), `proxy.ts` de sesión, layout + encabezado de frescura + banner >26 h, `/api/salud` real.
12. Catálogo Canasta/Antojos: búsqueda, chips de grupo y tienda, tarjetas con etiquetas, stepper, carrito (localStorage), animaciones 1–3, 6, 8.
13. Detalle de producto (hoja arrastrable, barras, mini gráfico, causa clima) + sección "En fluctuación" + gráficos Recharts; animaciones 4–5.
14. Auth: registro, ingreso, salir, recuperar contraseña; lista guardada en `listas` y fusión con la local.
15. Anotados: tabla editable + server action + RLS probada.
16. Alertas: página, campana con Realtime (animación 7), preferencias (umbral).
17. Hogar y Dieta desde `src/data/planes.ts`.
18. Calidad: Playwright e2e (3 flujos: anónimo ve precios; registro→agrega a lista→persistencia; anotar precio→sale en azul y gana al automático) + axe sin violaciones serias/críticas en `/`, `/anotados`, `/hogar`.
Despliegue (crear proyecto Supabase, `supabase link`, `db push`, `migrar` contra prod, SMTP Gmail en Auth, Vercel, secrets de GitHub, primer `workflow_dispatch`) = **§20.1 checklist de lanzamiento manual**, no pasos con Verify (requieren cuentas reales del usuario).

## Entorno (.env.example — valores locales literales de `supabase start`)
`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=<la que imprime supabase status>` — el writer debe indicar cómo obtenerla (`supabase status -o env`) y cómo cargarla en scripts (`tsx --env-file=.env.local`), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER`, `SMTP_PASS` (contraseña de aplicación), `ADMIN_EMAIL`, `CORRIDA_USER_AGENT`. Toda herramienta que lea env tiene cargador explícito (vitest: `loadEnv`/`setupFiles`; scripts: `tsx --env-file`).

## Entorno de humo (para que el writer lo sepa)
La máquina donde se genera NO tiene Docker → `supabase start` no puede correr aquí; el paso de datos se reportará "no probado más allá del toolchain". El builder SÍ necesita Docker Desktop: §10 lo lista como prerrequisito con comando de comprobación `docker info`.

## Propiedad del manifiesto
`package.json` lo genera el scaffold (`pnpm create next-app … --biome`) en §10; el blueprint solo hace ediciones nombradas después (scripts, engines, packageManager, deps). **No** emitir `package.json` bajo `workspace/`. Ojo: create-next-app no acepta un directorio no vacío con archivos que choquen — §10 debe hacer el scaffold en un subdirectorio temporal y mover, o scaffoldear antes de copiar `workspace/`; resuélvelo explícitamente y de forma re-ejecutable (segunda corrida de Bootstrap = exit 0).

## Versiones verificadas (stack-researcher, 2026-10-22) — AUTORITATIVAS; van a la tabla de procedencia con su URL
| Paquete | Pin | Estado | Fuente |
|---|---|---|---|
| Node.js | 24.22.1 (`.nvmrc` = `24.22.1`, `engines.node` `>=24.22.1 <25`, setup-node `node-version-file: .nvmrc`) | VERIFIED | https://nodejs.org/dist/index.json |
| pnpm | 12.15.0 (`packageManager: "pnpm@12.15.0"`) | VERIFIED | https://registry.npmjs.org/-/package/pnpm/dist-tags |
| typescript | ~6.0.3 (latest es 7.0.2: NO usar bare) | VERIFIED | https://registry.npmjs.org/-/package/typescript/dist-tags |
| next / create-next-app | 16.4.2 | VERIFIED | https://registry.npmjs.org/-/package/next/dist-tags |
| react / react-dom | 19.3.1 | VERIFIED | https://registry.npmjs.org/-/package/react/dist-tags |
| @types/react / @types/react-dom | 19.3.0 | VERIFIED | https://registry.npmjs.org/-/package/@types%2freact/dist-tags |
| @types/node | 24 (24.19.2) — latest es 26.x, NO usar bare | VERIFIED | https://data.jsdelivr.com/v1/packages/npm/@types/node/resolved?specifier=24 |
| tailwindcss, @tailwindcss/postcss, @tailwindcss/turbopack | 4.3.3 | VERIFIED | https://registry.npmjs.org/-/package/tailwindcss/dist-tags |
| shadcn CLI | 4.22.1 (`pnpm dlx shadcn@4.22.1 init --base radix --no-monorepo`) | VERIFIED (flag --base del track, no re-probado) | https://registry.npmjs.org/-/package/shadcn/dist-tags |
| @supabase/supabase-js | 2.118.0 (engines node >=22) | VERIFIED | https://registry.npmjs.org/-/package/@supabase%2fsupabase-js/dist-tags |
| @supabase/ssr | 0.12.7 exacto (peer supabase-js ^2.114.0) | VERIFIED | https://registry.npmjs.org/-/package/@supabase%2fssr/dist-tags |
| supabase (CLI, devDependency) | 2.121.0 — `supabase start`/`test db` necesitan Docker | VERIFIED; `db reset`/`migration new` UNVERIFIED (páginas no leídas) | https://registry.npmjs.org/-/package/supabase/dist-tags |
| zod | 4.6.7 | VERIFIED | https://registry.npmjs.org/-/package/zod/dist-tags |
| recharts | 3.10.1 (+ `react-is@19.3.1`, peer requerido bajo pnpm estricto) | VERIFIED | https://registry.npmjs.org/-/package/recharts/dist-tags |
| gsap | 3.15.0 (Draggable incluido en el paquete npm; licencia "Standard no charge") | VERIFIED | https://registry.npmjs.org/-/package/gsap/dist-tags |
| @gsap/react | 2.1.2 (`useGSAP(cb,{scope,dependencies})`, `contextSafe` para handlers) | VERIFIED | https://registry.npmjs.org/-/package/@gsap%2freact/dist-tags |
| vitest | 5.0.5 (peer vite ^6.4/^7/^8 — instalar `vite` explícito si pnpm lo pide; usar `vite-tsconfig-paths` NO: resolver alias `@/` con `resolve.alias` en vitest.config.ts) | VERIFIED | https://registry.npmjs.org/-/package/vitest/dist-tags |
| @playwright/test | 1.64.1 | VERIFIED | https://registry.npmjs.org/-/package/@playwright%2ftest/dist-tags |
| @axe-core/playwright | verify before install (no investigado) | UNVERIFIED | — |
| @biomejs/biome | 2.6.2 (re-probar gotchas SVG/recommended en 2.6.x: excluir `!**/*.svg`) | VERIFIED | https://registry.npmjs.org/-/package/@biomejs%2fbiome/dist-tags |
| tsx | 4.23.15 | VERIFIED | https://registry.npmjs.org/-/package/tsx/dist-tags |
| cheerio | 1.2.0 | VERIFIED | https://registry.npmjs.org/-/package/cheerio/dist-tags |
| exceljs | 4.4.0 — último release 2023-10-19, sin mantenimiento: riesgo aceptado (solo lectura de un xlsx público) → Risk Register | VERIFIED (STALE) | https://registry.npmjs.org/-/package/exceljs/dist-tags |
| unpdf | 1.9.1 (ESM, sin dependencias, node >=22) — elegido sobre pdf-parse | VERIFIED | https://registry.npmjs.org/unpdf/latest |
| nodemailer | 10.2.1 | VERIFIED | https://registry.npmjs.org/-/package/nodemailer/dist-tags |
| @types/nodemailer | 8.0.2 — compatibilidad con nodemailer 10 sin confirmar: el paso 9 verifica con `tsc --noEmit` | VERIFIED (compat UNVERIFIED) | https://registry.npmjs.org/-/package/@types%2fnodemailer/dist-tags |
| actions/checkout | @v7 | VERIFIED | https://api.github.com/repos/actions/checkout/releases/latest |
| actions/setup-node | @v7 | VERIFIED | https://api.github.com/repos/actions/setup-node/releases/latest |
| pnpm/action-setup | @v6 | VERIFIED | https://api.github.com/repos/pnpm/action-setup/releases/latest |

### Hechos de plataforma (llevar al blueprint)
- Supabase SSR: `createServerClient` con `cookies: { getAll, setAll }` (setAll recibe cookies + headers de caché que deben aplicarse a la respuesta); refrescar sesión en `proxy.ts` (`export async function proxy`) con `supabase.auth.getClaims()`; nunca confiar en `getSession` en servidor. Variables: `NEXT_PUBLIC_SUPABASE_URL` y **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** (usar este nombre en vez de ANON_KEY en todo el bundle).
- `.env.local` local: generarlo con un script propio `scripts/env-local.ts` que ejecuta `supabase status -o json` y mapea, aceptando cualquiera de los dos nombres que imprima la CLI: URL ← `API_URL`; publishable ← `PUBLISHABLE_KEY` o `ANON_KEY`; service ← `SECRET_KEY` o `SERVICE_ROLE_KEY`. Escribe `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` + las SMTP vacías. Idempotente.
- GitHub `schedule`: puede retrasarse; evitar la hora en punto → cron **`17 11 * * *`** (6:17 a.m. Bogotá). Auto-desactivación a 60 días documentada solo para repos públicos; repo privado → igual, la corrida deja rastro y el banner >26 h avisa.
- Supabase plan gratis: pausa por baja actividad en 7 días; "actividad" no definida oficialmente; la corrida escribe a diario.
- Auth SMTP propio: después de configurarlo, 30 correos/h por defecto; endpoints de auth 30 req/5 min por IP. Gmail: smtp.gmail.com 465 SSL con contraseña de aplicación (requiere verificación en 2 pasos).
- pnpm 12: `allowBuilds` (no `onlyBuiltDependencies`); `pnpm approve-builds --all` no interactivo; el paquete `supabase` (CLI) descarga un binario en postinstall → necesitará aprobación; `unrs-resolver`/`sharp` según el scaffold. Nunca `dangerouslyAllowAllBuilds`.
- Corepack: `corepack enable --install-directory "$HOME/.local/bin"` si `corepack enable` da EACCES. En Windows (máquina del usuario) usar Git Bash; §10 debe ser bash POSIX.
- El usuario trabaja en **Windows 11** con Git Bash/PowerShell: §10 en bash (Git Bash), sin `cp -Rn` (usar copia por archivo con `[ -e ] ||` o `rsync` NO disponible en Git Bash por defecto → usar un `node -e` o `cp -n` con `|| true` comentado). Rutas con espacios (`4.Proyectos varios`) → citar siempre.

## Cambios del 27-oct-2026 (pasos 20–25)
- Se descarta Solofruver (paso 20).
- Se evalúan La Vaquita Mercados (tienda online propia) y La Mayorista Medellín (paso 21): automática solo si robots.txt lo permite y el precio es público; si no, manual por anotados. URLs por confirmar con el usuario.
- Gráfico "Total por tienda" no reacciona a la tienda elegida y oculta tiendas incompletas (paso 22).
- Menú de cuenta con animación de entrada/salida (paso 23).
- Lista agrupada por tienda/grupo con resumen fijo y secciones plegables, en lugar de un carrusel (paso 24).
- Exportar la lista a PDF con tabla en el navegador; dependencia nueva jspdf + jspdf-autotable (paso 25).
- Paso 21: La Vaquita (vaquitaexpress.com.co) entra como tienda automática con 40 productos elegidos a mano. La Mayorista Medellín (precios.lamayorista.com.co) solo tiene un panel con API interna con token: no se consulta sin permiso de la Central; decisión pendiente del usuario.
- Paso 26 (nuevo, 27-oct-2026): los correos de confirmación y de recuperar contraseña traen un enlace a `localhost` y la página no carga. Causas probables y plan en el blueprint; primero se reproduce para saber si la cuenta se creó en local o en producción.
