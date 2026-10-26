# Procedencia de capturas

Capturadas el 26 de octubre de 2026 en el navegador de Codex, sobre el POS local ya abierto y autenticado. Se usó la empresa QA existente, con referencias como «Kit de inventario QA» y «Tabla QA». No se crearon productos, ventas, turnos ni pagos para obtener estas imágenes.

Archivos: `catalogo.jpg`, `stock.jpg`, `kardex.jpg`, `ventas.jpg`, `caja.jpg`. Corresponden a las rutas reales del POS `/inventarios/productos`, `/inventarios/stock`, `/inventarios/kardex`, `/ventas_historial` y `/caja_turno`. No se incluyen IP, cookies, correo ni tokens en los archivos finales.

La captura por región inicial de la herramienta devolvió imágenes vacías; fueron detectadas en la hoja de contacto y sustituidas por capturas de la pantalla visible. Los recortes finales sólo seleccionan regiones de esas capturas: no se alteró texto, métricas, estado o diseño del producto. La cabecera con nombre de usuario se excluyó; en ventas también se excluyó su columna. Los brutos con cabecera permanecen fuera del repositorio y no forman parte del kit exportable.

Catálogo muestra productos de prueba con imágenes ya cargadas. Stock muestra existencias QA. Kardex muestra dos movimientos QA. Ventas muestra una venta a Consumidor final, sin datos del operador. Caja muestra controles de apertura sin turno abierto; no acredita una nueva prueba de cierre. La referencia al módulo no equivale a una certificación completa de sus flujos.

No se utilizaron los paneles que la propia interfaz identifica como Mock. Cada composición con datos incluye «Interfaz real · datos de demostración». Las cifras no son resultados de un negocio ni testimonios. Para una sesión fotográfica de comercios reales se requiere acordar local, personas y uso de imagen; no se inventaron fotografías de clientes.
