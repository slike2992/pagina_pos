# Recuperación del checkout de staging

El recorrido real Azure llegó desde registro y verificación Gmail hasta un pago
Wompi Sandbox aprobado, correo de clave y entrada SSO al POS. Al volver desde
otra pestaña se perdió el contexto porque el retorno sólo traía el ID de Wompi.

Cambios acotados al flujo: checkoutSessionId en el retorno, validación del destino
y compatibilidad con URLs históricas; reapertura mediante el mismo token y el
endpoint read-only resume-checkout de la API; guía de clave por correo fuera de
DEV. No se modifica marca, estructura comercial, precios ni campos financieros.

La marca local de verificación no autoriza nada: cada ejecución consulta al
servidor. Un token consumido sólo recupera una compra pendiente y vigente. No se
reproduce el payload idempotente de una compra fulfilled o expired. El
almacenamiento del navegador es opcional y no constituye fuente de verdad.

Validación local: nueve pruebas nuevas del controlador real con DOM/HTTP
simulados, incluyendo caché antigua, almacenamiento bloqueado y destinos
contradictorios; Astro check sin errores, advertencias ni hints. La API tiene
pruebas propias de posesión, identidad, vigencia, unicidad y pagos finales.
Esto no sustituye la repetición de navegador después de desplegar.

Orden de publicación: API SaaS y allowlist POST/OPTIONS primero, web después.
No habilitar /v1/development ni /v1/platform en el proxy público.
El informe de extremo a extremo se conserva en el repositorio pos_saas:
docs/QA_AZURE_SIGNUP_WOMPI_2026-11-09.md.

Segunda aceptación real: reabrir el correo en otra pestaña recuperó el mismo
enlace y SQL confirmó una orden/un checkout sin renovar vencimiento. Después
Wompi aprobó otro pago Sandbox autorizado y volvió con ambos identificadores.
Una consulta transitoria falló y el botón manual recuperó fulfilled; se añaden
reintentos automáticos sobre esa misma compra para red,429 y5xx, hasta10intentos
cada3segundos. Errores4xx definitivos no se repiten automáticamente. Agotar el
presupuesto mantiene consulta manual; no activa empresas ni expone clave sin
confirmación del servidor. Se evita concurrencia y se cancelan consultas futuras
al salir de la página. Pruebas con reloj controlado no equivalen a provocar
una interrupción real de red del navegador.
