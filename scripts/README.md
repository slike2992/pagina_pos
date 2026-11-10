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
- `signup-resume.test.mjs`: reapertura de un enlace consumido que aún tiene un
  checkout pendiente, errores no recuperables e integridad del retorno Wompi.
  Ejecuta el controlador real con DOM/transporte simulados; no acredita pago real.
- `account-payment-source.test.mjs`: 40 pruebas del helper Wompi y el controlador
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
- `audit-performance.mjs`: pesos de HTML, CSS, JavaScript y variantes hero AVIF.
  Valida selección responsiva y fallback; aplica presupuestos sin nuevas dependencias.
  Mide bytes de build/gzip teórico, no transferencias de red ni Web Vitals.

Usar Node >=22.12. `npm run build:public` ejecuta toda la cadena con el mismo
process.execPath. Las comprobaciones de navegador y sus límites se documentan
por bloque en docs. Mantener actualizados allowlist y baseline legal sólo cuando
corresponda; no cambiar pruebas para ocultar una regresión.
