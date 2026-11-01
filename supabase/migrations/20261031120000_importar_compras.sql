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
