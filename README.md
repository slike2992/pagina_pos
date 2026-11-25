# Cripton — web comercial y portal de acceso

Contratación por empresa y solicitudes de soporte/datos: ver
[flujo y validación](docs/CUSTOMER_CONTRACTS_2026-11-25.md) y
[compatibilidad con SaaS](docs/CROSS_BRANCH_CHANGES.md). La prueba gratuita, el
contrato, el pago y la renovación automática son actos distintos; la web consume
la autoridad de la API y no activa condiciones productivas al desplegarse.

Registro de prueba QA versionado: [fuente, rutas y guard de staging](docs/SIGNUP_TRIAL_QA_2026-11-25.md).
El opt-in `PUBLIC_REGISTRATION_LEGAL_VERSION=2026-11-25-prueba-qa` sólo se admite
con `PUBLIC_SITE_URL=https://staging.cripton.com.co`; cambia los enlaces del pie
y centro legal. Ausente conserva09-01. Las rutas QA se generan sólo en staging,
con JSON copiado exactamente de SaaS y huella canónica visible. No modifica los
documentos09-01, sus archivos históricos ni el flujo de registro; la API decide
las versiones aplicables. Ejecutar `npm run check`, `npm run build` y `npm run test:web`.

Sitio Astro del producto POS SaaS. El repositorio de la web es `pagina_pos`;
POS, API, worker y Cripton Control pertenecen al repositorio `pos_saas`.
La web genera HTML estático y consume la API SaaS en los flujos interactivos.
No almacena una base SQL propia ni confirma pagos en el navegador.

Mi cuenta obtiene las opciones de cambio desde `GET /v1/public/plans`, agrupadas
sin/con electrónica y filtradas por el país, moneda y periodicidad de su
suscripción. Conserva el código actual, incluidas las variantes FE. El catálogo
no autoriza ni cotiza cambios: el POST existente envía sólo el código elegido;
la API valida y calcula el prorrateo. Si el catálogo falla o no corresponde al
mercado, sólo bloquea el cambio y permite reintentar, sin impedir abrir el POS o
administrar la renovación. Respuestas de otra sesión/empresa no restauran datos.
`src/lib/account-plans.ts` concentra este contrato y `test:web` incluye sus
pruebas de validación, render y concurrencia junto a las del portal existente.

Mi cuenta concentra la orientación fiscal comercial, consultada del mismo
catálogo publicado. Un plan sin FE explica el cambio de plan; con FE muestra
los requisitos generales y permite al owner/admin abrir la configuración real.
No inventa estados completados ni autoriza emisión desde el catálogo. El botón
reutiliza el SSO existente con el destino nominal `destination=fiscal-setup`;
el POS compatible lo limita a `/admin/resoluciones`, conserva la selección de
sucursal y exige su ACL normal. Publicar primero ese callback POS. No se enlaza
directamente a configuración de otra sesión ni se comparten credenciales.
Facturar sólo muestra el selector POS/FE si su servidor confirma disponibilidad;
el onboarding y los cupos no ocupan permanentemente el área de venta.

El retorno de Wompi identifica la compra mediante `checkoutSessionId` en la URL,
independientemente del ID de transacción del proveedor y de la pestaña de origen.
En registro, una verificación consumida sólo puede reanudar su checkout original pendiente
mediante `POST /v1/signup-intents/:id/resume-checkout`, disponible en la API SaaS
del bloque de recuperación de staging 2026-11-09. El servidor comprueba posesión,
vigencia y estado; no renueva tokens ni pagos. Una compra pagada o vencida no se
reanuda. En staging/producción la clave inicial llega por correo, nunca por las
rutas de desarrollo. Publicar primero la API y el allowlist del proxy, luego web.

