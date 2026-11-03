-- 3-nov-2026 (paso 48): presupuesto por rubro por mes, en la cuenta y con historial.
-- 1. `presupuestos_historial`: cada cambio de monto de `presupuestos_mensuales` (lo escribe un disparador; nadie escribe desde el cliente).
-- 2. `guardar_presupuesto_mes`: guarda los rubros de un mes en una sola transacción y quita los que ya no vienen.

create table presupuestos_historial (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  mes text not null,
  rubro text not null,
  monto_anterior integer,  -- null = el rubro se creó
  monto_nuevo integer,     -- null = el rubro se quitó
  creado timestamptz not null default now()
);
create index on presupuestos_historial (user_id, mes, creado desc);

alter table presupuestos_historial enable row level security;
create policy propia_ph on presupuestos_historial for select to authenticated using (auth.uid() = user_id);
revoke all on presupuestos_historial from anon, authenticated;
grant select on presupuestos_historial to authenticated;

create function registrar_cambio_presupuesto() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into presupuestos_historial (user_id, mes, rubro, monto_anterior, monto_nuevo)
      values (new.user_id, new.mes, new.rubro, null, new.monto);
  elsif tg_op = 'UPDATE' then
    if new.monto is distinct from old.monto then
      insert into presupuestos_historial (user_id, mes, rubro, monto_anterior, monto_nuevo)
        values (new.user_id, new.mes, new.rubro, old.monto, new.monto);
    end if;
  elsif exists (select 1 from auth.users where id = old.user_id) then
    -- Al borrar una cuenta, sus filas caen en cascada: no hay a quién escribirle historial.
    insert into presupuestos_historial (user_id, mes, rubro, monto_anterior, monto_nuevo)
      values (old.user_id, old.mes, old.rubro, old.monto, null);
  end if;
  return null;
end $$;

create trigger presupuestos_mensuales_historial
  after insert or update or delete on presupuestos_mensuales
  for each row execute function registrar_cambio_presupuesto();

create function guardar_presupuesto_mes(p_mes text, p_rubros jsonb) returns void
language plpgsql set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_r jsonb;
  v_monto numeric;
begin
  if v_uid is null then raise exception 'sin_sesion'; end if;
  if p_mes is null or p_mes !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'mes_invalido'; end if;
  if p_rubros is null or jsonb_typeof(p_rubros) <> 'array'
     or jsonb_array_length(p_rubros) not between 1 and 50 then
    raise exception 'rubros_invalidos';
  end if;
  for v_r in select * from jsonb_array_elements(p_rubros) loop
    if coalesce(btrim(v_r->>'rubro'), '') = '' or length(v_r->>'rubro') > 60 then
      raise exception 'rubros_invalidos';
    end if;
    v_monto := (v_r->>'monto')::numeric;
    if v_monto is null or v_monto <> trunc(v_monto) or v_monto < 0 or v_monto > 50000000 then
      raise exception 'monto_invalido';
    end if;
  end loop;
  if (select count(distinct btrim(x->>'rubro')) from jsonb_array_elements(p_rubros) x)
     <> jsonb_array_length(p_rubros) then
    raise exception 'rubros_invalidos';
  end if;

  insert into presupuestos_mensuales (user_id, mes, rubro, monto, orden)
    select v_uid, p_mes, btrim(x->>'rubro'), (x->>'monto')::int, coalesce((x->>'orden')::int, 0)
      from jsonb_array_elements(p_rubros) x
    on conflict (user_id, mes, rubro)
    do update set monto = excluded.monto, orden = excluded.orden, updated_at = now();

  delete from presupuestos_mensuales
   where user_id = v_uid and mes = p_mes
     and rubro not in (select btrim(x->>'rubro') from jsonb_array_elements(p_rubros) x);
end $$;

revoke all on function guardar_presupuesto_mes(text, jsonb) from public, anon;
grant execute on function guardar_presupuesto_mes(text, jsonb) to authenticated;
