-- catalogo_tienda y la alerta precio_manual_vencido (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into tiendas (id, nombre, color) values ('barrio', 'Tienda/Carnicería de barrio', '#000000') on conflict do nothing;
insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia)
  values ('p1', 'Producto 1', 'Proteínas', 'kg', 'g', 1000, 'diaria');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'a@prueba.co');

select results_eq('select count(*)::int from precios_actuales where tienda_id = ''barrio''', array[0],
  'barrio no trae ni un precio sembrado');
select results_eq('select count(*)::int from anotados where tienda_id = ''barrio''', array[0],
  'barrio no trae anotados sembrados');

set local role anon;
select lives_ok('select * from catalogo_tienda', 'anon lee catalogo_tienda');
select throws_ok($$insert into catalogo_tienda (producto_id) values ('p1')$$, '42501', null,
  'anon no puede escribir en catalogo_tienda');

reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
insert into catalogo_tienda (producto_id, orden) values ('p1', 1);
update catalogo_tienda set activo = false where producto_id = 'p1';
select results_eq($$select activo from catalogo_tienda where producto_id = 'p1'$$, array[false],
  'quitar es activo = false: la fila sigue ahí');
select throws_ok($$insert into catalogo_tienda (producto_id, tienda_id) values ('p1', 'd1')$$, '23514', null,
  'el catálogo es solo de barrio');

reset role;
select lives_ok(
  $$insert into alertas (user_id, tipo, mensaje) values ('00000000-0000-0000-0000-00000000000a', 'precio_manual_vencido', 'x')$$,
  'alertas acepta precio_manual_vencido');

select * from finish();
rollback;
