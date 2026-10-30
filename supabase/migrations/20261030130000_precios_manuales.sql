-- 30-oct-2026: precio corregido a mano. La corrección vigente vive en anotados; la observación, aquí.
create table precios_manuales_historial (
  id bigserial primary key,
  producto_id text not null references productos,
  tienda_id text not null references tiendas,
  precio integer not null check (precio between 100 and 10000000),
  fecha date not null default (now() at time zone 'America/Bogota')::date,
  autor uuid references auth.users default auth.uid(),
  creado timestamptz not null default now(),
  unique (producto_id, tienda_id, fecha)
);
create index on precios_manuales_historial (producto_id, fecha desc, tienda_id);

alter table precios_manuales_historial enable row level security;
create policy leer on precios_manuales_historial for select using (true);
create policy crear on precios_manuales_historial for insert to authenticated
  with check (autor = auth.uid());
-- update: el `on conflict do update` de corregir_precio lo necesita (mismo día, otro autor).
create policy editar on precios_manuales_historial for update to authenticated
  using (true) with check (autor = auth.uid());
create policy borrar on precios_manuales_historial for delete to authenticated
  using (autor = auth.uid() and fecha = (now() at time zone 'America/Bogota')::date);
revoke all on precios_manuales_historial from anon, authenticated;
grant select on precios_manuales_historial to anon, authenticated;
grant insert, update, delete on precios_manuales_historial to authenticated;
grant usage on sequence precios_manuales_historial_id_seq to authenticated;

create function corregir_precio(p_producto text, p_tienda text, p_precio integer)
returns void language plpgsql security invoker set search_path = public as $$
declare hoy date := (now() at time zone 'America/Bogota')::date;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  if p_precio is null or p_precio not between 100 and 10000000 then
    raise exception 'precio_invalido';
  end if;
  insert into anotados (producto_id, tienda_id, precio, fecha, autor)
    values (p_producto, p_tienda, p_precio, hoy, auth.uid())
    on conflict (producto_id, tienda_id) do update
      set precio = excluded.precio, fecha = excluded.fecha, autor = excluded.autor;
  insert into precios_manuales_historial (producto_id, tienda_id, precio, fecha, autor)
    values (p_producto, p_tienda, p_precio, hoy, auth.uid())
    on conflict (producto_id, tienda_id, fecha) do update
      set precio = excluded.precio, autor = excluded.autor, creado = now();
end $$;
revoke all on function corregir_precio(text, text, integer) from public, anon;
grant execute on function corregir_precio(text, text, integer) to authenticated;

-- Quitar una corrección propia: borra el anotado y la fila de hoy del historial.
-- Devuelve false si el anotado no era del usuario (otra persona la corrigió).
create function quitar_correccion(p_producto text, p_tienda text)
returns boolean language plpgsql security invoker set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  delete from anotados
    where producto_id = p_producto and tienda_id = p_tienda and autor = auth.uid();
  get diagnostics n = row_count;
  if n = 0 then return false; end if;
  delete from precios_manuales_historial
    where producto_id = p_producto and tienda_id = p_tienda
      and fecha = (now() at time zone 'America/Bogota')::date and autor = auth.uid();
  return true;
end $$;
revoke all on function quitar_correccion(text, text) from public, anon;
grant execute on function quitar_correccion(text, text) to authenticated;
