# Mercado Medellín

Compara precios de 144 productos de mercado en **5 tiendas de Medellín** —D1, La Minorista (SIPSA), La Vaquita, PriceSmart y Tienda/Carnicería de barrio—, arma la lista de la familia y avisa cuando la corrida diaria falla. Web pública de lectura (Next.js) + corrida diaria en GitHub Actions + Supabase. Los precios se pueden corregir a mano, las listas de mercado se guardan con nombre, Hogar y Dieta son editables, los frescos traen un pronóstico a 7 días y un tutorial con GSAP explica cada pantalla una vez por dispositivo. Éxito, Carulla, Euro, Ara e Ísimo se retiraron el 30-oct-2026: la familia no merca allí.

## Comandos

| Tarea                                                                  | Comando                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Instalar                                                               | `pnpm install --frozen-lockfile`                                                     |
| Servidor de desarrollo                                                 | `pnpm dev` — http://localhost:3000                                                   |
| Build                                                                  | `pnpm build`                                                                         |
| Humo (sobre el último `pnpm build`: `next start` :3100 + una petición) | `pnpm humo` · `pnpm humo --ruta producto/aceite --contiene "Aceite"`                 |
| Typecheck                                                              | `pnpm typecheck`                                                                     |
| Lint / formato                                                         | `pnpm lint` · `pnpm format`                                                          |
| Pruebas                                                                | `pnpm test` · un archivo: `pnpm test tests/unit/lista.test.ts`                       |
| E2E + accesibilidad                                                    | `pnpm test:e2e`                                                                      |
| Supabase local (Docker)                                                | `pnpm exec supabase start` · `pnpm exec supabase stop` · `pnpm exec supabase status` |
| Reiniciar base local                                                   | `pnpm exec supabase db reset` y luego `pnpm migrar`                                  |
| Pruebas RLS (pgTAP)                                                    | `pnpm exec supabase test db`                                                         |
| Generar `.env.local`                                                   | `pnpm env:local`                                                                     |
| Cargar datos del artifact                                              | `pnpm migrar`                                                                        |
| Tipos de la base                                                       | `pnpm gen:tipos`                                                                     |
| Corrida de precios                                                     | `pnpm corrida` · `pnpm corrida --todo` · `pnpm corrida --ayuda`                      |
| Capturar fixtures reales                                               | `pnpm capturar vtex` · `pnpm capturar sipsa` · `pnpm capturar vaquita`               |

**Gate:** `pnpm typecheck && pnpm lint && pnpm test` pasa antes de marcar cualquier tarea como hecha.
Desde el paso 2, Supabase local debe estar arriba (`pnpm exec supabase status` sale 0).

Node fijado en `.nvmrc` (24.22.1); pnpm en `packageManager`. Versiones de dependencias: el lockfile.

## Stack

Next.js 16 App Router · React 19 · TypeScript 6 · Tailwind v4 + shadcn (radix) · Supabase (Postgres + RLS + Auth + Realtime) · sin ORM · Recharts · GSAP · react-hot-toast · Vitest + Playwright · Biome · Vercel + GitHub Actions.

## Arquitectura

**Petición web.** navegador → `src/proxy.ts` (refresca la sesión con `getClaims()`) → `src/app/<ruta>/page.tsx` (server component) → `src/lib/datos.ts` → `src/lib/supabase/server.ts` (clave publicable + cookies) → PostgREST con RLS. Las mutaciones son server actions (`src/app/**/acciones.ts`) que validan con zod y usan el cliente de sesión: RLS decide.

**Corrida diaria.** `.github/workflows/corrida.yml` (cron `17 11 * * *` UTC = 6:17 a. m. Bogotá) → `pnpm corrida` → `scripts/corrida.ts` → `src/corrida/orquestador.ts` → adaptadores (`vtex.ts`, `sipsa.ts`, `vaquita.ts`) → upserts con `src/corrida/admin.ts` (service role) → `alertas-usuario.ts` → `correo.ts` (un correo al admin si algo falló). Solo hay tres fuentes automáticas; PriceSmart y Tienda/Carnicería de barrio son manuales.

