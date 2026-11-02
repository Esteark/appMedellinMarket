-- 2-nov-2026: catálogo por tienda. Cada tienda ofrece solo los productos de su `catalogo_tienda`.
-- No inventa precios: solo siembra con lo que ya tiene precio, y quitar sigue siendo `activo = false`.

-- Siembra: cada tienda sigue los productos con precio efectivo no nulo. Barrio y lo ya existente no se tocan.
insert into catalogo_tienda (producto_id, tienda_id)
select producto_id, tienda_id from precio_efectivo where precio is not null
on conflict (producto_id, tienda_id) do nothing;

-- Única lectura de la web: el precio efectivo solo de los productos que la tienda sigue.
create view precio_catalogo with (security_invoker = true) as
select e.*
from precio_efectivo e
join catalogo_tienda c
  on c.producto_id = e.producto_id and c.tienda_id = e.tienda_id and c.activo;
grant select on precio_catalogo to anon, authenticated;

-- Agrega (o reactiva) un producto en una o varias tiendas.
create function agregar_a_tienda(p_producto text, p_tiendas text[]) returns int
language plpgsql security invoker set search_path = public as $$
declare t text; n int := 0;
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  if p_tiendas is null or cardinality(p_tiendas) not between 1 and 10 then
    raise exception 'tiendas_invalidas';
  end if;
  if not exists (select 1 from productos where id = p_producto) then
    raise exception 'producto_inexistente';
  end if;
  foreach t in array (select array(select distinct unnest(p_tiendas))) loop
    if not exists (select 1 from tiendas where id = t) then
      raise exception 'tienda_inexistente';
    end if;
    insert into catalogo_tienda (producto_id, tienda_id, activo, orden, autor)
      values (p_producto, t, true,
        coalesce((select max(orden) from catalogo_tienda where tienda_id = t), 0) + 1,
        auth.uid())
      on conflict (producto_id, tienda_id) do update set activo = true, autor = auth.uid();
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function agregar_a_tienda(text, text[]) from public, anon;
grant execute on function agregar_a_tienda(text, text[]) to authenticated;

-- Quitar es `activo = false`: la fila, los precios y el historial se quedan.
create function quitar_de_tienda(p_producto text, p_tienda text) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sin_sesion'; end if;
  update catalogo_tienda set activo = false, autor = auth.uid()
    where producto_id = p_producto and tienda_id = p_tienda and activo;
  return found;
end $$;
revoke all on function quitar_de_tienda(text, text) from public, anon;
grant execute on function quitar_de_tienda(text, text) to authenticated;

-- Un precio anotado (a mano, importado o por fusión) nunca queda oculto: reactiva el producto en esa tienda.
create function anotado_en_catalogo() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  insert into catalogo_tienda (producto_id, tienda_id, activo, autor)
    values (new.producto_id, new.tienda_id, true, auth.uid())
    on conflict (producto_id, tienda_id) do update
      set activo = true, autor = coalesce(auth.uid(), catalogo_tienda.autor)
      where not catalogo_tienda.activo;
  return new;
end $$;
create trigger anotados_catalogo after insert or update of precio on anotados
  for each row execute function anotado_en_catalogo();
