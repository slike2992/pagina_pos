# QA de la web comercial — 2026-10-26

## Entorno y alcance

Worktree aislado `f458/pagina_pos`, desde `ad3f8c6`; Node 24.19.0 y Astro 7.2.7
con dependencias existentes. Revisión en navegador Codex, servidor de revisión
4324. No se instalaron dependencias ni se migraron bases de datos. Los archivos
previos de marca y pago de la carpeta original se mantuvieron fuera del bloque.

## Comprobaciones de código y artefacto

- Astro check: 0 errores, 0 advertencias, 0 hints en la corrida final registrada.
- Build público: 20 páginas HTML, 12 rutas editoriales preferidas y 8 flujos
  no indexables. Sin borradores legales, README interno ni toolbar.
- Build de revisión explícita: 23 páginas, incluidos tres borradores noindex,
  sin canonical y con aviso de ausencia de vigencia; sitemap vacío.
- **14 pruebas aprobadas** en ambos modos: metadatos únicos, allowlist,
  canonical sin tokens/orígenes de petición, sitemap/robots, navegación y anchors,
  recursos, planes/schema/ahorro, preservación jurídica y consentimiento.
- El comando público con `PUBLIC_LEGAL_DRAFT_PREVIEW=true` se rechaza antes
  de construir. La ruta aplica además su propia barrera de generación.
- Cabecera `X-Robots-Tag: noindex, nofollow` comprobada por HTTP después de la
  recarga de configuración de Astro en el servidor de revisión.
- `git diff --check` sin errores de espacio después de la corrección.

Las pruebas de consentimiento ejecutan el cliente real extraído de su plantilla
en una frontera de navegador simulada, sin ejecutar Google ni enviar visitas a
una propiedad real. Cubren rechazo, consentimiento, revocación antes/después de
carga, no duplicar visitas del mismo documento, sincronización entre pestañas,
storage bloqueado, origen de preview, query y señales de privacidad.

## Comprobaciones en el navegador Codex

| Caso | Evidencia observada |
| --- | --- |
| Responsive público | 12 rutas × 320, 768, 1024 y 1440 px = 48 comprobaciones finales, sin desbordamiento horizontal del documento, un H1 y sin imágenes rotas observadas. |
| Cabecera | Texto blanco sobre botón oscuro; CTA principal visible a 1280 × 720. |
| Móvil 393 × 852 | Portada, menú, lectura editorial y formulario revisados visualmente. |
| Menú | Abrir/cerrar, Escape con retorno al summary y navegación a Soluciones correctos. |
| Contacto | Datos sintéticos, selección Profesional FE y preparación sin cambiar la query. El destino sensible no queda en href ni data-url: botón explícito y memoria local. No se abrió ni envió el mensaje. Editar datos oculta el botón anterior. |
| Borradores | Tres rutas a 393 px, aviso visible, 13 secciones cada una, noindex, sin canonical y sin overflow. |
| Registro en puerto de revisión | Se conserva `professional-fe` seleccionado y no existe panel de analítica. Ese origen nuevo no está autorizado por CORS de la API actual: el catálogo jurídico no carga allí. No se amplió CORS para pasar una prueba. |

La primera pasada detectó contraste heredado en un botón y min-width que creaba
15 px de desbordamiento a 320 px; ambos fueron corregidos y los casos repetidos.
Una auditoría de build detectó que Astro publicaba `src/pages/README.md`; se
cambió a `_README.md`, excluido por el router, antes de cerrar la salida.

## Límites y continuación

Esta evidencia verifica el bloque comercial. No sustituye una simulación nueva
de pago, provisión, correo o FE, ni una auditoría completa de accesibilidad o
seguridad de backend. La validación del catálogo jurídico desde el origen
habitual se registra al integrar. No se aceptaron condiciones ni se creó una
cuenta nueva como parte de esta revisión.

Pendientes externos: titular y condiciones jurídicas, adopción versionada,
hosting/HTTPS/DNS, indexación real y propiedad de analítica. No hay medición real
de audiencia, Core Web Vitals de campo o posiciones obtenidas.

## Repetición

Con Node compatible en PATH:

```sh
npm run qa:web
npm run build:public
```

Para incluir propuestas jurídicas en un artefacto de revisión, establecer
`PUBLIC_SITE_INDEXABLE=false` y `PUBLIC_LEGAL_DRAFT_PREVIEW=true` antes de
construir y ejecutar `npm run test:web` con el mismo entorno. Retirar los flags
al terminar. No desplegar la salida de revisión como release público.

## Cierre de integración en la carpeta habitual

Integrado el bloque en `Documents/Proyectos/pagina_pos`, rama
`codex/pagina-pos-landing`, preservando hashes SHA256 de los dos archivos
previamente modificados: `Brand.astro` y `pago/demo.astro`. No se incorporaron
sus cambios al commit de este bloque ni se eliminaron los experimentos de marca.

- `build:public` en la carpeta habitual: 0 errores/advertencias/hints y 14/14
  pruebas; 20 páginas HTML. `dist/logo-options` ausente y su original en
  `public/logo-options` conservado. La cabecera noindex se comprobó en 4321.
- Navegador Codex contra **4321**: 48 comprobaciones responsive finales de las
  doce rutas a 320/768/1024/1440 px, sin overflow del documento, con un H1 y sin
  imágenes rotas observadas. Verificación visual adicional a 393 × 852.
- Se hizo clic en los seis CTA de planes. Cada uno abre `/registro` con el código
  correcto; la API carga «Condiciones vigentes: 2026-09-01.», habilita los
  controles y mantiene los enlaces legales vigentes. No hay panel de analítica.
  Consola sin errores en ese recorrido. No se aceptaron términos ni se envió alta.
- El error CORS de la preview 4324 no aparece en el origen habitual. No se
  ampliaron permisos ni se modificó CORS para efectuar esta comprobación.
- Se corrigió el uso de marca según el manual completo vigente: horizontal con
  ancho suficiente en la cabecera, nombre solo en móvil y flujos de cuenta;
  se retiró la repetición vertical que quedaba por debajo del mínimo aprobado.
- Evidencia visual y métricas del navegador guardadas como artefactos locales de
  esta tarea. No se publicaron capturas de cuentas ni datos de clientes.