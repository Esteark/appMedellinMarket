-- RLS y reglas de planes_usuario (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@prueba.co'),
  ('00000000-0000-0000-0000-00000000000b', 'b@prueba.co');
insert into planes_usuario (user_id, tipo, config) values
  ('00000000-0000-0000-0000-00000000000a', 'hogar', '{"version": 1}'),
  ('00000000-0000-0000-0000-00000000000b', 'hogar', '{"version": 1}');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);
select results_eq('select count(*)::int from planes_usuario', array[1], 'A solo ve su plan');
select is_empty(
  $$update planes_usuario set config = '{"version": 2}' where user_id = '00000000-0000-0000-0000-00000000000b' returning 1$$,
  'A no puede editar el plan de B');
select throws_ok(
  $$insert into planes_usuario (user_id, tipo, config) values ('00000000-0000-0000-0000-00000000000a', 'otro', '{}')$$,
  '23514', null, 'un tipo fuera de hogar/dieta se rechaza');
set local role anon;
select throws_ok('select * from planes_usuario', '42501', null, 'anon no puede leer planes_usuario');

select * from finish();
rollback;
