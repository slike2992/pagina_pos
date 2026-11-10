# Cambios transversales de la web comercial

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