| Capa                              | Puede importar                                             | Nunca                                                                                |
| --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `src/app/**`, `src/components/**` | `@/lib/**`, `@/components/**`, `@/data/**`                 | `@/corrida/**`, la service role key                                                  |
| `src/lib/**`                      | `@/lib/**`, `@/data/**`                                    | React en `lib/precios`, `lib/alertas`, `lib/unidades.ts`, `lib/fecha.ts` (son puros) |
| `src/corrida/**`                  | `@/lib/**`, `@/corrida/**`                                 | `@/app/**`, `@/components/**`, `next/*`                                              |
| `scripts/**`                      | `./cargar-env` (primer import), `@/lib/**`, `@/corrida/**` | `@/app/**`                                                                           |

**Dónde vive cada cosa.**

| Tema                                       | Fuente única                                                                                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Esquema SQL, RLS, vistas                   | `supabase/migrations/` (CLI de Supabase; el dashboard es solo lectura)                                                                              |
| Tipos de la base                           | `src/lib/supabase/tipos.ts` — generado por `pnpm gen:tipos`, nunca a mano                                                                           |
| Precio efectivo (regla de anotados)        | vista SQL `precio_efectivo`                                                                                                                         |
| Lista, óptimo dividido, alertas, etiquetas | `src/lib/precios/lista.ts`, `src/lib/precios/etiquetas.ts`, `src/lib/alertas/reglas.ts`                                                             |
| Unidades y normalización                   | `src/lib/unidades.ts`, `src/corrida/normalizar.ts`                                                                                                  |
| Env de la web                              | `src/lib/supabase/server.ts` (zod) · env de scripts: `scripts/cargar-env.ts`                                                                        |
| Tokens de diseño                           | `src/app/globals.css`                                                                                                                               |
| Planes Hogar/Dieta                         | `src/data/planes.ts`                                                                                                                                |
| Precio corregido a mano                    | tabla `anotados` (precio vigente) + `precios_manuales_historial` (observación); se escribe con `corregir_precio` y se quita con `quitar_correccion` |
| Listas de mercado guardadas                | `src/lib/listas/guardadas.ts`; tabla `listas_guardadas`; local `mercado-medellin:listas`                                                            |
| Plan editable Hogar/Dieta                  | `src/lib/planes/config.ts`; tabla `planes_usuario`; local `mercado-medellin:plan:{hogar\|dieta}`                                                    |
| Pronóstico a 7 días                        | `src/lib/precios/pronostico.ts` (puro, sin red); serie de la vista `serie_pronostico`; contexto de `contexto_mercado`                               |
| Catálogo de Tienda/Carnicería de barrio    | tabla `catalogo_tienda` (siembra 41 productos, sin precios) + `src/data/barrio.ts` (mismos ids, legible para la UI); se edita en `/anotados/barrio` |
| Tutorial y bombilla de ayuda               | `src/lib/tutorial/*` (pasos y progreso), `src/components/tutorial/*`; local `mercado-medellin:tutorial:v1`                                          |

## Reglas de código

