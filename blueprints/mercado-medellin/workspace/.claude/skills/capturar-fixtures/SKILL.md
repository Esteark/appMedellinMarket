---

name: capturar-fixtures
description: Captura respuestas reales de D1, La Minorista (SIPSA) y La Vaquita para las pruebas de los adaptadores. Úsala cuando un adaptador falle porque el sitio cambió, cuando falte un fixture o al escribir o ajustar un adaptador de la corrida.
---

# Capturar fixtures reales

## Cuándo usarla

- "el adaptador de X dejó de encontrar precios", "actualiza los fixtures", "falta el fixture de SIPSA".

## Pasos

1. `pnpm capturar vtex` · `pnpm capturar sipsa` · `pnpm capturar vaquita` (requiere red; respeta robots.txt, User-Agent propio y pausa ≥ 1 s).
2. El script escribe en `tests/fixtures/<vtex|sipsa|vaquita>/` con los nombres fijos del blueprint y reescribe `tests/fixtures/<grupo>/capturado.json` con fecha y URLs.
3. Si una captura falla (sitio caído, boletín inexistente), el script lo dice, sale 1 y deja intacto el último fixture capturado; anótalo en el commit.
4. Ajusta el adaptador contra el fixture nuevo y corre su prueba.

## Verificar

```bash
pnpm test tests/unit/vtex.test.ts tests/unit/sipsa.test.ts tests/unit/vaquita.test.ts   # expect: exit 0
```

## No

- Nunca escribas ni edites a mano un archivo de `tests/fixtures/`. Si una prueba necesita una variante (sin existencias, precio 0), la deriva en memoria a partir del fixture capturado.
