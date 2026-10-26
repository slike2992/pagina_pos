# Captación, SEO y condiciones — ejecución del 2026-10-26

## Objetivo y criterio

Facilitar que un comercio encuentre Cripton, entienda el producto, compare el
alcance y continúe al registro con información útil y condiciones rastreables.
Los dos videos aportaron temas; las decisiones se contrastaron con fuentes
primarias, código y navegador. No se promete tráfico ni protección jurídica
absoluta. El diseño conserva el estándar de marca aprobado.

## Implementado

| Área | Resultado |
| --- | --- |
| Descubrimiento | Doce rutas públicas preferidas, canonical fijo sin parámetros, títulos/descripciones únicos, un H1 por página editorial, metadatos sociales, sitemap y robots coherentes. |
| Contenido | Cuatro soluciones distintas, índice, guía de elección y página de confianza basados en funciones reales. Enlaces entre páginas y CTA de registro/demo/planes. |
| Presentación | Cabecera y pie compartidos, enlaces legales y canales por finalidad. CSS de portada consolidado con paleta oficial y foco/movimiento reducido. Toolbar de Astro sigue desactivado. |
| Planes | Seis importes preservados; ahorro anual calculado; sin popularidad inventada. El selector de contacto ofrece las seis modalidades. |
| Contacto | Preparación local, validación, límites de longitud, alternativa email si no hay WhatsApp y enlace explícito para enviar. Sin persistencia de leads ni publicidad automática. |
| Datos | GA4 opcional y diferido al consentimiento; solo rutas editoriales, categorías fijas y sin campos del formulario o tokens. Preferencia revocable, con expiración y señales del navegador. |
| Jurídico | Legales vigentes preservados, centro legal y cookies; tres propuestas completas separadas y no publicables en release. Baseline de artículo fuente, no sustitución de digest de DB. |
| Publicación | Preview segura por defecto; build público explícito con QA y barrera contra borradores. Material de experimentos de logo se excluye del artefacto público generado. |
| Mantenimiento | README actualizado e índices por componentes, contenido y rutas; registro transversal y evidencia de QA. |

## Lo que requiere definición o acceso externo

1. **Titular real y revisión jurídica.** Nombre/razón social, identificación
   aplicable, domicilio/dirección/teléfono; confirmar condiciones de renovación,
   cancelación, devolución, soporte y conservación. Los borradores enumeran los
   pendientes. No usar «Cripton» como sustituto de una parte identificada.
2. **Adopción versionada.** Reconciliar snapshots y hashes históricos, revisar
   contratos, crear nuevas versiones mediante migración aditiva del control SaaS
   y probar aceptación/lectura histórica. No reemplazar retroactivamente textos.
3. **Publicación y dominio.** Elegir hosting, configurar HTTPS y redirección
   canónica entre dominio/www y HTTP/HTTPS, API/CORS, URL del POS y cabeceras de
   seguridad. El código local no confirma esos servicios ni los despliega.
4. **Search Console y Bing.** Verificar propiedad con el titular, enviar sitemap
   público e inspeccionar URLs tras publicar. Está preparado el token meta como
   alternativa; la propiedad de dominio suele verificarse en DNS.
5. **Medición real.** Crear/elegir propiedad GA4, revisar condiciones del
   proveedor, retención, filtros internos y desactivar medición mejorada de
   formularios, enlaces/salida e historial si se requiere medir únicamente los
   eventos propios definidos. Validar solicitudes reales y revocación antes de
   activar el ID. Sin configuración, la página funciona sin el proveedor.
6. **Operación y confianza.** Confirmar canales atendidos, exportación/salida,
   respaldo, incidentes, proveedores y ubicaciones de datos. No convertir un
   ensayo local en una garantía comercial de recuperación o disponibilidad.

## Captación posterior a publicar

- Revisar consultas, páginas indexadas, clics y recorrido a registro/contacto con
  datos reales. Un clic de CTA no es una venta ni un correo recibido.
- Usar preguntas reales de demostraciones/soporte para ampliar guías con ejemplos
  del producto; revisar cuando cambien funciones y planes.
- Publicar casos de clientes o capturas con autorización y datos anonimizados;
  no fabricar cifras, logos, testimonios ni reseñas para conseguir rich results.
- Si se atiende presencialmente, evaluar elegibilidad de Google Business Profile.
  Un SaaS exclusivamente online no es elegible por el mero hecho de tener dominio.
- Medir rendimiento tras el despliegue: objetivos de experiencia de referencia
  LCP <=2,5 s, INP <=200 ms y CLS <=0,1 al percentil 75. La revisión local no
  acredita métricas de campo ni sustituye Search Console/PageSpeed en producción.

## Fuentes

- [Google: contenido útil](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) y [políticas de spam](https://developers.google.com/search/docs/essentials/spam-policies).
- [Google: nombres de sitio](https://developers.google.com/search/docs/appearance/site-names), [canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) y [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
- [Google Business Profile: elegibilidad](https://support.google.com/business/answer/13763036?hl=en).
- [Google: consentimiento](https://developers.google.com/tag-platform/security/guides/consent), [eventos y privacidad](https://developers.google.com/analytics/devguides/collection/ga4/user-id).
- [Core Web Vitals](https://web.dev/articles/vitals), [Astro rutas](https://docs.astro.build/en/guides/routing/) y [estilos](https://docs.astro.build/en/guides/styling/).
- Fuentes colombianas y análisis detallado en [revisión jurídica](LEGAL_REVIEW_2026-10-26.md); investigación adicional en [SEO](SEO_RESEARCH_2026-10-26.md).
