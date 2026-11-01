# Mercado Medellín: blueprint de construcción

> **Estado:** versión de un solo archivo, escrita para ahorrar tokens. **No pasó el validador ni la prueba de humo.** Las versiones sí se verificaron el 22-oct-2026.
> Archivos que la acompañan en esta misma carpeta:
> - `workspace/`: CLAUDE.md, AGENTS.md, `.claude/`, configs, scripts y `data/`. Se copia a la raíz del proyecto en el Bootstrap.
> - `workspace/data/export/*.json`: los datos reales del artifact.
> - `workspace/data/origen/*`: los planes Hogar y Dieta del artifact.
>
> Si este archivo y `workspace/CLAUDE.md` se contradicen en un comando, manda `workspace/CLAUDE.md`.

---

## 1. Qué es y qué no es

La app compara los precios de 144 productos de mercado en **5 tiendas de Medellín**: D1, La Minorista (SIPSA), La Vaquita y PriceSmart, más **Tienda/Carnicería de barrio** (manual, con catálogo y precios propios). Tres son automáticas (D1, La Minorista y La Vaquita) y dos son manuales (PriceSmart y Tienda/Carnicería de barrio). La Mayorista Medellín quedó pendiente de decisión. Solofruver se descartó el 27-oct-2026 (paso 20); **Éxito, Carulla, Euro, Ara e Ísimo se retiraron el 30-oct-2026 (paso 31) porque la familia no merca allí**. Con eso arma la lista de la familia, calcula cuál es la mejor tienda y el óptimo dividido, genera alertas y muestra el historial. También marca ↑/↓ cuando un precio sube o baja, muestra la causa climática según el DANE/SIPSA e incluye una sección de productos en fluctuación.

**Desde los pasos 27–30 (30-oct-2026) suma:**
- **Precio corregido por tienda:** cuando el automático no corresponde, una persona con sesión lo corrige para ese producto y esa tienda. La corrección es global, queda con autor y fecha, reemplaza al automático en toda la app y deja una observación en el historial que alimenta el pronóstico.
- **Listas de mercado guardadas:** un botón flotante en Canasta familiar guarda la lista activa con nombre, y una pestaña `/listas` permite cargarla, sumarla, renombrarla, duplicarla, exportarla o borrarla. Con sesión vive en Supabase; sin sesión, en el dispositivo.
- **Hogar y Dieta editables:** presupuesto por rubro, reparto por personas/aportantes, cantidades del plan, productos propios y nota. Con sesión se guarda en Supabase; sin sesión, en el dispositivo. Al iniciar sesión se fusiona sin perder lo local.
- **Pronóstico a 7 días:** probabilidad de que el precio suba, baje o se quede estable, calculada con el historial real (automático + corregido a mano), el clima de SIPSA y el IPC de alimentos del DANE. Es estadística determinista: no es un precio, no se guarda como precio y no usa IA/LLM.

**Desde los pasos 31–33 (30-oct-2026) suma:**
- **Menos tiendas, sin ruido:** se retiran del proyecto y de la base local y remota Éxito, Carulla, Euro, Ara e Ísimo. Quedan D1, La Minorista, La Vaquita, PriceSmart y Tienda/Carnicería de barrio.
- **Tienda/Carnicería de barrio con catálogo propio:** es la única fuente que nace sin ningún dato. Trae un catálogo inicial de 41 productos (17 proteínas, 12 lácteos, 7 panadería y 5 de despensa) que se completa y se edita a mano; todos sus precios se anotan con la misma corrección del paso 27 y tienen alertas de vencimiento (14 días para diarios, 30 para semanales) para recordar actualizarlos.
- **Tutorial animado con GSAP:** un recorrido guiado sección por sección que ilumina solo la parte de la pantalla que explica, aparece una vez por dispositivo y se puede repetir desde un botón de bombilla abajo a la izquierda o desde "Ver tutorial" en Ayuda.

- La lectura es pública, sin sesión.
- El registro es abierto, con email y contraseña.
- **Objetivo n.º 1:** que la base de datos se actualice sola y que ningún fallo pase en silencio.

**Fuera de la v1:**
- Push web, Telegram o WhatsApp.
- Resumen diario por correo.
- Login con Google.
- PriceSmart automático (sigue por anotados/manual).
- Tienda/Carnicería de barrio automática o con precios sembrados: su catálogo y sus precios son 100 % manuales.
- Rappi y folletos PDF.
- Pantalla para aprobar revisiones.
- IA o LLM en la corrida y en el pronóstico: lo del paso 30 es estadística determinista sobre datos propios (historial, clima y DANE), no un modelo de lenguaje.
- Tutorial con voz, video o explicaciones que dependan de la red: el del paso 33 es texto y GSAP dentro de la app.
- Roles o panel de administración.
- Exportar a CSV, multi-idioma, PWA u offline.

## 2. Stack y versiones (verificadas el 22-oct-2026 contra npm, nodejs.org y GitHub)

| Capa | Paquete y pin |
|---|---|
| Runtime | Node **24.22.1** (`.nvmrc`). No usar Node 26 antes del 28-oct-2026. |
| Gestor de paquetes | pnpm **12.15.0** (`packageManager`) |
| Lenguaje | typescript **~6.0.3** (el `latest` es la 7: nunca instalarlo sin pin) · @types/node **24** |
| Web | next / create-next-app **16.4.2** · react / react-dom **19.3.1** · @types/react(-dom) **19.3.0** |
| Estilos | tailwindcss, @tailwindcss/postcss y @tailwindcss/turbopack **4.3.3** · shadcn CLI **4.22.1** (`--base radix`) |
| Supabase | @supabase/supabase-js **2.118.0** · @supabase/ssr **0.12.7** (versión exacta) · supabase CLI **2.121.0** (devDependency; necesita Docker) |
| Validación | zod **4.6.7** |
| Gráficos | recharts **3.10.1** + react-is **19.3.1** |
| Animación | gsap **3.15.0** (Draggable viene incluido; licencia gratuita) · @gsap/react **2.1.2** |
| Notificaciones | react-hot-toast **2.6.1** (verificada el 26-oct-2026 en npm; peer `react >=16`). Se instala en el paso 14 |
| Pruebas | vitest **5.0.5** · @playwright/test **1.64.1** · @axe-core/playwright **4.13.0** (verificada en npm el 27-oct-2026; la 4.14.0 tenía 12 días) |
| PDF | jspdf **4.2.1** · jspdf-autotable **5.0.8** (verificadas en npm el 27-oct-2026; se cargan con `import()` solo al pulsar "Descargar PDF", paso 25) |
| Calidad | @biomejs/biome **2.6.2** · tsx **4.23.15** |
| Scrapers | cheerio **1.2.0** · exceljs **4.4.0** (sin mantenimiento desde 2023, riesgo aceptado) · unpdf **1.9.1** |
| Correo | nodemailer **10.2.1** · @types/nodemailer **8.0.2** (compatibilidad no confirmada; la decide `pnpm typecheck` en el paso 9) |
| CI | actions/checkout@v7 · actions/setup-node@v7 · pnpm/action-setup@v6 |

**Decisiones de arquitectura:**
- Supabase Auth es la única fuente de sesión.
- Una sola herramienta de migraciones: la CLI de Supabase, con SQL. No hay ORM.
- La corrida diaria va en **GitHub Actions** (repo privado), no en Vercel ni en Edge Functions, por el límite de 2 s de CPU de estas últimas.
- El correo sale por **SMTP de Gmail** con contraseña de aplicación.

## 3. Estructura

```
src/app/                 rutas: / (canasta), antojos, listas, hogar, dieta, presupuesto, tiendas,
                         anotados, anotados/barrio, alertas, producto/[id], ingresar, registro,
                         recuperar, api/salud
src/app/**/acciones.ts   server actions de cada área (lista, listas, planes, anotados, auth,
                         presupuesto, tiendas)
src/components/          catalogo/, carrito/, detalle/, graficos/, planes/, presupuesto/, importar/,
                         tiendas/, anotados/, listas/, precios/, tutorial/, avisos/, ui/ (shadcn)
src/lib/                 supabase/{server,client,tipos}.ts,
                         precios/{lista,etiquetas,pronostico,planes,secciones,exportar}.ts,
                         listas/guardadas.ts, planes/config.ts, tutorial/*, alertas/reglas.ts,
                         presupuesto/*, importar/{csv,hash,emparejar,prompt,tipos,lista,prompt-lista}.ts,
                         tiendas/fusion.ts, unidades.ts, fecha.ts, datos.ts
src/corrida/             orquestador.ts, normalizar.ts, admin.ts, alertas-usuario.ts, correo.ts,
                         contexto.ts, adaptadores/{vtex,sipsa,vaquita}.ts
src/data/planes.ts       portado de data/origen/constantes-artifact.js
src/data/barrio.ts       catálogo inicial de Tienda/Carnicería (41 productos, sin precios)
src/proxy.ts             refresco de sesión (Next 16: proxy, no middleware)
scripts/                 cargar-env.ts, env-local.ts, humo.ts (ya en workspace/), migrar.ts,
                         corrida.ts, capturar-fixtures.ts
supabase/migrations/     una por cambio, con marca de tiempo: 0001_esquema.sql y las siguientes
supabase/tests/          rls.test.sql (pgTAP) + una prueba por tabla o vista nueva
tests/unit|integracion|e2e|fixtures/ (capturados) e importar/ (CSV de entrada)
.github/workflows/corrida.yml
data/                    export/ y origen/ (copiados de workspace; excluidos de lint, tsc y tests)
```

## 4. Datos: `supabase/migrations/0001_esquema.sql` (contenido completo)

```sql
create type estado_precio as enum ('real','estimado','sin_dato','simulado');
create type estado_fuente as enum ('ok','parcial','fallo');

create table tiendas (id text primary key, nombre text not null, color text not null,
  manual boolean not null default false, nota text);

create table productos (id text primary key, nombre text not null, grupo text not null,
  unidad text not null, unidad_base text not null check (unidad_base in ('g','ml','u')),
  cantidad_base numeric not null, frecuencia text not null check (frecuencia in ('diaria','semanal')),
  emoji text);

create table producto_fuente (producto_id text references productos, tienda_id text references tiendas,
  url text, termino text, sku text, factor numeric, activo boolean not null default true,
  primary key (producto_id, tienda_id));

create table precios_actuales (producto_id text references productos, tienda_id text references tiendas,
  precio integer, fecha date not null, fuente text, estado estado_precio not null, nota text,
  revisar boolean not null default false, updated_at timestamptz not null default now(),
  primary key (producto_id, tienda_id));

create table precios_historial (id bigserial primary key, producto_id text references productos,
  tienda_id text references tiendas, fecha date not null, precio integer, estado estado_precio not null,
  unique (producto_id, tienda_id, fecha));
create index on precios_historial (producto_id, fecha desc);

create table corridas (id bigserial primary key, inicio timestamptz not null default now(), fin timestamptz,
  fuentes jsonb, conteos jsonb, notas text);

create table tienda_estado (tienda_id text primary key references tiendas, estado estado_fuente, ultimo_ok date);

create table clima_causas (producto_id text references productos, fecha date not null, texto text not null,
  es_clima boolean not null, fuente_url text, primary key (producto_id, fecha));

create table anotados (producto_id text references productos, tienda_id text references tiendas,
  precio integer not null check (precio between 100 and 10000000),
  fecha date not null default (now() at time zone 'America/Bogota')::date,
  autor uuid references auth.users default auth.uid(), primary key (producto_id, tienda_id));

create table listas (user_id uuid primary key references auth.users on delete cascade,
  items jsonb not null default '{}', tienda_preferida text references tiendas default 'exito',
  updated_at timestamptz not null default now());

create table alertas (id bigserial primary key, user_id uuid references auth.users on delete cascade,
  tipo text not null check (tipo in ('mas_barato','mercado_completo','subida','caro_por_clima','fuente_caida')),
  producto_id text, tienda_id text, monto integer, mensaje text not null,
  creada timestamptz not null default now(), leida boolean not null default false);

create table preferencias_notif (user_id uuid primary key references auth.users on delete cascade,
  umbral_ahorro integer not null default 1000);

create view precio_efectivo with (security_invoker = true) as
select coalesce(p.producto_id, a.producto_id) producto_id, coalesce(p.tienda_id, a.tienda_id) tienda_id,
  case when a.precio is not null and (p.precio is null or p.estado <> 'real' or a.fecha >= p.fecha)
       then a.precio else p.precio end as precio,
  case when a.precio is not null and (p.precio is null or p.estado <> 'real' or a.fecha >= p.fecha)
       then 'anotado' else p.estado::text end as estado,
  greatest(p.fecha, a.fecha) as fecha, p.fuente, coalesce(p.revisar, false) revisar
from precios_actuales p full join anotados a
  on a.producto_id = p.producto_id and a.tienda_id = p.tienda_id;

-- RLS
alter table tiendas enable row level security;          create policy leer on tiendas for select using (true);
alter table productos enable row level security;        create policy leer on productos for select using (true);
alter table precios_actuales enable row level security; create policy leer on precios_actuales for select using (true);
alter table precios_historial enable row level security;create policy leer on precios_historial for select using (true);
alter table corridas enable row level security;         create policy leer on corridas for select using (true);
alter table tienda_estado enable row level security;    create policy leer on tienda_estado for select using (true);
alter table clima_causas enable row level security;     create policy leer on clima_causas for select using (true);
alter table producto_fuente enable row level security;  -- sin políticas: solo service_role
alter table anotados enable row level security;
create policy leer on anotados for select using (true);
create policy crear on anotados for insert to authenticated with check (autor = auth.uid());
create policy editar on anotados for update to authenticated using (true) with check (autor = auth.uid());
create policy borrar on anotados for delete to authenticated using (autor = auth.uid());
alter table listas enable row level security;
create policy propia on listas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table preferencias_notif enable row level security;
create policy propia on preferencias_notif for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table alertas enable row level security;
create policy leer on alertas for select to authenticated using (auth.uid() = user_id);
create policy marcar on alertas for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table alertas;
```

**Reglas de carga** (las aplica `scripts/migrar.ts` sobre `data/export/`):
- **Productos:** 144. `frecuencia` se asigna por grupo:
  - **diaria:** Frutas, Verduras, Tubérculos, Proteínas, Lácteos, Granos, Panadería.
  - **semanal:** Despensa, Aseo, Mecato, Bebidas, Gourmet.
- **`unidad_base` y `cantidad_base`:** salen de `unidad`.
  1. Se cambia la coma decimal por punto.
  2. Se aplica `/(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i`: kg → g ×1000 y L → ml ×1000.
  3. `"kg"` sola → g 1000.
  4. `"6 × 330 ml"` → ml 1980.
  5. Cualquier otra unidad → `u`, 1.
- **Tiendas:** al final quedan **5**, con id, nombre, color y manual: `d1`, `minorista` y `vaquita` automáticas; `pricesmart` y `barrio` manuales. Salen de `TIENDAS` en `data/origen/constantes-artifact.js`, menos las cinco que retira el paso 31. Antes del paso 31 son 10; el paso 20 ya había quitado Solofruver.
- **Precios actuales:** al final **144 × 3 = 432** filas desde `precios.json` (solo las tiendas automáticas que quedan). Antes del paso 31 son 1.152 (144 × 8); el paso 31 borra las filas de las cinco tiendas retiradas. Si `fuente` empieza por `http`, además se hace upsert de `producto_fuente.url`.
- **Historial:** una fila por (fecha, tienda) con precio numérico de cada `serie`, conservando el `estado`, incluido `simulado`.
- **Estado de tiendas y corridas:** `tienda_estado` y una fila en `corridas` salen de `meta.json`.
- **Anotados:** `anotados.json` está vacío hoy; si trae datos, se cargan con `autor = null`.

**Migraciones de los pasos 27–35 (30-oct-2026).** No se edita ninguna migración aplicada: cada paso agrega la suya con marca de tiempo. Todas repiten el patrón de permisos de `0001_esquema.sql` —`revoke all` sobre la tabla nueva y después `grant` explícito—, porque en Supabase toda tabla nueva nace con permisos para `anon` y `authenticated` y la RLS quedaría como única barrera.

| Paso | Migración | Cambios |
|---|---|---|
| 27 | `…_precios_manuales.sql` | tabla `precios_manuales_historial` + funciones `corregir_precio(text, text, integer)` y `quitar_correccion(text, text)` |
| 28 | `…_listas_guardadas.sql` | tabla `listas_guardadas` |
| 29 | `…_planes_usuario.sql` | tabla `planes_usuario` |
| 30 | `…_pronostico.sql` | tabla `contexto_mercado`, vista `serie_pronostico` y `create or replace view historial_minimo` |
| 31 | `…_retirar_tiendas.sql` | borra Éxito, Carulla, Euro, Ara e Ísimo de sus tablas hijas y de `tiendas`; cambia el default de `listas.tienda_preferida` a `d1` |
| 32 | `…_catalogo_barrio.sql` | tabla `catalogo_tienda` + 41 productos de barrio; `alertas.tipo` acepta `precio_manual_vencido` |
| 33 | — | sin migración: tutorial en el cliente |
| 34 | `…_importar_compras.sql` | `importaciones_gastos`, `importacion_cambios`, `producto_alias`, `tienda_alias`, `producto_codigo`; `gastos_reales.cantidad/descripcion/lote_importacion` y `origen='importado'`; `precios_manuales_historial.origen/cantidad/total/promocion/importacion_id`; escritura global de `tiendas`/`productos` con `nombre_norm`, `origen`, `revisado` y auditoría; `historial_minimo` sin promociones; `catalogo_tienda` sin el candado de `barrio`; funciones `normalizar_nombre`, `slug_tienda`, `crear_tienda`, `crear_producto`, `emparejar_producto`, `previsualizar_compra`, `importar_compra`, `deshacer_importacion` |
| 35 | `…_fusionar_productos.sql` | tabla `fusiones_productos` y función `fusionar_productos(text, text)` (mueve precios, historial, gastos, catálogo, alias, códigos y las listas y planes que apuntaban al origen, y borra el origen) |

`precio_efectivo` no cambia: la corrección a mano sigue viviendo en `anotados`, así que la regla de precio efectivo de §5 se cumple sin tocar la vista. **`listas.tienda_preferida` pasa de `'exito'` a `'d1'`**: la columna se creó con default `'exito'` en `0001_esquema.sql` y, al retirar Éxito, ese valor quedaría apuntando a una tienda inexistente. La migración del paso 31 actualiza las filas existentes y cambia el default; `src/corrida/alertas-usuario.ts` deja de caer en `"exito"` y cae en `"d1"`. Después de cada migración se corre `pnpm gen:tipos`; mientras `tipos.ts` no incluya una tabla nueva, la server action la consulta con el molde explícito que ya usa `presupuesto/acciones.ts`.

## 5. Reglas de negocio (exactas)

**Precio efectivo.** Es la vista `precio_efectivo`. El anotado gana si el automático no es válido, si no es `real` o si el anotado es igual o más reciente. El precio es `null` cuando el estado es `sin_dato`.

**Precio corregido a mano.** Es un anotado con historia. La tarjeta del catálogo y `/anotados` escriben con la función `corregir_precio(producto, tienda, precio)`, que en la misma transacción hace upsert en `anotados` (`autor = auth.uid()`) y en `precios_manuales_historial`:
- Exige sesión: sin `auth.uid()` lanza `sin_sesion` y no escribe nada.
- Entero entre 100 y 10.000.000; la función lo vuelve a validar, no confía en el cliente.
- La corrección es **global y con autor**: reemplaza al automático para todo el mundo; cualquiera con sesión puede corregir, pero solo el autor puede quitarla (`quitarAnotado`). Al quitarla se borra la fila de hoy de `precios_manuales_historial` (una corrección equivocada no debe quedar en la serie); las de días anteriores se conservan.
- Una fila por producto, tienda y día: corregir otra vez el mismo día actualiza esa fila, no agrega otra.
- La UI dice "corregido a mano · {fecha}" con la fecha efectiva, nunca un nombre (no hay perfiles).
- `precios_actuales` nunca se toca: al quitar la corrección vuelve el automático si sigue vigente.

**Cálculos de la lista.** La lista es `{id: cantidad}`, y estas funciones viven en `src/lib/precios/lista.ts`:
- Total por tienda visible y faltantes de cada una.
- **Mejor tienda completa:** la más barata entre las que tienen todos los productos.
- **Óptimo dividido:** cada producto en su tienda más barata.
- **Ahorro:** mejor tienda completa − óptimo dividido.

**Tiendas retiradas.** Éxito, Carulla, Euro, Ara e Ísimo no existen para la app desde el paso 31: no aparecen en filtros, tarjetas, `/anotados`, totales, gráficos ni alertas, y un `grep` de sus ids en `src/` no debe encontrar lógica de negocio (solo quedan en migraciones históricas y en `data/export/*.json`, que el paso 31 filtra al migrar). Guardar una lista con una tienda retirada se ignora al leerla y se cae a `d1`.

**Tienda/Carnicería de barrio.** Es la única tienda que nace **sin precios**: su catálogo se siembra una vez (41 productos) y todo lo demás se hace a mano.
- El catálogo vive en `catalogo_tienda` (producto, tienda, `activo`, `orden`, `creado`). Agregar un producto del catálogo general o uno propio es un alta; quitar uno es `activo = false` (no se borra, para no perder precios ni historial).
- **Ningún precio se siembra, se estima ni se inventa.** Todos entran por `corregir_precio('barrio', …)` del paso 27, con autor y fecha, y se pueden quitar con `quitar_correccion`.
- La frescura es más laxa que la de una tienda automática: **14 días** para frecuencia diaria y **30** para semanal. Pasado ese plazo, la etiqueta es `actualizar` (no `desactualizado`) y la tarjeta lleva a `/anotados/barrio`.
- Al entrar en la lista activa, el producto genera `precio_manual_vencido` una vez al día; productos del catálogo que no están en la lista no generan alertas.
- La UI dice siempre "solo anotados" y "sin dato" hasta que alguien escriba un precio; nunca muestra un precio de referencia.

**Catálogo compartido de tiendas y productos (paso 34).**
- `tiendas` y `productos` dejan de ser de solo lectura: con sesión se crean y se editan; `anon` solo lee. **Nadie borra** una tienda ni un producto con datos: se renombra, se desactiva o se fusiona.
- El nombre se normaliza (minúsculas, sin acentos, espacios colapsados) y es único. Crear "Olímpica" cuando ya existe "OLIMPICA" devuelve la existente: nunca se duplica una tienda por tilde o mayúscula.
- Una tienda nueva nace `manual = true` (sin corrida), con un color de la paleta y `nota = 'Creada desde una factura'`. **Una tienda es una cadena, no una sucursal**: la dirección y el NIT no se guardan.
- Un producto nuevo nace `grupo = 'Otros'`, `unidad = 'u'`, `unidad_base = 'u'`, `cantidad_base = 1`, `frecuencia = 'semanal'` y `origen = 'compra'`. Se corrige en `/tiendas` y se puede fusionar con otro.
- `producto_alias`, `tienda_alias` y `producto_codigo` recuerdan cómo venía escrito cada nombre en cada tienda y el código de barras: la siguiente importación empareja sola, sin volver a preguntar.
- Todas las escrituras son globales e inmediatas. `creado_por` y `creado` quedan en tiendas y productos; no hay perfiles, así que la UI no muestra nombres de persona.
- `/tiendas` es la pantalla de gestión; `/anotados` solo muestra tiendas con al menos un precio en `precio_efectivo`, salvo las automáticas (`manual = false`), que se muestran siempre para que una fuente caída no borre su columna.

**Importación de una factura (CSV) (paso 34).**
- Contrato: cabecera mínima `producto,cantidad,precio_total,tienda`; al final se aceptan `fecha` y `codigo` (opcionales, en ese orden). UTF-8, una fila por línea de la factura, sin totales ni columnas extra. Se toleran BOM, CRLF, `;` y coma decimal; el resto se rechaza con el número de línea.
- Un CSV puede traer varias facturas: se agrupa por `tienda` + `fecha`. `fecha` vacía usa la fecha del lote; `codigo` vacío no aporta nada.
- `cantidad` es informativa para el gasto y **base del precio**: el precio de tienda es `round(precio_total / cantidad)`. Así "3 × 2.500" guarda 2.500, y "1.25 kg por 18.750" guarda 15.000/kg.
- El precio se registra con la **fecha de la factura** y no pisa uno más nuevo de esa tienda; siempre queda en `precios_manuales_historial` con `origen = 'compra'`, cantidad y total. Si ya había uno más nuevo, el import lo informa en el resultado.
- Un precio fuera de 100–10.000.000 no se escribe (el gasto sí) y se avisa en la revisión. Una fila marcada como **promoción** va al historial pero no pisa el precio vigente.
- El emparejamiento es exacto, nunca por parecido: código de barras, alias de la tienda, alias global y nombre normalizado, en ese orden. Si la presentación no coincide ("Leche 1 L" vs "Leche 1.1 L"), es un producto distinto.
- Tienda o producto desconocidos se muestran en la revisión y se crean **solo si el usuario confirma**; el nombre de la tienda se normaliza y se puede corregir antes de crear.
- El gasto guarda `monto = precio_total`, `cantidad`, `descripcion` (el nombre tal como vino), `lote_importacion`, `tienda_id`, `producto_id` y `mes = fecha.slice(0,7)`; `origen = 'importado'`.
- El lote y los gastos son **privados**; tiendas, productos y precios son **globales**. El interruptor "publicar precios" (por defecto sí) permite importar solo los gastos: en ese caso el gasto queda con `tienda_id = null`, `producto_id = null` y no se crea nada en el catálogo.
- Duplicado: hash SHA-256 del CSV normalizado + fecha del lote, **por usuario** y con el mismo valor con o sin sesión. Con sesión vive en `importaciones_gastos` (índice único `(user_id, hash)` mientras `deshecho is null`); sin sesión, en `localStorage`. El mismo archivo con la misma fecha se bloquea con un mensaje que dice cuándo se importó; no hay opción de "importar igual". Después de deshacer, el mismo archivo se puede volver a importar.
- Límites: 500 filas, 1 MB, 5 tiendas nuevas y 50 productos nuevos por usuario y día. El servidor los vuelve a validar.
- La revisión pide opcionalmente el **total impreso del recibo** por cada grupo tienda+fecha y avisa si la suma de líneas no cuadra (diferencia > 1 % o > 500 COP), sin bloquear.
- "Deshacer importación" restaura los precios que el lote pisó, solo si nadie los cambió después (si cambiaron, los deja y lo dice), y borra sus gastos. Las tiendas y productos creados quedan en el catálogo.
- Efecto conocido: los precios importados entran a `precio_efectivo` y a `historial_minimo`, así que cambian totales, mejor tienda, alertas y pronóstico para todos. La revisión lo dice antes de guardar; el lote no genera alertas por sí mismo.

