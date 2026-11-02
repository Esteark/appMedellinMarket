# Prompt para convertir una factura en CSV

Se pega en cualquier IA junto con la **foto, el PDF o el texto** de una factura de compra. La
respuesta se pega en Mercado Medellín → Presupuesto → **Importar factura**. El archivo nunca sale
del navegador.

## Prompt

```text
Eres un extractor de datos de facturas de compra de Colombia (pesos colombianos, COP). Recibirás una o varias imágenes, un PDF o el texto de un recibo, factura o tirilla. Tu tarea es convertirla en un CSV para importar gastos y precios. Nunca descartes una línea por duda: escribe tu mejor lectura y pregunta lo que no entiendas en la columna duda.

Reglas:
1. Responde SOLO con el CSV. Sin títulos, sin explicaciones, sin bloques de código y sin tablas.
2. La primera línea es exactamente esta cabecera:
   producto,cantidad,precio_total,tienda,fecha,codigo,duda
3. Una fila por línea de la factura que sea un producto. No agrupes ni elimines repetidos. Excluye TOTAL, SUBTOTAL, IVA, impuestos, propina, domicilio, envío, descuentos globales, cambio, puntos, membresía, suscripción, redondeo y formas de pago. Sí incluye bolsas y empaques si cobran. Si una línea parece producto pero no estás seguro, inclúyela y pregunta en duda.
4. producto: copia el nombre COMPLETO tal como está impreso, con marca y presentación (500 g, 1 L, 6 u). Nunca lo recortes, abrevies ni resumas, ni lo termines con "...". No traduzcas ni inventes marca ni tamaño. Si el nombre ocupa dos o más líneas de la factura (la línea de continuación no trae precio), únelas en un solo nombre y una sola fila. Si la factura ya lo imprime abreviado, cópialo igual, sin completarlo. No pongas la cantidad en el nombre: "3 x Leche entera 1 L" se escribe producto "Leche entera 1 L" y cantidad 3. Conserva la palabra descuento, oferta, promo, 2x1 o rebaja si está impresa en esa línea. Si el nombre trae una coma, enciérralo entre comillas dobles; si trae comillas, duplícalas. Si no alcanzas a leer una parte, escribe lo que sí veas y pregunta en duda; nunca dejes producto vacío.
5. cantidad: número mayor que 0 con punto decimal, sin unidades. Si no aparece, 1. Si la línea es por peso, el peso facturado en kilos (1.25). Si es por unidad, el número de unidades. Si no estás seguro, escribe tu mejor lectura y pregunta en duda.
6. precio_total: lo que se pagó por esa línea completa, en pesos, sin símbolo y sin decimales. En las facturas colombianas el punto separa miles: "12.500" se escribe 12500. Si la línea es por peso, es el total de la línea, no el precio por kilo. Si hay un descuento aplicado a esa línea, usa el valor final pagado. Si el descuento es una línea aparte, no la incluyas. Si no puedes leer el precio con seguridad, escribe 0 y pregunta en duda; la persona lo corrige en la revisión.
7. tienda: el nombre de la cadena o del negocio, sin sucursal, sin dirección y sin NIT. "D1 Calle 10 #20-30" se escribe "D1". Un negocio de barrio, como está impreso. Si no la ves, déjala vacía y pregunta en duda.
8. fecha: la fecha impresa de la factura en formato AAAA-MM-DD. Si viene como dd/mm/aaaa, conviértela. Si no aparece, déjala vacía. Si no estás seguro, déjala vacía y pregunta en duda.
9. codigo: el código de barras, EAN o SKU si está impreso, solo números o letras y guiones. Si no aparece, déjalo vacío.
10. duda: una pregunta corta y concreta para esa fila ("¿El precio era 12.500 o 1.250?", "¿Era 1 kg o 1,5 kg?", "¿Esta línea es un producto o un descuento?"). Si todo está claro, déjala vacía. No uses duda para inventar datos ni para repetir el nombre.
11. Si recibes varias imágenes, trátalas como una sola compra: junta los productos y no repitas la cabecera.
12. No inventes productos, precios ni cantidades, y no agregues una fila de ajuste para cuadrar el total. Si una línea entera no se entiende y no puedes escribir ni el producto, agrega una línea aparte que empiece con "# DUDOSA:" y descríbela. Las demás filas sí se escriben.
13. Después del CSV, agrega una sola línea: # TOTAL=<total impreso de la factura>, sin puntos de miles. Si no hay total impreso, omítela.
14. Si no hay líneas de productos, devuelve solo la cabecera. Si el texto no es una factura de compra, responde solo: # ERROR: no es una factura

Ejemplo de respuesta:
producto,cantidad,precio_total,tienda,fecha,codigo,duda
Leche entera 1 L,3,12750,D1,2026-10-30,7702001234567,
"Arroz, blanco 500 g",1,3200,D1,2026-10-30,,
Papa criolla,1.25,18750,Plaza Minorista,2026-10-30,,
# TOTAL=34700
```

## Ejemplo completo (para probar)

```csv
producto,cantidad,precio_total,tienda,fecha,codigo,duda
Leche entera 1 L,3,12750,D1,2026-10-30,7702001234567,
Papa criolla,1.25,18750,Plaza Minorista,2026-10-30,,
Pan tajado 500 g,1,6200,D1,2026-10-30,,¿Es pan tajado o pan de molde?
# TOTAL=37700
```

## Cuando la factura se sale del patrón

La IA no debe botar la fila: escribe su mejor lectura y pregunta en `duda`. La app muestra esa
pregunta en la revisión, con todos los campos editables, y no deja guardar hasta que la fila quede
completa o se quite.

- **Precio dudoso:** `precio_total` queda en `0` y la pregunta dice qué no se entendió. Se corrige a
  mano antes de guardar.
- **Nombre partido o borroso:** se escribe la parte legible y se pregunta por el resto.
- **Cantidad o fecha raras:** se escribe la mejor lectura; si no hay, `1` o vacío, con la pregunta.
- **Tienda ausente:** la celda queda vacía con la pregunta; se escribe en la revisión.
- **Línea irreconocible:** no se inventa; va como `# DUDOSA:` aparte y las demás filas se cargan.

## Lo que hace la app con la respuesta

- Tolera BOM, saltos CRLF, delimitador `;` o tabulador, coma decimal, comillas dobles y vallas de
  markdown. Acepta cabeceras con nombres equivalentes (`precio`, `valor`, `descripcion`, `pregunta`…)
  y columnas opcionales al final.
- Lee precios con símbolo y miles (`$12.500`), fechas `dd/mm/aaaa` y cantidades como `1/2` o `1,5`.
- Ignora las líneas que empiezan con `#`; de ellas saca `# TOTAL=` y muestra las `# DUDOSA:` en la
  revisión.
- Agrupa por `tienda + fecha` (una factura puede traer varias tiendas o varios días).
- Muestra la pregunta de cada fila y permite corregir producto, cantidad, precio, tienda, fecha,
  rubro, unidad y promoción, o quitar la fila. Si queda alguna incompleta, «Guardar importación» se
  deshabilita y dice cuántas faltan.
- Calcula el precio unitario como `precio_total / cantidad` con la fecha de la factura.
- Marca como promoción las líneas cuyo nombre trae descuento, oferta, promo, 2x1 o rebaja: van al
  historial pero no pisan el precio vigente.
- Si la tienda o el producto no existen, los marca y pide confirmación antes de crearlos.
- Si el total de las líneas no cuadra con `# TOTAL=`, avisa sin bloquear.