1. **Imports:** `@/` → `src/` y especificadores relativos SIN extensión. Igual en app, pruebas y scripts (tsx lee `paths`). Nada de barrels.
2. **Server components por defecto.** `"use client"` solo en la hoja que necesita estado/eventos/GSAP.
3. **Toda lectura de datos en una página va en un componente async envuelto en `<Suspense fallback={...}>`.** Nunca `export const dynamic`/`revalidate`. Route handlers que leen la base llaman `await connection()` primero.
4. **Validar en el borde:** cada server action parsea su `FormData` con zod antes de tocar la base.
5. **PostgREST devuelve máx. 1000 filas:** toda lectura que pueda pasar de 1000 pagina con `.range()`.
6. **Fechas en Bogotá:** `hoyBogota()` de `src/lib/fecha.ts`; nunca `toISOString().slice(0, 10)`.
7. **Nunca inventar un precio ni una causa.** Sin hallazgo no se toca `precios_actuales`; sin coincidencia climática explícita la UI dice "causa no reportada". Una corrección a mano es un anotado con autor y fecha: se escribe con `corregir_precio`, nunca borra el automático y deja su fila en `precios_manuales_historial`.
8. **Componentes ≤ 250 líneas.** Más largo → partir por responsabilidad.
9. **Sin dependencias nuevas** salvo las de `blueprint.md` §11.
10. **El pronóstico no es un precio.** Sale de `pronostico.ts` (estadística determinista, sin IA/LLM ni red), no se guarda en tablas de precios y no entra en totales, óptimo dividido, alertas ni PDF. Siempre se muestra como rango con probabilidad y confianza, rotulado "estimación estadística".

## Sistema de diseño

Tokens en `src/app/globals.css` (claro / oscuro por `prefers-color-scheme` y `[data-theme]`). Los componentes usan nombres de token, nunca hex.

| Token                      | Claro                         | Oscuro                        | Uso                         |
| -------------------------- | ----------------------------- | ----------------------------- | --------------------------- |
| `--background`             | `#FAFAF7`                     | `#0E1116`                     | página                      |
| `--card`                   | `#FFFFFF`                     | `#161A21`                     | tarjetas, hojas             |
| `--foreground`             | `#0F172A`                     | `#E7EAEE`                     | texto                       |
| `--muted-foreground`       | `#5B6474`                     | `#9AA3AF`                     | texto secundario            |
| `--border`                 | `#E5E7EB`                     | `#2A303A`                     | divisores                   |
| `--input`                  | `#7A8291`                     | `#737C8C`                     | borde de campos (≥3:1)      |
| `--secondary` (chip)       | `#F1F2EC`                     | `#1E232C`                     | chips                       |
| `--primary` (chip activo)  | `#0F172A` / texto `#FFFFFF`   | `#E7EAEE` / texto `#0E1116`   | botón primario, chip activo |
| `--save` / `-ink` / `-bg`  | `#10B981` `#047857` `#E7F7F0` | `#34D399` `#6EE7B7` `#0F2A20` | ahorro, ↓                   |
| `--warn` / `-ink` / `-bg`  | `#F59E0B` `#8A5300` `#FEF4DE` | `#FBBF24` `#FCD34D` `#2A2110` | desactualizado, revisar     |
| `--up` / `-ink` / `-bg`    | `#EF4444` `#B42318` `#FDECEC` | `#F87171` `#FCA5A5` `#2C1616` | ↑, banner rojo              |
| `--anot` / `-ink` / `-bg`  | `#2563EB` `#1D4ED8` `#E8EFFD` | `#60A5FA` `#93C5FD` `#132238` | anotados, foco              |
| `--clima` / `-ink` / `-bg` | `#0EA5E9` `#0369A1` `#E0F2FE` | `#38BDF8` `#7DD3FC` `#0C2A3A` | causa climática             |
- **Tipo:** Inter (`next/font/google`) 400/500/600/700; números con `tabular-nums`.
- **Radio:** tarjetas 14 px, controles 10–12 px, chips 999 px.
- **Grilla catálogo:** puntos de quiebre `sm` 640 / `lg` 1024. 2 col < 640 px, 3 col ≥ 640 px; carrito lateral sticky 340 px ≥ 1024 px; debajo, barra inferior (toda la barra abre la hoja). Filas horizontales con `src/components/deslizador.tsx`; con `pointer: coarse` todo control mide ≥ 44 px (`globals.css`).
- **Movimiento:** GSAP, solo `transform`/`opacity`, 150–400 ms, todo dentro de `gsap.matchMedia()`; con `prefers-reduced-motion: reduce` la duración es 0. Helpers en `src/lib/animaciones.ts`.

