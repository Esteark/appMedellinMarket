-- La Vaquita (vaquitaexpress.com.co, Magento): consulta automática de páginas de producto (paso 21).
-- Sus 40 URLs de producto las siembra `pnpm migrar` desde data/fuentes/vaquita.json (los productos
-- todavía no existen cuando corren las migraciones).
insert into tiendas (id, nombre, color, manual) values ('vaquita', 'La Vaquita', '#0891B2', false)
on conflict (id) do nothing;

