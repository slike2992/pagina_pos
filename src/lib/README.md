# Helpers de la web

`owner-onboarding.ts` sigue provisión y reenvío inicial con prueba acotada y
reloj servidor. `signup-phone.ts` normaliza teléfono nuevo sin dar consentimiento.
`customer-billing.ts` consulta sólo la sesión/empresa vigente: pagos aprobados,
PDF privado y preferencias versionadas. Limpia el estado al cambiar de identidad
y descarta respuestas tardías. No inicia cobros al abrir enlaces.

`seo.ts` contiene el origen y allowlist pública; no deriva canonical de una URL
privada. `analytics.ts` define consentimiento y eventos comerciales categóricos.

`form-feedback.ts` exporta `bindFormFeedback(form).validate(): boolean`.
El consumidor previene submit y consulta validate antes de su acción. El helper
activa noValidate sólo con JavaScript; el HTML conserva restricciones nativas.
No registra submit ni realiza fetch, almacenamiento o cambios de valor.

Los errores se insertan como `.field-error`, asociados por aria-describedby,
conservando descripciones previas. El primer inválido recibe foco al validar;
corregir en input/change retira el error sin mover foco. Reset limpia feedback.
Sólo se validan campos habilitados con willValidate. No reemplaza el servidor.

Ver `scripts/form-feedback.test.mjs` y el informe de calidad en docs.

`checkout-return.ts` valida el destino Wompi y su retorno al mismo origen antes
de añadir `checkoutSessionId` a una URL histórica que aún no lo incluya. No
modifica monto, referencia, firma, vencimiento ni el registro del servidor.
Rechaza destinos externos, identificadores duplicados o contradictorios. Los
checkouts nuevos ya incluyen el identificador desde la API.

`subscription-recovery.ts` valida la oferta, checkout y estado públicos de
recuperación contra el período revisado. Formatea centavos y fechas UTC sin
calcular períodos. Reutiliza la validación del retorno Wompi y guarda sólo una
marca opcional por UUID para impedir mensajes genéricos si faltan metadatos;
el servidor sigue acreditando pago, cobertura y acceso. Ver
[contrato y límites](../../docs/SUBSCRIPTION_RECOVERY.md).

`subscription-upgrade.ts` valida el `pendingChange` privado publicado por
`GET /v1/me/subscription` sólo para owner/admin/billing. Ausente/null conserva
compatibilidad; los empleados no lo consumen. `readPendingPlanChange` valida UUID,
plan destino, importe menor entero/moneda, fechas, orden/checkout opcionales,
estado y `nextAction`. Los estados `requested/quoted` sólo admiten `review`;
`pending_payment/scheduled/failed` se presentan según la acción del servidor.
`checkout` reanuda explícitamente; `requote` exige revisión/confirmación y una
solicitud con el código destino del pendiente. `wait_for_payment`,
`wait_for_activation`, `wait_for_period_end` y `review` no habilitan otro cobro.
Ver la tabla y el orden de despliegue [API primero, web después](../../README.md#cambio-de-plan-pendiente-y-retorno-de-pago).

Campos del DTO privado: `subscriptionChangeId`, `changeType`, `status`,
`toPlan:{code,name}`, `quote:{amountMinor,currency,expiresAt}`, `effectiveAt`,
`orderId`, `checkoutSessionId`, `orderStatus` y `nextAction`. Las fechas son ISO;
`quote.expiresAt` y los campos de orden/checkout admiten null. `orderStatus` admite
`pending_payment/paid/fulfilled/expired/cancelled` o null; ese campo aislado no
habilita cobro, siempre gobierna la acción canónica del servidor.

`readPlanChange` valida la respuesta de cotización; la página comprueba que su
destino coincida con el revisado. `readUpgradeCheckout` verifica vigencia, importe,
moneda, IDs de la misma orden/checkout cuando ya existen, origen Wompi y retorno
al sitio/checkout esperado. Devuelve la URL firmada original sin reconstruirla.
La API conserva la autoridad sobre historial, replay, vencimiento y cotización.
La página usa guardas antes del primer await, claves de idempotencia en memoria,
descarta callbacks de otra sesión y no persiste ni ingiere el pendiente desde
storage. Tampoco actualiza optimistamente el plan vigente. `recoveryAmount`
presenta sus centavos exactos; no calcula el precio ni el prorrateo.

`payment-result.ts` valida el recibo público y distingue `purpose` del servidor:
`signup`, `plan_change`, `renewal` o `unknown`. `planChange.status` admite
`requested/quoted/pending_payment/scheduled/applied/cancelled/failed`. Un pago
`approved` sigue pendiente de aplicación; `fulfilled` + `applied` confirma el
cambio, sin afirmar acceso ni activación fiscal. Rechazo/vencimiento de upgrade
dirigen a Mi cuenta. Sin contexto se muestra una vista neutra; no se deduce alta
desde URL o storage. El contexto conocido no puede desaparecer o convertirse en
registro en la siguiente consulta. Se conserva recovery y sólo un signup
identificado puede mostrar instrucciones de contraseña. Estos metadatos no
incluyen PII ni otorgan autenticación/cobertura.


## Retorno de POS y contraseñas — 17 noviembre 2026

`portal-return.ts` coordina el retorno a Mi cuenta con PKCE S256 y estado aleatorio.
Sólo guarda el verificador/estado/destino durante dos minutos en sessionStorage;
no persiste contraseñas, token POS ni Bearer. El ticket llega en fragmento, se
retira antes de consumirlo y no admite replay. Destinos nominales account/plans/
fiscal; la API revalida la identidad, empresa, rol y sesión POS originales. No
se comparte sesión con Control ni se eleva un empleado a administrador.

Requiere API Control033 y `/v1/auth/portal-sso/issue|redeem`, además del endpoint
POS `/auth/portal`. Publicar esta web antes o junto a ese runtime. El login normal
y la selección explícita de empresa conservan su contrato. Si falla el retorno,
se muestra error y se permite iniciar sesión; no se reintenta un ticket consumido.

`PasswordVisibility.astro` monta una sola vez `password-visibility.ts` en los
layouts de acceso. El botón es accesible, no envía el formulario, no copia el valor
y vuelve a ocultar al enviar, resetear o salir de la pestaña.
