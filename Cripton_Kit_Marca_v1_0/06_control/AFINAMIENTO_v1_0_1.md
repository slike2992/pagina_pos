# Afinamiento técnico de contornos

## Alcance
Mantenimiento del kit existente, no rediseño. Se conservan Cripton sin tilde, el símbolo orientado a la derecha, los vacíos expresivos, el ojo, el descendente inclinado de la p, la separación entre letras, las composiciones y sus márgenes nominales. No se sustituye el nombre por una fuente tipográfica.

## Correcciones
1. Eliminación de la copia marina superpuesta bajo la o cian, que podía producir un filo oscuro por antialiasing.
2. Rectificación de bordes casi rectos y simplificación de curvas de C, r, i, p, t, o y n. El punto de la i conserva su contorno óptico original.
3. Limpieza conservadora de tramos casi colineales del símbolo y sus acentos, con tolerancia de 0,18 unidades del trazado fuente. No se cierran sus vacíos intencionales.
4. Una misma geometría corregida en versiones horizontal, vertical, nombre, símbolo, micro, reversas y monocromas; regeneración de PNG, PDF e iconos.
5. Actualización de 18 ilustraciones del manual, con 56 apariciones identificadas. Conservación de las muestras históricas y de usos incorrectos. El favicon ampliado del manual se vuelve a renderizar desde el SVG para eliminar su desenfoque anterior.

## Magnitud
El solapamiento geométrico entre el nombre anterior y el afinado es 99,274 %. En la silueta principal del símbolo es 99,935 %. Son medidas de conservación geométrica, no puntuaciones de calidad estética. La comparación completa por letra se conserva en el informe JSON.

## Colores
Marino #002552, cian #00DEF8, blanco #FFFFFF y negro #000000 en la variante monocroma. No se añadieron efectos, degradados, bordes ni colores de marca nuevos.

## Compatibilidad y custodia
La revisión técnica es 1.0.1. Se mantienen los nombres v1.0 de los recursos para no romper las integraciones existentes. La copia anterior se conserva en un ZIP externo al kit. El archivo de referencia permanece intacto. Los archivos de control incluyen comprobaciones actuales y un manifiesto SHA-256 regenerado.

El manual mantiene sus normas y edición textual original. El alcance y la limitación de renderizado independiente del Word se detallan en LEEME_VALIDACION.md.

## Verificación reproducible
Ejecutar `node 06_control/verificar_integridad.mjs` desde el kit. En la copia situada en la raíz de la web se puede añadir `--web` para comprobar también que sus recursos publicados coinciden con el kit. No requiere dependencias adicionales ni modifica archivos.
