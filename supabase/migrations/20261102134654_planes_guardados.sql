-- 02-nov-2026: presupuestos de Hogar/Dieta guardados con nombre (escenarios).
-- Separados del plan activo de `planes_usuario`: cargar uno lo vuelve el plan activo.
create table planes_guardados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  tipo text not null check (tipo in ('hogar','dieta')),
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  -- permite el onConflict "user_id,tipo,nombre_clave" de PostgREST sin índice por expresión
  nombre_clave text generated always as (lower(btrim(nombre))) stored,
  config jsonb not null
    check (jsonb_typeof(config) = 'object' and pg_column_size(config) <= 200000),
  actualizada timestamptz not null default now(),
  unique (user_id, tipo, nombre_clave)
);
alter table planes_guardados enable row level security;
create policy propia on planes_guardados for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on planes_guardados from anon, authenticated;
grant select, insert, update, delete on planes_guardados to authenticated;
