-- RLS y reglas de planes_guardados (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.co'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.co');
insert into planes_guardados (user_id, tipo, nombre, config) values
  ('00000000-0000-0000-0000-00000000000a', 'hogar', 'Octubre', '{"version": 1}'),
  ('00000000-0000-0000-0000-00000000000b', 'hogar', 'Octubre', '{"version": 1}');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select results_eq('select count(*)::int from planes_guardados', array[1],
  'A solo ve su presupuesto guardado');
select is_empty(
  $$update planes_guardados set config = '{"version": 2}' where user_id = '00000000-0000-0000-0000-00000000000b' returning 1$$,
  'A no puede editar el presupuesto guardado de B');
select throws_ok(
  $$insert into planes_guardados (user_id, tipo, nombre, config) values ('00000000-0000-0000-0000-00000000000a', 'otro', 'X', '{}')$$,
  '23514', null, 'un tipo fuera de hogar/dieta se rechaza');

reset role;
select throws_ok(
  $$insert into planes_guardados (user_id, tipo, nombre, config) values ('00000000-0000-0000-0000-00000000000a', 'hogar', ' octubre ', '{}')$$,
  '23505', null, 'el mismo nombre no se repite para el mismo tipo');

-- Una copia de Dieta con 5 semanas se guarda y se recupera completa.
insert into planes_guardados (user_id, tipo, nombre, config) values
  ('00000000-0000-0000-0000-00000000000a', 'dieta', 'Cinco semanas',
   jsonb_build_object('version', 1, 'semanas', jsonb_build_array(1, 2, 3, 4, 5)));
select is(
  (select jsonb_array_length(config -> 'semanas') from planes_guardados
    where user_id = '00000000-0000-0000-0000-00000000000a' and tipo = 'dieta'),
  5, 'una copia de Dieta con 5 semanas se recupera con sus 5 semanas');

set local role anon;
select throws_ok('select * from planes_guardados', '42501', null,
  'anon no puede leer planes_guardados');

select * from finish();
rollback;
