# Validación del afinamiento 1.0.1

Las comprobaciones actuales están en `informe_validacion.json`. Los resultados originales de más abajo se conservan únicamente como antecedentes; no sustituyen las pruebas de esta revisión.

- 28 SVG: paleta exacta, sin contornos añadidos, fuentes ni imágenes raster; lienzos y transformaciones originales conservados. La intersección de la o cian con el relleno marino del nombre es cero.
- 20 PDF de logo: vectores reales, sin imágenes ni fuentes y con las dimensiones físicas originales.
- 31 PNG de maestros y 12 PNG de iconos: dimensiones conservadas; perfil sRGB y transparencia donde corresponde. Favicon ICO en 16, 32, 48 y 64 px; maskable dentro de su zona segura.
- Galería local Edge/Chromium: 31 imágenes correctas, sin desbordamiento ni errores JavaScript a 320, 360, 390, 430, 768, 1024 y 1440 px.
- Manual PDF: 35 páginas; mismos textos, vínculos, flujos de contenido y cajas de página. Comparación Poppler: píxeles idénticos fuera de las ilustraciones.
- Manual Word: 18 imágenes sustituidas, conservando dimensiones; XML, estilos, relaciones y textos idénticos. No fue posible renderizarlo independientemente: falta LibreOffice. La revisión del PDF no sustituye esa prueba.
- Referencia original intacta, verificada mediante SHA-256.

Las ilustraciones del manual no son maestros de producción. Se preservaron los ejemplos de uso incorrecto, la referencia histórica y los rótulos originales que comparten espacio con el descendente de la p en la lámina de fondos.

## Antecedentes de la entrega original 1.0
Las siguientes mediciones corresponden exclusivamente a la entrega anterior al afinamiento.

## Resultado
Los controles automáticos del informe JSON han pasado dentro del alcance ejecutado. Esto no es una aprobación legal, fiscal, de tienda de aplicaciones ni de todos los procesos de impresión.

## Evidencia
- 28 SVG analizados: 25 variantes maestras y 3 recursos de iconos; sin elementos image, script, foreignObject ni text; máximo tres colores por archivo.
- 20 PDF de logo comprobados: sin imágenes raster incrustadas; color RGB.
- PNG de entrega etiquetados con perfil sRGB; conservación del canal alfa en recursos transparentes.
- Silueta: solapamiento binario de 0,9940470808634988 entre fuente y trazado, antes de cambiar la separación de la composición. No mide color, percepción ni propiedad intelectual.
- Icono maskable 1024: radio máximo del contenido no-fondo de aproximadamente 321,02 px; círculo seguro comprobado de radio 409,6 px.
- Galería: 31 imágenes renderizadas sin fallos en Chromium a 320, 360, 390, 430, 768 y 1440 CSS px; sin desbordamiento de la página ni errores JavaScript.
- Navegador: por restricción del entorno sobre navegación file/HTTP se verificó el HTML/CSS original incrustando los mismos SVG/PNG locales. No constituye prueba de hosting, MIME, caché, service worker o instalación PWA en un dispositivo real.
- Manual: 35 páginas renderizadas y revisadas visualmente; sin bloques de texto fuera de la página. Se corrigieron la jerarquía del comercio en tickets y el encuadre de la arquitectura de productos durante el control.
- No se incluyen archivos TTF, OTF, WOFF o WOFF2.

## Pendientes externos
Aprobación del titular; revisión de antecedentes marcarios y derechos; prueba de color sobre el soporte final; prueba de prensa/térmica/bordado/grabado; validación de percepción con público objetivo; integración y accesibilidad de la aplicación real.

## Referencias
Las mediciones están en `especificacion_maestros.json` y los resultados de pruebas en `informe_validacion.json`. Las fuentes metodológicas y normativas están enlazadas en el manual.
