-- Catálogo compartido e importación de compras (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000b', 'b@prueba.co');

set local role anon;
select throws_ok($$insert into tiendas (id, nombre, color) values ('x', 'Tienda X', '#000000')$$, '42501', null,
  'anon no puede insertar en tiendas');
select throws_ok($$insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia)
  values ('x', 'Producto X', 'Otros', 'u', 'u', 1, 'semanal')$$, '42501', null,
  'anon no puede insertar en productos');
select throws_ok(
  $$select importar_compra('2026-10-30', 'f.csv', true, '[]'::jsonb, repeat('a', 64))$$, '42501', null,
  'anon no ejecuta importar_compra');

reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

select is(crear_tienda('Olímpica'), crear_tienda('OLIMPICA'),
  'crear_tienda devuelve la misma tienda aunque cambie tilde o mayúscula');

select crear_tienda('Tienda 2'), crear_tienda('Tienda 3'), crear_tienda('Tienda 4'), crear_tienda('Tienda 5');
select throws_ok($$select crear_tienda('Tienda 6')$$, 'P0001', 'limite_tiendas',
  'la sexta tienda nueva del día falla');

select crear_producto('Producto de prueba');
select results_eq(
  $$select grupo, unidad, cantidad_base::int, frecuencia, revisado
    from productos where nombre_norm = 'producto de prueba'$$,
  $$values ('Otros', 'u', 1, 'semanal', false)$$,
  'un producto nuevo nace con los valores por defecto y por revisar');

select lives_ok(
  $$select importar_compra('2026-10-30', 'a.csv', true,
    '[{"producto":"Leche nueva","cantidad":3,"precio_total":12000,"tienda":"Olímpica"}]'::jsonb,
    repeat('a', 64))$$,
  'importar_compra guarda un lote con sesión');
select throws_ok(
  $$select importar_compra('2026-10-30', 'a.csv', true,
    '[{"producto":"Leche nueva","cantidad":3,"precio_total":12000,"tienda":"Olímpica"}]'::jsonb,
    repeat('a', 64))$$,
  'P0001', 'importacion_duplicada', 'el mismo hash del mismo usuario se rechaza');

select importar_compra('2026-10-30', 'b.csv', true,
  '[{"producto":"Arroz nuevo","cantidad":2,"precio_total":10000,"tienda":"Olímpica"}]'::jsonb,
  repeat('b', 64));
update anotados set precio = 6000, fecha = '2026-10-31'
  where producto_id = (select id from productos where nombre_norm = 'arroz nuevo');
select is(
  (select deshacer_importacion(id)->>'conservados' from importaciones_gastos where hash = repeat('b', 64)),
  '1', 'deshacer conserva un precio que cambió después del lote');

select * from finish();
rollback;
