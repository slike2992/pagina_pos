# Marketing digital de Cripton POS

Campaña inicial de 30 días, preparada el 26 de octubre de 2026. Repositorio: `pagina_pos`; rama `codex/marketing-launch`; base inicial `ce85b72`; fuente web actualizada y revisada `645be14`. Objetivo: generar conversaciones y demostraciones calificadas con comercios de Colombia mostrando el producto real y una identidad consistente. No se ha publicado ni programado contenido, ni contratado anuncios.

Abre **[index.html](index.html)** para revisar las piezas, descargar PNG, acceder a los SVG y reproducir los seis videos. La galería es local y no debe copiarse a `public/` ni desplegarse con la web: contiene materiales de revisión y fuentes.

## Entregables

- [Plan editorial y ejecución](strategy/PLAN_30_DIAS.md).
- [Calendario CSV](strategy/calendario-30-dias.csv): 30 jornadas relativas; asignar fecha de inicio después de aprobar la campaña.
- [Textos para Instagram y Facebook](copy/publicaciones.csv), [historias](copy/historias.csv), [anuncios](copy/anuncios.csv), seis guiones y SSML en `copy/`.
- [Perfiles y respuestas](strategy/PERFILES_Y_RESPUESTAS.md), [voz y música](strategy/VOZ_Y_MUSICA.md), [medición](strategy/MEDICION_Y_ENLACES.md).
- `campaigns/launch-30d/campaign.json`: contenido editable canónico. `sources/`: SVG con texto editable; `exports/`: PNG, SVG con texto trazado y MP4. `manifest.json` relaciona cada recurso y su texto alternativo.
- `brand/`: copias exactas de maestros y fuente Inter con licencia. El manual canónico sigue en `../Cripton_Kit_Marca_v1_0/`.
- `captures/`: cinco recortes de la interfaz real, sin nombres de usuario, correo, tokens ni URL de sesión. [Procedencia y límites](captures/README.md).
- [Registro de afirmaciones](research/CLAIMS.md), [fuentes oficiales](research/FUENTES.md), [control entre repositorios](research/COORDINACION.md).
- [Revisión y pendientes concretos](qa/REPORTE_REVISION.md).

## Uso y estados

`Borrador preparado` significa que existe archivo revisable. `Revisado técnicamente` exige el registro de exportación y revisión visual. `Aprobado por propietario` requiere su decisión sobre el archivo exacto. `Programado` y `Publicado` requieren evidencia de la plataforma. Ningún archivo de esta entrega equivale a autorización de publicación.

Instagram y Facebook usan las láminas `feed` 4:5; cada carrusel tiene también láminas cuadradas, todas del mismo tamaño. TikTok y YouTube usan los MP4 verticales. Las historias son para Instagram/Facebook; encuestas y preguntas se agregan con controles nativos al programar. No dibujar un sticker falso como si ya funcionara.

## Reproducir

Node >=22.12 y `npm ci` de la web proporcionan `sharp`. Python 3.12 con dependencias de `tools/requirements.txt`; instalar en un entorno propio. No es necesario instalar fuentes en Windows.

```
node marketing/tools/check-context.mjs
python marketing/tools/build.py
node marketing/tools/render.mjs marketing
python marketing/tools/finish.py
node marketing/tools/validate.mjs marketing
```

`build.py` regenera piezas y CSV desde `campaign.json`. `render.mjs` exporta PNG y galería. `finish.py` genera portadas, música y seis montajes MP4 con textos; no sintetiza voz. No cambia código del POS ni publica nada. Guardar aprobaciones en `qa/aprobaciones.csv`; no sobrescribir una versión ya aprobada sin incrementar versión y repetir la revisión.

## Editar y previsualizar

Para editar SVG en un programa de diseño, usa Inter suministrada en brand/fonts y conserva su licencia; el logo sigue siendo un vector oficial que no se reescribe. Los SVG trazados y PNG no dependen de una fuente instalada. Para abrir la galería en local: python -m http.server 4335 --bind 127.0.0.1 --directory marketing, desde la raíz del repositorio, y abre http://127.0.0.1:4335/. Ese servidor sólo atiende este computador.

El kit sigue listo para revisión, con publicación pendiente. El primer bloque recomendado es aprobar y preparar P01, S01, R01, P02 y S02; confirmar antes el destino y los mensajes de las cuentas.
