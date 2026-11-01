# Prompt para convertir una factura en CSV

Se pega en cualquier IA junto con la **foto, el PDF o el texto** de una factura de compra. La
respuesta se pega en Mercado Medellín → Presupuesto → **Importar factura**. El archivo nunca sale
del navegador.

## Prompt

```text
Convierte esta factura de compra en un CSV para importar gastos y precios.

Reglas:
1. Responde SOLO con el CSV. Sin títulos, sin explicaciones, sin bloques de código y sin tablas.
2. La primera línea es exactamente esta cabecera:
   producto,cantidad,precio_total,tienda,fecha,codigo
3. Una fila por línea de la factura que sea un producto. No incluyas subtotales, IVA, descuentos
   globales, total, propina, cambio ni formas de pago. Sí incluye bolsas y empaques si cobran.
4. producto: el nombre como está impreso, con su presentación (500 g, 1 L, 6 u). Sin comas.
   No pongas la cantidad en el nombre: "3 x Leche entera 1 L" se escribe producto "Leche entera
   1 L" y cantidad 3. Conserva la palabra descuento, oferta, promo, 2x1 o rebaja si está impresa.
5. cantidad: número con punto decimal, sin unidades. Si la línea es por peso, en kilos
   (1.25). Si es por unidad, el número de unidades.
6. precio_total: lo que pagaste por esa línea completa, en pesos, sin puntos de miles, sin
   símbolo y sin decimales. Si la línea es por peso, es el total de la línea, no el precio por
   kilo. Si hay descuento en la línea, usa el valor final pagado.
7. tienda: el nombre de la cadena o del negocio, sin sucursal, sin dirección y sin NIT.
   "D1 Calle 10 #20-30" se escribe "D1". Un negocio de barrio, como está impreso.
8. fecha: la fecha impresa de la factura en formato AAAA-MM-DD. Si no aparece, déjala vacía.
9. codigo: el código de barras, EAN o SKU si está impreso, solo números o letras y guiones.
   Si no aparece, déjalo vacío.
10. No inventes productos, precios ni cantidades. Si una línea no se puede leer, no la escribas
    y agrega una línea aparte que empiece con "# DUDOSA:" y describa lo que falta.
11. Después del CSV, agrega una sola línea: # TOTAL=<total impreso de la factura>, sin puntos
    de miles. Si no hay total impreso, omítela.
12. Si el texto no es una factura de compra, responde solo: # ERROR: no es una factura

Ejemplo de respuesta:
producto,cantidad,precio_total,tienda,fecha,codigo
Leche entera 1 L,3,12750,D1,2026-10-30,7702001234567
Papa criolla,1.25,18750,Plaza Minorista,2026-10-30,
Pan tajado 500 g,1,6200,D1,2026-10-30,7702007654321
# TOTAL=37700
```

## Ejemplo completo (para probar)

```csv
producto,cantidad,precio_total,tienda,fecha,codigo
Leche entera 1 L,3,12750,D1,2026-10-30,7702001234567
Papa criolla,1.25,18750,Plaza Minorista,2026-10-30,
Pan tajado 500 g,1,6200,D1,2026-10-30,7702007654321
# TOTAL=37700
```

## Lo que hace la app con la respuesta

- Tolera BOM, saltos CRLF, delimitador `;`, coma decimal y vallas de markdown.
- Ignora las líneas que empiezan con `#`; de ellas saca `# TOTAL=` y muestra las `# DUDOSA:` en la
  revisión.
- Agrupa por `tienda + fecha` (una factura puede traer varias tiendas o varios días).
- Calcula el precio unitario como `precio_total / cantidad` con la fecha de la factura.
- Antes de guardar muestra todo editable: producto, tienda, fecha, cantidad, precio, rubro,
  unidad y promoción.
- Si la tienda o el producto no existen, los marca y pide confirmación antes de crearlos.
- Si el total de las líneas no cuadra con `# TOTAL=`, avisa sin bloquear.
