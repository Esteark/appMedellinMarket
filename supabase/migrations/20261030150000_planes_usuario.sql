-- 30-oct-2026: plan editable de Hogar y Dieta. Separado de presupuestos_mensuales (/presupuesto = gasto real).
create table planes_usuario (
  user_id uuid not null references auth.users on delete cascade,
  tipo text not null check (tipo in ('hogar','dieta')),
  config jsonb not null,
  actualizada timestamptz not null default now(),
  primary key (user_id, tipo)
);
alter table planes_usuario enable row level security;
create policy propia on planes_usuario for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on planes_usuario from anon, authenticated;
grant select, insert, update, delete on planes_usuario to authenticated;
