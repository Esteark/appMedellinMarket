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
