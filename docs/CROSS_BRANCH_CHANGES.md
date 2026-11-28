# Cambios transversales de la web comercial

## 2026-11-28 — Recuperación de intento Nequi al contratar la prueba

- Mi cuenta consume opcionalmente `trial.payment` del servidor:checkoutSessionId,
  referencia,estado público y vencimiento. Ausencia/null conserva APIs anteriores;
  contenido inválido falla cerrado. Esta vista no autoriza un nuevo pago.
- El representante ve Consultar este pago,Actualizar estado del pago y Reintentar
  pago en Wompi según el resultado. Reutiliza el POSTtrial-checkout,contrato,
  sesión y suscripción activos; jamás envía importe/tenant arbitrario ni cobra
  desde el retorno. Confirmado bloquea otro checkout también en el controlador.
- Volver de Wompi mediante Atrás/BFCache actualiza la cuenta y desbloquea el botón
  que permanecía ocupado tras navegar. Una respuesta perdida conserva la clave;
  volver de la navegación o actualizar un enlace vencido permite nueva clave,
  con las guardas de historial/idempotencia de la API aún obligatorias.
- Resultado de contratación fallida/vencida ofrece Volver a intentar desde Mi
  cuenta; no manda al usuario a repetir registro,verificación o contraseña.
- Sin estilos,SQL,documentos legales o cambios de otros módulos. API debe publicar
  la recuperación certificada de ERROR antes de activar este corte coordinado.
- Check limpio,buildstaging32 páginas,web737/737 (ocho casos nuevos). Navegador y
  proveedor se registran después de publicar; esta prueba local no los acredita.

### Publicación y aceptación externa del mismo corte

Web `1f61a5505e85` y runtime SaaS `aac06653f57f` publicados en staging. Check y
build Linux correctos; manifiesto de 89 archivos verificado. Codex reprodujo y
cerró la orden Nequi original, de $79.900 COP: ERROR → reabrir después de más de
45 minutos → DECLINED → volver a Mi cuenta → reabrir → APPROVED → Plan contratado.
Se conservaron referencia, checkout vigente, contraseña, empresa y aceptación
contractual anterior. Mi cuenta mostró un soporte, el período pagado y el botón
de reintento oculto; SSO abrió Facturar. No se activó renovación automática.

Contraste de sólo lectura: tres pagos históricos intactos, uno aprobado, un
checkout, un período y una conversión. La prueba original termina el 13 de
diciembre de 2026 y el período pagado el 13 de enero de 2027; no se perdieron los
días gratis. Los tres webhooks test tienen firma válida y están procesados.
Correo de confirmación published en outbox; no nueva inspección de bandeja.

Hubo DNS intermitente del navegador hacia Wompi; una pestaña nueva con el mismo
checkout permitió continuar sin modificar red ni protecciones. Atrás/BFCache
queda respaldado por la regresión automatizada, no por ese cambio de pestaña.
La aprobación se confirmó al actualizar después del webhook, no desde el retorno.
Sólo contratación de prueba y Sandbox: no certifica producción ni otros flujos.
Evidencia completa en SaaS: `docs/QA_NEQUI_RECOVERY_2026-11-28.md`.


### Corte publicado28/nov01:44:05 Colombia

