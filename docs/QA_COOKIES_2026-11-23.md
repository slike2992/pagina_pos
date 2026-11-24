# Cookies y transparencia — 2026-11-23

## Criterio e inventario

Se contrastó la implementación con los artículos 4, 9 y 12 de la
[Ley 1581 de 2012](https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981&success=true),
el mecanismo de autorización descrito en el
[Decreto 1377 de 2013](https://www1.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=53646)
y el criterio de la SIC sobre
[cookies que recolectan datos personales](https://sedeelectronica.sic.gov.co/publicaciones/boletin-juridico/boletin/superindustria-ordena-google-llc-cumplir-con-la-ley-1581-de-2012).
Informar sobre finalidad y derechos no reemplaza una autorización cuando esta
es exigible; el silencio o desplazamiento no constituyen aceptación. No se
presenta este desarrollo como una certificación jurídica de todo el producto.

La web contiene almacenamiento funcional de registro/verificación, checkout y
regreso seguro desde POS, además de su preferencia de privacidad. No tiene un
pixel publicitario. La integración GA4 existente requiere flags explícitos y
permanece desactivada en staging. Las páginas de términos y privacidad aceptadas,
sus versiones y hashes se conservan; solo se actualiza la explicación de cookies.

## Cambio

- El aviso ya no desaparece por falta de un ID GA4: explica el almacenamiento
  necesario y ofrece consultar sus finalidades/duración y guardar preferencias.
- Sin analítica disponible informa de su estado, deshabilita su casilla y oculta
  «Aceptar analítica». «Solo necesarias» no acepta términos ni autoriza marketing.
- Con configuración válida, aceptar y rechazar tienen igual tratamiento visual.
  La casilla opcional comienza desmarcada; guardar aplica la selección expresa.
  Ningún script de Google carga antes del permiso. No se inicia un proveedor real.
- El pie permite reabrir el panel. Las páginas privadas conservan sus enlaces
  legales y no montan el panel ni habilitan medición.
- Recibo local v2: elección, fecha, vencimiento de 180 días, versión de aviso y
  alcance/proveedor, sin correo ni identificador personal. Un permiso antiguo,
  vencido o de otro alcance no autoriza una nueva integración.
- Retirada/borrado entre pestañas detienen medición y limpian solo cookies GA
  accesibles. Se respetan GPC/DNT. Bloquear cookies o storage no impide rechazar.
- El panel es no modal y desplazable; no bloquea navegar por la web. Sin JS
  no se carga medición; los enlaces informativos del pie siguen disponibles.

## Evidencia

- Astro check/build aprobados; 272 pruebas web, incluidas 13 de comportamiento
  del consentimiento. Las pruebas de GA usan un navegador simulado y no ejecutan
  Google ni envían eventos a una propiedad.
- Codex local: aviso visible sin proveedor; preferencias/estado explicados,
  casilla deshabilitada, guardar y cierre; recarga conserva la elección después
  de inicializar JS; reapertura desde el pie y enlace a la política correctos.
- Móvil 390 × 640: panel de 598 px con contenido de 771 px, sin desbordamiento
  horizontal; el scroll permite alcanzar y pulsar «Guardar preferencias».
- Capturas y mediciones en `evidence/cookies-2026-11-23/`.

Límites: el recibo es local al navegador, no un registro central firmado; no se
certifica una propiedad GA4 real ni la configuración de retención de Google.
Antes de activar esa integración deben revisarse proveedor, prueba de
autorizaciones y tratamientos/transferencias correspondientes. No se cambia
autenticación, pagos, datos, POS ni Control.
