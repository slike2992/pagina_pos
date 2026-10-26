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
