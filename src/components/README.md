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

`ConsentPanel.astro` presenta un aviso informativo y preferencias en todas las
rutas editoriales, también en desarrollo y staging. Sin analítica configurada
explica que solo se usa almacenamiento necesario y no ofrece una aceptación
ficticia. El pie permite reabrir el mismo panel. Las rutas privadas conservan
únicamente sus enlaces informativos, sin cargar el panel ni la analítica.
Para ofrecer GA4 se exigen ID válido, revisión explícita, build productivo público
y ruta editorial. El navegador exige además el origen canónico HTTPS y ausencia
de query. La preferencia v2 guarda fecha, vencimiento, versión de aviso y alcance
del proveedor; decisiones antiguas o de otro alcance no activan un nuevo servicio.
Google se
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

`FloatingWhatsApp.astro` se monta una sola vez junto al pie compartido. Su SVG
es local y el destinatario se comparte con el formulario mediante
`src/content/contact.ts`. El enlace no envía mensajes automáticamente ni cambia
el nombre o la foto del perfil de WhatsApp.

`PlanCard.astro` presenta las seis ofertas existentes de la portada con una
vista compacta. Usuarios, sucursales, inventario y límites electrónicos siguen
visibles; cajas, funciones adicionales y precio anual se consultan en un
`details/summary` nativo, sin JavaScript. El registro conserva el código de cada
plan. El botón visible dice «Probar gratis 15 días»; su nombre accesible identifica
la oferta. Profesional tiene el énfasis y el rótulo comercial solicitado por el
propietario, «Más vendida», sin añadir cifras, reseñas ni datos estructurados de
popularidad. Precios y capacidades proceden del catálogo existente de la portada.
