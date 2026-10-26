# Investigación SEO y soluciones Cripton — 2026-10-26

## Alcance y entrega

Investigación de fuentes primarias actuales y lectura de `pagina_pos/src` y
`docs`, contrastadas con módulos funcionales de `pos_saas`. Implementación
acotada en `C:\Users\slike\.codex\worktrees\f458\pagina_pos`, rama
`codex/web-growth-legal`, base comunicada `ad3f8c6`. Sin commit ni despliegue.
No se usó el navegador del usuario ni se conectaron cuentas externas.

Archivos de esta entrega:

- `src/content/solutions.ts`: cuatro soluciones con contenido y enlaces tipados.
- `src/pages/soluciones/index.astro`: selección guiada y tarjetas.
- `src/pages/soluciones/[slug].astro`: cuatro rutas estáticas desde `getStaticPaths`.
- `docs/SEO_RESEARCH_2026-10-26.md`: evidencia, fuentes y tareas de integración.

No se editan portada, política SEO, componentes, layouts, scripts, configuración,
planes ni pagos. Se respetan los cambios previos de `Brand.astro` y
`pago/demo.astro`. El usuario integra `EditorialLayout.astro`, sus clases globales
y la política de publicación. No hay nuevas dependencias ni JavaScript cliente.

## Base existente y brechas comprobadas

La revisión original corresponde a `Documents/Proyectos/pagina_pos`; la
implementación se realizó después en el worktree aislado indicado por el usuario.
Los hallazgos pendientes de otras áreas no se corrigen en estos cuatro archivos.

| Área | Ya existe | Brecha y tarea práctica |
| --- | --- | --- |
| Metadatos | `SeoHead.astro`, título/descripción, canonical fijo, Open Graph y tarjetas sociales | Mantener el componente compartido. Integrar las nuevas rutas editoriales sin duplicar etiquetas en las páginas. |
| Descubrimiento | Sitemap propio con portada y dos legales; robots permite rastreo | Añadir las cinco rutas de soluciones a la lista editorial al integrar; sitemap y canonical deben coincidir. No reemplazar el sitemap solo para usar un plugin. |
| Ambientes | `noindex` en cuenta, registro y pagos; plataforma con `noindex, nofollow` | La indexación de las rutas públicas depende únicamente de la ruta, sin distinguir desarrollo o preview. Resolver la política por ambiente antes de publicar una preview accesible. |
| Contenido | Portada con módulos, comparador, FAQ y contacto | Faltaban páginas editoriales distintas para explicar decisiones, requisitos y límites. Las cuatro soluciones cubren esta brecha sin páginas por ciudad ni variaciones masivas. |
| Conversión | CTA de registro con plan y contacto por WhatsApp; correo comercial | El selector de contacto tiene tres opciones aunque se ofrecen seis planes. El pie de portada no enlaza los legales. Revisar ambos en la integración. |
| Veracidad comercial | Precios mensuales/anuales y FAQ de implementación | Los seis ahorros no coinciden exactamente con la resta anual. El FAQ habla de $150.000 de implementación, mientras `apps/saas-api/src/catalog.ts` declara implementación cero en su catálogo de referencia. Confirmar catálogo efectivo y condiciones antes de cambiar importes. |
| Prueba social | Distintivo «Más elegido» | No se encontró evidencia de popularidad en los archivos revisados. El campo `highlighted` del catálogo no acredita ventas. Sustituir por una recomendación editorial identificada o respaldar la afirmación con datos reales. |
| Accesibilidad | Labels, autocomplete, required, foco en portada, salto a contenido, tabla semántica, FAQ nativo | El texto pequeño blanco sobre `#16a467` del distintivo de ahorro tiene contraste calculado de 3,21:1, inferior a 4,5:1. Corregir colores. Las animaciones de tarjetas se declaran después de la regla de movimiento reducido y no quedan cubiertas por ella; incluirlas en esa preferencia. |
| Resiliencia | El formulario genera el mensaje con JS y `window.open` | Sin JS, el formulario carece de destino/método explícitos y puede enviar sus campos como query a la propia página. Preparar alternativa accesible sin exponer datos y enlace de recuperación si no se abre WhatsApp. No registrar el contenido del mensaje en analítica. |
| Medición | No se encontró instrumentación de analítica en `src` | Preparar eventos con significado verificable y sin datos personales; conectar un destino de medición solo cuando se defina. No afirmar que una apertura de WhatsApp equivale a un lead recibido. |
| Material de diseño | Opciones de logo previas en `public/logo-options/` | Astro copia `public` al build. Revisar la exclusión de borradores del release sin borrar ni modificar el trabajo de marca. Estar fuera del sitemap no impide el descubrimiento de una URL. |

