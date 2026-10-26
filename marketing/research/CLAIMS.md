# Registro de afirmaciones comerciales

Fecha: 2026-10-26. Web fuente revisada: `645be14` de `codex/pagina-pos-landing`. SaaS: SHA exacto en `context-baseline.json`; leer `docs/CROSS_BRANCH_CHANGES.md` actualizado en el repositorio independiente. Estas fuentes no certifican despliegue productivo, rendimiento ni entrega de correo.

| ID | Afirmación utilizada | Fuente | Límite |
|---|---|---|---|
| C01 | Ventas, caja e inventario en Cripton POS | Web `src/pages/index.astro`; módulos existentes del POS y capturas | No afirma disponibilidad sin internet, carga ilimitada o todas las funciones de todos los planes |
| C02 | Consulta de stock por sucursal | Vista real `/inventarios/stock`; captura del navegador | Datos QA, no resultado de un cliente |
| C03 | Historial con documento, importe y estado | Vista real `/ventas_historial` | Se excluyó la columna con nombre del operador; no se publican sus datos |
| C04 | Módulo de caja con apertura, movimientos y cierre | Web y módulo `caja_turno`; captura real de controles de apertura | La captura muestra caja sin turno abierto, no una caja cerrada exitosamente por esta sesión |
| C05 | Catálogo con imagen, nombre, referencia y precio | Vista real `/inventarios/productos` | Productos QA e imágenes ya presentes en el entorno; no catálogo comercial del cliente |
| C06 | Solicitar demostración | CTA web y decisión editorial | No garantiza horario, disponibilidad inmediata o demo gratuita ilimitada |
| C07 | Oferta con/sin FE y requisitos | Web y plan SaaS transversal | No acredita emisión productiva, cuenta Factus activa por cliente ni compra que active FE automáticamente |
| C08 | Kardex con entradas, salidas y saldo | Vista real `/inventarios/kardex` | Dos movimientos QA; no una auditoría fiscal o contable |
| C09 | Usuarios y permisos según plan | Web y código/módulos documentados del POS | No exhibe usuarios reales ni promete un número no cotejado con el catálogo activo |
| C10 | Comparar usuarios, cajas, referencias y FE | Catálogo y guía web | Es criterio de evaluación, no consejo fiscal ni catálogo operativo confirmado |
| C11 | Consulta de existencias y movimientos | Capturas stock y kardex | No promete actualización de integraciones externas en tiempo real |
| C12 | Conversación sobre operación | Plan editorial | Sin garantía de resultados o fechas de implementación |

## Importes y límites pendientes de promoción

La web publica grupos con/sin FE y precios mensuales/anuales. El código histórico del catálogo SaaS tiene migraciones posteriores y condiciones que deben contrastarse con la respuesta activa antes de promocionar un importe. Por eso esta campaña no fija precios, descuentos, ahorros ni cantidades de usuarios/ítems en las piezas. No usar los gráficos antiguos como evidencia. Si se decide una pieza de precio, cotejar catálogo activo, web, periodicidad, impuestos, cupos y fecha, y conservar la revisión.

## Afirmaciones excluidas

Bre-B/QR automático, pagos productivos disponibles, entrega de correo externa certificada, «100% seguro», «sin errores», «siempre disponible», «el mejor», ahorro porcentual, clientes/testimonios/premios, cumplimiento DIAN automático, módulos IA/cripto, gráficas Mock como reportes operativos y operación completa sin internet. No usar logos de proveedores como certificación o alianza.

Los videos usan capturas estáticas reales y textos; no presentan una animación de tarjetas como si fuera una grabación de interacción. Mantener la leyenda de demostración en las piezas que contienen datos.
