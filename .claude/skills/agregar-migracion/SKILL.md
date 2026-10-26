---

name: agregar-migracion
description: Agrega un cambio de esquema a Supabase (tabla, columna, índice, política RLS, vista). Úsala cuando haya que tocar la base de datos, añadir una columna, cambiar una política o crear una vista en Mercado Medellín.
---

# Agregar una migración

## Cuándo usarla

- "agrega una columna", "nueva tabla", "cambia la política RLS", "crea una vista", "índice para…".

## Pasos

1. Crea el archivo vacío con la CLI: `pnpm exec supabase migration new <nombre_en_snake_case>`. La CLI elige el prefijo de fecha; refiérete al archivo como "la migración que creó `migration new` para <nombre>", nunca inventes el nombre.
2. Escribe el SQL en ese archivo. Toda tabla nueva: `alter table … enable row level security;` + políticas explícitas + `grant`/`revoke` explícitos para `anon` y `authenticated`.
3. Nunca edites una migración que ya corrió (`20261022000000_esquema.sql` incluida). Siempre una nueva.
4. Añade las aserciones pgTAP a `supabase/tests/rls.test.sql` y sube el número de `plan(N)` en la misma cantidad.
5. `pnpm exec supabase db reset` → `pnpm migrar` → `pnpm gen:tipos`.

## Verificar

```bash
pnpm exec supabase db reset    # expect: exit 0
pnpm exec supabase test db     # expect: exit 0, todas las aserciones ok
pnpm migrar                    # expect: exit 0
pnpm gen:tipos                 # expect: exit 0
pnpm typecheck                 # expect: exit 0
```

## No

- No cambies el esquema desde el dashboard de Supabase: el dashboard es solo lectura.
- No dejes una tabla sin RLS ni con `grant` implícito a `anon`.
