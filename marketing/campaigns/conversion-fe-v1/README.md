# Cripton · Campaña de conversión documental · v1.0

Paquete preparado el 13 de noviembre de 2026 para revisión del propietario. No publicado ni programado. Abrir `index.html` en el navegador o servir esta carpeta con `python -m http.server 4337 --bind 127.0.0.1`.

## Entrega

- Un carrusel C01 de cinco láminas: PNG 1080×1350 y alternativa cuadrada 1080×1080.
- Tres publicaciones P01–P03 en ambos tamaños.
- Cuatro historias S01–S04, 1080×1920, con contenido fuera de las zonas superior e inferior reservadas para controles de la red.
- Tres videos editoriales verticales H.264 a 30 fps: R01 30 s, R02 24 s y R03 30 s. Sin audio; el mensaje completo está escrito en pantalla. No se necesita contratar música ni síntesis de voz para usarlos.
- Tres portadas de video 1080×1350. Catorce imágenes de escenas de los videos.
- En total, 37 PNG, sus SVG con texto editable y sus SVG con texto trazado; tres MP4, subtítulos SRT y guiones; textos CSV/TXT y galería local.

## Qué puede afirmarse

Se presenta la función que reutiliza información del documento interno para generar una factura electrónica. Requiere configuración fiscal y un plan con electrónica. Un documento interno no sustituye la factura fiscal exigida ni cambia el momento legal de emisión.

Los diagramas están identificados como explicaciones. Los videos son montajes editoriales, no grabaciones de una conversión ni evidencia de emisión productiva. La única captura incorporada es `marketing/captures/catalogo.jpg`, obtenida anteriormente en Codex con datos QA y documentada en esa carpeta. No representa un catálogo comercial de papelería ni resultados de un cliente. No hay precios, testimonios, ahorros cuantificados, promesas de emisión en un clic o funcionamiento sin internet.

## Orden propuesto para los primeros siete días

| Día relativo | Archivo | Canal | Texto |
|---|---|---|---|
| 1 | videos/R01.mp4 + images/R01-cover-feed.png | Reels Facebook/Instagram, TikTok y Shorts | copy/textos.txt · R01 |
| 2 | images/S01-story.png | Historias Facebook/Instagram | S01 |
| 3 | images/C01-01-feed.png a C01-05-feed.png, en orden | Carrusel Facebook/Instagram | C01 |
| 4 | images/S02-story.png y S03-story.png | Historias | S02 / S03 |
| 5 | videos/R02.mp4 + images/R02-cover-feed.png | Video vertical | R02 |
| 6 | images/P01-feed.png + images/S04-story.png | Feed e historia | P01 / S04 |
| 7 | videos/R03.mp4 + images/R03-cover-feed.png | Video vertical | R03 |

P02 y P03 son alternativas para la siguiente semana. Las fechas son relativas: asignarlas cuando se aprueben las piezas exactas. No subir las escenas individuales del video como si fueran otro carrusel. Elegir una sola proporción para todas las láminas de C01. CTA: mensaje privado; no dirige al dominio estacionado ni solicita datos sensibles.

## Recursos y reproducción

Maestros y fuente Inter copiados de `marketing/brand` sin cambiar contornos o colores. Se incluye la licencia de Inter en `assets/fonts/LICENSE.txt`. Los maestros originales permanecen en el kit corporativo. SVG con texto editable requiere Inter; PNG y SVG trazado no dependen de fuentes instaladas.

Scripts en `tools/`. El contenido fuente del compositor está en `build_conversion.py`; `campaign.json` inventaría las piezas y sus textos. Con Python, fonttools, pillow e imageio-ffmpeg, y Node con la dependencia sharp del proyecto:

```
python tools/build_conversion.py --marketing <ruta-marketing> --output <ruta-esta-campana>
node tools/render_conversion.mjs <ruta-esta-campana> <raiz-web-con-sharp>
python tools/finish_conversion.py <ruta-esta-campana>
```

Los scripts actúan sólo sobre esta campaña; no regeneran el kit inicial ni publican contenido.

## Revisión pendiente y límites

1. Aprobación del propietario sobre archivos exactos y el encuadre comercial.
2. Revisión tributaria del flujo y del mensaje de conversión antes de usarlo como promesa comercial. La consulta de fuentes no es una certificación legal.
3. Para una futura demostración grabada: disponer de un tenant QA con plan FE y configuración fiscal activa. El cliente abierto en Codex el 13 de noviembre informó emisión deshabilitada. No se modificó su plan ni se fabricó una captura de conversión.
4. Las previsualizaciones locales no sustituyen la revisión de recortes y controles en las aplicaciones nativas. Sin campañas activadas ni alcance comercial medido.

Fuentes fiscales consultadas: [Resolución DIAN 227 de 2025](https://normograma.dian.gov.co/dian/compilacion/docs/resolucion_dian_0227_2025.htm) y [Concepto DIAN 15975 de 2026](https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_15975_2026.htm).
