-- Presupuesto por mes e historial de cambios (pgTAP). Corre con: pnpm exec supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'd1@prueba.co'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@prueba.co');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "00000000-0000-0000-0000-0000000000d1", "role": "authenticated"}', true);

-- 1. Guardar un mes crea sus rubros.
select lives_ok($$select guardar_presupuesto_mes('2026-10',
  '[{"rubro":"Carnes","monto":500000,"orden":0}]'::jsonb)$$, 'guarda octubre');
select lives_ok($$select guardar_presupuesto_mes('2026-11',
  '[{"rubro":"Carnes","monto":600000,"orden":0},{"rubro":"Granos","monto":250000,"orden":1},{"rubro":"Aseo","monto":60000,"orden":2}]'::jsonb)$$,
  'guarda noviembre');

-- 2. Cada rubro creado deja una fila de historial sin monto anterior.
select results_eq(
  $$select count(*)::int from presupuestos_historial where mes = '2026-11' and monto_anterior is null$$,
  $$values (3)$$, 'noviembre deja 3 filas de historial de creación');

-- 3. Guardar noviembre no cambia octubre.
select results_eq(
  $$select monto from presupuestos_mensuales where mes = '2026-10' and rubro = 'Carnes'$$,
  $$values (500000)$$, 'octubre sigue igual');

-- 4. Cambiar un monto deja una fila con el anterior y el nuevo.
select lives_ok($$select guardar_presupuesto_mes('2026-11',
  '[{"rubro":"Carnes","monto":650000,"orden":0},{"rubro":"Granos","monto":250000,"orden":1},{"rubro":"Aseo","monto":60000,"orden":2}]'::jsonb)$$,
  'cambia el monto de Carnes');
select results_eq(
  $$select monto_anterior, monto_nuevo from presupuestos_historial
     where mes = '2026-11' and rubro = 'Carnes' and monto_anterior is not null$$,
  $$values (600000, 650000)$$, 'el cambio deja el monto anterior y el nuevo');

-- 5. Guardar el mismo monto no deja fila.
select results_eq(
  $$select count(*)::int from presupuestos_historial where mes = '2026-11' and rubro = 'Granos'$$,
  $$values (1)$$, 'un monto que no cambia no suma historial');

-- 6. Quitar un rubro lo borra y deja una fila sin monto nuevo.
select guardar_presupuesto_mes('2026-11',
  '[{"rubro":"Carnes","monto":650000,"orden":0},{"rubro":"Granos","monto":250000,"orden":1}]'::jsonb);
select results_eq(
  $$select (select count(*)::int from presupuestos_mensuales where mes = '2026-11' and rubro = 'Aseo'),
          (select monto_anterior from presupuestos_historial where mes = '2026-11' and rubro = 'Aseo' and monto_nuevo is null)$$,
  $$values (0, 60000)$$, 'quitar un rubro lo borra y queda en el historial');

-- 7. Validaciones.
select throws_like($$select guardar_presupuesto_mes('noviembre', '[{"rubro":"A","monto":1}]'::jsonb)$$,
  '%mes_invalido%', 'un mes que no es AAAA-MM falla');
select throws_like($$select guardar_presupuesto_mes('2026-11', '[{"rubro":"A","monto":-5}]'::jsonb)$$,
  '%monto_invalido%', 'un monto negativo falla');
select throws_like($$select guardar_presupuesto_mes('2026-11', '[{"rubro":"A","monto":1},{"rubro":"A","monto":2}]'::jsonb)$$,
  '%rubros_invalidos%', 'un rubro repetido falla');

-- 8. El historial es privado y no se escribe desde el cliente.
select throws_ok($$insert into presupuestos_historial (user_id, mes, rubro, monto_nuevo)
  values ('00000000-0000-0000-0000-0000000000d1', '2026-11', 'X', 1)$$, '42501', null,
  'no se puede escribir en el historial desde el cliente');

select * from finish();
rollback;
