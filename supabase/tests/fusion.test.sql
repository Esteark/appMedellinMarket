-- fusionar_productos (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.co'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.co');
insert into tiendas (id, nombre, color) values ('t1', 'Tienda 1', '#000000'), ('t2', 'Tienda 2', '#111111');
insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia) values
  ('p1', 'Origen', 'Frutas', 'kg', 'g', 1000, 'diaria'),
  ('p2', 'Destino', 'Frutas', 'kg', 'g', 1000, 'diaria'),
  ('p3', 'Otro', 'Frutas', 'kg', 'g', 1000, 'diaria');

-- Datos del origen en cada tabla que la función mueve.
insert into precios_actuales (producto_id, tienda_id, precio, fecha, estado) values
  ('p1', 't1', 5000, '2026-10-30', 'real'), ('p1', 't2', 5500, '2026-10-30', 'real'),
  ('p2', 't1', 6000, '2026-10-29', 'real');
insert into precios_historial (producto_id, tienda_id, fecha, precio, estado)
  values ('p1', 't1', '2026-10-30', 5000, 'real');
insert into precios_manuales_historial (producto_id, tienda_id, precio, fecha, autor)
  values ('p1', 't1', 4000, '2026-10-30', '00000000-0000-0000-0000-00000000000a');
insert into anotados (producto_id, tienda_id, precio, fecha, autor)
  values ('p1', 't2', 4500, '2026-10-30', '00000000-0000-0000-0000-00000000000a');
insert into producto_fuente (producto_id, tienda_id, url) values ('p1', 't2', 'https://ejemplo.test/p1');
-- el disparador de precios_actuales ya la creó; se deja explícita por claridad.
insert into catalogo_tienda (producto_id, tienda_id) values ('p1', 't1') on conflict do nothing;
insert into clima_causas (producto_id, fecha, texto, es_clima) values ('p1', '2026-10-30', 'lluvias', true);
insert into producto_alias (alias_norm, tienda_id, producto_id) values
  ('alias unico', null, 'p1'), ('alias de tienda', 't1', 'p1'), ('alias propio', null, 'p2');
insert into producto_codigo (codigo, producto_id) values ('7702000000001', 'p1');
insert into gastos_reales (user_id, mes, rubro, monto, producto_id, origen)
  values ('00000000-0000-0000-0000-00000000000a', '2026-10', 'Frutas', 1000, 'p1', 'manual');
insert into alertas (user_id, tipo, producto_id, mensaje)
  values ('00000000-0000-0000-0000-00000000000a', 'subida', 'p1', 'x');
insert into listas (user_id, items, tienda_preferida) values
  ('00000000-0000-0000-0000-00000000000a', '{"p1": 2, "p2": 1, "p3": 5}', 't1');
insert into listas_guardadas (user_id, nombre, items, tienda_preferida) values
  ('00000000-0000-0000-0000-00000000000a', 'L', '{"p1": 3}', 't1');
insert into planes_usuario (user_id, tipo, config) values
  ('00000000-0000-0000-0000-00000000000a', 'hogar', '{"items": {"p1": 4}}');

set local role anon;
select throws_ok($$select fusionar_productos('p1', 'p2')$$, '42501', null,
  'anon no ejecuta fusionar_productos');
select lives_ok('select * from fusiones_productos', 'anon lee fusiones_productos');
select throws_ok($$insert into fusiones_productos (origen, destino) values ('p1', 'p2')$$, '42501', null,
  'nadie escribe la auditoría a mano');

reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select throws_ok($$select fusionar_productos('p1', 'p1')$$, 'P0001', 'mismo_producto',
  'fusionar un producto consigo mismo falla');
select throws_ok($$select fusionar_productos('p1', 'no-existe')$$, 'P0001', 'producto_no_existe',
  'un destino inexistente falla');
select results_eq($$select count(*)::int from productos where id = 'p1'$$, array[1],
  'los intentos fallidos no borran nada');

select is((fusionar_productos('p1', 'p2')->>'precios')::int, 2, 'la respuesta cuenta los precios movidos');
select results_eq($$select count(*)::int from productos where id = 'p1'$$, array[0], 'el origen se borra');
select results_eq(
  $$select count(*)::int, max(precio) filter (where tienda_id = 't1') from precios_actuales where producto_id = 'p2'$$,
  $$values (2, 5000)$$,
  'precios actuales: se mueve la tienda nueva y gana el precio más reciente');
select results_eq(
  $$select (select count(*) from precios_historial where producto_id = 'p2')::int,
    (select count(*) from precios_manuales_historial where producto_id = 'p2')::int,
    (select count(*) from anotados where producto_id = 'p2')::int,
    (select count(*) from catalogo_tienda where producto_id = 'p2')::int,
    (select count(*) from clima_causas where producto_id = 'p2')::int,
    (select count(*) from gastos_reales where producto_id = 'p2')::int,
    (select count(*) from alertas where producto_id = 'p2')::int$$,
  -- el catálogo trae 2: la fila explícita (t1) y la que el anotado de t2 reactiva (paso 44).
  $$values (1, 1, 1, 2, 1, 1, 1)$$,
  'historial, manuales, anotados, catálogo, clima, gastos y alertas pasan al destino');
select results_eq(
  $$select (select count(*) from producto_alias where producto_id = 'p2')::int,
    (select count(*) from producto_codigo where producto_id = 'p2')::int$$,
  $$values (3, 1)$$, 'los alias de ambos quedan en el destino y el código pasa con ellos');
select results_eq(
  $$select (items->>'p2')::int, items ? 'p1', (items->>'p3')::int from listas$$,
  $$values (3, false, 5)$$, 'la lista suma las cantidades y no toca otros productos');
select results_eq(
  $$select (items->>'p2')::int, items ? 'p1' from listas_guardadas$$,
  $$values (3, false)$$, 'la lista guardada apunta al destino');
select results_eq(
  $$select (config->'items'->>'p2')::int, config->'items' ? 'p1' from planes_usuario$$,
  $$values (4, false)$$, 'el plan apunta al destino');
select results_eq(
  $$select origen, destino, autor from fusiones_productos where origen = 'p1'$$,
  $$values ('p1', 'p2', '00000000-0000-0000-0000-00000000000a'::uuid)$$,
  'queda auditada con autor');

reset role;
select results_eq($$select count(*)::int from producto_fuente where producto_id = 'p2'$$, array[1],
  'la fuente de scraping también pasa al destino');

select * from finish();
rollback;
