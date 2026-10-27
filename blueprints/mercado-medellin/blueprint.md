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

La app compara los precios de 144 productos de mercado en 8 tiendas de Medellín: Éxito, Carulla, D1, Euro, La Minorista (SIPSA), Ara, Ísimo y PriceSmart. Tiene además 1 tienda manual: Tienda/Carnicería de barrio. Desde el paso 21 suma La Vaquita (automática); La Mayorista Medellín quedó pendiente de decisión. Solofruver se descartó el 27-oct-2026 (paso 20). Con eso arma la lista de la familia, calcula cuál es la mejor tienda y el óptimo dividido, genera alertas y muestra el historial. También marca ↑/↓ cuando un precio sube o baja, muestra la causa climática según el DANE/SIPSA e incluye una sección de productos en fluctuación.

- La lectura es pública, sin sesión.
- El registro es abierto, con email y contraseña.
- **Objetivo n.º 1:** que la base de datos se actualice sola y que ningún fallo pase en silencio.

**Fuera de la v1:**
- Push web, Telegram o WhatsApp.
- Resumen diario por correo.
- Login con Google.
- Ara, Ísimo y PriceSmart automáticos (siguen por anotados).
- Éxito y Carulla automáticos (siguen por anotados). Decidido el 26-oct-2026: su robots.txt prohíbe `/api/` y Cloudflare responde 429 al User-Agent propio en las páginas `/p`. No se esquiva.
- Rappi y folletos PDF.
- Pantalla para aprobar revisiones.
- IA o LLM.
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
src/app/                 rutas: / (canasta), antojos, hogar, dieta, anotados, alertas, producto/[id],
                         ingresar, registro, recuperar, api/salud
src/components/          catalogo/, carrito/, detalle/, graficos/, ui/ (shadcn)
src/lib/                 supabase/{server,client,tipos}.ts, precios/{lista,etiquetas}.ts,
                         alertas/reglas.ts, unidades.ts, fecha.ts, datos.ts
src/corrida/             orquestador.ts, normalizar.ts, admin.ts, alertas-usuario.ts, correo.ts,
                         adaptadores/{vtex,euro,sipsa}.ts
src/data/planes.ts       portado de data/origen/constantes-artifact.js
src/proxy.ts             refresco de sesión (Next 16: proxy, no middleware)
scripts/                 cargar-env.ts, env-local.ts, humo.ts (ya en workspace/), migrar.ts,
                         corrida.ts, capturar-fixtures.ts
supabase/migrations/     0001_esquema.sql
supabase/tests/          rls.test.sql (pgTAP)
tests/unit|integracion|e2e|fixtures/
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
- **Tiendas:** 10, con id, nombre, color y manual. Salen de `TIENDAS` en `data/origen/constantes-artifact.js`.
- **Precios actuales:** 144 × 8 = **1.152** filas desde `precios.json`. Si `fuente` empieza por `http`, además se hace upsert de `producto_fuente.url`.
- **Historial:** una fila por (fecha, tienda) con precio numérico de cada `serie`, conservando el `estado`, incluido `simulado`.
- **Estado de tiendas y corridas:** `tienda_estado` y una fila en `corridas` salen de `meta.json`.
- **Anotados:** `anotados.json` está vacío hoy; si trae datos, se cargan con `autor = null`.

## 5. Reglas de negocio (exactas)

**Precio efectivo.** Es la vista `precio_efectivo`. El anotado gana si el automático no es válido, si no es `real` o si el anotado es igual o más reciente. El precio es `null` cuando el estado es `sin_dato`.

**Cálculos de la lista.** La lista es `{id: cantidad}`, y estas funciones viven en `src/lib/precios/lista.ts`:
- Total por tienda visible y faltantes de cada una.
- **Mejor tienda completa:** la más barata entre las que tienen todos los productos.
- **Óptimo dividido:** cada producto en su tienda más barata.
- **Ahorro:** mejor tienda completa − óptimo dividido.

**Alertas** (`src/lib/alertas/reglas.ts`): se ordenan por monto; se muestran 5 y un botón "ver todas".

| Alerta | Cuándo salta | Para quién / monto |
|---|---|---|
| `mas_barato` | Otra tienda es ≥10 % y ≥ `umbral_ahorro` (por defecto 1000) más barata que la tienda preferida | Monto = diferencia × cantidad |
| `mercado_completo` | Otra tienda completa sale ≥5 % más barata | |
| `subida` | El precio supera en ≥15 % el promedio de los 7 puntos previos | |
| `caro_por_clima` | `subida` y además existe una `clima_causas.es_clima` de los últimos 7 días | |
| `fuente_caida` | Una tienda automática quedó en `fallo` o lleva ≥3 días sin `ultimo_ok` | Solo correo al admin |

