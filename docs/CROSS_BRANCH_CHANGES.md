# Cambios transversales de la web comercial

## 2026-11-10 — Publicación y aceptación externa de recuperación

- Web c90569e publicada en codex/staging-signup-recovery e integrada mediante
  fast-forward en codex/pagina-pos-landing, preservando trabajo local de marca.
  Activa en staging después del runtime compatible SaaS 53a51fc4fb0d.
- Build aislado Ubuntu: Node 24.22.2, lockfile congelado, 164/164 pruebas,
  Astro check/build y HTML/SEO aprobados. El fallo Windows de parseCookie
  anterior es del entorno de build; no se cambiaron dependencias para ocultarlo.
- En navegador: período fallido/importe/referencia visibles; rechazo oficial
  Sandbox y correo desde pagos; reintento aprobado con misma orden/checkout.
  Actualizar retiró aviso/enlaces y mostró Activo. Retorno antiguo reconoció
  la recuperación; login nuevo y SSO al mismo tenant abrieron Inicio del POS.
- SQL confirma una adopción, una aprobación y un período paid. Fuente local
  revoked/auto_renew=false, sin nuevos cargos recurrentes. Sin cambios de
  migraciones, dependencias, CSS, marca, legales o indexación de staging.
- Evidencia detallada: pos_saas/docs/QA_RENEWAL_CYCLE_2026-11-09.md. No acredita
  producción, QR Bre-B, fallo ambiguo externo ni todos los módulos del POS.
  Los apartados siguientes conservan la evidencia previa al despliegue.

## 2026-11-10 — Aviso y recuperación del próximo período rechazado

- Mi cuenta consume `renewalIssue?: {subscriptionPeriodId, status:'failed',
  paymentStatus:'declined', periodStart, periodEnd, amountMinor, currency:'COP',
  reference, recordedAt} | null` de GET `/v1/me/subscription`. Ausente/null
  conserva compatibilidad; UUID, tipos, estados, fechas UTC reales/intervalo,
  entero seguro positivo, moneda y referencia se validan antes de aplicar la
  respuesta. Un detalle malformado no se convierte en estado confirmado.
- El aviso separa el próximo período rechazado de la cobertura actual; muestra
  importe con centavos, fechas UTC y referencia, y guía a recuperación/soporte.
  Recuperación se consulta también en active con issue, con los roles existentes.
  `blocked/not_due` indica no habilitado por servidor; ningún bloqueo se elude.
- Oferta y checkout se contrastan con el rechazo revisado (importe, período,
  referencia e ID de período). Conserva GET/POST e idempotencia existentes, sin
  importe calculado ni endpoints nuevos. La API coordinada debe reutilizar la
  misma orden tras rechazo definitivo incluso antes del corte y bloquear
  pendientes/ambiguos/aprobados. No se decide ni confirma un pago en JavaScript.
- Actualizar con `renewalIssue: null` retira aviso/datos y enlaces anteriores;
  logout/401 actual también los limpian. Login, refresh y respuestas JSON/HTTP
  tardías conservan aislamiento mediante generaciones y guardas de sesión.
- Consumidores: portal web y API SaaS. Publicar primero API y su recuperación;
  el contrato compartido/root lo documenta el integrador. Sin migraciones,
  dependencias, CSS adicional, cambios de retorno de pago, términos o marca.
- Validación Node24.22.1: 104/104 pruebas de cuenta (13 nuevas), 129/129 junto
  al retorno y 157/157 de las cinco suites de lógica sin auditoría SEO. Astro
  check: 46 archivos, cero errores/advertencias/hints. Build detenido en
  prerender por `Named export 'parseCookie' not found` del módulo `cookie`,
  incidencia Windows ya documentada; HTML/SEO final sin validar. No se alteran
  dependencias para ocultarla. `git diff --check` aprobado.
- Pruebas con DOM/HTTP/SDK simulados; ver [contrato y recorrido](SUBSCRIPTION_RECOVERY.md).
  Aceptación con sesión en navegador, backend/proveedor y publicación quedan
  para el padre. Checkout aislado `artifacts/web-qa-recovery`, sin commit ni push.
  Coordinación root: control remoto intentado sin acceso; diagnóstico offline
  alineado y referencias web locales sin entrantes, sin certificar fetch nuevo.

