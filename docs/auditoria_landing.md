# Auditoría de la landing comercial

Fecha: 2026-09-11

## Objetivo

Dejar una primera versión profesional y presentable de Sistema POS, separada
del producto operativo y preparada para conectar el backend SaaS en una fase
posterior.

## Hallazgos corregidos

| Área | Hallazgo inicial | Resolución |
| --- | --- | --- |
| Mensaje | La página exponía conceptos internos como “SaaS futuro” y “checkout futuro”. | El contenido ahora se centra en resultados para el comercio. Los límites técnicos quedan en la documentación. |
| Conversión | El formulario enviaba a `#` y no producía una acción útil. | El formulario valida datos y prepara un mensaje de WhatsApp sin persistir información. |
| Selección de plan | Los botones no trasladaban la elección al contacto. | Cada CTA actualiza el plan en el formulario antes de desplazarse a contacto. |
| Identidad visual | El hero dependía de una maqueta pequeña y una jerarquía pesada en móvil. | Se incorporó una fotografía original, una composición editorial y una paleta sobria de alto contraste. |
| Navegación | En tablet y móvil desaparecía la navegación. | Se agregó un menú móvil accesible basado en HTML nativo. |
| Accesibilidad | Faltaban salto a contenido, estados de foco y campos obligatorios. | Se añadieron enlace de salto, foco visible, etiquetas explícitas, `required`, estado vivo y soporte para movimiento reducido. |
| Comparador | La estructura emulaba una tabla con `div` y roles manuales. | Se usa una tabla semántica desplazable y con encabezados correctos. |
| SEO | Solo existían título y descripción básicos. | Se añadieron Open Graph, Twitter Card, robots y JSON-LD de `SoftwareApplication`. |
| Rendimiento | No había activo visual real ni tratamiento responsivo de imagen. | Astro genera variantes WebP y tamaños responsivos desde el recurso fuente. |

## Comprobaciones requeridas

- `astro build` debe finalizar sin errores.
- No debe existir desbordamiento horizontal a 390, 768 y 1440 píxeles.
- La consola del navegador debe quedar sin errores.
- Los enlaces internos deben apuntar a identificadores existentes.
- El formulario debe validar nombre y teléfono antes de preparar el mensaje.
- La selección de un plan debe reflejarse en el campo correspondiente.

## Pendientes antes de producción

1. Definir `PUBLIC_WHATSAPP_NUMBER` con el número comercial real.
2. Confirmar precios, impuestos, términos del servicio y alcance de implementación.
3. Configurar dominio público para convertir `og:image` y canonical en URLs absolutas.
4. Definir analítica y consentimiento solo si existe una necesidad comercial aprobada.
5. Diseñar el contrato de API y tratamiento de datos antes de persistir leads.

Estos pendientes son de configuración o decisión de negocio; no bloquean la
revisión local ni implican crear una base de datos para la landing.
