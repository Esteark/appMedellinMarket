-- contexto_mercado, historial_minimo y serie_pronostico (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into tiendas (id, nombre, color) values ('t1', 'Tienda 1', '#000000');
insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia)
  values ('p1', 'Producto 1', 'Frutas', 'kg', 'g', 1000, 'diaria');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'a@prueba.co');
-- 70 días de historial automático a 5000; el día de hoy hay además una corrección a mano de 4000
insert into precios_historial (producto_id, tienda_id, fecha, precio, estado)
  select 'p1', 't1', (now() at time zone 'America/Bogota')::date - g, 5000, 'real' from generate_series(0, 69) g;
insert into precios_manuales_historial (producto_id, tienda_id, precio, fecha, autor)
  values ('p1', 't1', 4000, (now() at time zone 'America/Bogota')::date, '00000000-0000-0000-0000-00000000000a');
insert into contexto_mercado (mes, ipc_alimentos) values ('2026-09-01', 0.8);

set local role anon;
select results_eq('select ipc_alimentos::text from contexto_mercado', array['0.80'], 'anon lee contexto_mercado');
select results_eq($$select jsonb_array_length(puntos) from serie_pronostico where producto_id = 'p1'$$, array[60],
  'serie_pronostico devuelve como máximo 60 puntos por producto');
select results_eq(
  $$select precio from historial_minimo where producto_id = 'p1' and fecha = (now() at time zone 'America/Bogota')::date$$,
  array[4000], 'una fila de precios_manuales_historial aparece en historial_minimo');
select throws_ok($$insert into contexto_mercado (mes) values ('2026-10-01')$$, '42501', null, 'anon no escribe en contexto_mercado');
select results_eq($$select (puntos -> 59 ->> 'precio')::int from serie_pronostico where producto_id = 'p1'$$, array[4000],
  'el último punto de la serie es el de hoy (mínimo con la corrección)');

select * from finish();
rollback;