## 2026-11-10 — Recuperación de checkout tras rechazo definitivo

- El retorno distingue «Consultar de nuevo» (sólo lectura) de intentar otro
  pago: indica abrir el enlace original de verificación del correo. No guarda
  tokens ni checkout con datos personales en el almacenamiento de retorno,
  ni crea una orden desde esa pantalla.
- Requiere la corrección coordinada de resume-checkout en pos_saas: permitir
  abandono sin pagos o sólo rechazos definitivos, conservar el mismo checkout
  vigente y bloquear pendientes/ambiguos y cualquier aprobación histórica.
  El endpoint, posesión del enlace y vencimientos se mantienen. Publicar y
  validar API antes de este estático; no se acredita aún el ensayo externo.
- Sin estilos, dependencias ni migraciones nuevas. Ubuntu: Astro check/build
  y 151/151 pruebas aprobados. Web bcdb16b publicada y activada después del
  runtime compatible ed0e7d1fb96a. El registro QA aún espera aceptación puntual
  de términos: no se acredita rechazo Wompi ni reintento externo por estos tests.

## 2026-11-10 — Actualización manual también para cuentas vigentes

- Mi cuenta mueve el botón nativo «Actualizar suscripción» a sus acciones
  generales, fuera de recovery. Reutiliza estilos, lectura autenticada de
  suscripción y `/v1/me/tenants`, validación de la empresa activa y guardas
  de token/generación. Fecha, estado y acciones se actualizan juntos después
  de ambas lecturas; un fallo previo conserva la vista confirmada.
- Progreso, resultado y error usan el status accesible visible de la cuenta.
  El botón deshabilitado y `aria-busy` acompañan la guarda de duplicados.
  Un 401 actual ejecuta el reset existente; respuestas/JSON/401 tardíos no
  cambian un login posterior ni restauran controles de otra sesión. Permite
  reintentar fallos GET sin recargar autenticación ni la página.
- Exclusión con operaciones en curso: renovar/cancelar, SSO, preparación de
  metadatos/SDK/POST de tarjeta y cotización/checkout de plan bloquean el
  refresco. Mientras éste lee, sus botones/confirmaciones y consentimientos
  quedan deshabilitados con guardas en handlers; no se ocultan por busy ni se
  añaden estilos. `finally` restaura controles sólo en la sesión vigente,
  conservando bloqueos previos de tarjeta ante resultados ambiguos.
- Un widget reabrible sin callback de cierre queda superado por el refresco:
  sus tokens tardíos no envían un POST y se puede abrir un intento nuevo.
  Las respuestas antiguas de cambio de plan tampoco continúan checkout ni
  liberan el bloqueo de un refresco posterior. Cancelar en vuelo conserva la
  identidad de cuenta hasta aplicar su respuesta y cerrar el modal.
- Consumidores: portal Mi cuenta y estático web. Compatible con las API
  actuales; sin rutas nuevas, polling, cambios de permisos, migraciones,
  llamadas al proveedor ni cobros. Recovery conserva su oferta e idempotencia.
- Validación Node24: 116/116 pruebas de cuenta y retorno de pago; Astro check
  sobre 46 archivos sin errores, advertencias ni hints. Los casos nuevos
  cubren ubicación/nombre accesible, cuenta vigente con nuevo fin/acciones,
  busy/duplicados, reset401, respuestas tardías y GET recuperable con reintento.
  Ocho casos adicionales con HTTP/SDK diferidos prueban exclusión en ambos
  sentidos, confirmación del modal, controles restaurados, reintentos y que
  una operación vieja no desbloquee la sesión nueva. No llaman al proveedor.
- Navegador local con Astro y HTTP sintético: cuenta activa actualiza el fin
  de enero a febrero2030, muestra éxito, conserva el resumen ante503, permite
  reintentar y vuelve al login/foco Correo ante401. SDK/proveedor deshabilitados;
  no acredita aceptación backend ni cargo real. Sin commit ni deploy. El ciclo
  UI de cancelar/reactivar y la evidencia backend continúan con el operador.
  Revisión de exclusión en navegador: GET retrasado mantiene visibles y
  deshabilitados plan, tarjeta, renovación y POS; al completarse recuperan su
  disponibilidad anterior. No se ejecuta el ciclo real de cancelación/cobro.

