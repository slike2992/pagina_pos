# Calidad de la web — 2026-10-26

## Objetivo y alcance

Mejorar la web para tiendas, papelerías y comercios especializados: comparar
planes e iniciar registro como recorrido principal; demostración y
ventas@cripton.com.co como alternativa. Trabajo limitado a `pagina_pos`.
No cambia POS, API, worker, bases, cobros, condiciones aceptadas o identidad de marca.

## Implementado

- Portada dirigida al comercio minorista; enlaces de módulos con nombres
  accesibles distinguibles y nombres de planes como encabezados de tarjeta.
- Misma fotografía con AVIF responsivo y fallback WebP. Carga prioritaria,
  dimensiones y selección por ancho conservadas; sin nuevas fuentes externas.
- Validación compartida de contacto y registro: mensajes españoles junto al campo,
  `aria-invalid`, descripciones relacionadas y foco en el primer error. Identifica
  campos obligatorios/opcionales y valores compuestos sólo por espacios.
- El helper no envía datos ni altera el payload. Registro conserva catálogo legal,
  aceptación e idempotencia y bloquea envíos mientras las condiciones no estén listas.
- Contacto mantiene el mensaje sólo en memoria, requiere revisión/apertura y envío
  voluntario en el canal. Editarlo retira la preparación anterior y actualiza el aviso.
- Token único de borde de campos, errores compartidos, foco contrastado dentro del
  formulario blanco, enlaces táctiles más amplios y menú móvil desplazable.

## Evidencia reproducible

Node 24.19: `npm run build:public` ejecuta tipos, build, 29 pruebas y presupuestos
de recursos. El artefacto genera 20 HTML: 12 páginas editoriales y 8 recorridos
privados; los borradores legales no forman parte del release público.

Las 29 pruebas incluyen restricciones reales del helper y transporte simulado:
correo, espacios, longitudes, checkbox obligatorio, condiciones no disponibles,
envío duplicado, idempotencia y conservación de descripciones ARIA. También
comprueban metadatos, enlaces, precios, artículos jurídicos y consentimiento.
Son pruebas de código; no equivalen a crear una cuenta, cobrar o recibir correo.

Navegador Codex sobre build aislado en 4324: 12 rutas por 320, 768, 1024 y
1440 píxeles (48 casos), sin desbordamiento horizontal, una H1/un main y sin
imágenes visibles rotas ni barra Astro. Inspección visual adicional en 393x852.
Contacto: campo vacío y espacios fallan; corregir elimina el error; preparar
muestra el canal de correo sin URL personal en atributos; editar lo invalida.
Menú: apertura/cierre repetidos, Escape con foco al summary, enlace de navegación
y tamaño 320x480. Tarjeta: borde hover de 2 px sin cambiar tamaño del contenedor.

La comprobación de los seis accesos al registro en el origen habitual se registra
al integrar; 4324 no se añade a CORS para facilitar una prueba.

## Peso del build: antes y después

Base: `ce85b72`. Comparación de los mismos anchos y fotografía:

| Recurso | Antes | Después | Reducción |
| --- | ---: | ---: | ---: |
| Hero 768 px | 36.768 B WebP | 19.695 B AVIF | 46,4 % |
| Hero 1280 px | 68.146 B WebP | 37.831 B AVIF | 44,5 % |
| Hero máximo 1672 px | 94.248 B WebP | 53.527 B AVIF | 43,2 % |

El navegador confirmó seleccionar AVIF. La variante WebP original sigue disponible
si no soporta AVIF. No se atribuye esta reducción al archivo fuente de 1,8 MB:
la versión anterior ya servía WebP optimizado.

`npm run audit:performance` mide el artefacto, no una red ni una experiencia real:
HTML gzip <=16 KiB, CSS vinculado gzip <=12 KiB, JavaScript ejecutable inicial
<=24 KiB y cada variante AVIF <=80 KiB. Sus presupuestos fallan si se superan.
No son puntuaciones Lighthouse ni LCP/INP/CLS de campo. El navegador de esta sesión
no expone Performance API a su evaluador; no se inventaron tiempos ni puntuaciones.
El hosting, caché, red y equipos reales requieren medición tras el despliegue.

## Límites y siguientes pasos externos

- Acreditar rendimiento de campo, indexación y conversiones con el sitio publicado.
- Configurar y revisar propiedad de analítica/Search Console antes de activarlas.
- Confirmar identidad y condiciones comerciales para adoptar propuestas legales.
- No se crearon cuentas ni se aceptaron términos, simularon pagos o enviaron mensajes
  en esta validación de frontend.

No es una certificación integral WCAG: se revisaron los recorridos descritos,
contraste y teclado; falta evaluación con lectores de pantalla y dispositivos reales.

## Fuentes de criterio

- [W3C: notificaciones de formularios](https://www.w3.org/WAI/tutorials/forms/notifications/).
- [W3C: identificación de errores](https://www.w3.org/WAI/WCAG22/Understanding/error-identification).
- [Astro: imágenes y Picture](https://docs.astro.build/en/reference/modules/astro-assets/).
- [Google: Largest Contentful Paint](https://web.dev/articles/lcp).