**Etiquetas** (`src/lib/precios/etiquetas.ts`):
- **↑/↓:** precio actual contra el promedio de los 7 días previos, con umbral de ±15 %.
- **🌧️ clima:** hay una causa `es_clima` en los últimos 7 días.
- **sin dato**, **anotado**, **estimado**, **mayorista** (cuando la fuente es SIPSA) y **revisar** (`revisar = true`).
- **desactualizado:** cuando `hoy − fecha > (1 si diaria · 7 si semanal) + 3` días.
- **En fluctuación:** cambio de ≥15 % en 7 días, o coeficiente de variación ≥ 0.12 en 30 días.

**Clasificador de clima.** No usa IA. Es una regex que ignora mayúsculas y acentos, aplicada a la frase de Medellín:
`lluvia|lluvioso|invierno|ola invernal|verano|sequ[ií]a|helada|clima|clim[aá]tic|fen[oó]meno de (la )?ni[nñ]a|el ni[nñ]o|temporal|inundaci`.
- El texto se guarda literal.
- La UI dice "Causa según DANE (SIPSA)" o "causa no reportada".
- **Nunca se inventa un precio ni una causa.**

## 6. La corrida (`scripts/corrida.ts` → `src/corrida/orquestador.ts`)

1. **Qué productos toca:** todos los días los grupos de frecuencia diaria. Los lunes, o con `--todo`, también los semanales. El orden de prioridad es frescos → proteínas, lácteos y granos → despensa, panadería y aseo → antojos.
2. **Cómo consulta:** las tiendas van en paralelo, y dentro de cada tienda las consultas son secuenciales con ≥1 s de pausa. El User-Agent es `CORRIDA_USER_AGENT`. Respeta robots.txt: Ísimo no tiene adaptador, y en Euro solo se leen páginas `/p`. Nunca salta captchas ni logins.
3. **VTEX** (solo D1; Éxito y Carulla quedaron por anotados, ver §1):
   - Consulta: `GET https://www.<host>/api/catalog_system/pub/products/search?ft=<termino>&_from=0&_to=4`.
   - **Cambio del 26-oct-2026:** la corrida solo hace consultas exactas: `?fq=alternateIds_RefId:<n>` con el número final de la URL `/p` (91 productos) o, si no hay URL `/p`, `?fq=skuId:<sku>`. La búsqueda por término ya no se usa: en D1 devolvía otro producto ("arveja" → arveja seca 500 g, "maiz" → Maizena) y su SKU quedaba fijado. Los 12 productos que solo tenían término siguen por anotados hasta que alguien les ponga su URL `/p` o su SKU.
   - Precio = `items[0].sellers[0].commertialOffer.Price`. Se descarta si `AvailableQuantity` es 0 o el precio es 0.
   - El `skuId` encontrado se guarda.
4. **Euro:** lee la página `producto_fuente.url` (`/p`) y saca el precio del `<script type="application/ld+json">` (`offers.price`) o, si no está, del `__STATE__`. Usa cheerio.
5. **SIPSA:**
   - Busca `https://www.dane.gov.co/files/operaciones/SIPSA/anex-SIPSADiario-<dd><mmm><aaaa>.xlsx` y el PDF `bol-SIPSADiario-…pdf`, con el mes en español abreviado y en minúscula (ene … dic). Prueba hoy y hasta 3 días atrás.
   - Del xlsx (exceljs) toma las filas de Medellín (Central Mayorista de Antioquia), en $/kg.
   - Del PDF (unpdf) toma las frases que mencionan Medellín y el producto, y las escribe en `clima_causas`.
   - Solo aplica el dato si es más nuevo que el guardado. Usa `fuente = "SIPSA (mayorista)"` y la fecha del boletín.
