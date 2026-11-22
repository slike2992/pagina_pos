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
