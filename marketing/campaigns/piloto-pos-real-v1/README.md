# Primer piloto con grabación real del POS

Archivo para revisar: [MP4 vertical, 22 segundos](exports/cripton-piloto-pos-real.mp4). [Reproductor local](index.html), [subtítulos SRT](exports/cripton-piloto.srt), [manifiesto](manifest.json). Estado: preparado para revisión del propietario; sin publicación, programación o pauta. No reemplaza los maestros ni las campañas anteriores.

## Contenido y evidencia

Se grabó realmente con OBS Studio 29.1.1 la ventana del navegador de Codex, a 1920×1080 y 30 fps. Se creó en staging la venta **28**, con tres cuadernos, una carpeta, colores y un lápiz, por **55.300 COP**. Se confirmó el documento interno **POS3**, factura local23 y pago QA19 en efectivo. Desde su detalle se pulsó **Convertir a FE**, se seleccionó consumidor final sintético y se recibió la factura local24 **QABF5**, aceptada por Factus Sandbox como **SETP990046480**. El sistema dejó POS3 anulada y creó NC interna16/NC3. No se utilizaron datos de compradores reales, pagos externos ni emisión productiva.

El bruto está en el almacenamiento local de OBS, fuera de Git: contiene la ventana completa y el chat. El MP4 público sólo incluye recortes de la página POS, sin el chat, las pestañas, la URL o el nombre del operador. El manifiesto conserva el hash del bruto y los tiempos/crops. El cierre muestra la escena ilustrativa previamente aprobada, rotulada como tal; la persona y tienda de ese cierre no son una grabación real. No se presenta una sucesión de capturas fijas como si fuera una grabación.

Los cortes y cambios de velocidad eliminan esperas; no son una promesa de tiempo de emisión. La funcionalidad requiere plan con electrónica y configuración fiscal. El documento interno no sustituye la factura exigida. La demostración no recomienda posponer una obligación fiscal.

## Voz y música

Voz generada localmente mediante **Kokoro-82M v1.0**, conversión ONNX, voz de catálogo `ef_dora`, español `es`, velocidad0.94. Se usa una voz sintética de catálogo, sin clonar personas. Es una propuesta para audición; no se afirma que sea una locutora colombiana ni que el propietario ya la haya aprobado. Locución separada y tiempos en `sources/`.

El modelo se publica con licencia Apache2.0: https://huggingface.co/hexgrad/Kokoro-82M. Catálogo de voces: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md. Herramienta: https://github.com/thewh1teagle/kokoro-onnx. Los pesos y dependencias permanecen en herramientas locales, fuera del repositorio.

**“Chill Wave” — Kevin MacLeod (incompetech.com)**, ISRC USUAN1600048, licencia **Creative Commons Attribution4.0**. Fuente/licencia del compositor: https://www.incompetech.com/music/royalty-free/index.html?isrc=USUAN1600048. Licencia: https://creativecommons.org/licenses/by/4.0/. El dominio del compositor no resolvió al descargar desde este equipo; se obtuvo el archivo de la copia pública https://github.com/noobsandnerdsgroup/audio/blob/master/Chill%20Wave.mp3, cuyos metadatos coinciden en autor, título, ISRC y duración4:00. Se utiliza el extracto18–40s, recortado, normalizado, atenuado bajo la voz y con fundidos. No se afirma autoría de la música ni aval del compositor. Conservar la atribución en la descripción al publicar.

La pista del escritorio y el micrófono se excluyeron de la mezcla. Exportación H264/AAC, 1080×1920, 30 fps. Voz dominante con compresión de la cama musical por la señal de voz; limitador final. La validación técnica no sustituye la audición creativa del propietario.

## Reproducir y revisar

`build.py --recording RUTA_AL_BRUTO --audio-dir CARPETA_AUDIO_LOCAL` requiere Pillow, imageio-ffmpeg y los activos de la marca ya versionados. La carpeta de audio contiene `locucion.wav`, `voice-timing.json` y el MP3 de la pista. `render/` es temporal y está excluido de Git. Las exportaciones se decodifican completamente y se guardan fotogramas de revisión. `sources/generate_voice.py` reproduce la locución con modelos locales y dependencias kokoro-onnx, soundfile y espeakng-loader.

Revisar en el celular con sonido y en silencio: voz/pronunciación, música, ritmo del gancho y legibilidad del detalle. Este es el único piloto solicitado; esperar la evaluación de esta versión antes de producir la serie.

## Coordinación

Antes de crear el piloto se ejecutó el control de contexto: web0a0e045 y POS9d5312d. Los cambios nuevos del POS respecto a5a3b021 son impresión canónica y gestión de catálogos; se revisó su alcance sin integrarlos ni modificar el backend desde marketing. Al cerrar, POS avanzó a7ae3f57 con controles compartidos, nombres de catálogo, impuestos numéricos e identificación de productos sin stock; se revisó el alcance y no cambia el ejemplo de conversión grabado. Esta tarea sólo añade activos de campaña. La comprobación no certifica sincronización global de las ramas ni sustituye la validación del POS.

Validación del archivo final en [qa.json](qa.json): decodificación completa, 22s, 1080×1920 a30fps, H264/AAC; media−17,8dBFS y máximo−1,4dBFS tras codificación. En el navegador de Codex el reproductor alcanzó `ended=true`, `currentTime=22`, sin error y con sonido habilitado. Los fotogramas revisados cubren productos, documento, conversión, aceptación y cierre. Queda pendiente la aprobación creativa del propietario al escuchar y ver esta versión.
