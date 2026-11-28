# Revisión de dirección del proveedor — 27 de noviembre de 2026

Preparación web desde `codex/pagina-pos-landing`, commit base
`8f34ae0a60571da449f2a123aa4c446172930003`, en el worktree aislado
`pos_saas/artifacts/legal-address-web-20261127`, rama
`codex/legal-address-web-20261127`. El checkout raíz de `pagina_pos` conserva
sus dos cambios ajenos en Brand y demo; no forman parte de esta revisión.
Base SaaS consultada al comenzar: `981649d`, sin commits entrantes en el control remoto.

## Fuente y alcance

Se copiaron byte por byte los dos archivos entregados por el integrador en
`pos_saas/artifacts/catalog-tax-flow-20261127/contracts/legal/`:

| Archivo | Versión | SHA256 del archivo |
| --- | --- | --- |
| `contracts/legal/signup-minimum-qa-2026-11-27.json` | `2026-11-27-prueba-minima-qa` | `f99b8565b692c92eec515c8c8935f86c7f3aec37a5da2e47b9c1333ac63b2179` |
| `contracts/legal/staging-minimum-2026-11-27.json` | `2026-11-27-minimo-qa` | `5fd87a5b8ad7e337ad1edc9fd8f60a3074ddd13cc5f598a5c4742e9e5004ce30` |

El digest JSON canónico del paquete de contrato27 es
`855b1dbb49e3ee6d15bd52d4d39f5fb5d97f7074d4b9ec13ffb4b7abfd7a1bb8`.
Los hashes de archivo y de contenido canónico son evidencias distintas.
`.gitattributes` conserva los bytes exactos de ambas copias al cambiar de equipo.
Las pruebas comparan la estructura completa con el25, permitiendo únicamente
`CL 78 C 130 55 T 4 507` → `Cl 78 C 130 55` y `2026-11-25` → `2026-11-27`.

`registration-legal.ts` añade un selector sin cambiar las constantes anteriores.
`signup-minimum-address-legal.ts` valida el packet nuevo y calcula las huellas de
documento con la misma serialización canónica que la versión anterior.
La ruta nueva `src/pages/legal/versiones/2026-11-27-prueba-minima-qa/[document].astro`
genera únicamente términos y privacidad, con noindex, texto íntegro y SHA256 visible.
Enlaza también las versiones anteriores. No se modifica su contenido ni sus URLs.

```sh
PUBLIC_SITE_URL=https://staging.cripton.com.co
PUBLIC_REGISTRATION_LEGAL_VERSION=2026-11-27-prueba-minima-qa
```

Ambas variables se fijan al compilar. El selector actualiza los enlaces del pie,
centro legal, cookies y ConsentPanel mediante el helper existente. Sin selector
se conserva09-01. Los dos selectores25 siguen admitidos. Las rutas versionadas
se conservan en staging al retirar el selector; fuera de staging no se generan.
El aviso de cookies conserva su versión2026-11-23 y su decisión independiente.

El borrador `src/content/legal-review-2026-11-24.json`, aún no adoptado, cambia
únicamente sus cuatro apariciones de la dirección. Conserva versión24, estado
`review-only`, condiciones y pendientes. Sus tres PDF de revisión se regeneran
con el exportador existente y su manifiesto se vuelve a vincular a la fuente.
`docs/legal/history`, baseline09-01 y los paquetes canónicos25 no cambian.

## QA y límites

Node24.22.3 y pnpm11.25.0, instalación aislada con `--frozen-lockfile`.
El store y las salidas locales se guardan en `artifacts/`, fuera del commit.
La selección `node --test scripts/legal-review.test.mjs scripts/signup-trial-legal.test.mjs`
pasó18/18: archivos exactos, diferencia mínima, fuente/PDF/manifiesto, render de
párrafos y huellas, coexistencia de versiones, enlaces coherentes y rechazo de
producción, HTTP, host falso, puerto distinto y credenciales en origen.
El build de origen productivo sin selector omite todas las rutas QA.

Los22 folios PDF se renderizaron con Poppler y se revisaron visualmente en
contactos de las tres piezas; conservan9/6/7 páginas, márgenes, títulos y pies.
La extracción comprueba la dirección nueva y la ausencia de la anterior.

