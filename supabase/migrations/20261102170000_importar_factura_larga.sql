-- 2-nov-2026 (paso 47): importar facturas largas.
-- 1. El tope de creación de productos pasa de 50 a 200 por persona y por día (día de Bogotá).
-- 2. `importar_compra` crea los productos nuevos con el grupo, la unidad, el tamaño y el ícono que trae cada fila
--    (`grupo`, `unidad`, `cantidad_base`, `emoji`) y, si la persona eligió un producto existente, su `producto_id`; sin esos campos
--    se comporta como antes. Un producto que ya
--    existe no cambia su ficha. Mismos cuerpos de las funciones originales; solo cambia lo dicho.

create or replace function crear_producto(
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
      where creado_por = auth.uid() and (creado at time zone 'America/Bogota')::date = v_hoy) >= 200 then
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

create or replace function importar_compra(
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
      -- Un producto elegido a mano en la revisión (`producto_id`) manda; si no existe, se empareja como siempre
      -- (código, alias, nombre). El alias y el código que se guardan abajo hacen que la próxima factura coincida sola.
      v_pid := nullif(btrim(coalesce(v_f->>'producto_id', '')), '');
      if v_pid is not null and not exists (select 1 from productos where id = v_pid) then
        v_pid := null;
      end if;
      if v_pid is null then
        v_pid := emparejar_producto(v_f->>'producto', v_tid, v_f->>'codigo');
      end if;
      if v_pid is null then
        -- Un producto nuevo nace con el grupo, la unidad, el tamaño y el ícono que trae la fila; sin esos
        -- campos, como antes (grupo = rubro, `u` 1, sin ícono).
        v_pid := crear_producto(v_f->>'producto',
          coalesce(nullif(btrim(v_f->>'grupo'), ''), nullif(v_f->>'rubro',''), 'Otros'),
          coalesce(nullif(v_f->>'unidad',''), 'u'),
          greatest(coalesce(nullif(v_f->>'cantidad_base','')::numeric, 1), 1), 'semanal');
        -- El ícono solo se pone al crear: la ficha de un producto que ya existía no se toca.
        if nullif(btrim(coalesce(v_f->>'emoji','')), '') is not null then
          update productos set emoji = left(btrim(v_f->>'emoji'), 8)
            where id = v_pid and emoji is null;
        end if;
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
