-- 2-nov-2026: un precio nuevo de la corrida o de una importación nunca queda oculto por el catálogo.
-- Solo crea la fila que falta: un producto que alguien quitó (`activo = false`) sigue quitado.

create function precio_en_catalogo() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if new.precio is not null then
    insert into catalogo_tienda (producto_id, tienda_id)
      values (new.producto_id, new.tienda_id)
      on conflict (producto_id, tienda_id) do nothing;
  end if;
  return new;
end $$;

create trigger precios_actuales_catalogo after insert or update of precio on precios_actuales
  for each row execute function precio_en_catalogo();

-- Anotar el mismo precio otra vez no reactiva un producto que se quitó a propósito.
create or replace function anotado_en_catalogo() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.precio is not distinct from new.precio then
    return new;
  end if;
  insert into catalogo_tienda (producto_id, tienda_id, activo, autor)
    values (new.producto_id, new.tienda_id, true, auth.uid())
    on conflict (producto_id, tienda_id) do update
      set activo = true, autor = coalesce(auth.uid(), catalogo_tienda.autor)
      where not catalogo_tienda.activo;
  return new;
end $$;