## Entorno

| Variable                                                          | Requerida desde                 | Usada por               | Origen                                               |
| ----------------------------------------------------------------- | ------------------------------- | ----------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                        | paso 11                         | web                     | `pnpm env:local` · Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                            | paso 11                         | web                     | igual                                                |
| `SUPABASE_URL`                                                    | paso 3                          | scripts, corrida        | igual                                                |
| `SUPABASE_SERVICE_ROLE_KEY`                                       | paso 3                          | scripts, corrida        | igual (secret)                                       |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ADMIN_EMAIL` | nunca (opcionales)              | `src/corrida/correo.ts` | Gmail con contraseña de aplicación                   |
| `CORRIDA_USER_AGENT`                                              | nunca (tiene valor por defecto) | `src/corrida/tipos.ts`  | `.env.example`                                       |
| `GITHUB_DISPATCH_TOKEN`, `GITHUB_REPO`                            | nunca (opcionales; paso 14)     | `src/lib/github.ts`     | GitHub fine-grained token, solo Actions R/W (secret) |
| `ENABLE_EXPERIMENTAL_COREPACK=1`                                  | despliegue                      | Vercel (build)          | para que Vercel use pnpm 12 de `packageManager`      |

`.env.example` se sube y se mantiene al día. `.env.local` nunca.

## Reglas por área

| Archivo                    | Aplica a                                                                      |
| -------------------------- | ----------------------------------------------------------------------------- |
| `.claude/rules/datos.md`   | `supabase/**`, `scripts/migrar.ts`, `src/lib/supabase/**`, `src/lib/datos.ts` |
| `.claude/rules/corrida.md` | `src/corrida/**`, `scripts/**`, `.github/workflows/**`                        |
| `.claude/rules/web.md`     | `src/app/**`, `src/components/**`, `src/proxy.ts`                             |
| `.claude/rules/pruebas.md` | `tests/**`                                                                    |

## Innegociables

1. La service role key solo existe en `src/corrida/admin.ts`, `scripts/` y los secrets de GitHub. Nunca en `src/app`, `src/components` ni en una variable `NEXT_PUBLIC_*`. Igual con `GITHUB_DISPATCH_TOKEN`: solo `src/lib/github.ts` (servidor).
2. Una corrida que falla no puede pasar en silencio: excepción → exit 1 (GitHub avisa) y correo al admin; tienda en `fallo` → correo.
3. Respetar robots.txt, User-Agent propio, ≥1 s entre peticiones a la misma tienda. Solo se consultan D1, La Minorista y La Vaquita. Nunca saltar captchas ni logins.
4. Los fixtures de `tests/fixtures/` se capturan con `pnpm capturar`; nunca se escriben a mano.
5. Nunca commitear secretos, `.env.local` ni salida de build. Nunca editar a mano `tipos.ts` ni una migración ya aplicada.
6. Nunca marcar una tarea como hecha con un gate en rojo. Plan de construcción: `blueprints/mercado-medellin/tasks.json` y `epics/`.
7. Una corrección de precio es global y con autor: solo su autor la quita, el automático nunca se borra y no se inventa un precio para "completar" el historial del pronóstico.
8. **Tienda/Carnicería de barrio no siembra ni inventa precios.** `catalogo_tienda` solo guarda qué productos se siguen; cada precio entra por `corregir_precio('barrio', …)` con autor y fecha. "Quitar" es `activo = false`, nunca `delete`.
9. **Las tiendas retiradas no vuelven.** `TIENDAS_RETIRADAS` en `scripts/migrar.ts` filtra Éxito, Carulla, Euro, Ara e Ísimo en todas las cargas, y ningún código nuevo las reintroduce. PriceSmart sí se queda (manual).
10. **El tutorial no bloquea ni escribe datos.** Se muestra una vez por dispositivo, se salta con `Esc`/`Saltar`, no entra en rutas de auth y no toca Supabase.
