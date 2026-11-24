# Tarjetas compactas de planes — 2026-11-23

Estado actual: publicadas y comprobadas en
`https://staging.cripton.com.co/#planes`. La sección final registra la publicación;
la evidencia local se conserva como validación anterior al despliegue.

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
La evidencia de esa carpeta corresponde a la vista local anterior al despliegue.
POS, Control, API, pagos, registro y los archivos de marca ajenos no se modifican.

## Publicación exclusiva en staging

- Activación: **2026-11-23 22:50:47, America/Bogota**. Fuente versionada
  `defea13851ab599ba1bc8ed9697b1bea7d9acf13`; release estático
  `/opt/cripton/web-staging/releases/defea13851ab`.
- Compilación desde el worktree sin cambios de código pendientes, con API/POS
  de staging, analítica desactivada, sin borradores y sin indexación. Astro
  check/build y las 265 pruebas de la web aprobados antes de empaquetar.
- Verificación canónica de los 74 archivos y sus SHA-256 en la VM. Registro
  de la fuente versionada en la automatización existente de recuperación antes
  de activar el enlace `current` mediante rename atómico y bloqueos de publicación.
- HTTPS 200 y contenido idéntico al manifiesto en portada, ventas/caja,
  inventario, cuenta y registro. Además, todos los HTML distintos de la portada
  conservan exactamente sus bytes respecto de la publicación anterior.
- Runtime SaaS `96821a28e90d`, PIDs y tiempos de inicio de API/worker/POS/edge
  idénticos antes y después. Control conserva el mismo runtime y configuración.
  Sin reinicios de servicios remotos, migraciones, cambios de datos, DNS o TLS.
- Navegador de Codex en el dominio: apertura de los seis desplegables, cierre
  con Enter, anualidades y enlaces correctos; seis botones con texto genérico.
  Dos rótulos «Más vendida», 18 iconos de capacidades y vista móvil de 390 px
  sin desbordamiento. Ventana restaurada y tarjetas cerradas al terminar.
  No se observaron errores de consola. No se crearon cuentas ni pagos.
- Evidencia pública sanitizada: `evidence/staging-plans-2026-11-23/` contiene
  `deployment.json`, `browser.json` y `plans.jpg`. El recibo completo del
  operador permanece en la VM; no se publican secretos ni configuración privada.

Reversión: se conserva `/opt/cripton/web-staging/releases/b597b2b591e8`.
Usar los mismos bloqueos de publicación para devolver sólo el enlace
`/opt/cripton/web-staging/current` a ese release, sin restaurar bases ni
reiniciar POS o administrador.
