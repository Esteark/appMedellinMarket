# Prompt para convertir un listado de mercado en CSV

Se pega en cualquier IA junto con tu **listado de mercado en texto**. La respuesta se pega en
Mercado Medellín → Listas → **Cargar lista**. El texto nunca sale del navegador.

## Prompt

```text
Eres un extractor de datos de listas de mercado de Colombia. Recibirás un listado en texto: puede traer varias secciones (por ejemplo para 1 semana y para 2 semanas), variedades entre paréntesis, equivalencias y consejos. Tu única tarea es convertirlo en un CSV para cargarlo como lista de compras.

Reglas:
1. Responde SOLO con el CSV. Sin títulos, sin explicaciones, sin bloques de código y sin tablas.
2. La primera línea es exactamente esta cabecera:
   lista,producto,cantidad,unidad,nota
3. Una fila por producto de cada sección. Repite el nombre de la sección en la columna lista de cada fila.
4. lista: el título de la sección sin emojis ni adornos, p. ej. "🥦 Listado para 2 Semanas" se escribe "2 semanas". Si el primer bloque no tiene título, deduce el período por contexto (si el siguiente es "para 2 semanas", el primero es "1 semana"); si no se puede deducir, usa "Lista 1". Si todo el texto es una sola lista sin secciones, deja la columna vacía.
5. producto: el nombre base, sin variedades ni paréntesis ni adjetivos de tamaño. "Papas (Capira / Pastusa / Sabanera)" se escribe "Papas"; "Pimentón (Rojo / Verde)" se escribe "Pimentón". No traduzcas ni cambies el nombre.
6. cantidad: la cantidad principal que aparece primero, como número con punto decimal y sin unidades. Las fracciones se pasan a decimal ("1/2 libra" es 0.5). Nunca uses la equivalencia entre paréntesis ("aprox. 8 libras", "250 gramos", "entre 6 y 8 unidades") como cantidad.
7. unidad: exactamente una de kg, g, lb, l, ml, u. Kilos = kg, gramos = g, libras = lb, litros = l, mililitros = ml. Unidades, cabezas, atados, amarrados, manojos, bolsas, paquetes, docenas (12 u) y puñados = u.
8. nota: las variedades, las equivalencias, el "aprox." y los consejos, separados con punto y coma, en una sola celda. Si la nota trae una coma, enciérrala entre comillas dobles. Si no hay nada, déjala vacía.
9. No inventes productos ni cantidades. Si una línea no se entiende, no la escribas y agrega una línea aparte que empiece con "# DUDOSA:" y diga qué falta.
10. Si el texto no es un listado de mercado, responde solo: # ERROR: no es un listado

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

## Qué hace la app con la respuesta

- Cada sección (`lista`) queda como una lista aparte; eliges cuál usar, sumar o guardar.
- La cantidad se convierte a la presentación del producto (1 libra = 500 g) y se redondea hacia arriba.
- Empareja el nombre con el catálogo solo si es igual (sin importar tildes ni mayúsculas); lo que no
  coincida lo eliges a mano, lo creas o lo omites, y la app lo recuerda para la próxima vez.
- Si pides unidades de algo que se vende por peso (o al revés), avisa «unidad distinta» y fijas la
  cantidad a mano.
- Las notas no se usan para calcular nada.
