-- 30-oct-2026: listas de mercado con nombre. Tope de 20 listas y 200 ítems en zod; aquí solo el tamaño del JSON.
create table listas_guardadas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  -- permite el onConflict "user_id,nombre_clave" de PostgREST sin índice por expresión
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
