# Publicación de la web comercial

## Antes de generar el release

1. Confirmar dominio y URL de API/POS del mismo ambiente; nunca incorporar
   secretos a variables `PUBLIC_*`.
2. Cerrar datos del operador, condiciones comerciales y documentos jurídicos.
   Los borradores no son documentos adoptados; el registro usa catálogo SaaS.
3. Ejecutar `npm run build:public` con Node compatible. El comando rechaza
   borradores, excluye solo copias generadas conocidas de experimentos de logo
   dentro de `dist` y audita el resultado. No elimina originales de `public`.
4. Revisar robots, sitemap, canonical y recursos del artefacto y publicar con
   reemplazo completo, retirando archivos antiguos de preview y CDN.

No desplegar `dist` procedente de una revisión jurídica. Un flag cambiado en el
hosting después de compilar no modifica páginas ya generadas. El repositorio
no crea infraestructura ni selecciona un servicio Azure por sí mismo.

## Configuración que debe validar el hosting elegido

- HTTPS válido y redirección única de HTTP/www al dominio preferido.
- `X-Content-Type-Options: nosniff` y protección frente a framing mediante
  `Content-Security-Policy: frame-ancestors 'none'` cuando el sitio no se embeba.
- Referrer comercial limitado; flujos con tokens deben conservar `no-referrer`.
  Evitar parámetros sensibles en logs, analítica, cachés o trazas del hosting.
- Política de caché que no conserve cuentas, tokens ni respuestas privadas.
  Los assets versionados de Astro sí pueden tener caché prolongada.
- Desarrollar CSP completa desde los orígenes efectivos de API, pago y medición;
  probar primero con report-only y recorrer registro/pago/SSO antes de exigirla.
  No copiar una CSP genérica que rompa el checkout o los estilos existentes.
- HSTS solo tras validar HTTPS y el alcance de subdominios; no solicitar preload
  mientras no se conozcan y cumplan sus requisitos.
- Preview protegida si es privada, con `X-Robots-Tag: noindex`. La cabecera
  configurada en Astro solo cubre `dev`/`preview`, no el hosting estático real.
- API con CORS explícito de los orígenes autorizados; no usar wildcard para
  resolver errores locales. Robots/noindex no son controles de autenticación.

## Descubrimiento y medición

Verificar propiedad Search Console/Bing con el titular y enviar el sitemap
público después de comprobar las respuestas reales. Revisar indexación y
rendimiento de campo; el build no asegura que Google publique una página.

Mantener `PUBLIC_GA_MEASUREMENT_ID` vacío y `PUBLIC_ANALYTICS_REVIEWED=false`
hasta revisar la propiedad, condiciones y mediciones automáticas. Conectar ID y
revisión solo en el artefacto público; el cliente limita origen HTTPS canónico,
ausencia de query y consentimiento. Verificar la red antes/después de aceptar,
rechazar y revocar, junto a filtros de tráfico interno y retención del proveedor.

No añadir píxeles ni embeds de terceros que evadan este mecanismo. La elección
de analítica no es aceptación comercial ni autorización de cobro recurrente.
