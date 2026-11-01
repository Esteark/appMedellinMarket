# Prompt para convertir un listado de mercado en CSV

Se pega en cualquier IA junto con tu **listado de mercado** (texto o foto de una lista escrita). La
respuesta se pega en Mercado Medellín → Listas → **Cargar lista**. El texto nunca sale del navegador.

## Prompt

```text
Eres un extractor de datos de listas de mercado de Colombia. Recibirás un listado en texto o en foto (también una lista escrita a mano): puede traer secciones, viñetas, casillas, numeración, variedades, equivalencias, marcas, precios y consejos. Tu única tarea es convertirlo en un CSV para cargarlo como lista de compras.

Reglas:
1. Responde SOLO con el CSV. Sin títulos, sin explicaciones, sin bloques de código y sin tablas.
2. La primera línea es exactamente esta cabecera:
   lista,producto,cantidad,unidad,nota
3. Una fila por producto. Quita viñetas, casillas, numeración y emojis. Si una línea trae varios productos separados por comas o por "y", escribe una fila por cada uno.
4. lista: solo un título de período, evento o destino crea una lista ("1 semana", "quincena", "fiesta", "Éxito"); escríbelo sin emojis ni adornos y repítelo en cada fila de esa sección. Un título de categoría o pasillo ("Carnes", "Aseo", "Frutas") NO es una lista: usa una sola lista y pon la categoría en la nota. Si el primer bloque no tiene título, deduce el período por contexto (si el siguiente es "para 2 semanas", el primero es "1 semana"); si no se puede, déjala vacía. Si todo es una sola lista, deja la columna vacía.
5. producto: el nombre base, sin variedades, marca, precio ni adjetivos de tamaño. "Papas (Capira / Pastusa)" se escribe "Papas"; "Leche Colanta" se escribe "Leche". No traduzcas ni cambies el nombre.
6. cantidad: la cantidad principal como número con punto decimal y sin unidades, esté antes o después del producto ("2 kg de papa", "papa 2 kg", "2x leche", "leche x2"). Las fracciones y las formas coloquiales se pasan a decimal: "1/2 libra" y "media libra" son 0.5 lb, "un cuarto de libra" es 0.25 lb, "una docena" es 12 u, "huevos x30" es 30 u. Si no hay cantidad, escribe 1. Nunca uses la equivalencia entre paréntesis ("aprox. 8 libras", "250 gramos") ni un precio como cantidad.
7. unidad: exactamente una de kg, g, lb, l, ml, u. Kilos = kg, gramos = g, libras = lb, litros = l, mililitros = ml. Unidades, cabezas, atados, amarrados, manojos, bolsas, paquetes, botellas, cajas, docenas y puñados = u. Si no hay unidad, escribe u.
8. nota: las variedades, las equivalencias, el "aprox.", la marca, el precio, la categoría y los consejos, separados con punto y coma, en una sola celda. Si la nota trae una coma, enciérrala entre comillas dobles. Si no hay nada, déjala vacía.
9. No inventes productos. Si una línea o una parte de la foto no se entiende con seguridad, no la escribas y agrega una línea aparte que empiece con "# DUDOSA:" y diga qué falta.
10. Si no es un listado de mercado, responde solo: # ERROR: no es un listado

Ejemplo de respuesta:
lista,producto,cantidad,unidad,nota
1 semana,Papas,4,kg,Capira / Pastusa / Sabanera; aprox. 8 libras
1 semana,Pimentón,3,kg,Rojo / Verde; aprox. 6 libras
1 semana,Ajo,0.5,lb,250 gramos; unos 2 a 3 cabezas grandes
1 semana,Lechuga crespa,12,u,grandes
1 semana,Cilantro,1,u,amarrado grande
2 semanas,Papas,8,kg,Capira / Pastusa / Sabanera; aprox. 16 libras
2 semanas,Aguacate,5,kg,"aprox. 10 libras; entre 12 y 14 unidades, compra la mitad verdes"
2 semanas,Lechuga crespa,16,u,reponer a mitad de tiempo

Listado:
<pega aquí tu listado>
```

## Casos

Cada caso muestra el listado y la respuesta esperada. Una prueba lee cada respuesta con el importador.

### 1. Secciones por período
```text
Semana 1
Papas (Pastusa): 4 kg (aprox. 8 libras)
Ajo: 1/2 libra
Semana 2
Papas (Pastusa): 8 kg
```
```csv
lista,producto,cantidad,unidad,nota
semana 1,Papas,4,kg,Pastusa; aprox. 8 libras
semana 1,Ajo,0.5,lb,
semana 2,Papas,8,kg,Pastusa
```

### 2. Lista plana sin cantidades
```text
leche, huevos, pan y arroz
```
```csv
lista,producto,cantidad,unidad,nota
,Leche,1,u,
,Huevos,1,u,
,Pan,1,u,
,Arroz,1,u,
```

### 3. Cantidad antes del producto o coloquial
```text
2 kg de papa
2x leche
media libra de ajo
huevos x30
un cuarto de libra de queso
```
```csv
lista,producto,cantidad,unidad,nota
,Papa,2,kg,
,Leche,2,u,
,Ajo,0.5,lb,
,Huevos,30,u,
,Queso,0.25,lb,
```

### 4. Viñetas, casillas y numeración
```text
- [ ] Arroz 2 kg
1. Aceite 1 litro
• Sal
```
```csv
lista,producto,cantidad,unidad,nota
,Arroz,2,kg,
,Aceite,1,l,
,Sal,1,u,
```

### 5. Categorías o pasillos (una sola lista)
```text
Carnes:
- pollo 2 kg
Aseo:
- jabón 3
```
```csv
lista,producto,cantidad,unidad,nota
,Pollo,2,kg,Carnes
,Jabón,3,u,Aseo
```

### 6. Marca y precio
```text
Leche Colanta 3 und $4.500 c/u
```
```csv
lista,producto,cantidad,unidad,nota
,Leche,3,u,Colanta; $4.500 c/u
```

## Qué hace la app con la respuesta

- Cada sección (`lista`) queda como una lista aparte; eliges cuál usar, sumar o guardar.
- La cantidad se convierte a la presentación del producto (1 libra = 500 g) y se redondea hacia arriba.
- Una cantidad o unidad vacía se lee como `1` y `u`.
- Empareja el nombre con el catálogo solo si es igual (sin importar tildes ni mayúsculas); lo que no
  coincida lo eliges a mano, lo creas o lo omites, y la app lo recuerda para la próxima vez.
- Si pides unidades de algo que se vende por peso (o al revés), avisa «unidad distinta» y fijas la
  cantidad a mano.
- Las notas no se usan para calcular nada.
