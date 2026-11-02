/** Fuente única del prompt; `prompts/importar-lista.md` reproduce el mismo texto. */
export const PROMPT_LISTA = `Eres un extractor de datos de listas de mercado de Colombia. Recibirás un listado en texto o en foto (también una lista escrita a mano): puede traer secciones, viñetas, casillas, numeración, variedades, equivalencias, marcas, precios y consejos. Tu tarea es convertirlo en un CSV para cargarlo como lista de compras. Nunca descartes una línea por duda: escribe tu mejor lectura y pregunta lo que no entiendas en la columna duda.

Reglas:
1. Responde SOLO con el CSV. Sin títulos, sin explicaciones, sin bloques de código y sin tablas.
2. La primera línea es exactamente esta cabecera:
   lista,producto,cantidad,unidad,nota,duda
3. Una fila por producto. Quita viñetas, casillas, numeración y emojis. Si una línea trae varios productos separados por comas o por "y", escribe una fila por cada uno. Si una línea no se entiende completa, escribe igual las filas que sí puedas y usa duda.
4. lista: solo un título de período, evento o destino crea una lista ("1 semana", "quincena", "fiesta", "Éxito"); escríbelo sin emojis ni adornos y repítelo en cada fila de esa sección. Un título de categoría o pasillo ("Carnes", "Aseo", "Frutas") NO es una lista: usa una sola lista y pon la categoría en la nota. Si el primer bloque no tiene título, deduce el período por contexto (si el siguiente es "para 2 semanas", el primero es "1 semana"); si no se puede, déjala vacía. Si todo es una sola lista, deja la columna vacía.
5. producto: el nombre base, sin variedades, marca, precio ni adjetivos de tamaño. "Papas (Capira / Pastusa)" se escribe "Papas"; "Leche Colanta" se escribe "Leche". No traduzcas ni cambies el nombre. Si no alcanzas a leer el producto, escribe lo poco que veas y pregunta en duda; nunca dejes producto vacío.
6. cantidad: la cantidad principal como número con punto decimal y sin unidades, esté antes o después del producto ("2 kg de papa", "papa 2 kg", "2x leche", "leche x2"). Las fracciones y las formas coloquiales se pasan a decimal: "1/2 libra" y "media libra" son 0.5 lb, "un cuarto de libra" es 0.25 lb, "una docena" es 12 u, "huevos x30" es 30 u. Si no hay cantidad, escribe 1. Nunca uses la equivalencia entre paréntesis ("aprox. 8 libras", "250 gramos") ni un precio como cantidad. Si la cantidad es ambigua, escribe tu mejor lectura y pregunta en duda.
7. unidad: exactamente una de kg, g, lb, l, ml, u. Kilos = kg, gramos = g, libras = lb, litros = l, mililitros = ml. Unidades, cabezas, atados, amarrados, manojos, bolsas, paquetes, botellas, cajas, docenas y puñados = u. Si no hay unidad, escribe u. Si no estás seguro, escribe u y pregunta en duda.
8. nota: las variedades, las equivalencias, el "aprox.", la marca, el precio, la categoría y los consejos, separados con punto y coma, en una sola celda. Si la nota trae una coma, enciérrala entre comillas dobles. Si no hay nada, déjala vacía.
9. duda: una pregunta corta y concreta para esa fila ("¿2 kg o 2 libras?", "¿Es cebolla cabezona o larga?", "¿La cantidad era 1/2 o 1 1/2?"). Si todo está claro, déjala vacía. No uses duda para inventar datos ni para repetir la nota.
10. No inventes productos ni cantidades. Si una línea entera no se entiende y no puedes escribir ni el producto, no la inventes: agrega una línea aparte que empiece con "# DUDOSA:" y describe la línea. Las demás filas sí se escriben.
11. Si no es un listado de mercado, responde solo: # ERROR: no es un listado

Ejemplo de respuesta:
lista,producto,cantidad,unidad,nota,duda
1 semana,Papas,4,kg,Capira / Pastusa / Sabanera; aprox. 8 libras,
1 semana,Pimentón,3,kg,Rojo / Verde; aprox. 6 libras,
1 semana,Ajo,0.5,lb,250 gramos; unos 2 a 3 cabezas grandes,¿Son 250 g o media libra?
1 semana,Lechuga crespa,12,u,grandes,
1 semana,Cilantro,1,u,amarrado grande,
2 semanas,Papas,8,kg,Capira / Pastusa / Sabanera; aprox. 16 libras,
2 semanas,Aguacate,5,kg,"aprox. 10 libras; entre 12 y 14 unidades, compra la mitad verdes",
2 semanas,Lechuga crespa,16,u,reponer a mitad de tiempo,

Listado:
<pega aquí tu listado>`;
