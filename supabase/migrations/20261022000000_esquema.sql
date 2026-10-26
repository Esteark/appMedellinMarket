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


-- Grants explícitos: Supabase da todo a anon y authenticated por defecto; RLS queda como segunda barrera.
revoke all on all tables in schema public from anon, authenticated;
grant select on tiendas, productos, precios_actuales, precios_historial, corridas, tienda_estado,
  clima_causas, anotados, precio_efectivo to anon, authenticated;
grant insert, update, delete on anotados to authenticated;
grant select, insert, update, delete on listas, preferencias_notif to authenticated;
grant select, update (leida) on alertas to authenticated;

alter publication supabase_realtime add table alertas;
