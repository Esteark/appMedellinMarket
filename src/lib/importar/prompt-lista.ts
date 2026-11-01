/** Fuente única del prompt; `prompts/importar-lista.md` reproduce el mismo texto. */
export const PROMPT_LISTA = `Convierte este listado de mercado en un CSV para cargarlo como lista de compras.

Reglas:
1. Responde SOLO con el CSV. Sin títulos, sin explicaciones, sin bloques de código y sin tablas.
2. La primera línea es exactamente esta cabecera:
   lista,producto,cantidad,unidad,nota
3. Una fila por producto. lista: el encabezado de la sección a la que pertenece ("1 semana",
   "2 semanas"). Si el texto no tiene secciones, déjala vacía.
4. producto: el nombre sin variedades ni paréntesis. "Papas (Capira / Pastusa / Sabanera)" se
   escribe "Papa". Sin comas.
5. cantidad: número con punto decimal, sin unidades. Usa la cantidad principal del texto, no la
   equivalencia entre paréntesis.
6. unidad: exactamente una de kg, g, lb, l, ml, u. Libras = lb. Unidades, cabezas, amarrados o
   puñados = u.
7. nota: las variedades, las equivalencias "aprox." y los consejos, en una sola celda sin comas.
   Si no hay nada, déjala vacía.
8. No inventes productos ni cantidades. Si una línea no se entiende, no la escribas y agrega una
   línea aparte que empiece con "# DUDOSA:" y diga qué falta.
9. Si el texto no es un listado de mercado, responde solo: # ERROR: no es un listado

Ejemplo de respuesta:
lista,producto,cantidad,unidad,nota
1 semana,Papa,4,kg,Capira / Pastusa / Sabanera; aprox. 8 libras
1 semana,Ajo,0.5,lb,250 g; 2 a 3 cabezas grandes
2 semanas,Lechuga crespa,16,u,reponer a mitad de tiempo

Listado:
<pega aquí tu listado>`;
