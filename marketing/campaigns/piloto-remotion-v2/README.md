# Piloto Remotion v2 · mejora visual del mismo video

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
