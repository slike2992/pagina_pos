# Helpers de la web

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
