# Piloto Remotion v2 · mejora visual del mismo video

## Versión comercial vigente: prueba gratuita de 15 días

Marca visible actualizada por indicación del propietario: **únicamente Cripton**. Se retiró el nombre del proveedor de la cabecera de conversión y del texto incrustado en la captura (aviso de procesamiento y encabezado de estado de notas crédito). `prepare.py` produce clips públicos con rótulos editoriales neutros; conserva importes, estados, números de documento y resultado real de la venta. Las máscaras se habilitan sólo cuando corresponde al estado de la pantalla, para no tapar campos del formulario. El bruto intacto queda fuera de Git; no se modifica el POS.

El reproductor sólo ofrece la versión vigente: se retiró el selector que permitía abrir el montaje histórico con el proveedor visible y el CTA retirado. Los exports históricos siguen archivados en Git y no deben publicarse. Verificación complementaria en `qa-brand-sources.json` y `qa-brand-final.json`: OCR con control positivo sobre una captura anterior, revisión de las áreas corregidas en todos los fotogramas fuente y muestreo denso del video final. Esta comprobación se suma a la inspección visual; no sustituye la revisión de otras piezas antiguas antes de reutilizarlas.

Las áreas fuente se revisaron en78 fotogramas de apertura,117 de conversión y165 del resultado, con477 lecturas de OCR contando la cabecera que reaparece tras cerrar el modal: cero coincidencias. La pista de audio coincide exactamente con la versión de prueba de15 días anterior (hash de paquetes AAC), sin nueva voz ni mezcla. La reproducción de22 segundos en Codex terminó sin errores. Registro en `qa-brand-browser.json`. Al iniciar este ajuste POS había avanzado a84d3f23 con ajustes de etiquetas; se revisó ese alcance sin modificar la aplicación.

La revisión del archivo final decodificó660 fotogramas y realizó106 muestras de texto: fotograma completo cada segundo y región de la grabación cada tres fotogramas durante conversión/resultado. Cero coincidencias. Las dependencias OCR son opcionales para esta comprobación (`rapidocr-onnxruntime`); `qa-brand.py` usa como control positivo el clip sin rótulos generado por `prepare.py` en `render/`, fuera de Git, y `qa-brand.py --final` comprueba el MP4 vigente. Se retiró el selector de archivo antiguo de la vista de revisión y se agregó una versión de URL para evitar reproducir la copia anterior desde caché.

El propietario corrigió la oferta el 14 de noviembre de 2026: registro de usuario nuevo → prueba gratuita de 15 días → elección y pago del plan adecuado. **No se ofrece una demo comercial.** Archivo vigente: [cripton-prueba-gratis-15-dias.mp4](exports/cripton-prueba-gratis-15-dias.mp4), [portada](exports/portada-prueba-15-dias.jpg), [texto de publicación](texto-publicacion-prueba15.txt), [QA](qa-trial15.json). El reproductor abre esta versión por defecto; los MP4 anteriores se conservan como archivos históricos y no son candidatos de publicación con su CTA antiguo.

Composición `CriptonTrial15`, reutilizando el mismo montaje y fuentes sin duplicar un proyecto. Nuevo cierre: **«Pruébalo. 15 días gratis»**, **«Regístrate como usuario nuevo»**, **«Después, elige el plan para tu negocio»** y **«Empieza gratis»**. Se sustituyó el distintivo «DEMO·SANDBOX» por «QA·SANDBOX»: Sandbox describe la grabación fiscal de pruebas, no una oferta de demo al cliente. No se añadieron promesas sobre tarjeta, límites de funciones o cobros automáticos.

No se generó ni clonó una voz. Se conserva la locución del original hasta18,15s (última frase válida termina17,94s), y se elimina la invitación a pedir DEMO que empezaba18,39s. El cierre queda con la misma pista musical y un fundido de0,15s en la misma posición. **Esta variante tiene edición de audio y no es idéntica bit a bit al MP4 v2**; la comprobación de identidad del audio de la sección histórica siguiente corresponde sólo al primer export Remotion.

Reproducir: `node render-review.mjs --video-only --trial`, luego `python finalize-trial.py`. El script comprueba medidas/duración, decodifica el archivo completo y genera portada y evidencia. Se revisó el cierre y el navegador reprodujo los22 segundos hasta `ended=true`, sin errores: [evidencia de navegador](browser-qa-trial15.json). El diseño comercial procede de la definición del propietario; este cambio de marketing no certifica otra prueba del backend o del registro público ni modifica la web. Validar el destino productivo antes de publicar enlaces.

## Archivo histórico: primer export Remotion

[Ver el reproductor y comparar](index.html) · [Descargar MP4](exports/cripton-piloto-remotion-v2.mp4) · [Comprobación técnica](qa.json).

Petición del 14 de noviembre de 2026: mejorar únicamente el video con Remotion, manteniendo la voz actual. Se preserva [el primer piloto](../piloto-pos-real-v1/README.md). Esta entrega no modifica el POS, la web, la administración, los maestros de marca ni las configuraciones de correo/pagos. No se ha publicado ni programado en redes.

## Cambios visuales

