# Mi cuenta: contratación y solicitudes

La web depende del contrato API incorporado en `pos_saas` commit `bec4838`
(`feature/saas-foundation`). No comparte sesiones con Cripton Control ni accede
a SQL. Esta entrega no publica nuevos términos productivos ni cambia las
aceptaciones históricas2026-09-01.

## Contratación

`CustomerContract.astro` y `lib/customer-contract.ts` muestran oferta, prestaciones
y tres textos completos devueltos por la API para la empresa autenticada. Se
declaran identificación y representación sin subir documentos ni afirmar una
verificación oficial. Se requieren cinco declaraciones vacías; el uso del portal
no sustituye aceptarlas y no autoriza publicidad o renovación automática.

Mi cuenta consulta `GET /v1/me/customer-contract`; antes de contratar la prueba,
si la API lo exige, abre el paso contractual. La aceptación envía hashes y datos
declarados con idempotencia a la misma ruta. La API determina el tenant y recibe
la fecha; la web no puede activar un plan ni modificar esa evidencia. Una oferta
cambiada exige revisión nueva. Un paquete null antes de adoptar la política no
se presenta como aceptado. Un error no inutiliza el SSO ni la cuenta.

La constancia privada se obtiene con autenticación y puede imprimirse. Conserva
el JSON del servidor y el texto/versiones aceptados; no es confirmación de pago.
Los controladores invalidan datos, formularios y respuestas tardías al cambiar
sesión/empresa, renovar la consulta o salir. No persisten identificación en
localStorage/sessionStorage ni interpretan texto contractual como HTML.

## Solicitudes de soporte y derechos

`CustomerSupport.astro` y `lib/customer-support.ts` consumen
`/v1/me/legal-support/cases`. Sólo muestran casos de su principal y empresa.
Se puede registrar soporte, consulta de datos o reclamo, obtener constancia y
consultar historial/respuestas. Los plazos y festivos vienen del servidor; la
web no promete haber resuelto el caso, entregado correo o suprimido datos.

El contenido no debe incluir claves, tokens o adjuntos de identificación. Un
fallo conserva el intento para reintentar sin crear solicitudes duplicadas.
403/503 muestran orientación y canales públicos sin impedir el acceso permitido
al POS. Los derechos también se atienden por legal@cripton.com.co cuando no hay
sesión o suscripción pagada; la UI no sustituye ese canal.

## Publicación y evidencia

Publicar coordinadamente API, worker, Control y esta web; aplicar035/037 por la
cadena canónica y configurar/custodiar la clave independiente antes de adoptar
la cohorte. Publicar la web antes que una API compatible puede bloquear el paso
de contratación; no se añade un bypass cliente. El paquete `staging_qa` sólo
sirve para la simulación explícita, no para adoptar el contrato productivo.

Validación principal:438 pruebas de `test:web` registradas, incluidas las dos
suites nuevas, más Astro check y build. El agente comprobó también lectura de
las41 secciones del paquete QA de `bec4838`. Son pruebas de código/DOM/HTTP
simulados; la validación visual, envío real, Wompi Sandbox y POS siguen pendientes
de recuperar Codex Browser. Sin despliegue a staging en esta entrega.

El primer intento de `npm run check/build` desde el worktree no encontró el shim
`astro` de la instalación pnpm enlazada. Se ejecuta la entrada instalada con
Node24: `node node_modules/astro/bin/astro.mjs check` y `build`; no se reinstalan
dependencias ni se cambia el runtime del proyecto para ocultar ese fallo.