QA completo `npm run qa:web` con variables de staging27: salida0, Astro check de
81 archivos con0 errores/advertencias/hints, build estático de26 páginas y
724/724 pruebas aprobadas, sin fallos, cancelaciones, omisiones ni pendientes.
Las18 pruebas legales anteriores están incluidas en ese total; no se suman dos veces.
El digest canónico contractual27 se comprobó también contra el valor exacto
entregado por el integrador. Tras este QA sólo se completó documentación;
no se cambió funcionalidad ni se repitieron pruebas.

Evidencia local fuera del commit:

- [QA completo](../artifacts/qa-web.log), desde la raíz del worktree:
  `artifacts/qa-web.log`.
- [Selección legal inicial](../artifacts/legal-address-tests.log):18/18.
- [Coordinación previa al commit](../artifacts/precommit-sync.log):
  `npm run sync:check` desde la raíz SaaS con Node24, consulta remota correcta,
  base `981649d230cf0124e4e53563bfb039aaf621bd10`,0 entrantes y0 propios frente
  a `feature/saas-foundation` local y remota. Se leyó el registro de cambios;
  los avisos de trabajo ajeno corresponden a otros worktrees SaaS y no se incluyen.

El gate final revisa el diff, los bytes canónicos y el conjunto explícito de
archivos preparados. Los logs, el store y las imágenes de QA permanecen locales;
no viajan con el commit. No se aplican hooks ni integración de SaaS al repositorio
web independiente: el control de coordinación se ejecutó en la raíz SaaS.
No hay evidencia de navegador interactivo, Linux ni staging en este bloque.
No se consultan DNS/servidores, se aplican migraciones, registran aceptaciones,
ejecutan proveedores o cambian servicios.

## Entrega al integrador

La API continúa siendo la autoridad de versiones/aceptaciones. El cambio de
política exige su compatibilidad por digest exacto del mínimo25 y el nuevo
operador `ops/ubuntu/adopt-staging-address-legal.mjs`, preparados en SaaS por el
integrador. No reusar los publishers25 para27: fijan versiones y predecesores.
Cambiar sólo enlaces web no publica el catálogo ni adopta un contrato.

El procedimiento Astro existente se reconoce en los scripts operativos de SaaS:

- `artifacts/azure-readiness/prepare-renewal-contract-web-20261127.sh`:
  tar de commit verificado, build Linux limpio, pnpm frozen, check y build.
- `artifacts/azure-readiness/prepare-renewal-contract-web-manifest-20261127.mjs`:
  igualdad de JSON con SaaS, copia completa de dist a release nuevo, hashes de
  todos los archivos y `BUILD-MANIFEST.json`, `verifyWeb` y custodia de fuentes.
- `artifacts/azure-readiness/activate-renewal-contract-web-20261127.sh`:
  locks compartidos, verificación del release, symlink atómico y comprobaciones.

Son precedentes ligados a commits, hashes y rutas concretas; no son plantillas
ejecutables para esta revisión. El integrador debe preparar valores actuales,
selector27, manifiesto/capacidades compatibles y la adopción coordinada. Conservar
API/POS/worker/edge existentes y comprobar las páginas/huellas y el catálogo real
después de publicar. Los flags no cambian HTML ya compilado.

## Publicación y validación del integrador — 2026-11-28

El commit web `bd6ac161b6e826e797eba345f32ec6e15ec22efd` se compiló limpio en
Linux con los flags27: check sin incidencias y26 páginas. El paquete SaaS
`2f1604259946` pasó sus gates canónicos y se activó únicamente en staging.
La web quedó en `web-staging/releases/bd6ac161b6e8`,83 archivos y manifiesto
`1050f8f3cafe27fb40ea27408b57017f348c6fdf22b82a9ca29487074c0e5c62`.
Su tar fuente se verificó y custodió con SHA256
`0856ef1174b3f80827106cfe844552addbaab95d1fc388cd9ff39a3349c56122`.

El nuevo operador primero ensayó con rollback sobre staging y adoptó la revisión
a las **2026-11-28 00:08:29 Colombia**, sin modificar las huellas de aceptaciones
ni las cohortes. Los servicios permanecen sanos; no se tocaron datos productivos.

En el navegador de Codex se comprobó `Cl 78 C 130 55` en los términos y privacidad
publicados, sin el complemento anterior. El formulario obtuvo de la API la
versión27 y actualizó ambos enlaces; cookies y pie usan también privacidad27.
Se dejó abierto el documento nuevo, sin enviar registro, aceptación o pago.
Las rutas25 y las constancias anteriores mantienen el contenido que se aceptó.
No se atribuyen a esta revisión nuevos correos ni otra contratación de usuario.
