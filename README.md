# Sistema POS - landing comercial

Sitio comercial independiente del POS operativo. Vive en `C:\Users\slike\Documents\Proyectos\pagina_pos` para mantener separada la pagina publica de la aplicacion Node.js/Express/EJS del POS actual.

## Decision tecnica

Se usa Astro porque esta primera etapa es una landing comercial estatica: hero, propuesta de valor, modulos, planes, comparador, FAQ y contacto. Astro permite HTML/CSS simple, excelente rendimiento, bajo costo de hosting en Cloudflare Pages/Vercel/Netlify y menos JavaScript de cliente que una app completa.

Next.js sigue siendo una buena opcion cuando el sitio necesite rutas dinamicas complejas, autenticacion, checkout embebido con estado de servidor o contenido administrable desde backend. Para esta fase, Astro es mas directo y suficiente.

## Alcance actual

- Landing responsive para celular, tablet y escritorio.
- Planes de referencia: Basico `$59.900`, Profesional `$89.900`, Empresarial `$149.900`.
- Implementacion inicial sugerida: `$150.000`.
- CTA a demo, contacto y WhatsApp.
- Botones de plan preparados con atributos para conectar checkout futuro.
- Formulario sin persistencia real por ahora.

## Reglas de arquitectura

- No se modifica el POS operativo desde esta landing.
- No se crea base SQL Server para la landing.
- La pagina no activa clientes ni suscripciones automaticamente.
- El checkout futuro debe llamar a un backend SaaS central que cree ordenes, valide pagos/webhooks y aprovisione tenants.
- Si se decide persistir leads antes del backend SaaS, primero debe documentarse el esquema y el flujo de tratamiento de datos.

## Desarrollo local

```sh
pnpm install
pnpm dev
pnpm build
```

El proyecto requiere Node.js `>=22.12.0`.