Ahorro calculado como doce mensualidades menos una anualidad, conservando los
precios publicados y sin alterar impuestos ni condiciones:

| Plan | Distintivo existente | Diferencia aritmética |
| --- | ---: | ---: |
| Básico | $100.000 | $99.800 |
| Profesional | $100.000 | $159.800 |
| Empresarial | $100.000 | $259.800 |
| Básico FE | $140.000 | $139.800 |
| Profesional FE | $200.000 | $199.800 |
| Empresarial FE | $320.000 | $319.800 |

El número comercial de WhatsApp depende de una variable de entorno. No se
leyeron secretos ni se verificó su configuración productiva. Tampoco se verificó
la entrega de los correos, el dominio público, TLS ni las redirecciones reales.

## Contenido implementado y fundamento funcional

Las cuatro páginas comparten presentación, pero responden preguntas diferentes,
con desarrollo propio, recorrido de evaluación, requisitos, límites y dudas
específicas. No son variaciones de palabras clave. Los títulos incluyen la marca;
el layout debe usarlos sin volver a añadir «Cripton».

| Ruta | Decisión del visitante | Evidencia funcional consultada en `pos_saas` |
| --- | --- | --- |
| `/soluciones/ventas-y-caja/` | Cómo seguir venta, movimiento y cierre de turno | `apps/pos-web/src/modules/ventas/README.md`, `caja/README.md`, `caja/caja.routes.js`: aperturas, cierres, movimientos, historial y permisos; ventas y notas totales/parciales. |
| `/soluciones/inventario/` | Cómo investigar existencias y diferencias | `apps/pos-web/src/modules/inventarios/README.md` e `inventarios.routes.js`: catálogo, stock, kardex, compras, ajustes, traslados y permisos. Compra en borrador frente a confirmación. |
| `/soluciones/reportes/` | Qué consultar para una pregunta comercial | `apps/pos-web/src/modules/reportes/README.md` y `reportes.routes.js`: ventas diarias, referencias, medios de pago, sucursales, usuarios, resumen y consulta FE. No se atribuyen filtros o estados uniformes a todas las vistas. |
| `/soluciones/facturacion-electronica/` | Qué preparar antes de emitir y cómo interpretar estados | `docs/PLAN_TENANT_FEATURES_AND_FISCAL_ISOLATION.md`, su resultado actualizado en `docs/QA_TENANT_FISCAL_2026-10-23.md` y los README/código de ventas y Factus. |

El módulo fiscal conserva perfiles por empresa y ambiente; las nuevas emisiones
requieren habilitación comercial y preparación técnica, datos del emisor y
numeración. Los documentos y notas conservan su origen fiscal. La evidencia QA
del repositorio no acredita autorización de cuentas productivas. La web traduce
estas condiciones a lenguaje de negocio, sin exponer claves, tablas, API ni
procedimientos internos.

Las funciones se presentan sujetas a plan y permisos, sin afirmar que cada
reporte o traslado esté incluido en cualquier plan. Los enlaces a Profesional y
Profesional FE conservan los códigos del registro. No se fijan nuevos precios,
cuotas, capacidades ilimitadas, operación offline, métricas, testimonios ni
certificaciones. La orientación tributaria individual queda fuera del contenido.

## Política de indexación para integrar

1. Añadir `/soluciones/` y las cuatro rutas a `PUBLIC_PATHS` cuando el layout y
   la publicación estén listos. Actualmente la lista de `src/lib/seo.ts` solo
   contiene tres rutas; este archivo se deja intacto por instrucción expresa.
2. El layout debe resolver título, descripción, un H1, idioma, canonical, robots
   y migas. Las rutas pasan contenido por el slot y usan las clases globales del
   contrato. No fuerzan `noindex={false}` ni implementan otra política de robots.
3. Producción autorizada: canonical absoluto a la URL final y sitemap solo con
   URLs públicas preferidas. Conservar cuenta, pago, verificación y recuperación
   fuera del sitemap, con `noindex` y sin canonical hacia la portada.
4. Desarrollo o preview públicos: `noindex` mediante meta o `X-Robots-Tag`.
   Para contenido privado, restringir acceso es la protección real. Un canonical
   al dominio productivo no impide indexar una preview.
5. Usar una señal explícita de publicación, desactivada por defecto, además del
   modo de Astro: `import.meta.env.PROD` también es verdadero en un build que
   después se despliega como staging. En salida estática, una variable modificada
   después del build no cambia el HTML ya generado; usar builds separados o una
   cabecera del hosting para previews del mismo artefacto.