Weba226399/runtime9b719ab,89 archivos de manifiesto,check/buildLinux aprobados.
Catálogo28 adoptado por operador privado con ensayo y replay;históricos intactos.
Codex comprobó teléfono obligatorio,enlaces/ANS/textos y Mi cuenta existente sin
reaceptar. No nueva cuenta,pago o correo. SQL13/36,soporte39,release94,web729.
[Alcance y límites](LEGAL_SLA_2026-11-28.md#publicación-y-navegador--corte-posterior-de-integración).


## 2026-11-28 — SLA/ANS público derivado del contrato canónico

- Copias exactas de `staging-minimum-2026-11-28.json` y
  `signup-minimum-qa-2026-11-28.json`, protegidas por `.gitattributes -text`.
  Digests canónicos fijados y visibles: contrato
  `9190257110fcc6112dbf9d7cec992ec1faf815dfd4733b0040824d71f0e4abfb`;
  registro `69364980e64abaa00d281f7f4ce9d04828ea5b433c037620c5981201a5627467`.
- Selector `2026-11-28-prueba-minima-qa` exclusivo del origen HTTPS staging.
  Términos/privacidad de registro nuevos y tres documentos contractuales completos
  en sus rutas versionadas. SLA independiente en
  `/legal/versiones/2026-11-28-minimo-qa/sla/`, derivado sólo de las siete
  secciones canónicas de soporte/ANS de términos, sin reescribirlas ni duplicar
  un calendario. Primera respuesta humana: un día hábil de diez horas,
  lunes a viernes08–18 Colombia, excluidos festivos nacionales. Mantiene
  ejemplos, separación de resolución/urgencias legales y ausencia de soporte24/7.
- Centro legal, pie, sección de soporte de términos del registro28 y documentos
  afines enlazan el SLA. Éste enlaza términos íntegros, privacidad y anexo.
  Mismo EditorialLayout/marca/estilos, noindex y huellas de documento/paquete;
  la vista SLA identifica el hash de términos completos, sin crear otro documento.
- Consumidores: registro y lectura previa del contrato por empresa de API SaaS.
  Sin cambios HTTP, permisos, SQL, aceptación, UI de teléfono o calendario.
  Tres documentos/cinco casillas; paquetes/rutas anteriores preservados. Las
  fuentes28 definitivas corrigen las menciones opcionales del teléfono en ambas
  políticas de privacidad y el título de elecciones del registro. El teléfono
  obligatorio no implica publicidad ni mensajes automáticos por WhatsApp.
- QA final Node24.22.3: check87 sin errores/advertencias/hints, build32 páginas,
  729/729 pruebas aprobadas, incluidas las regresiones legales de las fuentes
  definitivas. Fetch web previo al commit: base8b94839 sin entrantes; gate SaaS
  remoto alineado sobre df3fa8d. Evidencia: [informe](LEGAL_SLA_2026-11-28.md).
  Build Linux, navegador,
  publicación y adopción a cargo del integrador. Esta preparación no registra
  aceptaciones28 ni adopta condiciones productivas.

## 2026-11-27 — Revisión de dirección sin reemplazar documentos adoptados

- Copias exactas de `signup-minimum-qa-2026-11-27.json` y
  `staging-minimum-2026-11-27.json` entregadas desde SaaS. Sólo dirección
  `Cl 78 C 130 55` y referencias internas de fecha/versión del27 respecto al25.
  Paquetes, rutas y fuentes anteriores intactos; no se escriben aceptaciones.
- Nuevo selector explícito `PUBLIC_REGISTRATION_LEGAL_VERSION=2026-11-27-prueba-minima-qa`
  exclusivo del origen HTTPS de staging. Publica términos/privacidad nuevos en
  `/legal/versiones/2026-11-27-prueba-minima-qa/` y reutiliza los enlaces centrales
  de pie, centro legal, cookies y ConsentPanel. Sin selector permanece09-01;
  las rutas QA viejas y nuevas siguen generándose en staging.
- Consumidores: catálogo de registro API y contrato por empresa/SSO/primer pago.
  API debe preservar la compatibilidad exacta por digest del paquete mínimo25;
  el operador de adopción SaaS controla los cortes y la nueva política. Esta web
  no aplica SQL, publica catálogos ni cambia el control de acceso.
- El borrador24 sigue `review-only`: se corrige la misma dirección en su fuente
  y se regeneran sus tres PDF y manifiesto, sin modificar `docs/legal/history`.
- QA local con Node24.22.3/pnpm11.25.0: Astro check81 sin incidencias, build26
  páginas y724/724 pruebas aprobadas, incluidas18 legales. JSON exactos/digest27
  comprobados;22 páginas PDF renderizadas y revisadas. Gate remoto previo al
  commit correcto sobre SaaS981649d, sin entrantes. Pruebas y límites en
  [informe de la revisión](LEGAL_ADDRESS_REVISION_2026-11-27.md).
  El integrador publicó runtime2f1604259946 y webbd6ac161b6e8 en staging;
  Linux check/build26 correctos. Catálogo y contrato adoptados el28/nov00:08:29
  Colombia con huellas y cohortes anteriores intactas. Codex confirmó dirección
  corta en ambos textos, catálogo/API27 en registro y enlaces de cookies/pie.
  Sin nuevas aceptaciones, registros, pagos o correos; producción intacta.

## 2026-11-27 — Acuerdo antes de preparar renovación o recuperación

- La prueba real encontró que preparar una renovación sin contrato sólo mostraba
  el rechazo correcto de la API. Mi cuenta abre ahora el mismo diálogo contractual
  antes del POST y, después de aceptar, continúa exclusivamente la acción elegida:
  conversión de prueba o renovación/recuperación del período revisado.
- Conserva token, sesión, empresa, suscripción, generación de oferta, referencia
  rechazada, validación de importe/fechas e idempotencia. Cancelar el diálogo,
  actualizar la oferta, salir o cambiar de sesión no ejecuta una acción anterior.
  Aceptar no paga ni registra tarjeta; sólo prepara el checkout para su revisión.
- Contrato HTTP, versiones legales, aceptaciones, SQL, POS y Control no cambian.
  Compatible con la API staging publicada. Regresiones con el diálogo y controlador
  reales; despliegue y aceptación del resultado se registran en el informe SaaS.

## 2026-11-27 — Alta secuencial y comunicaciones de cobro

- Registro exige teléfono E.164 válido para altas nuevas, sin consentimiento
  WhatsApp implícito. API conserva replay histórico. Después de verificar, la
  pantalla sigue la preparación real del POS y distingue clave inicial y acceso
  ya existente; no dispara restablecimientos por crear otra empresa.
- Reenvío de clave inicial por `/v1/owner-onboarding/resend-password-setup`,
  prueba opaca e idempotencia, con cooldown60s del servidor. Sin token en logs ni
  datos de otras empresas. Mensajes y botones reflejan el paso vigente.
- Mi cuenta muestra pagos aprobados, soporte PDF autenticado e imprimible y
  limitación de históricos sin evidencia. Paginación privada y detalle desde
  enlace de correo. El tenant de URL es sólo pista, validada por membresía en
  API. Bearer sólo en cabecera; nunca en enlace o almacenamiento persistente.
- Preferencias versionadas de recordatorios de pago y autorización WhatsApp
  separada. No afectan correo de seguridad ni soporte aprobado. Respuestas
  tardías no alteran otra sesión. Controles reutilizan estilos de FlowLayout.
- Renovación manual anticipada consulta la oferta de API y conserva los
  bloqueos de pago pendiente/ambiguo y las fechas ya cubiertas. Abrir un enlace
  no cobra. Requiere publicación coordinada de API/worker/Control041/edge.
- Validación de código: web714/714, helper de billing y Astro sin incidencias;
  build correcto. SQL/proveedores/Gmail/Codex y despliegue se documentan después
  del recorrido en staging; esta entrada no los acredita todavía.

## 2026-11-26 — Oferta contractual clara antes de aceptar

- CUA del cliente nuevo mostró un permiso de reporte como «Facturacion
  electronica: Incluido» junto a la emisión no incluida, y una cuota electrónica
  cero como incluida. La proyección identifica `reports.*.read` como reportes y
  muestra las cuotas habilitadas de cero como «Sin capacidad incluida».
- El importe se identifica como total del plan. Para `taxBehavior=unspecified`
  se explica que no hay desglose ni recargo tributario en este checkout. Código
  canónico confirma amountMinor=total, tax_minor=0 y rechazo de exclusive o
  implementación distinta de cero. No se afirma IVA incluido, tarifa cero o
  exención del proveedor. Inclusive/exclusive históricos conservan su descripción.
- Sólo presentación y pruebas: no se modifica JSON, huella, aceptación, catálogo,
  precio, permiso ni documento público. Se conserva el mismo render para la
  constancia histórica y sus datos íntegros. Consumidores: acuerdo y recibo de
  Mi cuenta; sin contrato HTTP ni SQL nuevos. QA web668, Astro check y build24
  correctos; validación del resultado publicado en CUA pendiente de despliegue.

## 2026-11-26 — Abrir solicitudes y constancias desde su correo

- CUA confirmó que el enlace recibido conservaba `case`, pero Mi cuenta sólo
  mostraba la lista. Ahora un único UUID `case` o `contract` solicita su detalle
  después de autenticarse y seleccionar la empresa. Un caso fuera de la primera
  página se consulta por su ruta privada, sin búsqueda global de empresas.
- No acepta parámetros duplicados, ambiguos o rutas. Conserva comprobaciones
  de caso/constancia, tenant, principal, rol y generación de sesión; una respuesta
  tardía no cambia de propietario. No acepta contratos ni genera pagos, SSO,
  solicitudes o datos persistentes por abrir un enlace. Los errores se reintentan
  sólo por acción explícita y un enlace usado no reabre el diálogo al actualizar.
- Sin contrato HTTP, SQL, permiso o documento público nuevo. Compatible con
  las rutas privadas existentes de API/Control.664 pruebas web completas,
  185 enfocadas sobre el diff final, Astro check limpio y build24 páginas.
  Despliegue y nueva validación CUA se acreditan por separado.

## 2026-11-25 — Mensajes públicos de red y eventos de soporte040

- Login, contrato/constancia, checkout de prueba y soporte muestran mensajes
  españoles ante fallos de red/JSON, conservando errores API conocidos y
  validaciones propias, sin exponer mensajes arbitrarios de transporte.
- Resultados inciertos conservan texto y claves para reintento manual;
  no confirman recepción/aceptación ni provocan reenvíos o pagos automáticos.
- El cliente acepta transferred y claim_annotated como «Declaración de traslado
  registrada» y «Declaración de anotación registrada». Omite procedureProof
  no expuesto; mantiene validación y aislamiento por caso, empresa y principal.
- Sin cambios HTTP, SQL, permisos ni paquetes adoptados. Validación local con
  instalación frozen aislada:275 pruebas específicas,618 completas, Astro
  check73 sin errores/advertencias/hints y build24 páginas. CUA posterior
  sobre el dominio queda a cargo de Main; no se presume por estos tests.

## 2026-11-25 — Encargo previo al POS y documentos mínimos de staging

- Consumidor de API/Control039: GET existente `customer-contract` incorpora
  `operationalAccess` y `canAccept`. «Abrir POS» consulta sin caché; representante
  acepta por POST existente, relee el estado y sólo entonces solicita SSO. No
  inicia checkout en esa intención. Miembros consultan estado y reciben guía;
  datos operativos ausentes/inválidos o errores bloquean SSO sin cerrar Mi cuenta.
  Publicar coordinadamente la API compatible y la web; la API/POS aplican el gate.
- El contrato comercial conserva su intención separada y `trial.canConvert`;
  compra habilitada desde el primer minuto y días2/4, conservando el saldo gratis.
  Se muestran las subsecciones completas del paquete, incluidas las de proveedores.
  Tokens/datos declarados en memoria; cambio de sesión/empresa invalida respuestas.
- Dos packets copiados exactamente desde SaaS en `contracts/legal`: acuerdo
  2026-11-25-minimo-qa y registro2026-11-25-prueba-minima-qa. Nuevo selector/rutas
  de registro sólo en HTTPS staging. Pie, centro, cookies y ConsentPanel comparten
  privacidad seleccionada; aviso de cookies2026-11-23 conserva su decisión propia.
  Documentos/rutas anteriores intactos. Sin modificar esquema ni adoptar políticas
  desde web; main coordina migración/publicación/adopción y CROSS SaaS.
- Plazos30/90 desde terminación registrada;90 días habilita revisión y depuración
  manual controlada. Objetivo SQL de siete días condicional a custodia/restauración,
  sin prometer un máximo universal ni ejecución por pulsar un botón.
- Validación final Windows/Node24.22.3: instalación frozen aislada pnpm11.25.0,
  check73 archivos con0 errores/advertencias/hints, build24 páginas y588/588 pruebas.
  Evidencia/copia exacta en README. Sin commit de Brand/demo, CUA, SQL, proveedores,
  deploy ni nuevas aceptaciones legales; main acredita publicación y recorrido real.

## 2026-11-25 — Publicación coordinada y páginas contrastadas en Codex Browser

- Main activó web7663c68/SaaS6f004c4;77 archivos web verificados y fuente
  registrada en la recuperación existente. Catálogo2026-11-25-prueba-qa adoptado
 22:48:09.636Z. Política035 y aceptaciones históricas conservan huella agregada.
- Ubuntu limpio:37 específicos, Astro check0 y build22p. CUA real abrió registro,
  términos/privacidad con versión y hashes concordantes. No nueva cuenta, correo,
  contrato o pago aún: falta la aceptación puntual requerida por el navegador.
- Diferencia EOL en fuente SaaS/web reconciliada por igualdad completa del JSON y
  huella canónica, conservando los hashes de ambos artefactos. Sin editar09-01,
  producción, POS, Control, DNS o recursos nuevos. Ver SIGNUP_TRIAL_QA_2026-11-25.md
  y el informe/evidencia homónimos en pos_saas. Versiones documentales posteriores
  no cambian el commit del estático servido ni requieren otro despliegue.

## 2026-11-25 — Tipos Node declarados y recuperación de aceptación vencida

- Sobre135c594: `@types/node` pasa a devDependency explícita `^22.15.30`;
  pnpm11.25.0 actualiza el lock a22.20.5 y sus peers. Corrige el TS2591 de
  `node:crypto` detectado por main en Ubuntu limpio, sin ambient any ni ignores.
- Registro consume exclusivamente HTTP409 `signup_legal_acceptance_stale`
  de la API6f004c4 para invalidar intento/clave/acceptedAt, desmarcar aceptación
  y recargar el catálogo con `cache: no-store`. Conserva campos, presenta el
  mensaje del servidor (incluida fecha/hora) como texto y exige aceptación manual.
  Sin submit automático. Fallo de catálogo bloquea continuar; red, respuesta
  ambigua,5xx y conflictos ajenos conservan la clave/cuerpo originales.
- Portabilidad de pruebas: LF explícito sólo para el packet QA, cuyo SHA256 no
  cambia; archivos históricos mantienen hashes de bytes. La comparación de las
  fuentes09-01 admite exclusivamente la conversión EOL del checkout, siguiendo
  `legal-review.test.mjs`. No se editan fuentes legales ni archivos históricos.
- Validación local Windows/Node24.22.3: instalación aislada sin junction con
  pnpm11.25.0 `--frozen-lockfile`,37/37 pruebas específicas (31 cliente y6 rutas),
  Astro check71 archivos con0 errores/advertencias/hints. No se repite la suite
  completa. Main debe acreditar el nuevo build Ubuntu; sin commit/deploy propios.
- Sin migraciones ni cambio de catálogo, versiones, pagos o verificación de
  correo. Detalles/comandos y límites: `SIGNUP_TRIAL_QA_2026-11-25.md`.

## 2026-11-25 — Documentos inmutables para registro de prueba QA en staging

- Copia exacta de `pos_saas/contracts/legal/signup-trial-qa-2026-11-25.json`,
  versión2026-11-25-prueba-qa y scope staging_trial_qa; dos rutas estáticas bajo
  `/legal/versiones/2026-11-25-prueba-qa/` con términos/privacidad del packet,
  secciones completas y SHA256 de documento canónico compatible con contractDigest.
- Opt-in PUBLIC_REGISTRATION_LEGAL_VERSION sólo para el host HTTPS staging exacto.
  Pie y centro legal seleccionan esa versión; ausencia conserva09-01. Las rutas
  versionadas se mantienen en staging al retirar el selector; producción no las
  genera y rechaza el opt-in QA. Noindex/canonical/sitemap conservan su política.
- Consumidores: enlaces informativos y URLs del catálogo de signup SaaS. Sin nuevo
  HTTP ni cambio de registro, pagos, demo, planes, POS o admin. Main coordina
  publicación/adopción SQL y deploy. No se adoptan los borradores de39 apartados.
- Validación local:542/542 pruebas, Astro check0 errores/advertencias/hints y
  builds de defaults/QA correctos, con rechazo de QA sobre origen productivo.
- Términos/privacidad y archivo09-01 preservados byte por byte. Brand.astro y
  pago/demo.astro ajenos no se incorporan. Pruebas del bloque cubren snapshots,
  builds reales de variantes, huellas,15d, consultas y rechazo fuera de staging;
  alcance/operación: `SIGNUP_TRIAL_QA_2026-11-25.md`. Navegador/adopción/deploy
  corresponden al integrador; este bloque no los ejecuta.

## 2026-11-25 — Subsanación de reclamos propios

- Consumidor de pos_saas@17b2dee y Control038. Usa únicamente POST autenticado
  `/v1/me/legal-support/cases/:caseId/completion`, versión e Idempotency-Key;
  conserva borrador ante fallo/conflicto y obliga revisar el estado más reciente.
- Requerimiento, subsanación y cierre conservan recibo original. El plazo es de
  dos meses desde la notificación; la fecha mínima interna no aparece como un
  vencimiento definitivo. El navegador no calcula ni reinicia plazos legales.
- notificationProof opcional se presenta como declaración del operador, con
  fecha/referencia en texto seguro; no acredita entrega independiente ni abre
  enlaces aportados. Cierre no borra datos ni impide presentar otro reclamo.
- Compatibilidad con casos anteriores sin claimCompletion. Se preservan sesión,
  empresa activa, permisos, contratación, pagos y POS. Sin adjuntos de identidad.
- 536 pruebas web aprobadas, incluyendo73 de soporte, Astro check/build correctos.
  DOM y HTTP sintéticos; CUA, recepción real y dominio aún pendientes del bloqueo
  Windows1920. No despliegue ni adopción de condiciones productivas.


## 2026-11-25 — Contratación por empresa y seguimiento de solicitudes

- Consumidor de `pos_saas@bec4838`: GET/POST customer-contract, recibo privado y
  casos propios legal-support. API aplica la autoridad; la web no confirma pagos,
  habilitación DIAN o identidad oficial. No cambia registro, marketing o cookies.
- Reutiliza sesión de Mi cuenta, SSO, Wompi y prueba15d. Carga sólo datos declarados
  sin adjuntar identificación. Cinco consentimientos sin preselección; renovación
  recurrente permanece en su flujo independiente. JSON/constancia imprimible.
- Requiere publicación coordinada y Control035/037; no activa una versión por sí
  sola. Política inactiva/package null conserva compatibilidad; un fallo del paso
  no se convierte en aceptación ni deshabilita el acceso permitido al POS.
- Soporte/consultas/reclamos con constancia/plazos del servidor. Principal y
  tenant comprobados al leer respuestas; no comparte permisos de Control.
- No se modifican Brand.astro ni pago/demo.astro que estaban pendientes en el
  checkout principal. Nueva evidencia, límites y operación en
  `CUSTOMER_CONTRACTS_2026-11-25.md`.
- test:web438 aprobadas. Astro check/build por CLI instalado; navegador real y
  bandeja aún pendientes de reparación Windows1920. Sin despliegue ni aceptación
  productiva, con versiones/aceptaciones anteriores conservadas.

## 2026-11-24 — Tres documentos jurídicos y coherencia fiscal

- Revisión preparada de términos, privacidad y anexo de transmisión, a partir
  de 2026-10-26. Identidad de proveedor natural comprobada y condiciones de soporte,
  cancelación y salida aprobadas por el titular; no se activan sin verificar
  mecanismos. JSON único compartido por preview y tres PDF versionados.
- Historial inmutable con SHA256 de fuentes antiguas y baseline activo intacto;
  no modifica el catálogo API, consentimientos, migraciones o registro. El preview
  conserva noindex y protección frente a un release indexable. Sin vigencia.
- Consumidores: web/editorial FE y revisión coordinada en POS Ayuda, Control y
  correos de pago/renovación. Cliente cumple deber fiscal; Cripton su integración
  y controles. Interno/Sandbox no equivalen a emisión productiva.
- Compatibilidad: no cambia HTTP, precios, plan, pagos, consentimiento recurrente
  ni autenticación. No se toca Brand ni el checkout demo modificados por el usuario.
- Validación: 276 pruebas web, Astro check/build aprobados; tres PDF/22 páginas
  revisados y 152 párrafos/elementos cotejados. Preview HTTP local200/noindex.
  El navegador Codex falla antes de conectar (CreateProcessWithLogonW1920);
  revisión interactiva pendiente. No se despliega al dominio en este bloque.
- Pendientes reales y fuentes: `LEGAL_REVIEW_2026-11-24.md`. No se ofrece
  inmunidad frente a errores propios ni certificación jurídica/productiva.

## 2026-11-23 — Transparencia de cookies y preferencias por finalidad

- El aviso informativo y el acceso «Cookies y privacidad» se presentan en las
  rutas editoriales también sin GA4, en local y staging. Sin proveedor solo
  permiten confirmar almacenamiento necesario; no simulan aceptar seguimiento.
- Se conserva el bloqueo de GA4 fuera del origen canónico, con query, en rutas
  privadas y sin revisión/ID/flag público. Analítica requiere aceptación expresa;
  GPC/DNT prevalecen. No se configura un proveedor ni se habilita medición real.
- Preferencia local v2: decisión, fecha, vencimiento de 180 días, versión del
  aviso y alcance del proveedor. No reutiliza autorizaciones anteriores ni las
  de un proveedor distinto. Retirada y borrado entre pestañas detienen medición;
  el rechazo no borra datos de registro/pago y funciona con storage bloqueado.
- Consumidores: componentes compartidos de la web y página informativa de cookies.
  Se conserva el contrato HTTP, catálogo, 15 días gratis, autenticación, POS y
  Control; sin SQL ni migraciones. Los textos y hashes legales aceptados de
  términos/privacidad permanecen vigentes e intactos. No es una nueva aceptación
  contractual. El panel guarda un recibo local, no un registro central firmado.
- Validación y límites: `QA_COOKIES_2026-11-23.md`. Antes de habilitar GA4 real
  sigue siendo necesaria la revisión del proveedor, propiedad, retención y
  tratamientos/transferencias correspondientes. Los flags continúan apagados.
- Cierre: 272 pruebas y check/build aprobados; publicación estática final
  `dda2d55d639f` en staging, 75 archivos verificados, sin reiniciar POS/Control.
  Navegador en escritorio/móvil: persistencia, reapertura, scroll/guardado y
  política correctos; selector de títulos aislado tras revisar el build real.

## 2026-11-17 — Índice informativo legal sin oferta de demostración

- Resuelve el pendiente comercial del bloque anterior con autorización expresa:
  sólo la frase orientativa de /legal/ cambia a prueba gratis de 15 días sin
  tarjeta y planes de pago. No modifica documentos, versiones legales, textos
  vinculantes ni enlaces de aceptación/privacidad. No requiere versionar legales.
- Consumidores: personas que consultan los canales de ayuda y ventas. Sin cambios
  HTTP/tipos, API, worker, SQL, permisos, runtime o checkout; sin migración ni
  orden adicional de publicación. Brand.astro y pago/demo.astro ajenos intactos.
- La auditoría semántica de HTML/SEO/JSON-LD sin demo cubre ahora todas las rutas
  públicas, incluido el centro legal. Nueva regresión verifica su frase, canales,
  enlaces documentales y versiones. Continúan los hashes de documentos aceptados.
  Check/build y 265/265 pruebas locales en exportación limpia con Node24/pnpm11,
  env staging noindex; bundle Linux final preparado, sin SSH/UI ni despliegue.

## 2026-11-17 — Oferta pública única: 15 días gratis, sin tarjeta

- Sustituye ofertas comerciales de demo por prueba gratis de 15 días: portada,
  soluciones, guía, confianza, navegación/pie, metadatos, JSON-LD y mensaje
  preparado de WhatsApp/correo. Continuar después requiere un plan de pago;
  expresa el límite como una prueba por cuenta elegible, sin afirmar detección
  de una persona entre alias. No promete gratuidad permanente ni repetición
  ilimitada de pruebas.
- Consumidores: API de registro/verificación y worker de correo, cuya política
  de signup y protección contra abuso pertenecen al integrador. Sin cambios
  HTTP/tipos, SQL, permisos, catálogo/precios, sesión, checkout legacy o flags
  internos. Sin migración. El integrador habilita el modo público con
  CUSTOMER_SIGNUP_PUBLIC_SINCE una sola vez en backend; no cambia rutas API.
  Coordinar la publicación con esa política.
- CTA de alta conservan /registro y los seis códigos de plan; sin nuevas rutas
  públicas/canónicas. La página de pago local se conserva en astro dev; el hook
  de producción publica en /pago/demo sólo una redirección fija al registro,
  sin parámetros ni controlador local, también en staging noindex. Mantiene
  pagos Sandbox/pruebas y local_demo; no son una oferta comercial.
- Excluye trabajo ajeno en Brand.astro y pago/demo.astro, activos, diseño y legales.
  Pendiente explícito fuera de alcance: frase comercial «planes y demostraciones»
  en src/pages/legal/index.astro:15; el integrador debe autorizar su corrección.
- Validación: suite Astro existente más regresiones sobre HTML real del build
  (copy, SEO/JSON-LD, enlaces de alta y privacidad de la ruta local) y controlador
  de contacto real en VM (WhatsApp/mailto sin envío automático, validación, foco,
  invalidación de mensaje anterior). Exportación limpia: check sin diagnósticos,
  build y 264/264 pruebas con Node24.22.1/pnpm11.25.0 y env staging noindex. Linux
  se entrega como comandos reproducibles, sin SSH, UI ni despliegue en este bloque.

## 2026-11-17 — PNG positivo para correo sobre fondo blanco

- Añade sólo /brand/v1.0/cripton_horizontal_color_v1.0.png, exportación738×199
  del SVG oficial del mismo nombre. Fuente SHA256:
  dd240d31abb5c92d304904e94c305fe79cac0e8bcc55faef3121e68d0d9eec22.
  PNG SHA256:90eaef34445c2344be5ae8900146c9b95d0b4f88d61c49049179ce1bfb154529.
- Manual oficial: Cripton_Kit_Marca_v1_0/00_manual/Cripton_Manual_Texto_v1_0.md,
  revisión1.1.0, apartados Correcciones, Fondos claros y Tabla de tamaños mínimos.
  Conserva paths, proporción, espacios negativos, marino#051828 y cian#31CCD4.
  PNG RGBA transparente: el fondo blanco uniforme corresponde al marco HTML
  del correo, como exige el manual; no se integra un rectángulo al imagotipo.
- Exportación reproducible: Sharp0.35.4/libvips8.18.6, density144, resize738×199
  fit=contain/alpha0, sRGB con withIccProfile('srgb'), PNG compressionLevel9,
  adaptiveFiltering=false,
  palette=false/progressive=false. Redondeo de proporción inferior a un píxel.
- Consumidor: plantilla común del worker SaaS. Publicar este recurso antes del
  worker que lo referencia. URL y bytes del PNG reverso anterior se preservan.
  Sin cambios de login, páginas, CSS, dependencias, API, SQL ni pagos.
- Pruebas Sharp verifican formato, hashes, colores, transparencia, geometría
  contra el vector y copia exacta en dist. La evidencia Linux del commit se
  conserva en artifacts del integrador; esto no acredita visualización en Gmail.


## 2026-11-16 — Logo raster para correo transaccional de Cripton

- Añade únicamente public/brand/v1.0/cripton_horizontal_reverso_v1.0.png,
  exportación PNG transparente 738×199 del SVG oficial del mismo nombre.
  Source SHA256:1083a405fbe7f3755b4e8c3b4027821413733f60d86a1335293b25d6d9baa2ac.
- Consumidor: marco HTML del worker SaaS. Usa el origen web ya configurado;
  imagen pública sin cookies, token, destinatario o seguimiento. PNG conserva
  proporción y marca; permite clientes de correo que no muestran SVG.
- Publicar este recurso antes del worker que lo referencia. No cambia páginas,
  formularios, precio, SEO, componentes de marca, SQL ni contratos HTTP.
- Reenvío anterior aceptado en Codex: correo inicial y segundo mensaje reales
  en la bandeja principal de santy.2992.2@gmail.com, desde notificaciones;
  contador60s, recarga sin reiniciar espera, mismo enlace y acceso recibidos.
  La recepción en santy.slike.2992@gmail.com fue confirmada por el propietario.
  Evidencia de branding posterior se registra en pos_saas/docs/.

## 2026-11-16 — Reenvío de verificación después de un minuto

- Registro muestra recibo, contador60s y botón Reenviar correo. Usa POST
  signup-intents/:id/resend-verification con email original e Idempotency-Key;
  acepta202 genérico, respeta429 y preserva clave ante pérdida de respuesta.
- Alta admite verificationEmail opcional (resendAvailableAt/retryAfterSeconds).
  API antigua usa espera local conservadora; publicar API/borde de pos_saas
  3f52263 antes de esta web.503 email_delivery_unavailable conserva formulario.
- Recarga recupera sólo id/email/expiry/resendAt sin enviar automáticamente.
  Migra recibos locales anteriores sin conservar su formulario completo. La
  creación conserva su idempotencia previa ante recarga/fallo de red. Verificar
  limpia sólo el recibo propio, después de validar el resultado de la API.
- Enlace vencido permite volver al registro; corregir correo es explícito, sin
  borrar la solicitud del servidor ni modificar pruebas, pagos o permisos.
- Sin cambios de dependencias, marca, estilos globales, precios o páginas de pago.
  Pruebas del controlador/timer, red, doble clic, recarga,503 y storage bloqueado;
  aceptación del proveedor/bandeja y despliegue se registran en pos_saas/docs/
  QA_SIGNUP_EMAIL_RESEND_2026-11-16.md.


## 2026-11-15 — Texto de la prueba ya contratada

- Mi cuenta usa el estado canónico `trial.status=converted` para sustituir la
  invitación a contratar por orientación al período pagado de la suscripción,
  conservando que contratar no activa la renovación automática. Las pruebas
  abiertas mantienen su texto y los clientes sin trial no muestran ese bloque.
- Corrección sólo de presentación: sin cambios de contrato HTTP, permisos, SQL,
  API ni worker. No requiere migración ni orden de publicación adicional.
- La aceptación real de conversión fue informada por el integrador (Activo,
  vencimiento 15 de diciembre y confirmación de contratación). Esta corrección
  se verifica con el controlador real en VM; navegador desplegado queda al
  integrador. No se ejecutan CUA, pagos, proveedores ni despliegues en este bloque.
- Node 24: 157/157 pruebas de cuenta (incluye conversión y actualización),
  Astro check sobre 51 archivos sin errores, advertencias ni hints.

## 2026-11-14 — Prueba gratuita canónica de 15 días

- Registro/verificación consumen trial_setup sin checkout automático; legacy pagado conserva checkout. Mi cuenta valida trial nullable, fechas UTC/canConvert del servidor y no infiere un período pagado.
- Contratación explícita con POST trial-checkout e idempotencia; retorno trial_conversion separado de signup. Prueba activa/expirada no habilita recuperación de deuda, cambio de plan o cobro recurrente. Member no recibe acciones de pago.
- Landing/planes anuncian 15 días sin tarjeta/cobro automático, con precio posterior. JSON-LD mantiene precios pagados; sin afirmación de gratuidad permanente. Conservados Brand/demo ajenos.
- API/worker/SQL029 y contratos deben publicarse primero desde pos_saas, incluida la ruta trial-checkout en el acceso HTTP del entorno. La web no crea ni extiende pruebas, modifica SSO o decide elegibilidad. Sin SQL, commit/deploy por este agente.
- Validación Node 24: test:web 231/231, build:public y sus auditorías aprobados; Astro cero errores/advertencias/hints. Codex IAB local verificó trial_setup, cuenta activa/expirada y retorno trial_conversion con respuestas sintéticas. Viewport medido 393×852 en cuenta expirada; tarjeta, recuperación y cambio de plan ocultos. Sin DB/proveedor/correo; no equivale a aceptación de staging ni pago real. Pendiente recorrido integrado después del despliegue compatible.


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

## 2026-11-14 — Dependencias del build Astro aisladas

Instalación pnpm congelada con nodeLinker: hoisted en pnpm-workspace.yaml. Evita resolver la
versión de cookie del SaaS padre al prerenderizar. Sin cambios de grafo/lock,
contrato, diseño ni ambiente. Compilación limpia y231 pruebas aprobadas; no
equivale a aceptación integrada de staging.


## 2026-11-17 — Acceso a Mi cuenta desde POS y visibilidad de contraseñas

- Retorno con PKCE S256/estado y código single-use60s, sin Bearer persistido ni
  cookies compartidas con Control. Destinos account/plans/fiscal y validación de
  la sesión/empresa/rol original en API. Main POS requiere Control033, endpoints
  portal-sso y `/auth/portal`; no equivale a un permiso de plataforma.
- Ojito compartido para login/configuración y las dos formas de acceso heredado.
  No cambia política ni contraseña. Formularios y pagos mantienen sus contratos.
- Astro check sin errores y160 pruebas de cuenta/retorno aprobadas. Publicación,
  navegación HTTPS y recepción de correos se documentan en el informe integrado
  del POS; esta entrada no acredita esas comprobaciones todavía.
- Cambios ajenos de Brand y pago/demo preservados fuera de este bloque.