Mi cuenta admite el campo opcional nullable `renewalIssue` de
`GET /v1/me/subscription`: un rechazo definitivo del próximo período se muestra
con importe, fechas UTC y referencia, separado de la cobertura actual. Ausente
o `null` conserva compatibilidad; un detalle malformado no se aplica a la vista
confirmada. La recuperación puede consultarse con cobertura vigente, pero sólo
la oferta del servidor habilita preparar el pago con el POST existente. La API
debe reutilizar la orden rechazada y bloquear pagos pendientes, ambiguos o ya
aprobados. Ver [DTO y recorrido](docs/SUBSCRIPTION_RECOVERY.md).

## Cambio de plan pendiente y retorno de pago

Desplegar primero la API compatible y después la web. Este bloque reutiliza las
rutas existentes, sin endpoints ni CSS nuevos. No guardar el cambio pendiente en
storage ni descubrirlo desde parámetros de URL: `GET /v1/me/subscription` publica
`pendingChange?: null | {...}` sólo para `owner`, `admin` y `billing`; los empleados
no reciben la propiedad ni controles de cobro. El objeto incluye el identificador
del cambio, estado, plan destino, cotización del servidor, vigencia, orden/checkout
opcionales y `nextAction`. El plan vigente, por ejemplo Básico, permanece visible
hasta que una nueva lectura del servidor confirme el cambio aplicado.

| `nextAction` | Acción del portal |
| --- | --- |
| `checkout` | Botón explícito para reanudar con `POST /v1/me/billing/checkout-sessions`, enviando sólo `subscriptionChangeId` e `Idempotency-Key`. La API recupera la misma orden/checkout firmado vigente incluso con una clave nueva. La web conserva la URL exacta devuelta. |
| `wait_for_payment` | Pago pendiente: actualizar lectura; sin otro pago. |
| `wait_for_activation` | Pago en aplicación: actualizar lectura; sin otro pago. |
| `requote` | Revisar y confirmar explícitamente una cotización vigente mediante `POST /v1/me/subscription/change` con el código destino del pendiente. La API verifica el historial, cierra lo que corresponda y calcula el nuevo importe; sólo su respuesta habilita checkout. |
| `wait_for_period_end` | Mostrar el cambio programado al finalizar el período. |
| `review` | Actualizar o contactar soporte; sin checkout ni recotización. |

Los estados privados admitidos son `requested`, `quoted`, `pending_payment`,
`scheduled` y `failed`; `requested/quoted` permiten exclusivamente `review`.
Datos malformados bloquean los cambios de plan sin impedir SSO o renovación.
Las operaciones de pago/recotización tienen guarda síncrona e idempotencia para
reintentos; logout u otra sesión invalidan respuestas tardías. La UI no decide
si un pago vencido, ambiguo o aprobado admite otro intento: lo determina la API.
Los importes cotizados conservan centavos mediante `recoveryAmount`, sin recalcular
el prorrateo ni modificar los precios del catálogo.

El GET público de checkout añade `purpose: 'signup' | 'plan_change' | 'renewal' |
'unknown'`; para `plan_change`, `planChange.status` usa `requested`, `quoted`,
`pending_payment`, `scheduled`, `applied`, `cancelled` o `failed`. No agrega datos
personales, tokens ni contexto de tenant. El estado del pago y la aplicación son
distintos: `approved` no acredita un cambio aplicado; sólo `fulfilled` junto con
`planChange.status='applied'` lo muestra como aplicado. Esto tampoco acredita la
configuración o activación fiscal. Un upgrade rechazado dirige a Mi cuenta, sin
mensajes de alta ni correo de verificación de registro. Sólo `purpose='signup'`
habilita esa guía; ausencia de contexto permanece neutra y la recuperación de
períodos conserva su contrato. El retorno nunca autentica ni habilita acceso.

## Oferta comercial pública

La portada enlaza «Usuarios y permisos» y «Operación multisede» a sus secciones
en `/soluciones/ventas-y-caja/`, con anclas estables. Ese recorrido explica
usuarios propios, cajas asignadas, turnos, comprobantes y los requisitos de FE.
Inventario describe productos, compras, proveedores, movimientos y ajustes;
su kardex incluye una captura real con datos ficticios, optimizada por Astro
y ampliable. No cambia las funciones ni los permisos del POS.

