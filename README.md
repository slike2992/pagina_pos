# Sistema POS - sitio comercial

Landing comercial independiente del POS operativo. El proyecto vive en
`C:\Users\slike\Documents\Proyectos\pagina_pos` y no comparte ejecución,
despliegue ni persistencia con la aplicación Node.js/Express/EJS existente.

## Decisión técnica

Se usa Astro porque el alcance actual es un sitio comercial mayoritariamente
estático. Astro entrega HTML optimizado, procesa imágenes de forma responsiva y
permite agregar interactividad puntual sin convertir toda la página en una
aplicación cliente.

Next.js sería apropiado cuando el sitio necesite autenticación, checkout con
estado de servidor o un portal de clientes. Esas responsabilidades no deben
incorporarse a esta landing hasta que exista el backend SaaS central.

## Alcance actual

- Hero comercial con imagen propia y llamada a demostración.
- Secciones de beneficios, producto, módulos y puesta en marcha.
- Planes Básico, Profesional y Empresarial con comparador.
- Preguntas frecuentes y contacto mediante WhatsApp.
- Selección de plan conectada al formulario.
- SEO básico, datos estructurados y metadatos sociales.
- Navegación y diseño responsive para móvil, tablet y escritorio.
- Sin base de datos, cookies de seguimiento ni persistencia de leads.

## Configuración

El enlace de WhatsApp usa la variable pública `PUBLIC_WHATSAPP_NUMBER`. Debe
contener el número con indicativo de país y solo dígitos, por ejemplo:

```env
PUBLIC_WHATSAPP_NUMBER=573001234567
```

Sin esta variable, WhatsApp abre el selector de conversación con el mensaje
preparado. No se debe publicar en producción sin definir el número comercial.

## Desarrollo local

Requiere Node.js `>=22.12.0`.

```sh
pnpm install
pnpm dev --host 0.0.0.0
pnpm build
pnpm preview
```

La opción `--host 0.0.0.0` permite revisar el sitio desde otro dispositivo en
la misma red local.

## Arquitectura y límites

- La landing no modifica ni inicia el POS operativo.
- No existe una base SQL Server para la página comercial.
- La página no activa clientes, tenants ni suscripciones.
- Un checkout futuro debe consumir una API central, validar pagos mediante
  webhooks idempotentes y aprovisionar el tenant después de confirmar el pago.
- Antes de persistir leads se debe documentar el esquema, consentimiento,
  retención y tratamiento de datos.

El estado de calidad y las decisiones de la revisión están en
`docs/auditoria_landing.md`.
