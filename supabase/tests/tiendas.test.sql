-- Escritura del catálogo compartido: tiendas y productos (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'c@prueba.co');
insert into tiendas (id, nombre, color) values ('base', 'Base', '#000000');
insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia)
  values ('pbase', 'Producto base', 'Frutas', 'kg', 'g', 1000, 'diaria');

set local role anon;
select throws_ok($$update tiendas set nombre = 'Otro nombre' where id = 'base'$$, '42501', null,
  'anon no puede actualizar tiendas');
select throws_ok($$update productos set nombre = 'Otro nombre' where id = 'pbase'$$, '42501', null,
  'anon no puede actualizar productos');

reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}', true);

select crear_tienda('Alfa');
select lives_ok($$update tiendas set nombre = 'Alfa Renombrada' where nombre_norm = 'alfa'$$,
  'con sesión se renombra una tienda');
select throws_ok($$update tiendas set nombre = 'BASE' where nombre_norm = 'alfa renombrada'$$, '23505', null,
  'renombrar a un nombre que solo difiere en mayúsculas falla por el índice único');
select throws_ok($$update tiendas set nombre = 'Báse' where nombre_norm = 'alfa renombrada'$$, '23505', null,
  'renombrar a un nombre que solo difiere en tilde falla por el índice único');

select throws_ok($$delete from tiendas where id = 'base'$$, '42501', null,
  'nadie borra tiendas');
select throws_ok($$delete from productos where id = 'pbase'$$, '42501', null,
  'nadie borra productos');

select * from finish();
rollback;