WhatsApp aparece como un único botón con su ícono, fijo en la esquina inferior
derecha de las páginas que comparten el pie. Usa el número comercial confirmado
+57 321 959 7077, con override opcional mediante `PUBLIC_WHATSAPP_NUMBER`.
`src/content/contact.ts` mantiene el mismo destinatario para botón y formulario.
El pie reserva espacio para el botón; respeta el área segura del dispositivo y
queda por debajo del panel de consentimiento. El ícono SVG es local, de Simple
Icons (`https://github.com/simple-icons/simple-icons/blob/develop/icons/whatsapp.svg`).

Los accesos de pagos y soporte permanecen en la portada.
«Pagos seguros con Wompi» abre `/cuenta`, donde se prepara el pago del plan
con su sesión y suscripción. No se crea un checkout genérico ni se modifica
el contrato de pagos. Soporte abre `servicioalcliente@cripton.com.co`.
El nombre y la foto que WhatsApp muestre al abrir el enlace dependen del perfil
del número: la web no puede configurarlos mediante parámetros de URL. El número
está actualmente en WhatsApp normal; configurar el perfil Cripton en WhatsApp
Business y su foto pública queda a cargo del propietario desde su celular.
Validación y límites: [revisión de secciones comerciales](docs/QA_COMMERCIAL_SECTIONS_2026-11-22.md).

La web ofrece únicamente 15 días gratis, sin tarjeta: una prueba por cuenta
elegible. No afirma detectar a una persona entre distintas cuentas o alias.
Para continuar después se requiere contratar un plan de pago; la prueba no se
cobra ni renueva automáticamente. Los CTA conservan los seis códigos de plan
y llevan a /registro. El formulario de contacto prepara consultas sobre la
prueba en WhatsApp/correo, sólo abre el canal tras una acción explícita y no envía
ni almacena los datos por su cuenta.

Consumidores: registro/verificación de la API SaaS y correos del worker. El
integrador mantiene la política de signup y los controles de abuso en backend;
El modo público de backend se habilita con CUSTOMER_SIGNUP_PUBLIC_SINCE, fijado
una vez por el integrador; esta revisión no decide elegibilidad ni modifica
contratos, auth o checkout.
Se conservan local_demo, los pagos Sandbox y las rutas canónicas. La página
/pago/demo sigue disponible en astro dev; todo build estático publica en esa
ruta sólo una redirección fija a /registro?plan=professional, sin reenviar
parámetros ni cargar el controlador local. La protección no depende de Caddy.
El índice orientativo /legal/ actualiza exclusivamente su frase comercial para
referir a la prueba gratis de 15 días sin tarjeta y los planes de pago. No
modifica documentos legales, versiones, condiciones de aceptación, marca o diseño.

Las regresiones ejecutan el controlador real de contacto en VM (ambos canales,
validación, foco y mensaje obsoleto) y auditan HTML/SEO/JSON-LD y enlaces del build.
Validación de esta revisión en exportación limpia con Node24.22.1/pnpm11.25.0:
Astro check sin errores/advertencias/hints, build y 265/265 pruebas aprobadas,
con las cuatro variables públicas de staging (indexación/borradores=false).
La evidencia local no acredita publicación, navegador ni una ejecución Linux.

## Prueba gratuita de 15 días

Los registros nuevos usan la prueba canónica de la API: verificar correo devuelve
`nextAction=trial_setup`, estado provisioning y tenantId. La web muestra preparación
e instrucciones por correo/Mi cuenta; no crea checkout, inicia días ni configura
contraseñas. La API conserva la respuesta checkout de los registros pagados legacy.

