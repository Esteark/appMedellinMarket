-- Las 40 URLs de La Vaquita (paso 21) para una base que YA tiene los productos (producción).
-- No se corre `pnpm migrar` allá: sobrescribiría precios y anotados con la foto del artifact.
-- En una base nueva los productos aún no existen cuando corren las migraciones: el join no inserta
-- nada y las siembra `pnpm migrar` desde data/fuentes/vaquita.json (misma fuente de estas filas).
insert into producto_fuente (producto_id, tienda_id, url)
select v.id, 'vaquita', v.url
from (values
  ('aceite', 'https://vaquitaexpress.com.co/productos-marca-vaquita/aceite-de-girasol-la-vaquita-x-900ml.html'),
  ('aceite_oliva', 'https://vaquitaexpress.com.co/despensa/aceites/aceite-de-oliva-extra-virgen-la-constancia-colombina-x-500ml.html'),
  ('blanqueador', 'https://vaquitaexpress.com.co/productos-marca-vaquita/blanqueador-desinfectante-la-vaquita-sin-aroma-x-1000ml.html'),
  ('crema_dental', 'https://vaquitaexpress.com.co/cuidado-personal/higiene-oral/crema-dental-colgate-doble-frescura-x-100ml.html'),
  ('detergente', 'https://vaquitaexpress.com.co/cuidado-del-hogar/detergentes/detergente-en-polvo-ariel-doble-poder-regular-x-1500gr.html'),
  ('shampoo', 'https://vaquitaexpress.com.co/cuidado-personal/cuidado-capilar/shampoo-pantene-pro-v-restauracion-x-400ml.html'),
  ('gaseosa', 'https://vaquitaexpress.com.co/licores-bebidas-y-snacks/bebidas-gaseosas/bebida-gaseosa-coca-cola-sabor-original-pet-x-1500ml.html'),
  ('vino_tinto', 'https://vaquitaexpress.com.co/ofertas-imperdibles/vino-tinto-gato-negro-carmenere-botella-x-750ml.html'),
  ('cafe', 'https://vaquitaexpress.com.co/despensa/cafe/cafe-sello-rojo-tostado-y-molido-tradicional-bolsa-x-425gr.html'),
  ('panela', 'https://vaquitaexpress.com.co/despensa/panelas/panela-valluna-sf-x-1000gr.html'),
  ('margarina', 'https://vaquitaexpress.com.co/lacteos-huevos-y-refrigerados/margarinas-y-esparcibles/margarina-para-mesa-y-cocina-la-fina-x-500gr.html'),
  ('mayonesa', 'https://vaquitaexpress.com.co/despensa/salsas/mayonesa-fruco-receta-artesanal-frasco-x-440gr.html'),
  ('miel', 'https://vaquitaexpress.com.co/despensa/reposteria/miel-de-abejas-dispronat-botella-x-350gr.html'),
  ('mostaza', 'https://vaquitaexpress.com.co/despensa/salsas/mostaza-fruco-doypack-x-200gr.html'),
  ('salsa_tomate', 'https://vaquitaexpress.com.co/despensa/salsas/salsa-de-tomate-fruco-doypack-x-400gr.html'),
  ('soya', 'https://vaquitaexpress.com.co/despensa/salsas/salsa-de-soya-la-constancia-pet-x-164ml.html'),
  ('aceitunas', 'https://vaquitaexpress.com.co/despensa/encurtidos/aceitunas-negras-deshuesada-monticello-x-340gr.html'),
  ('arroz', 'https://vaquitaexpress.com.co/despensa/arroz-y-granos/arroz-blanco-castellano-premium-x-1000gr.html'),
  ('avena', 'https://vaquitaexpress.com.co/despensa/cereales/avena-en-hojuelas-dispronat-libre-de-gluten-x-500gr.html'),
  ('frijol', 'https://vaquitaexpress.com.co/despensa/arroz-y-granos/frijoles-cargamanto-rojo-diana-x-500gr.html'),
  ('garbanzo', 'https://vaquitaexpress.com.co/despensa/arroz-y-granos/garbanzo-diana-x-500gr.html'),
  ('harina_maiz', 'https://vaquitaexpress.com.co/despensa/harinas/harina-precocida-de-maiz-pan-maiz-blanco-x-1000gr.html'),
  ('harina_trigo', 'https://vaquitaexpress.com.co/despensa/harinas/harina-de-trigo-haz-de-oros-tradicional-x-1000gr.html'),
  ('lenteja', 'https://vaquitaexpress.com.co/despensa/arroz-y-granos/lenteja-aburra-x-460gr.html'),
  ('pasta', 'https://vaquitaexpress.com.co/despensa/pastas/pasta-doria-spaghetti-x-500gr.html'),
  ('crema_leche', 'https://vaquitaexpress.com.co/despensa/reposteria/crema-de-leche-finesse-alpina-semientera-uht-baja-en-grasa-tetra-x-200ml.html'),
  ('kumis', 'https://vaquitaexpress.com.co/lacteos-huevos-y-refrigerados/bebidas-lacteas/kumis-alpina-natural-bolsa-x-1000ml.html'),
  ('leche_polvo', 'https://vaquitaexpress.com.co/despensa/leches-en-polvo/leche-en-polvo-colanta-entera-x-900gr.html'),
  ('mantequilla', 'https://vaquitaexpress.com.co/lacteos-huevos-y-refrigerados/mantequillas/mantequilla-colanta-con-sal-x-250gr.html'),
  ('queso_crema', 'https://vaquitaexpress.com.co/lacteos-huevos-y-refrigerados/quesos-quesitos-y-cuajadas/queso-crema-colanta-para-untar-x-230gr.html'),
  ('yogur_griego', 'https://vaquitaexpress.com.co/lacteos-huevos-y-refrigerados/bebidas-lacteas/yogurt-griego-alpina-sin-dulce-sabor-natural-x-500gr.html'),
  ('arequipe', 'https://vaquitaexpress.com.co/despensa/dulceria-y-confiteria/arequipe-alpina-dulce-de-leche-x-500gr.html'),
  ('mani', 'https://vaquitaexpress.com.co/licores-bebidas-y-snacks/frutos-secos/mani-riovalle-bolsa-x-170gr-salado.html'),
  ('pan_tajado', 'https://vaquitaexpress.com.co/despensa/panaderia/pan-tajado-mama-ines-blanco-x-420gr.html'),
  ('pan_integral', 'https://vaquitaexpress.com.co/despensa/panaderia/pan-tajado-mama-ines-integral-x-440gr.html'),
  ('atun', 'https://vaquitaexpress.com.co/despensa/enlatados-carnicos-y-vegetales/atun-catalina-lomitos-en-agua-x-160gr.html'),
  ('higado', 'https://vaquitaexpress.com.co/productos-marca-vaquita/higado-de-res-x-1000gr.html'),
  ('molida', 'https://vaquitaexpress.com.co/productos-marca-vaquita/carne-molida-especial-de-res-x-1000gr.html'),
  ('muslos', 'https://vaquitaexpress.com.co/productos-marca-vaquita/muslos-de-pollo-campesino-x-1000gr.html'),
  ('pollo', 'https://vaquitaexpress.com.co/productos-marca-vaquita/pechugas-de-pollo-campesino-a-granel-x-1000gr.html')
) as v(id, url)
join productos p on p.id = v.id
on conflict (producto_id, tienda_id) do update set url = excluded.url, activo = true;
