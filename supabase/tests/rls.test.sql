-- Pruebas de RLS (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

-- Datos mínimos, como postgres (salta RLS).
insert into tiendas (id, nombre, color) values ('t1', 'Tienda 1', '#000000'), ('t2', 'Tienda 2', '#FFFFFF');
insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia)
  values ('p1', 'Producto 1', 'Frutas', 'kg', 'g', 1000, 'diaria');
insert into producto_fuente (producto_id, tienda_id, url) values ('p1', 't1', 'https://ejemplo.co/p1');
insert into precios_actuales (producto_id, tienda_id, precio, fecha, estado)
  values ('p1', 't1', 5000, current_date, 'real');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.co'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.co');
insert into listas (user_id, items, tienda_preferida) values
  ('00000000-0000-0000-0000-00000000000a', '{"p1": 1}', 't1'),
  ('00000000-0000-0000-0000-00000000000b', '{"p1": 2}', 't1');
insert into alertas (user_id, tipo, mensaje)
  values ('00000000-0000-0000-0000-00000000000a', 'subida', 'prueba');

-- anon
set local role anon;
select isnt_empty('select * from precios_actuales', 'anon puede leer precios_actuales');
select throws_ok(
  $$insert into precios_actuales (producto_id, tienda_id, precio, fecha, estado)
    values ('p1', 't2', 4000, current_date, 'real')$$,
  '42501', null, 'anon no puede insertar en precios_actuales');
select throws_ok('select * from producto_fuente', '42501', null, 'anon no puede leer producto_fuente');

-- usuario A
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select results_eq('select user_id from listas',
  $$values ('00000000-0000-0000-0000-00000000000a'::uuid)$$,
  'el usuario A solo ve su propia lista');
select throws_ok(
  $$insert into anotados (producto_id, tienda_id, precio, autor)
    values ('p1', 't1', 4500, '00000000-0000-0000-0000-00000000000b')$$,
  '42501', null, 'un usuario no puede anotar con un autor ajeno');
select lives_ok(
  $$insert into anotados (producto_id, tienda_id, precio) values ('p1', 't1', 4500)$$,
  'un usuario puede anotar a su nombre');

select throws_ok('update alertas set mensaje = ''otro''', '42501', null,
  'el dueño de una alerta solo puede cambiar leida');

select * from finish();
rollback;