Mi cuenta valida `trial?: null | {status,durationDays:15,startsAt,endsAt,convertedAt,canConvert}`.
Las fechas UTC son del servidor y el período pagado permanece separado. Durante
provisioning/active/expired oculta renovación, tarjeta recurrente, recuperación de
atrasos y cambios de plan. Owner/admin/billing pueden contratar sólo si canConvert;
member conserva lectura y acceso POS según el servidor. Expirar no impide login.

Contratar plan hace un POST explícito `/v1/me/subscription/trial-checkout` con
subscriptionId e Idempotency-Key en memoria. Reutiliza el checkout canónico;
no decide si puede repetir un pago pendiente/ambiguo. `purpose=trial_conversion`
en el retorno dirige a la misma cuenta/contraseña; approved aún espera aplicación,
fulfilled muestra contratación aplicada. No dispara un segundo aprovisionamiento.
La prueba no necesita tarjeta ni se cobra/renueva automáticamente. El precio de
catálogo describe la contratación posterior, no gratuidad permanente. El plan FE
sigue requiriendo su configuración/activación por tenant y ambiente.

Publicar primero API/worker/SQL029 y contrato compatible, después esta web.
Sin nuevos permisos, SQL, cambio de legales/Brand/demo ni credenciales en el cliente.
Validación Node 24: `PUBLIC_SITE_INDEXABLE=true npm run test:web`, 231/231;
`npm run build:public`, Astro sin errores/advertencias/hints y auditorías públicas
aprobadas. Los tests ejecutan controladores/helpers reales con DOM/HTTP simulados.
Codex IAB local verificó trial_setup, prueba activa/expirada y retorno contratado
con respuestas sintéticas; viewport medido 393×852 en cuenta expirada, con tarjeta,
recuperación y cambio de plan ocultos. Sin proveedor, correo ni DB. Esta evidencia
no acredita staging ni una contratación real; aceptación desplegada pendiente.

## Desarrollo

Requiere Node >=22.12; esta revisión utiliza Node 24.22.1. No usar el Node 18
global que existe en algunos equipos. Instalar con `pnpm install` en un clon
nuevo. Copiar `.env.example` a `.env.local` y configurar las URL públicas del
entorno. Las variables `PUBLIC_*` no son secretos: nunca poner claves en ellas.

```sh
pnpm dev --host 0.0.0.0 --port 4321 --background
pnpm astro dev status
pnpm astro dev logs
```

Mantener servidores existentes; una revisión aislada utiliza otro puerto.
Si el registro se prueba desde un puerto nuevo, la API debe autorizar ese origen
según su política CORS; no ampliar CORS por conveniencia de un preview.

## Comprobaciones y artefactos

```sh
pnpm qa:web
pnpm build:public
pnpm audit:performance
```

`qa:web` valida tipos, construye una preview sin indexación por defecto y audita
el HTML y el consentimiento. `build:public` activa explícitamente la indexación,
rechaza el preview jurídico, construye y ejecuta las comprobaciones. No despliega
ni acredita configuración DNS, HTTPS, indexación real o aprobación jurídica.
La salida pública debe publicarse completa y retirando archivos antiguos.

El bloque de retorno y cambio pendiente validó localmente **204/204 pruebas de
lógica con Node 24.22.1**: las 203 de la congelación más una regresión de centavos
del prorrateo. Las pruebas ejecutan los controladores con DOM/HTTP simulados.
Build Ubuntu aislado, checks de HTML construido y aceptación en navegador siguen
pendientes del integrador; esta cifra no incluye esos checks ni acredita un pago
o replay real. Ver [comandos y alcance](scripts/README.md).

## Configuración

