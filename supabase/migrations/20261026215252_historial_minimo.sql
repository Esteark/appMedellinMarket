-- Precio mínimo diario de cada producto entre todas las tiendas (sección "En fluctuación").
-- ~144 × 30 filas para un mes, en vez de las ~25.000 de precios_historial.
create view historial_minimo with (security_invoker = true) as
select producto_id, fecha, min(precio) as precio
from precios_historial
where precio is not null
group by producto_id, fecha;

revoke all on historial_minimo from anon, authenticated;
grant select on historial_minimo to anon, authenticated;
