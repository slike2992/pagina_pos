# Cripton — web comercial y portal de acceso

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
| `PUBLIC_WHATSAPP_NUMBER` | Número comercial con indicativo; si falta se prepara un correo a ventas. |
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
