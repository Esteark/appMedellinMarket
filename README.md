# 🛒 Mercado Medellín

**Compara los precios del mercado en las tiendas de Medellín, arma la lista de la familia y descubre dónde sale más barato comprarla.**

Cada mañana una corrida automática consulta los precios de 144 productos de mercado (frutas, verduras, proteínas, lácteos, granos, despensa, aseo y antojos), los normaliza a la misma unidad y los publica en una web de lectura pública. La familia arma su lista y la app le dice cuánto cuesta en cada tienda, cuál es la más barata con todo y cuánto se ahorra si divide la compra.

![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=fff)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3FCF8E?logo=supabase&logoColor=fff)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=fff)
![GitHub Actions](https://img.shields.io/badge/Corrida-GitHub%20Actions-2088FF?logo=githubactions&logoColor=fff)

---

## Contenido

- [Qué hace](#qué-hace)
- [Cómo funciona](#cómo-funciona)
- [Fuentes de precios](#fuentes-de-precios)
- [Stack](#stack)
- [Empezar en local](#empezar-en-local)
- [Comandos](#comandos)
- [Variables de entorno](#variables-de-entorno)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Calidad y pruebas](#calidad-y-pruebas)
- [Despliegue](#despliegue)
- [Estado del proyecto](#estado-del-proyecto)
- [Uso responsable de los datos](#uso-responsable-de-los-datos)
- [Contacto](#contacto)

---

## Qué hace

|                                   |                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🧺 **Canasta familiar y Antojos** | Catálogo con búsqueda, filtros por grupo y por tienda, y el precio más barato de cada producto con la tienda donde está.                                                                                                                                                                            |
| 🏷️ **Etiquetas honestas**         | ↑/↓ cuando el precio cambia ±15 % contra los 7 días anteriores, 🌧️ cuando el boletín SIPSA del DANE reporta una causa climática, y avisos de _anotado_, _estimado_, _mayorista_, _revisar_ o _desactualizado_. Si no hay una causa reportada, la app lo dice: nunca inventa un precio ni una causa. |
| 📝 **Mi lista**                   | Se arma con un clic y se guarda en el navegador. Muestra el total en la tienda más barata que tiene todo y el **ahorro dividiendo** la compra entre tiendas.                                                                                                                                        |
| 🔍 **Detalle de producto**        | Precio en cada tienda, la causa del cambio y el historial de 30 días. Se abre como hoja encima del catálogo y también tiene su propia URL para compartir.                                                                                                                                           |
| 📈 **En fluctuación**             | Productos con cambios fuertes en la semana o mucha variación en el mes, con su mini gráfico.                                                                                                                                                                                                        |
| 📊 **Gráficos**                   | Total de la lista por tienda, gasto por grupo e historial de cada producto.                                                                                                                                                                                                                         |
| 🟢 **Frescura visible**           | El encabezado muestra cuándo se actualizó, qué fuentes respondieron y un banner rojo si la última corrida tiene más de 26 horas.                                                                                                                                                                    |
| ✉️ **Nada falla en silencio**     | Si una tienda deja de responder o la corrida se cae, el administrador recibe un correo.                                                                                                                                                                                                             |

**En camino** (ver [estado del proyecto](#estado-del-proyecto)): cuentas de usuario con la lista guardada, notificaciones, botón para actualizar precios cuando están viejos, precios anotados a mano, alertas personales y los planes _Hogar_ y _Dieta_.

---

## Cómo funciona

```
                     6:17 a. m. (Bogotá), todos los días
┌──────────────────┐        ┌───────────────────────────────┐
│  GitHub Actions  │ ─────► │  pnpm corrida                 │
│  cron + manual   │        │  adaptadores: D1 · Euro · SIPSA│
└──────────────────┘        │  normalizar → validar → upsert │
                            │  alertas por usuario           │
                            │  correo al admin si algo falla │
                            └───────────────┬───────────────┘
                                            │ service role
                                            ▼
┌──────────────────┐   RLS   ┌───────────────────────────────┐
│ Next.js (Vercel) │ ◄────── │  Supabase                     │
│ lectura pública  │         │  Postgres + RLS + Auth +      │
│ + sesión         │         │  Realtime                     │
└──────────────────┘         └───────────────────────────────┘
```

- **La corrida** (`scripts/corrida.ts` → `src/corrida/orquestador.ts`) consulta las tiendas en paralelo y, dentro de cada tienda, un producto a la vez con al menos 1 s de pausa. Convierte cada precio a la unidad base del producto (g, ml o unidad) y lo escribe solo si hubo hallazgo real. Un salto de más del 35 % se publica marcado como _revisar_. Es idempotente: correrla dos veces el mismo día deja el mismo estado.
- **La web** (Next.js App Router) lee con la clave publicable y las políticas RLS de Supabase deciden qué se ve. Las mutaciones son _server actions_ validadas con zod.
- **El precio efectivo** lo calcula una vista SQL: un precio anotado a mano reemplaza al automático cuando es más reciente.

---

## Fuentes de precios

| Tienda                                     | Cómo se obtiene                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **D1**                                     | API pública de catálogo VTEX, por SKU                                                                  |
| **Euro**                                   | Páginas de producto públicas (`ld+json`)                                                               |
| **La Minorista**                           | Boletín diario **SIPSA del DANE** (precio mayorista de la Central Mayorista de Antioquia) y sus causas |
| **Éxito, Carulla, Ara, Ísimo, PriceSmart** | Precios anotados a mano: sus sitios lo prohíben en `robots.txt` o bloquean bots                        |
| **Tienda/Carnicería de barrio**            | Solo anotados                                                                                          |

---

## Stack

| Capa                  | Tecnología                                                          |
| --------------------- | ------------------------------------------------------------------- |
| Web                   | Next.js 16 (App Router, Cache Components) · React 19 · TypeScript 6 |
| Estilos               | Tailwind CSS 4 · shadcn/ui · modo claro y oscuro con tokens         |
| Datos                 | Supabase: Postgres, Row Level Security, Auth y Realtime (sin ORM)   |
| Gráficos y movimiento | Recharts · GSAP (respeta `prefers-reduced-motion`)                  |
| Corrida               | Node 24 · cheerio · exceljs · unpdf · nodemailer                    |
| Calidad               | Vitest · Playwright · pgTAP · Biome                                 |
| Infraestructura       | Vercel (web) · GitHub Actions (corrida diaria)                      |

---

## Empezar en local

**Requisitos:** Node **24.22.1** (`.nvmrc`), pnpm **12** (`corepack enable`) y **Docker** (para Supabase local).

```bash
# 1. Dependencias
pnpm install --frozen-lockfile

# 2. Base de datos local (Docker)
pnpm exec supabase start

# 3. Variables locales (.env.local a partir de supabase status)
pnpm env:local

# 4. Datos iniciales: 144 productos, precios, tiendas e historial
pnpm migrar

# 5. Servidor de desarrollo → http://localhost:3000
pnpm dev
```

Para reiniciar la base: `pnpm exec supabase db reset` y luego `pnpm migrar`.

---

## Comandos

| Tarea                              | Comando                                                              |
| ---------------------------------- | -------------------------------------------------------------------- |
| Desarrollo                         | `pnpm dev`                                                           |
| Build de producción                | `pnpm build`                                                         |
| Prueba de humo sobre el build      | `pnpm humo` · `pnpm humo --ruta producto/aceite --contiene "Aceite"` |
| Typecheck · lint · formato         | `pnpm typecheck` · `pnpm lint` · `pnpm format`                       |
| Pruebas unitarias y de integración | `pnpm test`                                                          |
| Pruebas de RLS (pgTAP)             | `pnpm exec supabase test db`                                         |
| Pruebas e2e y accesibilidad        | `pnpm test:e2e`                                                      |
| Corrida de precios                 | `pnpm corrida` · `pnpm corrida --todo` · `pnpm corrida --ayuda`      |
| Capturar fixtures reales           | `pnpm capturar vtex` · `pnpm capturar euro` · `pnpm capturar sipsa`  |
| Regenerar tipos de la base         | `pnpm gen:tipos`                                                     |

**Gate de calidad:** `pnpm typecheck && pnpm lint && pnpm test` debe pasar antes de dar por hecho cualquier cambio.

---

## Variables de entorno

La plantilla está en [`.env.example`](.env.example). `.env.local` nunca se sube al repositorio.

| Variable                                                              | Dónde vive        | Para qué                                                                          |
| --------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                            | Vercel            | URL del proyecto de Supabase                                                      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                                | Vercel            | Clave publicable (RLS decide qué se ve)                                           |
| `SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY`                          | GitHub Secrets    | La corrida escribe con la service role. **Nunca** en la web ni en `NEXT_PUBLIC_*` |
| `SMTP_HOST` · `SMTP_PORT` · `SMTP_USER` · `SMTP_PASS` · `ADMIN_EMAIL` | GitHub Secrets    | Correo al administrador cuando algo falla (Gmail con contraseña de aplicación)    |
| `CORRIDA_USER_AGENT`                                                  | Workflow          | User-Agent propio de la corrida                                                   |
| `GITHUB_REPO` · `GITHUB_DISPATCH_TOKEN`                               | Vercel (servidor) | Botón "Actualizar precios" (en desarrollo)                                        |

---

## Estructura del proyecto

```
src/
├── app/                 rutas: / (canasta), /antojos, /producto/[id], /api/salud
│   └── @modal/          el detalle como hoja encima del catálogo
├── components/          catálogo, carrito, detalle, gráficos, encabezado, pestañas
├── corrida/             adaptadores (vtex, euro, sipsa), orquestador, alertas y correo
├── data/                grupos y planes
└── lib/                 lógica pura (precios, etiquetas, alertas, unidades, fechas),
                         datos de la web, clientes de Supabase y animaciones
supabase/
├── migrations/          esquema, RLS y vistas (única fuente del esquema)
└── tests/               pruebas pgTAP de RLS
scripts/                 corrida, migración de datos, fixtures y prueba de humo
tests/                   unit/ · integracion/ · e2e/ · fixtures/ (capturados de los sitios reales)
.github/workflows/       corrida diaria
```

---

## Calidad y pruebas

- **Unitarias:** lógica pura de precios, etiquetas, alertas, unidades, fechas y correo.
- **Adaptadores:** se prueban con respuestas **reales** capturadas con `pnpm capturar`; nunca con datos escritos a mano.
- **Integración:** la corrida completa contra Supabase local, con su idempotencia y sus alertas.
- **RLS:** pgTAP comprueba que un visitante lee precios pero no escribe, y que cada usuario solo ve lo suyo.
- **Accesibilidad:** navegación con teclado, hojas que se cierran con botón o Escape además de arrastrar, `prefers-reduced-motion` y contraste por tokens.

---

## Despliegue

1. **Supabase:** crear el proyecto, `pnpm exec supabase link`, `pnpm exec supabase db push` y `pnpm migrar` con las variables de producción.
2. **Vercel:** importar el repositorio y configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. **GitHub Actions:** cargar los secrets de la corrida y lanzarla una vez a mano (`workflow_dispatch`).
4. **Verificar:** `/api/salud` debe responder `{"ok":true, "ultimaCorrida": …}`.

El detalle completo está en [`blueprints/mercado-medellin/blueprint.md`](blueprints/mercado-medellin/blueprint.md), sección 11.

---

## Estado del proyecto

Se construye por pasos verificables; cada paso cerrado tiene su etiqueta `paso-NN`.

| Paso  | Contenido                                                       | Estado |
| ----- | --------------------------------------------------------------- | ------ |
| 1–4   | Esqueleto, esquema con RLS, migración de datos y lógica pura    | ✅     |
| 5–8   | Adaptadores D1, Euro y SIPSA, y orquestador de la corrida       | ✅     |
| 9–10  | Alertas, correo al admin y workflow diario                      | ✅     |
| 11–13 | Base web, catálogo, lista, detalle, fluctuación y gráficos      | ✅     |
| 14    | Cuentas de usuario, notificaciones y botón "Actualizar precios" | ⏳     |
| 15    | Responsive para móvil y tableta, con deslizadores               | ⏳     |
| 16    | Precios anotados a mano                                         | ⏳     |
| 17    | Alertas en la web con Realtime                                  | ⏳     |
| 18    | Planes Hogar y Dieta                                            | ⏳     |
| 19    | e2e y auditoría de accesibilidad                                | ⏳     |

---

## Uso responsable de los datos

La corrida es un bot de **uso familiar** y se comporta como tal:
- Se identifica con su propio User-Agent: `MercadoMedellinBot/1.0 (+uso familiar; contacto en README)`.
- Lee `robots.txt` antes de pedir cualquier página y respeta lo que prohíbe.
- Hace una consulta por producto al día, en serie y con al menos 1 segundo entre peticiones a la misma tienda.
- Nunca salta captchas, logins ni bloqueos: si un sitio no permite la consulta, ese precio se anota a mano.

Los precios son orientativos; el precio válido es siempre el de la tienda.

---

## Contacto

¿Administras uno de los sitios consultados y quieres que la corrida deje de visitarlo o cambie su ritmo? Abre un _issue_ en [github.com/Esteark/appMedellinMarket/issues](https://github.com/Esteark/appMedellinMarket/issues) y se atiende de inmediato.
