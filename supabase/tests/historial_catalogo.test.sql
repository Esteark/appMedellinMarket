-- historial_minimo solo cuenta las tiendas que hoy siguen el producto (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into tiendas (id, nombre, color) values ('ta', 'Tienda A', '#000000'), ('tb', 'Tienda B', '#111111');
insert into productos (id, nombre, grupo, unidad, unidad_base, cantidad_base, frecuencia)
  values ('h1', 'Producto H1', 'Frutas', 'kg', 'g', 1000, 'diaria');
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000a', 'a@prueba.co');
insert into catalogo_tienda (producto_id, tienda_id) values ('h1', 'ta'), ('h1', 'tb');
-- A cuesta 2100 y B cuesta 3300 desde hace 3 días; hoy también hay una corrección a mano en A.
insert into precios_historial (producto_id, tienda_id, fecha, precio, estado)
  select 'h1', 'ta', (now() at time zone 'America/Bogota')::date - g, 2100, 'real' from generate_series(0, 2) g;
insert into precios_historial (producto_id, tienda_id, fecha, precio, estado)
  select 'h1', 'tb', (now() at time zone 'America/Bogota')::date - g, 3300, 'real' from generate_series(0, 2) g;

select results_eq(
  $$select precio from historial_minimo where producto_id = 'h1' order by fecha desc limit 1$$,
  array[2100], 'con las dos tiendas, el mínimo es el de A');

update catalogo_tienda set activo = false where producto_id = 'h1' and tienda_id = 'ta';
select results_eq(
  $$select precio from historial_minimo where producto_id = 'h1' order by fecha desc limit 1$$,
  array[3300], 'quitada A del catálogo, el mínimo pasa a ser el de B');
select results_eq(
  $$select (puntos -> -1 ->> 'precio')::int from serie_pronostico where producto_id = 'h1'$$,
  array[3300], 'la serie del pronóstico también deja de contar a A');

-- Las correcciones a mano de una tienda quitada tampoco cuentan.
insert into precios_manuales_historial (producto_id, tienda_id, precio, fecha, autor)
  values ('h1', 'ta', 1500, (now() at time zone 'America/Bogota')::date, '00000000-0000-0000-0000-00000000000a');
select results_eq(
  $$select precio from historial_minimo where producto_id = 'h1' order by fecha desc limit 1$$,
  array[3300], 'una corrección a mano de A no baja el mínimo mientras A no lo siga');

-- Reactivar la tienda devuelve su historial, sin haberlo borrado.
update catalogo_tienda set activo = true where producto_id = 'h1' and tienda_id = 'ta';
select results_eq(
  $$select precio from historial_minimo where producto_id = 'h1' order by fecha desc limit 1$$,
  array[1500], 'al reactivar A vuelven su historial y su corrección');

-- Un producto sin ninguna tienda no tiene historial visible.
update catalogo_tienda set activo = false where producto_id = 'h1';
select is_empty($$select 1 from historial_minimo where producto_id = 'h1'$$,
  'sin ninguna tienda que lo siga no hay historial');

select * from finish();
rollback;