6. **Normalización** (`normalizar.ts`): si la unidad del hallazgo no es la del producto, devuelve `null`. Si no, calcula `v = precio × cantidad_base / cantidad_hallazgo` y redondea a la centena cuando hubo conversión.
7. **Validación y escritura:**
   - Un cambio de más de 35 % frente al último precio real se escribe igual, pero con `revisar = true`.
   - Si no hubo hallazgo, no se toca `precios_actuales`.
   - Se hace upsert de `precios_actuales` (estado `real`, `fecha = hoyBogota()`) y de `precios_historial` (`on conflict (producto_id, tienda_id, fecha) do update`).
   - Al final se inserta la fila en `corridas` y se hace upsert de `tienda_estado`:
     - **ok:** más del 50 % de los productos que se intentaron en esa tienda.
     - **parcial:** al menos 1.
     - **fallo:** 0.
   - `ultimo_ok` = hoy si quedó ok o parcial.
8. **Alertas por usuario:** se calculan para cada usuario con lista. Antes se borran las no leídas del mismo tipo y producto del mismo día, para que repetir la corrida no las duplique.
9. **Correo al admin:**
   - Se envía **un** correo a `ADMIN_EMAIL` si hubo `fuente_caida` o una excepción.
   - Usa nodemailer con SMTP 465 y `secure: true`.
   - Si falta configuración SMTP, solo lo registra en consola.
10. **Idempotencia y exit code:**
   - Correrla dos veces el mismo día deja el mismo estado.
   - Sale con exit 0 aunque haya tiendas en fallo; exit 1 solo ante una excepción no controlada (y GitHub avisa por correo).
11. **Pruebas:** usan un `fetch` inyectado que sirve fixtures **reales**, capturados con `pnpm capturar <vtex|euro|sipsa>` y guardados en `tests/fixtures/<tienda>/`. Nunca se escriben a mano.

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
- "Actualizado: hoy 6:06 a. m.", un punto de color por tienda automática y "X/3 fuentes OK" (D1, Euro y La Minorista; las manuales no cuentan).
- Las tiendas con `ultimo_ok` ausente o de hace ≥3 días.
- **Banner rojo** si la última corrida tiene más de 26 h, con el botón **"Actualizar precios"** (paso 14).
- **Notificaciones (toasts):** catálogo, reglas y resumen del día en el paso 14.
- Campana de alertas: solo con sesión, alimentada por Realtime sobre `alertas`.

**La lista:**
- Sin sesión vive en `localStorage`, siempre dentro de try/catch.
- Con sesión se guarda en `listas` mediante una server action.
- Al iniciar sesión, la lista local se fusiona con la guardada.

**Anotados:**
- Tabla producto × tienda, incluidas las manuales, con el precio más bajo resaltado en azul.
- La escritura usa zod (entero entre 100 y 10.000.000) y requiere sesión.

**Hogar y Dieta:** el contenido sale de `data/origen/*`, portado a `src/data/planes.ts`. Tienen botones "Usar como mi lista" y "Sumar a mi lista".

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
- **Hecho cuando:** CUANDO corre `pnpm migrar`, EL SISTEMA DEBE imprimir `productos=144 precios=1152 tiendas=10` y salir con 0. El script compara él mismo cada conteo contra el JSON de origen y aborta si no coincide.

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

**6. Adaptador Euro.**
- **Hacer:** `adaptadores/euro.ts` con su prueba sobre fixtures reales de páginas `/p`.
- **Hecho cuando:** extrae `offers.price`, y no hace ninguna petición a rutas prohibidas por robots (la prueba lo comprueba con el `fetch` espía).

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
- **Catálogo de avisos.** Los pasos 16, 17 y 18 usan las claves de su fila; si hace falta un aviso nuevo, se agrega aquí primero.

  | Clave | Cuándo | Tipo | Texto |
  |---|---|---|---|
  | `sesion_iniciada` | Ingreso correcto | éxito | "Hola de nuevo." |
  | `registro_ok` | Registro enviado | éxito | "Cuenta creada. Revisa tu correo para confirmarla." |
  | `credenciales_malas` | Ingreso rechazado (también va junto al formulario) | error | "Correo o contraseña incorrectos." |
  | `recuperar_enviado` | Recuperar contraseña | info | "Si el correo está registrado, te enviamos un enlace." |
  | `clave_cambiada` | Nueva contraseña guardada | éxito | "Contraseña actualizada." |
  | `sesion_cerrada` | Salir | info | "Sesión cerrada. Tu lista queda en este dispositivo." |
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
  - **Lo prohíbe o la tienda no tiene precios públicos:** queda como tienda `manual` (solo anotados), igual que Éxito y Carulla, y el motivo se escribe en `decisiones.md`.
  - En ambos casos: migración que inserta la tienda; el contador del encabezado "X/N fuentes OK" cuenta solo las automáticas.
