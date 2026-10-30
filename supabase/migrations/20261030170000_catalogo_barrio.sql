-- 30-oct-2026: catálogo propio de Tienda/Carnicería de barrio. Guarda qué productos se le siguen, nunca precios:
-- cada precio entra a mano con corregir_precio('barrio', …).
create table catalogo_tienda (
  producto_id text not null references productos,
  tienda_id text not null default 'barrio' references tiendas check (tienda_id = 'barrio'),
  activo boolean not null default true,
  orden integer not null default 0,
  autor uuid references auth.users default auth.uid(),
  creado timestamptz not null default now(),
  primary key (producto_id, tienda_id)
);
create index on catalogo_tienda (tienda_id, activo, orden);

alter table catalogo_tienda enable row level security;
create policy leer on catalogo_tienda for select using (true);
create policy crear on catalogo_tienda for insert to authenticated
  with check (autor = auth.uid());
create policy editar on catalogo_tienda for update to authenticated
  using (true) with check (autor = auth.uid());
revoke all on catalogo_tienda from anon, authenticated;
grant select on catalogo_tienda to anon, authenticated;
grant insert, update on catalogo_tienda to authenticated;

-- 41 productos iniciales (17 proteínas, 12 lácteos, 7 panadería, 5 despensa). Se une con productos para no
-- fallar en una base recién reiniciada (aún sin productos): ahí los siembra `pnpm migrar`.
insert into catalogo_tienda (producto_id, tienda_id, orden)
select p.id, 'barrio', v.orden
from (values
  ('atun',1),
  ('cerdo',2),
  ('chorizo',3),
  ('costilla',4),
  ('higado',5),
  ('huevos',6),
  ('jamon',7),
  ('molida',8),
  ('muslos',9),
  ('pollo',10),
  ('pollo_entero',11),
  ('res_desmechar',12),
  ('res_sudar',13),
  ('salchicha',14),
  ('sardinas',15),
  ('tilapia',16),
  ('tocino',17),
  ('crema_leche',18),
  ('kumis',19),
  ('leche',20),
  ('leche_deslactosada',21),
  ('leche_polvo',22),
  ('mantequilla',23),
  ('parmesano',24),
  ('queso',25),
  ('queso_crema',26),
  ('queso_mozzarella',27),
  ('yogur',28),
  ('yogur_griego',29),
  ('croissant',30),
  ('muffin',31),
  ('pan_frances',32),
  ('pan_integral',33),
  ('pan_tajado',34),
  ('pandebono',35),
  ('torta_chocolate',36),
  ('aceite',37),
  ('azucar',38),
  ('cafe',39),
  ('panela',40),
  ('sal',41)
) as v(id, orden)
join productos p on p.id = v.id
on conflict do nothing;

-- Nueva alerta: precio manual de barrio sin actualizar.
alter table alertas drop constraint alertas_tipo_check;
alter table alertas add constraint alertas_tipo_check check (tipo in
  ('mas_barato','mercado_completo','subida','caro_por_clima','fuente_caida','precio_manual_vencido'));
