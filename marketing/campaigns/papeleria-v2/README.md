# Papelería · revisión 2 del anuncio

Solicitud del propietario: conservar la dirección visual aprobada, crear productos de papelería en el POS de pruebas y mostrar la pantalla real de Facturar dentro de un computador todo en uno táctil.

## Preparación real en navegador Codex · 2026-11-13

Empresa QA ya autenticada en `pos-staging.cripton.com.co`. Se crearon seis productos desde Catálogo, cargando las imágenes desde el selector de archivos y verificando «Producto guardado» en cada caso. No se utilizaron escrituras directas en SQL ni llamadas API externas al navegador.

| SKU | ID observado | Nombre | Precio ilustrativo COP |
|---|---|---|---|
| PAP-DEMO-001 | 106 | Cuaderno argollado azul | 11.900 |
| PAP-DEMO-002 | 107 | Lápiz HB amarillo | 1.500 |
| PAP-DEMO-003 | 108 | Bolígrafo tinta azul | 2.500 |
| PAP-DEMO-004 | 109 | Colores escolares x 12 | 14.900 |
| PAP-DEMO-005 | 110 | Carpeta legajadora roja | 3.200 |
| PAP-DEMO-006 | 111 | Resma papel carta 500 hojas | 21.900 |

Imágenes individuales generadas con la herramienta integrada imagegen: artículos genéricos sobre blanco, sin marcas comerciales. Son imágenes ilustrativas de producto, no fotografías suministradas por fabricantes. Se conservan en `products/` y fueron cargadas al POS real.

El ajuste QA #4 incorporó 50 unidades de cada referencia a la sucursal de pruebas; se verificó «Ajuste confirmado» y stock50 en Facturar. Los precios y la configuración tributaria del catálogo son datos de demostración; no constituyen recomendación de clasificación fiscal para productos reales.

## Captura original

`captures/facturar-papeleria-real.jpg`: captura íntegra de la página visible, 1198×704, obtenida en el navegador de Codex. Búsqueda `PAP-DEMO`, seis artículos con sus imágenes, cuatro líneas seleccionadas —cuaderno, carpeta, colores y lápiz—, total31.500COP. Selector en POS no electrónico. Se conservó el documento en preparación; no se pulsó Facturar ni se produjo una emisión fiscal o cobro para obtener la imagen.

La captura contiene únicamente datos sintéticos del cliente QA, incluido el nombre del operador QA. No contiene URL de sesión, tokens, correo, contraseña ni datos de un cliente real. El recorte inicial de la API no respetó el origen solicitado y fue sustituido por una captura completa, sin modificar el contenido del producto.

## Composición publicitaria

`sources/anuncio-aprobado-v1.png` conserva el anuncio que el propietario aprobó visualmente. La revisión usa imagegen integrado para cambiar el hardware a todo en uno táctil y colocar la captura nueva en la pantalla, conservando la composición y los textos. La escena y la persona son ilustrativas. La captura fuente es evidencia de la interfaz; su reproducción en la composición es un montaje y debe revisarse visualmente antes de publicar.

La publicidad no acredita una emisión productiva, certificación DIAN ni un cliente real. El documento interno no sustituye la factura fiscal exigida. No se ha publicado ni programado el anuncio en redes.

Resultado: [anuncio táctil v2](exports/anuncio-papeleria-tactil-v2.png). Se revisó visualmente: equipo sobre pedestal, sin base de portátil, persona usando la pantalla, seis artículos y las cuatro líneas del documento visibles; total31.500. Texto y composición comercial conservados. La imagen final es un montaje generado con imagegen; no se certifica identidad píxel a píxel de la pantalla transformada. La captura original, sin reconstrucción, se conserva por separado.
