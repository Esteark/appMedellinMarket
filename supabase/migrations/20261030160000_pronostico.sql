-- 30-oct-2026: pronóstico a 7 días. Estadística sobre la serie propia; no es un precio y no se guarda como tal.
create table contexto_mercado (
  mes date primary key,                 -- primer día del mes
  ipc_alimentos numeric(6,2),           -- variación mensual, %
  ipc_alimentos_anual numeric(6,2),     -- variación anual, %
  fuente text not null default 'DANE',
  fuente_url text,
  actualizado timestamptz not null default now()
);
alter table contexto_mercado enable row level security;
create policy leer on contexto_mercado for select using (true);
revoke all on contexto_mercado from anon, authenticated;
grant select on contexto_mercado to anon, authenticated;

-- historial_minimo pasa a incluir las correcciones a mano (paso 27).
create or replace view historial_minimo with (security_invoker = true) as
select producto_id, fecha, min(precio) as precio
from (
  select producto_id, fecha, precio from precios_historial where precio is not null
  union all
  select producto_id, fecha, precio from precios_manuales_historial
) s
group by producto_id, fecha;

-- 60 puntos por producto en una sola fila: reemplaza la consulta de 30 días de catalogo().
create view serie_pronostico with (security_invoker = true) as
with ultimos as (
  select producto_id, fecha, precio,
    row_number() over (partition by producto_id order by fecha desc) as n
  from historial_minimo
  where fecha >= (now() at time zone 'America/Bogota')::date - 90
)
select producto_id,
  jsonb_agg(jsonb_build_object('fecha', fecha, 'precio', precio) order by fecha) as puntos
from ultimos where n <= 60
group by producto_id;
revoke all on serie_pronostico from anon, authenticated;
grant select on serie_pronostico to anon, authenticated;
