# Cripton — web comercial y portal de acceso

Sitio Astro del producto POS SaaS. El repositorio de la web es `pagina_pos`;
POS, API, worker y Cripton Control pertenecen al repositorio `pos_saas`.
La web genera HTML estático y consume la API SaaS en los flujos interactivos.
No almacena una base SQL propia ni confirma pagos en el navegador.

## Desarrollo

Requiere Node >=22.12; esta revisión utiliza Node 24.19. No usar el Node 18
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
```

`qa:web` valida tipos, construye una preview sin indexación por defecto y audita
el HTML y el consentimiento. `build:public` activa explícitamente la indexación,
rechaza el preview jurídico, construye y ejecuta las comprobaciones. No despliega
ni acredita configuración DNS, HTTPS, indexación real o aprobación jurídica.
La salida pública debe publicarse completa y retirando archivos antiguos.

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
