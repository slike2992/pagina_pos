# Recuperación de períodos vencidos

La política aprobada conserva continuidad desde el vencimiento anterior. Cada
checkout compra un solo período consecutivo; la web no calcula sus fechas ni
prorratea importes. Un período pagado que todavía termina en el pasado no pone
la suscripción al día ni concede acceso al POS.

## Contrato y recorrido

Implementado con el contrato comunicado por Herschel y documentado en
`pos_saas/contracts/openapi/saas-api.yaml` (`SubscriptionRecoveryOffer`,
`CreateSubscriptionRecovery`, `SubscriptionRecoveryDetails`,
`SubscriptionRecoveryStatus`). Publicar primero API y el allowlist del proxy.

1. Mi cuenta conserva el login y la selección de empresa existentes. Para los
   roles owner/admin/billing y estados vencidos admitidos consulta
   `GET /v1/me/subscription/recovery` con Bearer. Es una oferta sin DML.
2. La oferta contiene `subscriptionId`, estado `available|pending_payment|blocked`,
   `blockReason`, `periodStart`, `periodEnd`, `amountMinor`, `currency`,
   `needsFurtherRecovery` y los identificadores/vencimiento del pendiente.
   Se muestran importe con centavos y fechas/horas en UTC, desde esa respuesta.
   Cancelación, pago pendiente, revisión financiera y cambio de plan bloquean
   una compra nueva según la respuesta del servidor.
3. «Preparar este pago» llama al POST existente
   `/v1/me/billing/checkout-sessions`, con Bearer, `Idempotency-Key` y:

   ```json
   { "type": "recovery", "subscriptionId": "UUID", "expectedPeriodStart": "ISO UTC de la oferta" }
   ```

   La respuesta existente incorpora `recovery` con los IDs y las fechas del
   período. La web comprueba que coincidan suscripción, inicio, final e importe
   con lo revisado y que la URL Wompi/retorno corresponda al checkout. El usuario
   abre Wompi mediante un segundo enlace explícito; preparar no navega ni cobra.
4. Un intento conserva su clave y snapshot ante fallos ambiguos. Se bloquean
   preparaciones simultáneas y duplicadas; actualizar la misma oferta conserva
   la clave. Sólo una nueva oferta del servidor con otro inicio abre el intento
   para el siguiente período. El backend reutiliza pendientes y protege las
   carreras entre pestañas; la memoria del navegador no reemplaza esa garantía.
5. El retorno consulta el GET público existente `/v1/checkout-sessions/:id`.
   Conserva el presupuesto compartido de diez consultas cada tres segundos,
   reintentos de red/429/5xx, consulta manual y cancelación al salir. `approved`
   espera aplicación; sólo `fulfilled` muestra el recibo del período aplicado.
6. `status.recovery` añade `coveredThrough`, `subscriptionStatus` y `tenantStatus`.
   Se usa cobertura actual, que puede incluir otros períodos ya pagados después
   de ese recibo. Si sigue vencida, el mensaje lo explica y enlaza a Mi cuenta
   para revisar el siguiente período. No aparece «Tu empresa está lista», enlace
   inicial de contraseña ni SSO automático para una recuperación.

La nueva ruta que necesita el proxy es GET/HEAD y su preflight OPTIONS exactos
para `/v1/me/subscription/recovery`. No se añade POST bajo esa ruta. Los POST
de billing conservan sus rutas; sus clientes de upgrade no cambian payload.
Este bloque no modifica Caddy, permisos, proveedor, precios ni reglas de SQL.

## Storage, autenticación y tarjeta

El ID en el retorno y los metadatos del servidor permiten consultar desde otra
pestaña, sin storage. En la pestaña de origen se guarda únicamente una marca
`cripton:recovery:<checkout UUID>=true`, sin importe, período, token ni URL.
Esa marca sólo impide volver al texto genérico de alta si faltan los metadatos;
nunca prueba pago ni habilita acceso. Storage bloqueado no interrumpe el flujo.
Una vez observado `recovery` en una consulta, no se acepta que desaparezca en
las siguientes para caer en el mensaje genérico de empresa lista.

Las respuestas de oferta/checkout de una sesión anterior se descartan. Cerrar
sesión retira enlaces y datos del intento de la vista; el servidor conserva
sus pendientes legítimos y sigue siendo autoridad del siguiente inicio.

La tarjeta puede gestionarse en `active`, `past_due`, `grace`, `restricted` y
`suspended`, con los roles ya admitidos por el backend y sin cancelación vigente.
Se conserva íntegro `wompi-client.ts`, carga lazy, retry y los tres consentimientos
independientes; registrar la tarjeta envía `recurringConsent: true`. La tarjeta
no es requisito para el checkout manual y registrarla no confirma recuperación.

## Acciones de Mi cuenta según estado confirmado

«Abrir POS» sólo queda disponible para una membresía de rol conocido y un tenant
`active` o `restricted`, como admite el SSO existente. Para `suspended`, `pending`
u otro estado no admitido se retira el enlace y se marca `aria-disabled`; el
handler también bloquea eventos programáticos y solicitudes duplicadas. Una
fecha vencida no introduce una denegación nueva en `grace` o `restricted`: las
limitaciones de acceso siguen siendo autoridad del backend.

Cancelar/reactivar conserva los roles owner/admin/billing y el estado de la
cancelación; requiere además un período válido `inicio <= ahora < fin`.
Períodos vencidos, futuros, incompletos o inválidos ocultan y deshabilitan ambas
acciones, también al confirmar un modal abierto antes del vencimiento. El atraso
se explica junto al estado, sin ofrecer cancelar un período que ya terminó.

Actualizar recovery relee la suscripción y `GET /v1/me/tenants` de la misma
sesión/empresa para no reutilizar el estado de tenant del login anterior al pago.
Las respuestas SSO/cancelación/reactivación de otra sesión o de una vista ya
reemplazada se ignoran. Estos controles son UX: no cambian permisos ni política
de acceso del servidor y no convierten un retorno de pago en acceso autorizado.

## Verificación local y límites

Con Node24, desde la raíz de esta web:

```sh
node --test scripts/account-payment-source.test.mjs scripts/payment-result.test.mjs
npm run check
```

Las pruebas ejecutan TypeScript/controladores reales transpilados, con DOM,
HTTP, SDK, storage y reloj simulados. Cubren los cuarenta casos originales de
SDK/consentimiento, gestión vencida de tarjeta, ofertas/bloqueos, importes y UTC,
URLs contradictorias, idempotencia, serialización, sesiones obsoletas, períodos
históricos pagados, cobertura posterior, metadatos ausentes y polling acotado.

`npm run test:web` incorpora esas suites. Las pruebas SEO adicionales requieren
un build completo en `dist` (o `WEB_AUDIT_DIR`). El entorno Windows compartido
tuvo un fallo previo de prerender Astro/cookie; no se cambian dependencias para
ocultarlo. La aceptación de navegador/SDK de `4c6729a` corresponde al prerequisito,
no certifica esta UI nueva. Este bloque no ejecuta DB, proveedor, navegador,
despliegue ni commit; quedan para el operador los gates de integración y reales.