6. No combinar `Disallow` con la expectativa de que el robot lea `noindex`.
   `robots.txt` regula rastreo y no sustituye autenticación. Tampoco usar
   `noindex` para elegir entre duplicados públicos: para eso son las señales de
   canonical y redirección.

Fuentes: [Google noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing),
[canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
[Astro variables de entorno](https://docs.astro.build/en/guides/environment-variables/).

## Datos estructurados y preguntas frecuentes

- Conservar `Organization` y `SoftwareApplication` descriptivos y coherentes
  con el contenido visible. No añadir domicilio, razón social, reseñas,
  puntuaciones o certificaciones sin evidencia.
- Google exige rating o review además de nombre y oferta para la elegibilidad
  del resultado enriquecido de software. Su ausencia no justifica inventarlos;
  distinguir descripción semántica de elegibilidad para ese resultado.
- **Actualización vigente:** Google dejó de mostrar resultados enriquecidos FAQ
  desde el **7 de mayo de 2026** y retiró su documentación el **15 de junio de
  2026**. La antigua restricción a salud/gobierno ya no describe la situación
  actual. No se añade `FAQPage` como tarea para obtener ese resultado.
- Las dudas visibles de estas páginas están escritas para ayudar al comprador.
  No necesitan JSON-LD de FAQ. No se promete un efecto especial en respuestas IA.
- Si el layout incorpora `BreadcrumbList`, debe reflejar sus migas visibles y
  URLs publicables; evitar un segundo bloque paralelo en las rutas.
- Validar datos estructurados tras integrar; una prueba sintáctica no equivale
  a elegibilidad ni garantiza su aparición en búsqueda.

Fuentes: [SoftwareApplication](https://developers.google.com/search/docs/appearance/structured-data/software-app),
[Organization](https://developers.google.com/search/docs/appearance/structured-data/organization),
[registro oficial de cambios de Google](https://developers.google.com/search/updates#june-2026).

## Search Console, Bing y Perfil de Empresa

**Search Console:** recomendar una propiedad de dominio `cripton.com.co` y
verificación mediante DNS por su responsable; una propiedad de prefijo URL tiene
alternativas como archivo HTML o metaetiqueta y cubre ese prefijo. No se puede
acreditar propiedad desde el código local. Después de publicar, enviar
`https://cripton.com.co/sitemap.xml`, inspeccionar portada y soluciones, revisar
canonical elegido, indexación y recursos. La ausencia de meta de verificación
no prueba que no exista una propiedad verificada por DNS.

Medir consultas, páginas, clics, impresiones y CTR, diferenciando búsquedas de
marca y otras consultas. Revisar por país y dispositivo cuando haya volumen.
Search Console no mide la venta ni el mensaje enviado por WhatsApp. No solicitar
indexación de cuenta, pagos ni URLs con tokens. El envío del sitemap no asegura
indexación ni ranking.

**Bing:** verificar la propiedad y enviar el sitemap con el responsable. El
sitemap existente ya sirve de base. IndexNow es opcional para avisos de nuevas
URLs, cambios y bajas a motores participantes; preparar su integración es
posible sin una cuenta de analítica, pero publicar la clave y enviar avisos
requiere un sitio accesible y autorización de publicación. No lo presentar como
un mecanismo para forzar indexación ni como envío a Google.

**Google Business Profile:** Google excluye a negocios que operan únicamente en
Internet. No dar por elegible a Cripton por vender SaaS en Colombia ni inventar
sede o área de servicio. Solo evaluar el perfil si se acredita atención
presencial real y se cumplen las demás reglas aplicables. Esto no impide usar
Search Console para el sitio.

Fuentes: [verificar propiedad](https://support.google.com/webmasters/answer/9008080),
[Search Console](https://developers.google.com/search/docs/monitor-debug/search-console-start),
[Bing sitemaps](https://blogs.bing.com/webmaster/2025/7/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search/),
[Bing IndexNow](https://www.bing.com/indexnow/getstarted),
[elegibilidad de Perfil de Empresa](https://support.google.com/business/answer/13763036?hl=es).

## Prioridades de implementación y medición

**Sin cuentas externas:** integrar layout, cinco rutas y enlaces desde la
portada; aplicar política de ambientes; corregir ahorros y revisar la información
comercial; mejorar contraste y movimiento reducido; completar planes de contacto,
legales y alternativa del formulario; validar HTML, enlaces y contenido. Los
textos ya entregados no dependen de servicios externos para renderizarse.

**Preparables localmente, con conexión posterior:** definir eventos
`solution_view`, `demo_cta_click`, `plan_cta_click`, `whatsapp_open_attempt` y
`signup_completed`, con campos permitidos como slug, código de plan y ubicación
del CTA. El último solo tras una respuesta de registro confirmada; no equivale a
pago ni activación. No enviar nombres, correos, teléfonos, mensajes, tokens,
IDs de checkout ni URL completa con query. Para medir pago/activación se necesita
una fuente del servidor que confirme ese hecho; no inferirlo desde una visita.
Sin colector no hay analítica persistente ni atribución multisesión.

**Requieren cuenta o acceso del responsable:** DNS, publicación, verificación
Search Console/Bing y conexión del destino de analítica acordado. Cualquier
revisión de consentimiento debe ajustarse a la medición que realmente se elija;
esta investigación no es un dictamen legal.

**Rendimiento y accesibilidad:** conservar la imagen responsiva WebP y su
prioridad del hero; no declarar que falta optimización de imágenes. Medir antes
de cambiarla. Objetivos de experiencia: LCP ≤ 2,5 s, INP ≤ 200 ms y CLS ≤ 0,1
al percentil 75, distinguiendo móvil y escritorio. Las pruebas de laboratorio
ayudan a diagnosticar, pero no sustituyen datos de campo. Revisar teclado,
foco visible, reflujo, zoom, contraste y lector de pantalla tras integrar el
layout, sin afirmar accesibilidad completa por una puntuación automática.

Fuentes: [web.dev métricas](https://web.dev/articles/vitals),
[contraste](https://web.dev/learn/accessibility/color-contrast),
[foco](https://web.dev/learn/accessibility/focus),
[formularios y JS](https://web.dev/learn/forms/javascript),
[Astro imágenes y public](https://docs.astro.build/en/guides/images/).

## Verificación y pendientes de integración

- Contenido contrastado con módulos y rutas reales, no con supuestos de otros POS.
- Modelo TS con slugs, secciones, requisitos, límites, preguntas y CTA tipados.
- `getStaticPaths` genera exclusivamente las cuatro soluciones autorizadas.
- Los templates usan el contrato de `EditorialLayout`; no duplican H1 ni metadatos.
- No se ejecuta un build que genere archivos ajenos al alcance ni se modifica
  un layout temporal para simular la integración. La validación aislada y sus
  resultados se registran abajo después de ejecutarla.
- Integrador: verificar que `EditorialLayout` no duplique la marca del título,
  añadir las cinco URLs a la política editorial y al sitemap, enlazar desde
  portada y ejecutar check/build más revisión de las cinco páginas renderizadas.
- Confirmar URLs con barra final, código HTTP, canonical, robots, migas, único H1,
  navegación por teclado y CTA en móvil/escritorio. No basta compilar para dar
  por validado el recorrido de usuario ni la indexación.

Guías oficiales consultadas para la implementación:
[routing/getStaticPaths](https://docs.astro.build/en/guides/routing/),
[componentes y slots](https://docs.astro.build/en/basics/astro-components/),
[estilos](https://docs.astro.build/en/guides/styling/),
[contenido útil de Google](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

Estas recomendaciones facilitan contenido útil, descubrimiento y evaluación del
producto. No prometen posiciones, tráfico, leads ni resultados enriquecidos.

### Resultado de la validación aislada

Ejecutada el 2026-10-26 con Node 24.19.0 y las dependencias ya instaladas:

- TypeScript con `strict` y `noEmit` sobre `solutions.ts`: **0 diagnósticos**.
- Compilador `@astrojs/compiler-rs` instalado con Astro 7: transformación en
  memoria de ambas plantillas `.astro`, **0 diagnósticos en cada una**.
- Comprobaciones en memoria aprobadas: cuatro slugs exactos; títulos,
  descripciones, H1 y leads distintos; secciones, requisitos, límites y preguntas
  presentes; referencias cruzadas válidas; CTA Profesional/Profesional FE
  correspondientes. No se escribieron scripts de prueba ni artefactos.
- `git diff --check`: sin incidencias en cambios tracked. Los cuatro archivos
  nuevos se revisaron además directamente; no se añadieron al índice.
- `EditorialLayout.astro` **todavía no está presente** al validar. La compilación
  aislada no resuelve ni certifica ese layout, su estilo, metadatos ni el build
  completo. No se ejecutó navegador ni se acreditan revisión visual o indexación.
- Se usó el compilador real de Astro 7 después de comprobar que el antiguo
  import directo `@astrojs/compiler` no estaba expuesto en este worktree.
  No se instaló ni actualizó ninguna dependencia.

Comprobación de coordinación en `pos_saas`: `npm run sync:check` consultó el
remoto y declaró la base alineada, sin commits entrantes. Se leyó el registro
transversal y se mantuvo ese repositorio en modo lectura para contrastar funciones.
Los cambios de otros worktrees no se incorporaron ni se certificaron.