- **Resultado (27-oct-2026):**
  - **La Vaquita: automática.** Magento; el `robots.txt` solo prohíbe la búsqueda, el carrito y los parámetros, no las páginas de producto. Adaptador `vaquita.ts` (ld+json, como Euro), 40 productos mapeados a mano en `data/fuentes/vaquita.json` (sembrados por `pnpm migrar`; la tienda entra por la migración `20261027150000_tienda_vaquita.sql`). Frutas, verduras y cortes por kilo con presentación ambigua quedan sin mapear. Comprobación contra el sitio real: 40/40 con precio.
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
- **Hecho cuando:** pasa el e2e `tests/e2e/lista-vista.spec.ts` con 15 productos de 3 tiendas: (1) "Por tienda" muestra 3 secciones con subtotales cuya suma es el total; (2) plegar una sección oculta sus filas y deja `aria-expanded="false"`; (3) cambiar a "Por grupo" y "Todo" conserva las cantidades; (4) el resumen sigue visible al desplazar la lista; (5) no hay desplazamiento horizontal en 360 px.

**25. Exportar la lista a PDF.**
- **Depende de:** pasos 21 y 24 (misma agrupación y mismas tiendas).
- **Hacer:**
  - Botón **"Descargar PDF"** debajo de la lista (visible solo con ≥1 producto), en `carrito.tsx` y en la hoja móvil.
  - Contenido: título "Lista de mercado", fecha (`hoyBogota()`) y una tabla por tienda del óptimo dividido con columnas **Producto · Cantidad · Precio unitario · Subtotal**, el subtotal por tienda y el total general al final. Los precios desactualizados o anotados llevan una marca (`*`) y una nota al pie; los productos sin precio van en una tabla aparte "Sin precio". Nunca se inventa un precio (regla 7).
  - Generación 100 % en el navegador con `jspdf` + `jspdf-autotable`, cargados con `import()` dinámico solo al pulsar. **Dependencia nueva:** se agrega a §2 y a la lista permitida de la regla 9, con versión verificada contra npm (usar el `stack-researcher`) antes de instalarla. Las filas se arman en una función pura `src/lib/precios/exportar.ts` (sin React ni jsPDF) con su prueba.
  - Nombre del archivo: `lista-mercado-<aaaa-mm-dd>.pdf`; las tildes, la ñ y el `$` salen bien (formato `pesos()`).
- **Hecho cuando:**
  - `tests/unit/exportar.test.ts`: dada una lista y precios, la función devuelve las filas por tienda con subtotales y total correctos, marca los anotados y desactualizados, y separa los "sin precio".
  - E2E `tests/e2e/pdf.spec.ts`: con 3 productos, pulsar "Descargar PDF" dispara una descarga cuyo nombre cumple `lista-mercado-\d{4}-\d{2}-\d{2}\.pdf` y el archivo empieza con `%PDF`.

## 11. Lanzamiento (manual, con tus cuentas)

1. **Proyecto en Supabase:** crearlo (plan gratis, región São Paulo), luego `pnpm exec supabase link`, `pnpm exec supabase db push` y `pnpm migrar` con las variables de producción.
2. **Correo:** en Supabase Auth → SMTP, poner smtp.gmail.com:465 con la contraseña de aplicación y dejar la confirmación por correo activa. En Auth → URL Configuration, poner como *Site URL* el dominio de Vercel y agregar `https://<dominio>/**` (y `http://localhost:3000/**`) a las *Redirect URLs*; sin esto, los enlaces de confirmación y de recuperación del paso 14 llevan a localhost.
3. **Vercel:** importar el repo y configurar las dos variables `NEXT_PUBLIC_*` y `ENABLE_EXPERIMENTAL_COREPACK=1`, más `GITHUB_REPO` y `GITHUB_DISPATCH_TOKEN`. El token se crea en GitHub → Settings → Developer settings → Fine-grained tokens: solo este repositorio, permiso **Actions: Read and write** y vencimiento de 1 año (anotar la fecha para renovarlo).
4. **GitHub:** usar un repo **privado**, cargar los secrets de la sección 6 y lanzar `workflow_dispatch` una vez. Comprobar que aparece una fila nueva en `corridas` y que llega el correo si alguna tienda falla.
5. **Seguimiento:** a la semana, revisar en el panel de Supabase que el proyecto no se pausó.

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
| Términos de uso de las tiendas | 1 consulta por producto al día, pausa de 1 s, User-Agent propio, robots.txt respetado |
