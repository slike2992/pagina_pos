# Selección legal productiva — 28 de noviembre de 2026

Checkout propio `pos_saas/artifacts/web-production-20261128`, rama
`codex/web-production-20261128`, base landing `3c63f6f`. No modifica el root
`pagina_pos`, sus dos cambios ajenos, ni POS/admin/infraestructura.

## Fuentes exactas

Copias byte por byte de `pos_saas/artifacts/production-isolation-20261128/contracts/legal/`,
verificadas también contra los blobs del commit SaaS definitivo
`5bd50d020e11496fe2fb62bd4997688427665f7f`:

| Archivo | SHA256 del archivo | SHA256 del JSON canónico |
| --- | --- | --- |
| `production-minimum-2026-11-28.json` | `622d5b6b51f1dbc4b52668814f1936b2378c5bd85c829c638c22c20667a5f9ec` | `4806a0616ec5499009b15c80e0d989b8ad5765fdfbc1677e5ea1e29710c3aaf9` |
| `signup-production-minimum-2026-11-28.json` | `9caffbfac1a48d11d06f0ed0b6a5337feecc8b225593ee73c9ba53e0adaa1ef7` | `82dbf9d30a27dbf9448671ff50818f6da9b003b20de703eb664ac2e04df9c0b7` |

Blobs Git: `d98da4605d6983fc4d435f9107348aeb11d7a737` y
`8447f0e4489c174debabcc43d059e2780cf52c3e`, respectivamente. Atributo `-text`
para ambos JSON; los helpers fijan scope, versión, estructura y digest canónico.
Se conserva el texto íntegro, incluidas listas y subsecciones. El ANS muestra
sólo soporte/ANS de los términos y su hash completo; no genera otro contrato.

## Perfil explícito

```dotenv
PUBLIC_SITE_URL=https://cripton.com.co
PUBLIC_REGISTRATION_LEGAL_VERSION=2026-11-28-registro-prod
PUBLIC_SAAS_API_URL=https://api.cripton.com.co
PUBLIC_POS_URL=https://pos.cripton.com.co
PUBLIC_SITE_INDEXABLE=false
PUBLIC_LEGAL_DRAFT_PREVIEW=false
PUBLIC_ANALYTICS_REVIEWED=false
PUBLIC_GA_MEASUREMENT_ID=
```

`https://www.cripton.com.co` admite el mismo perfil como alias público; las URLs
absolutas de la fuente mantienen el origen canónico `cripton.com.co`. Se rechazan
credenciales, hosts parecidos, HTTP, puertos distintos, rutas, query y fragmento.
Registro falla el build si falta API/POS o apuntan a otro entorno. Sin selector
permanece el comportamiento09-01; no se cambia el opt-in QA ni sus fuentes.

Rutas de registro: `/legal/versiones/2026-11-28-registro-prod/{terminos,privacidad}/`.
Rutas de contrato: `/legal/versiones/2026-11-28-minimo-prod/{terminos,privacidad,tratamiento-por-cuenta-del-cliente,sla}/`.
Se generan sólo en los hosts productivos permitidos. Las rutas QA se generan
sólo en staging. Las seis vistas versionadas mantienen `noindex`, sin formularios
de aceptación; el aviso de cookies conserva su versión independiente2026-11-23.

La API sigue proporcionando el catálogo y el acuerdo aplicables. El registro
productivo rechaza un catálogo con versiones, duplicados o destinos incoherentes
antes de habilitar la aceptación. Mi cuenta bloquea un paquete o versión operativa
discordantes, sin convertir evidencia QA. No se cambian payloads ni permisos.

## Coordinación y dependencias

El web no dispone de `sync:check` ni de fallback instalado en su Git común.
Se verificó directamente la base publicada `origin/codex/pagina-pos-landing`:
cero entrantes y cero propios al comenzar. `npm run sync:check` SaaS consultó
el remoto y quedó alineado. Se leyeron README y registros CROSS de ambos repos.

Node24.22.3/pnpm11.25.0. Instalación congelada propia, sin copiar `node_modules`
o archivos de otros trabajos. El intento offline detectó un tarball ausente;
la instalación normal reutilizó270 paquetes y conservó `pnpm-lock.yaml`.

## Validación y límites

Pruebas de selector/configuración, bytes/digests, render íntegro de cinco
documentos y ANS, enlaces cruzados, cookies, registro real en DOM simulado,
contrato protegido y builds rechazados por mezcla de entornos. La matriz incluye
ambos hosts productivos y todos los selectores QA/históricos existentes.

Ejecución local: `npm run check`, `npm run build`, `npm run test:web` con el
perfil anterior. Logs propios en `.logs/production-check.log`,
`.logs/production-build.log`, `.logs/production-full-tests.log` y
`.logs/production-legal-tests.log`. El primer full detectó una prueba SEO que
inventariaba sólo los textos de enlace legacy/QA: se añadieron los dos textos
productivos exactos y su etiqueta de versión, conservando la igualdad estricta.
La repetición completa está en `.logs/production-full-tests-r2.log`.

Resultados finales:

- Producción: Astro check90 archivos sin errores/advertencias/hints, build26
  páginas y **753/753** pruebas aprobadas.
- Staging: Astro check90 sin incidencias, build32 páginas en
  `.logs/staging-dist` y **753/753** pruebas aprobadas. Logs
  `.logs/staging-check.log`, `.logs/staging-build.log` y
  `.logs/staging-full-tests.log`; el preview productivo en `dist` se conserva.
- Matriz legal aislada25/25: los dos hosts productivos, los perfiles QA
  históricos, fuentes exactas, render/huellas y builds negativos por host/API.
  Las pruebas de controladores usan DOM/transporte simulados y no llaman al servicio.
- En navegador local en segundo plano se comprobó centro legal, enlace al ANS,
  scope productivo, siete secciones y hashes visibles, además de cookies y enlaces
  de privacidad concordantes. Sin desbordamiento horizontal en la vista comprobada.
  No se abrió registro/cuenta ni se ejecutó una aceptación. HTTP local:200 en
  centro legal y ANS productivo,404 en la ruta de registro QA28 comprobada.

Preview propio del HTML productivo compilado: `http://127.0.0.1:44365/legal/`.
No es un hostname productivo ni una apertura del servicio. Las páginas de lectura
legal permiten inspeccionar presentación, hashes y enlaces sin aceptación.
No se prueba el callback API productivo, aún dependiente de sus gates.

Servidor propio en background, PID12464 al terminar QA. Se deja activo para la
revisión solicitada. Desde este checkout puede consultarse con
`node node_modules/astro/bin/astro.mjs preview status` y detenerse con
`node node_modules/astro/bin/astro.mjs preview stop`, usando Node24.

No hubo publicación en VM, adopción privada, alta/aceptación de clientes, pago,
llamadas de proveedor, envío de correo, habilitación fiscal ni modificación de
ramas/protecciones. La preparación web no acredita admisión ni Wompi productivo.
El archivo CI nuevo lo prepara main por separado; este bloque no lo edita.