**Listas guardadas.** Una lista guardada es un nombre y una copia de la lista activa:
- Nombre de 1 a 60 caracteres, único por cuenta sin distinguir mayúsculas ni espacios sobrantes. Repetirlo avisa `nombre_repetido` y no guarda.
- Máximo 20 listas por cuenta y 200 ítems por lista. Al llegar al tope, "Guardar" queda deshabilitado y avisa `limite_listas`.
- "Cargar" reemplaza la lista activa y ofrece "Deshacer" 6 s; "Sumar" fusiona con `max(cantidad)` sin bajar cantidades; además "Renombrar", "Duplicar", "Eliminar" (confirma en línea, sin modal) y "Exportar" a JSON.
- Con sesión viven en `listas_guardadas`; sin sesión, en `mercado-medellin:listas`. Al iniciar sesión se fusionan por nombre y gana la `actualizada` más reciente; lo local se conserva si el nombre no existe en la nube.
- Guardar no vacía la lista activa ni la marca como comprada.

**Hogar y Dieta editables.** Se editan los rubros del presupuesto, las personas y aportantes del reparto, las cantidades de los ítems del plan, los productos propios y una nota (≤1000 caracteres). Las tablas de referencia del artifact y los precios siguen de solo lectura.
- Config en `planes_usuario.config` (jsonb, versión 1, validado con zod). Con sesión en Supabase; sin sesión, en `mercado-medellin:plan:{hogar|dieta}`.
- Al iniciar sesión gana el lado con `actualizada` más reciente; lo que se reemplaza queda una semana en `mercado-medellin:plan:{tipo}:respaldo`. Si gana lo local, sale `plan_restaurado` con "Deshacer" (vuelve lo de la nube).
- Los rubros del plan **no** son el presupuesto mensual de `/presupuesto`: ese sigue en `presupuestos_mensuales`, y la UI lo dice.
- El plan no escribe en la lista activa hasta que se pulsa "Usar como mi lista" o "Sumar a mi lista".

**Pronóstico a 7 días.** Aplica solo a Frutas, Verduras y Tubérculos (40 productos) y responde una sola pregunta: ¿el precio sube, baja o se queda estable en los próximos 7 días?
- Estadística determinista sobre la serie propia: 60 puntos de `serie_pronostico` (mínimo diario de `historial_minimo` más las filas de `precios_manuales_historial`), el clima de SIPSA de los últimos 7 días y el IPC de alimentos del DANE del último mes disponible. No usa IA ni LLM.
- Devuelve **dirección** (sube, baja, estable), **probabilidad** de esa dirección (34–92 %), **rango** del precio esperado y **confianza** (alta, media, baja), con máximo 3 motivos de un catálogo cerrado.
- **No es un precio.** No entra en el total, el óptimo dividido, las alertas ni el PDF; no se guarda en `precios_actuales` ni en `precios_historial`; la UI lo rotula "estimación estadística" y muestra el rango, nunca un solo número.
- Menos de 8 puntos en 60 días → no hay pronóstico y la tarjeta no muestra el bloque (`sin_historial`).
- Si la última fila de `contexto_mercado` tiene más de 45 días (o no existe), el pronóstico sale igual con confianza máxima "media" y el motivo "sin contexto DANE".
- Una corrección de hoy pesa como un punto más de la serie: por sí sola no cambia el signo.

**Tutorial animado.** Es una ayuda visual, no un modal de bienvenida ni un requisito para usar la app.
- Se muestra **una vez por dispositivo** (clave `mercado-medellin:tutorial:v1`, siempre en try/catch). Si `localStorage` no está disponible, no se muestra automáticamente; el botón de bombilla sigue funcionando.
- Hay un recorrido **general** (Canasta, búsqueda, chips, tarjetas, carrito, lista, anotados, Hogar/Dieta, presupuesto, alertas) y recorridos **por pantalla**; al abrirlo desde la bombilla se ofrece el de la pantalla actual primero.
- Cada paso ilumina **solo** un elemento visible (`data-tour`): el resto se oscurece con un foco y la tarjeta de texto se coloca al lado que no tape el objetivo. Si el objetivo no existe en esa pantalla, el paso se salta.
- Se cierra con "Saltar", `Esc` o el botón de cerrar; al terminar o saltar se marca como visto. Se puede repetir desde "Ver tutorial" en el menú de la bombilla o con `?tutorial=1`.
- Mientras el tutorial está abierto, los tips automáticos del paso 14 no salen; después de completarlo tampoco, para no repetir ayuda.
- No aparece en las rutas de autenticación (`/ingresar`, `/registro`, `/recuperar`, `/nueva-clave`, `/auth/*`) ni sobre una hoja abierta.
- Con `prefers-reduced-motion: reduce` el foco y la tarjeta cambian sin animación, pero el recorrido funciona igual.
- **No es un cambio de datos:** no escribe en Supabase, no crea avisos persistentes y no bloquea la navegación.

**Alertas** (`src/lib/alertas/reglas.ts`): se ordenan por monto; se muestran 5 y un botón "ver todas".

| Alerta | Cuándo salta | Para quién / monto |
|---|---|---|
| `mas_barato` | Otra tienda es ≥10 % y ≥ `umbral_ahorro` (por defecto 1000) más barata que la tienda preferida | Monto = diferencia × cantidad |
| `mercado_completo` | Otra tienda completa sale ≥5 % más barata | |
| `subida` | El precio supera en ≥15 % el promedio de los 7 puntos previos | |
| `caro_por_clima` | `subida` y además existe una `clima_causas.es_clima` de los últimos 7 días | |
| `precio_manual_vencido` | Un producto de Tienda/Carnicería de barrio que está en la lista activa lleva más de 14 días sin precio corregido (30 si es semanal) | Solo para quien tiene ese producto en su lista; enlace a `/anotados/barrio` |
| `fuente_caida` | Una tienda automática quedó en `fallo` o lleva ≥3 días sin `ultimo_ok` | Solo correo al admin |

**Etiquetas** (`src/lib/precios/etiquetas.ts`):
- **↑/↓:** precio actual contra el promedio de los 7 días previos, con umbral de ±15 %.
- **🌧️ clima:** hay una causa `es_clima` en los últimos 7 días.
- **sin dato**, **anotado**, **estimado**, **mayorista** (cuando la fuente es SIPSA) y **revisar** (`revisar = true`).
- **desactualizado:** cuando `hoy − fecha > (1 si diaria · 7 si semanal) + 3` días.
- **actualizar:** solo para Tienda/Carnicería de barrio: `hoy − fecha > 14` días si es diaria o `> 30` si es semanal. Reemplaza a `desactualizado` en esa tienda y enlaza a `/anotados/barrio`; nunca se muestra en tiendas automáticas.
- **En fluctuación:** cambio de ≥15 % en 7 días, o coeficiente de variación ≥ 0.12 en 30 días.

**Clasificador de clima.** No usa IA. Es una regex que ignora mayúsculas y acentos, aplicada a la frase de Medellín:
`lluvia|lluvioso|invierno|ola invernal|verano|sequ[ií]a|helada|clima|clim[aá]tic|fen[oó]meno de (la )?ni[nñ]a|el ni[nñ]o|temporal|inundaci`.
- El texto se guarda literal.
- La UI dice "Causa según DANE (SIPSA)" o "causa no reportada".
- **Nunca se inventa un precio ni una causa.**

## 6. La corrida (`scripts/corrida.ts` → `src/corrida/orquestador.ts`)

1. **Qué productos toca:** todos los días los grupos de frecuencia diaria. Los lunes, o con `--todo`, también los semanales. El orden de prioridad es frescos → proteínas, lácteos y granos → despensa, panadería y aseo → antojos.
2. **Cómo consulta:** las tiendas van en paralelo, y dentro de cada tienda las consultas son secuenciales con ≥1 s de pausa. El User-Agent es `CORRIDA_USER_AGENT`. Respeta robots.txt: Ísimo no tiene adaptador y **Euro, Éxito, Carulla y Ara se retiraron el 30-oct-2026 (paso 31)**, así que la corrida solo consulta D1, La Minorista y La Vaquita. Nunca salta captchas ni logins.
3. **VTEX** (solo D1):
   - Consulta: `GET https://www.<host>/api/catalog_system/pub/products/search?ft=<termino>&_from=0&_to=4`.
   - **Cambio del 26-oct-2026:** la corrida solo hace consultas exactas: `?fq=alternateIds_RefId:<n>` con el número final de la URL `/p` (91 productos) o, si no hay URL `/p`, `?fq=skuId:<sku>`. La búsqueda por término ya no se usa: en D1 devolvía otro producto ("arveja" → arveja seca 500 g, "maiz" → Maizena) y su SKU quedaba fijado. Los 12 productos que solo tenían término siguen por anotados hasta que alguien les ponga su URL `/p` o su SKU.
   - Precio = `items[0].sellers[0].commertialOffer.Price`. Se descarta si `AvailableQuantity` es 0 o el precio es 0.
   - El `skuId` encontrado se guarda.
4. **SIPSA:**
   - Busca `https://www.dane.gov.co/files/operaciones/SIPSA/anex-SIPSADiario-<dd><mmm><aaaa>.xlsx` y el PDF `bol-SIPSADiario-…pdf`, con el mes en español abreviado y en minúscula (ene … dic). Prueba hoy y hasta 3 días atrás.
   - Del xlsx (exceljs) toma las filas de Medellín (Central Mayorista de Antioquia), en $/kg.
   - Del PDF (unpdf) toma las frases que mencionan Medellín y el producto, y las escribe en `clima_causas`.
   - Solo aplica el dato si es más nuevo que el guardado. Usa `fuente = "SIPSA (mayorista)"` y la fecha del boletín.
5. **Normalización** (`normalizar.ts`): si la unidad del hallazgo no es la del producto, devuelve `null`. Si no, calcula `v = precio × cantidad_base / cantidad_hallazgo` y redondea a la centena cuando hubo conversión.
6. **Validación y escritura:**
   - Un cambio de más de 35 % frente al último precio real se escribe igual, pero con `revisar = true`.
   - Si no hubo hallazgo, no se toca `precios_actuales`.
   - Se hace upsert de `precios_actuales` (estado `real`, `fecha = hoyBogota()`) y de `precios_historial` (`on conflict (producto_id, tienda_id, fecha) do update`).
   - Al final se inserta la fila en `corridas` y se hace upsert de `tienda_estado`:
     - **ok:** más del 50 % de los productos que se intentaron en esa tienda.
     - **parcial:** al menos 1.
     - **fallo:** 0.
   - `ultimo_ok` = hoy si quedó ok o parcial.
7. **Alertas por usuario:** se calculan para cada usuario con lista. Antes se borran las no leídas del mismo tipo y producto del mismo día, para que repetir la corrida no las duplique. Además de las alertas de precio, genera `precio_manual_vencido` para los productos de Tienda/Carnicería de barrio que están en la lista activa y llevan más de 14 días (30 si son semanales) sin precio manual; no toca productos del catálogo que el usuario no tiene en su lista.
8. **Correo al admin:**
   - Se envía **un** correo a `ADMIN_EMAIL` si hubo `fuente_caida` o una excepción.
   - Usa nodemailer con SMTP 465 y `secure: true`.
   - Si falta configuración SMTP, solo lo registra en consola.
9. **Idempotencia y exit code:**
   - Correrla dos veces el mismo día deja el mismo estado.
   - Sale con exit 0 aunque haya tiendas en fallo; exit 1 solo ante una excepción no controlada (y GitHub avisa por correo).
10. **Pruebas:** usan un `fetch` inyectado que sirve fixtures **reales**, capturados con `pnpm capturar <vtex|sipsa|vaquita>` y guardados en `tests/fixtures/<tienda>/`. Nunca se escriben a mano.

**Workflow `.github/workflows/corrida.yml`:**

```yaml
name: corrida
on:
  schedule: [{ cron: "17 11 * * *" }]   # 6:17 a. m. Bogotá; fuera de la hora en punto
  workflow_dispatch: {}
concurrency: { group: corrida, cancel-in-progress: false }
jobs:
  corrida:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v7
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v7
        with: { node-version-file: .nvmrc, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm corrida
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SMTP_HOST: smtp.gmail.com
          SMTP_PORT: "465"
          SMTP_USER: ${{ secrets.SMTP_USER }}
          SMTP_PASS: ${{ secrets.SMTP_PASS }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          CORRIDA_USER_AGENT: "MercadoMedellinBot/1.0 (+uso familiar; contacto en README)"
```

## 7. Web y diseño

**Encabezado:**
- "Actualizado: hoy 6:06 a. m.", un punto de color por tienda automática y "X/3 fuentes OK" (D1, La Minorista y La Vaquita; las manuales no cuentan).
- Las tiendas con `ultimo_ok` ausente o de hace ≥3 días.
- **Banner rojo** si la última corrida tiene más de 26 h, con el botón **"Actualizar precios"** (paso 14).
- **Notificaciones (toasts):** catálogo, reglas y resumen del día en el paso 14.
- Campana de alertas: solo con sesión, alimentada por Realtime sobre `alertas`.

**La lista:**
- Sin sesión vive en `localStorage`, siempre dentro de try/catch.
- Con sesión se guarda en `listas` mediante una server action.
- Al iniciar sesión, la lista local se fusiona con la guardada.
- **Botón flotante "Guardar lista"** (`src/components/listas/boton-guardar.tsx`): círculo de 56 px abajo a la derecha, solo con ≥1 producto, 24 px del borde en escritorio y por encima de la barra del carrito en móvil (`env(safe-area-inset-bottom)` incluido). Abre la hoja de la animación 4 con el nombre sugerido ("Mercado del {día}"), un campo y "Guardar". Al guardar, la hoja se cierra, el botón pulsa una vez (animación 9) y sale `lista_guardada` con "Ver" → `/listas`. `aria-label="Guardar esta lista"` y 44 px en táctil; nunca tapa el total ni el botón "Descargar PDF".

**`/listas`:**
- Rejilla de tarjetas con nombre, n.º de productos, total a la tienda preferida, "actualizada hace {n} días" y las acciones **Cargar · Sumar · ⋯** (Renombrar, Duplicar, Exportar, Eliminar).
- Cargar y Sumar llevan su aviso con "Deshacer"; Eliminar confirma en la misma tarjeta ("¿Eliminar? Sí / No"), sin modal.
- Vacío: explica el botón flotante; sin sesión, una banda arriba dice "Estas listas viven en este dispositivo" con "Ingresar".
- Los errores del límite y del nombre repetido se ven junto al campo, no solo en el toast.

**Anotados:**
- Tabla producto × tienda, incluidas las manuales, con el precio más bajo resaltado en azul.
- **Tienda/Carnicería de barrio** no entra en esa matriz: tiene su propia vista `/anotados/barrio` y un enlace destacado arriba de `/anotados` ("Tienda/Carnicería: N/41 con precio · M por actualizar"). En la matriz general solo aparece como una columna más si ya tiene precios; si no, se muestra "sin dato" y un enlace a su vista.
- La escritura usa zod (entero entre 100 y 10.000.000) y requiere sesión.
- **Corregir desde la tarjeta:** en el catálogo, precio, tienda y etiquetas salen del `<Link>` y el ✎ es un `button` hermano (`aria-label="Corregir precio de {producto}"`) que abre una hoja con el precio actual, la tienda, un campo numérico (`inputMode="numeric"`, `font-size ≥ 16 px`) y "Guardar corrección" / "Quitar corrección" (esto último solo si la corrección es propia). Sin sesión, el ✎ lleva a `/ingresar` con `anotar_sin_sesion`.
- `/anotados` gana la columna "corregido" con la fecha y usa la misma acción del catálogo.

**`/anotados/barrio` (paso 32):**
- Encabezado con el progreso "N/41 con precio · M por actualizar" y una barra; "por actualizar" usa 14 días (diaria) o 30 (semanal), no la regla de las tiendas automáticas.
- Lista del catálogo agrupada por Proteínas, Lácteos, Panadería y Despensa, con el precio manual, su fecha, "actualizar" cuando vence y el ✎ de la corrección.
- "Agregar producto" busca en los 144 del catálogo general y ofrece "producto propio" (nombre, unidad y grupo); "Quitar" pide confirmación en línea y deja el producto inactivo sin borrar sus precios ni su historial.
- Sin sesión se ve el catálogo y los precios, pero el ✎ lleva a `/ingresar`; la banda lo dice.
- El estado vacío explica que esta tienda se arma a mano y que ningún precio se inventa.

**Hogar y Dieta:** el contenido sale de `data/origen/*`, portado a `src/data/planes.ts`. Tienen botones "Usar como mi lista" y "Sumar a mi lista".
- Editables: cada rubro es un `input` numérico y el total, el reparto por persona y por aportante y la comparación con la lista se recalculan al escribir (debounce 300 ms, guardado aparte).
- "Ítems del plan" con stepper; "productos propios" (nombre + precio estimado, tope 50); nota con contador de 1000; "Volver al sugerido" confirma en línea.
- Banda de estado de guardado: "Guardado en tu cuenta" · "Guardado en este dispositivo" · "Guardando…" · "Sin guardar". Con sesión y `planes_usuario` vacío, se sube lo local una vez y sale `plan_fusionado`.

**Pronóstico (paso 30):**
- Chip en la tarjeta solo para Frutas, Verduras y Tubérculos: "↑ 62 % · 7 días" con el color `up`, `save` o el neutro del texto, y un `aria-label` que dice la frase completa.
- En `/producto/[id]`, bloque "Próximos 7 días": dirección, probabilidad, rango, confianza, máximo 3 motivos y la serie con el trazo dibujándose (animación 10). Pie fijo: "Estimación estadística, no un precio. Usa el historial, el clima de SIPSA y el IPC de alimentos del DANE."
- Sin historial suficiente no se muestra el bloque, ni vacío ni con ceros.

**Tutorial y bombilla de ayuda (paso 33):**
- **Botón de bombilla** (`src/components/tutorial/bombilla.tsx`): círculo de 48 px abajo a la izquierda, 20 px del borde y por encima de `env(safe-area-inset-bottom)`; nunca compite con el botón "Guardar lista" (abajo a la derecha) ni con la barra del carrito. `aria-label="Ayuda y tutorial"`, 44 px en táctil. Abre un menú pequeño: **"Ver esta pantalla"**, **"Tutorial general"**, **"Reiniciar tutorial"** (borra la marca de visto) y **"Cerrar"**.
- **Overlay de foco** (`src/components/tutorial/tutorial.tsx`): capa fija con `rgba(15,23,42,.55)`, un recorte alrededor del `data-tour` activo (4 esquinas redondeadas, borde blanco de 2 px) y una tarjeta con título, texto, "Paso N de M", "Anterior", "Siguiente", "Saltar" y "Cerrar". La tarjeta se coloca arriba, abajo, izquierda o derecha según el espacio y nunca tapa el objetivo; en móvil va abajo y el objetivo se desplaza a la vista con `scrollIntoView({ block: "center" })`.
- **Comportamiento:** foco atrapado dentro de la tarjeta, `Esc` cierra, el objetivo mantiene su `aria-label` y el resto de la página queda `aria-hidden` mientras dura. Al terminar o saltar se guarda `mercado-medellin:tutorial:v1 = { version: 1, general: true, pantallas: [...] }`. Se abre solo la primera vez que se entra a una pantalla cubierta y no en rutas de auth.
- **Con `?tutorial=1`** se abre el general aunque ya esté visto, sin escribir la marca hasta que termine.
- **Coordinación con los tips:** `TipsNoInvasivos` no muestra nada mientras el tutorial está abierto ni después de completado; los tips siguen existiendo para quien saltó el tutorial.
- **Reduced motion:** sin animación de foco ni de tarjeta, pero con el mismo recorrido y los mismos textos.

**Gráficos:** Recharts, con un solo gráfico montado por vista. Son tres: total por tienda, historial de 30 días y gasto por grupo (colores `GCOL`).

**`/api/salud`:** devuelve `{ ok:true, ultimaCorrida, horasDesdeCorrida, fuentesOk }` con 200 cuando la base de datos responde.

**Tokens de diseño:** están en `workspace/CLAUDE.md` (sección Sistema de diseño) y van en `src/app/globals.css`, con modo claro y oscuro. El prototipo aprobado está en https://claude.ai/artifact/S6PbvgsR3xzoTTCZJGA7kg.

| Token | Claro | Oscuro |
|---|---|---|
| fondo / superficie / texto | `#FAFAF7` / `#FFFFFF` / `#0F172A` | `#0E1116` / `#161A21` / `#E7EAEE` |
| ahorro (save) | `#10B981` · tinta `#047857` · fondo `#E7F7F0` | `#34D399` · `#6EE7B7` · `#0F2A20` |
| sube (up) | `#EF4444` · `#B42318` · `#FDECEC` | `#F87171` · `#FCA5A5` · `#2C1616` |
| aviso (warn) | `#F59E0B` · `#8A5300` · `#FEF4DE` | `#FBBF24` · `#FCD34D` · `#2A2110` |
| anotado | `#2563EB` · `#1D4ED8` · `#E8EFFD` | `#60A5FA` · `#93C5FD` · `#132238` |
| clima | `#0EA5E9` · `#0369A1` · `#E0F2FE` | `#38BDF8` · `#7DD3FC` · `#0C2A3A` |

Tipografía Inter (next/font) y `tabular-nums` en todos los números.

**Animaciones** (GSAP con `useGSAP` y `contextSafe`, todas dentro de `gsap.matchMedia()`; con reduce, la duración es 0):

| # | Animación |
|---|---|
| 1 | El emoji vuela en arco al carrito (0.55 s, escala 0.45) y el icono del carrito rebota |
| 2 | El total y el ahorro cuentan hasta el nuevo valor (0.5 s, snap de 100) |
| 3 | Las tarjetas entran en cascada (y 10 → 0, 0.28 s, stagger 0.03) |
| 4 | Hoja inferior que se cierra arrastrando (Draggable `y`; cierra si y > 110 px) |
| 5 | Las barras crecen (scaleX, stagger 0.06) y el mini gráfico se dibuja (0.7 s) |
| 6 | El subrayado de la pestaña se desliza (0.3 s) |
| 7 | La campana se sacude una vez (0, −16, 14, −10, 6, 0 en 0.6 s) |
| 8 | Las etiquetas de hoy pulsan una vez (escala 1.18, yoyo) |
| 9 | El botón flotante "Guardar lista" pulsa (escala 1 → 1.12 → 1, 0.35 s) y la tarjeta nueva de `/listas` entra desde abajo (y 12 → 0) |
| 10 | El trazo del pronóstico se dibuja de izquierda a derecha (0.7 s) y el último punto aparece con un pulso |
| 11 | El foco del tutorial se abre desde el centro del objetivo (scale 0.94 → 1, 0.32 s) y la tarjeta entra desde el lado más cercano (y/x 8 → 0, opacity, 0.24 s); al cambiar de paso, el foco se desliza a la nueva posición (0.4 s `power2.inOut`) |
| 12 | La bombilla se enciende una vez al terminar el tutorial (filtro `drop-shadow` y rotación −8° → 0, 0.5 s) y la marca de "visto" aparece con un check que se dibuja |

## 8. Variables de entorno

Las variables están en `workspace/.env.example`. En local, `pnpm env:local` genera `.env.local` a partir de `supabase status -o json`.

