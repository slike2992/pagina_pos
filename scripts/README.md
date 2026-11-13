# Comprobaciones web

- `build-public.mjs`: tipos/build con indexación explícita, exclusión de copias
  generadas de experimentos y comprobaciones del artefacto. No despliega.
- `seo.test.mjs`: rutas, metadatos, enlaces, precios, contenido legal preservado
  y límites de medición. Lee dist o WEB_AUDIT_DIR.
- `consent.test.mjs`: ejecuta el cliente con un navegador simulado y sin cargar
  proveedores externos para probar permiso, rechazo y revocación.
- `form-feedback.test.mjs`: helper y controlador real de registro compilados
  con transporte local simulado; nunca registra cuentas reales.
- `payment-result.test.mjs`: retorno de pago con identificador en URL; staging
  no consulta rutas de desarrollo ni expone enlaces de clave en la respuesta.
  Comprueba también reintentos limitados de red/429/5xx, errores definitivos,
  concurrencia y salida de página, con temporizadores controlados.
  Recovery conserva esas esperas y distingue período aplicado de suscripción al
  día; cubre metadatos obligatorios, cobertura posterior y storage opcional.
  Incluye retorno de upgrade según `purpose`/`planChange.status`, sin guía de
  registro ni falsa activación, y validación de contexto entre consultas.
- `signup-resume.test.mjs`: reapertura de un enlace consumido que aún tiene un
  checkout pendiente, errores no recuperables e integridad del retorno Wompi.
  Ejecuta el controlador real con DOM/transporte simulados; no acredita pago real.
- `account-payment-source.test.mjs`: conserva las 40 pruebas del helper Wompi y el controlador
  completo de `cuenta.astro`, transpilados a JavaScript y ejecutados en VM con
  DOM, HTTP y reloj simulados. Cubre allowlist de scripts/atributos/claves,
  deduplicación, fallos, timeout y reintentos sin retirar scripts ajenos;
  inicialización por callback y errores síncronos/promesas; metadatos sin SDK
  antes de aceptar los dos contratos y la renovación recurrente; POST con
  `recurringConsent: true`, idempotencia, callbacks duplicados u obsoletos,
  recuperación del botón y reapertura del widget sin callback de cancelación.
  No carga JavaScript del proveedor ni envía solicitudes de red. No acredita
  tokenización, cobro, consentimiento persistido ni interacción real del overlay.
  Ejecución aislada: `node --test scripts/account-payment-source.test.mjs`.
  Añade gestión de tarjeta vencida y pruebas de contrato/UI de recovery: oferta
  del servidor, centavos/UTC, bloqueos, checkout validado, claves estables,
  períodos sucesivos y respuestas de autenticación obsoletas. Detalles en
  [recuperación](../docs/SUBSCRIPTION_RECOVERY.md).
- `account-plans.test.mjs`: catálogo publicado sin/con FE y controlador real de
  Mi cuenta con `pendingChange` del servidor. Cubre las seis acciones, Básico
  conservado hasta lectura confirmada, replay del mismo checkout, recotización
  explícita, requested/quoted sólo revisión, doble clic, claves estables tras
  fallo, respuestas de otra sesión y centavos cotizados exactos
  (`1989780` → `19.897,80 COP`). No consulta API ni proveedor reales.
- `audit-performance.mjs`: pesos de HTML, CSS, JavaScript y variantes hero AVIF.
  Valida selección responsiva y fallback; aplica presupuestos sin nuevas dependencias.
  Mide bytes de build/gzip teórico, no transferencias de red ni Web Vitals.

Usar Node >=22.12. `npm run build:public` ejecuta toda la cadena con el mismo
process.execPath. Las comprobaciones de navegador y sus límites se documentan
por bloque en docs. Mantener actualizados allowlist y baseline legal sólo cuando
corresponda; no cambiar pruebas para ocultar una regresión.

Validación local de este bloque, 2026-11-13: Node 24.22.1, **204/204** pruebas de
lógica (104 cuenta/payment-source, 38 account-plans, 34 payment-result y 28 de las
otras suites). La congelación anterior tenía 203; la prueba adicional comprueba
los centavos del prorrateo mostrado. Comando sin auditoría de HTML construido:

```sh
node --test scripts/consent.test.mjs scripts/form-feedback.test.mjs scripts/payment-result.test.mjs scripts/signup-resume.test.mjs scripts/account-payment-source.test.mjs scripts/account-plans.test.mjs
```

Estas pruebas usan VM/DOM/HTTP simulados y no acreditan replay SQL, pago real,
despliegue ni navegador. El build Ubuntu aislado y `seo.test.mjs` sobre su salida
quedan para el integrador; no se declara aún un total que incluya esos checks.
