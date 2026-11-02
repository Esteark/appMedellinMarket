-- Catálogo por tienda: siembra, vista precio_catalogo, agregar/quitar y reactivación por precio (pgTAP).
-- Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into tiendas (id, nombre, color) values ('tx', 'Tienda X', '#000000'), ('ty', 'Tienda Y', '#111111');
insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia) values
  ('q1', 'Producto Q1', 'Frutas', 'kg', 'g', 1000, 'diaria'),
  ('q2', 'Producto Q2', 'Frutas', 'kg', 'g', 1000, 'diaria');
insert into precios_actuales (producto_id, tienda_id, precio, fecha, estado) values
  ('q1', 'tx', 2100, (now() at time zone 'America/Bogota')::date, 'real'),
  ('q1', 'ty', null, (now() at time zone 'America/Bogota')::date, 'sin_dato'),
  ('q2', 'ty', 3300, (now() at time zone 'America/Bogota')::date, 'real');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'a@prueba.co');

-- La siembra de la migración: solo precios no nulos.
insert into catalogo_tienda (producto_id, tienda_id)
select producto_id, tienda_id from precio_efectivo where precio is not null
on conflict (producto_id, tienda_id) do nothing;
select results_eq($$select producto_id from catalogo_tienda where tienda_id = 'tx'$$, array['q1'],
  'la siembra deja a q1 en tx (tiene precio)');
select is_empty($$select 1 from catalogo_tienda where producto_id = 'q1' and tienda_id = 'ty'$$,
  'un precio nulo no entra al catálogo');

select results_eq($$select count(*)::int from precio_catalogo where tienda_id = 'ty'$$, array[1],
  'precio_catalogo solo trae lo que la tienda sigue');

set local role anon;
select lives_ok('select * from precio_catalogo', 'anon lee precio_catalogo');
select throws_ok($$select agregar_a_tienda('q1', array['ty'])$$, '42501', null,
  'anon no puede agregar a una tienda');

reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select is(agregar_a_tienda('q1', array['ty', 'ty']), 1, 'agregar_a_tienda ignora tiendas repetidas');
select throws_ok($$select agregar_a_tienda('q1', array['no_existe'])$$, 'P0001', 'tienda_inexistente',
  'rechaza una tienda que no existe');

select ok(quitar_de_tienda('q2', 'ty'), 'quitar_de_tienda devuelve true');
select results_eq($$select activo from catalogo_tienda where producto_id = 'q2' and tienda_id = 'ty'$$,
  array[false], 'quitar es activo = false: la fila sigue ahí');
select is_empty($$select 1 from precio_catalogo where producto_id = 'q2' and tienda_id = 'ty'$$,
  'un producto quitado sale de precio_catalogo aunque conserve su precio');

-- Anotar un precio reactiva el producto en esa tienda.
select corregir_precio('q2', 'ty', 3500);
select results_eq($$select activo from catalogo_tienda where producto_id = 'q2' and tienda_id = 'ty'$$,
  array[true], 'anotar un precio reactiva el producto en la tienda');

select * from finish();
rollback;