Cierre posterior de este bloque: commit 221c59b publicado y build aislado
Ubuntu con Node 24.22.2/pnpm 11.25.0, Astro check/build sin incidencias y suite
completa 151/151. Activado sólo dist en staging por enlace atómico, sin reiniciar
API, POS o worker. Navegador real con QA Recurrencia: progreso y bloqueo temporal,
«Suscripción actualizada», fin 10 de diciembre y cancelación preservados;
controles restaurados. SQL conserva un pago y una orden REN. Runtime 8ae78d53ca20,
cuatro servicios activos y edge HTTPS aprobado (21 variantes/26 preflights).
La evidencia local sintética anterior se distingue de esta aceptación real.
Informe compartido en pos_saas: docs/QA_RENEWAL_CYCLE_2026-11-09.md.
## 2026-11-10 — Recuperación con sesión vencida

- Seguimiento: una renovación anticipada ya pagada puede adelantar el inicio
  del período. Cancelar/reactivar exige intervalo válido y fin vigente, sin
  bloquear por inicio futuro: coincide con subscriptions.ts y conserva roles,
  estados y guardas del servidor. Caso nuevo cubre +2h, fin +mes y expiración.

- Un 401 de la sesión actual al releer suscripción, tenant, oferta o preparar
  checkout utiliza el mismo reset de Cerrar sesión. Limpia resumen, acciones,
  enlaces de pago y consentimientos, y presenta el login con un mensaje claro.
- Una respuesta tardía de una sesión anterior no cierra el acceso posterior.
  Errores 403 o temporales conservan la sesión y muestran el error existente.
- Sólo cambia Mi cuenta y sus pruebas; no altera rutas, tokens, almacenamiento,
  términos, precios, migraciones ni permisos. Casos nuevos verifican cada etapa,
  cadenas detenidas, ausencia de acciones con contexto vencido y login posterior.
  La construcción y aceptación desplegada se documentan en el repositorio SaaS.

## 2026-11-09 — Acciones de cuenta coherentes con estado y período

- Mi cuenta deshabilita «Abrir POS» para tenants fuera de active/restricted y
  roles fuera del contrato de membresía. Retira href, marca aria-disabled y
  conserva la guarda del handler contra eventos programáticos/duplicados.
  No deniega por fecha vencida los estados grace/restricted que el servidor
  permite; SSO y sus limitaciones siguen bajo autoridad del backend.
- Cancelar/reactivar conserva roles y estado de cancelación; sólo ofrece las
  acciones con período válido inicio <= ahora < fin. El handler vuelve a
  comprobarlo al confirmar. Se explica el atraso junto al estado de la cuenta.
- Actualizar recovery relee suscripción y la empresa activa mediante el GET
  existente /v1/me/tenants. No reutiliza estado/rol antiguo ni acepta otro tenant.
  SSO y cambios de renovación ignoran respuestas de otra sesión/vista.
- Consumidores: web Mi cuenta y despliegue estático. Sin contratos nuevos,
  migraciones, cambios de permisos, SDK, proveedor ni checkout. Pruebas VM de
  estados, roles, fechas límite, ARIA y respuestas obsoletas; aceptación Linux
  y navegador a cargo del operador. Ver [detalle](SUBSCRIPTION_RECOVERY.md).

## 2026-11-09 — Recuperación manual desde el vencimiento anterior

- Mi cuenta consume GET autenticado `/v1/me/subscription/recovery` y la variante
  `{type:'recovery',subscriptionId,expectedPeriodStart}` del POST existente de
  billing/checkout-sessions. Importes y períodos proceden del servidor. Reutiliza
  un pendiente y conserva idempotencia ante respuesta incierta; otro período
  requiere actualizar la oferta. No calcula fechas de cobro desde el nuevo pago.
- Retorno: GET público de checkout incorpora `recovery` y cobertura actual.
  Conserva polling acotado y espera `fulfilled`; un período aplicado que todavía
  acaba en pasado muestra deuda pendiente y Mi cuenta, sin empresa lista,
  contraseña inicial o SSO automático. Storage es opcional y no acredita pago.
