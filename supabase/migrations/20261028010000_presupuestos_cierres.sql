-- Histórico de presupuestos: snapshot por mes
create table if not exists presupuestos_cierres (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  mes text not null,
  total_presupuestado integer not null default 0 check (total_presupuestado >= 0),
  total_gastado integer not null default 0 check (total_gastado >= 0),
  ahorro integer not null default 0,
  por_rubro jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, mes)
);

create index if not exists presupuestos_cierres_user_mes_idx on presupuestos_cierres (user_id, mes);

alter table presupuestos_cierres enable row level security;

drop policy if exists propia_pc on presupuestos_cierres;
create policy propia_pc on presupuestos_cierres for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
