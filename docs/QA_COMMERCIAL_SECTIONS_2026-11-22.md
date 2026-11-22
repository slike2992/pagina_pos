# Secciones comerciales de la web · 2026-11-22

Alcance: contenido y navegación de portada, ventas/caja e inventario. Base
`a6a70b1` de `codex/pagina-pos-landing`; revisión aislada en
`codex/web-commercial-sections-20261122` para conservar los cambios abiertos de
`Brand.astro` y `/pago/demo`. No cambia registro, cuenta, pagos, precios, legales,
POS, API, permisos, bases ni despliegues.

## Ajustes

- Caja: usuario propio, caja asignada, apertura/cierre e historial de movimientos.
- Ventas: productos, cantidades, medios de pago, comprobantes y reimpresión;
  FE requiere el plan correspondiente y habilitar el emisor.
- Inventario: productos/categorías/códigos/precios/impuestos, entradas/salidas,
  kardex, ajustes justificados y compras/proveedores. Se mantienen requisitos,
  condiciones y explicación de confirmación de compras.
- Los dos «Conocer el flujo» llegan a `#usuarios-y-permisos` y
  `#operacion-multisede` dentro de ventas/caja, con explicaciones específicas.
- Kardex: copia intacta de la captura `04_kardex_movimientos.jpg` de la galería
  Papelería Aurora QA, con datos ficticios. Astro genera AVIF/WebP responsivos;
  el enlace de ampliación conserva la imagen original de 1280 × 720.
- Portada: accesos a WhatsApp comercial, pagos del plan en Mi cuenta y soporte
  por correo. El propietario confirmó +57 321 959 7077; se usa como valor
  público predeterminado y puede reemplazarse mediante la variable existente
  `PUBLIC_WHATSAPP_NUMBER`. Botón directo y formulario usan el mismo destino.

## Evidencia

- Astro check: 57 archivos, cero errores, advertencias o hints; build aprobado.
- Suite existente: 265/265 pruebas aprobadas. La auditoría de navegación ahora
  verifica también la existencia de las imágenes enlazadas bajo `/_astro/`;
  no las trata como rutas HTML. Conserva los controles de rutas y fragmentos.
- Codex: clics desde portada hacia ambas explicaciones; navegación a Mi cuenta
  desde Wompi; soporte inspeccionado como `mailto:` sin enviar mensajes.
- El clic de WhatsApp abrió su página oficial «Chatea en WhatsApp con el
  +57 321 9597077». El formulario conserva ese mismo destinatario. Captura 06;
  no se abrió una conversación ni se envió un mensaje.
- Revisiones a 1118 px y 390 px: sin desbordamiento horizontal; botones móviles
  con altura superior a 48 px y dentro del ancho de pantalla. Destinos de las
  anclas visibles bajo el encabezado fijo tras terminar el desplazamiento.
- Kardex cargado en ambas vistas y ampliación abierta: imagen de 1280 × 720
  cargada. Capturas y mediciones en `docs/evidence/commercial-sections-2026-11-22`.

La validación es local en `http://127.0.0.1:4325/`. No acredita publicación en
staging/producción, envío por correo o WhatsApp, ni un pago nuevo de Wompi.
El destino de WhatsApp se comprueba sin enviar conversaciones ni datos de
formularios. La prueba no confirma tiempos de respuesta ni atención del canal.

## Ajuste posterior: WhatsApp flotante

- `FloatingWhatsApp.astro` se monta una vez desde el pie compartido. Se retira
  el botón duplicado de la fila de portada; pagos y soporte conservan sus enlaces.
- Botón circular de 58 × 58 px con el símbolo SVG local de WhatsApp; posición
  fija a 20 px del borde derecho e inferior, más el área segura del dispositivo.
  Nombre accesible, foco visible, apertura en otra pestaña y `noopener noreferrer`.
- `src/content/contact.ts` concentra el destino confirmado del botón y formulario.
  El botón queda debajo del panel de consentimiento y el pie reserva 100 px
  inferiores para que su último texto no quede debajo del control.
- Codex: revisados desplazamiento y cambio de página, escritorio y 390 px;
  un solo botón, SVG presente y sin desbordamiento. En el final móvil el texto
  del pie termina por encima del botón. Capturas 08–10 y `floating-checks.json`.
- La revisión local conservaba el CSS antiguo del pie en la caché de Astro;
  se reinició únicamente el daemon aislado 4325 y se comprobó el padding efectivo
  de 100 px. No se reiniciaron servicios del POS.
- El propietario confirmó que su número aún usa WhatsApp normal. La identidad
  comercial de la página de destino no se configura con código de la web:
  queda pendiente pasar/configurar el perfil Cripton en WhatsApp Business desde
  el celular, con nombre, logo y foto visible para Todos. Referencias oficiales:
  [perfil de empresa](https://faq.whatsapp.com/665179381840568/) y
  [enlaces cortos y foto pública](https://faq.whatsapp.com/502291734918768/).
