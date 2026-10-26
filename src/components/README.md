# Componentes compartidos

`Brand.astro` mantiene el sistema de marca aprobado y sus proporciones. No se
redibuja la marca desde las páginas ni se sustituye trabajo de otros worktrees.

`SiteHeader.astro` y `SiteFooter.astro` centralizan navegación, canales y enlaces
de condiciones. El menú móvil utiliza `details/summary`, cierra al navegar,
al pulsar Escape y al clicar fuera. Escape devuelve el foco al control.

`SeoHead.astro` define una sola instancia de título, descripción y robots.
La allowlist de `src/lib/seo.ts` controla canonical y datos sociales. Un flujo
privado nunca recibe canonical, URL social ni token derivado de la petición.
La indexación pública exige build de producción y señal explícita. La portada
puede recibir la verificación pública de Search Console por configuración.

`ConsentPanel.astro` solo presenta preferencias si hay ID GA4 válido, revisión explícita, build productivo público y la ruta
es editorial. Sin configuración no se carga un proveedor ni se muestra un aviso
vacío. Su código cliente no inicializa nada si no existe el panel. El navegador exige además el origen canónico HTTPS y ausencia de query. Google se
carga después de aceptar, con publicidad desactivada; rechazo/revocación y
señales de privacidad suspenden la medición. El helper permite únicamente
categorías fijas, ubicación comercial y códigos de plan reconocidos.

No enviar texto de formularios, email, teléfono, tokens, importes o IDs de tenant
a la analítica. Antes de conectar una propiedad real, revisar sus ajustes de
medición mejorada, retención, filtros internos y proveedores, y comprobar las
solicitudes reales en el navegador. No confundir un clic con un pago o un lead
recibido. Véase el plan y las pruebas de consentimiento.

Los estilos de componentes son locales. `base.css` contiene tokens y utilidades
editoriales; `landing.css` reúne la portada con la paleta vigente. No añadir
capas de sobrescritura por cada página.
