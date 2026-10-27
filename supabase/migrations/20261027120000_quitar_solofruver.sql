-- Solofruver se descarta (27-oct-2026). Se borra de hijas a padre; las listas que la tenían
-- como tienda preferida vuelven al valor por defecto.
update listas set tienda_preferida = 'exito' where tienda_preferida = 'solofruver';
delete from alertas where tienda_id = 'solofruver';
delete from anotados where tienda_id = 'solofruver';
delete from precios_historial where tienda_id = 'solofruver';
delete from precios_actuales where tienda_id = 'solofruver';
delete from producto_fuente where tienda_id = 'solofruver';
delete from tienda_estado where tienda_id = 'solofruver';
delete from tiendas where id = 'solofruver';
