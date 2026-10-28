-- Presupuesto real: hogares editables + gastos anotados
create table if not exists presupuestos_mensuales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  mes text not null,
  rubro text not null,
  monto integer not null check (monto >= 0),
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, mes, rubro)
);

create table if not exists gastos_reales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  fecha date not null default ((now() at time zone 'America/Bogota')::date),
  mes text not null,
  rubro text not null,
  monto integer not null check (monto >= 0),
  tienda_id text references tiendas,
  producto_id text references productos,
  origen text not null check (origen in ('manual','desde_lista','plan_hogar','plan_dieta')),
  nota text,
  created_at timestamptz not null default now()
);

create index if not exists gastos_reales_user_mes_fecha_idx on gastos_reales (user_id, mes, fecha);
create index if not exists gastos_reales_user_rubro_idx on gastos_reales (user_id, rubro);

alter table presupuestos_mensuales enable row level security;
alter table gastos_reales enable row level security;

drop policy if exists propia_pm on presupuestos_mensuales;
create policy propia_pm on presupuestos_mensuales for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists propia_gr on gastos_reales;
create policy propia_gr on gastos_reales for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
