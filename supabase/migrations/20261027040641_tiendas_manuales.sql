-- Solo D1, Euro y La Minorista (SIPSA) tienen consulta automática (ADAPTADORES en
-- src/corrida/orquestador.ts). Éxito, Carulla, Ara, Ísimo y PriceSmart quedaron por anotados
-- (decisión del 26-oct-2026): se marcan manuales para que no cuenten como fuentes caídas.
-- Desde ahora `pnpm migrar` también deriva `manual` de ADAPTADORES.
update tiendas set manual = id not in ('d1', 'euro', 'minorista');
