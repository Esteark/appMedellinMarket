-- 2-nov-2026: el historial también respeta el catálogo por tienda.
-- `precio_catalogo` ya muestra solo las tiendas que siguen cada producto; `historial_minimo` (y con él
-- `serie_pronostico`: pronóstico a 7 días y fluctuación) seguía tomando el mínimo de todas. Quitar a
-- La Minorista la papa de $2.100 dejaba el precio en $3.300 y el pronóstico partiendo de $2.100.

create or replace view historial_minimo with (security_invoker = true) as
select h.producto_id, h.fecha, min(h.precio) as precio
from (
  select producto_id, tienda_id, fecha, precio from precios_historial where precio is not null
  union all
  select producto_id, tienda_id, fecha, precio from precios_manuales_historial
    where not promocion and precio is not null
) h
join catalogo_tienda c
  on c.producto_id = h.producto_id and c.tienda_id = h.tienda_id and c.activo
group by h.producto_id, h.fecha;