- Tarjeta: muestra gestión en estados vencidos ya admitidos por API. Conserva
  helper Wompi, carga lazy, retry y los tres consentimientos del prerequisito.
- Consumidores: publicar API y GET/HEAD/OPTIONS exactos del proxy antes de web;
  los POST existentes y el payload de upgrade se conservan. Sin migraciones,
  reglas de proveedor, precios ni cambios de SDK en este bloque frontend.
- Pruebas de UI/contrato con DOM/HTTP/reloj simulados y Astro check. No equivalen
  a aceptación de navegador, DB, cobro ni despliegue. Ver [detalle](SUBSCRIPTION_RECOVERY.md).

## 2026-10-26 — Calidad de frontend y formularios

- Consumidores: web/registro y despliegue comercial. Se conservan contratos HTTP,
  payload, códigos de planes, aceptación jurídica e idempotencia de API. Sin SQL.
- Validador accesible compartido; errores españoles y bloqueo del registro hasta
  cargar catálogo legal. No envía datos por sí mismo ni modifica valores.
- Hero AVIF con fallback WebP y presupuestos de peso en build:public. El hosting
  debe servir todos los assets del build; no publicar sólo un HTML suelto.
- No cambia configuración de analítica, indexación o versión de condiciones.
- Evidencia y límites: [calidad](WEB_QUALITY_2026-10-26.md). No acredita pagos,
  entregabilidad, Web Vitals reales ni certificación integral de accesibilidad.

## 2026-10-26 — Descubrimiento, captación y preparación jurídica

- Repositorio: `pagina_pos`, bloque `codex/web-growth-legal` desde `ad3f8c6`.
- Consumidores: despliegue comercial, portal de registro/cuenta/pago y los chats
  que mantengan contratos de API, correo, suscripciones y condiciones del SaaS.
- Añade soluciones, guía, confianza y centro legal; header/footer compartidos y
  estilos de marca centralizados. Las URL de cuenta, API, SSO y códigos de plan
  se mantienen. No hay cambios HTTP del backend, permisos, datos ni migraciones.
- **Cambio de build:** la indexación pública ahora exige
  `PUBLIC_SITE_INDEXABLE=true`; usar `npm run build:public`. Preview/dev son
  noindex y el sitemap de preview está vacío. Los despliegues estáticos deben
  recibir el artefacto correcto, no solo cambiar variables después del build.
- GA4 requiere ID público, `PUBLIC_ANALYTICS_REVIEWED=true`, build público,
  consentimiento, origen HTTPS canónico y ruta editorial sin query; sin
  ID no se carga etiqueta. No inicializar seguimiento en cuenta, tokens o pago.
- Los artículos legales `2026-09-01` conservan contenido y versiones; la API
  sigue siendo autoridad del catálogo. Tres borradores separados no tienen
  vigencia ni producen aceptaciones. No actualizar hashes/filas de DB con el
  baseline del artículo fuente. La adopción requiere nueva cadena versionada y
  su propio cambio canónico, después de resolver datos y condiciones pendientes.
- Los importes mensuales/anuales se mantienen. Ahorros corregidos por aritmética;
  «Más elegido» pasa a recomendación editorial y se retira el cargo de arranque
  de $150.000 no respaldado por el catálogo de referencia.
- Validación y límites: [QA](QA_WEB_GROWTH_2026-10-26.md). No acredita despliegue,
  indexación, audiencia conseguida, cobro real o dictamen jurídico.

La coordinación del producto SaaS sigue en
`pos_saas/docs/CROSS_BRANCH_COORDINATION.md`; su base es
`feature/saas-foundation`. Este repositorio web tiene historial independiente.

Compatibilidad con el plan de staging/marketing de `pos_saas` (base `adbde04`):
no se anuncian cobros Bre-B ni entrega productiva acreditada. No se crea otro
checkout. Las URL con query no inicializan esta analítica; coordinar una política
de campañas UTM revisada antes de instrumentar atribución, sin datos personales.
Para poner en vigencia los textos nuevos aún faltan decisiones y publicación
versionada del control SaaS; los tres borradores no cambian la aceptación actual.
