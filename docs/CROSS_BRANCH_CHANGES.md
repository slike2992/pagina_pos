# Cambios transversales de la web comercial

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