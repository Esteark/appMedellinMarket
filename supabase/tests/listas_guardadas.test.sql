-- Pruebas de RLS y reglas de listas_guardadas (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into tiendas (id, nombre, color) values ('d1', 'D1', '#000000') on conflict do nothing;
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.co'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.co');
insert into listas_guardadas (user_id, nombre, items) values
  ('00000000-0000-0000-0000-00000000000a', 'Quincena', '{"arroz": 1}'),
  ('00000000-0000-0000-0000-00000000000b', 'Fiesta', '{"leche": 2}');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select results_eq('select nombre from listas_guardadas', array['Quincena'], 'A solo ve sus listas');
select is_empty(
  $$update listas_guardadas set nombre = 'Robada' where nombre = 'Fiesta' returning 1$$,
  'A no puede editar las listas de B');
select throws_ok(
  $$insert into listas_guardadas (user_id, nombre) values ('00000000-0000-0000-0000-00000000000a', '  QUINCENA ')$$,
  '23505', null, 'nombres que solo difieren en mayúsculas o espacios chocan');
select throws_ok(
  format($f$insert into listas_guardadas (user_id, nombre) values ('00000000-0000-0000-0000-00000000000a', %L)$f$, repeat('x', 61)),
  '23514', null, '61 caracteres se rechazan');

set local role anon;
select throws_ok('select * from listas_guardadas', '42501', null, 'anon no puede leer listas_guardadas');

select * from finish();
rollback;