| Variable | Finalidad |
| --- | --- |
| `PUBLIC_SAAS_API_URL` | API de registro, cuenta y pago; conservar separación de ambientes. |
| `PUBLIC_POS_URL` | Destino del POS y SSO. |
| `PUBLIC_WHATSAPP_NUMBER` | Override del número comercial con indicativo; por defecto usa el confirmado `573219597077`. |
| `PUBLIC_SITE_INDEXABLE` | `true` solo para un build público autorizado; ausente/false genera noindex y sitemap vacío. Dev siempre noindex. |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Token público opcional de Search Console, solo en portada. No sustituye el alta de la propiedad. |
| `PUBLIC_GA_MEASUREMENT_ID` | ID público GA4 opcional. Vacío significa sin etiqueta ni aviso de analítica. |
| `PUBLIC_ANALYTICS_REVIEWED` | Mantener false hasta revisar la propiedad real. Medición solo en release, origen HTTPS canónico y rutas sin query. |
| `PUBLIC_LEGAL_DRAFT_PREVIEW` | Incluye borradores solo en un artefacto de revisión no indexable. Incompatible con publicación pública. |

Las opciones se fijan al compilar. Cambiar variables del hosting estático después
del build no cambia el HTML. Las previews del mismo artefacto público necesitan
también una cabecera `X-Robots-Tag: noindex` del hosting y acceso restringido si
contienen material privado.

## Organización

- `src/components`: SEO, marca, navegación, pie y preferencias de analítica.
- `src/layouts`: presentación editorial y layout del recorrido de cuenta.
- `src/content`: soluciones verificadas y borradores jurídicos separados.
- `src/lib`: política de URL/indexación y categorías permitidas de medición.
- `src/pages`: portada, soluciones, guía, confianza, legales y flujos existentes.
- `src/styles`: paleta oficial y estilos de portada; sin fuentes externas.
- `public/brand`: recursos aprobados de marca. Los experimentos de diseño no
  pertenecen al release comercial.
- `scripts`: auditoría del artefacto, consentimiento y build público.
- `docs`: [índice y evidencia](docs/README.md).

Los formularios de registro/cuenta/pago siguen los contratos existentes de la
API SaaS. El contacto comercial prepara un mensaje local y requiere que el
visitante lo abra y envíe. No persiste leads ni los suscribe a publicidad.

## Documentos jurídicos

Los artículos de términos y privacidad de la versión `2026-09-01` conservan su
contenido; el catálogo jurídico de la API sigue gobernando el alta. El baseline
del artículo fuente verifica esa conservación y no reemplaza hashes de DB.
Las propuestas ampliadas son borradores sin vigencia ni nuevas aceptaciones.
Antes de adoptarlas se requieren titular legal, condiciones comerciales y
operativas, revisión y una publicación versionada en la cadena canónica SaaS.

Consultar el [plan y pendientes](docs/WEB_GROWTH_PLAN_2026-10-26.md) y la
[revisión jurídica](docs/LEGAL_REVIEW_2026-10-26.md).

Calidad frontend y evidencia: [bloque 2026-10-26](docs/WEB_QUALITY_2026-10-26.md).
Helpers y comprobaciones: [lib](src/lib/README.md) y [scripts](scripts/README.md).

## Instalación reproducible de la web

Usar pnpm install --frozen-lockfile con Node compatible. pnpm-lock.yaml es el
lockfile de este repositorio. pnpm-workspace.yaml mantiene nodeLinker: hoisted para que el
prerenderizador de Astro resuelva su grafo completo dentro de esta aplicación;
no debe resolver cookie u otras dependencias de un proyecto padre. El build
limpio de staging se verificó con esta configuración, sin cambiar versiones.

Gestor fijado: pnpm11.25.0; Node>=22.13. La configuración de pnpm11 usa YAML:
https://pnpm.io/es/11.x/settings . El workspace sólo contiene esta aplicación.

## Reenvío del correo de registro

La pantalla Revisa tu bandeja permite reenviar después de60 segundos. La API
valida el plazo, la vigencia y el destinatario; solicitar no confirma recepción.
Recargar conserva el registro pendiente sin volver a crear una cuenta ni enviar
automáticamente. Si el correo estaba mal escrito puede corregirse mediante una
nueva solicitud explícita. Publicar primero API/borde con resend-verification.
En staging, sólo los destinatarios QA habilitados pueden recibir mensajes; un
destino no disponible conserva el formulario y muestra orientación.