| Variable | Dónde vive |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel |
| `SUPABASE_URL` | Solo scripts y GitHub secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo scripts y GitHub secrets. **Nunca** en una variable `NEXT_PUBLIC_*` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | `SMTP_PASS` es la contraseña de aplicación de Gmail; requiere la verificación en 2 pasos activa |
| `ADMIN_EMAIL` | Quien recibe el correo de fallos |
| `CORRIDA_USER_AGENT` | User-Agent de la corrida |
| `GITHUB_DISPATCH_TOKEN` | Solo Vercel (servidor). Token *fine-grained* de GitHub limitado a este repo con permiso **Actions: Read and write** y nada más. Lo lee solo `src/lib/github.ts`. **Nunca** en una variable `NEXT_PUBLIC_*`. Opcional: sin él, el botón "Actualizar precios" muestra el aviso `actualizacion_fallo` |
| `GITHUB_REPO` | Solo Vercel (servidor). `dueño/repo` del workflow, p. ej. `Esteark/appMedellinMarket` |
| `ENABLE_EXPERIMENTAL_COREPACK` | Solo Vercel, valor `1`. Vercel documenta pnpm hasta la 10 y el lockfile es de pnpm 12; con Corepack usa el `packageManager` de `package.json` |

Cómo carga cada herramienta las variables:
- Los scripts importan `./cargar-env` como su **primer** import.
- `vitest.config.ts` carga `.env.local`.
- Next.js las carga solo.

## 9. Bootstrap

Se corre una vez en una carpeta vacía nueva. Es bash (en Windows, Git Bash) y se puede re-ejecutar sin romper nada.

**Requisitos:**
- Node 24.22.1.
- Git.
- **Docker Desktop** corriendo (`docker info` debe salir con 0).

```bash
set -e
B="ruta/a/blueprints/mercado-medellin"            # ← ruta real de este bundle, entre comillas
# corepack 0.36 no arranca pnpm 12 (binario nativo, sin bin/pnpm.cjs) → instalar con npm
[ "$(pnpm -v 2>/dev/null)" = "12.15.0" ] || npm install -g pnpm@12.15.0
# 1) scaffold (solo si aún no existe package.json)
[ -f package.json ] || {
  pnpm create next-app@16.4.2 _tmp --ts --app --tailwind --biome --src-dir --use-pnpm --yes
  (shopt -s dotglob; mv _tmp/* . ); rmdir _tmp
}
# 2) copiar workspace/ sin pisar nada que ya exista (re-ejecutable, exit 0)
(cd "$B/workspace" && find . -type f) | while read -r f; do
  [ -e "$f" ] || { mkdir -p "$(dirname "$f")"; cp "$B/workspace/$f" "$f"; }
done
# 3) dependencias con pin
pnpm add next@16.4.2 react@19.3.1 react-dom@19.3.1 @supabase/supabase-js@2.118.0 @supabase/ssr@0.12.7 \
  zod@4.6.7 recharts@3.10.1 react-is@19.3.1 gsap@3.15.0 @gsap/react@2.1.2
pnpm add -D typescript@~6.0.3 @types/node@24 @types/react@19.3.0 @types/react-dom@19.3.0 \
  @biomejs/biome@2.6.2 vitest@5.0.5 @playwright/test@1.64.1 tsx@4.23.15 supabase@2.121.0 \
  cheerio@1.2.0 exceljs@4.4.0 unpdf@1.9.1 nodemailer@10.2.1 @types/nodemailer@8.0.2
pnpm approve-builds --all
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chromium
pnpm dlx shadcn@4.22.1 init --base radix --no-monorepo --yes || true   # ya inicializado → no falla
# 4) git
git rev-parse --git-dir >/dev/null 2>&1 || { git init -b main; git add -A; git commit -m "bootstrap"; }
```

**Ediciones manuales después del Bootstrap:**

1. Agregar a `package.json`:
   - `"packageManager": "pnpm@12.15.0"`.
   - `"engines": {"node": ">=24.22.1 <25"}`.
   - Estos scripts:

```json
"dev": "next dev", "build": "next build", "start": "next start",
"typecheck": "tsc --noEmit", "lint": "biome check .", "format": "biome check --write .",
"test": "vitest run", "test:e2e": "playwright test", "humo": "tsx scripts/humo.ts",
"env:local": "tsx scripts/env-local.ts", "migrar": "tsx scripts/migrar.ts",
"gen:tipos": "supabase gen types --lang typescript --local > src/lib/supabase/tipos.ts",
"corrida": "tsx scripts/corrida.ts", "capturar": "tsx scripts/capturar-fixtures.ts"
```

2. En `biome.json`:
   - Poner `$schema` en `.../2.6.2/schema.json`.
   - Agregar a `files.includes`: `"!**/*.svg"`, `"!blueprints"`, `"!data"`, `"!supabase/.temp"`, `"!src/lib/supabase/tipos.ts"`.
   - Mantener `css.parser.tailwindDirectives: true`.

3. Confirmar que `.gitignore` excluye `.env.local` y **no** excluye `.env.example`. Si tiene un patrón `.env*`, agregar la línea `!.env.example`.

## 10. Pasos de construcción

Cada paso cierra con `pnpm typecheck && pnpm lint && pnpm test` en verde y luego:

```bash
git add -A && git commit -m "paso NN" && git tag paso-NN
```

Desde el paso 2 hace falta Supabase local arriba: `pnpm exec supabase start` y después `pnpm env:local`.

**1. Esqueleto con `/api/salud`.**
- **Hacer:** `src/app/api/salud/route.ts` con un stub `{ok:true}`.
- **Hecho cuando:** CUANDO corre `pnpm build && pnpm humo --ruta api/salud --contiene '"ok":true'`, EL SISTEMA DEBE salir con 0.
- **Verificar:** ese mismo comando.

**2. Esquema y RLS.**
- **Hacer:** `supabase init`; `supabase/migrations/0001_esquema.sql` (sección 4); `supabase/tests/rls.test.sql`.
- **Pruebas pgTAP:**
  - anon puede leer `precios_actuales` y no puede insertar en ella.
  - anon recibe 0 filas de `producto_fuente`.
  - El usuario A no ve la lista del usuario B.
  - Un usuario no puede anotar con un `autor` ajeno.
- **Hecho cuando:** CUANDO corre `pnpm exec supabase db reset && pnpm exec supabase test db`, EL SISTEMA DEBE pasar todas las pruebas.

**3. Migración de datos.**
- **Hacer:** `scripts/migrar.ts` con las reglas de la sección 4, más `pnpm gen:tipos`.
- **Hecho cuando:** CUANDO corre `pnpm migrar`, EL SISTEMA DEBE imprimir `productos=144 precios=1152 tiendas=10` y salir con 0. El script compara él mismo cada conteo contra el JSON de origen y aborta si no coincide. **El paso 31 baja los tres números a `precios=432 tiendas=4`** (los productos no cambian); ese paso actualiza el mensaje y el conteo esperado, no este.

**4. Lógica pura.**
- **Hacer:** `lista.ts`, `etiquetas.ts`, `reglas.ts`, `unidades.ts`, `fecha.ts`, con sus pruebas en `tests/unit/`.
- **Hecho cuando:** CUANDO corre `pnpm test tests/unit`, EL SISTEMA DEBE pasar casos para:
  - mejor tienda completa y óptimo dividido;
  - las 5 alertas;
  - ↑/↓ en el borde exacto de ±15 %;
  - "desactualizado" para diaria y para semanal;
  - las 5 reglas de unidades de la sección 4.

**5. Adaptador VTEX.**
- **Hacer:** `normalizar.ts`, `adaptadores/vtex.ts` y `scripts/capturar-fixtures.ts`; luego correr `pnpm capturar vtex` para guardar fixtures reales.
- **Hecho cuando:** CUANDO las pruebas sirven los fixtures reales, EL SISTEMA DEBE:
  - devolver precio, `sku` y url;
  - devolver `null` si `AvailableQuantity` es 0;
  - devolver `null` si la unidad no es convertible.

**6. Adaptador Euro — retirado el 30-oct-2026.** No se construye: Euro se retira en el paso 31 y su adaptador y fixtures se borran allí. El número se conserva para no renumerar los pasos 7–33. Quien construya desde cero puede saltar este paso y seguir con el 7.

**7. Adaptador SIPSA.**
- **Hacer:** `adaptadores/sipsa.ts` con xlsx, PDF y el clasificador de clima; probarlo con un boletín real capturado.
- **Hecho cuando:**
  - una frase con "lluvias" da `es_clima = true`;
  - una frase con "menor oferta" sin término climático da `false`;
  - el precio sale en $/kg.

**8. Orquestador.**
- **Hacer:** `orquestador.ts`, `admin.ts` y `scripts/corrida.ts`; prueba de integración contra la base local con un `fetch` falso.
- **Hecho cuando:** CUANDO la corrida se ejecuta dos veces el mismo día, EL SISTEMA DEBE dejar idénticos `precios_actuales` e historial. Además:
  - un salto de más de 35 % queda con `revisar = true`;
  - una tienda con 0 hallazgos queda en `fallo`.

**9. Alertas y correo.**
- **Hacer:** `alertas-usuario.ts` y `correo.ts` (transporte inyectable; en las pruebas, `jsonTransport`).
- **Hecho cuando:**
  - una lista con un producto ≥10 % más barato en otra tienda genera exactamente 1 `mas_barato`, aunque la corrida se repita;
  - una tienda en `fallo` produce exactamente 1 correo.

**10. Workflow.**
- **Hacer:** `.github/workflows/corrida.yml` (sección 6).
- **Hecho cuando:** `grep -q '17 11 \* \* \*' .github/workflows/corrida.yml && grep -q workflow_dispatch .github/workflows/corrida.yml` sale con 0.

**11. Base web.**
- **Hacer:** `src/lib/supabase/{server,client}.ts` (`getAll`/`setAll`), `src/proxy.ts` con `getClaims()`, el layout con encabezado de frescura y banner, y el `/api/salud` real.
- **Hecho cuando:** `pnpm build && pnpm humo --ruta api/salud --contiene ultimaCorrida` sale con 0.

**12. Catálogo.**
- **Hacer:** `/` y `/antojos`: búsqueda, chips, tarjetas con etiquetas, stepper y carrito (localStorage), con las animaciones 1, 2, 3, 6 y 8.
- **Hecho cuando:** `pnpm build && pnpm humo --contiene "Canasta familiar"` sale con 0.

**13. Detalle, fluctuación y gráficos.**
- **Hacer:** `/producto/[id]` como hoja, la sección "En fluctuación" y los 3 gráficos, con las animaciones 4 y 5.
- **Hecho cuando:** `pnpm humo --ruta producto/aceite --contiene "Aceite"` sale con 0.

**14. Auth y notificaciones.**
- **Hacer (auth):** `/registro`, `/ingresar`, `/recuperar` y salir; guardar la lista en `listas` y fusionarla con la local.
- **Hacer (sistema de notificaciones):**
  - Instalar `react-hot-toast@2.6.1` (sección 2). Un único `<Toaster>` en `src/app/layout.tsx`, desde `src/components/avisos/toaster.tsx` (`"use client"`).
  - Posición `top-center`, porque abajo está la barra del carrito. Máximo 3 visibles; cada aviso lleva `id` = su clave para no repetirse.
  - Duración: éxito e info 4 s, aviso 6 s, error 8 s. Los que tienen acción ("Deshacer", "Ver") duran 6 s como mínimo.
  - Estilo solo con tokens: `bg-card`, `text-foreground`, borde `border` y un acento de color por tipo (éxito `save`, aviso `warn`, error `up`, info `anot`). Nunca hex.
  - Con `prefers-reduced-motion: reduce`, sin animación de entrada ni de salida.
  - Accesibilidad: `role="status"` con `aria-live="polite"` (lo trae la librería) y `aria-live="assertive"` para los errores. Las acciones son botones reales que se alcanzan con teclado.
  - **Un toast nunca es el único lugar de la información:** lo que avisa también se ve en la página (encabezado, banner, `/alertas`, estado del botón o error junto al campo del formulario).
  - `src/lib/avisos.ts` contiene el catálogo único `AVISOS` (clave → tipo y texto) y `avisar(clave, datos?)`. Ningún componente escribe textos de toast sueltos.
- **Catálogo de avisos.** Los pasos 16–33 usan las claves de su fila; si hace falta un aviso nuevo, se agrega aquí primero.

  | Clave | Cuándo | Tipo | Texto |
  |---|---|---|---|
  | `sesion_iniciada` | Ingreso correcto | éxito | "Hola de nuevo." |
  | `registro_ok` | Registro enviado | éxito | "Cuenta creada. Revisa tu correo para confirmarla." |
  | `credenciales_malas` | Ingreso rechazado (también va junto al formulario) | error | "Correo o contraseña incorrectos." |
  | `recuperar_enviado` | Recuperar contraseña | info | "Si el correo está registrado, te enviamos un enlace." |
  | `clave_cambiada` | Nueva contraseña guardada | éxito | "Contraseña actualizada." |
  | `sesion_cerrada` | Salir | info | "Sesión cerrada. Tu lista queda en este dispositivo." |
  | `pdf_no_generado` | "Descargar PDF" falla (paso 25) | error | "No se pudo crear el PDF. Intenta de nuevo." |
  | `correo_confirmado` | `/auth/confirmar` con `type=signup` (paso 26; también en `AVISOS_DE_URL`) | éxito | "Correo confirmado. Ya tienes tu cuenta lista." |
  | `sesion_no_cerrada` | Salir falla (paso 23) | error | "No se pudo cerrar la sesión. Intenta de nuevo." |
  | `sesion_expirada` | Una server action responde sin sesión | aviso | "Tu sesión expiró. Inicia sesión de nuevo." |
  | `lista_fusionada` | Al iniciar sesión con lista local no vacía | éxito | "Unimos la lista de este dispositivo con la guardada ({n} productos)." |
  | `lista_no_guardada` | Falla la server action de `listas` | error | "No se pudo guardar tu lista. Sigue en este dispositivo y se reintenta con el próximo cambio." |
  | `almacenamiento_no_disponible` | `localStorage` lanza (una vez por sesión del navegador) | aviso | "Este navegador no deja guardar la lista. Inicia sesión para no perderla." |
  | `lista_vaciada` | Vaciar la lista | info + "Deshacer" | "Lista vaciada." |
  | `datos_viejos` | Resumen del día, corrida de más de 26 h | aviso | "Los precios son de {cuando}. Pueden estar desactualizados." |
  | `fuentes_caidas` | Resumen del día, fuentes caídas | aviso | "Sin datos recientes de: {tiendas}." |
  | `resumen_alertas` | Resumen del día con más de 3 alertas | info + "Ver" | "Tienes {n} alertas más." |
  | `actualizacion_iniciada` | Se lanzó la corrida | info | "Actualizando precios. Puedes seguir usando la app; te avisamos al terminar." |
  | `actualizacion_en_curso` | Ya había una corrida en curso | info | "Ya hay una actualización en curso; te avisamos al terminar." |
  | `actualizacion_no_necesaria` | El servidor ve datos frescos | info | "Los precios ya están al día." |
  | `actualizacion_ok` | Terminó con todas las fuentes OK | éxito | "Precios actualizados: {ok}/{total} fuentes OK." |
  | `actualizacion_parcial` | Terminó con fuentes caídas | aviso | "Precios actualizados, pero sin datos de: {tiendas}." |
  | `actualizacion_fallo` | GitHub no aceptó el disparo o falta el token | error | "No se pudo iniciar la actualización. Intenta más tarde." |
  | `actualizacion_tarda` | 20 min sin una corrida nueva | error | "La actualización no terminó en 20 minutos. Si falló, el admin recibe un correo." |
  | `alerta_nueva` | Llega una alerta por Realtime (paso 17; junto con la animación 7) | info + "Ver" | El `mensaje` de la alerta |
  | `preferencias_guardadas` | Umbral de ahorro guardado (paso 17) | éxito | "Preferencias guardadas." |
  | `anotado_guardado` | Server action de anotados correcta (paso 16) | éxito | "Precio anotado: {precio} en {tienda}." |
  | `anotado_invalido` | zod rechaza el precio (también junto al campo) | error | "El precio debe ser un entero entre 100 y 10.000.000." |
  | `anotar_sin_sesion` | Intentar anotar sin sesión | info + "Ingresar" | "Inicia sesión para anotar precios." |
  | `plan_usado` | "Usar como mi lista" (paso 18) | info + "Deshacer" | "Tu lista ahora es el plan {plan} ({n} productos)." |
  | `plan_sumado` | "Sumar a mi lista" (paso 18) | éxito | "Sumamos {n} productos del plan {plan} a tu lista." |
  | `sin_conexion` | Una server action o un `fetch` falla por red | error | "Sin conexión. Revisa tu internet e intenta de nuevo." |
  | `precio_corregido` | Corrección guardada desde la tarjeta o `/anotados` (paso 27) | éxito | "Precio corregido: {precio} en {tienda}." |
  | `correccion_quitada` | Se quitó una corrección propia (paso 27) | info + "Deshacer" | "Corrección quitada. Vuelve el precio automático." |
  | `correccion_ajena` | Se intenta quitar una corrección de otra persona | aviso | "Esa corrección la hizo otra persona; solo ella puede quitarla." |
  | `lista_guardada` | Se guarda la lista con nombre (paso 28) | éxito + "Ver" | "Lista guardada: {nombre} ({n} productos)." |
  | `lista_cargada` | Se carga una lista guardada | info + "Deshacer" | "Cargamos {nombre} en tu lista ({n} productos)." |
  | `lista_sumada` | Se suma una lista guardada a la activa | éxito + "Deshacer" | "Sumamos {n} productos de {nombre}." |
  | `lista_renombrada` | Renombrar una lista guardada | éxito | "Lista renombrada: {nombre}." |
  | `lista_duplicada` | Duplicar una lista guardada | éxito | "Copia creada: {nombre}." |
  | `lista_eliminada` | Eliminar una lista guardada | info + "Deshacer" | "Eliminamos {nombre}." |
  | `listas_fusionadas` | Al iniciar sesión con listas locales | éxito | "Unimos {n} listas de este dispositivo con tu cuenta." |
  | `limite_listas` | Ya hay 20 listas guardadas | aviso | "Llegaste al límite de 20 listas. Elimina una para guardar otra." |
  | `nombre_repetido` | El nombre ya existe (también junto al campo) | error | "Ya tienes una lista con ese nombre." |
  | `plan_no_guardado` | Falla la server action del plan (paso 29) | error | "No se pudo guardar el plan. Sigue en este dispositivo y se reintenta." |
  | `plan_fusionado` | Al iniciar sesión con un plan local | éxito | "Unimos tu plan {plan} de este dispositivo con tu cuenta." |
  | `plan_restaurado` | Se descartó el plan de la nube a favor del local | info + "Deshacer" | "Restauramos el plan {plan} que tenías en este dispositivo." |
  | `barrio_sin_precio` | Se intenta guardar la lista con productos de barrio sin precio (paso 32) | aviso | "Los productos de barrio sin precio no entran en el total. Anótalos en /anotados/barrio." |
  | `barrio_producto_agregado` | Se agrega un producto al catálogo de barrio | éxito | "Agregamos {producto} al catálogo de barrio." |
  | `barrio_producto_quitado` | Se desactiva un producto del catálogo de barrio | info + "Deshacer" | "Quitamos {producto} del catálogo de barrio." |
  | `tutorial_reiniciado` | "Reiniciar tutorial" en el menú de la bombilla (paso 33) | info | "Tutorial reiniciado. Volverá a aparecer cuando entres." |

  Agregar o quitar un producto con el stepper **no** genera toast: ya lo comunican la animación 1 y el contador, y un toast por clic sería ruido.
- **Resumen del día** (`src/components/avisos/resumen-del-dia.tsx`, montado en el layout):
  - Sale una vez por día y por dispositivo. La clave `mercado-medellin:resumen` guarda `hoyBogota()`; se lee y se escribe dentro de try/catch, y si falla no se muestra (mejor nada que repetirlo en cada carga).
  - **Con sesión:** las alertas no leídas de hoy del usuario, ordenadas con `ordenarAlertas`; un toast `alerta_nueva` por cada una hasta 3 y, si hay más, `resumen_alertas` con el resto. Mientras no exista `/alertas` (paso 17), la acción "Ver" no se muestra.
  - **Sin sesión, o con sesión y sin alertas:** `datos_viejos` si la corrida tiene más de 26 h y `fuentes_caidas` si hay fuentes caídas.
  - Si todo está bien, no sale nada.
- **Botón "Actualizar precios"** (`src/components/avisos/actualizar-precios.tsx`, dentro del banner rojo del encabezado):
  - **Visible solo** con la misma regla del banner: `horasDesdeCorrida > 26` o ninguna corrida. Sin sesión dice "Inicia sesión para actualizar" y lleva a `/ingresar`, porque disparar la corrida exige sesión.
  - **No bloquea la app:** sin overlay ni modal. Al pulsarlo, el propio botón queda `disabled` con `aria-busy="true"`, un spinner y el texto "Actualizando… puede tardar unos minutos". El resto de la app sigue usable.
  - **El estado sobrevive** a navegar (vive en el layout) y a recargar: se guarda la hora de inicio y la `ultimaCorrida` de partida en `sessionStorage`, siempre en try/catch.
  - **Servidor:** la server action `actualizarPrecios()` en `src/app/acciones.ts` hace, en orden:
    1. Exige sesión con `getClaims()`; sin sesión → `sesion_expirada`.
    2. Vuelve a calcular `frescura()`; si los datos ya están frescos, responde `actualizacion_no_necesaria` sin llamar a GitHub.
    3. Llama a `dispararCorrida()` de `src/lib/github.ts`, que primero consulta `GET /repos/{GITHUB_REPO}/actions/workflows/corrida.yml/runs` con `status=queued` y luego con `status=in_progress`. Si alguna tiene corridas, no dispara otra y responde `{ ok: true, enCurso: true }`. Si no hay ninguna, hace `POST .../dispatches` con `{ "ref": "main" }` y espera 204.
    4. Responde `{ ok: true, enCurso: boolean, desde: ultimaCorrida } | { ok: false, error: string }`.

    `dispararCorrida` recibe `fetch`, el token y el repo por parámetro, para probarla sin red. La concurrencia del workflow (`group: corrida`) es la segunda barrera contra corridas dobles.
  - **Seguimiento en el cliente:** consulta `/api/salud` cada 20 s y solo con la pestaña visible (con `visibilitychange` se pausa al ocultarla).
    - Termina cuando `ultimaCorrida` es posterior a `desde`. Entonces muestra `actualizacion_ok` o `actualizacion_parcial` (según `fuentesOk`), llama a `router.refresh()` y el botón desaparece si ya no aplica.
    - Si pasan 20 min sin una corrida nueva, muestra `actualizacion_tarda` y el botón vuelve a habilitarse.
    - Si el servidor responde `ok: false`, muestra `actualizacion_fallo` y el botón vuelve a habilitarse.
- **Hecho cuando:**
  - Pasa el e2e `tests/e2e/lista.spec.ts`: registrarse → agregar 2 productos → recargar → siguen ahí. Además, al iniciar sesión con una lista local, aparece el toast `lista_fusionada` (se busca por `role="status"`).
  - Pasa `tests/unit/avisos.test.ts`:
    - `debeResumir(ultimo, hoy)` es `true` solo la primera vez del día.
    - `seleccionarResumen(alertas)` devuelve como máximo 3 `alerta_nueva` más 1 `resumen_alertas` con el resto.
    - `siguienteEstado` del seguimiento termina en `ok` cuando cambia `ultimaCorrida` y en `tarda` a los 20 min.
    - Toda clave de `AVISOS` tiene tipo y texto no vacíos.
  - Pasa `tests/unit/github.test.ts`, con un `fetch` falso:
    - Una corrida `queued` o `in_progress` → 0 `POST`.
    - Ninguna corrida → exactamente 1 `POST` a `dispatches` con `ref: "main"`.
    - Una respuesta distinta de 204 → `{ ok: false }`.
    - Sin token → `{ ok: false }` sin llamar a `fetch`.

**15. Responsive móvil y tableta, con deslizadores.**
- **Hacer:**
  - **Puntos de quiebre:** móvil < 640 px, tableta 640–1023 px y escritorio ≥ 1024 px.
    - Rejilla del catálogo: 2 columnas en móvil, 3 en tableta y 3 en escritorio. Con el carrito lateral la columna del catálogo mide como máximo 756 px, así que no hay 4 columnas.
    - El carrito lateral sticky de 340 px empieza en 1024 px. En tableta y móvil va la barra inferior con su hoja.
    - Actualizar la fila **Grilla catálogo** de `CLAUDE.md` con estos valores.
  - **Deslizador** `src/components/deslizador.tsx` (`"use client"`), una fila horizontal reutilizable:
    - Desplazamiento con `scroll-snap` y barra de desplazamiento oculta.
    - Un degradado en cada borde que aparece solo cuando hay más contenido hacia ese lado. Se calcula con la posición del scroll y un `ResizeObserver`.
    - Flechas ‹ › que solo se ven con puntero fino (`@media (hover: hover) and (pointer: fine)`) y avanzan el 80 % del ancho. En pantallas táctiles se desliza con el dedo.
    - Al recibir foco con el teclado, cada opción hace `scrollIntoView({ inline: "nearest" })`.
    - Con `prefers-reduced-motion`, el desplazamiento es instantáneo.
  - **Usan el deslizador:** los chips de grupo, los chips de tienda, las pestañas (la activa se centra al cargar), "En fluctuación" y, en los pasos siguientes, los chips de planes y las pestañas de gráficos.
  - **Encabezado compacto en móvil:** una sola línea con "Actualizado …", los puntos y "X/3 fuentes OK". La lista "Sin datos recientes" va plegada en un `<details>` ("Ver fuentes"). El banner rojo se acorta a "Precios de hace {n} días" con el botón del paso 14.
  - **Objetivos táctiles:** con `pointer: coarse`, todo control mide al menos 44 × 44 px (stepper, chips, "Cerrar", pestañas). Con puntero fino basta el mínimo de WCAG 2.5.8 (24 px).
  - **iPhone y Android con muesca:** `viewport-fit=cover` (export `viewport` del layout). La barra del carrito y las hojas suman `env(safe-area-inset-bottom)` a su padding inferior, y el contenido deja espacio para la barra.
  - **Formularios:** los `input` usan `font-size` ≥ 16 px en móvil para que iOS no haga zoom al enfocarlos. Esto aplica a la búsqueda y a los formularios de los pasos 14 y 16.
  - **Hojas:** en móvil apaisado (alto < 500 px) la hoja usa `max-h-[96vh]`. En tableta y escritorio queda centrada con un ancho máximo de 560 px.
  - **Carrito en móvil:** el botón "Ver lista" se integra en la barra (toda la barra abre la hoja) en lugar de ocupar una fila aparte.
  - **Tablas anchas** (anotados, paso 16): desplazamiento horizontal dentro de su contenedor, con la primera columna (producto) fija.
