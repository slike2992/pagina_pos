# Tarjetas compactas de planes — 2026-11-23

Alcance: exclusivamente la sección de planes de la portada comercial y sus
estilos. Se reutiliza un único componente para las dos modalidades existentes.

- Seis tarjetas conservan códigos, precios mensuales/anuales, ahorro, capacidades,
  funciones, enlaces al registro y condiciones de prueba. Sin nuevas ofertas.
- Usuarios, sucursales e inventario se muestran con SVG locales en azul petróleo;
  los límites electrónicos permanecen visibles antes de desplegar los detalles.
- Cajas, funciones adicionales y pago anual se consultan en un desplegable nativo.
  Abrir una tarjeta no estira las otras ni requiere JavaScript.
- Profesional y Profesional FE tienen fondo claro de marca, borde, sombra y
  rótulo «Más vendida», solicitado expresamente por el propietario. No se agregan
  estadísticas ni afirmaciones de popularidad a los datos estructurados.
- Sólo estas dos tarjetas muestran la acción de prueba en la vista inicial.
  Las demás la ofrecen al abrir sus detalles. Todos los botones visibles dicen
  «Probar gratis 15 días»; el nombre accesible identifica el plan correspondiente.
- Se mantiene el cambio a una columna por debajo de 1060 px. En móvil pequeño
  los iconos se sitúan sobre sus textos para evitar palabras cortadas.

Validación final:

- Astro check: 60 archivos, cero errores, advertencias o hints.
- Compilación estática: aprobada. Las 265 pruebas existentes de la web pasan,
  incluidos los seis planes, sus importes/ahorro, enlaces y condiciones de prueba.
- Navegador de Codex: abrir los seis desplegables con clic y cerrarlos con Enter,
  comprobar cajas/pago anual y que cada enlace conserve su código de plan.
- Vista inicial: seis tarjetas cerradas y sólo dos botones de prueba visibles.
  Los seis botones contienen el texto genérico solicitado.
- Escritorio de 1194 px y tamaños de 1024, 768, 390 y 320 px: seis tarjetas,
  sin desbordamiento horizontal de página o capacidades. La medición se tomó
  después de aplicar cada tamaño; se restableció la ventana original al terminar.
- La vista de revisión queda levantada en `http://127.0.0.1:4325/#planes`.

Mediciones y capturas: `evidence/plan-cards-2026-11-23/`. Se capturaron la vista
compacta de escritorio, la tarjeta en móvil y los detalles de Básico FE.
La evidencia corresponde a la vista local, no a un nuevo despliegue en staging.
POS, Control, API, pagos, registro y los archivos de marca ajenos no se modifican.
