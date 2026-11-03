-- Tope de 200 productos por día y productos de factura con su ficha (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'c@prueba.co');
-- Un producto que ya existe, sin ícono: la importación no debe tocar su ficha.
insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia)
  values ('p-existente', 'Leche existente', 'Lácteos', 'l', 'ml', 1000, 'diaria');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000c", "role": "authenticated"}', true);

-- 1. Un producto nuevo trae su ficha: grupo, unidad, tamaño e ícono.
select lives_ok($$select importar_compra('2026-10-30', 'a.csv', true,
  '[{"producto":"Arroz Federal 2500g","cantidad":1,"precio_total":15990,"tienda":"Tienda Prueba","codigo":"123456",
     "rubro":"Despensa","grupo":"Granos","unidad":"g","cantidad_base":2500,"emoji":"🍚"}]'::jsonb,
  repeat('a', 64))$$, 'importa una fila con grupo, unidad, tamaño e ícono');
select results_eq(
  $$select grupo, unidad, unidad_base, cantidad_base::int, emoji from productos where nombre_norm = 'arroz federal 2500g'$$,
  $$values ('Granos', 'g', 'g', 2500, '🍚')$$,
  'el producto nuevo nace con el grupo, la unidad, el tamaño y el ícono de la fila');

-- 2. Por peso: kg de base 1000 g.
select importar_compra('2026-10-30', 'b.csv', true,
  '[{"producto":"Cerdo pierna","cantidad":4.14,"precio_total":53737,"tienda":"Tienda Prueba","unidad":"kg","cantidad_base":1,"grupo":"Proteínas"}]'::jsonb,
  repeat('b', 64));
select results_eq(
  $$select unidad, unidad_base, cantidad_base::int, grupo from productos where nombre_norm = 'cerdo pierna'$$,
  $$values ('kg', 'g', 1000, 'Proteínas')$$,
  'una línea por peso crea el producto en kg con base de 1000 g');

-- 3. Sin los campos nuevos se comporta como antes: grupo = rubro, u 1, sin ícono.
select importar_compra('2026-10-30', 'c.csv', true,
  '[{"producto":"Producto viejo estilo","cantidad":1,"precio_total":5000,"tienda":"Tienda Prueba","rubro":"Despensa"}]'::jsonb,
  repeat('c', 64));
select results_eq(
  $$select grupo, unidad, cantidad_base::int, emoji from productos where nombre_norm = 'producto viejo estilo'$$,
  $$values ('Despensa', 'u', 1, null::text)$$,
  'sin grupo, unidad ni tamaño nuevos, el producto nace como antes');

-- 4. Un producto que ya existe no cambia su ficha aunque la fila traiga otra.
select importar_compra('2026-10-30', 'd.csv', true,
  '[{"producto":"Leche existente","cantidad":1,"precio_total":4000,"tienda":"Tienda Prueba","grupo":"Otros","unidad":"u","emoji":"🥛"}]'::jsonb,
  repeat('d', 64));
select results_eq(
  $$select grupo, unidad, emoji from productos where id = 'p-existente'$$,
  $$values ('Lácteos', 'l', null::text)$$,
  'un producto que ya existía conserva su grupo, su unidad y no recibe ícono');

-- 5. Un ícono de más de 8 caracteres se recorta.
select importar_compra('2026-10-30', 'e.csv', true,
  '[{"producto":"Producto ícono largo","cantidad":1,"precio_total":5000,"tienda":"Tienda Prueba","emoji":"abcdefghijklmno"}]'::jsonb,
  repeat('e', 64));
select results_eq(
  $$select char_length(emoji) from productos where nombre_norm = 'producto icono largo'$$,
  array[8], 'el ícono se recorta a 8 caracteres');

-- 6. «Solo gasto»: sin publicar no se crea producto, y el gasto queda.
select importar_compra('2026-10-30', 'f.csv', true,
  '[{"producto":"Bolsa Recicla","cantidad":1,"precio_total":200,"tienda":"Tienda Prueba","publicar_precio":false}]'::jsonb,
  repeat('f', 64));
select is_empty($$select 1 from productos where nombre_norm = 'bolsa recicla'$$,
  'una línea solo gasto no crea producto');
select results_eq(
  $$select count(*)::int from gastos_reales where descripcion = 'Bolsa Recicla' and producto_id is null$$,
  array[1], 'y su gasto queda registrado sin producto');

-- 7. Un producto elegido a mano en la revisión manda sobre el nombre, y la próxima factura coincide sola.
select importar_compra('2026-10-30', 'g.csv', true,
  '[{"producto":"Leche Colanta 1000ml Entera B","cantidad":1,"precio_total":3950,"tienda":"Tienda Prueba","codigo":"009487","producto_id":"p-existente"}]'::jsonb,
  repeat('1', 64));
select is_empty($$select 1 from productos where nombre_norm = 'leche colanta 1000ml entera b'$$,
  'si la persona eligió un producto existente no se crea uno nuevo con el nombre de la factura');
select results_eq(
  $$select producto_id from gastos_reales where descripcion = 'Leche Colanta 1000ml Entera B'$$,
  array['p-existente'], 'el gasto queda ligado al producto elegido');
select importar_compra('2026-10-31', 'h.csv', true,
  '[{"producto":"Leche Colanta 1000ml Entera B","cantidad":2,"precio_total":7900,"tienda":"Tienda Prueba","codigo":"009487"}]'::jsonb,
  repeat('2', 64));
select results_eq(
  $$select count(*)::int from gastos_reales where descripcion = 'Leche Colanta 1000ml Entera B' and producto_id = 'p-existente'$$,
  array[2], 'la factura siguiente, sin producto_id, coincide sola por el alias y el código que quedaron guardados');

-- 8. El tope: se completan 200 productos creados hoy por esta persona y el 201 falla.
select crear_producto('Relleno ' || g)
  from generate_series(1, 200 - (select count(*)::int from productos
    where creado_por = '00000000-0000-0000-0000-00000000000c')) g;
select results_eq(
  $$select count(*)::int from productos where creado_por = '00000000-0000-0000-0000-00000000000c'$$,
  array[200], 'la persona llega a 200 productos creados en el día');
select throws_ok($$select crear_producto('Producto 201')$$, 'P0001', 'limite_productos',
  'el producto 201 del día falla con limite_productos');

select * from finish();
rollback;