- **Hecho cuando:** pasa el e2e `tests/e2e/responsive.spec.ts` en tres viewports: 360 × 740 táctil (`hasTouch`, `isMobile`), 768 × 1024 táctil y 1280 × 800 con ratón. Debe comprobar:
  - En los tres, `/` y `/antojos` no tienen desplazamiento horizontal (`scrollWidth <= innerWidth`).
  - La rejilla tiene 2, 3 y 3 columnas respectivamente.
  - Las flechas del deslizador se ven solo en 1280 × 800, y pulsar › varias veces deja visible el último chip de tiendas.
  - En los viewports táctiles, todo botón o enlace visible mide al menos 44 px de alto.
  - La búsqueda tiene `font-size` ≥ 16 px en 360 × 740.

**16. Anotados.**
- **Hacer:** `/anotados` con la tabla editable y la server action. Avisos `anotado_guardado`, `anotado_invalido` y `anotar_sin_sesion` del catálogo del paso 14.
- **Hecho cuando:** pasa el e2e `tests/e2e/anotados.spec.ts`: anotar un precio menor y más reciente → aparece en azul y reemplaza al automático en `/`.

**17. Alertas en la web.**
- **Hacer:** `/alertas`, la campana con Realtime (animación 7) y el umbral de ahorro. Cada alerta que llega por Realtime muestra `alerta_nueva` con "Ver" → `/alertas`; guardar el umbral muestra `preferencias_guardadas`. Desde aquí, la acción "Ver" del resumen del día se activa.
- **Hecho cuando:** pasa la prueba de integración: insertar una alerta para el usuario la muestra en `/alertas`.

**18. Hogar y Dieta.**
- **Hacer:** `src/data/planes.ts`, `/hogar` y `/dieta`. Avisos `plan_usado` (con "Deshacer", que restaura la lista anterior) y `plan_sumado`.
- **Hecho así (27-oct-2026):** `aplicarPlan` (`src/lib/precios/planes.ts`, pura) sube las cantidades fraccionarias al entero siguiente y omite ids que no estén en el catálogo. `/hogar` compara la lista (óptimo dividido) con el presupuesto por rubro. Los KPIs calculados de `/dieta` (`dietaKpis` del artifact) no se portaron; las tablas fijas sí.
- **Hecho cuando:** CUANDO se pulsa "Usar como mi lista" en `/hogar`, EL SISTEMA DEBE cargar los 28 ítems de `PLANES.hogar` (es el conteo del archivo origen).

**19. Calidad.**
- **Hacer:** `tests/e2e/publico.spec.ts` (sin sesión se ven precios) y axe en `/`, `/anotados` y `/hogar`.
- **Hecho cuando:** CUANDO corre `pnpm test:e2e`, EL SISTEMA DEBE salir con 0 y sin violaciones `serious` ni `critical`.

**20. Quitar Solofruver.** *(decisión del 27-oct-2026: la tienda se descarta)*
- **Hacer:**
  - Migración nueva `supabase/migrations/<ts>_quitar_solofruver.sql` que borra, en este orden, las filas de `solofruver` en `anotados`, `precios_actuales`, `precios_historial`, `producto_fuente` y `tiendas` (sin tocar migraciones ya aplicadas). Si alguna FK impide el orden, usar `on delete cascade` solo en esa migración.
  - `scripts/migrar.ts` y `data/origen/*`: dejar de cargar `solofruver`. El conteo del paso 3 pasa a `tiendas=9` y sale de restar la tienda al JSON de origen, no de un número escrito a mano.
  - Quitar Solofruver de §1 y de `decisiones.md` (lista de 10 tiendas y colores), `README.md` (tabla de fuentes), `CLAUDE.md` si la menciona, `sql-nube/02_catalogo.sql` y los fixtures/pruebas que la citen. `grep -ril solofruver` debe dar vacío fuera de `.git` y de las migraciones históricas.
  - La única tienda manual que queda es Tienda/Carnicería de barrio (más las que el paso 21 deje como anotados).
- **Hecho cuando:** CUANDO corre `pnpm exec supabase db reset && pnpm migrar`, EL SISTEMA DEBE imprimir `tiendas=9` y salir con 0; `/anotados` ya no muestra la columna Solofruver; `pnpm exec supabase test db` y el gate siguen en verde.

**21. Nuevas fuentes: La Vaquita Mercados y La Mayorista Medellín.**
- **Antes de codificar (sin esta confirmación no se sigue):**
  - La Vaquita Mercados: tienda online `https://vaquitaexpress.com.co/` (sin el parámetro `srsltid`). La Mayorista Medellín: `https://lamayorista.com.co/`.
  - Por cada una: leer `robots.txt`, identificar la plataforma (VTEX, Shopify, WooCommerce, propia), comprobar si el precio sale en el HTML o en un JSON público y si el catálogo cubre los productos del mercado. Registrar el resultado en `decisiones.md` con la fecha.
- **Hacer, según el resultado (por tienda):**
  - **Permite consulta y trae el precio:** adaptador `src/corrida/adaptadores/<id>.ts` (si es VTEX, reutilizar `vtex.ts` con el host; si no, uno nuevo con cheerio), fixtures reales con `pnpm capturar <id>`, entrada en `ADAPTADORES`, en el seed de `tiendas` (id, nombre, color nuevo con contraste ≥3:1 en claro y oscuro) y mapeo de `producto_fuente` solo para los productos que realmente encuentre. Respeta el innegociable 3 (≥1 s entre peticiones, User-Agent propio, sin saltar captchas).
  - **Lo prohíbe o la tienda no tiene precios públicos:** queda como tienda `manual` (solo anotados), igual que PriceSmart, y el motivo se escribe en `decisiones.md`.
  - En ambos casos: migración que inserta la tienda; el contador del encabezado "X/N fuentes OK" cuenta solo las automáticas.
- **Resultado (27-oct-2026):**
  - **La Vaquita: automática.** Magento; el `robots.txt` solo prohíbe la búsqueda, el carrito y los parámetros, no las páginas de producto. Adaptador `vaquita.ts` (ld+json), 40 productos mapeados a mano en `data/fuentes/vaquita.json` (sembrados por `pnpm migrar`; la tienda entra por la migración `20261027150000_tienda_vaquita.sql`). Frutas, verduras y cortes por kilo con presentación ambigua quedan sin mapear. Comprobación contra el sitio real: 40/40 con precio.
  - **La Mayorista Medellín: pendiente de decisión del usuario.** `lamayorista.com.co` es el sitio institucional de la Central Mayorista (WordPress), sin tienda ni precios. Los precios están en `precios.lamayorista.com.co`, un panel (SPA) que lee de una API interna (`lm-analytics.netstat.tech`) con un `access_token`; no hay API ni documentación pública y su `robots.txt` no existe. No se consulta sin permiso expreso de la Central. Opciones: pedirles acceso/permiso, o dejarla como tienda manual (anotados).
- **Hecho cuando:**
  - CUANDO se sirven los fixtures reales, el adaptador devuelve precio y url, y `null` si no hay stock o la unidad no es convertible; la prueba comprueba con el `fetch` espía que no toca rutas prohibidas por robots. (Para una tienda manual: aparece como columna en `/anotados` y como chip de tienda.)
  - `pnpm migrar` imprime el nuevo conteo de tiendas y el gate pasa.

**22. Corregir el gráfico "Total por tienda".**
- **Qué falla (a confirmar al reproducirlo antes de tocar código):** en `graficos-lista.tsx` el gráfico siempre calcula con *todas* las tiendas y no recibe la tienda elegida en los chips del catálogo (ese estado vive dentro de `Catalogo`), así que al cambiar de tienda no cambia nada. Además filtra `faltantes.length === 0`: con tiendas de pocos precios (anotados, o las nuevas del paso 21) casi ninguna está completa y sale "Ninguna tienda tiene todos los productos". Con `isAnimationActive={false}` tampoco se nota cuando se actualiza.
- **Hacer:**
  - Subir la tienda elegida (o un conjunto de tiendas) a un estado compartido por `Catalogo` y `Carrito` y pasarlo a `GraficosLista`.
  - El gráfico muestra **todas las tiendas** (o solo las elegidas, si hay selección) con su total. Para las incompletas la barra llega hasta lo que sí tienen, tenue y con la etiqueta "faltan N"; las completas llevan el sello "tiene todo". La tienda elegida se resalta.
  - Reactivar la animación (animación 5) con duración 0 bajo `prefers-reduced-motion`; las barras se animan al cambiar los datos, no solo al montar.
  - La lógica va en una función pura de `src/lib/precios/lista.ts` con su prueba; el componente solo dibuja.
- **Hecho así (27-oct-2026):** `compararTiendas` (en `lista.ts`) devuelve todas las tiendas con precio de algo de la lista, completas primero. Con selección se **resalta** la elegida en vez de filtrar (una sola barra no compara nada). Las tiendas con productos faltantes se dibujan con rayas del color de la tienda; las de precios desactualizados (⏱) con opacidad tenue.
- **Hecho cuando:**
  - Prueba unitaria: con 3 tiendas (una completa, dos incompletas) la función devuelve las 3 con `faltantes` correctos, y filtrada por selección devuelve solo las elegidas.
  - E2E `tests/e2e/grafico-tiendas.spec.ts`: agregar productos, abrir gráficos y elegir otra tienda en los chips → cambian las barras visibles (se comprueba el `aria-label` y el número de barras).

**23. Animación del menú de cuenta (abrir y cerrar).**
- **Hacer:**
  - En `src/components/menu-cuenta.tsx`, animar el panel con `data-[state=open]` / `data-[state=closed]` (Radix mantiene el nodo montado hasta que termina la salida): entrada con `opacity 0→1`, `y −6→0` y `scale .96→1` en 160–220 ms con origen en el ícono; salida inversa en 120–160 ms. Solo `transform`/`opacity`, duración 0 con `prefers-reduced-motion`.
  - El ícono cambia de fondo con la misma curva que el panel.
  - "Cerrar sesión": el spinner reemplaza al ícono sin saltos de ancho; si la acción falla, el menú queda abierto y muestra el aviso de error del catálogo; si funciona, el panel se cierra con la animación de salida antes de redirigir.
- **Hecho cuando:** pasa el e2e `tests/e2e/menu-cuenta.spec.ts`: abrir → el panel es visible y con foco; `Escape` lo cierra y devuelve el foco al ícono; con `reducedMotion: "reduce"` aparece y desaparece sin transición; "Cerrar sesión" termina en `/` sin sesión.

**24. La lista: de un bloque largo a una vista compacta y por tienda.**
- **Criterio de diseño (UX):** un carrusel horizontal esconde ítems y es lento de revisar en una lista de compras. Lo que sí ayuda es agrupar como se compra, resumir arriba y permitir plegar. El deslizador del paso 15 se usa para los *selectores* (tiendas), no para los ítems.
- **Hacer:**
  - **Resumen fijo arriba** de la lista: total, ahorro dividiendo y n.º de productos, siempre visible (`sticky` dentro de la hoja o del aside).
  - **Control segmentado "Por tienda | Por grupo | Todo":**
    - *Por tienda* (por defecto, usa el óptimo dividido): una sección por tienda con su subtotal y sus productos ("Comprar en D1 · 6 productos · $48.200").
    - *Por grupo*: secciones por grupo (frescos, lácteos…).
    - *Todo*: la lista plana de hoy.
  - **Secciones plegables** (acordeón) con animación de altura GSAP (150–250 ms, `matchMedia`); la primera abierta y el resto plegadas si hay más de 12 ítems.
  - Si hay más de 4 tiendas, el selector de tienda usa el `Deslizador`.
  - **Altura máxima:** en escritorio el aside tiene `max-h` con desplazamiento interno propio. Cada fila ≤ 56 px y stepper de 44 px en táctil.
  - Partir en `lista-resumen.tsx`, `lista-seccion.tsx` y `lista-vista.tsx` para cumplir el límite de 250 líneas.
- **Hecho así (27-oct-2026):** `seccionar` (`src/lib/precios/secciones.ts`, pura) agrupa la lista; `lista-seccion.tsx` (acordeón con `plegar` de `animaciones.ts`), `lista-vista.tsx` y `lista-resumen.tsx` (solo en la hoja: en escritorio el total y el ahorro ya van fijos arriba del aside). No hay selector de tienda aparte —las secciones por tienda cumplen ese papel—, así que el `Deslizador` no hizo falta. Los nombres ocupan hasta 2 líneas.
- **Hecho cuando:** pasa el e2e `tests/e2e/lista-vista.spec.ts` con 15 productos de 3 tiendas: (1) "Por tienda" muestra 3 secciones con subtotales cuya suma es el total; (2) plegar una sección oculta sus filas y deja `aria-expanded="false"`; (3) cambiar a "Por grupo" y "Todo" conserva las cantidades; (4) el resumen sigue visible al desplazar la lista; (5) no hay desplazamiento horizontal en 360 px.

**25. Exportar la lista a PDF.**
- **Depende de:** pasos 21 y 24 (misma agrupación y mismas tiendas).
- **Hacer:**
  - Botón **"Descargar PDF"** debajo de la lista (visible solo con ≥1 producto), en `carrito.tsx` y en la hoja móvil.
  - Contenido: título "Lista de mercado", fecha (`hoyBogota()`) y una tabla por tienda del óptimo dividido con columnas **Producto · Cantidad · Precio unitario · Subtotal**, el subtotal por tienda y el total general al final. Los precios desactualizados o anotados llevan una marca (`*`) y una nota al pie; los productos sin precio van en una tabla aparte "Sin precio". Nunca se inventa un precio (regla 7).
  - Generación 100 % en el navegador con `jspdf` + `jspdf-autotable`, cargados con `import()` dinámico solo al pulsar. **Dependencia nueva:** se agrega a §2 y a la lista permitida de la regla 9, con versión verificada contra npm (usar el `stack-researcher`) antes de instalarla. Las filas se arman en una función pura `src/lib/precios/exportar.ts` (sin React ni jsPDF) con su prueba.
  - Nombre del archivo: `lista-mercado-<aaaa-mm-dd>.pdf`; las tildes, la ñ y el `$` salen bien (formato `pesos()`).
- **Hecho así (27-oct-2026):** `jspdf` **4.2.1** y `jspdf-autotable` **5.0.8** (exactas; la 5.0.9 tenía 12 días), sin vulnerabilidades en `pnpm audit --prod`. `datosPdf` (`src/lib/precios/exportar.ts`) arma tablas por tienda del óptimo dividido, con `*` en precios anotados o desactualizados y los sin precio aparte; `descargar-pdf.tsx` va dentro de `ListaVista` (aside y hoja). Los colores del PDF son RGB fijos (el PDF no lee `var(--token)`).
- **Hecho cuando:**
  - `tests/unit/exportar.test.ts`: dada una lista y precios, la función devuelve las filas por tienda con subtotales y total correctos, marca los anotados y desactualizados, y separa los "sin precio".
  - E2E `tests/e2e/pdf.spec.ts`: con 3 productos, pulsar "Descargar PDF" dispara una descarga cuyo nombre cumple `lista-mercado-\d{4}-\d{2}-\d{2}\.pdf` y el archivo empieza con `%PDF`.

**26. Correos de confirmación y de recuperar contraseña: enlaces a localhost y página rota.** *(reportado el 27-oct-2026)*
- **Síntoma:** Supabase pide confirmar el correo y el correo llega, pero su enlace abre `localhost` y la página no carga. Se espera lo mismo en "olvidé mi contraseña". El código de la app ya existe (`registrar`, `recuperar`, `nuevaClave` en `src/app/auth/acciones.ts`, `src/app/auth/confirmar/route.ts`, `/nueva-clave`), así que el fallo está en la configuración, en cómo se arma el enlace o en el flujo entre navegadores.
- **Causas probables (confirmar en este orden antes de tocar código):**
  1. **Site URL sin configurar** en el proyecto de Supabase en la nube: por defecto es `http://localhost:3000`, y Supabase la usa cuando el `emailRedirectTo` / `redirectTo` que manda la app no está en la lista de Redirect URLs. El §11.2 lo pide, pero es un paso manual.
  2. **Cuenta creada desde `localhost`:** `origen()` arma el enlace con la cabecera `Origin`/`Host` de la petición; si se registró desde `pnpm dev`, el enlace apunta a localhost aunque el proyecto sea el de la nube.
  3. **PKCE:** el enlace con `?code=` solo sirve en el mismo navegador donde se pidió. Abierto desde el celular o desde otro navegador, `exchangeCodeForSession` falla y la ruta manda a `/ingresar?error=enlace`.
  4. **Nunca se probó de punta a punta:** en local `enable_confirmations = false`, y ningún e2e cubre confirmar ni recuperar.
