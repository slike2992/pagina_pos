# Recuperación de períodos y renovación rechazada

La política aprobada conserva continuidad desde el vencimiento anterior. Cada
checkout compra un solo período consecutivo; la web no calcula sus fechas ni
prorratea importes. Un período pagado que todavía termina en el pasado no pone
la suscripción al día ni concede acceso al POS.

## Próximo período rechazado con cobertura actual

`GET /v1/me/subscription` incorpora el campo **opcional y nullable**
`renewalIssue`. Ausente o `null` mantiene el recorrido anterior. Un objeto válido
contiene todos estos campos:

```ts
renewalIssue?: {
  subscriptionPeriodId: string; // UUID
  status: 'failed';
  paymentStatus: 'declined';
  periodStart: string; // ISO UTC con Z
  periodEnd: string;   // ISO UTC con Z, posterior al inicio
  amountMinor: number; // entero seguro positivo en centavos
  currency: 'COP';
  reference: string;   // no vacía, sin espacios exteriores ni controles
  recordedAt: string;  // ISO UTC con Z
} | null;
```

La web valida tipos, UUID, estados exactos, fechas reales, intervalo, importe,
moneda y referencia antes de aplicar la respuesta de suscripción. No convierte
fechas imposibles, cadenas numéricas o estados pendientes/ambiguos/aprobados en
un rechazo confirmado. En login, un detalle inválido impide abrir la cuenta; en
actualización conserva la vista confirmada y muestra error sin enlace de pago.
La misma validación se aplica a respuestas de cancelar/reactivar.

El aviso muestra importe con centavos, período y registro en UTC y referencia;
el estado y vencimiento de la cobertura actual permanecen en su resumen separado.
No amplía cobertura ni cambia permisos por observar un rechazo. Reutiliza los
estilos y la sección de recuperación: owner/admin/billing pueden consultar la
oferta también en `active` con `renewalIssue`, sin esperar al corte. Una oferta
`blocked/not_due` indica que la recuperación aún no está habilitada por el
servidor; los demás bloqueos conservan sus mensajes y nunca preparan checkout.
Una membresía de lectura puede ver el aviso sin adquirir permisos de billing.

La oferta habilitada debe coincidir en importe y fechas con el rechazo revisado;
el checkout debe conservar también referencia e ID de período. Se usa el mismo
GET de oferta y POST `/v1/me/billing/checkout-sessions` con
`{type:'recovery', subscriptionId, expectedPeriodStart}` y su idempotencia actual.
No se envía un importe nuevo ni se añaden endpoints. La API coordinada debe
recuperar **la misma orden** tras rechazo definitivo, incluso antes del corte,
y rechazar cualquier pago pendiente, ambiguo o con aprobación histórica. Estas
garantías financieras corresponden al backend; JavaScript sólo presenta su
oferta y comprueba coherencia de las respuestas.

Tras la aprobación y aplicación, una lectura autenticada con `renewalIssue: null`
retira el aviso y sus datos, actualiza cobertura y elimina enlaces anteriores.
El retorno de Wompi y registrar otra tarjeta no confirman ese cambio. Logout o
401 actual limpian también los detalles. Generaciones de login/recuperación y
guardas de sesión descartan HTTP, JSON y errores tardíos de otra sesión.

Publicar primero el contrato y la recuperación de la API; una API anterior que
omita el campo sigue siendo compatible y no muestra el aviso. El contrato HTTP
compartido se documenta en `pos_saas` por el integrador; este checkout sólo
modifica la web. Sin migraciones, nuevas dependencias o cambios de términos.

Evidencia local de este bloque (Node24.22.1): 104/104 pruebas de cuenta,
129/129 junto al retorno, 157/157 en las cinco suites de lógica; Astro check
sin errores, advertencias ni hints en 46 archivos. Build detenido en prerender
por `Named export 'parseCookie' not found` de `cookie`, incidencia ya descrita
abajo. No acredita HTML final/SEO, navegador autenticado, API/SQL, proveedor ni
despliegue. El padre realizará la aceptación de interfaz y revisará antes de
commit/push.

## Contrato y recorrido

Implementado con el contrato comunicado por Herschel y documentado en
`pos_saas/contracts/openapi/saas-api.yaml` (`SubscriptionRecoveryOffer`,
`CreateSubscriptionRecovery`, `SubscriptionRecoveryDetails`,
`SubscriptionRecoveryStatus`). Publicar primero API y el allowlist del proxy.

1. Mi cuenta conserva el login y la selección de empresa existentes. Para los
   roles owner/admin/billing y estados vencidos admitidos (o `active` con rechazo
   de renovación validado) consulta
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
