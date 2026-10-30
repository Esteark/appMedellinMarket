-- Pruebas de corregir_precio / quitar_correccion (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into tiendas (id, nombre, color) values ('t1', 'Tienda 1', '#000000');
insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia)
  values ('p1', 'Producto 1', 'Frutas', 'kg', 'g', 1000, 'diaria');
insert into precios_actuales (producto_id, tienda_id, precio, fecha, estado)
  values ('p1', 't1', 5000, current_date, 'real');
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.co'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.co');

-- anon
set local role anon;
select throws_ok($$select corregir_precio('p1', 't1', 4000)$$, '42501', null,
  'anon no puede ejecutar corregir_precio');
select throws_ok(
  $$insert into precios_manuales_historial (producto_id, tienda_id, precio) values ('p1', 't1', 4000)$$,
  '42501', null, 'anon no puede insertar en precios_manuales_historial');

-- usuario A corrige
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select corregir_precio('p1', 't1', 4000);
select corregir_precio('p1', 't1', 4200);
select results_eq($$select precio from anotados where producto_id = 'p1'$$, array[4200],
  'corregir escribe el anotado con el último precio');
select results_eq($$select precio from precios_manuales_historial where producto_id = 'p1'$$, array[4200],
  'corregir dos veces el mismo día deja una sola fila en el historial');
select results_eq($$select precio from precio_efectivo where producto_id = 'p1' and tienda_id = 't1'$$, array[4200],
  'precio_efectivo devuelve el precio manual');
select throws_ok($$select corregir_precio('p1', 't1', 50)$$, 'P0001', 'precio_invalido',
  'un precio fuera de rango se rechaza');

-- usuario B no puede quitar la corrección de A
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);
select is(quitar_correccion('p1', 't1'), false, 'B no puede quitar la corrección de A');
select results_eq($$select count(*)::int from anotados where producto_id = 'p1'$$, array[1],
  'el anotado de A sigue ahí');

-- A la quita: el historial anterior se conserva
reset role;
insert into precios_manuales_historial (producto_id, tienda_id, precio, fecha, autor)
  values ('p1', 't1', 3900, current_date - 1, '00000000-0000-0000-0000-00000000000a');
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select is(quitar_correccion('p1', 't1'), true, 'A quita su corrección');
select results_eq($$select count(*)::int from precios_manuales_historial where producto_id = 'p1'$$, array[1],
  'quitar borra la fila de hoy y conserva las de días anteriores');

select * from finish();
rollback;