- **Hacer:**
  - **Reproducir primero:** ¿la cuenta se creó en local o en producción? ¿Qué trae el enlace del correo (el parámetro `redirect_to=`)? Anotar el resultado en `decisiones.md`.
  - **Configurar Auth del proyecto:** *Site URL* = dominio de Vercel; *Redirect URLs* = `https://<dominio>/**` y `http://localhost:3000/**`.
  - **Plantillas de correo propias** (Confirm signup y Reset password) que enlacen directo a la app con `token_hash`, en vez del enlace de Supabase: `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=signup` y `...&type=recovery&siguiente=/nueva-clave`. Eso usa `verifyOtp` (ya soportado en `route.ts`), no depende de PKCE y funciona abierto desde otro navegador o dispositivo. Versionarlas en `supabase/templates/` y registrarlas en `config.toml` (`[auth.email.template.*]`); en producción se pegan en el panel de Auth.
  - **De dónde sale el dominio del enlace:** decidir entre (a) `{{ .SiteURL }}` en la plantilla y quitar la dependencia de las cabeceras, o (b) una variable `NEXT_PUBLIC_SITE_URL` (si se elige, documentarla en `CLAUDE.md` y en `.env.example`).
  - **Mensajes de error útiles:** distinguir enlace vencido, enlace ya usado y "ábrelo en el mismo navegador"; botón "Reenviar correo" en `/ingresar`. `/nueva-clave` sin sesión explica qué pasó y lleva a `/recuperar`. Al confirmar el registro, abrir la sesión y avisar (aviso nuevo `correo_confirmado` en el catálogo del paso 14).
  - **Probar en local de punta a punta** con el buzón de Supabase local (Mailpit, http://127.0.0.1:54324, vía su API). No se activa `enable_confirmations` global, porque los e2e actuales asumen que el registro entra directo.
- **Hecho cuando:**
  - Pasa un e2e de recuperación: registrarse → cerrar sesión → pedir recuperar → leer el correo en Mailpit → abrir el enlace → escribir la nueva contraseña → ingresar con ella. El enlace del correo empieza por la Site URL configurada y trae `token_hash`.
  - Pasa un e2e de confirmación sobre `/auth/confirmar`: un `token_hash` válido (generado con `auth.admin.generateLink`) deja sesión abierta; uno inválido o ya usado va a `/ingresar?error=enlace` con su mensaje.
  - **Comprobación manual en producción** (se agrega al §11): registrarse con un correo real, abrir el enlace **desde el celular** y entrar; repetir con "olvidé mi contraseña".
- **Hecho así (27-oct-2026):** la causa más probable, confirmada con el usuario (se registró desde la app de Vercel, no desde localhost), es la 1: Supabase ignora el `redirectTo` si no está en las Redirect URLs y usa el Site URL, que por defecto es `localhost`. **Eso solo se arregla en el panel de Supabase de producción (manual, ver §11.2).** En el código: plantillas `supabase/templates/confirmacion.html` y `recuperacion.html` con `{{ .RedirectTo }}&token_hash=…&type=…` (la dirección la pide la app y Supabase la valida; no se usa `{{ .SiteURL }}` porque en local el servidor de los e2e está en otro puerto); `config.toml` registra las plantillas y las Redirect URLs locales (3000 y 3100); `/auth/confirmar` redirige con el `Host` real de la petición (con `nextUrl.origin` la cookie de sesión se perdía al cambiar de host), distingue `enlace` de `navegador` y avisa `correo_confirmado`; `/nueva-clave` sin sesión explica qué hacer. El relleno de `Suspense` de `/ingresar` y `/nueva-clave` ya no es un formulario. **No se hizo** el botón "Reenviar correo": hoy se pide uno nuevo desde `/recuperar`.
- **Dependencias nuevas:** ninguna.

**27. Precio corregido a mano.**
- **Depende de:** pasos 12 (tarjeta del catálogo), 14 (avisos) y 16 (`/anotados`).
- **Migración nueva `supabase/migrations/<ts>_precios_manuales.sql`:**

  ```sql
  create table precios_manuales_historial (
    id bigserial primary key,
    producto_id text not null references productos,
    tienda_id text not null references tiendas,
    precio integer not null check (precio between 100 and 10000000),
    fecha date not null default (now() at time zone 'America/Bogota')::date,
    autor uuid references auth.users default auth.uid(),
    creado timestamptz not null default now(),
    unique (producto_id, tienda_id, fecha)
  );
  create index on precios_manuales_historial (producto_id, fecha desc, tienda_id);

  alter table precios_manuales_historial enable row level security;
  create policy leer on precios_manuales_historial for select using (true);
  create policy crear on precios_manuales_historial for insert to authenticated
    with check (autor = auth.uid());
  create policy borrar on precios_manuales_historial for delete to authenticated
    using (autor = auth.uid() and fecha = (now() at time zone 'America/Bogota')::date);
  revoke all on precios_manuales_historial from anon, authenticated;
  grant select on precios_manuales_historial to anon, authenticated;
  grant insert, delete on precios_manuales_historial to authenticated;
  grant usage on sequence precios_manuales_historial_id_seq to authenticated;

  create function corregir_precio(p_producto text, p_tienda text, p_precio integer)
  returns void language plpgsql security invoker set search_path = public as $$
  declare hoy date := (now() at time zone 'America/Bogota')::date;
  begin
    if auth.uid() is null then raise exception 'sin_sesion'; end if;
    if p_precio is null or p_precio not between 100 and 10000000 then
      raise exception 'precio_invalido';
    end if;
    insert into anotados (producto_id, tienda_id, precio, fecha, autor)
      values (p_producto, p_tienda, p_precio, hoy, auth.uid())
      on conflict (producto_id, tienda_id) do update
        set precio = excluded.precio, fecha = excluded.fecha, autor = excluded.autor;
    insert into precios_manuales_historial (producto_id, tienda_id, precio, fecha, autor)
      values (p_producto, p_tienda, p_precio, hoy, auth.uid())
      on conflict (producto_id, tienda_id, fecha) do update
        set precio = excluded.precio, autor = excluded.autor, creado = now();
  end $$;
  revoke all on function corregir_precio(text, text, integer) from public, anon;
  grant execute on function corregir_precio(text, text, integer) to authenticated;

  -- Quitar una corrección propia: borra el anotado y la fila de hoy del historial.
  -- Devuelve false si el anotado no era del usuario (otra persona la corrigió).
  create function quitar_correccion(p_producto text, p_tienda text)
  returns boolean language plpgsql security invoker set search_path = public as $$
  declare n int;
  begin
    if auth.uid() is null then raise exception 'sin_sesion'; end if;
    delete from anotados
      where producto_id = p_producto and tienda_id = p_tienda and autor = auth.uid();
    get diagnostics n = row_count;
    if n = 0 then return false; end if;
    delete from precios_manuales_historial
      where producto_id = p_producto and tienda_id = p_tienda
        and fecha = (now() at time zone 'America/Bogota')::date and autor = auth.uid();
    return true;
  end $$;
  revoke all on function quitar_correccion(text, text) from public, anon;
  grant execute on function quitar_correccion(text, text) to authenticated;
  ```

  `security invoker` para que la RLS de `anotados` siga mandando. `precio_efectivo` no se toca: el anotado ya gana por la regla de §5.
- **Hacer:**
  - `anotar` en `src/app/anotados/acciones.ts` llama `rpc("corregir_precio", …)` en vez del upsert directo; `quitarAnotado` llama `rpc("quitar_correccion", …)` y, si devuelve `false`, responde `ajeno` → `correccion_ajena`.
  - El `Datos` async de `src/components/catalogo/vista.tsx` suma `await usuario()` (de `src/lib/datos.ts`) y lo pasa por `Catalogo` hasta la tarjeta. En `tarjeta.tsx`, precio, tienda y etiquetas salen del `<Link>`; el ✎ es un `button` hermano que abre `src/components/precios/corregir-precio.tsx` (hoja de la animación 4, compartida con `/anotados`).
  - La tarjeta muestra "corregido a mano · {fecha}" cuando el estado efectivo es `anotado` (basta `precio_efectivo`, sin consultar el historial).
  - Sin sesión, el ✎ lleva a `/ingresar` y avisa `anotar_sin_sesion`. `/anotados` cambia `anotado_guardado` por `precio_corregido` (el mismo texto sirve para las dos entradas); se suman `correccion_quitada` y `correccion_ajena` del catálogo del paso 14.
  - `pnpm gen:tipos` después de la migración.
- **Hecho cuando:**
  - pgTAP (`supabase/tests/precios_manuales.test.sql`): `anon` no puede ejecutar `corregir_precio` ni insertar en la tabla; con sesión, corregir escribe una fila en `anotados` y otra en `precios_manuales_historial`, y `precio_efectivo` devuelve el precio manual; corregir dos veces el mismo día deja **una** fila con el último precio; `quitar_correccion` borra el anotado y la fila de hoy, conserva las de días anteriores y devuelve `false` si el anotado es de otra persona; el usuario A no puede borrar el anotado de B.
  - Pasa el e2e `tests/e2e/corregir-precio.spec.ts`: sin sesión el ✎ lleva a `/ingresar`; con sesión, corregir un precio cambia el total de la lista y muestra "corregido a mano"; quitarlo vuelve al automático y sale `correccion_quitada`.

**28. Listas de mercado guardadas.**
- **Depende de:** paso 24 (lista por tiendas) y paso 14 (avisos).
- **Migración nueva `supabase/migrations/<ts>_listas_guardadas.sql`:**

  ```sql
  create table listas_guardadas (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users on delete cascade,
    nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
    nombre_clave text generated always as (lower(btrim(nombre))) stored,
    items jsonb not null default '{}'
      check (jsonb_typeof(items) = 'object' and pg_column_size(items) <= 200000),
    tienda_preferida text references tiendas default 'd1',
    creada timestamptz not null default now(),
    actualizada timestamptz not null default now(),
    unique (user_id, nombre_clave)
  );
  alter table listas_guardadas enable row level security;
  create policy propia on listas_guardadas for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
  revoke all on listas_guardadas from anon, authenticated;
  grant select, insert, update, delete on listas_guardadas to authenticated;
  ```

  `nombre_clave` permite el `onConflict: "user_id,nombre_clave"` de PostgREST sin índice por expresión. Los topes de 20 listas y 200 ítems se validan en zod; la tabla solo acota el tamaño del JSON.
- **Hacer:**
  - `src/lib/listas/guardadas.ts` (pura): `normalizarNombre`, `fusionarListas(locales, nube)` por `nombre_clave` con gana la `actualizada` más reciente, `recortarALimite(20)`, `cargar` (reemplaza) y `sumar` (fusiona con `max`).
  - Clave local `mercado-medellin:listas` = `{ version: 1, listas: [...] }`, siempre en try/catch. Server actions `guardarLista`, `cargarLista`, `sumarLista`, `renombrarLista`, `duplicarLista`, `eliminarLista` en `src/app/listas/acciones.ts`, con zod (`nombre` 1–60, `items` record de ids conocidos con cantidad 1–999).
  - `src/components/listas/boton-guardar.tsx` (botón flotante de §7, animación 9) dentro de `lista-vista.tsx`, visible con ≥1 producto.
  - `/listas`: página con las tarjetas, las acciones y el estado vacío; sin sesión lee y escribe `localStorage`; con sesión, Supabase.
  - `src/components/avisos/sincronizar-listas.tsx` junto a `SincronizarLista` en `sesion.tsx`: fusiona al entrar y avisa `listas_fusionadas`. `datosSesion()` suma `listas` (nombre, items, tienda preferida y `actualizada`) y el componente las recibe por prop, igual que `guardada` hoy. Los avisos `lista_guardada`, `lista_cargada`, `lista_sumada`, `lista_renombrada`, `lista_duplicada`, `lista_eliminada`, `limite_listas` y `nombre_repetido` salen del catálogo del paso 14.
  - Exportar a JSON con `Blob` + `URL.createObjectURL` (`lista-mercado-<nombre>-<fecha>.json`), sin dependencia nueva.
- **Hecho cuando:**
  - `tests/unit/listas-guardadas.test.ts`: fusiona por nombre y gana la más reciente; conserva la local si el nombre no está en la nube; recorta a 20; `sumar` usa `max` y nunca baja una cantidad; `cargar` reemplaza la lista activa.
  - pgTAP: A no ve ni edita las listas de B; dos nombres que solo difieren en mayúsculas o espacios chocan; 61 caracteres se rechazan.
  - Pasa el e2e `tests/e2e/listas-guardadas.spec.ts`: sin sesión guardar 2 listas → recargar → siguen y cargarlas repone las cantidades; sumar no baja cantidades; al iniciar sesión aparece `listas_fusionadas` y las 2 siguen en `/listas`.

**29. Hogar y Dieta editables.**
- **Depende de:** paso 18 y del trabajo en curso de `src/components/planes/reparto-interactivo.tsx` (personas y aportantes con `mercado-medellin:reparto:{hogar|dieta}`). **Se extiende, no se reescribe:** ese componente pasa a recibir `config` y `onCambio` por props.
- **Migración nueva `supabase/migrations/<ts>_planes_usuario.sql`:**

  ```sql
  create table planes_usuario (
    user_id uuid not null references auth.users on delete cascade,
    tipo text not null check (tipo in ('hogar','dieta')),
    config jsonb not null,
    actualizada timestamptz not null default now(),
    primary key (user_id, tipo)
  );
  alter table planes_usuario enable row level security;
  create policy propia on planes_usuario for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
  revoke all on planes_usuario from anon, authenticated;
  grant select, insert, update, delete on planes_usuario to authenticated;
  ```

- **Hacer:**
  - `src/lib/planes/config.ts` (pura): `configPlan` en zod —`version: 1`, `personas` 1–20, `aportantes` 1–20 (solo hogar), `rubros` ≤50 claves con enteros 0–10.000.000, `items` ≤200 con cantidades 1–999, `propios` ≤50 `{nombre 1–60, precio 0–10.000.000}`, `nota` ≤1000, `actualizada` ISO—, más `fusionarPlan(local, nube)` y `planSugerido(tipo)` desde `src/data/planes.ts`. Versión distinta de 1 o JSON inválido → se descarta y se conserva el local.
  - `src/app/planes/acciones.ts`: `leerPlan(tipo)` y `guardarPlan(tipo, config)` (upsert `onConflict: "user_id,tipo"`). Error → `plan_no_guardado` y el estado sigue local. `/hogar` y `/dieta` leen el plan en el server (nueva función `planGuardado(tipo)` en `src/lib/datos.ts`, dentro del `Suspense`) y lo pasan como `config` inicial.
  - Clave local `mercado-medellin:plan:{hogar|dieta}`; al primer arranque se migra una vez lo de `mercado-medellin:reparto:{tipo}` y `mercado-medellin:presupuesto:{tipo}` (no se borran hasta que la migración termine).
  - Al entrar con sesión: gana la `actualizada` más reciente y lo reemplazado queda una semana en `mercado-medellin:plan:{tipo}:respaldo`. Si gana lo local, se sube y sale `plan_restaurado` con "Deshacer" (vuelve lo de la nube); si la nube estaba vacía, se sube lo local y sale `plan_fusionado`.
  - `/hogar` y `/dieta`: rubros editables, reparto, ítems con stepper, productos propios, nota, "Volver al sugerido" y la banda de estado de guardado (§7). Los rubros del plan no se mezclan con `presupuestos_mensuales` de `/presupuesto`; la UI lo dice.
- **Hecho cuando:**
  - `tests/unit/config-plan.test.ts`: rechaza `personas` 0 y 21, nota de 1001, 51 rubros, cantidad 1000 y `propios` de 51; `fusionarPlan` gana la más reciente y conserva el local si la nube viene vacía o corrupta.
  - pgTAP: A no lee ni escribe el plan de B; `tipo` fuera de `('hogar','dieta')` se rechaza.
  - Pasa el e2e `tests/e2e/planes-editables.spec.ts`: sin sesión, cambiar un rubro y recargar lo conserva; con sesión la banda dice "Guardado en tu cuenta"; con un local más nuevo que la nube aparece `plan_restaurado` y "Deshacer" repone el de la nube.

**30. Pronóstico a 7 días (frutas, verduras y tubérculos).**
- **Depende de:** pasos 27 (historial manual) y 7 (clima de SIPSA). **No agrega dependencias** (usa `exceljs` y Recharts que ya están).
- **Antes de codificar:** confirmar la URL del anexo mensual del IPC del DANE (variación de alimentos). Sin esa confirmación no se escribe `contexto.ts`; si la URL falla en la corrida, se conserva la última fila, se anota el motivo en `corridas.notas` y **nunca se inventa** un valor.
- **Migración nueva `supabase/migrations/<ts>_pronostico.sql`:**

  ```sql
  create table contexto_mercado (
    mes date primary key,                 -- primer día del mes
    ipc_alimentos numeric(6,2),           -- variación mensual, %
    ipc_alimentos_anual numeric(6,2),     -- variación anual, %
    fuente text not null default 'DANE',
    fuente_url text,
    actualizado timestamptz not null default now()
  );
  alter table contexto_mercado enable row level security;
  create policy leer on contexto_mercado for select using (true);
  revoke all on contexto_mercado from anon, authenticated;
  grant select on contexto_mercado to anon, authenticated;

  -- historial_minimo pasa a incluir las correcciones a mano (paso 27).
  create or replace view historial_minimo with (security_invoker = true) as
  select producto_id, fecha, min(precio) as precio
  from (
    select producto_id, fecha, precio from precios_historial where precio is not null
    union all
    select producto_id, fecha, precio from precios_manuales_historial
  ) s
  group by producto_id, fecha;

  -- 60 puntos por producto en una sola fila: reemplaza la consulta de 30 días de catalogo().
  create view serie_pronostico with (security_invoker = true) as
  with ultimos as (
    select producto_id, fecha, precio,
      row_number() over (partition by producto_id order by fecha desc) as n
    from historial_minimo
    where fecha >= (now() at time zone 'America/Bogota')::date - 90
  )
  select producto_id,
    jsonb_agg(jsonb_build_object('fecha', fecha, 'precio', precio) order by fecha) as puntos
  from ultimos where n <= 60
  group by producto_id;
  revoke all on serie_pronostico from anon, authenticated;
  grant select on serie_pronostico to anon, authenticated;
  ```

- **Hacer:**
  - `src/corrida/contexto.ts`: descarga el anexo del IPC de alimentos, lo lee con `exceljs` y hace upsert de los últimos 13 meses en `contexto_mercado`. Se llama desde `orquestador.ts` después de SIPSA y **antes** de insertar la fila de `corridas`, para que un fallo quede en el mismo `notas`. Un 404 o un HTML inesperado no rompe la corrida.
  - `src/lib/precios/pronostico.ts` (pura, sin red): `pronosticar(puntos, { clima, ipcMensual }, hoy)`:
    - Menos de 8 puntos en 60 días → `null`.
    - `sigma` = desviación de los log-retornos de los últimos 28 días (mínimo 0,005); `sigma7 = sigma × √7`.
    - Regresión logarítmica ponderada (peso `i+1`) sobre hasta 60 puntos → pendiente `b`; `tendencia = b × 7`; `momento = ln(último / promedio 7)`.
    - `derivaIPC = ipcMensual × 7 / 30 / 100`; `esperado = 0,6·tendencia + 0,4·momento + derivaIPC`; con días de clima `> 0` se multiplica `esperado` por 1,2 y `sigma7` por 1,15; `esperado` se acota a `ln 0,75 … ln 1,25`.
    - Probabilidades con CDF normal y umbral ±3 %: `sube` si el retorno esperado supera `ln 1,03`, `baja` si cae bajo `ln 0,97`, `estable` en medio; la elegida se acota a [34, 92] %.
    - Rango = `esperado ± 1,2816·sigma7` (80 %) en log-retorno, llevado a pesos con `último × exp(·)` y acotado a `±40 %`; `puntos` = 7 pasos lineales para el trazo.
    - `confianza`: alta con ≥45 puntos, `sigma7 ≤ 0,05` y contexto de ≤45 días; media con ≥20 puntos y `sigma7 ≤ 0,10`; si no, baja. Sin contexto, máximo media.
    - `motivos` de un catálogo cerrado (máx. 3, con prioridad): `tendencia_sube`, `tendencia_baja`, `clima`, `ipc_alto`, `poca_serie`, `sin_contexto`, `cambio_reciente`.
  - `src/lib/datos.ts`: `catalogo()` cambia la consulta de `historial_minimo` de 30 días por `serie_pronostico` (un `select` de `producto_id, puntos`) y suma la última fila de `contexto_mercado`; el `serie` de la tarjeta sale de los últimos 30 puntos y el pronóstico de los 60. `detalle()` lee `serie_pronostico` del producto.
  - UI: chip en la tarjeta y bloque en `/producto/[id]` con la animación 10 (§7). El pronóstico **no** entra en totales, óptimo, alertas ni PDF y **no** se escribe en ninguna tabla de precios.
- **Hecho cuando:**
  - `tests/unit/pronostico.test.ts`: una serie que sube da `sube`; una que baja da `baja`; una plana con ruido da `estable`; con 7 puntos devuelve `null`; sin contexto la confianza no pasa de `media`; la probabilidad queda en [34, 92]; el rango contiene el último precio con serie estable; los motivos nunca pasan de 3.
  - pgTAP: `anon` lee `contexto_mercado` y `serie_pronostico`; `serie_pronostico` devuelve ≤60 puntos por producto; una fila de `precios_manuales_historial` aparece en `historial_minimo`.
  - Integración con `fetch` falso: un anexo válido hace upsert; un 404 conserva la fila anterior y escribe la nota en `corridas.notas`; la corrida termina con exit 0.
  - E2E: una fruta muestra el chip, un producto de aseo no; `/producto/[id]` dice "Estimación estadística" y muestra el rango; con menos de 8 puntos no hay bloque.

**31. Retirar Éxito, Carulla, Euro, Ara e Ísimo.** *(decisión del 30-oct-2026: en estas tiendas la familia no va a mercar)*
- **Depende de:** paso 20 (mismo patrón de retiro) y paso 21 (inventario final de tiendas).
- **Migración nueva `supabase/migrations/<ts>_retirar_tiendas.sql`:**

  ```sql
  -- 30-oct-2026: la familia no merca en estas cinco tiendas. Se borra de hijas a padre.
  -- Primero las listas que las tenían como preferida: la FK impediría borrar la tienda.
  update listas set tienda_preferida = 'd1'
    where tienda_preferida in ('exito','carulla','euro','ara','isimo');
  alter table listas alter column tienda_preferida set default 'd1';

  update listas_guardadas set tienda_preferida = 'd1'
    where tienda_preferida in ('exito','carulla','euro','ara','isimo');
  alter table listas_guardadas alter column tienda_preferida set default 'd1';

  delete from alertas
    where tienda_id in ('exito','carulla','euro','ara','isimo');
  delete from anotados
    where tienda_id in ('exito','carulla','euro','ara','isimo');
  delete from precios_manuales_historial
    where tienda_id in ('exito','carulla','euro','ara','isimo');
  delete from precios_historial
    where tienda_id in ('exito','carulla','euro','ara','isimo');
  delete from precios_actuales
    where tienda_id in ('exito','carulla','euro','ara','isimo');
  delete from producto_fuente
    where tienda_id in ('exito','carulla','euro','ara','isimo');
  delete from tienda_estado
    where tienda_id in ('exito','carulla','euro','ara','isimo');
  delete from tiendas
    where id in ('exito','carulla','euro','ara','isimo');
  ```

  `catalogo_tienda` todavía no existe (nace en el paso 32) y `barrio` no se toca. `historial_minimo` y `serie_pronostico` son vistas: al borrar filas se recalculan solas; el mínimo por producto y día **cambia a propósito** porque ya no compite con las tiendas retiradas, y el pronóstico se recalcula sobre la serie nueva.
- **Hacer:**
  - `scripts/migrar.ts`: constante `TIENDAS_RETIRADAS = new Set(["exito","carulla","euro","ara","isimo"])` y filtro en **todas** las cargas que traen tienda: `tiendas`, `precios_actuales`, `precios_historial`, `anotados`, `producto_fuente`, y en `meta.estado.fuentes` / `meta.estado.ultimoOk` para que no reaparezcan en `tienda_estado` ni en el encabezado. `data/export/*.json` y `data/origen/constantes-artifact.js` **no se editan**: son la copia literal del artifact y el script los filtra. El mensaje final pasa a `productos=144 precios=432 tiendas=4` y el script deriva el historial y los anotados de los JSON filtrados, sin números escritos a mano.
  - `src/corrida/orquestador.ts`: quitar `euro` de `ADAPTADORES`; quedan `d1`, `minorista` y `vaquita`.
  - Borrar `src/corrida/adaptadores/euro.ts`, `tests/fixtures/euro/` y el caso `euro` de `scripts/capturar-fixtures.ts`; si alguna prueba unitaria o de integración cita Euro, se borra con él.
  - `src/corrida/alertas-usuario.ts`: el respaldo de `tienda_preferida` pasa de `"exito"` a `"d1"`.
  - `src/app/layout.tsx` (`DESCRIPCION`) y `README.md` (tabla de fuentes y comando `pnpm capturar`): quitar las cinco tiendas, dejar D1, La Minorista, La Vaquita, PriceSmart y Tienda/Carnicería de barrio.
  - `CLAUDE.md`, `workspace/CLAUDE.md`, `.claude/rules/corrida.md` y `decisiones.md`: misma lista de 5 tiendas y sin `pnpm capturar euro`.
  - `pnpm gen:tipos` después de la migración.
- **Hecho cuando:**
  - `pnpm exec supabase db reset && pnpm migrar` imprime `productos=144 precios=432 tiendas=4` y sale con 0; `select count(*) from tiendas` da 5; no queda ninguna fila con esos ids en `precios_actuales`, `precios_historial`, `anotados`, `precios_manuales_historial`, `producto_fuente`, `tienda_estado` ni `alertas`.
  - `grep -ril "exito\|carulla\|euro\|isimo" src/ scripts/ tests/ README.md` no encuentra lógica de negocio (solo pueden quedar comentarios históricos justificados); `grep -ri "pnpm capturar euro" .` sale vacío.
  - `pnpm exec supabase db reset && pnpm migrar` dos veces seguidas deja los mismos conteos y no resucita las tiendas.
  - El gate (`pnpm typecheck && pnpm lint && pnpm test`) pasa; el encabezado dice "X/3 fuentes OK" y `/anotados` ya no muestra esas columnas.

**32. Tienda/Carnicería de barrio: catálogo propio y todo a mano.** *(pedido del 30-oct-2026: aparece sin datos; hay que armarla entera)*
- **Depende de:** pasos 27 (precio corregido), 31 (tiendas finales) y 14/16 (avisos y `/anotados`).
- **Migración nueva `supabase/migrations/<ts>_catalogo_barrio.sql`:**

  ```sql
  -- Catálogo propio de la tienda de barrio: qué productos se le siguen. No guarda precios.
  create table catalogo_tienda (
    producto_id text not null references productos,
    tienda_id text not null default 'barrio' references tiendas check (tienda_id = 'barrio'),
    activo boolean not null default true,
    orden integer not null default 0,
    autor uuid references auth.users default auth.uid(),
    creado timestamptz not null default now(),
    primary key (producto_id, tienda_id)
  );
  create index on catalogo_tienda (tienda_id, activo, orden);

  alter table catalogo_tienda enable row level security;
  create policy leer on catalogo_tienda for select using (true);
  create policy crear on catalogo_tienda for insert to authenticated
    with check (autor = auth.uid());
  create policy editar on catalogo_tienda for update to authenticated
    using (true) with check (autor = auth.uid());
  revoke all on catalogo_tienda from anon, authenticated;
  grant select on catalogo_tienda to anon, authenticated;
  grant insert, update on catalogo_tienda to authenticated;

  -- 41 productos iniciales: 17 proteínas, 12 lácteos, 7 panadería y 5 de despensa.
  insert into catalogo_tienda (producto_id, tienda_id, orden) values
    ('atun','barrio',1), ('cerdo','barrio',2), ('chorizo','barrio',3), ('costilla','barrio',4),
    ('higado','barrio',5), ('huevos','barrio',6), ('jamon','barrio',7), ('molida','barrio',8),
    ('muslos','barrio',9), ('pollo','barrio',10), ('pollo_entero','barrio',11),
    ('res_desmechar','barrio',12), ('res_sudar','barrio',13), ('salchicha','barrio',14),
    ('sardinas','barrio',15), ('tilapia','barrio',16), ('tocino','barrio',17),
    ('crema_leche','barrio',18), ('kumis','barrio',19), ('leche','barrio',20),
    ('leche_deslactosada','barrio',21), ('leche_polvo','barrio',22), ('mantequilla','barrio',23),
    ('parmesano','barrio',24), ('queso','barrio',25), ('queso_crema','barrio',26),
    ('queso_mozzarella','barrio',27), ('yogur','barrio',28), ('yogur_griego','barrio',29),
    ('croissant','barrio',30), ('muffin','barrio',31), ('pan_frances','barrio',32),
    ('pan_integral','barrio',33), ('pan_tajado','barrio',34), ('pandebono','barrio',35),
    ('torta_chocolate','barrio',36), ('aceite','barrio',37), ('azucar','barrio',38),
    ('cafe','barrio',39), ('panela','barrio',40), ('sal','barrio',41);

  -- Nueva alerta: precio manual de barrio sin actualizar.
  alter table alertas drop constraint alertas_tipo_check;
  alter table alertas add constraint alertas_tipo_check check (tipo in
    ('mas_barato','mercado_completo','subida','caro_por_clima','fuente_caida','precio_manual_vencido'));
  ```

  **No se siembra ni un precio.** `precios_actuales`, `precios_historial`, `anotados` y `precios_manuales_historial` quedan sin filas de `barrio` después de `db reset`; el primer precio entra cuando una persona lo escribe con `corregir_precio`.
- **Hacer:**
  - `src/data/barrio.ts`: los mismos 41 ids con su grupo y `orden`, como fuente legible para la UI y las pruebas. La migración es la que siembra; el archivo no escribe en la base.
  - `src/lib/datos.ts`: `tablaAnotados()` devuelve también el catálogo de barrio (producto, activo, orden) y el último precio manual por producto (`anotados` con `tienda_id = 'barrio'`); `catalogo()` mantiene `barrio` en `tiendas` y `resumir()` deja el precio en `null` cuando no hay anotado, sin inventar un "estimado". `mejor tienda` y `óptimo dividido` ignoran los `null` como hoy.
  - `src/lib/precios/etiquetas.ts`: `porActualizar(fecha, hoy, frecuencia)` con 14 días (diaria) / 30 (semanal) y la etiqueta `actualizar`; se aplica solo si `tienda === "barrio"`.
  - `/anotados/barrio` (`src/app/anotados/barrio/page.tsx` + `src/components/anotados/barrio.tsx`): progreso "N/41 con precio · M por actualizar", barra, grupos, precio y fecha, ✎ con la hoja del paso 27, "Agregar producto" (busca en los 144 o crea uno propio con nombre, unidad y grupo) y "Quitar" (confirmación en línea, `activo = false`, sin borrar precios). Server actions en `src/app/anotados/barrio/acciones.ts` con zod.
  - `/anotados`: enlace destacado a la vista de barrio con el mismo progreso; si `barrio` tiene precios, aparece como columna, si no, se muestra "sin dato".
  - `src/corrida/alertas-usuario.ts`: agregar `precio_manual_vencido` a `TIPOS_USUARIO` y generarlo por usuario con lista: para cada ítem de la lista que esté en `catalogo_tienda` con `activo = true`, si no tiene fila en `anotados` (`barrio`) o su fecha supera 14/30 días según `productos.frecuencia`, inserta una alerta con enlace a `/anotados/barrio`. Los productos del catálogo que el usuario no tiene en su lista **no** generan alerta. Se mantiene la idempotencia: antes de insertar se borran las no leídas de hoy de ese tipo.
  - `/alertas` y el resumen del día muestran el mensaje con "Actualizar precios de barrio" → `/anotados/barrio`.
  - Avisos nuevos del paso 14: `barrio_sin_precio`, `barrio_producto_agregado`, `barrio_producto_quitado`.
  - `pnpm gen:tipos` después de la migración.
- **Hecho cuando:**
  - pgTAP (`supabase/tests/catalogo_barrio.test.sql`): `anon` lee `catalogo_tienda` y no puede escribir; con sesión se agrega un producto y se desactiva sin borrar la fila; el catálogo tiene exactamente 41 filas activas para `barrio`; `alertas` acepta `precio_manual_vencido` y rechaza un tipo inventado; tras `db reset` hay 0 filas de `barrio` en `precios_actuales`, `precios_historial` y `anotados`.
  - `pnpm migrar` sigue imprimiendo `precios=432 tiendas=4` (barrio no suma precios).
  - Integración de `alertasUsuarios`: una lista con un producto de barrio sin precio genera 1 `precio_manual_vencido`; con precio de hace 10 días no genera nada; con 15 días (diaria) o 31 (semanal) sí; un producto del catálogo que no está en la lista no genera alerta; repetir la corrida no duplica.
  - E2E `tests/e2e/barrio.spec.ts`: `/anotados/barrio` empieza en "0/41 con precio"; sin sesión el ✎ lleva a `/ingresar`; con sesión anotar un precio deja "1/41 con precio" y lo muestra en la tarjeta; recargar lo conserva; quitarlo vuelve a "sin dato" pero el historial conserva la fila del día anterior; "Agregar producto" sube el total y "Quitar" lo baja sin borrar el precio.

**33. Tutorial animado con GSAP y bombilla de ayuda.** *(último paso, 30-oct-2026)*
- **Depende de:** pasos 12–18 y 27–32 (las pantallas que explica). **No agrega dependencias:** GSAP y `@gsap/react` ya están en §2.
- **Migración:** ninguna. Todo vive en el cliente y en `localStorage`.
- **Hacer:**
  - `src/lib/tutorial/pasos.ts` (puro): `type Paso = { id, titulo, texto, objetivo }`, `PASOS_GENERAL` y `PASOS_PANTALLA: Record<string, Paso[]>`. El general recorre encabezado, búsqueda, chips, tarjetas, carrito, lista, botón de guardar, anotados, Hogar/Dieta, presupuesto, alertas y la bombilla. Los recorridos por pantalla (`/`, `/antojos`, `/listas`, `/hogar`, `/dieta`, `/presupuesto`, `/anotados`, `/anotados/barrio`, `/alertas`, `/producto/[id]`) explican solo lo de esa vista.
  - `src/lib/tutorial/almacenamiento.ts`: `leerProgreso()` / `marcarVisto()` / `reiniciar()`, clave `mercado-medellin:tutorial:v1` = `{ version: 1, general: true, pantallas: string[] }`, todo en try/catch; si el JSON está corrupto se trata como no visto.
  - `src/components/tutorial/proveedor.tsx` (`"use client"`): contexto `{ activo, completado, abrir(modo: "general" | "pantalla"), cerrar }`. Al montar, si `!general`, abre el general tras 800 ms **solo en `/`**; no abre en rutas de auth ni si `localStorage` falla. `?tutorial=1` abre el general sin marcar hasta que termine. Provee también `completado` para los tips.
  - `src/components/tutorial/tutorial.tsx`: overlay fijo con foco (un div en la posición del objetivo con `box-shadow: 0 0 0 9999px rgba(15,23,42,.55)`, borde blanco de 2 px y radio 14 px) y tarjeta `role="dialog" aria-modal="true"` con título, texto, "Paso N de M", "Anterior", "Siguiente", "Saltar" y "Cerrar". El objetivo se busca por `[data-tour="<id>"]`; si no existe, el paso se salta. La tarjeta se coloca según el espacio (arriba/abajo/izquierda/derecha), nunca tapa el objetivo y en móvil va abajo; el objetivo se centra con `scrollIntoView({ block: "center" })`. Foco atrapado dentro de la tarjeta, `Esc` cierra, foco devuelto al disparador y `aria-hidden` en el resto mientras dura.
  - `src/components/tutorial/bombilla.tsx`: FAB de 48 px abajo a la izquierda (20 px, `env(safe-area-inset-bottom)`, `aria-label="Ayuda y tutorial"`, 44 px en táctil) con menú **"Ver esta pantalla"**, **"Tutorial general"**, **"Reiniciar tutorial"** (borra la marca y avisa `tutorial_reiniciado`) y **"Cerrar"**. Se monta en `layout.tsx` y no se pisa con el botón "Guardar lista" (abajo a la derecha) ni con la barra del carrito.
  - `src/app/layout.tsx`: envolver `TipsNoInvasivos` y el tutorial con `<ProveedorTutorial>`; montar `<Tutorial />` y `<Bombilla />` una sola vez.
  - `src/components/avisos/tips-no-invasivos.tsx`: `const { activo, completado } = useTutorial()` y no mostrar nada si `activo || completado`.
  - `data-tour` en los elementos reales: `encabezado`, `busqueda`, `chips-grupo`, `chips-tienda`, `rejilla`, `tarjeta`, `carrito`, `lista`, `boton-guardar`, `pestanas`, `anotados-tabla`, `barrio-progreso`, `hogar-presupuesto`, `dieta-plan`, `presupuesto-total`, `alertas-campana`, `bombilla`. Solo se agregan atributos, sin cambiar el marcado visible.
  - Animaciones 11 y 12 de §7 con `useGSAP` + `contextSafe`, dentro de `gsap.matchMedia()`: foco que se abre y se desliza entre pasos, tarjeta que entra desde el lado cercano y bombilla que se enciende al terminar. Con `prefers-reduced-motion: reduce` todo dura 0.
  - Sin escribir en Supabase, sin avisos persistentes y sin bloquear la navegación. `?tutorial=1` funciona también con sesión cerrada.
- **Hecho cuando:**
  - `tests/unit/tutorial.test.ts`: `leerProgreso` devuelve "no visto" con JSON corrupto o sin clave; `marcarVisto("general")` es idempotente; `reiniciar` borra la marca; `pasosPara("general")` no repite ids y todos los pasos tienen título, texto y objetivo no vacíos.
  - E2E `tests/e2e/tutorial.spec.ts`: la primera visita a `/` abre el tutorial y oscurece la pantalla; "Siguiente" avanza el contador; `Esc` lo cierra; recargar **no** lo vuelve a abrir; la bombilla abre el menú y "Tutorial general" lo repite; "Reiniciar tutorial" hace que vuelva en la próxima visita; `?tutorial=1` lo abre aunque ya esté visto; en `/ingresar` no aparece; con `reducedMotion: "reduce"` los pasos cambian sin animación.
  - E2E de accesibilidad: con el tutorial abierto, el foco no sale de la tarjeta, `Esc` lo cierra, el foco vuelve a la bombilla y axe no reporta violaciones `serious` ni `critical`.
  - Mientras el tutorial está abierto o completado, `TipsNoInvisivos` no muestra tips; los tips siguen saliendo para quien saltó el tutorial.
  - El gate (`pnpm typecheck && pnpm lint && pnpm test`) y `pnpm test:e2e` pasan sin dependencias nuevas.

**34. Importar una factura en CSV y abrir el catálogo de tiendas y productos.** *(pedido del 31-oct-2026: cargar lo que se compra sin digitar producto por producto)*
- **Depende de:** pasos 14 (avisos), 16 (`/anotados`), 27 (precio corregido) y 29 (presupuesto real). **No agrega dependencias:** el CSV se lee con `FileReader`, el hash con `crypto.subtle` y la UI reusa los componentes de `presupuesto/`.
- **Migración nueva `supabase/migrations/<ts>_importar_compras.sql`:**

  ```sql
  -- 31-oct-2026: catálogo compartido + compras importadas desde una factura en CSV.
  -- El archivo no se sube: el navegador lo lee, calcula el hash y manda las filas ya normalizadas.
  create function normalizar_nombre(p_texto text) returns text
  language sql immutable as $$
    select btrim(regexp_replace(
      translate(lower(coalesce(p_texto, '')),
        'áàäâãéèëêíìïîóòöôõúùüûñç',
        'aaaaaeeeeiiiiooooouuuunc'),
      '\s+', ' ', 'g'));
  $$;

  create function slug_tienda(p_nombre text) returns text
  language sql immutable as $$
    select left(coalesce(nullif(btrim(regexp_replace(
      normalizar_nombre(p_nombre), '[^a-z0-9]+', '-', 'g'), '-'), ''), 'tienda'), 30);
  $$;

  -- Nombres normalizados y auditoría. `nombre_norm` es generado: no se puede olvidar.
  alter table tiendas
    add column nombre_norm text generated always as (normalizar_nombre(nombre)) stored,
    add column origen text not null default 'seed' check (origen in ('seed','manual','importado')),
    add column creado_por uuid references auth.users default auth.uid(),
    add column creado timestamptz not null default now();
  create unique index tiendas_nombre_norm on tiendas (nombre_norm);
  alter table tiendas add constraint tiendas_nombre_largo
    check (char_length(btrim(nombre)) between 2 and 60) not valid;

  alter table productos
    add column nombre_norm text generated always as (normalizar_nombre(nombre)) stored,
    add column origen text not null default 'seed' check (origen in ('seed','manual','compra')),
    add column revisado boolean not null default true,
    add column creado_por uuid references auth.users default auth.uid(),
    add column creado timestamptz not null default now();
  create unique index productos_nombre_norm on productos (nombre_norm);

  -- Cómo venía escrito cada nombre y el código de barras: la próxima factura empareja sola.
  create table tienda_alias (
    alias_norm text primary key,
    tienda_id text not null references tiendas on delete cascade,
    creado_por uuid references auth.users default auth.uid(),
    creado timestamptz not null default now()
  );

  create table producto_alias (
    id bigserial primary key,
    alias_norm text not null,
    tienda_id text references tiendas on delete cascade,  -- null = sirve en cualquier tienda
    producto_id text not null references productos on delete cascade,
    creado_por uuid references auth.users default auth.uid(),
    creado timestamptz not null default now()
  );
  create unique index producto_alias_tienda on producto_alias (alias_norm, tienda_id)
    where tienda_id is not null;
  create unique index producto_alias_global on producto_alias (alias_norm)
    where tienda_id is null;
  create index on producto_alias (producto_id);

  create table producto_codigo (
    codigo text primary key check (codigo ~ '^[0-9A-Za-z-]{4,40}$'),
    producto_id text not null references productos on delete cascade,
    creado_por uuid references auth.users default auth.uid(),
    creado timestamptz not null default now()
  );
  create index on producto_codigo (producto_id);

  -- Un lote = un archivo. Privado, con hash para bloquear la repetición.
  create table importaciones_gastos (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users on delete cascade,
    hash text not null check (hash ~ '^[a-f0-9]{64}$'),
    fecha_lote date not null,
    archivo text,
    filas int not null check (filas between 1 and 500),
    total bigint not null default 0 check (total >= 0),
    creado timestamptz not null default now(),
    deshecho timestamptz
  );
  -- Solo bloquea mientras el lote siga vigente: deshacer y volver a importar el mismo archivo es legítimo.
  create unique index importaciones_gastos_vigente on importaciones_gastos (user_id, hash)
    where deshecho is null;

  -- Foto de lo que el lote pisó, para que "deshacer" sea real.
  create table importacion_cambios (
    id bigserial primary key,
    importacion_id uuid not null references importaciones_gastos on delete cascade,
    producto_id text not null references productos,
    tienda_id text not null references tiendas,
    fecha date not null,
    precio_nuevo int not null,
    promocion boolean not null default false,
    anotado_precio int,
    anotado_fecha date,
    historial_precio int,
    historial_origen text,
    historial_promocion boolean,
    creado timestamptz not null default now(),
    unique (importacion_id, producto_id, tienda_id, fecha)
  );
  create index on importacion_cambios (importacion_id);

  alter table gastos_reales
    add column cantidad numeric(10,3) check (cantidad is null or cantidad > 0),
    add column descripcion text,
    add column lote_importacion uuid references importaciones_gastos on delete set null;
  alter table gastos_reales drop constraint gastos_reales_origen_check;
  alter table gastos_reales add constraint gastos_reales_origen_check
    check (origen in ('manual','desde_lista','plan_hogar','plan_dieta','importado'));
  create index on gastos_reales (lote_importacion);

  alter table precios_manuales_historial
    add column origen text not null default 'manual' check (origen in ('manual','compra')),
    add column cantidad numeric(10,3),
    add column total int,
    add column promocion boolean not null default false,
    add column importacion_id uuid references importaciones_gastos on delete set null;

  -- Una promoción va al historial pero no al mínimo: no distorsiona serie, alertas ni pronóstico.
  create or replace view historial_minimo with (security_invoker = true) as
  select producto_id, fecha, min(precio) as precio
  from (
    select producto_id, fecha, precio from precios_historial where precio is not null
    union all
    select producto_id, fecha, precio from precios_manuales_historial
      where not promocion and precio is not null
  ) s
  group by producto_id, fecha;

  -- El catálogo de barrio deja de ser el único: cualquier tienda puede tener productos seguidos.
  alter table catalogo_tienda drop constraint catalogo_tienda_tienda_id_check;

  -- Escritura global con sesión; `anon` sigue leyendo. Nadie borra tiendas ni productos.
  create policy crear on tiendas for insert to authenticated
    with check (creado_por = auth.uid());
  create policy editar on tiendas for update to authenticated
    using (true) with check (true);
  grant insert, update on tiendas to authenticated;

  create policy crear on productos for insert to authenticated
    with check (creado_por = auth.uid());
  create policy editar on productos for update to authenticated
    using (true) with check (true);
  grant insert, update on productos to authenticated;

  alter table tienda_alias enable row level security;
  create policy leer on tienda_alias for select using (true);
  create policy crear on tienda_alias for insert to authenticated with check (creado_por = auth.uid());
  create policy editar on tienda_alias for update to authenticated using (true) with check (true);
  create policy borrar on tienda_alias for delete to authenticated using (true);
  revoke all on tienda_alias from anon, authenticated;
  grant select on tienda_alias to anon, authenticated;
  grant insert, update, delete on tienda_alias to authenticated;

  alter table producto_alias enable row level security;
  create policy leer on producto_alias for select using (true);
  create policy crear on producto_alias for insert to authenticated with check (creado_por = auth.uid());
  create policy editar on producto_alias for update to authenticated using (true) with check (true);
  create policy borrar on producto_alias for delete to authenticated using (true);
  revoke all on producto_alias from anon, authenticated;
  grant select on producto_alias to anon, authenticated;
  grant insert, update, delete on producto_alias to authenticated;
  grant usage on sequence producto_alias_id_seq to authenticated;

  alter table producto_codigo enable row level security;
  create policy leer on producto_codigo for select using (true);
  create policy crear on producto_codigo for insert to authenticated with check (creado_por = auth.uid());
  create policy borrar on producto_codigo for delete to authenticated using (true);
  revoke all on producto_codigo from anon, authenticated;
  grant select on producto_codigo to anon, authenticated;
  grant insert, delete on producto_codigo to authenticated;

  alter table importaciones_gastos enable row level security;
  create policy propia on importaciones_gastos for all to authenticated
    using (user_id = auth.uid()) with check (user_id = auth.uid());
  revoke all on importaciones_gastos from anon, authenticated;
  grant select, insert, update, delete on importaciones_gastos to authenticated;

  alter table importacion_cambios enable row level security;
  create policy leer on importacion_cambios for select to authenticated
    using (exists (select 1 from importaciones_gastos i
      where i.id = importacion_id and i.user_id = auth.uid()));
  create policy crear on importacion_cambios for insert to authenticated
    with check (exists (select 1 from importaciones_gastos i
      where i.id = importacion_id and i.user_id = auth.uid()));
  -- La fila nace con el precio de la línea y se corrige con el ponderado del lote.
  create policy editar on importacion_cambios for update to authenticated
    using (exists (select 1 from importaciones_gastos i
      where i.id = importacion_id and i.user_id = auth.uid()))
    with check (exists (select 1 from importaciones_gastos i
      where i.id = importacion_id and i.user_id = auth.uid()));
  revoke all on importacion_cambios from anon, authenticated;
  grant select, insert, update, delete on importacion_cambios to authenticated;
  grant usage on sequence importacion_cambios_id_seq to authenticated;

  -- Deshacer un lote propio puede borrar observaciones de días pasados.
  create policy borrar_lote on precios_manuales_historial for delete to authenticated
    using (importacion_id is not null and exists (
      select 1 from importaciones_gastos i
      where i.id = importacion_id and i.user_id = auth.uid()));

  -- Crear tienda: idempotente por nombre o alias. Tope de 5 nuevas por usuario y día.
  create function crear_tienda(p_nombre text) returns text
  language plpgsql security invoker set search_path = public as $$
  declare
    v_norm text := normalizar_nombre(p_nombre);
    v_id text;
    v_base text;
    v_n int := 1;
    v_hoy date := (now() at time zone 'America/Bogota')::date;
    v_color text;
  begin
    if auth.uid() is null then raise exception 'sin_sesion'; end if;
    if v_norm is null or char_length(v_norm) not between 2 and 60 then
      raise exception 'nombre_invalido';
    end if;
    select tienda_id into v_id from tienda_alias where alias_norm = v_norm;
    if v_id is not null then return v_id; end if;
    select id into v_id from tiendas where nombre_norm = v_norm;
    if v_id is not null then return v_id; end if;

    if (select count(*) from tiendas
        where creado_por = auth.uid() and (creado at time zone 'America/Bogota')::date = v_hoy) >= 5 then
      raise exception 'limite_tiendas';
    end if;

    v_base := coalesce(nullif(slug_tienda(p_nombre), ''), 'tienda');
    v_id := v_base;
    while exists (select 1 from tiendas where id = v_id) loop
      v_n := v_n + 1;
      v_id := v_base || '-' || v_n;
    end loop;
    v_color := (array['#0f766e','#b45309','#7c3aed','#be123c','#0369a1','#4d7c0f'])
      [(1 + (abs(hashtext(v_id))::bigint % 6))::int];
    insert into tiendas (id, nombre, color, manual, nota, origen, creado_por)
      values (v_id, btrim(p_nombre), v_color, true, 'Creada desde una factura', 'importado', auth.uid());
    return v_id;
  exception when unique_violation then
    select id into v_id from tiendas where nombre_norm = v_norm;
    return v_id;
  end $$;
  revoke all on function crear_tienda(text) from public, anon;
  grant execute on function crear_tienda(text) to authenticated;

  -- Crear producto: idempotente por nombre normalizado. Grupo/unidad por defecto, corregibles en /tiendas.
  create function crear_producto(
    p_nombre text,
    p_grupo text default 'Otros',
    p_unidad text default 'u',
    p_cantidad_base numeric default 1,
    p_frecuencia text default 'semanal'
  ) returns text
  language plpgsql security invoker set search_path = public as $$
  declare
    v_norm text := normalizar_nombre(p_nombre);
    v_id text;
    v_base text;
    v_n int := 1;
    v_ub text;
    v_cb numeric;
    v_frec text;
    v_hoy date := (now() at time zone 'America/Bogota')::date;
  begin
    if auth.uid() is null then raise exception 'sin_sesion'; end if;
    if v_norm is null or char_length(v_norm) not between 2 and 120 then
      raise exception 'nombre_invalido';
    end if;
    select id into v_id from productos where nombre_norm = v_norm;
    if v_id is not null then return v_id; end if;

    if (select count(*) from productos
        where creado_por = auth.uid() and (creado at time zone 'America/Bogota')::date = v_hoy) >= 50 then
      raise exception 'limite_productos';
    end if;

    v_ub := case when p_unidad in ('g','ml','u') then p_unidad
                 when p_unidad = 'kg' then 'g'
                 when p_unidad = 'l' then 'ml'
                 else 'u' end;
    v_cb := case when p_unidad in ('kg','l') then coalesce(p_cantidad_base, 1) * 1000
                 when p_unidad in ('g','ml','u') then coalesce(p_cantidad_base, 1)
                 else 1 end;
    v_frec := case when p_frecuencia in ('diaria','semanal') then p_frecuencia else 'semanal' end;

    v_base := 'p-' || coalesce(nullif(slug_tienda(p_nombre), ''), 'producto');
    v_id := v_base;
    while exists (select 1 from productos where id = v_id) loop
      v_n := v_n + 1;
      v_id := v_base || '-' || v_n;
    end loop;
    insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia,
        origen, revisado, creado_por)
      values (v_id, btrim(p_nombre), coalesce(nullif(btrim(p_grupo), ''), 'Otros'), p_unidad,
              v_ub, v_cb, v_frec, 'compra', false, auth.uid());
    return v_id;
  exception when unique_violation then
    select id into v_id from productos where nombre_norm = v_norm;
    return v_id;
  end $$;
  revoke all on function crear_producto(text, text, text, numeric, text) from public, anon;
  grant execute on function crear_producto(text, text, text, numeric, text) to authenticated;

  -- Empareja como lo hará la importación: código de barras, alias de la tienda, alias global y nombre.
  create function emparejar_producto(p_nombre text, p_tienda text, p_codigo text)
  returns text language sql stable security invoker set search_path = public as $$
    select coalesce(
      (select producto_id from producto_codigo
        where codigo = nullif(btrim(coalesce(p_codigo, '')), '') limit 1),
      (select producto_id from producto_alias
        where alias_norm = normalizar_nombre(p_nombre) and tienda_id = p_tienda limit 1),
      (select producto_id from producto_alias
        where alias_norm = normalizar_nombre(p_nombre) and tienda_id is null limit 1),
      (select id from productos where nombre_norm = normalizar_nombre(p_nombre) limit 1));
  $$;
  revoke all on function emparejar_producto(text, text, text) from public, anon;
  grant execute on function emparejar_producto(text, text, text) to authenticated;

  -- Revisión: qué tienda y qué producto se van a usar, sin escribir nada.
  create function previsualizar_compra(p_filas jsonb)
  returns table (linea int, tienda_texto text, producto_texto text, tienda_id text,
    producto_id text, producto_nombre text, grupo text, precio int,
    tienda_nueva boolean, producto_nuevo boolean, aviso text)
  language plpgsql security invoker set search_path = public as $$
  #variable_conflict use_variable
  declare
    f jsonb; i int := 0; v_t text; v_cod text;
  begin
    if jsonb_typeof(p_filas) <> 'array' then raise exception 'filas_invalidas'; end if;
    if jsonb_array_length(p_filas) > 500 then raise exception 'demasiadas_filas'; end if;
    for f in select * from jsonb_array_elements(p_filas) loop
      i := i + 1;
      tienda_texto := btrim(coalesce(f->>'tienda', ''));
      producto_texto := btrim(coalesce(f->>'producto', ''));
      v_t := normalizar_nombre(tienda_texto);
      v_cod := nullif(btrim(coalesce(f->>'codigo', '')), '');
      tienda_id := null; producto_id := null; producto_nombre := null;
      grupo := 'Otros'; tienda_nueva := false; producto_nuevo := false; aviso := null;

      select ta.tienda_id into tienda_id from tienda_alias ta where ta.alias_norm = v_t;
      if tienda_id is null then
        select t.id into tienda_id from tiendas t where t.nombre_norm = v_t;
      end if;
      tienda_nueva := tienda_id is null;

      producto_id := emparejar_producto(producto_texto, tienda_id, v_cod);
      producto_nuevo := producto_id is null;
      if producto_id is not null then
        select p.nombre, p.grupo into producto_nombre, grupo from productos p where p.id = producto_id;
      end if;

      precio := round((f->>'precio_total')::numeric / nullif((f->>'cantidad')::numeric, 0));
      if precio is null or precio not between 100 and 10000000 then
        aviso := 'precio_fuera_de_rango';
      end if;
      return next;
    end loop;
  end $$;
  revoke all on function previsualizar_compra(jsonb) from public, anon;
  grant execute on function previsualizar_compra(jsonb) to authenticated;

  -- Importa el lote completo en una transacción: gastos privados + precios globales.
  create function importar_compra(
    p_fecha date,
    p_archivo text,
    p_publicar boolean,
    p_filas jsonb,
    p_hash text
  ) returns jsonb
  language plpgsql security invoker set search_path = public as $$
  #variable_conflict use_variable
  declare
    v_imp uuid;
    v_f jsonb;
    v_linea int := 0;
    v_tid text; v_pid text; v_precio int; v_fecha date; v_pub boolean; v_promo boolean;
    v_total bigint := 0; v_gastos int := 0; v_avisos jsonb := '[]'::jsonb;
    v_t0 int := (select count(*) from tiendas);
    v_p0 int := (select count(*) from productos);
    v_prev_precio int; v_prev_fecha date;
    v_h_precio int; v_h_origen text; v_h_promo boolean;
    v_efectivo int;
  begin
    if auth.uid() is null then raise exception 'sin_sesion'; end if;
    if p_fecha is null then raise exception 'fecha_invalida'; end if;
    if jsonb_typeof(p_filas) <> 'array' or jsonb_array_length(p_filas) = 0 then
      raise exception 'filas_invalidas';
    end if;
    if jsonb_array_length(p_filas) > 500 then raise exception 'demasiadas_filas'; end if;

    if p_hash !~ '^[a-f0-9]{64}$' then raise exception 'hash_invalido'; end if;
    insert into importaciones_gastos (user_id, hash, fecha_lote, archivo, filas)
      values (auth.uid(), p_hash, p_fecha, left(coalesce(p_archivo,'factura.csv'), 120),
              jsonb_array_length(p_filas))
      on conflict (user_id, hash) where deshecho is null do nothing
      returning id into v_imp;
    if v_imp is null then raise exception 'importacion_duplicada'; end if;

    for v_f in select * from jsonb_array_elements(p_filas) loop
      v_linea := v_linea + 1;
      v_fecha := coalesce(nullif(v_f->>'fecha','')::date, p_fecha);
      v_precio := round((v_f->>'precio_total')::numeric / nullif((v_f->>'cantidad')::numeric, 0));
      v_pub := p_publicar and coalesce((v_f->>'publicar_precio')::boolean, true);
      v_promo := coalesce((v_f->>'promocion')::boolean, false);
      v_total := v_total + (v_f->>'precio_total')::int;
      v_tid := null; v_pid := null;

      if v_pub then
        v_tid := crear_tienda(v_f->>'tienda');
        v_pid := emparejar_producto(v_f->>'producto', v_tid, v_f->>'codigo');
        if v_pid is null then
          v_pid := crear_producto(v_f->>'producto',
            coalesce(nullif(v_f->>'rubro',''), 'Otros'),
            coalesce(nullif(v_f->>'unidad',''), 'u'), 1, 'semanal');
        end if;
        insert into tienda_alias (alias_norm, tienda_id)
          values (normalizar_nombre(v_f->>'tienda'), v_tid)
          on conflict (alias_norm) do nothing;
        insert into producto_alias (alias_norm, tienda_id, producto_id)
          values (normalizar_nombre(v_f->>'producto'), v_tid, v_pid)
          on conflict do nothing;
        if btrim(coalesce(v_f->>'codigo','')) ~ '^[0-9A-Za-z-]{4,40}$' then
          insert into producto_codigo (codigo, producto_id)
            values (btrim(v_f->>'codigo'), v_pid)
            on conflict (codigo) do nothing;
        end if;

        if v_precio is not null and v_precio between 100 and 10000000 then
          v_prev_precio := null; v_prev_fecha := null;
          v_h_precio := null; v_h_origen := null; v_h_promo := null;
          v_efectivo := null;
          select precio, fecha into v_prev_precio, v_prev_fecha
            from anotados where producto_id = v_pid and tienda_id = v_tid;
          select precio, origen, promocion into v_h_precio, v_h_origen, v_h_promo
            from precios_manuales_historial
            where producto_id = v_pid and tienda_id = v_tid and fecha = v_fecha;

          insert into importacion_cambios (importacion_id, producto_id, tienda_id, fecha,
            precio_nuevo, promocion, anotado_precio, anotado_fecha,
            historial_precio, historial_origen, historial_promocion)
            values (v_imp, v_pid, v_tid, v_fecha, v_precio, v_promo,
              v_prev_precio, v_prev_fecha, v_h_precio, v_h_origen, v_h_promo)
            on conflict (importacion_id, producto_id, tienda_id, fecha) do nothing;

          insert into precios_manuales_historial
            (producto_id, tienda_id, precio, fecha, autor, origen, cantidad, total, promocion, importacion_id)
            values (v_pid, v_tid, v_precio, v_fecha, auth.uid(), 'compra',
              (v_f->>'cantidad')::numeric, (v_f->>'precio_total')::int, v_promo, v_imp)
            on conflict (producto_id, tienda_id, fecha) do update
              set precio = case when precios_manuales_historial.importacion_id = excluded.importacion_id
                    then round((coalesce(precios_manuales_historial.total, 0) + excluded.total)
                      / nullif(coalesce(precios_manuales_historial.cantidad, 0) + excluded.cantidad, 0))
                    else excluded.precio end,
                  cantidad = case when precios_manuales_historial.importacion_id = excluded.importacion_id
                    then coalesce(precios_manuales_historial.cantidad, 0) + excluded.cantidad
                    else excluded.cantidad end,
                  total = case when precios_manuales_historial.importacion_id = excluded.importacion_id
                    then coalesce(precios_manuales_historial.total, 0) + excluded.total
                    else excluded.total end,
                  autor = excluded.autor, origen = 'compra',
                  promocion = excluded.promocion, importacion_id = excluded.importacion_id
              where precios_manuales_historial.origen = 'compra'
            returning precio into v_efectivo;
          if v_efectivo is null then v_efectivo := v_precio; end if;

          if not v_promo then
            insert into anotados (producto_id, tienda_id, precio, fecha, autor)
              values (v_pid, v_tid, v_efectivo, v_fecha, auth.uid())
              on conflict (producto_id, tienda_id) do update
                set precio = excluded.precio, fecha = excluded.fecha, autor = excluded.autor
                where anotados.fecha <= excluded.fecha;
            if not found then
              v_avisos := v_avisos || jsonb_build_object('linea', v_linea, 'aviso', 'precio_mas_nuevo');
            end if;
          end if;
          update importacion_cambios set precio_nuevo = v_efectivo
            where importacion_id = v_imp and producto_id = v_pid
              and tienda_id = v_tid and fecha = v_fecha;
        else
          v_avisos := v_avisos || jsonb_build_object('linea', v_linea, 'aviso', 'precio_fuera_de_rango');
        end if;
      end if;

      insert into gastos_reales (user_id, fecha, mes, rubro, monto, tienda_id, producto_id,
        origen, nota, cantidad, descripcion, lote_importacion)
      values (auth.uid(), v_fecha, to_char(v_fecha, 'YYYY-MM'),
        coalesce(nullif(v_f->>'rubro',''), 'Otros'), (v_f->>'precio_total')::int,
        v_tid, v_pid, 'importado',
        case when v_tid is null then btrim(v_f->>'tienda') end,
        (v_f->>'cantidad')::numeric, v_f->>'producto', v_imp);
      v_gastos := v_gastos + 1;
    end loop;

    update importaciones_gastos set total = v_total where id = v_imp;
    return jsonb_build_object(
      'importacion_id', v_imp,
      'gastos', v_gastos,
      'precios', (select count(*) from precios_manuales_historial where importacion_id = v_imp),
      'tiendas_creadas', (select count(*) from tiendas) - v_t0,
      'productos_creados', (select count(*) from productos) - v_p0,
      'avisos', v_avisos);
  end $$;
  revoke all on function importar_compra(date, text, boolean, jsonb, text) from public, anon;
  grant execute on function importar_compra(date, text, boolean, jsonb, text) to authenticated;

  -- Deshacer: solo toca lo que sigue igual que cuando entró el lote.
  create function deshacer_importacion(p_id uuid) returns jsonb
  language plpgsql security invoker set search_path = public as $$
  declare
    v_c record;
    v_precio int;
    v_fecha date;
    v_restaurados int := 0;
    v_conservados int := 0;
  begin
    if auth.uid() is null then raise exception 'sin_sesion'; end if;
    perform 1 from importaciones_gastos
      where id = p_id and user_id = auth.uid() and deshecho is null for update;
    if not found then raise exception 'importacion_no_deshacible'; end if;

    for v_c in select * from importacion_cambios where importacion_id = p_id loop
      -- La promoción nunca tocó el precio vigente: solo hay que borrar su historial.
      if not v_c.promocion then
        v_precio := null; v_fecha := null;
        select precio, fecha into v_precio, v_fecha
          from anotados where producto_id = v_c.producto_id and tienda_id = v_c.tienda_id;
        if found and v_precio = v_c.precio_nuevo and v_fecha = v_c.fecha then
          if v_c.anotado_precio is null then
            -- El anotado lo creó el lote: solo se puede borrar si sigue siendo de quien deshace.
            delete from anotados
              where producto_id = v_c.producto_id and tienda_id = v_c.tienda_id
                and autor = auth.uid();
            if found then v_restaurados := v_restaurados + 1;
            else v_conservados := v_conservados + 1; end if;
          else
            update anotados
              set precio = v_c.anotado_precio, fecha = v_c.anotado_fecha, autor = auth.uid()
              where producto_id = v_c.producto_id and tienda_id = v_c.tienda_id;
            v_restaurados := v_restaurados + 1;
          end if;
        else
          v_conservados := v_conservados + 1;
        end if;
      end if;

      delete from precios_manuales_historial
        where producto_id = v_c.producto_id and tienda_id = v_c.tienda_id
          and fecha = v_c.fecha and importacion_id = p_id;
      if v_c.historial_precio is not null then
        insert into precios_manuales_historial
          (producto_id, tienda_id, precio, fecha, autor, origen, promocion)
          values (v_c.producto_id, v_c.tienda_id, v_c.historial_precio, v_c.fecha,
                  auth.uid(), coalesce(v_c.historial_origen, 'manual'),
                  coalesce(v_c.historial_promocion, false))
          on conflict (producto_id, tienda_id, fecha) do nothing;
      end if;
    end loop;

    delete from gastos_reales where lote_importacion = p_id and user_id = auth.uid();
    update importaciones_gastos set deshecho = now() where id = p_id;
    return jsonb_build_object('restaurados', v_restaurados, 'conservados', v_conservados);
  end $$;
  revoke all on function deshacer_importacion(uuid) from public, anon;
  grant execute on function deshacer_importacion(uuid) to authenticated;
  ```

  `crear_tienda`, `crear_producto` y `emparejar_producto` son `security invoker`: dependen de las políticas nuevas y dejan `creado_por`. `emparejar_producto` es el único lugar donde se decide qué producto corresponde (código de barras, alias de la tienda, alias global y nombre normalizado) y lo usan tanto la revisión como la importación, para que lo que se ve antes de guardar sea lo que se guarda. El hash del lote lo calcula el navegador sobre el CSV normalizado y llega como `p_hash`; con y sin sesión se usa el mismo valor, y el índice único `(user_id, hash)` con `where deshecho is null` bloquea la repetición mientras el lote siga vigente. Si una factura repite el mismo producto, tienda y fecha, el precio del día se pondera con la suma de cantidades y totales (el gasto sigue uno por línea). `deshacer_importacion` restaura el precio anterior **solo si el anotado sigue teniendo el precio y la fecha del lote**; si alguien lo corrigió después, lo conserva y lo cuenta en `conservados`. Al restaurar, el autor pasa a ser quien deshace (la RLS de `anotados` exige `autor = auth.uid()`). Las promociones nunca llegan a `anotados` y quedan fuera de `historial_minimo`, así que no mueven totales, alertas ni pronóstico.
- **Hacer:**
  - `src/lib/importar/tipos.ts` (puro): `FilaCsv` (`linea`, `producto`, `cantidad`, `precioTotal`, `tienda`, `fecha`, `codigo`), `FilaRevision` (agrega `rubro`, `unidad`, `publicarPrecio`, `promocion`, `tiendaId`, `productoId`, `nuevo`), `ResultadoImportacion` (`importacionId`, `gastos`, `precios`, `tiendasCreadas`, `productosCreados`, `avisos`) y `ResultadoDeshacer` (`restaurados`, `conservados`).
  - `src/lib/importar/csv.ts` (puro, sin DOM): `leerCsv(texto)` devuelve `{ filas, total, notas, errores }`. Tolera BOM, CRLF, delimitador `;` (si la primera línea tiene más `;` que `,`), coma decimal cuando el delimitador es `;`, vallas de markdown y líneas `#` (de ahí salen `# TOTAL=` y las notas `# DUDOSA:`). Cabecera sin acentos ni mayúsculas: `producto,cantidad,precio_total,tienda` y, al final, `fecha,codigo` opcionales. Máximo 1 MB, 500 filas, 120 caracteres de producto, 60 de tienda, `cantidad` 0,001–9.999, `precio_total` 1–50.000.000, `fecha` vacía o `YYYY-MM-DD` válida. Cualquier otra columna, fila corta o número inválido devuelve el número de línea y no deja importar.
  - `src/lib/importar/hash.ts`: `hashLote(texto, fecha)` con `crypto.subtle.digest("SHA-256")` sobre el texto normalizado (sin BOM, `\n`, extremos recortados) + `|` + fecha; devuelve 64 hex. Se usa con y sin sesión: el mismo valor va a `localStorage` y a `importar_compra` como `p_hash`, así que un archivo importado sin sesión tampoco se puede repetir después de iniciarla.
  - `src/lib/importar/emparejar.ts` (puro): misma regla que `emparejar_producto` —código, alias de la tienda, alias global, nombre normalizado— y la misma regla de presentación: si el nombre no coincide exactamente, es un producto nuevo. Sin sesión (no se publican precios) solo se usa para proponer rubro; con sesión la revisión manda las filas a `previsualizar_compra` y esa respuesta es la que vale.
  - `src/lib/importar/prompt.ts`: constante `PROMPT_FACTURA` con el texto del prompt; es la fuente única y el botón "Copiar prompt" la usa. `prompts/importar-gastos.md` reproduce el mismo texto para consultarlo fuera de la app, y `tests/unit/importar.test.ts` comprueba que el .md contiene `PROMPT_FACTURA` para que no deriven.
  - `src/app/presupuesto/acciones.ts`: `previsualizarCompra(filas)` (zod: ≤500 filas, strings recortados, fecha válida, `precio_total` entero), `importarCompra({ fecha, archivo, publicar, hash, filas })`, `listarImportaciones()`, `deshacerImportacion(id)` y `editarGasto(gasto)`; `agregarGasto` acepta `origen = 'importado'`, `cantidad` y `descripcion` (sin `lote_importacion`: al subir un gasto local el lote no existe en la nube). Traducen los `raise` de Postgres (`importacion_duplicada`, `limite_tiendas`, `limite_productos`, `nombre_invalido`, `precio_fuera_de_rango`, `hash_invalido`) a mensajes del catálogo de avisos, nunca a `error.message` crudo.
  - `src/components/importar/importar-factura.tsx` (`"use client"`): nueva pestaña **"Importar factura"** en `/presupuesto`, en tres pantallas. (1) Origen: zona de arrastre y selector que solo aceptan `.csv` (un `.xlsx` se rechaza con "Abre el Excel y guárdalo como CSV"; nunca se sube nada), o un `textarea` para pegar el CSV; botón "Copiar prompt" y explicación de tres líneas. (2) Revisión: tabla editable con producto, tienda, fecha, cantidad, precio total, precio por unidad calculado, rubro, unidad, promoción y "publicar precio"; agrupada por `tienda + fecha`; por grupo, total impreso opcional y aviso si la suma no cuadra (> 1 % o > 500 COP, sin bloquear); marca las tiendas y productos nuevos y pide confirmación antes de crearlos; si no hay sesión, oculta "publicar precios" y dice "inicia sesión para actualizar el catálogo". (3) Resultado: gastos, precios publicados, tiendas y productos creados, avisos y "Deshacer importación" (con confirmación en línea).
  - `src/components/importar/revision.tsx` y `src/components/importar/resultado.tsx` separados para que el parser y la tabla se prueben por partes; `src/components/importar/prompt.tsx` con el botón de copiar.
  - `src/lib/presupuesto/rubros.ts` (puro): mover ahí `grupoARubro` y corregirlo: `Proteínas → Carnes`, `Tubérculos → Verduras`, `Gourmet → Despensa`; el resto por nombre (`Granos`, `Frutas`, `Lácteos`, `Panadería`, `Despensa`, `Aseo`, `Bebidas`, `Mecato`, `Verduras`) y `Otros` solo si no hay coincidencia. `presupuesto-cliente.tsx` y la revisión lo importan del mismo sitio.
  - `src/lib/presupuesto/almacenamiento.ts`: `leerGastosLocal(mes)` / `guardarGastosLocal(mes, gastos)` con la clave actual `mercado-medellin:gastos:{mes}`, y `leerImportacionesLocal()` / `guardarImportacionesLocal()` con `mercado-medellin:importaciones` = `{ version: 1, lotes: [{ hash, fecha, filas, creado }] }`, todo en try/catch.
  - Arreglos de `/presupuesto` en el mismo paso (hoy los gastos nunca se sincronizan): al cambiar de mes, `listarGastos(mes)` si hay sesión y fusión por clave `(fecha, rubro, monto, descripcion)` con lo local; los gastos locales llevan `id` `local-<uuid>` y, al subir, se reemplazan por el id del servidor; `eliminarGasto` se ejecuta de verdad para ids del servidor (hoy todos empiezan por `local-` y nunca se borra nada); `editarGasto` permite corregir fecha, rubro, monto, tienda y nota y recalcula `mes = fecha.slice(0, 7)`; cada alta y cada importación usan `mes = fecha.slice(0, 7)`, no el mes seleccionado en pantalla; `SincronizarGastos` (patrón de `sincronizar-presupuesto.tsx`) sube los pendientes al iniciar sesión y avisa `gastos_sincronizados`.
  - `src/components/presupuesto/presupuesto-cliente.tsx`: pestaña nueva, gastos con tienda y descripción visibles, botón editar y borrar que sí funcionan, y el panel del prompt dentro de la pestaña.
  - `src/lib/datos.ts`: `catalogoTiendas()` devuelve tiendas con `manual`, `productos`, `precios`, `ultimaFecha` y `origen`, para `/presupuesto` (selector de tienda) y `/tiendas` (paso 35). `catalogo()` sigue igual.
  - `src/lib/datos.ts` (`usuario`) no cambia; la importación sin sesión escribe solo en `localStorage` y no toca el catálogo.
  - `src/lib/avisos.ts`: `importacion_lista`, `importacion_duplicada`, `importacion_error`, `importacion_deshecha`, `importacion_sin_cambios`, `factura_total_no_cuadra`, `tienda_creada`, `producto_creado`, `precio_publicado`, `precio_no_publicado`, `precio_mas_nuevo`, `gastos_sincronizados`, `gasto_editado` y `archivo_no_csv`.
  - `tests/importar/`: `d1.csv`, `barrio.csv`, `varias-tiendas.csv` (dos tiendas y dos fechas), `con-promocion.csv` y `malo.csv` (fila corta y precio con letras). Son **sintéticos** y se escriben a mano: viven fuera de `tests/fixtures/` a propósito, porque no son respuestas capturadas de un sitio sino entradas de prueba; llevan una cabecera `#` que lo dice y no pasan por `pnpm capturar`.
  - `blueprints/mercado-medellin/prompts/importar-gastos.md`: el prompt definitivo documentado, listo para pegar en cualquier IA con la foto o el PDF de la factura.
  - `pnpm gen:tipos` después de la migración.
- **Hecho cuando:**
  - `tests/unit/importar.test.ts`: BOM y CRLF no cambian las filas; `;` con coma decimal lee `12500,50` como 12.500,5; una cabecera sin `tienda` falla con la línea 1; una fila con 4 columnas cuando se esperan 5 falla con su número; 501 filas se rechazan; `# TOTAL=48200` llena `total` y no crea una fila; `# DUDOSA: falta un renglón` llega a `notas` y no a `filas`; el hash es igual para el mismo texto y fecha y distinto al cambiar la fecha; `grupoARubro("Proteínas") === "Carnes"`, `("Tubérculos") === "Verduras"` y `("Gourmet") === "Despensa"`; dos nombres con tilde y sin tilde emparejan con el mismo producto; `PROMPT_FACTURA` está contenido en `prompts/importar-gastos.md` (comparando sin CRLF).
  - pgTAP (`supabase/tests/importar_compras.test.sql`): `anon` no puede insertar en `tiendas` ni en `productos` y no ejecuta `importar_compra`; con sesión `crear_tienda('OLIMPICA')` y `crear_tienda('Olímpica')` devuelven el mismo id; la sexta tienda nueva del día falla con `limite_tiendas`; un producto nuevo nace con `grupo = 'Otros'`, `unidad = 'u'`, `unidad_base = 'u'`, `cantidad_base = 1`, `frecuencia = 'semanal'` y `revisado = false`; `importar_compra` crea gastos con `lote_importacion`, `cantidad`, `descripcion`, `mes = to_char(fecha,'YYYY-MM')` y `origen = 'importado'`; el precio queda con la **fecha de la factura** y no pisa un anotado más nuevo; dos líneas del mismo producto, tienda y fecha ponderan el precio con la suma de cantidades y totales; una línea con el mismo `codigo` de barras que un producto existente, o con el nombre ya usado en otra tienda, no crea un producto nuevo (y deja el alias de la tienda); una promoción no escribe `anotados` ni entra en `historial_minimo`; el mismo `p_hash` repetido falla con `importacion_duplicada` mientras el lote siga vigente y vuelve a entrar después de deshacerlo, y un hash que no es de 64 hex falla con `hash_invalido`; `deshacer_importacion` repone el anotado anterior, borra los gastos del lote y deja intacto un precio corregido después (lo reporta en `conservados`); el usuario B no puede deshacer el lote de A.
  - E2E `tests/e2e/importar.spec.ts`: elegir un `.xlsx` muestra "guárdalo como CSV" y no lee nada; pegar `varias-tiendas.csv` muestra dos grupos tienda+fecha; editar el precio de una fila y el rubro de otra se refleja en el resumen; guardar deja los gastos en `/presupuesto` y la tienda nueva en `/tiendas`; repetir el mismo CSV muestra `importacion_duplicada`; "Deshacer" borra los gastos, restaura el precio y deja volver a importar el mismo archivo; sin sesión la importación queda en el dispositivo y no aparece en `/tiendas`.
  - `pnpm migrar` sigue imprimiendo `precios=432 tiendas=4`; `select count(*) from productos` sigue en 144 y todos conservan su `nombre_norm`.
  - El gate (`pnpm typecheck && pnpm lint && pnpm test`) pasa.

**35. `/tiendas`: gestionar el catálogo compartido y fusionar duplicados.** *(cierre del pedido del 31-oct-2026: las tiendas y sus productos se administran desde la app)*
- **Depende de:** paso 34 (tablas, `crear_tienda`, `crear_producto` y `catalogoTiendas()`), paso 32 (`catalogo_tienda`) y paso 16 (`/anotados`).
- **Migración nueva `supabase/migrations/<ts>_fusionar_productos.sql`:**

  ```sql
  -- 31-oct-2026: fusionar dos productos sin perder precios, historial, gastos ni alias.
  create table fusiones_productos (
    id bigserial primary key,
    origen text not null,
    destino text not null,
    autor uuid references auth.users default auth.uid(),
    creado timestamptz not null default now(),
    check (origen <> destino)
  );
  create index on fusiones_productos (origen, creado desc);

  alter table fusiones_productos enable row level security;
  create policy leer on fusiones_productos for select using (true);
  -- Solo la función escribe la auditoría: no hay política ni grant de insert.
  revoke all on fusiones_productos from anon, authenticated;
  grant select on fusiones_productos to anon, authenticated;

  -- La única función `security definer` de la app: mueve filas hijas y borra el origen,
  -- algo que la RLS no puede expresar ("nadie borra productos" salvo una fusión).
  create function fusionar_productos(p_origen text, p_destino text) returns jsonb
  language plpgsql security definer set search_path = public as $$
  declare
    v_precios int; v_historial int; v_manual int; v_anotados int;
    v_gastos int; v_catalogo int; v_alias int; v_codigos int;
  begin
    if auth.uid() is null then raise exception 'sin_sesion'; end if;
    if p_origen = p_destino then raise exception 'mismo_producto'; end if;
    perform 1 from productos where id = p_origen;
    if not found then raise exception 'producto_no_existe'; end if;
    perform 1 from productos where id = p_destino;
    if not found then raise exception 'producto_no_existe'; end if;

    select count(*) into v_precios  from precios_actuales where producto_id = p_origen;
    select count(*) into v_historial from precios_historial where producto_id = p_origen;
    select count(*) into v_manual from precios_manuales_historial where producto_id = p_origen;
    select count(*) into v_anotados from anotados where producto_id = p_origen;
    select count(*) into v_gastos from gastos_reales where producto_id = p_origen;
    select count(*) into v_catalogo from catalogo_tienda where producto_id = p_origen;
    select count(*) into v_alias from producto_alias where producto_id = p_origen;
    select count(*) into v_codigos from producto_codigo where producto_id = p_origen;

    insert into precios_actuales (producto_id, tienda_id, precio, fecha, fuente, estado, nota, revisar, updated_at)
    select p_destino, tienda_id, precio, fecha, fuente, estado, nota, revisar, updated_at
    from precios_actuales where producto_id = p_origen
    on conflict (producto_id, tienda_id) do update
      set precio = excluded.precio, fecha = excluded.fecha, fuente = excluded.fuente,
          estado = excluded.estado, nota = excluded.nota, revisar = excluded.revisar,
          updated_at = excluded.updated_at
      where excluded.fecha >= precios_actuales.fecha;
    delete from precios_actuales where producto_id = p_origen;

    insert into precios_historial (producto_id, tienda_id, fecha, precio, estado)
    select p_destino, tienda_id, fecha, precio, estado
    from precios_historial where producto_id = p_origen
    on conflict (producto_id, tienda_id, fecha) do nothing;
    delete from precios_historial where producto_id = p_origen;

    insert into precios_manuales_historial
      (producto_id, tienda_id, precio, fecha, autor, creado, origen, cantidad, total, promocion, importacion_id)
    select p_destino, tienda_id, precio, fecha, autor, creado, origen, cantidad, total, promocion, importacion_id
    from precios_manuales_historial where producto_id = p_origen
    on conflict (producto_id, tienda_id, fecha) do nothing;
    delete from precios_manuales_historial where producto_id = p_origen;

    insert into anotados (producto_id, tienda_id, precio, fecha, autor)
    select p_destino, tienda_id, precio, fecha, autor
    from anotados where producto_id = p_origen
    on conflict (producto_id, tienda_id) do update
      set precio = excluded.precio, fecha = excluded.fecha, autor = excluded.autor
      where excluded.fecha >= anotados.fecha;
    delete from anotados where producto_id = p_origen;

    insert into producto_fuente (producto_id, tienda_id, url, termino, sku, factor, activo)
    select p_destino, tienda_id, url, termino, sku, factor, activo
    from producto_fuente where producto_id = p_origen
    on conflict (producto_id, tienda_id) do nothing;
    delete from producto_fuente where producto_id = p_origen;

    insert into catalogo_tienda (producto_id, tienda_id, activo, orden, autor, creado)
    select p_destino, tienda_id, activo, orden, autor, creado
    from catalogo_tienda where producto_id = p_origen
    on conflict (producto_id, tienda_id) do update
      set activo = catalogo_tienda.activo or excluded.activo,
          orden = least(catalogo_tienda.orden, excluded.orden);
    delete from catalogo_tienda where producto_id = p_origen;

    delete from producto_alias a using producto_alias b
      where a.producto_id = p_origen and b.producto_id = p_destino
        and a.alias_norm = b.alias_norm
        and a.tienda_id is not distinct from b.tienda_id;
    update producto_alias set producto_id = p_destino where producto_id = p_origen;
    update producto_codigo set producto_id = p_destino where producto_id = p_origen;

    insert into clima_causas (producto_id, fecha, texto, es_clima, fuente_url)
    select p_destino, fecha, texto, es_clima, fuente_url
    from clima_causas where producto_id = p_origen
    on conflict (producto_id, fecha) do nothing;
    delete from clima_causas where producto_id = p_origen;

    delete from importacion_cambios a using importacion_cambios b
      where a.producto_id = p_origen and b.producto_id = p_destino
        and a.importacion_id = b.importacion_id and a.tienda_id = b.tienda_id and a.fecha = b.fecha;
    update importacion_cambios set producto_id = p_destino where producto_id = p_origen;

    update gastos_reales set producto_id = p_destino where producto_id = p_origen;
    update alertas set producto_id = p_destino where producto_id = p_origen;

    -- Listas y planes guardan ids de producto: el que apuntaba al origen pasa al destino.
    update listas set items = (items - p_origen) || jsonb_build_object(p_destino,
        coalesce((items->>p_destino)::numeric, 0) + (items->>p_origen)::numeric),
      updated_at = now()
    where items ? p_origen;

    update listas_guardadas set items = (items - p_origen) || jsonb_build_object(p_destino,
        coalesce((items->>p_destino)::numeric, 0) + (items->>p_origen)::numeric),
      actualizada = now()
    where items ? p_origen;

    update planes_usuario set config = jsonb_set(config, '{items}',
        ((config->'items') - p_origen) || jsonb_build_object(p_destino,
          coalesce((config->'items'->>p_destino)::numeric, 0)
            + (config->'items'->>p_origen)::numeric)),
      actualizada = now()
    where jsonb_typeof(config->'items') = 'object' and config->'items' ? p_origen;

    insert into fusiones_productos (origen, destino, autor)
      values (p_origen, p_destino, auth.uid());
    delete from productos where id = p_origen;

    return jsonb_build_object('precios', v_precios, 'historial', v_historial,
      'manuales', v_manual, 'anotados', v_anotados, 'gastos', v_gastos,
      'catalogo', v_catalogo, 'alias', v_alias, 'codigos', v_codigos);
  end $$;
  revoke all on function fusionar_productos(text, text) from public, anon;
  grant execute on function fusionar_productos(text, text) to authenticated;
  ```

  Todo ocurre en una transacción: si una referencia inesperada impide borrar el origen, no se mueve nada. `historial_minimo` y `serie_pronostico` se recalculan solas; `importacion_cambios` se mueve antes de borrar para que el "deshacer" de un lote viejo siga funcionando; `listas`, `listas_guardadas` y `planes_usuario.config->'items'` cambian el id y suman la cantidad donde había dos filas del mismo producto. La fusión **no se puede deshacer automáticamente**: queda en `fusiones_productos` y la UI lo advierte antes de confirmar.
- **Hacer:**
  - `src/lib/tiendas/fusion.ts` (puro): `validarFusion(origen, destino)` (ids distintos y no vacíos), `textoFusion(origen, destino)` para la confirmación y `candidatosFusion(producto, productos)` que ordena por nombre normalizado igual y luego por palabras compartidas. Los candidatos son solo sugerencias: la fusión la decide la persona y el emparejamiento de facturas sigue siendo exacto.
  - `src/app/tiendas/page.tsx` (servidor): `await catalogoTiendas()` y `await usuario()`; pasa tiendas, productos, alias y precios. `metadata` "Tiendas y productos".
  - `src/components/tiendas/vista.tsx` (`"use client"`): buscador, resumen ("N tiendas · M productos · K en Otros"), tarjetas por tienda con color, `manual`/`origen`, número de productos con precio, última fecha y botón "Renombrar" (nunca "Borrar"). Botones "Nueva tienda" y "Nuevo producto" con hojas de formulario.
  - `src/components/tiendas/tabla-productos.tsx`: por tienda, tabla con producto, grupo, unidad, precio y fecha. Editar nombre, grupo, unidad, emoji y frecuencia en línea; el precio se cambia con la hoja `corregir-precio.tsx` del paso 27 (con autor y fecha), no con un `update` directo. Chip **"Por revisar"** cuando `grupo = 'Otros' and not revisado`; asignar grupo pone `revisado = true`.
  - `src/components/tiendas/dialogo-fusion.tsx`: elegir destino, ver qué se mueve (precios, historial, gastos, catálogo, alias, listas y planes) y confirmar con el nombre del producto origen escrito a mano. Si el destino no existe, se puede crear ahí mismo con `crearProducto`.
  - `src/app/tiendas/acciones.ts`: `crearTienda`, `renombrarTienda`, `crearProducto`, `editarProducto`, `marcarRevisado` y `fusionarProductos`, con zod (nombre 2–60 tienda / 2–120 producto, grupo, unidad, frecuencia `diaria|semanal`, emoji ≤ 8). `crearTienda` inserta con `origen = 'manual'` y color de la paleta; `crearProducto`, con `origen = 'manual'` y `revisado = true`. `renombrarTienda` traduce el choque de `tiendas_nombre_norm` a `nombre_repetido` y no deja crear "Olímpica" si ya existe "OLIMPICA". `fusionarProductos` llama el `rpc` y devuelve los conteos.
  - `src/lib/datos.ts` (`tablaAnotados`): devuelve solo tiendas con al menos un precio en `precio_efectivo`, salvo las automáticas (`manual = false`), que se muestran siempre aunque una fuente falle. Así una tienda nueva no agrega una columna vacía a 144 filas.
  - `src/components/encabezado.tsx`: enlace **"Tiendas"** junto a Anotados, con `data-tour="tiendas"`; `src/app/layout.tsx` no cambia.
  - `src/lib/avisos.ts`: `tienda_renombrada`, `tienda_nombre_repetido`, `producto_editado`, `producto_revisado`, `producto_fusionado`, `fusion_sin_datos`, `fusion_no_permitida` y `limite_tiendas` (si no existía).
  - `pnpm gen:tipos` después de la migración.
- **Hecho cuando:**
  - `tests/unit/fusion.test.ts`: `validarFusion` rechaza ids iguales o vacíos; `candidatosFusion` pone primero el nombre normalizado idéntico y no propone el propio producto; `textoFusion` nombra origen y destino.
  - pgTAP (`supabase/tests/fusion.test.sql`): `anon` solo lee `fusiones_productos` y no ejecuta `fusionar_productos`; con sesión, fusionar mueve precios actuales, historial, manuales, anotados, catálogo, alias, códigos, gastos y las entradas de `listas`, `listas_guardadas` y `planes_usuario` (sumando la cantidad), borra el producto origen y deja una fila en `fusiones_productos`; cuando origen y destino tienen el mismo día, gana el más nuevo o se conserva el destino sin duplicar; `producto_id` y `p_origen = p_destino` fallan sin mover nada; el producto fusionado ya no aparece en `productos` y su nombre viejo sigue emparejando por alias.
  - pgTAP (`supabase/tests/tiendas.test.sql`): con sesión se crea y se renombra una tienda; renombrar a un nombre que solo difiere en tilde o mayúscula falla con el índice único; `anon` no puede insertar ni actualizar; no hay política ni grant de `delete` en `tiendas` ni en `productos`.
  - E2E `tests/e2e/tiendas.spec.ts`: `/tiendas` lista las 5 tiendas sembradas y la creada en el paso 34; crear una tienda y un producto los muestra de inmediato en otro navegador con sesión (catálogo global); editar el grupo de un producto "Por revisar" lo saca del filtro; fusionar un duplicado mueve su precio y sus gastos y el producto viejo desaparece; `/anotados` no muestra la tienda manual sin precios; el enlace "Tiendas" del encabezado funciona en móvil.
  - `pnpm migrar` sigue imprimiendo `precios=432 tiendas=4`; una fusión no cambia los conteos de precios, solo el producto que los tenía.
  - El gate (`pnpm typecheck && pnpm lint && pnpm test`) y `pnpm test:e2e` pasan.

**36. Cargar una lista de mercado desde texto (prompt + lector fijo).** *(pedido del 31-oct-2026: pegar un listado como "Papas: 4 kg (aprox. 8 libras)" y verlo como lista en la pantalla principal)*
- **Depende de:** pasos 28 (listas guardadas y su sincronización), 34 (`producto_alias`, `emparejar_producto`, `crear_producto`) y 35 (`/tiendas` para corregir lo creado). **Sin migración y sin dependencias nuevas:** reusa `producto_alias` (alias global, `tienda_id = null`) y `listas_guardadas`.
- **Flujo:** la persona pega su texto en cualquier IA junto con el prompt de `prompts/importar-lista.md` (también visible en la app), recibe un CSV de formato fijo y lo pega en **Listas → Cargar lista**. **La app no lee texto libre ni llama a ninguna IA**: solo parsea el CSV con código determinista (misma regla del paso 30). El texto original nunca sale del navegador.
- **Contrato del CSV:** cabecera exacta `lista,producto,cantidad,unidad,nota`. `lista` es el encabezado de la sección ("1 semana", "2 semanas"; vacío = "Lista importada"); `cantidad` es un número con punto decimal; `unidad` es una de `kg`, `g`, `lb`, `l`, `ml`, `u`; `nota` es opcional (variedades, "aprox. 8 libras", "compra la mitad verdes"). Se toleran BOM, CRLF, `;`, coma decimal y vallas de markdown; el resto se rechaza con el número de línea. Límites: 200 filas y 200 ítems por lista, 5 secciones y 1 MB.
- **Conversión de unidades (`src/lib/importar/lista.ts`, puro):** `lb` = 500 g, `kg` = 1000 g, `l` = 1000 ml. La cantidad pedida se pasa a la unidad base del producto y el ítem de la lista es `ceil(pedido / cantidad_base)` en la unidad de compra: `lista.ts` calcula `precio × cantidad`, con el precio por presentación del producto (verificado el 31-oct-2026). Si la unidad pedida es de otra familia que la del producto (peso contra unidades) no se convierte: la fila queda en revisión con "unidad distinta" y la persona fija la cantidad. Los "aprox." entre paréntesis y los amarrados/puñados solo viajan en `nota`; nunca se usan para calcular.
- **Emparejamiento y revisión:** exacto, nunca por parecido, y en este orden: alias global, nombre normalizado. "Papas (Capira / Pastusa / Sabanera)" no empareja solo; en la revisión se elige el producto del catálogo, se crea uno nuevo (`crear_producto`, con los límites del paso 34) o se omite, y la elección queda en `producto_alias` para la próxima carga. Nada se carga sin pasar por la revisión; el cliente no escribe en el catálogo hasta confirmar.
- **Hacer:**
  - `src/lib/importar/lista.ts` (puro, sin React ni red): `leerListaCsv(texto)`, `aBase(cantidad, unidad)`, `itemDeProducto(producto, cantidad, unidad)` y `agruparPorLista(filas)`.
  - `src/lib/importar/prompt-lista.ts`: el prompt como constante; `prompts/importar-lista.md` y la app muestran el mismo texto (una prueba compara ambos).
  - `src/components/listas/cargar-lista.tsx` (`"use client"`): pegar o abrir `.csv` con `FileReader`, tabla de revisión editable (producto, cantidad, unidad, nota, omitir) por sección, y elegir qué hacer con cada sección: "Usar como mi lista" (reemplaza la activa, con confirmación), "Sumar a mi lista" o "Solo guardar".
  - La lista cargada **queda como lista activa** y se ve en la pantalla principal con el total por tienda igual que cualquier otra. "Guardar" pide nombre (por defecto la sección) y reusa `leerLocales` / `guardarLocales` (`src/lib/listas/guardadas.ts`) y `persistir` (`src/components/listas/almacen.ts`) del paso 28: con sesión en `listas_guardadas`, sin sesión en `mercado-medellin:listas`, con los mismos topes (20 listas, 200 ítems) y el mismo aviso `nombre_repetido`.
  - `src/app/listas/acciones.ts`: `registrarAliasLista` (zod, exige sesión) para las elecciones nuevas; sin sesión los alias solo viven en el dispositivo hasta iniciar sesión.
  - `src/lib/avisos.ts`: `lista_cargada`, `lista_csv_invalido`, `lista_unidad_distinta` y `lista_limite_filas`.
  - Tutorial (paso 33): agregar `data-tour="cargar-lista"` y un paso en el recorrido de `/listas`.
- **Hecho cuando:**
  - `tests/unit/lista-importar.test.ts`: con el ejemplo de papas, pepino, tomate, pimentón, cebolla morada y aguacate, `leerListaCsv` devuelve dos secciones; 8 lb → 4 kg; "aprox." no cambia el cálculo; una unidad de otra familia queda marcada; una cabecera distinta o una cantidad no numérica falla con el número de línea; un `.xlsx` se rechaza.
  - Prueba de contrato: `prompts/importar-lista.md` y `prompt-lista.ts` tienen el mismo texto.
  - E2E `tests/e2e/cargar-lista.spec.ts`: cargar el CSV de ejemplo → revisión → "Usar como mi lista" → la pantalla principal muestra los ítems y el total por tienda; sin sesión "Guardar" lo deja en `mercado-medellin:listas`; con sesión aparece en `/listas` desde otro navegador; repetir el nombre avisa `nombre_repetido`; el producto elegido en la revisión se empareja solo la segunda vez.
  - El gate (`pnpm typecheck && pnpm lint && pnpm test`) y `pnpm test:e2e` pasan.

## 11. Lanzamiento (manual, con tus cuentas)

1. **Proyecto en Supabase:** crearlo (plan gratis, región São Paulo), luego `pnpm exec supabase link`, `pnpm exec supabase db push` y `pnpm migrar` con las variables de producción.
2. **Correo:** en Supabase Auth → SMTP, poner smtp.gmail.com:465 con la contraseña de aplicación y dejar la confirmación por correo activa. En Auth → URL Configuration, poner como *Site URL* el dominio de Vercel y agregar `https://<dominio>/**` (y `http://localhost:3000/**`) a las *Redirect URLs*; sin esto, los enlaces de confirmación y de recuperación del paso 14 llevan a localhost. **Si el enlace del correo abre `localhost`, ver el paso 26.** Comprobar en producción: registrarse con un correo real y abrir el enlace desde el celular.
3. **Vercel:** importar el repo y configurar las dos variables `NEXT_PUBLIC_*` y `ENABLE_EXPERIMENTAL_COREPACK=1`, más `GITHUB_REPO` y `GITHUB_DISPATCH_TOKEN`. El token se crea en GitHub → Settings → Developer settings → Fine-grained tokens: solo este repositorio, permiso **Actions: Read and write** y vencimiento de 1 año (anotar la fecha para renovarlo).
4. **GitHub:** usar un repo **privado**, cargar los secrets de la sección 6 y lanzar `workflow_dispatch` una vez. Comprobar que aparece una fila nueva en `corridas` y que llega el correo si alguna tienda falla.
5. **Seguimiento:** a la semana, revisar en el panel de Supabase que el proyecto no se pausó.
6. **Contexto del pronóstico:** después de la primera corrida, comprobar en `contexto_mercado` que hay hasta 13 filas con `ipc_alimentos` no nulo y el `mes` del último dato publicado. Si la descarga falló, la app muestra "sin contexto DANE", el pronóstico baja su confianza a "media" y el motivo queda en `corridas.notas`; no se escribe un valor a mano.
7. **Tiendas retiradas:** en el proyecto de producción, comprobar que `select count(*) from tiendas` da 5 y que `precios_actuales` tiene 432 filas; que `listas` y `listas_guardadas` no conservan `tienda_preferida` de una tienda retirada; y que el encabezado dice "X/3 fuentes OK". Si alguna tienda reaparece, el filtro `TIENDAS_RETIRADAS` de `scripts/migrar.ts` no se aplicó en la carga.
8. **Importación y catálogo compartido:** con una cuenta real, subir `tests/importar/varias-tiendas.csv`, revisar que aparecen las dos tiendas y sus precios en `/tiendas` y en `/anotados` desde otro navegador; repetir el mismo archivo y comprobar `importacion_duplicada`; deshacer y verificar que los precios vuelven y los gastos desaparecen, y que el mismo archivo se puede volver a importar; fusionar un producto duplicado en `/tiendas` y comprobar que el precio y los gastos quedan en el destino. Sin sesión, el mismo CSV debe quedar solo en el dispositivo.
9. **Barrio y tutorial en un dispositivo real:** entrar desde un celular nuevo y comprobar que el tutorial aparece una sola vez, que la bombilla está abajo a la izquierda, que no tapa "Guardar lista" ni la barra del carrito, y que "Reiniciar tutorial" lo vuelve a mostrar. En `/anotados/barrio`, comprobar que el progreso arranca en "0/41 con precio" y que un precio anotado desde el celular se ve en la web.

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| Un sitio cambia o bloquea | Estado `fallo`, correo al admin, SKU guardado, fixtures en las pruebas |
| GitHub retrasa o salta el cron | Banner a las 26 h, `/api/salud`, `workflow_dispatch` para correrla a mano |
| Errores de unidades | `unidad_base`, `normalizar` devuelve `null` si no puede convertir, `revisar` en saltos de más de 35 % |
| Registro abierto | Cada anotado tiene autor y se puede revertir. Aceptado |
| Pausa del plan gratis de Supabase | La corrida escribe en la base a diario; revisar en el panel |
| exceljs sin mantenimiento | Solo lee un xlsx público; se puede cambiar de librería sin tocar el resto |
| La redacción de SIPSA cambia | El clima solo se marca con coincidencia explícita; si no, "causa no reportada" |
| Abuso del botón "Actualizar precios" | Exige sesión, el servidor vuelve a comprobar que los datos estén viejos (> 26 h), no dispara si hay una corrida en cola o en curso, y el workflow tiene `concurrency`. A lo sumo, una corrida extra por día |
| Fuga o vencimiento del token de GitHub | *Fine-grained*, de un solo repo y solo Actions; vive solo en el servidor de Vercel. Si vence, el botón muestra `actualizacion_fallo` y la corrida diaria sigue igual (usa el token propio del workflow) |
| Exceso de toasts | Catálogo cerrado, máximo 3 visibles, ninguno por agregar o quitar productos y resumen una vez al día |
| Enlaces de confirmación y recuperación que abren `localhost` o fallan en otro navegador | Site URL y Redirect URLs bien puestas, plantillas con `token_hash` (no PKCE), pruebas e2e con Mailpit y comprobación manual desde el celular (paso 26) |
| Términos de uso de las tiendas | 1 consulta por producto al día, pausa de 1 s, User-Agent propio, robots.txt respetado |
| Una corrección equivocada se propaga a toda la app | Queda con autor y fecha, solo su autor la quita, `precios_actuales` nunca se toca y al quitarla se borra la observación de hoy (las anteriores quedan) |
| Dos personas corrigen el mismo producto y tienda el mismo día | `unique (producto_id, tienda_id, fecha)` + upsert: la última gana y no se duplica la fila; la UI muestra la fecha, no un nombre |
| El pronóstico se lee como una promesa de precio | Rótulo "estimación estadística", rango y confianza siempre visibles, tope de 92 %, no entra en totales, alertas, PDF ni tablas de precios |
| Un producto o tienda mal creado afecta a todos | Nombre normalizado único, topes diarios (5 tiendas, 50 productos), nacen "por revisar", nadie borra, `fusionar_productos` queda auditada en `fusiones_productos` |
| Una factura importada cambia totales y alertas de todos | La revisión lo avisa antes de guardar, las promociones no pisan el precio ni el mínimo, no pisa un precio más nuevo, "deshacer" restaura solo si nadie lo cambió |
| Un CSV mal formado o repetido | Cabecera exacta, error con número de línea, hash por usuario, límites de filas y tamaño validados otra vez en el servidor |
| Una lista cargada desde texto trae un producto equivocado | Sin emparejamiento por parecido: revisión obligatoria, alias solo por elección de la persona, unidad de otra familia queda sin convertir |
| El DANE cambia el formato o la URL del anexo del IPC | La corrida no se cae: conserva la última fila de `contexto_mercado`, anota el motivo en `corridas.notas` y el pronóstico baja a confianza "media" con el motivo "sin contexto DANE" |
| La fusión al iniciar sesión pisa listas o planes del dispositivo | Gana la `actualizada` más reciente, lo local se respalda antes de reemplazarlo y `plan_restaurado` / "Deshacer" lo repone; topes de 20 listas, 200 ítems y 50 rubros |
| Una tienda retirada reaparece al volver a migrar | `TIENDAS_RETIRADAS` filtra las 5 tiendas en todas las cargas de `scripts/migrar.ts`; el retiro se prueba corriendo `db reset && migrar` dos veces |
| Listas con `tienda_preferida` apuntando a una tienda retirada | La migración del paso 31 actualiza las filas y cambia el default a `d1`; `alertas-usuario.ts` cae en `d1`, nunca en `exito` |
| El catálogo de barrio se queda con precios viejos o vacío | Etiqueta `actualizar` a los 14/30 días, alerta `precio_manual_vencido` solo para productos de la lista y progreso "N/41" visible en `/anotados` y `/anotados/barrio` |
| Alguien borra productos del catálogo de barrio y se pierden precios | "Quitar" solo pone `activo = false`; no hay `delete` desde la app y el historial de precios se conserva |
| El catálogo de barrio se llena de precios inventados | No se siembra ningún precio, todos entran por `corregir_precio` con autor y fecha, y la UI dice "solo anotados" hasta que exista un dato real |
| El tutorial tapa la app, se repite o estorba | Se muestra una vez por dispositivo, se cierra con `Esc` o "Saltar", el foco queda atrapado, no entra en rutas de auth, respeta `prefers-reduced-motion` y los tips no se suman encima |
| El tutorial se desactualiza cuando cambia una pantalla | Los pasos se buscan por `data-tour`; si el objetivo no existe, el paso se salta, y el e2e recorre el general y una pantalla |
| Una factura importada pisa precios que usa todo el mundo | Revisión obligatoria antes de guardar, interruptor "publicar precios", fecha de la factura, nunca pisa un anotado más nuevo, promociones fuera del precio vigente y de `historial_minimo`, y "deshacer" con foto del valor anterior |
| El catálogo abierto se llena de tiendas y productos duplicados | Nombre normalizado único, `on conflict` que devuelve el existente, alias por tienda y código de barras, fusión en `/tiendas`, topes de 5 tiendas y 50 productos por usuario y día, y nada se borra sin fusionar |
| Un mismo archivo se importa dos veces y duplica los gastos | Hash del lote + fecha con índice único `(user_id, hash) where deshecho is null`; sin sesión, la misma clave en `localStorage`. Se bloquea con un mensaje que dice cuándo se importó, y después de deshacer se puede repetir |
| Deshacer una importación borra un precio que alguien ya corrigió | Solo restaura si el anotado sigue con el precio y la fecha del lote; si cambió, lo conserva y lo reporta en `conservados` |
| Un CSV enorme o mal formado bloquea la app | Límites de 1 MB y 500 filas, parser con número de línea, rechazo de `.xlsx` y de columnas extra, y validación otra vez en el servidor |
| Una importación masiva dispara alertas y cambia el pronóstico de todos | Los precios entran a `precio_efectivo` y a `historial_minimo`; la revisión lo advierte antes de guardar, las promociones quedan fuera de la serie y el lote no genera alertas por sí mismo |
| Los nombres de tienda mezclan sucursales | El prompt pide la cadena sin dirección ni sucursal; una tienda es una cadena y el NIT o la dirección no se guardan |
| Un producto fusionado reaparece en la siguiente factura | Los alias y códigos se mueven al producto destino; el nombre viejo sigue emparejando con el destino y el origen queda registrado en `fusiones_productos` |
| Cualquier cuenta con sesión edita el catálogo que ven todos | El nombre es único, nada se borra sin fusionar, cada alta y cada edición deja `creado_por`/`creado`, la fusión queda auditada, los topes diarios frenan una carga masiva y la UI nunca ofrece "borrar" tiendas ni productos |
| `fusionar_productos` es `security definer` y puede borrar un producto | Solo `authenticated` la ejecuta, mueve todas las filas hijas antes de borrar (una referencia inesperada aborta la transacción), la persona escribe el nombre del origen para confirmar y queda una fila en `fusiones_productos` con autor y fecha |
| Un CSV repite el mismo producto en dos líneas o dos lotes el mismo día | El precio del día se pondera con la suma de cantidades y totales del lote; el gasto queda uno por línea; `importacion_cambios` guarda el valor anterior a todo el lote para que "deshacer" lo reponga completo |
