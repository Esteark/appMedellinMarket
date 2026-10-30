-- 30-oct-2026: la familia no merca en Éxito, Carulla, Euro, Ara ni Ísimo. Se borra de hijas a padre.
-- Primero las listas que las tenían como preferida: la FK impediría borrar la tienda.
update listas set tienda_preferida = 'd1'
  where tienda_preferida in ('exito','carulla','euro','ara','isimo');
alter table listas alter column tienda_preferida set default 'd1';

delete from alertas where tienda_id in ('exito','carulla','euro','ara','isimo');
delete from anotados where tienda_id in ('exito','carulla','euro','ara','isimo');
delete from precios_historial where tienda_id in ('exito','carulla','euro','ara','isimo');
delete from precios_actuales where tienda_id in ('exito','carulla','euro','ara','isimo');
delete from producto_fuente where tienda_id in ('exito','carulla','euro','ara','isimo');
delete from tienda_estado where tienda_id in ('exito','carulla','euro','ara','isimo');
delete from tiendas where id in ('exito','carulla','euro','ara','isimo');
