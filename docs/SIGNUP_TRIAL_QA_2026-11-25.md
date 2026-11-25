# Documentos versionados del registro de prueba QA

La fuente canónica es `pos_saas/contracts/legal/signup-trial-qa-2026-11-25.json`.
Se copió sin transformación a `src/content/signup-trial-qa-2026-11-25.json`:
SHA256 de ambos archivos `be97e5efb921c9436532e9cf483d7d151d19693f1a8ba4b6c6f43ae28e6cc1df`.
Versión `2026-11-25-prueba-qa`, scope `staging_trial_qa`, documentos `terms` y
`privacy`. No editar la copia; una corrección posterior requiere coordinación de
una nueva versión/fuente canónica, sin sustituir documentos aceptados.

## Publicación estática y selección de enlaces

Se generan únicamente para `PUBLIC_SITE_URL=https://staging.cripton.com.co`:

- `/legal/versiones/2026-11-25-prueba-qa/terminos/`
- `/legal/versiones/2026-11-25-prueba-qa/privacidad/`

Reutilizan `EditorialLayout`, marca y estilos existentes. Se renderizan las
secciones/párrafos del JSON como texto escapado. Cada página identifica versión,
scope y SHA256 del documento completo mediante JSON canónico: claves de objetos
ordenadas, arrays en orden original y UTF-8, igual que `contractDigest` de SaaS.
La huella no corresponde al HTML ni al JSON formateado del archivo.

Para que pie y centro legal enlacen esa versión, el build requiere ambas variables:

```text
PUBLIC_SITE_URL=https://staging.cripton.com.co
PUBLIC_REGISTRATION_LEGAL_VERSION=2026-11-25-prueba-qa
```

El selector sólo cambia esos enlaces informativos. La API decide las versiones y
URLs del registro; se conserva su contrato HTTP y no se modifica el formulario,
su aceptación, demo, pagos, planes, POS ni administración. Publicar HTML no adopta
la política SQL. Main coordina el catálogo de signup, publicación/adopción y deploy.

Ausente/vacío el selector conserva versión2026-09-01, textos y hrefs por defecto
en pie/centro legal. Las URLs QA se conservan en staging aunque se retire ese
selector, para mantener consultables sus documentos. Fuera del host HTTPS exacto
no se generan rutas QA; intentar seleccionar esta versión falla el build.
Versiones desconocidas también fallan en lugar de elegir otra silenciosamente.

Las páginas QA permanecen `noindex`, fuera de canonical/sitemap y separadas de
`legalDrafts` y los39 apartados de revisión2026-11-24. No son una activación legal
productiva ni cambian las condiciones del primer pago por empresa.

## Inmutabilidad y pruebas

Permanecen byte por byte términos/privacidad09-01 y sus archivos históricos.
Los cambios ajenos de `Brand.astro` y `pago/demo.astro` en el checkout principal
no se copiaron. Las pruebas verifican hashes de copia/archivo, enlaces por defecto
y QA, origen exacto, secciones completas,15 días sin tarjeta y consultas de datos.
Compilan builds estáticos aislados y comprueban que un build con origen productivo
y selector QA falla. No inician servidor ni efectúan registros o peticiones SaaS.

Con Node compatible:

```sh
npm run check
npm run build
npm run test:web
```

`test:web` incluye `scripts/signup-trial-legal.test.mjs`, cuyos builds temporales
se retiran al terminar. La evidencia de HTML y configuración no sustituye el
recorrido de aceptación en navegador, el catálogo SQL ni un despliegue coordinado.

Validación local de este bloque: Astro check con0 errores/advertencias/hints y
542/542 pruebas web aprobadas, incluidas6 nuevas. Los builds reales cubren defaults,
selector QA y rechazo del origen productivo; se mantuvieron los bytes protegidos.
En el worktree compartido faltan los shims `astro` de `.bin`: se ejecutó la misma
CLI instalada con `node node_modules/astro/bin/astro.mjs check` y `build`, sin
reinstalar dependencias ni modificar el junction compartido.

Archivos del bloque: copia JSON, `src/lib/registration-legal.ts`,
`src/lib/signup-trial-legal.ts`, la página versionada `[document].astro`,
`SiteFooter.astro`, centro legal, pruebas `signup-trial-legal.test.mjs` y la
adaptación acotada de `seo.test.mjs`, registro de test en `package.json`, README,
este documento y CROSS web. Sin cambios en fuentes de registro/pago, marca,
documentos09-01, borradores, SQL o código SaaS.

## Build y archivo para Main

Con Node24, desde un checkout que incluya los cambios integrados, generar el
artefacto estático de staging con las variables explícitas:

```sh
export PUBLIC_SITE_URL=https://staging.cripton.com.co
export PUBLIC_REGISTRATION_LEGAL_VERSION=2026-11-25-prueba-qa
export PUBLIC_SAAS_API_URL=https://api-staging.cripton.com.co
export PUBLIC_POS_URL=https://pos-staging.cripton.com.co
export PUBLIC_SITE_INDEXABLE=false
export PUBLIC_LEGAL_DRAFT_PREVIEW=false
node node_modules/astro/bin/astro.mjs check
node node_modules/astro/bin/astro.mjs build
# Elegir un archivo nuevo; no sobrescribir un release anterior.
tar -C dist -czf /ruta/nueva/web-signup-trial-qa.tar.gz .
```

El archivo contiene el HTML/assets de `dist`, no el checkout, claves o datos.
Estos comandos no publican ni adoptan una política. Main prepara su manifiesto,
archivo de release y despliegue mediante el procedimiento coordinado existente.
