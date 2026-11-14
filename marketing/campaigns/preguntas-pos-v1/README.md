# Serie de preguntas del comerciante · 2026-11-13

Tres anuncios adicionales dentro de la dirección fotográfica aprobada: inventario al convertir (pregunta 3), identificación de internos/electrónicos (pregunta 4), origen y relación de documentos (pregunta 7). Marca Cripton, producto Cripton POS, comercio ilustrativo de papelería y computador todo en uno táctil. Imágenes elaboradas con imagegen integrado; no publicadas ni programadas.

- [P03 · Inventario](exports/P03-inventario.png)
- [P04 · Tipo y estado](exports/P04-estados.png)
- [P07 · Origen documental](exports/P07-origen.png)
- [Textos para publicar](textos-publicacion.txt)

Prompts finales en `sources/`, relación de archivos y estado en `manifest.json`. Se revisaron los tres resultados: titulares, CTA, equipo táctil, operador genérico «Usuario», documentos y cantidades del ejemplo. Cada composición es un montaje ilustrativo que incorpora una captura fuente; no es una fotografía de un comercio cliente.

## Ejemplo real ejecutado en el navegador Codex

Entorno: POS staging, empresa QA existente. Antes de emitir se consultó la guía fiscal real: Sandbox seleccionado, emisión habilitada, perfil habilitado y no sólo lectura, rangos listos y 995 documentos de cupo disponibles. No se modificaron perfiles, rangos, credenciales, plan ni configuración productiva.

Se retomó el ticket 26 de papelería desde Tickets en pausa. Los intentos iniciales de pulsar el botón no mostraron resultado: se consultó el historial y no se repitió una operación a ciegas. Tras retomar el ticket, la acción de teclado Enter ejecutó el flujo y el POS confirmó «Venta facturada correctamente».

- Venta 26: cuaderno 106, carpeta 110, colores 109 y lápiz 107, una unidad de cada uno; total $31.500 COP.
- Documento interno 20, POS2, emitido y pago QA 17 registrado en efectivo por $31.500.
- Antes de la venta los seis productos PAP-DEMO tenían50unidades, según la preparación de la campaña anterior. Después de la venta los cuatro utilizados tenían49; bolígrafo108 y resma111 seguían50. Las cantidades se observaron en la tabla real de Stock.
- Se pulsó Convertir a FE sobre POS2. Se eligió Consumidor final mediante el control existente; sin correo ni teléfono, documento sintético222222222222. Motivo explícito de demostración de marketing, sóloSandbox.
- La interfaz confirmó factura electrónica 22, número local QABF4, Factus SETP990046479, aceptada en Sandbox. No se produjo emisión productiva ni se envió correo a personas reales.
- El mismo detalle mostró POS2 interno anulado y la NC interna15/NC2 emitida como reversión documental de la conversión. La FE aceptada y el documento original permanecen asociados a la venta26.
- Tras refrescar Stock, los cuatro productos siguieron en49 y los otros dos en50: en este ejemplo la conversión no produjo una segunda salida de inventario. No se afirma cobertura de todos los casos, concurrencia o tenants a partir de esta prueba.
- Trazabilidad mostró la venta, POS2, QABF4, pago17, NC2 y respuesta Factus relacionados. No se crearon otras ventas o notas electrónicas para esta serie.

## Capturas

- `documento-interno-pos2.jpg`: detalle anterior a conversión, documento interno emitido.
- `documentos-interno-electronico.jpg`: detalle con productos y ambos documentos, electrónica aceptada e interno anulado.
- `stock-despues-conversion.jpg`: existencias observadas tras refrescar la tabla posterior a conversión. El filtro por SKU no devolvió filas en esta vista; se limpió antes de verificar y capturar. No se usa una captura vacía como prueba de stock.
- `relacion-documentos-nota-interna.jpg`: sección de asociados, pago y nota interna; encuadre real mediante desplazamiento del navegador.
- `trazabilidad-qa-original.jpg`: evidencia interna de la ruta Trazabilidad. No se utiliza como pantalla de las creatividades por el defecto descrito debajo.

Las capturas originales muestran el operador QA sintético. En las composiciones se solicita «Usuario», como indicó el propietario. Las imágenes de producto son ilustrativas generadas y cargadas al POS real; la escena de tienda también es ilustrativa. El tratamiento gráfico de la pantalla no se certifica idéntico píxel a píxel al original; se mantienen las capturas fuente para revisión.

## Pendiente real detectado en el producto

La pantalla Trazabilidad serializa algunas fechas como `[object Object]` tanto en Relaciones como en Documentos; también presenta campos técnicos sin formato comercial. Se observó con venta26 y sus documentos. No se ocultó mediante cambios al DOM ni se modificó el POS desde marketing. Requiere corrección en el frente SaaS/POS y nueva comprobación visual antes de usar esa pantalla en una pieza pública. Para el anuncio de origen se usa la sección real de documentos asociados del detalle, que sí muestra las relaciones y fechas legibles.

## Alcance comercial

P03 se apoya en el comportamiento observado, sin prometer infalibilidad. P04 permite reconocer tipo y estado; no presenta «Interna anulada» como una FE rechazada. P07 trata relación documental, no certificación de auditoría contable. Ningún anuncio permite aplazar la expedición legal de una factura; todos conservan requisitos de plan/configuración y la aclaración de que un documento interno no sustituye la factura fiscal exigida.

Las piezas exactas, los textos y sus recortes nativos requieren aprobación del propietario antes de publicación. La emisión y la aceptaciónSandbox sólo acreditan el ejemplo probado; no disponibilidad fiscal productiva de cada comercio.