- Composición React/Remotion propia, vertical 1080×1920, 30fps, 660 fotogramas/22 segundos.
- Títulos que aparecen por líneas, con movimiento amortiguado; dos líneas principales para reservar más espacio a la interfaz.
- Ventana de la grabación de 984×916px, cámara que se desplaza entre los productos, la venta, el botón de conversión y los documentos asociados. Encuadres sin achatamiento ni estiramiento de la interfaz.
- Resaltados editoriales sobre el botón real y la fila real de la factura. No se recrea una aceptación ni se reemplaza el contenido de la aplicación por datos dibujados.
- Progreso continuo, subtítulos sincronizados y cierre con movimiento suave usando la misma ilustración aprobada. La ilustración está identificada y no se presenta como una grabación de una persona real.
- Comparación entre el original y Remotion en el reproductor local. La copia original de comparación es temporal (`render/original.mp4`), excluida de Git y reconstruida por `finalize.py`.

## Fuente y fidelidad

Se reutiliza el mismo bruto OBS del navegador Codex del piloto v1. No se crearon nuevas ventas o emisiones para esta revisión. Ejemplo: venta28, POS3, QABF5, Factus Sandbox SETP990046480, NC interna16/NC3, total55.300COP. Los datos son QA. Cortes y aceleraciones sirven para demostrar el recorrido; no prometen un tiempo de emisión.

Los clips públicos sólo contienen la página del POS o el área del modal. Se excluyen chat, pestañas, URL y el nombre del operador. Los recortes y tiempos constan en `source-manifest.json`; el bruto completo no se añade al repositorio. Para la conversión se conserva el recorte del modal porque éste ocupa también el área superior; no se utiliza la cabecera del usuario.

**Audio sin modificaciones:** `prepare.py` extrae por copia la pista AAC del MP4 v1, y `finalize.py` la vuelve a multiplexar sin recodificar, cambiar volumen, voz, música o tiempos. El hash de los paquetes AAC del original y del nuevo MP4 coincide; consta en `qa.json`. No se ha ejecutado clonación de voz ni se ha generado otra locución.

Voz original: Kokoro ef_dora; datos/licencia en el README v1. Música original del piloto: “Chill Wave”, Kevin MacLeod (incompetech.com), ISRC USUAN1600048, [CC BY4.0](https://creativecommons.org/licenses/by/4.0/), [fuente del autor](https://www.incompetech.com/music/royalty-free/index.html?isrc=USUAN1600048). Mantener la atribución del [texto de publicación original](../piloto-pos-real-v1/texto-publicacion.txt). Se conservan las condiciones visibles del producto y la etiqueta Sandbox.

## Proyecto independiente y reproducción

Esta carpeta tiene su propio `package.json`, lockfile y dependencias. **No se añadieron dependencias a Astro** y no se importa esta composición desde la web pública. `node_modules/`, renders intermedios, cachés y logs quedan excluidos. Remotion se fijó a4.0.543; React a19.2.4. Se usó Node24; el Node18 global no se modificó.

1. Node>=22.12: `npm ci` dentro de esta carpeta.
2. Python con Pillow/imageio-ffmpeg disponibles en el entorno de trabajo. Preparar las fuentes: `python prepare.py --recording "RUTA_AL_BRUTO_OBS"`.
3. Generar el montaje: `node render-review.mjs --video`. Produce fotogramas de revisión y `render/picture.mp4` usando Remotion. `--video-only` omite los fotogramas de revisión ya generados.
4. `python finalize.py`: copia el audio sin recodificar, valida igualdad de hashes de audio, decodifica el video completo, comprueba medidas/duración y crea fotogramas, portada y comparación local.
5. `python -m http.server 4339 --bind 127.0.0.1 --directory .` para ver el reproductor. En Windows iniciar en segundo plano con ventana oculta. Sólo escucha en localhost; no publica materiales de revisión en Internet.

La descarga automática del navegador de Remotion falló por resolución DNS de `remotion.media`. Se renderizó con el Chrome ya instalado, usando `REMOTION_BROWSER_EXECUTABLE` apuntando al ejecutable de Chrome. El render utiliza un contexto efímero y no controla ni inspecciona sesiones del usuario. La revisión interactiva se hizo mediante el navegador de Codex. No se requiere contratar servicios ni renderizado en nube para este piloto.

## Validación y alcance

Se comprobó TypeScript sin errores, se revisaron seis fotogramas del diseño, se ajustó el recorrido de cámara al aparecer el modal y se limpió el cierre para ocultar el CTA antiguo de la imagen de referencia. Después se renderizaron los660 fotogramas y se decodificó el MP4 completo. Se inspeccionaron nueve fotogramas finales representativos; `qa.json` guarda dimensiones, duración y hashes. En el navegador de Codex se observó reproducción hasta `currentTime=22`, `ended=true`, sin errores y con sonido habilitado; el selector de comparación cargó la fuente del original y regresó a Remotion. Evidencia estructurada en [browser-qa.json](browser-qa.json). La valoración creativa final corresponde al propietario al comparar ambas versiones.

Control de contexto previo: web0a0e045, POSd7538c4. Se revisó el avance desde7ae3f57: recuperación de correos de empleados y ajuste de scroll del catálogo. Al cerrar, POS avanzó a841a761, con etiquetas de código de barras e impresión según el papel del dispositivo; se revisó ese alcance. No altera el ejemplo de conversión previamente grabado. Esta revisión de alcance no equivale a certificar sincronización global de las ramas.
